/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/2098/2098567.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface MapComponentProps {
  onDepartureSelect: (address: string) => void;
  onArrivalSelect: (address: string) => void;
  initialDepartureAddress?: string;
  initialArrivalAddress?: string;
  isMapVisible: boolean;
}

const MapComponent = ({
  onDepartureSelect,
  onArrivalSelect,
  initialDepartureAddress = "",
  initialArrivalAddress = "",
  isMapVisible,
}: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    48.8566, 2.3522,
  ]);
  const [departureAddress, setDepartureAddress] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState("");
  const [departureMarker, setDepartureMarker] = useState<L.Marker | null>(null);
  const [arrivalMarker, setArrivalMarker] = useState<L.Marker | null>(null);

  const updateMarker = (location: Location, type: "departure" | "arrival") => {
    if (!leafletMap.current) return;

    const marker = L.marker([location.lat, location.lng], {
      icon: customIcon,
    }).addTo(leafletMap.current);

    marker
      .bindPopup(
        `<div>
          <strong>${type === "departure" ? "Départ" : "Arrivée"}</strong><br />
          ${location.address}
        </div>`
      )
      .openPopup();

    if (type === "departure") {
      departureMarker?.remove();
      setDepartureMarker(marker);
      setDepartureAddress(location.address);
      onDepartureSelect(location.address);
    } else {
      arrivalMarker?.remove();
      setArrivalMarker(marker);
      setArrivalAddress(location.address);
      onArrivalSelect(location.address);
    }
  };

  const searchAddress = async (
    address: string,
    type: "departure" | "arrival"
  ) => {
    if (!address.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );

      const data = await response.json();

      if (data && data[0]) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name,
        };

        updateMarker(location, type);
        leafletMap.current?.setView([location.lat, location.lng], 13);
      } else {
        alert("Aucune adresse trouvée pour votre recherche.");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView(userLocation, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletMap.current);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(newLocation);
          leafletMap.current?.setView(newLocation, 13);
        },
        (error) => {
          console.warn("Erreur de géolocalisation :", error);
        }
      );
    }

    if (leafletMap.current) {
      if (isMapVisible) {
        setTimeout(() => {
          leafletMap.current?.invalidateSize();
        }, 100);
      }
    }

    return () => {
      if (leafletMap.current && !isMapVisible) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [isMapVisible]);

  useEffect(() => {
    return () => {
      departureMarker?.remove();
      arrivalMarker?.remove();
    };
  }, [arrivalMarker, departureMarker]);

  useEffect(() => {
    if (isMapVisible && mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView(userLocation, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(leafletMap.current);

      if (departureMarker) {
        departureMarker.addTo(leafletMap.current);
      }
      if (arrivalMarker) {
        arrivalMarker.addTo(leafletMap.current);
      }
    }
  }, [isMapVisible]);

  return (
    <div className="space-y-6">
      <div
        className={`
    transition-all duration-500 ease-in-out mb-6
    ${isMapVisible ? "opacity-100 h-[500px]" : "opacity-0 h-0"}
    overflow-hidden rounded-xl shadow-lg
  `}
        style={{ visibility: isMapVisible ? "visible" : "hidden" }}
      >
        <div
          ref={mapRef}
          className="h-full w-full rounded-xl border-2 border-gray-100"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Adresse de départ"
            value={departureAddress}
            onChange={(e) => setDepartureAddress(e.target.value)}
            className="w-full rounded-lg border-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <Button
            onClick={() => searchAddress(departureAddress, "departure")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            Rechercher départ
          </Button>
        </div>

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Adresse d'arrivée"
            value={arrivalAddress}
            onChange={(e) => setArrivalAddress(e.target.value)}
            className="w-full rounded-lg border-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <Button
            onClick={() => searchAddress(arrivalAddress, "arrival")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            Rechercher arrivée
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
