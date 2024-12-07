import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { sendNotification } from "./Notifications";

if (!admin.apps.length) {
  admin.initializeApp();
}

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
