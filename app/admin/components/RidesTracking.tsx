"use client";

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
    getFirestore, 
    collection, 
    query,
     where, 
     getDocs, 
     Timestamp, 
     getDoc, 
     doc as firestoreDoc, 
     QueryDocumentSnapshot, 
     DocumentData 
    } 
    from 'firebase/firestore';
import { app } from '@/app/config/firebase-config';

interface Ride {
    id: string;
    driverId: string;
    churchId: string;
    departureAddress: string;
    arrivalAddress: string;
    departureTime: Date;
    status: string;
    availableSeats: number;
    bookedSeats: number;
    driverName?: string;
    churchName?: string;
}

interface RideStats {
    totalRides: number;
    activeRides: number;
    completedRides: number;
    totalSeatsOffered: number;
    totalSeatsBooked: number;
    ridesByChurch: { [key: string]: number };
}

const RidesTracking = () => {
    const [rides, setRides] = useState<Ride[]>([]);
    const [stats, setStats] = useState<RideStats>({
        totalRides: 0,
        activeRides: 0,
        completedRides: 0,
        totalSeatsOffered: 0,
        totalSeatsBooked: 0,
        ridesByChurch: {}
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterChurch, setFilterChurch] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);

    const db = getFirestore(app);

    useEffect(() => {
        fetchChurches();
        fetchRides();
    }, []);

    const fetchChurches = async () => {
        const churchesCollection = collection(db, 'churches');
        const churchesSnapshot = await getDocs(churchesCollection);
        const churchesData = churchesSnapshot.docs.map(churchDocSnapshot => ({
            id: churchDocSnapshot.id,
            name: churchDocSnapshot.data().name
        }));
        setChurches(churchesData);
    };

    const fetchRides = async () => {
        try {
            const ridesCollection = collection(db, 'rides');
            const ridesSnapshot = await getDocs(ridesCollection);
            const ridesData = await Promise.all(
                ridesSnapshot.docs.map(async (rideDocSnapshot: QueryDocumentSnapshot<DocumentData, DocumentData>): Promise<Ride> => {

                    const rideData = rideDocSnapshot.data();

                    let driverName = 'N/A';
                    if (rideData.driverId) {
                        const driverRef = firestoreDoc(db, 'users', rideData.driverId);
                        const driverSnap = await getDoc(driverRef);
                        if (driverSnap.exists()) {
                            const driverData = driverSnap.data() as { fullName: string };
                            driverName = driverData.fullName;
                        }
                    }


                    let churchName = 'N/A';
                    if (rideData.churchId) {
                        const churchRef = firestoreDoc(db, 'churches', rideData.churchId);
                        const churchSnap = await getDoc(churchRef);
                        if (churchSnap.exists()) {
                            const churchData = churchSnap.data() as { name: string };
                            churchName = churchData.name;
                        } else {
                            console.warn(`Church document not found for ID: ${rideData.churchId}`);
                        }
                    }

                    return {
                        id: rideDocSnapshot.id,
                        ...rideData,
                        departureTime: rideData.departureTime.toDate(),
                        availableSeats: rideData.availableSeats || 0,
                        bookedSeats: rideData.bookedSeats || 0,
                        driverName,
                        churchName
                    } as Ride;
                })
            );

            setRides(ridesData);
            calculateStats(ridesData);
        } catch (error) {
            console.error('Erreur lors de la récupération des trajets:', error);
        }
    };

    const calculateStats = (ridesData: Ride[]) => {
        const now = new Date();
        const stats: RideStats = {
            totalRides: ridesData.length,
            activeRides: ridesData.filter(ride => ride.departureTime > now && ride.status === 'active').length,
            completedRides: ridesData.filter(ride => ride.departureTime < now || ride.status === 'completed').length,
            totalSeatsOffered: ridesData.reduce((sum, ride) => sum + (ride.availableSeats || 0) + (ride.bookedSeats || 0), 0),
            totalSeatsBooked: ridesData.reduce((sum, ride) => sum + (ride.bookedSeats || 0), 0),
            ridesByChurch: {}
        };

        ridesData.forEach(ride => {
            if (ride.churchName) {
                stats.ridesByChurch[ride.churchName] = (stats.ridesByChurch[ride.churchName] || 0) + 1;
            }
        });

        setStats(stats);
    };

    const filteredRides = rides
        .filter(ride => {
            const matchesStatus = filterStatus === 'all' || (
                filterStatus === 'active' ? (ride.departureTime > new Date() && ride.status === 'active') :
                    filterStatus === 'completed' ? (ride.departureTime < new Date() || ride.status === 'completed') :
                        ride.status === filterStatus
            );
            const matchesChurch = filterChurch === 'all' || ride.churchId === filterChurch;
            const matchesSearch = searchTerm === '' ||
                ride.departureAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ride.arrivalAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ride.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesChurch && matchesSearch;
        })
        .sort((a, b) => b.departureTime.getTime() - a.departureTime.getTime());

    return (
        <div className="p-2 sm:p-4 space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Suivi des Trajets</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Total des trajets</h3>
                    <p className="text-xl sm:text-2xl">{stats.totalRides}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Trajets actifs</h3>
                    <p className="text-xl sm:text-2xl">{stats.activeRides}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Places offertes</h3>
                    <p className="text-xl sm:text-2xl">{stats.totalSeatsOffered}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Places réservées</h3>
                    <p className="text-xl sm:text-2xl">{stats.totalSeatsBooked}</p>
                </Card>
            </div>

            <div className="flex flex-col space-y-3">
                <Input
                    placeholder="Rechercher un trajet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="active">Actifs</SelectItem>
                            <SelectItem value="completed">Terminés</SelectItem>
                            <SelectItem value="cancelled">Annulés</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterChurch} onValueChange={setFilterChurch}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filtrer par église" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les églises</SelectItem>
                            {churches.map(church => (
                                <SelectItem key={church.id} value={church.id}>
                                    {church.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="-mx-2 sm:mx-0 overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Conducteur</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Église</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Départ</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Arrivée</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Date</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Places</TableHead>
                                    <TableHead className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium whitespace-nowrap">Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRides.map((ride) => (
                                    <TableRow key={ride.id}>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ride.driverName}</TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ride.churchName}</TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ride.departureAddress}</TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ride.arrivalAddress}</TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                            {ride.departureTime.toLocaleDateString()} {ride.departureTime.toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ride.bookedSeats}/{ride.availableSeats + ride.bookedSeats}</TableCell>
                                        <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm ${ride.status === 'active' ? 'bg-green-100 text-green-800' :
                                                ride.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {ride.status === 'active' ? 'Actif' :
                                                    ride.status === 'completed' ? 'Terminé' :
                                                        'Annulé'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <div className="mt-6 sm:mt-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Statistiques par église</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {Object.entries(stats.ridesByChurch).map(([church, count]) => (
                        <Card key={church} className="p-3 sm:p-4">
                            <h4 className="text-sm font-medium">{church}</h4>
                            <p className="text-lg sm:text-2xl">{count} trajets</p>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RidesTracking;