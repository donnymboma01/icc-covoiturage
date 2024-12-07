"use client";
import React from "react";
import PageLayout from "@/components/PageLayout";
//import RideHistory from "@/components/rides/driver/RidesHistory";
import dynamic from "next/dynamic";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const RideHistory = dynamic(
  () => import("@/components/rides/driver/RidesHistory"),
  {
    ssr: false,
  }
);

const RidesHistoryPage = () => {
  return (
    <PageLayout
      title="historique des trajets"
      description="Cette page permet de voir l'historique des trajets"
    >
      <div className="flex flex-col gap-4">
        <CustomBreadcrumb name="Historique des trajets" />
        <RideHistory />
      </div>
    </PageLayout>
  );
};

export default RidesHistoryPage;

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
