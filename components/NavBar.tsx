/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { MdHistory, MdLogin, MdMenu } from "react-icons/md";
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
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
// import NotificationBadge from "./NotificationBadge";

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRidesCount, setActiveRidesCount] = useState(0);
  const db = getFirestore(app);
  // const [notifications, setNotifications] = useState({
  //   reservations: 2,
  //   demandesTrajets: 3,
  // });

  const router = useRouter();
  const { user, loading } = useAuth();
  const auth = getAuth(app);

  // const handleSignOut = async () => {
  //   await signOut(auth);
  //   router.push("/auth/login");
  //   setIsDrawerOpen(false);
  // };
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDrawerOpen(false);
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // useEffect(() => {
  //   if (user) {
  //     fetchActiveRidesCount();
  //   }
  // }, [user]);
  useEffect(() => {
    if (!user?.uid) return;

    const ridesRef = collection(db, "rides");
    const now = new Date();
    const q = query(
      ridesRef,
      where("driverId", "==", user.uid),
      where("status", "==", "active"),
      where("departureTime", ">=", Timestamp.fromDate(now))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeRides = snapshot.docs.filter(
        (doc) => doc.data().availableSeats > 0
      );
      setActiveRidesCount(activeRides.length);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchActiveRidesCount = async () => {
    if (!user?.uid) return;

    const ridesRef = collection(db, "rides");
    const now = new Date();
    const q = query(
      ridesRef,
      where("driverId", "==", user.uid),
      where("status", "==", "active"),
      where("departureTime", ">=", Timestamp.fromDate(now))
    );

    const querySnapshot = await getDocs(q);
    const activeRides = querySnapshot.docs.filter(
      (doc) => doc.data().availableSeats > 0
    );
    setActiveRidesCount(activeRides.length);
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
      <Link href="/rides/history" onClick={() => setIsDrawerOpen(false)}>
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdHistory /> Mes trajets publiés{" "}
          <span className="ml-1">({activeRidesCount})</span>
        </Button>
      </Link>
      <Link href="/dashboard/passanger" onClick={() => setIsDrawerOpen(false)}>
        <Button variant="ghost" className="flex items-center gap-2 w-full">
          <MdBookmarkAdd /> Trouver un trajet
        </Button>
      </Link>
    </div>
  );

  // const DriverNavigation = () => (
  //   <div className="flex flex-col lg:flex-row gap-4">
  //     <Link href="/dashboard/driver" onClick={() => setIsDrawerOpen(false)}>
  //       <Button variant="ghost" className="flex items-center gap-2 w-full">
  //         <MdAddRoad /> Créer un trajet
  //       </Button>
  //     </Link>
  //     <Link
  //       href="/dashboard/driver/bookings"
  //       onClick={() => setIsDrawerOpen(false)}
  //     >
  //       <Button variant="ghost" className="flex items-center gap-2 w-full">
  //         <MdOutlineDirectionsCar /> Les demandes de trajet
  //       </Button>
  //     </Link>
  //     <Link href="/rides/history" onClick={() => setIsDrawerOpen(false)}>
  //       <Button variant="ghost" className="flex items-center gap-2 w-full">
  //         <MdHistory /> Mes trajets publiés
  //       </Button>
  //     </Link>
  //   </div>
  // );

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

  if (loading) return null;

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
