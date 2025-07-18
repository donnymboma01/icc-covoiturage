"use client";

import { useState, useEffect, useMemo } from 'react'; 
import { collection, getDocs, doc, updateDoc, deleteDoc, getFirestore, query, where, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, UserX, UserCog, Trash2, Edit3, CheckCircle, XCircle, UserPlus, UserMinus, Search } from 'lucide-react'; // Added Search icon
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { app } from '@/app/config/firebase-config';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    uid: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    isDriver: boolean;
    isAdmin: boolean;
    isVerified: boolean;
    isStar: boolean;
    profilePicture?: string;
    churchId?: string;
    churchIds?: string[];
    churchName?: string;
    createdAt?: Date;
}

interface Church {
    id: string;
    name: string;
}

const UsersManagement = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(20);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const db = getFirestore(app);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [churchFilter, setChurchFilter] = useState('all');
    const [churches, setChurches] = useState<Church[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchChurches();
    }, []);

    const fetchChurches = async () => {
        try {
            const churchesSnapshot = await getDocs(collection(db, 'churches'));
            const churchesData = churchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Church));
            setChurches(churchesData.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Erreur lors de la récupération des églises:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = await Promise.all(usersSnapshot.docs.map(async userDoc => {
                const userData = userDoc.data();
                let churchName = 'Pas d\'église';
                let churchIdToFetch: string | undefined = undefined;

                if (Array.isArray(userData.churchIds) && userData.churchIds.length > 0 && userData.churchIds[0] && userData.churchIds[0].trim() !== '') {
                    churchIdToFetch = userData.churchIds[0];
                }
                else if (userData.churchId && typeof userData.churchId === 'string' && userData.churchId.trim() !== '') {
                    churchIdToFetch = userData.churchId;
                }

                if (churchIdToFetch) {
                    try {
                        const churchRef = doc(db, 'churches', churchIdToFetch);
                        const churchSnap = await getDoc(churchRef);
                        if (churchSnap.exists()) {
                            churchName = churchSnap.data().name;
                        } else {
                            console.warn(`Church document not found for ID: ${churchIdToFetch} for user ${userDoc.id}`);
                        }
                    } catch (err) {
                        console.error(`Error fetching church document for ID: ${churchIdToFetch} for user ${userDoc.id}`, err);
                    }
                }

                return {
                    uid: userDoc.id,
                    ...userData,
                    churchName,
                    churchIds: Array.isArray(userData.churchIds) ? userData.churchIds : (userData.churchId ? [userData.churchId] : []),
                    createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : undefined,
                };
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAdmin = async (user: User) => {
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                isAdmin: !user.isAdmin,
            });

            setUsers(prevUsers => prevUsers.map(u => u.uid === user.uid ? { ...u, isAdmin: !user.isAdmin } : u));
        } catch (error) {
            console.error('Erreur lors de la modification du statut admin:', error);
        }
    };

    const handleToggleVerification = async (user: User) => {
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                isVerified: !user.isVerified,
            });

            setUsers(prevUsers => prevUsers.map(u => u.uid === user.uid ? { ...u, isVerified: !user.isVerified } : u));
        } catch (error) {
            console.error('Erreur lors de la modification de la vérification:', error);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await deleteDoc(doc(db, 'users', selectedUser.uid));
            setUsers(users.filter(u => u.uid !== selectedUser.uid));
            setShowDeleteDialog(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    const filteredAndSortedUsers = useMemo(() => {
        return users
            .filter(user => {
                const matchesSearchTerm =
                    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchesRole =
                    roleFilter === 'all' ||
                    (roleFilter === 'driver' && user.isDriver) ||
                    (roleFilter === 'admin' && user.isAdmin) ||
                    (roleFilter === 'standard' && !user.isDriver && !user.isAdmin);

                const matchesChurch =
                    churchFilter === 'all' ||
                    (user.churchIds && user.churchIds.includes(churchFilter)) ||
                    user.churchId === churchFilter;

                return matchesSearchTerm && matchesRole && matchesChurch;
            })
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [users, searchTerm, roleFilter, churchFilter]);

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredAndSortedUsers.slice(indexOfFirstUser, indexOfLastUser);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p className="text-lg">Chargement des utilisateurs...</p></div>;
    }

    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-100 mb-2 sm:mb-0">Gestion des utilisateurs</h2>
                <Badge variant="secondary" className="text-xs sm:text-sm py-0.5 sm:py-1 px-2 sm:px-3 dark:bg-gray-700 dark:text-gray-300">{filteredAndSortedUsers.length} utilisateurs affichés</Badge>
            </div>

            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-4 sm:items-center mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-700 shadow rounded-lg">
                <div className="relative w-full sm:flex-1">
                    <Input
                        placeholder="Rechercher (nom, email, tél...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm dark:bg-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-300" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] text-sm dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            <SelectValue placeholder="Filtrer par rôle" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                            <SelectItem value="all">Tous les rôles</SelectItem>
                            <SelectItem value="driver">Conducteurs</SelectItem>
                            <SelectItem value="admin">Administrateurs</SelectItem>
                            <SelectItem value="standard">Utilisateurs Standards</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={churchFilter} onValueChange={setChurchFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] text-sm dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            <SelectValue placeholder="Filtrer par église" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                            <SelectItem value="all">Toutes les églises</SelectItem>
                            {churches.map(church => (
                                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                            ))}
                            <SelectItem value="no-church">Pas d'église</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="-mx-3 sm:mx-0 bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden mt-4 sm:mt-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-100 dark:bg-gray-600">
                            <TableRow>
                                <TableHead className="w-[200px] sm:w-[250px] text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">Utilisateur</TableHead>
                                <TableHead className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">Contact</TableHead>
                                <TableHead className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">Église</TableHead>
                                <TableHead className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">Rôles</TableHead>
                                <TableHead className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentUsers.map((user) => (
                                <TableRow key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <TableCell className="px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                                <AvatarImage src={user.profilePicture} alt={user.fullName} />
                                                <AvatarFallback>{user.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">{user.fullName}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                            <div>{user.email}</div>
                                            <div className="text-gray-500 dark:text-gray-400">{user.phoneNumber || "N/A"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        {user.churchName || 'N/A'}
                                    </TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex flex-col space-y-1 items-start">
                                            {user.isAdmin && <Badge variant="default" className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5">Admin</Badge>}
                                            {user.isDriver && <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1.5 py-0.5">Conducteur</Badge>}
                                            {user.isStar && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-[10px] sm:text-xs px-1.5 py-0.5">Star</Badge>}
                                            {(!user.isAdmin && !user.isDriver && !user.isStar) && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">Utilisateur</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 sm:px-4 py-2 sm:py-3">
                                        {user.isVerified ? (
                                            <Badge variant="default" className="bg-green-500 text-white flex items-center text-[10px] sm:text-xs px-1.5 py-0.5 cursor-pointer" onClick={() => handleToggleVerification(user)}>
                                                <ShieldCheck className="mr-1 h-3 w-3" /> Vérifié
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 flex items-center text-[10px] sm:text-xs px-1.5 py-0.5 cursor-pointer" onClick={() => handleToggleVerification(user)}>
                                                <ShieldAlert className="mr-1 h-3 w-3" /> Non Vérifié
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredAndSortedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8 sm:py-10 text-sm">
                                        Aucun utilisateur ne correspond à vos critères de recherche/filtre.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-4 pb-4">
                        <Button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                        >
                            Précédent
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                onClick={() => paginate(page)}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                        >
                            Suivant
                        </Button>
                    </div>
                )}
            </div>

            {showDeleteDialog && selectedUser && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'utilisateur {selectedUser.fullName} ({selectedUser.email}) ? Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedUser(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
};

export default UsersManagement;