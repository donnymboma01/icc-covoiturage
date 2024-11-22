import React from "react";
import RideDetails from "@/components/rides/passanger/RideDetails";
import PageLayout from "@/components/PageLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const RideDetailsPage = async ({ params }: { params: { id: string } }) => {
  return (
    <PageLayout
      title="détails du trajet"
      description="Cette page permet de voir les détails du trajet"
    >
      <CustomBreadcrumb name="Détails du trajet" />
      <RideDetails rideId={params.id} />
    </PageLayout>
  );
};

export default RideDetailsPage;

const CustomBreadcrumb = ({ name }: { name: string }) => {
  return (
    <Breadcrumb className=" p-2  bg-gray-100">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/home">Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* <BreadcrumbItem>
            <BreadcrumbLink href="/auth/users">Utilisateurs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator /> */}
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
