import { Resend } from "resend";

const APP_URL = "https://covoiturage.impactcentrechretien.eu";
const FROM_EMAIL = "ICC Covoiturage <iccdev@impactcentrechretien.eu>";

export interface BookingEmailData {
  bookingId: string;
  rideId: string;
  seatsBooked: number;
  departureAddress: string;
  arrivalAddress: string;
  departureTime: Date;
  price?: number;
  driverName: string;
  driverEmail: string;
  passengerName: string;
  passengerEmail: string;
  cancellationReason?: string;
}

export type BookingEmailType = 
  | "new_booking"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_cancelled_by_passenger"
  | "booking_cancelled_by_driver"
  | "ride_cancelled"
  | "ride_reminder";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY non configurée");
  }
  return new Resend(apiKey);
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

function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
        ${content}
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

function rideInfoBlock(data: BookingEmailData): string {
  return `
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
  `;
}

function actionButton(text: string, url: string, color: string = "#2c3e50"): string {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" 
             style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function newBookingTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Nouvelle demande de réservation !
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.driverName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      <strong>${data.passengerName}</strong> souhaite réserver ${data.seatsBooked} place${data.seatsBooked > 1 ? "s" : ""} pour votre trajet.
    </p>
    
    ${rideInfoBlock(data)}
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        Veuillez accepter ou refuser cette demande depuis l'application.
      </p>
    </div>
    
    ${actionButton("Voir la demande", `${APP_URL}/dashboard/bookings`)}
  `;
  
  return baseTemplate(content, "Nouvelle réservation");
}

function bookingAcceptedTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Réservation confirmée !
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.passengerName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonne nouvelle ! <strong>${data.driverName}</strong> a accepté votre demande de réservation.
    </p>
    
    ${rideInfoBlock(data)}
    
    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #155724; margin: 0; font-size: 14px;">
        Vous pouvez maintenant contacter votre conducteur via la messagerie de l'application pour organiser les détails du trajet.
      </p>
    </div>
    
    ${actionButton("Contacter le conducteur", `${APP_URL}/messages`, "#28a745")}
  `;
  
  return baseTemplate(content, "Réservation confirmée");
}

function bookingRejectedTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Réservation non acceptée
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.passengerName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Malheureusement, <strong>${data.driverName}</strong> n'a pas pu accepter votre demande de réservation pour le trajet suivant :
    </p>
    
    ${rideInfoBlock(data)}
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #495057; margin: 0; font-size: 14px;">
        Ne vous découragez pas ! D'autres conducteurs proposent peut-être des trajets similaires.
      </p>
    </div>
    
    ${actionButton("Rechercher d'autres trajets", `${APP_URL}/rides`)}
  `;
  
  return baseTemplate(content, "Réservation non acceptée");
}

function cancelledByPassengerTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Annulation de réservation
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.driverName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      <strong>${data.passengerName}</strong> a annulé sa réservation pour votre trajet.
    </p>
    
    ${rideInfoBlock(data)}
    
    ${data.cancellationReason ? `
    <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #495057; margin: 0; font-size: 14px;">
        <strong>Raison :</strong> ${data.cancellationReason}
      </p>
    </div>
    ` : ""}
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 16px 0; font-size: 16px;">
      Les places sont à nouveau disponibles pour d'autres passagers.
    </p>
    
    ${actionButton("Gérer mes trajets", `${APP_URL}/dashboard`)}
  `;
  
  return baseTemplate(content, "Annulation de réservation");
}

function cancelledByDriverTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Votre réservation a été annulée
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.passengerName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      <strong>${data.driverName}</strong> a malheureusement dû annuler votre réservation.
    </p>
    
    ${rideInfoBlock(data)}
    
    ${data.cancellationReason ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>Raison :</strong> ${data.cancellationReason}
      </p>
    </div>
    ` : ""}
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 16px 0; font-size: 16px;">
      Nous vous invitons à rechercher un autre trajet.
    </p>
    
    ${actionButton("Rechercher un trajet", `${APP_URL}/rides`)}
  `;
  
  return baseTemplate(content, "Réservation annulée");
}

function rideCancelledTemplate(data: BookingEmailData): string {
  const content = `
    <h2 style="color: #dc3545; margin: 0 0 16px; font-size: 20px;">
      Trajet annulé
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${data.passengerName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Nous sommes désolés de vous informer que le trajet de <strong>${data.driverName}</strong> a été annulé.
    </p>
    
    ${rideInfoBlock(data)}
    
    ${data.cancellationReason ? `
    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #721c24; margin: 0; font-size: 14px;">
        <strong>Raison :</strong> ${data.cancellationReason}
      </p>
    </div>
    ` : ""}
    
    ${actionButton("Rechercher un autre trajet", `${APP_URL}/rides`, "#dc3545")}
  `;
  
  return baseTemplate(content, "Trajet annulé");
}

function rideReminderTemplate(data: BookingEmailData, isDriver: boolean): string {
  const recipientName = isDriver ? data.driverName : data.passengerName;
  const otherPartyName = isDriver ? data.passengerName : data.driverName;
  
  const content = `
    <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 20px;">
      Rappel : Votre trajet est demain !
    </h2>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Bonjour ${recipientName},
    </p>
    
    <p style="color: #4a4a4a; line-height: 1.7; margin: 0 0 16px; font-size: 16px;">
      Petit rappel : votre trajet ${isDriver ? `avec ${otherPartyName}` : `avec ${otherPartyName}`} est prévu pour <strong>demain</strong> !
    </p>
    
    ${rideInfoBlock(data)}
    
    <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #004085; margin: 0; font-size: 14px;">
        ${isDriver 
          ? `N'oubliez pas de contacter votre passager pour confirmer les détails du rendez-vous.`
          : `N'oubliez pas de contacter votre conducteur pour confirmer le point de rendez-vous exact.`
        }
      </p>
    </div>
    
    ${actionButton("Ouvrir la messagerie", `${APP_URL}/messages`, "#007bff")}
  `;
  
  return baseTemplate(content, "Rappel de trajet");
}

export async function sendBookingEmail(
  type: BookingEmailType,
  data: BookingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    
    let to: string;
    let subject: string;
    let html: string;
    
    switch (type) {
      case "new_booking":
        to = data.driverEmail;
        subject = `Nouvelle demande de réservation de ${data.passengerName}`;
        html = newBookingTemplate(data);
        break;
        
      case "booking_accepted":
        to = data.passengerEmail;
        subject = `Votre réservation a été acceptée !`;
        html = bookingAcceptedTemplate(data);
        break;
        
      case "booking_rejected":
        to = data.passengerEmail;
        subject = `Réservation non acceptée`;
        html = bookingRejectedTemplate(data);
        break;
        
      case "booking_cancelled_by_passenger":
        to = data.driverEmail;
        subject = `${data.passengerName} a annulé sa réservation`;
        html = cancelledByPassengerTemplate(data);
        break;
        
      case "booking_cancelled_by_driver":
        to = data.passengerEmail;
        subject = `Votre réservation a été annulée`;
        html = cancelledByDriverTemplate(data);
        break;
        
      case "ride_cancelled":
        to = data.passengerEmail;
        subject = `Trajet annulé - ${formatDateTime(data.departureTime)}`;
        html = rideCancelledTemplate(data);
        break;
        
      case "ride_reminder":
        to = data.passengerEmail;
        subject = `Rappel : Votre trajet est demain !`;
        html = rideReminderTemplate(data, false);
        break;
        
      default:
        return { success: false, error: "Type d'email inconnu" };
    }
    
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });
    
    if (error) {
      console.error("Erreur Resend:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
}

export async function sendDriverReminderEmail(
  data: BookingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.driverEmail],
      subject: `Rappel : Votre trajet est demain !`,
      html: rideReminderTemplate(data, true),
    });
    
    if (error) {
      console.error("Erreur Resend:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  }
}
