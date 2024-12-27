"use client";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function FixNegativeSeats() {
  const fixNegativeSeats = async () => {
    const db = getFirestore();
    const ridesRef = collection(db, "rides");
    const ridesSnapshot = await getDocs(ridesRef);

    let fixed = 0;
    for (const rideDoc of ridesSnapshot.docs) {
      const rideData = rideDoc.data();
      if (rideData.availableSeats < 0) {
        await updateDoc(doc(db, "rides", rideDoc.id), {
          availableSeats: 0,
        });
        fixed++;
      }
    }
    alert(`Correction terminée. ${fixed} trajets corrigés.`);
  };

  return (
    <div className="p-4">
      <h1>Correction des places négatives</h1>
      <Button onClick={fixNegativeSeats}>Corriger les places négatives</Button>
    </div>
  );
}
