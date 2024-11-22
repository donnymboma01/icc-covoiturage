/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RideSummaryProps {
  formData: {
    churchId: string;
    departureAddress: string;
    arrivalAddress: string;
    departureTime: Date;
    availableSeats: number;
    price?: number;
  };
}

const RideSummary = ({ formData }: RideSummaryProps) => {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Date et heure de départ</h3>
            <p className="text-lg">
              {format(formData.departureTime, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">Adresse de départ</h3>
            <p className="text-lg">{formData.departureAddress}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">Adresse d'arrivée</h3>
            <p className="text-lg">{formData.arrivalAddress}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">Places disponibles</h3>
            <p className="text-lg">{formData.availableSeats}</p>
          </div>

          {formData.price && (
            <div>
              <h3 className="text-sm font-medium text-slate-500">Prix par personne</h3>
              <p className="text-lg">{formData.price}€</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RideSummary;
