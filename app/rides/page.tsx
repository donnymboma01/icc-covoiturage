import React from "react";
import PageLayout from "@/components/PageLayout";
import RideSearch from "@/components/rides/passanger/RideSearch";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const RidePage = () => {
  return (
    <PageLayout
      title="trajets"
      description="Cette page permet de voir les trajets disponibles"
    >
      <div className="flex flex-col gap-4">
        <CustomBreadcrumb name="Rechercher un trajet" />
        <RideSearch />
      </div>
    </PageLayout>
  );
};

export default RidePage;

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
