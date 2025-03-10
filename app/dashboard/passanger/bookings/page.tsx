"use client";

import React from "react";
import dynamic from 'next/dynamic';
import PageLayout from "@/components/PageLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Importation dynamique du composant avec SSR désactivé
const PassengerBookings = dynamic(
  () => import("@/components/booking/PassengerBookings"),
  { ssr: false }
);

const PassengerBookingsPage = () => {
  return (
    <PageLayout
      title="Mes reservations"
      description="Cette page permet de se connecter"
    >
      <CustomBreadcrumb name="Mes reservations" />
      <PassengerBookings />
    </PageLayout>
  );
};

export default PassengerBookingsPage;

const CustomBreadcrumb = ({ name }: { name: string }) => {
  return (
    <Breadcrumb className=" p-2  bg-gray-100">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/home">Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
