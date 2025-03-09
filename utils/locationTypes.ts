import { Timestamp } from "firebase/firestore";

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: Timestamp;
  accuracy?: number;
}

export interface LocationSharing {
  id: string;
  bookingId: string;
  passengerId: string;
  driverId: string;
  isActive: boolean;
  startTime: Timestamp;
  endTime?: Timestamp;
  lastLocation: LocationData;
  sharingUserId: string; // ID de l'utilisateur qui partage sa position (conducteur ou passager)
  sharingUserType: "driver" | "passenger"; // Type d'utilisateur qui partage
}
