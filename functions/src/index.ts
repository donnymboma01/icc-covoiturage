import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { sendNotification } from "./Notifications";
import { sendRideReminderEmail } from "./RideReminder";

const resendApiKey = defineString("RESEND_API_KEY");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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

export const onLocationSharingStart = onDocumentCreated(
  {
    document: "locationSharing/{sharingId}",
    region: "europe-west1",
  },
  async (event) => {
    console.log("Fonction onLocationSharingStart déclenchée");

    const snapshot = event.data;
    if (!snapshot) {
      console.log("Pas de données dans l'événement");
      return;
    }

    const sharingData = snapshot.data();
    console.log("Données de partage:", sharingData);

    if (!sharingData) {
      console.log("Pas de données de partage");
      return;
    }

    console.log(
      "Partage de localisation détecté pour l'utilisateur:",
      sharingData.sharingUserId
    );
    return { success: true };
  }
);

export const sendRideReminders = onSchedule(
  {
    schedule: "0 10 * * *",
    timeZone: "Europe/Brussels",
    region: "europe-west1",
  },
  async () => {
    console.log("Démarrage de l'envoi des rappels de trajets...");

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    try {
      const ridesSnapshot = await db
        .collection("rides")
        .where("departureTime", ">=", tomorrowStart)
        .where("departureTime", "<=", tomorrowEnd)
        .where("status", "==", "active")
        .get();

      console.log(`${ridesSnapshot.docs.length} trajets trouvés pour demain`);

      let remindersSent = 0;
      let errors = 0;

      for (const rideDoc of ridesSnapshot.docs) {
        const ride = rideDoc.data();

        const bookingsSnapshot = await db
          .collection("bookings")
          .where("rideId", "==", rideDoc.id)
          .where("status", "==", "accepted")
          .get();

        if (bookingsSnapshot.empty) {
          console.log(`Aucune réservation acceptée pour le trajet ${rideDoc.id}`);
          continue;
        }

        const driverDoc = await db.collection("users").doc(ride.driverId).get();
        if (!driverDoc.exists) {
          console.error(`Conducteur ${ride.driverId} non trouvé`);
          continue;
        }
        const driver = driverDoc.data();

        for (const bookingDoc of bookingsSnapshot.docs) {
          const booking = bookingDoc.data();

          if (booking.reminderSent) {
            console.log(`Rappel déjà envoyé pour la réservation ${bookingDoc.id}`);
            continue;
          }

          const passengerDoc = await db
            .collection("users")
            .doc(booking.passengerId)
            .get();

          if (!passengerDoc.exists) {
            console.error(`Passager ${booking.passengerId} non trouvé`);
            continue;
          }
          const passenger = passengerDoc.data();

          const result = await sendRideReminderEmail(
            {
              departureAddress: ride.departureAddress,
              arrivalAddress: ride.arrivalAddress,
              departureTime: ride.departureTime.toDate(),
              driverName: driver?.fullName ||
                `${driver?.firstName} ${driver?.lastName}`,
              driverEmail: driver?.email,
              passengerName: passenger?.fullName ||
                `${passenger?.firstName} ${passenger?.lastName}`,
              passengerEmail: passenger?.email,
              seatsBooked: booking.seatsBooked,
              price: ride.price,
            },
            resendApiKey.value()
          );

          if (result.driverSent || result.passengerSent) {
            await bookingDoc.ref.update({
              reminderSent: true,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            remindersSent++;
            console.log(
              `Rappel envoyé pour la réservation ${bookingDoc.id} ` +
              `(conducteur: ${result.driverSent}, passager: ${result.passengerSent})`
            );
          }

          if (result.errors.length > 0) {
            errors++;
            console.error(
              `Erreurs pour la réservation ${bookingDoc.id}:`,
              result.errors
            );
          }
        }
      }

      await db.collection("emailLogs").add({
        type: "ride_reminders",
        date: admin.firestore.FieldValue.serverTimestamp(),
        ridesFound: ridesSnapshot.docs.length,
        remindersSent,
        errors,
      });

      console.log(
        `Envoi des rappels terminé: ${remindersSent} envoyés, ${errors} erreurs`
      );
    } catch (error) {
      console.error("Erreur lors de l'envoi des rappels:", error);
      throw error;
    }
  }
);
