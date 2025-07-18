"use client";
import { useState } from "react";
// import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { FaLocationArrow, FaLocationCrosshairs } from "react-icons/fa6";

interface LocationSharingControlProps {
    bookingId: string;
    passengerId: string;
    driverId: string;
    currentUserId: string;
    userType: "driver" | "passenger";
}

const LocationSharingControl = ({
    bookingId,
    passengerId,
    driverId,
    currentUserId,
    userType,
}: LocationSharingControlProps) => {
    const [isSharingEnabled, setIsSharingEnabled] = useState(false);

    const { isTracking, error, currentLocation, stopTracking } =
        useLocationTracking({
            bookingId,
            passengerId,
            driverId,
            sharingUserId: currentUserId,
            sharingUserType: userType,
            isEnabled: isSharingEnabled,
        });

    const handleToggleSharing = () => {
        if (isSharingEnabled) {
            stopTracking();
            setIsSharingEnabled(false);
        } else {
            setIsSharingEnabled(true);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Partage de localisation</h3>
                        <p className="text-sm text-gray-500">
                            {isTracking
                                ? "Votre position est partagée en temps réel"
                                : "Activez le partage pour être visible sur la carte"}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={isSharingEnabled}
                            onCheckedChange={handleToggleSharing}
                            id="location-sharing"
                        />
                        <div className="text-2xl">
                            {isSharingEnabled ? (
                                <FaLocationArrow className="text-green-500" />
                            ) : (
                                <FaLocationCrosshairs className="text-gray-400" />
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
                        <p className="font-medium mb-1">Erreur :</p>
                        <p>{error}</p>
                        {error.includes("refusé") && (
                            <div className="mt-2 text-xs">
                                <p className="font-medium">Comment autoriser la localisation :</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Cliquez sur l&apos;icône de cadenas dans la barre d&apos;adresse</li>
                                    <li>Trouvez le paramètre &quot;Localisation&quot; ou &quot;Position&quot;</li>
                                    <li>Changez-le de &quot;Bloquer&quot; à &quot;Autoriser&quot;</li>
                                    <li>Rafraîchissez la page et réessayez</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {currentLocation && (
                    <div className="text-xs text-gray-500 flex items-center">
                        <span className="mr-1">Précision:</span>
                        <span className="font-medium">±{Math.round(currentLocation.coords.accuracy)} mètres</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default LocationSharingControl;
