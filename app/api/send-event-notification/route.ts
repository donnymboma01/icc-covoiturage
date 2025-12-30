import { Resend } from "resend";
import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APP_URL = "https://covoiturage.impactcentrechretien.eu";

interface EmailConfig {
  eventTitle: string;
  emailSubject: string;
  greeting: string;
  mainMessage: string;
  callToAction: string;
  buttonText: string;
}

type RecipientType = "drivers" | "passengers";

function getAdminFirestore() {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin credentials not configured");
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

export async function POST(request: Request) {
  try {
    const { adminId, config, recipientType } = await request.json() as {
      adminId: string;
      config: EmailConfig;
      recipientType: RecipientType;
    };

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!adminId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    if (!config || !config.eventTitle || !config.emailSubject || !config.mainMessage || !config.callToAction) {
      return NextResponse.json({ error: "Configuration de l'email incomplète" }, { status: 400 });
    }

    let db;
    try {
      db = getAdminFirestore();
    } catch {
      return NextResponse.json({ error: "Configuration Firebase Admin manquante." }, { status: 500 });
    }

    const adminDoc = await db.collection("users").doc(adminId).get();
    if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    let usersQuery;
    if (recipientType === "drivers") {
      usersQuery = db
        .collection("users")
        .where("isDriver", "==", true)
        .where("isVerified", "==", true);
    } else {
      usersQuery = db
        .collection("users")
        .where("isDriver", "==", false);
    }

    const usersSnapshot = await usersQuery.get();

    const users = usersSnapshot.docs.map((doc) => ({
      email: doc.data().email,
      fullName: doc.data().fullName || "Utilisateur",
    }));

    if (users.length === 0) {
      const recipientLabel = recipientType === "drivers" ? "conducteur vérifié" : "passager";
      return NextResponse.json({ message: `Aucun ${recipientLabel} trouvé`, sent: 0, failed: 0 }, { status: 200 });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      try {
        const { error } = await resend.emails.send({
          from: "ICC Covoiturage <no-reply@impactcentrechretien.eu>",
          to: [user.email],
          subject: config.emailSubject,
          html: generateEmailTemplate(user.fullName, config),
        });

        if (error) {
          failedCount++;
          failedEmails.push(user.email);
        } else {
          sentCount++;
        }
      } catch {
        failedCount++;
        failedEmails.push(user.email);
      }

      if (i < users.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    await db.collection("emailNotifications").add({
      type: "event_notification",
      recipientType,
      event: config.eventTitle,
      subject: config.emailSubject,
      sentBy: adminId,
      sentAt: new Date(),
      totalRecipients: users.length,
      sentCount,
      failedCount,
      failedEmails,
    });

    return NextResponse.json({
      message: "Envoi terminé",
      sent: sentCount,
      failed: failedCount,
      total: users.length,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi des notifications" }, { status: 500 });
  }
}

function generateEmailTemplate(fullName: string, config: EmailConfig): string {
  const mainMessageHtml = config.mainMessage.replace(/\n/g, '<br>');
  const callToActionHtml = config.callToAction.replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <tr>
      <td style="background-color: #2c3e50; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">ICC Covoiturage</h1>
        <p style="color: #bdc3c7; margin: 8px 0 0; font-size: 14px;">${config.eventTitle}</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px; font-weight: 600;">
          ${config.greeting} ${fullName} !
        </h2>
        
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 20px; font-size: 16px;">
          ${mainMessageHtml}
        </p>
        
        <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #5d4037; margin: 0; font-size: 15px; line-height: 1.6;">
            ${callToActionHtml}
          </p>
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <a href="${APP_URL}" 
                 style="display: inline-block; background-color: #2c3e50; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${config.buttonText}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 0 24px;">
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;" />
      </td>
    </tr>
    
    <tr>
      <td style="padding: 24px; text-align: center;">
        <p style="color: #888888; font-size: 14px; margin: 0 0 8px; line-height: 1.5;">
          Que Dieu vous bénisse abondamment !
        </p>
        <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
          ICC Covoiturage - Impact Centre Chrétien
        </p>
        <p style="color: #aaaaaa; font-size: 11px; margin: 12px 0 0;">
          <a href="${APP_URL}" style="color: #2c3e50; text-decoration: none;">covoiturage.impactcentrechretien.eu</a>
        </p>
      </td>
    </tr>
    
  </table>
</body>
</html>
  `;
}
