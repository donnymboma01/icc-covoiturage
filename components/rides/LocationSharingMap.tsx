"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { LocationSharing } from "@/utils/locationTypes";
import {
    getFirestore,
    onSnapshot,
    collection,
    query,
    where,
} from "firebase/firestore";

const driverIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/3097/3097144.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

const passengerIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/3097/3097155.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

interface LocationSharingMapProps {
    bookingId: string;
    driverId: string;
    passengerId: string;
    currentUserId: string;
}

const LocationSharingMap = ({
    bookingId,
    // driverId,
    // passengerId,
    // currentUserId,
}: LocationSharingMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});
    const [locationSharings, setLocationSharings] = useState<LocationSharing[]>([]);

    // Initialiser la carte
    useEffect(() => {
        if (!mapRef.current) return;

        if (!leafletMap.current) {
            leafletMap.current = L.map(mapRef.current).setView([48.8566, 2.3522], 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(leafletMap.current);
        }
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!bookingId) return;

        const db = getFirestore();
        const q = query(
            collection(db, "locationSharing"),
            where("bookingId", "==", bookingId),
            where("isActive", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sharings = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as LocationSharing[];

            setLocationSharings(sharings);
        });

        return () => unsubscribe();
    }, [bookingId]);

    useEffect(() => {
        if (!leafletMap.current) return;

        Object.keys(markersRef.current).forEach((id) => {
            const stillExists = locationSharings.some((sharing) => sharing.id === id);
            if (!stillExists) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        locationSharings.forEach((sharing) => {
            const { id, lastLocation, sharingUserType } = sharing;
            const icon = sharingUserType === "driver" ? driverIcon : passengerIcon;
            const label = sharingUserType === "driver" ? "Conducteur" : "Passager";

            if (markersRef.current[id]) {
                markersRef.current[id].setLatLng([lastLocation.lat, lastLocation.lng]);
            } else {
                const marker = L.marker([lastLocation.lat, lastLocation.lng], {
                    icon,
                }).addTo(leafletMap.current!);

                marker.bindPopup(`<strong>${label}</strong><br/>Dernière mise à jour: ${new Date(lastLocation.timestamp.toMillis()).toLocaleTimeString()}`);
                markersRef.current[id] = marker;
            }
        });

        if (locationSharings.length > 0) {
            const bounds = Object.values(markersRef.current).map((marker) =>
                marker.getLatLng()
            );

            if (bounds.length > 0) {
                leafletMap.current.fitBounds(L.latLngBounds(bounds), {
                    padding: [50, 50],
                    maxZoom: 15,
                });
            }
        }
    }, [locationSharings]);

    return (
        <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Suivi en temps réel</h3>
            <div
                ref={mapRef}
                style={{ height: "400px", width: "100%", borderRadius: "8px" }}
            />
            <div className="mt-2 text-sm text-gray-500">
                {locationSharings.length === 0 ? (
                    "Aucun partage de localisation actif"
                ) : (
                    `${locationSharings.length} utilisateur(s) partagent leur position`
                )}
            </div>
        </Card>
    );
};

export default LocationSharingMap;
