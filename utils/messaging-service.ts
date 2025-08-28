import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "@/app/config/firebase-config";
import { Conversation, Message, MessageInput } from "@/types/messaging";


export const getOrCreateConversation = async (
  driverId: string,
  passengerId: string,
  rideId: string
): Promise<string> => {
  if (!db) throw new Error("Firestore non initialisé");

  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", driverId),
    where("rideId", "==", rideId)
  );

  const snapshot = await getDocs(q);
  const existingConversation = snapshot.docs.find((doc) => {
    const data = doc.data();
    return data.participants.includes(passengerId);
  });

  if (existingConversation) {
    return existingConversation.id;
  }


  const newConversation: Omit<Conversation, "id"> = {
    participants: [driverId, passengerId],
    rideId,
    unreadCount: {
      [driverId]: 0,
      [passengerId]: 0,
    },
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
};


export const sendMessage = async (messageData: MessageInput): Promise<void> => {
  if (!db) throw new Error("Firestore non initialisé");

  const batch = writeBatch(db);

  const messagesRef = collection(db, "messages");
  const messageDoc = doc(messagesRef);
  
  const message: Omit<Message, "id"> = {
    ...messageData,
    timestamp: Timestamp.now(),
    readBy: [messageData.senderId], 
  };

  batch.set(messageDoc, message);

  const conversationRef = doc(db, "conversations", messageData.conversationId);
  const conversationDoc = await getDoc(conversationRef);
  
  if (conversationDoc.exists()) {
    const conversationData = conversationDoc.data() as Conversation;
    const otherParticipant = conversationData.participants.find(
      (id) => id !== messageData.senderId
    );

    const updatedUnreadCount = { ...conversationData.unreadCount };
    if (otherParticipant) {
      updatedUnreadCount[otherParticipant] = (updatedUnreadCount[otherParticipant] || 0) + 1;
    }

    batch.update(conversationRef, {
      lastMessage: messageData.content,
      lastMessageTime: Timestamp.now(),
      unreadCount: updatedUnreadCount,
    });
  }

  await batch.commit();
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  if (!db) throw new Error("Firestore non initialisé");

  const batch = writeBatch(db);


  const conversationRef = doc(db, "conversations", conversationId);
  batch.update(conversationRef, {
    [`unreadCount.${userId}`]: 0,
  });

  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    where("readBy", "not-in", [[userId]])
  );

  const snapshot = await getDocs(q);
  snapshot.docs.forEach((messageDoc) => {
    const messageData = messageDoc.data() as Message;
    if (!messageData.readBy.includes(userId)) {
      batch.update(messageDoc.ref, {
        readBy: [...messageData.readBy, userId],
      });
    }
  });

  await batch.commit();
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  if (!db) throw new Error("Firestore non initialisé");

  const messagesRef = collection(db, "messages");
  

  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    limit(100) 
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    
    messages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
    
    callback(messages);
  });
};


export const sendSystemMessage = async (
  conversationId: string,
  content: string,
  senderId?: string, 
  senderName?: string
): Promise<void> => {
  if (!db) throw new Error("Firestore non initialisé");

  const messagesRef = collection(db, "messages");
  
  const message: Omit<Message, "id"> = {
    conversationId,
    senderId: senderId || "system", 
    senderName: senderName || "Système",
    content,
    timestamp: Timestamp.now(),
    type: senderId ? "text" : "system", 
    readBy: senderId ? [] : [], 
  };

  await addDoc(messagesRef, message);


  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    lastMessage: content,
    lastMessageTime: Timestamp.now(),
  });
};

export const sendBookingAcceptedMessage = async (
  driverId: string,
  passengerId: string,
  rideId: string,
  driverName: string,
  passengerName: string
): Promise<void> => {
  try {
    const conversationId = await getOrCreateConversation(driverId, passengerId, rideId);
    
    const message = `Bonne nouvelle ! ${driverName} a accepté la demande de covoiturage de ${passengerName}. Vous pouvez maintenant discuter des détails du trajet.`;
    
    await sendSystemMessage(conversationId, message, driverId, driverName);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message système:", error);
  }
};
export const getUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
) => {
  if (!db) throw new Error("Firestore non initialisé");

  const conversationsRef = collection(db, "conversations");
  
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];
    
   
    conversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
    });
    
    callback(conversations);
  });
};


export const markAllConversationsAsViewed = async (userId: string): Promise<void> => {
  if (!db) throw new Error("Firestore non initialisé");

  try {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((conversationDoc) => {
      const conversationRef = doc(conversationsRef, conversationDoc.id);
      batch.update(conversationRef, {
        [`unreadCount.${userId}`]: 0,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Erreur lors de la mise à jour des conversations:", error);
  }
};
