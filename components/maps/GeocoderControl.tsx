"use client";

import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { useControl } from "react-map-gl/mapbox";

interface GeocoderControlProps {
    mapboxAccessToken: string;
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    onResult?: (result: any) => void;
    placeholder?: string;
}


const GeocoderControl = (props: GeocoderControlProps) => {

    const geocoder = useControl(
        () => {
            const ctrl = new MapboxGeocoder({
                accessToken: props.mapboxAccessToken,
                marker: false,
                collapsed: false,
                placeholder: props.placeholder || "Rechercher une adresse...",
                countries: "be,fr,nl,lu,de", 
                language: "fr",
            });

            ctrl.on("result", (evt) => {
                const { result } = evt;
                if (props.onResult) {
                    props.onResult(result);
                }
            });
            return ctrl;
        },
        {
            position: props.position,
        }
    );

    return null;
};

export default GeocoderControl;
