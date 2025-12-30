"use client";

import { useEffect, useState } from 'react';
import BookingsManagement from './components/BookingsManagement';
import DetailedStats from './components/DetailedStats';
import RidesTracking from './components/RidesTracking';
import { collection, getDocs, doc, updateDoc, getFirestore } from 'firebase/firestore';
//import { db } from '@/app/config/firebase-config';
import { app } from '../config/firebase-config';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Car, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersManagement from './components/UsersManagement';
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import ChurchManagement from './components/ChurchManagement';
import EventNotification from './components/EventNotification';

interface Stats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalBookings: number;
}
const AdminDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const db = getFirestore(app);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null && !loading) {
      router.push('/');
      return;
    }

    if (user && user.isAdmin !== true) {
      router.push('/');
      return;
    }

    async function fetchStats() {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs;
        const drivers = users.filter(user => user.data().isDriver);

        const ridesSnapshot = await getDocs(collection(db, 'rides'));
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));

        setStats({
          totalUsers: users.length,
          totalDrivers: drivers.length,
          totalRides: ridesSnapshot.size,
          totalBookings: bookingsSnapshot.size,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user, router, db]);

  if (!user || user.isAdmin !== true || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  const fixNegativeSeats = async () => {
    try {
      const ridesRef = collection(db, "rides");
      const ridesSnapshot = await getDocs(ridesRef);

      let fixed = 0;
      for (const rideDoc of ridesSnapshot.docs) {
        const rideData = rideDoc.data();
        if (rideData.availableSeats < 0) {
          await updateDoc(doc(db, "rides", rideDoc.id), {
            availableSeats: 0,
          });
          fixed++;
        }
      }
      alert(`Correction terminée. ${fixed} trajets corrigés.`);
    } catch (error) {
      console.error('Erreur lors de la correction des places:', error);
      alert('Une erreur est survenue lors de la correction des places.');
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-2 sm:p-4 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tableau de bord administrateur</h1>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex flex-wrap w-full gap-2 min-h-16">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="churches">Églises</TabsTrigger>
          <TabsTrigger value="rides">Trajets</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="notifications" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 dark:bg-gray-800 dark:text-gray-100">
              <div className="flex items-center space-x-4">
                <Users className="h-10 w-10 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilisateurs</p>
                  <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800 dark:text-gray-100">
              <div className="flex items-center space-x-4">
                <Car className="h-10 w-10 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conducteurs</p>
                  <h3 className="text-2xl font-bold">{stats.totalDrivers}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800 dark:text-gray-100">
              <div className="flex items-center space-x-4">
                <Calendar className="h-10 w-10 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trajets</p>
                  <h3 className="text-2xl font-bold">{stats.totalRides}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 dark:bg-gray-800 dark:text-gray-100">
              <div className="flex items-center space-x-4">
                <Calendar className="h-10 w-10 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Réservations</p>
                  <h3 className="text-2xl font-bold">{stats.totalBookings}</h3>
                </div>
              </div>
            </Card>
          </div>
          <DetailedStats />

          {/* <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Outils d'administration</h2>
            <Button onClick={fixNegativeSeats} variant="outline">
              Corriger les places négatives
            </Button>
          </div> */}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="churches" className="mt-6">
          <Card className="p-4 dark:bg-gray-800 dark:text-gray-100">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Gestion des églises</h2>
            <ChurchManagement />
          </Card>
        </TabsContent>

        <TabsContent value="rides" className="mt-6">
          <RidesTracking />
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <BookingsManagement />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <EventNotification />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <Card className="p-4 dark:bg-gray-800 dark:text-gray-100">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Gestion des retours</h2>

          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
