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

// Importation dynamique des composants avec SSR désactivé
const DriverBookings = dynamic(
  () => import("@/components/booking/DriverBookings"),
  { ssr: false }
);

const DriverVerificationGuard = dynamic(
  () => import("@/components/auth/DriverVerificationGuard"),
  { ssr: false }
);

const Bookings = () => {
  return (
    <DriverVerificationGuard>
      <PageLayout
        title="Les reservations"
        description="Cette page permet de voir les reservations"
      >
        <CustomBreadcrumb name="Reservations" />
        <DriverBookings />
      </PageLayout>
    </DriverVerificationGuard>
  );
};

export default Bookings;

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
