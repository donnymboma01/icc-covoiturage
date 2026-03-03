import { useState } from "react";
import { BookingEmailType } from "@/lib/booking-emails";

interface SendNotificationParams {
  type: BookingEmailType;
  bookingId?: string;
  rideId: string;
  driverId: string;
  passengerId: string;
  seatsBooked?: number;
  cancellationReason?: string;
}

interface UseBookingNotificationReturn {
  sendNotification: (params: SendNotificationParams) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useBookingNotification(): UseBookingNotificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = async (params: SendNotificationParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/booking-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Erreur lors de l'envoi de la notification");
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur notification:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendNotification,
    isLoading,
    error,
  };
}

export async function sendBookingNotification(params: SendNotificationParams): Promise<boolean> {
  try {
    const response = await fetch("/api/booking-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (err) {
    console.error("Erreur notification:", err);
    return false;
  }
}
