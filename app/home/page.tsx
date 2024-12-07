/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MdInfo } from "react-icons/md";
import { FaCar } from "react-icons/fa"; // Import de l'icône voiture
import Covoiturage from "../../public/images/covoiturage.png";
import LogoICC from "../../public/images/image.png";

const Home = () => {
  return (
    <main className="relative text-white flex flex-col md:flex-row items-center justify-center h-screen w-full overflow-hidden">
      <Image
        alt="background"
        src={Covoiturage}
        placeholder="blur"
        quality={100}
        fill
        sizes="100vw"
        className="object-cover -z-10"
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/70 to-black/70 -z-5"></div>

      <div className="absolute flex flex-col items-center px-4 text-center">
        <Image
          alt="logo"
          src={LogoICC}
          quality={100}
          className="bg-gradient-to-tr from-yellow-600/40 to-transparent p-3 rounded-full z-5 w-24 md:w-28"
        />

        <div className="relative mt-6">
          <p className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg font-medium text-white/90 shadow-md mb-2 md:mb-4">
            Partageons la route, partageons notre foi.
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mt-8">
            Ensemble{" "}
            <span className="text-yellow-400">servons notre communauté.</span>
          </h1>
        </div>

        <div className="flex justify-center items-center gap-6 mt-12 md:mt-16">
          <Link
            href="/infos"
            className="flex items-center gap-2 text-sm md:text-base underline hover:text-yellow-400 transition-colors duration-300"
          >
            <MdInfo className="text-orange-400" size={30} />
            <span>Plus d'infos</span>
          </Link>

          <Link
            href="/dashboard/passanger"
            className="flex items-center gap-2 text-sm md:text-base underline hover:text-yellow-400 transition-colors duration-300"
          >
            <FaCar className="text-green-400" size={30} />
            <span>Trouver un trajet</span>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
