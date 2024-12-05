/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import Image from "next/image";
import Logo from "../public/images/image.png";
import CarHeader from "../public/images/header2.png";
import { MdLogin } from "react-icons/md";
import { useRouter } from "next/navigation";

type PageLayoutProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

const PageLayout = ({ title, description, children }: PageLayoutProps) => {
  const router = useRouter();

  return (
    <div className="md:container p-1">
      <div className="bg-black/50 rounded-lg overflow-hidden relative max-sm:p-1  flex flex-col max-sm:h-[70px] h-[150px] w-full ">
        <div className="  overflow-hidden justify-between flex items-center gap-4 text-3xl md:p-10 w-full ">
          <Image
            onClick={() => router.push("/home")}
            alt="home"
            src={Logo}
            quality={100}
            className="hover:cursor-pointer bg-gradient-to-tr from-yellow-200/40 p-2 to-transparent -2 bg-black rounded-full top-2 left-1 text-center z-5 max-sm:w-1/6 md:w-1/12 "
          />
          <Image
            alt="home"
            src={CarHeader}
            quality={100}
            className="absolute top-0 left-0 rounded-lg -z-10 "
          />
          <p className=" text-orange-400 max-sm:text-2xl text-6xl">
            {"ICC "}
            <span className="text-white font-semibold"> Covoiturage</span>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4 mt-4 h-full ">
        <div className="col-span-5 rounded-lg bg-transparent md:p-2">
          {children}
        </div>
      </div>
      <div className="fixed w-full bottom-0 left-0"></div>
    </div>
  );
};

export default PageLayout;
