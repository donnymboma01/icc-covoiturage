"use client";

import React from "react";
import DriverBookings from "@/components/booking/DriverBookings";
import PageLayout from "@/components/PageLayout";
import DriverVerificationGuard from "@/components/auth/DriverVerificationGuard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
