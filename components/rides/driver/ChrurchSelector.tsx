// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  getFirestore,
  where,
  documentId,
} from "firebase/firestore";
import { app } from "@/app/config/firebase-config";
import { useAuth } from "@/app/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Church {
  id: string;
  name: string;
  address: string;
}

interface ChurchSelectorProps {
  onChurchSelect: (churchId: string, churchName: string) => void;
}

const ChurchSelector = ({ onChurchSelect }: ChurchSelectorProps) => {
  const { user } = useAuth();
  const db = getFirestore(app);
  const [churches, setChurches] = useState<Church[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        if (!user?.churchIds || user.churchIds.length === 0) {
          setError("Aucune église associée à cet utilisateur");
          return;
        }

        console.log("Fetching churches for IDs:", user.churchIds);

        const churchesRef = collection(db, "churches");
        
        const q = query(churchesRef, where(documentId(), "in", user.churchIds));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("Aucune église trouvée");
          setError("Aucune église trouvée");
          return;
        }

        const churchesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Church, "id">),
        }));

        console.log("Churches retrieved:", churchesData);
        setChurches(churchesData);
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des églises:", error);
        setError("Erreur lors de la récupération des églises");
      }
    };

    fetchChurches();
  }, [user, db]);

  const filteredChurches = churches.filter((church) =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Rechercher une église..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {error && <div className="text-red-500 text-sm p-2">{error}</div>}

        {filteredChurches.length === 0 && !error && (
          <div className="text-slate-500 text-sm p-2">
            Aucune église ne correspond à votre recherche
          </div>
        )}

        <RadioGroup
          onValueChange={(churchId) => {
            const selectedChurch = churches.find(
              (church) => church.id === churchId
            );
            if (selectedChurch) {
              onChurchSelect(churchId, selectedChurch.name);
            }
          }}
        >
          {filteredChurches.map((church) => (
            <div
              key={church.id}
              className="flex items-center space-x-2 p-4 border rounded-lg"
            >
              <RadioGroupItem value={church.id} id={church.id} />
              <Label htmlFor={church.id} className="flex flex-col">
                <span className="font-medium">{church.name}</span>
                <span className="text-sm text-slate-500">{church.address}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </Card>
  );
};

export default ChurchSelector;
