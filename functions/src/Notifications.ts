import * as admin from "firebase-admin";

export const sendNotification = async (
  userId: string,
  title: string,
  body: string
) => {
  try {
    console.log(
      `Tentative d'envoi d'une notification à l'utilisateur : ${userId}`
    );
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();

    if (!userData) {
      console.log(`Aucun utilisateur trouvé pour ID: ${userId}`);
      return;
    }

    if (!userData.fcmToken) {
      console.log(`Aucun Token FCM trouvé pour l'utilisateur : ${userId}`);
      return;
    }

    const message = {
      token: userData.fcmToken,
      notification: { title, body },
      android: { priority: "high" as const },
      apns: { payload: { aps: { contentAvailable: true } } },
    };

    const response = await admin.messaging().send(message);
    console.log(`Notification envoyée avec succes ${userId}:`, response);
  } catch (error) {
    console.error("Erreur lors de l'envoie de la notification :", error);
    throw error;
  }
};
