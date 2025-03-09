import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email, verificationCode } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email est requis" }, { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "ICC Covoiturage <no-reply@impactcentrechretien.eu>",
      to: [email],
      subject: "Vérification de votre compte conducteur",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto;">
   
            <tr>
              <td style="background-color: #2c3e50; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">ICC Covoiturage</h1>
                <p style="color: #bdc3c7; margin: 5px 0 0; font-size: 14px;">Votre trajet commence ici !</p>
              </td>
            </tr>
              
            <tr>
              <td style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 20px;">Vérification de votre compte</h2>
                <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">
                  Bienvenue chez ICC Covoiturage ! Pour activer votre compte conducteur, veuillez utiliser le code suivant :
                </p>
                
                <!-- Code Box -->
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 2px;">
                    ${verificationCode}
                  </span>
                </div>
                
                <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">
                  Ce code est valable pendant <strong>24 heures</strong>. Entrez-le dans l'application pour finaliser votre inscription.
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 20px; text-align: center;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © 2025 ICC Covoiturage. Tous droits réservés.<br>
                  Vous avez reçu cet email car vous vous êtes inscrit comme conducteur.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error sending email" }, { status: 500 });
  }
}
