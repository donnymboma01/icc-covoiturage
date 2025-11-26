"use client";

import { useRef, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, MapRef, ViewStateChangeEvent, MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { FaMapMarkerAlt } from "react-icons/fa";

interface MapboxMapProps {
    initialViewState?: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
    markers?: Array<{
        longitude: number;
        latitude: number;
        color?: string;
        popup?: React.ReactNode;
    }>;
    onMapClick?: (event: { lngLat: { lng: number; lat: number } }) => void;
    interactive?: boolean;
    height?: string;
    width?: string;
    children?: React.ReactNode;
}

const MapboxMap = ({
    initialViewState = {
        longitude: 4.3517, 
        latitude: 50.8503,
        zoom: 11,
    },
    markers = [],
    onMapClick,
    interactive = true,
    height = "400px",
    width = "100%",
    children,
}: MapboxMapProps) => {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState(initialViewState);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
        return (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height, width }}>
                <p className="text-red-500">Erreur: Clé Mapbox manquante</p>
            </div>
        );
    }

    return (
        <div style={{ height, width }} className="relative rounded-xl overflow-hidden shadow-md border border-gray-200">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={mapboxToken}
                onClick={(evt: MapMouseEvent) => onMapClick && onMapClick({ lngLat: evt.lngLat })}
                interactive={interactive}
                attributionControl={false}
            >
                <GeolocateControl position="top-left" />
                <NavigationControl position="top-left" />

                {markers.map((marker, index) => (
                    <Marker
                        key={`marker-${index}`}
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        anchor="bottom"
                    >
                        <FaMapMarkerAlt
                            size={30}
                            className="drop-shadow-md"
                            color={marker.color || "#ea580c"} 
                        />
                    </Marker>
                ))}

                {children}
            </Map>
        </div>
    );
};

export default MapboxMap;
