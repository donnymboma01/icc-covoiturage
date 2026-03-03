import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/config/firebase-config";
import { sendBookingEmail, sendDriverReminderEmail, BookingEmailData, BookingEmailType } from "@/lib/booking-emails";
import { rateLimitByIP, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimit = rateLimitByIP(request, RATE_LIMITS.AUTHENTICATED);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(RATE_LIMITS.AUTHENTICATED, rateLimit.resetIn);
  }

  try {
    const body = await request.json();
    const { 
      type, 
      bookingId, 
      rideId, 
      driverId, 
      passengerId, 
      seatsBooked,
      cancellationReason 
    } = body as {
      type: BookingEmailType;
      bookingId: string;
      rideId: string;
      driverId: string;
      passengerId: string;
      seatsBooked: number;
      cancellationReason?: string;
    };

    if (!type || !rideId || !driverId || !passengerId) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Base de données non initialisée" },
        { status: 500 }
      );
    }

    const driverDoc = await getDoc(doc(db, "users", driverId));
    if (!driverDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Conducteur non trouvé" },
        { status: 404 }
      );
    }
    const driverData = driverDoc.data();

    const passengerDoc = await getDoc(doc(db, "users", passengerId));
    if (!passengerDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Passager non trouvé" },
        { status: 404 }
      );
    }
    const passengerData = passengerDoc.data();

    const rideDoc = await getDoc(doc(db, "rides", rideId));
    if (!rideDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Trajet non trouvé" },
        { status: 404 }
      );
    }
    const rideData = rideDoc.data();

    const emailData: BookingEmailData = {
      bookingId: bookingId || "",
      rideId,
      seatsBooked: seatsBooked || 1,
      departureAddress: rideData.departureAddress || "Non spécifié",
      arrivalAddress: rideData.arrivalAddress || "Non spécifié",
      departureTime: rideData.departureTime?.toDate() || new Date(),
      price: rideData.price,
      driverName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      driverEmail: driverData.email,
      passengerName: passengerData.fullName || `${passengerData.firstName} ${passengerData.lastName}`,
      passengerEmail: passengerData.email,
      cancellationReason,
    };

    let result;
    
    if (type === "ride_reminder") {
      const passengerResult = await sendBookingEmail(type, emailData);
      const driverResult = await sendDriverReminderEmail(emailData);
      
      result = {
        success: passengerResult.success && driverResult.success,
        error: passengerResult.error || driverResult.error,
      };
    } else {
      result = await sendBookingEmail(type, emailData);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi notification:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
