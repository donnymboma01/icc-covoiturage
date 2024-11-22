/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore";
// import { db } from "@/lib/firebase";
import {app } from "@/app/config/firebase-config";
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
  onChurchSelect: (churchId: string) => void;
}

const ChurchSelector = ({ onChurchSelect }: ChurchSelectorProps) => {
  const { user } = useAuth();
  const db = getFirestore(app);
  const [churches, setChurches] = useState<Church[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChurches = async () => {
      if (user?.churchIds) {
        const churchesRef = collection(db, "Church");
        const q = query(churchesRef, where("id", "in", user.churchIds));
        const querySnapshot = await getDocs(q);
        
        const churchesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Church));
        
        setChurches(churchesData);
      }
    };

    fetchChurches();
  }, [user]);

  const filteredChurches = churches.filter(church =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Rechercher une église..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <RadioGroup onValueChange={onChurchSelect}>
        {filteredChurches.map((church) => (
          <div key={church.id} className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value={church.id} id={church.id} />
            <Label htmlFor={church.id} className="flex flex-col">
              <span className="font-medium">{church.name}</span>
              <span className="text-sm text-slate-500">{church.address}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ChurchSelector;
