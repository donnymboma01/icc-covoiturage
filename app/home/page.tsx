/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MdInfo } from "react-icons/md";
// import { BiBuildingHouse } from "react-icons/bi";
import { GrUserAdmin } from "react-icons/gr";
import Covoiturage from "../../public/images/covoiturage.png";
import LogoICC from "../../public/images/image.png";

// const items = [
//   { id: 1, title: "Plus d'informations" },
//   { id: 2, title: "Espace Administateur" },
// ];

const Home = () => {
  return (
    <main className="relative text-white flex flex-col md:flex-row gap-10 justify-center items-center  h-screen md:px-2">
      <Image
        alt="background"
        src={Covoiturage}
        placeholder="blur"
        quality={100}
        fill
        sizes="100vw"
        className="object-cover -z-10"
      />

      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-blue-900/50 to-black/50 -z-5"></div>
      <div className="px-2 absolute text-center flex flex-col items-center">
        <Image
          alt="logo"
          src={LogoICC}
          quality={100}
          className="bg-gradient-to-tr from-yellow-600/40 to-transparent p-2 rounded-full text-center z-5 w-1/5 md:w-1/6 "
        />

        <h5 className="relative  mb-3 font-bold max-md:flex max-md:flex-col items-start mt-4">
          <span className="text-white absolute z-10 text-sm md:text-lg left-24 -top-4">
            Partageons la route, partageons notre foi.
          </span>
          <p className="text-5xl max-md:text-3xl text-dark-green">
            Ensemble
            <strong className="text-white">
              {", servons notre communauté."}
            </strong>
          </p>
        </h5>

        

        <div className=" w-full flex justify-center gap-4">
          <Link
            className="mt-24 max-md:mt-16 underline hover:text-yellow-400 max-md:text-xs"
            href="/infos"
          >
            <div className="flex flex-col justify-center items-center">
              <MdInfo className="text-orange-400" size={30} />

              <p>{"Plus d'informations"}</p>
            </div>
          </Link>
          {/* <Link
            href="/benelux"
            className="mt-24  max-md:mt-16  underline hover:text-yellow-400 max-md:text-xs"
          >
            <div className="flex flex-col justify-center items-center">
              <BiBuildingHouse className="text-sky-400" size={30} />

              <p>Nos campus du Benelux</p>
            </div>
          </Link> */}
          <Link
            className="mt-24  max-md:mt-16  underline hover:text-yellow-400 max-md:text-xs"
            href="/auth/register"
          >
            <div className="flex flex-col justify-center items-center">
              <GrUserAdmin className="text-slate-400" size={30} />

              <p>S'inscrire</p>
            </div>
          </Link>
        </div>

        {/* <div className="w-full h-full flex items-center py-32 gap-8 ">
          <div className="w-2/5">
            <div className="w-full md:h-full relative flex flex-col items-center justify-center ">
              <div className="px-2 absolute text-center flex flex-col items-center">
                <h1 className="relative  mb-3 font-bold max-md:flex max-md:flex-col items-start mt-4">
                  <span className="text-white absolute z-10 text-sm md:text-lg left-24 -top-4 ">
                    Partageons la route, partageons notre foi.
                  </span>
                  <p className="text-6xl max-md:text-6xl text-orange-400">
                    Ensemble
                    <strong className="text-white">
                      {" servons notre communauté"}
                    </strong>
                  </p>
                </h1>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </main>
  );
};

export default Home;
