import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { sendNotification } from "./Notifications";
import * as nodemailer from "nodemailer";

if (!admin.apps.length) {
  admin.initializeApp();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const onNewRideRequest = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: "europe-west1",
  },
  async (event) => {
    const booking = event.data?.data();
    if (booking) {
      try {
        await sendNotification(
          booking.driverId,
          "Nouvelle demande de trajet",
          `${booking.passengerName} souhaite rejoindre votre trajet`
        );

        await sendNotification(
          booking.passengerId,
          "Demande envoyée",
          "Votre demande de trajet a bien été envoyée au conducteur."
        );
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  }
);

export const onRideRequestUpdate = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    region: "europe-west1",
  },

  async (event) => {
    const newData = event.data?.after.data();
    if (newData) {
      try {
        await sendNotification(
          newData.passengerId,
          "Mise à jour de votre demande",
          `Votre demande de trajet a été ${
            newData.status === "accepted" ? "acceptée" : "refusée"
          }`
        );

        await sendNotification(
          newData.driverId,
          "Mise à jour du trajet",
          `La demande de ${newData.passengerName} a été ${
            newData.status === "accepted" ? "acceptée" : "refusée"
          }.`
        );
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  }
);

export const onNewFeedback = onDocumentCreated(
  {
    document: "feedback/{feedbackId}",
    region: "europe-west1",
  },
  async (event) => {
    const feedback = event.data?.data();
    if (feedback) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Nouveau feedback ${feedback.isUrgent ? "🚨 URGENT" : ""}`,
        html: `
          <h2>Nouveau feedback reçu</h2>
          <p><strong>Type d'utilisateur:</strong> ${feedback.userType}</p>
          <p><strong>Type de problème:</strong> ${feedback.problemType}</p>
          <p><strong>Description:</strong> ${feedback.description}</p>
          <p><strong>Urgent:</strong> ${feedback.isUrgent ? "Oui" : "Non"}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (error) {
        console.error("Erreur lors de l'envoi du email:", error);
      }
    }
  }
);
