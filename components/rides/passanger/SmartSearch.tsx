"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/hooks/useAuth";
import RideCard from "./RideCard";

interface SmartSearchProps {
  onRidesFound?: (rides: any[]) => void;
}

const SmartSearch = ({ onRidesFound }: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [rides, setRides] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dots, setDots] = useState("");
  const { user } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || !user) return;

    setLoading(true);
    setResponse("");
    setRides([]);
    
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    try {
      const res = await fetch("/api/smart-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          userId: user.uid,
          churchId: user.churchIds?.[0] || null,
          preferences: {}
        }),
      });

      const data = await res.json();

      if (data.error) {
        setResponse("Erreur: " + data.error);
      } else {
        setResponse(data.response);
        setRides(data.rides || []);
        if (onRidesFound) {
          onRidesFound(data.rides || []);
        }
      }
    } catch (error: any) {
      setResponse("Erreur de connexion au serveur");
    } finally {
      clearInterval(dotsInterval);
      setDots("");
      setLoading(false);
    }
  };

  const suggestions = [
    "Trouve-moi un trajet pour aller à l'église dimanche prochain",
    "Y a-t-il des trajets vers Bruxelles cette semaine?",
    "Trajets pas chers pour Liège",
    "Qui va à Anvers demain matin?"
  ];

  const handleClose = () => {
    setIsOpen(false);
    setResponse("");
    setRides([]);
    setQuery("");
  };

  return (
    <div className="space-y-6">
      {!isOpen && (
        <div className="flex justify-center">
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 px-6 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recherche Intelligente avec IA
          </Button>
        </div>
      )}

      {isOpen && (
        <Card className="p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recherche intelligente
              </h2>
              <p className="text-sm text-muted-foreground">
                Posez votre question en langage naturel
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <textarea
                  placeholder="Ex: Trouve-moi un trajet vers Bruxelles demain matin"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading || !user}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:placeholder-slate-400"
                />
                <Button 
                  type="submit" 
                  disabled={loading || !user || !query.trim()}
                  className="w-full relative overflow-hidden"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      IA en train d'analyser{dots}
                    </span>
                  ) : (
                    "Rechercher avec l'IA"
                  )}
                </Button>
              </div>

            {!user && (
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour utiliser la recherche intelligente
              </p>
            )}
          </form>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="text-xs px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  disabled={loading || !user}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {response && (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{response}</p>
            </Card>
          )}
          </div>
        </Card>
      )}

      {rides.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={{
                ...ride,
                departureTime: new Date(ride.departureTime)
              }}
              driver={{
                fullName: ride.driverName || "Conducteur",
                profilePicture: ride.driverPhoto,
                isStar: ride.driverIsStar,
                isVerified: ride.driverIsVerified
              }}
              onClick={() => {
                window.location.href = `/rides/${ride.id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
