import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { LocationData, LocationSharing } from "./locationTypes";

// Démarrer le partage de localisation
export const startLocationSharing = async (
  bookingId: string,
  passengerId: string,
  driverId: string,
  sharingUserId: string,
  sharingUserType: "driver" | "passenger",
  initialLocation: { lat: number; lng: number; accuracy?: number }
) => {
  const db = getFirestore();

  // Vérifier si un partage est déjà actif pour cette réservation et cet utilisateur
  const existingQuery = query(
    collection(db, "locationSharing"),
    where("bookingId", "==", bookingId),
    where("sharingUserId", "==", sharingUserId),
    where("isActive", "==", true)
  );

  const existingDocs = await getDocs(existingQuery);

  if (!existingDocs.empty) {
    // Un partage est déjà actif, on le met à jour
    const sharingId = existingDocs.docs[0].id;
    await updateDoc(doc(db, "locationSharing", sharingId), {
      lastLocation: {
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        accuracy: initialLocation.accuracy || 0,
        timestamp: serverTimestamp(),
      },
      startTime: serverTimestamp(),
    });
    return sharingId;
  }

  // Créer un nouveau partage
  const locationData: Omit<LocationSharing, "id"> = {
    bookingId,
    passengerId,
    driverId,
    isActive: true,
    startTime: Timestamp.now(),
    sharingUserId,
    sharingUserType,
    lastLocation: {
      lat: initialLocation.lat,
      lng: initialLocation.lng,
      accuracy: initialLocation.accuracy || 0,
      timestamp: Timestamp.now(),
    },
  };

  const docRef = await addDoc(collection(db, "locationSharing"), locationData);
  return docRef.id;
};

// Mettre à jour la localisation
export const updateLocation = async (
  sharingId: string,
  location: { lat: number; lng: number; accuracy?: number }
) => {
  const db = getFirestore();
  await updateDoc(doc(db, "locationSharing", sharingId), {
    lastLocation: {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || 0,
      timestamp: serverTimestamp(),
    },
  });
};

// Arrêter le partage de localisation
export const stopLocationSharing = async (sharingId: string) => {
  const db = getFirestore();
  await updateDoc(doc(db, "locationSharing", sharingId), {
    isActive: false,
    endTime: serverTimestamp(),
  });
};

// Obtenir les informations de partage actif pour une réservation
export const getActiveLocationSharing = async (bookingId: string) => {
  const db = getFirestore();
  const q = query(
    collection(db, "locationSharing"),
    where("bookingId", "==", bookingId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as LocationSharing)
  );
};
