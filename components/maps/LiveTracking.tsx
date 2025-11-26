"use client";

import { useEffect, useState } from "react";
import { Marker } from "react-map-gl/mapbox";
import MapboxMap from "./MapboxMap";
import { FaCar, FaUser } from "react-icons/fa";
import {
    getFirestore,
    onSnapshot,
    collection,
    query,
    where,
} from "firebase/firestore";
import { app } from "@/app/config/firebase-config";

interface LocationSharing {
    id: string;
    bookingId: string;
    driverId: string;
    passengerId: string;
    sharingUserType: "driver" | "passenger";
    lastLocation: {
        lat: number;
        lng: number;
        timestamp: number | { seconds: number; nanoseconds: number };
    };
    isActive: boolean;
}

interface LiveTrackingProps {
    bookingId: string;
}

const LiveTracking = ({ bookingId }: LiveTrackingProps) => {
    const [sharings, setSharings] = useState<LocationSharing[]>([]);
    const [viewState, setViewState] = useState({
        latitude: 50.8503,
        longitude: 4.3517,
        zoom: 13,
    });

    useEffect(() => {
        if (!bookingId) return;

        const db = getFirestore(app);
        const q = query(
            collection(db, "locationSharing"),
            where("bookingId", "==", bookingId),
            where("isActive", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as LocationSharing[];

            setSharings(data);

            
            const driver = data.find(d => d.sharingUserType === "driver");
            if (driver) {
                setViewState(prev => ({
                    ...prev,
                    latitude: driver.lastLocation.lat,
                    longitude: driver.lastLocation.lng
                }));
            }
        });

        return () => unsubscribe();
    }, [bookingId]);

    return (
        <MapboxMap
            initialViewState={viewState}
            height="400px"
        >
            {sharings.map((sharing) => (
                <Marker
                    key={sharing.id}
                    latitude={sharing.lastLocation.lat}
                    longitude={sharing.lastLocation.lng}
                    anchor="bottom"
                >
                    <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full text-white shadow-lg ${sharing.sharingUserType === "driver" ? "bg-blue-600" : "bg-green-600"
                            }`}>
                            {sharing.sharingUserType === "driver" ? <FaCar size={20} /> : <FaUser size={20} />}
                        </div>
                        <span className="bg-white px-2 py-1 rounded text-xs font-bold shadow mt-1">
                            {sharing.sharingUserType === "driver" ? "Conducteur" : "Passager"}
                        </span>
                    </div>
                </Marker>
            ))}
        </MapboxMap>
    );
};

export default LiveTracking;
