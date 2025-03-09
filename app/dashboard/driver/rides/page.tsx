"use client";

import React from "react";
import RidesHistory from "@/components/rides/driver/RidesHistory";
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

function DriverRidesPage() {
  return (
    <DriverVerificationGuard>
      <PageLayout
        title="Mes trajets"
        description="Gérez vos trajets en tant que conducteur"
      >
        <CustomBreadcrumb name="Mes trajets" />
        <div className="max-w-[1200px] mx-auto p-2">
          <RidesHistory />
        </div>
      </PageLayout>
    </DriverVerificationGuard>
  );
}

export default DriverRidesPage;

const CustomBreadcrumb = ({ name }: { name: string }) => {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard/driver">Conducteur</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}; 