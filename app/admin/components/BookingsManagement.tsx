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
// import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { app } from '@/app/config/firebase-config';
import { toast } from 'sonner';

interface Booking {
    id: string;
    rideId: string;
    passengerId: string;
    bookingDate: Date;
    status: string;
    seatsBooked: number;
    specialNotes?: string;
    passengerName?: string;
    driverName?: string;
    departureAddress?: string;
    arrivalAddress?: string;
    departureTime?: Date;
}

import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Users, Ban, ThumbsUp, ThumbsDown } from 'lucide-react';

interface BookingStats {
    totalBookings: number;
    pendingBookings: number;
    acceptedBookings: number;
    rejectedBookings: number;
    cancelledBookings: number;
    totalSeatsBooked: number;
}

const BookingsManagement = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState<BookingStats>({
        totalBookings: 0,
        pendingBookings: 0,
        acceptedBookings: 0,
        rejectedBookings: 0,
        cancelledBookings: 0,
        totalSeatsBooked: 0
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const db = getFirestore(app);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const bookingsCollection = collection(db, 'bookings');
            const bookingsSnapshot = await getDocs(bookingsCollection);
            const bookingsData = await Promise.all(
                bookingsSnapshot.docs.map(async (bookingDoc) => {
                    const booking = bookingDoc.data();

                    let passengerName = 'N/A';
                    if (booking.passengerId) {
                        try {
                            const passengerRef = doc(db, 'users', booking.passengerId);
                            const passengerSnap = await getDoc(passengerRef);
                            if (passengerSnap.exists()) {
                                passengerName = passengerSnap.data().fullName;
                            }
                        } catch (e) {
                            console.error(`Erreur récupération passager ${booking.passengerId}:`, e);
                        }
                    }

                    let driverName = 'N/A';
                    let rideDetails: any = {};

                    if (booking.rideId) {
                        try {
                            const rideRef = doc(db, 'rides', booking.rideId);
                            const rideSnap = await getDoc(rideRef);
                            if (rideSnap.exists()) {
                                const rideData = rideSnap.data();
                                rideDetails = {
                                    departureAddress: rideData.departureAddress,
                                    arrivalAddress: rideData.arrivalAddress,
                                    departureTime: rideData.departureTime?.toDate ? rideData.departureTime.toDate() : undefined,
                                };
                                if (rideData.driverId) {
                                    try {
                                        const driverRef = doc(db, 'users', rideData.driverId);
                                        const driverSnap = await getDoc(driverRef);
                                        if (driverSnap.exists()) {
                                            driverName = driverSnap.data().fullName;
                                        }
                                    } catch (e) {
                                        console.error(`Erreur récupération conducteur ${rideData.driverId}:`, e);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Erreur récupération trajet ${booking.rideId}:`, e);
                        }
                    }

                    return {
                        id: bookingDoc.id,
                        ...booking,
                        bookingDate: booking.bookingDate.toDate(),
                        passengerName,
                        driverName,
                        ...rideDetails
                    } as Booking;
                })
            );

            setBookings(bookingsData);
            calculateStats(bookingsData);
        } catch (error) {
            console.error('Erreur lors de la récupération des réservations:', error);
            toast.error('Erreur lors de la récupération des réservations');
        }
    };

    const calculateStats = (bookingsData: Booking[]) => {
        const stats: BookingStats = {
            totalBookings: bookingsData.length,
            pendingBookings: bookingsData.filter(booking => booking.status === 'pending').length,
            acceptedBookings: bookingsData.filter(booking =>
                booking.status === 'confirmed' ||
                booking.status === 'acceptée' ||
                booking.status === 'accepted'
            ).length,
            rejectedBookings: bookingsData.filter(booking => booking.status === 'rejected' || booking.status === 'refusée').length,
            cancelledBookings: bookingsData.filter(booking => booking.status === 'cancelled').length,
            totalSeatsBooked: bookingsData.reduce((sum, booking) => sum + (booking.seatsBooked || 0), 0)
        };
        setStats(stats);
    };

    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'bookings', bookingId), {
                status: newStatus
            });
            toast.success('Statut de la réservation mis à jour');
            fetchBookings();
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const filteredBookings = bookings
        .filter(booking => {
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'confirmed'
                    ? (booking.status === 'confirmed' || booking.status === 'acceptée' || booking.status === 'accepted')
                    : booking.status === filterStatus);
            const matchesSearch = searchTerm === '' ||
                booking.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.departureAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.arrivalAddress?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => b.bookingDate.getTime() - a.bookingDate.getTime());

    return (
        <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 dark:bg-gray-900">
            <h2 className="text-xl sm:text-2xl font-bold dark:text-gray-100">Gestion des Réservations</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
                <Card className="p-3 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 dark:text-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">TOTAL RÉSERVATIONS</h3>
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalBookings}</p>
                </Card>
                <Card className="p-3 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:text-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300">EN ATTENTE</h3>
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pendingBookings}</p>
                </Card>
                <Card className="p-3 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 dark:text-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300">ACCEPTÉES</h3>
                        <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">{stats.acceptedBookings}</p>
                </Card>
                <Card className="p-3 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 dark:text-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">REFUSÉES</h3>
                        <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">{stats.rejectedBookings}</p>
                </Card>
                <Card className="p-3 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 dark:text-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">ANNULÉES</h3>
                        <Ban className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.cancelledBookings}</p>
                </Card>
            </div>

            <div className="flex flex-col space-y-3 sm:space-y-4">
                <Input
                    placeholder="Rechercher une réservation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="acceptée">Acceptée</SelectItem>
                        <SelectItem value="rejected">Refusée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="-mx-2 sm:mx-0 overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-100 dark:bg-gray-700">
                                <TableRow>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Passager</TableHead>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Conducteur</TableHead>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Trajet</TableHead>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Date Réservation</TableHead>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Places</TableHead>
                                    <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredBookings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-3 sm:px-6 py-8 sm:py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                            <AlertCircle className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                                            Aucune réservation ne correspond à vos filtres.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredBookings.map((booking) => (
                                    <TableRow key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{booking.passengerName}</TableCell>
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">{booking.driverName}</TableCell>
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                            <div>{booking.departureAddress} → {booking.arrivalAddress}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {booking.departureTime ? new Date(booking.departureTime).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 dark:text-gray-300">{new Date(booking.bookingDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center text-gray-600 dark:text-gray-300">{booking.seatsBooked}</TableCell>
                                        <TableCell className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                                            <Badge
                                                variant={
                                                    booking.status === 'acceptée' || booking.status === 'confirmed' ? 'default' :
                                                        booking.status === 'pending' ? 'secondary' :
                                                            booking.status === 'rejected' || booking.status === 'refusée' ? 'destructive' :
                                                                booking.status === 'cancelled' ? 'outline' :
                                                                    'outline'
                                                }
                                                className={`capitalize text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold dark:text-gray-100 ${booking.status === 'acceptée' || booking.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-500' :
                                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-500' :
                                                            booking.status === 'rejected' || booking.status === 'refusée' ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500' :
                                                                booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500' :
                                                                    'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500'
                                                    }`}
                                            >
                                                {booking.status === 'confirmed' ? 'Acceptée' :
                                                    booking.status === 'refusée' ? 'Refusée' :
                                                        booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingsManagement;