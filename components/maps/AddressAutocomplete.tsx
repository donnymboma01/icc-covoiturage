"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
    placeholder?: string;
    className?: string;
}

interface Suggestion {
    id: string;
    place_name: string;
    center: [number, number]; // lng, lat
}

const AddressAutocomplete = ({
    value,
    onChange,
    placeholder = "Rechercher une adresse...",
    className,
}: AddressAutocompleteProps) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setInputValue(value);
    }, [value]);


    const [debouncedValue] = useDebounce(inputValue, 300);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedValue || debouncedValue.length < 3) {
                setSuggestions([]);
                return;
            }

            const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
            if (!token) return;

            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                        debouncedValue
                    )}.json?access_token=${token}&country=be,fr,nl,lu,de&language=fr&types=place,address,poi`
                );
                const data = await response.json();
                if (data.features) {
                    setSuggestions(data.features);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        };

        fetchSuggestions();
    }, [debouncedValue]);


    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (suggestion: Suggestion) => {
        setInputValue(suggestion.place_name);
        setSuggestions([]);
        setShowSuggestions(false);
        onChange(suggestion.place_name, {
            lat: suggestion.center[1],
            lng: suggestion.center[0],
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
        setShowSuggestions(true);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="pl-10"
                    onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white dark:bg-slate-800 mt-1 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion) => (
                        <li
                            key={suggestion.id}
                            onClick={() => handleSelect(suggestion)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                        >
                            <FaMapMarkerAlt className="text-gray-400 dark:text-gray-300 flex-shrink-0" />
                            <span className="truncate">{suggestion.place_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


function useDebounce<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue];
}

export default AddressAutocomplete;
