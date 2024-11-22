import React from "react";
import PageLayout from "@/components/PageLayout";
import RegisterForm from "@/components/auth/RegisterForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const RegisterPage = () => {
  return (
    <PageLayout
      title="Inscription"
      description="Cette page permet de se connecter"
    >
      <CustomBreadcrumb name="Inscription" />
      <div className="max-w-[800px] mx-auto p-2">
        <RegisterForm />
      </div>
    </PageLayout>
  );
};

export default RegisterPage;

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
