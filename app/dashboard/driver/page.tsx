"use client";

import React from "react";
import CreateRideForm from "@/components/rides/driver/CreateRideForm";
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

function Driver() {
  return (
    <DriverVerificationGuard>
      <PageLayout
        title="créer un trajet"
        description="Cette page permet de créer un trajet"
      >
        <CustomBreadcrumb name="Création de trajet" />
        <div className="max-w-[800px] mx-auto p-2">
          <CreateRideForm />
        </div>
      </PageLayout>
    </DriverVerificationGuard>
  );
}

export default Driver;

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
