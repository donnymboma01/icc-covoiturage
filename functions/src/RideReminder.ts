import { Resend } from "resend";

const APP_URL = "https://covoiturage.impactcentrechretien.eu";
const FROM_EMAIL = "ICC Covoiturage <no-reply@impactcentrechretien.eu>";

interface RideReminderData {
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Date;
  driverName: string;
  driverEmail: string;
  passengerName: string;
  passengerEmail: string;
  seatsBooked: number;
  price?: number;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " à " + date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price?: number): string {
  if (!price || price === 0) return "Gratuit";
  return `${price}€`;
}

function generateReminderEmailHtml(
  recipientName: string,
  otherPartyName: string,
  isDriver: boolean,
  data: RideReminderData
): string {

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de trajet</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <tr>
      <td style="background-color: #2c3e50; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">ICC Covoiturage</h1>
        <p style="color: #bdc3c7; margin: 8px 0 0; font-size: 14px;">Votre trajet commence ici !</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
          Rappel : Votre trajet est demain !
        </h2>
        
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
          Bonjour ${recipientName},
        </p>
        
        <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
          Petit rappel : votre trajet avec <strong>${otherPartyName}</strong> est prévu pour <strong>demain</strong> !
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin: 0 0 16px; font-size: 16px;">Détails du trajet</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                <strong>Départ:</strong>
              </td>
              <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                ${data.departureAddress}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                <strong>Arrivée:</strong>
              </td>
              <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                ${data.arrivalAddress}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                <strong>Date:</strong>
              </td>
              <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                ${formatDateTime(data.departureTime)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                <strong>Places:</strong>
              </td>
              <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                ${data.seatsBooked} place${data.seatsBooked > 1 ? "s" : ""}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                <strong>Prix:</strong>
              </td>
              <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                ${formatPrice(data.price)}
              </td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #004085; margin: 0; font-size: 14px;">
            ${isDriver
              ? `N'oubliez pas de contacter votre passager pour confirmer les détails du rendez-vous.`
              : `N'oubliez pas de contacter votre conducteur pour confirmer le point de rendez-vous exact.`
            }
          </p>
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
          <tr>
            <td align="center">
              <a href="${APP_URL}/messages" 
                 style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Ouvrir la messagerie
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
          Que Dieu vous bénisse !
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

export async function sendRideReminderEmail(
  data: RideReminderData,
  resendApiKey: string
): Promise<{ driverSent: boolean; passengerSent: boolean; errors: string[] }> {
  const resend = new Resend(resendApiKey);
  const errors: string[] = [];
  let driverSent = false;
  let passengerSent = false;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.driverEmail],
      subject: "Rappel : Votre trajet est demain !",
      html: generateReminderEmailHtml(
        data.driverName,
        data.passengerName,
        true,
        data
      ),
    });

    if (error) {
      errors.push(`Driver: ${error.message}`);
    } else {
      driverSent = true;
    }
  } catch (err) {
    errors.push(`Driver: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.passengerEmail],
      subject: "Rappel : Votre trajet est demain !",
      html: generateReminderEmailHtml(
        data.passengerName,
        data.driverName,
        false,
        data
      ),
    });

    if (error) {
      errors.push(`Passenger: ${error.message}`);
    } else {
      passengerSent = true;
    }
  } catch (err) {
    errors.push(`Passenger: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  return { driverSent, passengerSent, errors };
}
