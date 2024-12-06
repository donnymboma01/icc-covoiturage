import * as admin from "firebase-admin";

// export const sendNotification = async (
//   userId: string,
//   title: string,
//   body: string
// ) => {
//   const userDoc = await admin.firestore().collection("users").doc(userId).get();
//   const userData = userDoc.data();

//   if (userData?.fcmToken) {
//     await admin.messaging().send({
//       token: userData.fcmToken,
//       notification: { title, body },
//       android: { priority: "high" },
//       apns: { payload: { aps: { contentAvailable: true } } },
//     });
//   }
// };
export const sendNotification = async (
  userId: string,
  title: string,
  body: string
) => {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (userData?.fcmToken) {
    await admin.messaging().send({
      token: userData.fcmToken,
      notification: { title, body },
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    });
  }
};
