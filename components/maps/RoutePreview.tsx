"use client";

import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/mapbox";

interface RoutePreviewProps {
    start: { lat: number; lng: number } | null;
    end: { lat: number; lng: number } | null;
    onRouteCalculated?: (distance: number, duration: number) => void;
}

const routeLayer: any = {
    id: "route",
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round",
    },
    paint: {
        "line-color": "#3b82f6", 
        "line-width": 4,
        "line-opacity": 0.75,
    },
};

const RoutePreview = ({ start, end, onRouteCalculated }: RoutePreviewProps) => {
    const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

    useEffect(() => {
        const fetchRoute = async () => {
            if (!start || !end) {
                setRouteGeoJSON(null);
                return;
            }

            const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
            if (!token) return;

            try {
                const query = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&geometries=geojson&access_token=${token}`
                );
                const json = await query.json();
                const data = json.routes[0];

                if (data) {
                    const route = data.geometry.coordinates;
                    const geojson = {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "LineString",
                            coordinates: route,
                        },
                    };
                    setRouteGeoJSON(geojson);

                    if (onRouteCalculated) {
                        onRouteCalculated(data.distance, data.duration);
                    }
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        };

        fetchRoute();
    }, [start, end, onRouteCalculated]);

    if (!routeGeoJSON) return null;

    return (
        <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayer} />
        </Source>
    );
};

export default RoutePreview;
