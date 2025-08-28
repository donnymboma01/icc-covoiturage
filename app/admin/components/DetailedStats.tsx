"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/app/config/firebase-config';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Ride {
    id: string;
    driverId: string;
    departureTime: Date;
    churchId: string;
    availableSeats: number;
    departureAddress: string;
    arrivalAddress: string;
    status: 'active' | 'cancelled' | 'completed';
    isRecurring?: boolean;
    frequency?: 'weekly' | 'monthly';
    price?: number;
    waypoints?: string[];
    displayPhoneNumber?: boolean;
    meetingPointNote?: string;
}

interface Booking {
    id: string;
    rideId: string;
    passengerId: string;
    bookingDate: Date;
    status: 'pending' | 'confirmed' | 'cancelled';
    seatsBooked: number;
    specialNotes?: string;
    driverResponseNote?: string; 
    passengerName?: string;
    driverName?: string;
    departureAddress?: string;
    arrivalAddress?: string;
    departureTime?: Date;
}

interface User {
    id: string;
    createdAt: Date;
    isDriver?: boolean;
    isAdmin?: boolean;
}

interface Stats {
    dailyRides: { date: string; count: number }[];
    ridesByChurch: { name: string; value: number }[];
    bookingStatus: { name: string; value: number }[];
    userGrowth: { month: string; newUsers: number }[];
    userRoles: { name: string; value: number }[];
    monthlyStats: {
        totalRides: number;
        totalBookings: number;
        totalSeats: number;
        occupancyRate: number;
        totalUsers: number;
        totalDrivers: number;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DetailedStats = () => {
    const [stats, setStats] = useState<Stats>({
        dailyRides: [],
        ridesByChurch: [],
        bookingStatus: [],
        userGrowth: [],
        userRoles: [],
        monthlyStats: {
            totalRides: 0,
            totalBookings: 0,
            totalSeats: 0,
            occupancyRate: 0,
            totalUsers: 0,
            totalDrivers: 0,
        }
    });

    const db = getFirestore(app);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const now = new Date();
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });


            const ridesQuery = query(
                collection(db, 'rides'),
                where('departureTime', '>=', monthStart),
                where('departureTime', '<=', monthEnd)
            );
            const ridesSnapshot = await getDocs(ridesQuery);
            const rides = ridesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                departureTime: doc.data().departureTime.toDate()
            }));


            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('bookingDate', '>=', monthStart),
                where('bookingDate', '<=', monthEnd)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookings = bookingsSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                bookingDate: doc.data().bookingDate.toDate()
            }));

            const churchesSnapshot = await getDocs(collection(db, 'churches'));
            const churches = churchesSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));


            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0),
                    isDriver: data.isDriver ?? false,
                    isAdmin: data.isAdmin ?? false,
                } as User;
            });

            const dailyRides = daysInMonth.map(date => ({
                date: format(date, 'dd/MM', { locale: fr }),
                count: rides.filter(ride => isSameDay(ride.departureTime, date)).length
            }));

            const ridesByChurch = churches.map(church => ({
                name: church.name,
                value: rides.filter(ride => (ride as any).churchId === church.id).length
            })).filter(stat => stat.value > 0);

            const bookingStatus = [
                {
                    name: 'En attente',
                    value: bookings.filter(booking => (booking as any).status === 'pending').length
                },
                {
                    name: 'Confirmées',
                    value: bookings.filter(booking =>
                        (booking as any).status === 'confirmed' ||
                        (booking as any).status === 'acceptée' ||
                        (booking as any).status === 'accepted'
                    ).length
                },
                {
                    name: 'Annulées',
                    value: bookings.filter(booking => (booking as any).status === 'cancelled').length
                },
                {
                    name: 'Refusées',
                    value: bookings.filter(booking =>
                        (booking as any).status === 'rejected' ||
                        (booking as any).status === 'refusée'
                    ).length
                }
            ];

            const totalRides = rides.length;
            const totalBookings = bookings.length;
            const totalSeats = rides.reduce((sum, ride) => sum + ((ride as any).availableSeats || 0), 0);
            const occupancyRate = totalSeats > 0 ?
                (bookings.reduce((sum, booking) => sum + ((booking as any).seatsBooked || 0), 0) / totalSeats) * 100 : 0;


            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const userGrowthData: { [key: string]: number } = {};
            for (let i = 0; i < 6; i++) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = format(monthDate, 'yyyy-MM', { locale: fr });
                userGrowthData[monthKey] = 0;
            }
            usersData.forEach(user => {
                if (user.createdAt >= sixMonthsAgo) {
                    const monthKey = format(user.createdAt, 'yyyy-MM', { locale: fr });
                    if (userGrowthData[monthKey] !== undefined) {
                        userGrowthData[monthKey]++;
                    }
                }
            });
            const userGrowth = Object.entries(userGrowthData)
                .map(([month, newUsers]) => ({ month: format(new Date(month + '-01'), 'MMM yy', { locale: fr }), newUsers }))
                .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()); 


            const userRoles = [
                { name: 'Conducteurs', value: usersData.filter(user => user.isDriver).length },
                { name: 'Administrateurs', value: usersData.filter(user => user.isAdmin).length },
                { name: 'Standards', value: usersData.filter(user => !user.isDriver && !user.isAdmin).length },
            ];

            const totalUsers = usersData.length;
            const totalDrivers = usersData.filter(user => user.isDriver).length;

            setStats({
                dailyRides,
                ridesByChurch,
                bookingStatus,
                userGrowth,
                userRoles,
                monthlyStats: {
                    totalRides,
                    totalBookings,
                    totalSeats,
                    occupancyRate,
                    totalUsers,
                    totalDrivers
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
        }
    };

    return (
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
           

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Total des trajets</h3>
                    <p className="text-xl sm:text-2xl">{stats.monthlyStats.totalRides}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Total des réservations</h3>
                    <p className="text-xl sm:text-2xl">{stats.monthlyStats.totalBookings}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Places disponibles</h3>
                    <p className="text-xl sm:text-2xl">{stats.monthlyStats.totalSeats}</p>
                </Card>
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold">Taux d'occupation</h3>
                    <p className="text-xl sm:text-2xl">{stats.monthlyStats.occupancyRate.toFixed(1)}%</p>
                </Card> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Évolution des inscriptions (6 derniers mois)</h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="newUsers" name="Nouveaux utilisateurs" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Répartition des rôles utilisateurs</h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.userRoles}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.userRoles.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <h3 className="text-lg sm:text-xl font-bold mt-6 sm:mt-8">Statistiques des trajets et réservations (mois en cours)</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Trajets par jour (mois en cours)</h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyRides}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Nombre de trajets"
                                    stroke={COLORS[0]}
                                    strokeWidth={2}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* <Card className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Répartition des trajets par église (mois en cours)</h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.ridesByChurch}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="value" name="Nombre de trajets" fill={COLORS[1]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card> */}

                {/* <Card className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Statut des réservations (mois en cours)</h3>
                    <div className="h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.bookingStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.bookingStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card> */}
            </div>
        </div>
    );
};

export default DetailedStats;