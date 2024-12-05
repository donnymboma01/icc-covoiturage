import React from "react";
import PassengerBookings from "@/components/booking/PassengerBookings";
import PageLayout from "@/components/PageLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
