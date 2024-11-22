"use client";
import React, { useState } from "react";
import { MdLogin, MdMenu } from "react-icons/md";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/hooks/useAuth";
import { app } from "@/app/config/firebase-config";
import { signOut, getAuth } from "firebase/auth";
import {
  MdDirectionsCar,
  MdPerson,
  MdAddRoad,
  MdOutlineDirectionsCar,
  MdBookmarkAdd,
  MdClose,
} from "react-icons/md";

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const auth = getAuth(app);

  if (loading) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
    setIsDrawerOpen(false);
  };

  const DriverNavigation = () => (
    <div className="flex flex-col lg:flex-row gap-4">
      <Link href="/dashboard/driver" onClick={() => setIsDrawerOpen(false)}>
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdAddRoad /> Créer un trajet
        </Button>
      </Link>
      <Link
        href="/dashboard/driver/bookings"
        onClick={() => setIsDrawerOpen(false)}
      >
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdOutlineDirectionsCar /> Les demandes de trajet
        </Button>
      </Link>
    </div>
  );

  const PassengerNavigation = () => (
    <div className="flex flex-col lg:flex-row gap-4">
      <Link href="/dashboard/passanger" onClick={() => setIsDrawerOpen(false)}>
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdBookmarkAdd /> Trouver un trajet
        </Button>
      </Link>
      <Link
        href="/dashboard/passanger/bookings"
        onClick={() => setIsDrawerOpen(false)}
      >
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdPerson /> Mes réservations
        </Button>
      </Link>
    </div>
  );

  const MobileDrawer = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
        isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setIsDrawerOpen(false)}
    >
      <div
        className={`fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {" "}
        <div
          className={`fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {user?.isDriver ? (
                    <MdDirectionsCar className="text-2xl" />
                  ) : (
                    <MdPerson className="text-2xl" />
                  )}
                  Bonjour,
                  <span className="text-blue-600 font-semibold">
                    {user?.displayName || user?.fullName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <MdClose className="text-xl" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {user?.isDriver ? <DriverNavigation /> : <PassengerNavigation />}
              <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                <Button variant="ghost" className="w-full mt-4">
                  Profil
                </Button>
              </Link>
            </div>

            <div className="p-4 border-t">
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              {user.isDriver ? (
                <MdDirectionsCar className="text-2xl" />
              ) : (
                <MdPerson className="text-2xl" />
              )}
              Bonjour,
              <span className="text-blue-600 font-semibold">
                {user.displayName || user.fullName}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {user.isDriver ? <DriverNavigation /> : <PassengerNavigation />}
              <Link href="/profile">
                <Button variant="ghost">Profil</Button>
              </Link>
              <Button onClick={handleSignOut} variant="secondary" size="sm">
                Déconnexion
              </Button>
            </div>

            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setIsDrawerOpen(true)}
            >
              <MdMenu className="text-2xl" />
            </Button>
          </>
        ) : (
          <div className="ml-auto">
            <Link href="/auth/login">
              <Button>
                Se connecter <MdLogin />
              </Button>
            </Link>
          </div>
        )}
      </div>
      <MobileDrawer />
    </nav>
  );
};

export default NavBar;
