/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import PageLayout from "@/components/PageLayout";
// import FeedbackModal from "@/components/feedback/FeedbackModal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const FeddBack = () => {
  return (
    <PageLayout
      title="Envoyez nous un feedback sur votre trajet "
      description="Envoyez nous un feedback"
    >
      <CustomBreadcrumb name="Feedback" />
      <div className="max-w-[800px] mx-auto p-2">
        {/* <FeedbackModal isOpen={false} onClose={function (): void {
          throw new Error("Function not implemented.");
        } } userId={""} userType={"driver"} /> */}
      </div>
    </PageLayout>
  );
};

export default FeddBack;

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
