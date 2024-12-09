/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import {
  MdHistory,
  MdLogin,
  MdMenu,
  MdSettings,
  MdExitToApp,
  MdDelete,
} from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  MdEventSeat,
} from "react-icons/md";
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  Timestamp,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRidesCount, setActiveRidesCount] = useState(0);
  const db = getFirestore(app);

  const router = useRouter();
  const { user, loading } = useAuth();
  const auth = getAuth(app);

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
      )
    ) {
      try {
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(doc(db, "users", user.uid));
        await user.delete();

        toast.success(
          "Compte supprimé avec succès. Nous espérons vous revoir bientôt !"
        );

        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
      } catch (error) {
        toast.error("Un problème est survenu lors de la suppression du compte");
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDrawerOpen(false);
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

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
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <Link
        href="/dashboard/driver"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdAddRoad /> Créer un trajet
        </Button>
      </Link>
      <Link
        href="/dashboard/driver/bookings"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdOutlineDirectionsCar /> Les demandes de trajet
        </Button>
      </Link>
      <Link
        href="/rides/history"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdHistory /> Mes trajets publiés{" "}
          <span className="ml-1">({activeRidesCount})</span>
        </Button>
      </Link>
      <Link
        href="/dashboard/passanger"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdBookmarkAdd /> Trouver un trajet
        </Button>
      </Link>
    </div>
  );

  const PassengerNavigation = () => (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <Link
        href="/dashboard/passanger"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdBookmarkAdd /> Trouver un trajet
        </Button>
      </Link>
      <Link
        href="/dashboard/passanger/bookings"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdEventSeat /> Mes réservations
        </Button>
      </Link>
    </div>
  );

  // const MobileDrawer = () => (
  //   <div
  //     className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
  //       isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  //     }`}
  //     onClick={() => setIsDrawerOpen(false)}
  //   >
  //     <div
  //       className={`fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${
  //         isDrawerOpen ? "translate-x-0" : "translate-x-full"
  //       }`}
  //       onClick={(e) => e.stopPropagation()}
  //     >
  //       {" "}
  //       <div
  //         className={`fixed right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${
  //           isDrawerOpen ? "translate-x-0" : "translate-x-full"
  //         }`}
  //       >
  //         <div className="flex flex-col h-full">
  //           <div className="p-4 border-b">
  //             <div className="flex justify-between items-center">
  //               <div className="flex items-center gap-2">
  //                 {user?.isDriver ? (
  //                   <MdDirectionsCar className="text-2xl" />
  //                 ) : (
  //                   <MdPerson className="text-2xl" />
  //                 )}
  //                 Bonjour,
  //                 <span className="text-blue-600 font-semibold">
  //                   {user?.displayName || user?.fullName}
  //                 </span>
  //               </div>
  //               <Button
  //                 variant="ghost"
  //                 size="sm"
  //                 onClick={() => setIsDrawerOpen(false)}
  //               >
  //                 <MdClose className="text-xl" />
  //               </Button>
  //             </div>
  //           </div>

  //           <div className="flex-1 overflow-y-auto p-4">
  //             {user?.isDriver ? <DriverNavigation /> : <PassengerNavigation />}
  //             <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
  //               <Button variant="ghost" className="w-full mt-4">
  //                 <CgProfile /> Profil
  //               </Button>
  //             </Link>
  //           </div>

  //           <div className="p-4 border-t">
  //             <div className="flex flex-col gap-2">
  //               <Button
  //                 variant="destructive"
  //                 size="sm"
  //                 onClick={handleDeleteAccount}
  //                 className="w-full"
  //               >
  //                 Supprimer mon compte
  //               </Button>
  //               <Button
  //                 onClick={handleSignOut}
  //                 variant="secondary"
  //                 className="w-full"
  //               >
  //                 Déconnexion
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
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
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex flex-col justify-start items-start gap-2">
              <div className="flex items-center gap-2">
                {user?.isDriver ? (
                  <MdDirectionsCar className="text-2xl" />
                ) : (
                  <MdPerson className="text-2xl" />
                )}
                <span className="text-blue-600 font-semibold">
                  Bonjour, {user?.displayName || user?.fullName}
                </span>
              </div>

              {user?.isDriver ? <DriverNavigation /> : <PassengerNavigation />}

              <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                <Button variant="ghost" className="w-full mt-4">
                  <CgProfile /> Profil
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col flex-1 justify-end p-4 border-t">
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <MdDelete className="text-white" /> Supprimer mon compte
              </Button>

              <Button
                onClick={handleSignOut}
                variant="secondary"
                className="w-full flex items-center gap-2"
              >
                <MdExitToApp className="text-gray-600" /> Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return null;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
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
                <Button variant="ghost">
                  {" "}
                  <CgProfile /> Profil
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MdSettings className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-58">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      onClick={handleDeleteAccount}
                    >
                      <MdDelete className="text-white" /> Supprimer mon compte
                    </Button>
                  </PopoverContent>
                </Popover>
                <Button onClick={handleSignOut} variant="secondary" size="sm">
                  Déconnexion
                </Button>
              </div>
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
