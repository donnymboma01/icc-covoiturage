/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import PageLayout from "@/components/PageLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  TbCircleNumber1Filled,
  TbCircleNumber2Filled,
  TbCircleNumber3Filled,
  TbCircleNumber4Filled,
  TbCircleNumber5Filled,
  TbCircleNumber6Filled,
  TbCircleNumber7Filled,
} from "react-icons/tb";

const InfosPage = () => {
  return (
    <PageLayout
      title="Informations sur le covoiturage"
      description="Découvrez pourquoi utiliser l'application de covoiturage de l'église"
    >
      <div className="">
        <CustomBreadcrumb name="Informations" />
        <p className="text-white bg-gradient-to-r from-blue-900 to-slate-800 shadow-lg rounded-lg m-4 uppercase text-xl max-md:text-sm text-center px-6 py-4 font-bold">
          {
            "Les bonnes raisons d'utiliser l'application de covoiturage de l'église"
          }
        </p>

        <div className="flex">
          <div className="max-md:text-xs max-md:mx-1 flex flex-col items-start justify-between my-2">
            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl">
              <TbCircleNumber1Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />{" "}
              <span>
                {
                  "Faciliter l'entraide entre frères et sœurs pour les déplacements"
                }
              </span>
            </p>

            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber2Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />
              <span>
                {
                  " ⁠Encourager les membres à participer aux activités de l’église"
                }
              </span>
            </p>

            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber3Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />{" "}
              <span>
                {
                  "Réduire les coûts de transport grâce à la solidarité chrétienne"
                }
              </span>
            </p>

            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber4Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />
              <span>{"Contribuer à un mode de transport plus écologique"}</span>
            </p>

            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber5Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />{" "}
              <span>
                {"Renforcer les liens entre les membres de l’église "}
              </span>
            </p>

            <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber6Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />
              <span>
                {
                  "Permettre à ceux qui n’ont pas de moyen de transport de prendre part aux différentes activités de l’église"
                }
              </span>
            </p>

            {/* <p className="flex items-center bg-white p-1 px-2 rounded-bl-3xl rounded-tr-3xl mt-4">
              <TbCircleNumber7Filled
                size={40}
                className="bg-slate-800 text-white rounded-full"
              />{" "}
              <span>
                {
                  "Encourager la participation aux activités et cultes de l'église"
                }
              </span>
            </p> */}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default InfosPage;

const CustomBreadcrumb = ({ name }: { name: string }) => {
  return (
    <Breadcrumb className="p-2 bg-gray-100">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
