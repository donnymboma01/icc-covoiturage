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
import {
  signOut,
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
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
  writeBatch,
  getDoc,
} from "firebase/firestore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationBell from "./NotificationBell";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRidesCount, setActiveRidesCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [hasNewBookings, setHasNewBookings] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<string>("0");
  const [hasNewReservationStatus, setHasNewReservationStatus] = useState(false);
  const [newStatusCount, setNewStatusCount] = useState(0);
  const [latestReservationStatus, setLatestReservationStatus] = useState<
    "accepted" | "rejected" | "cancelled" | undefined
  >();

  const db = getFirestore(app);

  const { user, loading } = useAuth();
  const auth = getAuth(app);

  const handleDeleteAccount = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setOpenDialog(true);
    }, 100);
  };

  useEffect(() => {
    if (!user?.uid) return;

    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("passengerId", "==", user.uid),
      where("status", "in", ["accepted", "rejected", "cancelled"]),
      where("viewed", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Réservations nouvelles :", snapshot.docs.length);
      const newStatuses = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          status: data.status,
          timestamp: data.lastStatusUpdate?.toMillis() || 0,
        };
      });

      newStatuses.sort((a, b) => b.timestamp - a.timestamp);

      const count = newStatuses.length;

      if (count > 0) {
        setHasNewReservationStatus(true);
        setNewStatusCount(count);
        setLatestReservationStatus(
          newStatuses[0].status as "accepted" | "rejected" | "cancelled"
        );
      } else {
        setHasNewReservationStatus(false);
        setNewStatusCount(0);
        setLatestReservationStatus(undefined);
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  const handleDeleteAccountConfirm = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const password = prompt(
        "Pour confirmer, veuillez entrer votre mot de passe:"
      );
      if (!password) return;

      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      const activeBookingsQuery = query(
        collection(db, "bookings"),
        where("passengerId", "==", user.uid),
        where("status", "==", "accepted")
      );
      const activeBookingsSnapshot = await getDocs(activeBookingsQuery);

      const batch = writeBatch(db);
      for (const bookingDoc of activeBookingsSnapshot.docs) {
        const bookingData = bookingDoc.data();
        const rideRef = doc(db, "rides", bookingData.rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().availableSeats;
          batch.update(rideRef, {
            availableSeats: currentSeats + bookingData.seatsBooked,
          });
        }
      }
      await batch.commit();

      const ridesQuery = query(
        collection(db, "rides"),
        where("driverId", "==", user.uid)
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      for (const doc of ridesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("passengerId", "==", user.uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      for (const doc of bookingsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      const churchesQuery = query(
        collection(db, "churches"),
        where("createdBy", "==", user.uid)
      );
      const churchesSnapshot = await getDocs(churchesQuery);
      for (const doc of churchesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      await deleteDoc(doc(db, "users", user.uid));

      await user.delete();

      toast.success(
        "Compte supprimé avec succès. Nous espérons vous revoir bientôt !"
      );

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "auth/wrong-password"
      ) {
        toast.error("Mot de passe incorrect");
      } else {
        toast.error("Un problème est survenu lors de la suppression du compte");
      }
    } finally {
      setOpenDialog(false);
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

  const handleViewBookings = async () => {
    if (!user?.uid) return;

    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("passengerId", "==", user.uid),
      where("viewed", "==", false)
    );

    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { viewed: true });
    });

    await batch.commit();
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    const storedTimestamp = localStorage.getItem("lastViewedBookings") || "0";
    setLastViewedTimestamp(storedTimestamp);

    if (!user?.uid) return;

    const db = getFirestore();
    const ridesQuery = query(
      collection(db, "rides"),
      where("driverId", "==", user.uid)
    );

    getDocs(ridesQuery).then((ridesSnapshot) => {
      const rideIds = ridesSnapshot.docs.map((doc) => doc.id);

      if (rideIds.length === 0) return;

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("rideId", "in", rideIds),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const count = snapshot.docs.length;
        setBookingsCount(count);

        const hasNew = snapshot.docs.some((doc) => {
          const bookingTimestamp = doc.data().bookingDate?.toMillis() || 0;
          return bookingTimestamp > parseInt(lastViewedTimestamp);
        });

        setHasNewBookings(hasNew);
      });

      return () => unsubscribe();
    });
  }, [user, lastViewedTimestamp]);

  const handleBookingsClick = () => {
    const now = Date.now().toString();
    localStorage.setItem("lastViewedBookings", now);
    setLastViewedTimestamp(now);
    setHasNewBookings(false);
    setIsDrawerOpen(false);
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
      {/* <Link
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
      </Link> */}
      {/* <Link
        href="/dashboard/driver/bookings"
        onClick={handleBookingsClick}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          <MdOutlineDirectionsCar /> Les demandes de trajet{" "}
          {bookingsCount > 0 && (
            <span
              className={`ml-1 ${
                hasNewBookings ? "text-red-600 font-bold" : ""
              }`}
            >
              ({bookingsCount})
            </span>
          )}
        </Button>
      </Link> */}
      <Link
        href="/dashboard/driver/bookings"
        onClick={handleBookingsClick}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start relative group"
        >
          <NotificationBell count={bookingsCount} hasNew={hasNewBookings} />
          <span className="ml-2">Les demandes de trajet</span>
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

      {/* <Link
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
      </Link> */}
      <Link
        href="/dashboard/passanger/bookings"
        onClick={() => {
          setIsDrawerOpen(false);
          handleViewBookings();
        }}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          {hasNewReservationStatus ? (
            <NotificationBell
              count={newStatusCount}
              hasNew={true}
              type="reservation"
              status={latestReservationStatus}
            />
          ) : (
            <MdEventSeat />
          )}
          Mes réservations
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
      {/* <Link
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
      </Link> */}
      <Link
        href="/dashboard/passanger/bookings"
        onClick={() => setIsDrawerOpen(false)}
        className="w-full"
      >
        <Button
          variant="ghost"
          className="flex items-center gap-2 w-full justify-start"
        >
          {hasNewReservationStatus ? (
            <NotificationBell
              count={newStatusCount}
              hasNew={true}
              type="reservation"
              status={latestReservationStatus}
            />
          ) : (
            <MdEventSeat />
          )}
          Mes réservations
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
                className="flex items-center gap-2 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
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

  const DeleteAccountDialog = () => (
    <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
      <AlertDialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[200] max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Êtes-vous sûr de vouloir supprimer votre compte ?
          </AlertDialogTitle>
          <div className="space-y-2">
            <AlertDialogDescription>
              Cette action est irréversible. La suppression de votre compte
              entraînera :
            </AlertDialogDescription>
            <ul className="list-disc pl-4">
              <li>La suppression de tous vos trajets publiés</li>
              <li>La suppression de toutes vos réservations</li>
              <li>La suppression de vos églises enregistrées</li>
              <li>La perte définitive de votre profil</li>
            </ul>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setOpenDialog(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccountConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            <MdDelete className="text-white" />
            Supprimer définitivement
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (loading) return null;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-[100]">
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
                    {/* <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      onClick={handleDeleteAccount}
                    >
                      <MdDelete className="text-white" /> Supprimer mon compte
                    </Button> */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      className="flex items-center gap-2 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
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
      {openDialog && (
        <div
          className="fixed inset-0 bg-black/50 z-[150]"
          onClick={() => setOpenDialog(false)}
        />
      )}

      <DeleteAccountDialog />
    </nav>
  );
};
export default NavBar;
