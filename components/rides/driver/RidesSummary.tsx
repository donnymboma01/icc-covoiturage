/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RideSummaryProps {
  formData: {
    churchId: string;
    churchName: string;
    departureAddress: string;
    arrivalAddress: string;
    departureTime: Date;
    availableSeats: number;
    price?: number;
    serviceType: string;
    meetingPointNote?: string;
  };
}

const RideSummary = ({ formData }: RideSummaryProps) => {
  const getServiceLabel = (serviceType: string) => {
    const services = {
      culte: "Culte du dimanche",
      priere: "Réunion de prière",
      evenement: "Événement spécial",
      autre: "Autre",
    };
    return services[serviceType as keyof typeof services] || "Non spécifié";
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Type de service
            </h3>
            <p className="text-lg">{getServiceLabel(formData.serviceType)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Date et heure de départ
            </h3>
            <p className="text-lg">
              {format(formData.departureTime, "EEEE d MMMM yyyy 'à' HH:mm", {
                locale: fr,
              })}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Adresse de départ
            </h3>
            <p className="text-lg">{formData.departureAddress}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Adresse d'arrivée
            </h3>
            <p className="text-lg">{formData.arrivalAddress}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-500">
              Places disponibles
            </h3>
            <p className="text-lg">{formData.availableSeats}</p>
          </div>

          {formData.meetingPointNote && (
            <div>
              <h3 className="text-sm font-medium text-slate-500">
                Point de rencontre
              </h3>
              <p className="text-lg">{formData.meetingPointNote}</p>
            </div>
          )}

          {/* <div>
            <h3 className="text-sm font-medium text-slate-500">Église</h3>
            <p className="text-lg">{formData.churchName}</p>
          </div> */}
        </div>
      </Card>
    </div>
  );
};

export default RideSummary;
