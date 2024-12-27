import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/config/firebase-config";

interface FeedbackData {
  userId: string;
  userType: "driver" | "passenger";
  problemType: string;
  description: string;
  isUrgent: boolean;
  createdAt: Date;
  status: "pending" | "reviewed";
}

export const submitFeedback = async (
  feedbackData: Omit<FeedbackData, "createdAt" | "status">
) => {
  if (!db) {
    throw new Error("La base de données de Firebase n'est pas disponible ou pas initialisée.");
  }

  const feedbackRef = collection(db, "feedback");

  const completeData = {
    ...feedbackData,
    createdAt: new Date(),
    status: "pending" as const,
  };

  return await addDoc(feedbackRef, completeData);
};
