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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc, 
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore'; 
import { app } from '@/app/config/firebase-config';
import { PlusCircle, Edit3, Trash2, Search, Building } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge'; 
import { Card } from '@/components/ui/card';

interface Church {
  id: string;
  name: string;
  address: string;
  createdBy: string;
  createdAt?: Date;
  usageCount: number;
  userCount?: number;
}

const ChurchManagement = () => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); 
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [newChurch, setNewChurch] = useState({ name: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const db = getFirestore(app);

  useEffect(() => {
    fetchChurches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChurches = async () => {
    console.log('Début de fetchChurches (version simplifiée)');
    try {
      const churchesCollection = collection(db, 'churches');
      const churchesSnapshot = await getDocs(churchesCollection);
      console.log(`Nombre d'églises brutes récupérées de Firestore (version simplifiée): ${churchesSnapshot.size}`);

      if (churchesSnapshot.empty) {
        console.log('Aucune église trouvée dans la collection Firestore (version simplifiée).');
        setChurches([]);
        return;
      }

      const churchesData = churchesSnapshot.docs.map((churchDoc) => {
        const church = churchDoc.data();
        console.log(`Traitement de l'église ID (version simplifiée): ${churchDoc.id}, Nom: ${church.name}, Données brutes:`, JSON.stringify(church));

        let createdAtDate: Date | undefined = undefined;
        if (church.createdAt) {
          if (typeof church.createdAt.toDate === 'function') { 
            createdAtDate = church.createdAt.toDate();
          } else {
            const parsedDate = new Date(church.createdAt); 
            if (!isNaN(parsedDate.getTime())) {
              createdAtDate = parsedDate;
            } else {
              console.warn(`Church ${churchDoc.id}: createdAt field ('${church.createdAt}') is not a Firestore Timestamp and could not be parsed into a valid Date.`);
            }
          }
        }

        return {
          id: churchDoc.id,
          name: church.name || 'Nom manquant',
          address: church.address || 'Adresse manquante',
          createdBy: church.createdBy || 'Créateur inconnu',
          createdAt: createdAtDate,
          usageCount: 0,
          userCount: 0
        } as Church;
      });

      console.log('Données finales des églises (version simplifiée) avant tri et mise à jour de l état:', churchesData);
      setChurches(churchesData.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      }));
      console.log('État des églises mis à jour (version simplifiée).');
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération simplifiée des églises:', error);
      toast.error('Erreur lors de la récupération simplifiée des églises. Vérifiez la console pour plus de détails.');
    }
  };

  const handleAddChurch = async () => {
    try {
      if (!newChurch.name || !newChurch.address) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }

      const churchRef = doc(collection(db, 'churches'));
      await setDoc(churchRef, {
        name: newChurch.name,
        address: newChurch.address,
        createdAt: new Date(),
        createdBy: 'admin' 
      });

      setIsAddDialogOpen(false);
      setNewChurch({ name: '', address: '' });
      toast.success('Église ajoutée avec succès');
      fetchChurches();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'église:', error);
      toast.error('Erreur lors de l\'ajout de l\'église');
    }
  };

  const handleEditChurch = async () => {
    try {
      if (!selectedChurch || !selectedChurch.name || !selectedChurch.address) {
        toast.error('Veuillez remplir tous les champs');
        return;
      }

      const churchDataToUpdate: Partial<Church> = {
        name: selectedChurch.name,
        address: selectedChurch.address,
      };

      await updateDoc(doc(db, 'churches', selectedChurch.id), churchDataToUpdate);

      setIsEditDialogOpen(false);
      setSelectedChurch(null);
      toast.success('Église modifiée avec succès');
      fetchChurches();
    } catch (error) {
      console.error('Erreur lors de la modification de l\'église:', error);
      toast.error('Erreur lors de la modification de l\'église');
    }
  };

  const handleDeleteChurch = async (churchId: string) => {
    try {
      
      await deleteDoc(doc(db, 'churches', churchId));
      toast.success('Église supprimée avec succès');
      fetchChurches();
      setIsDeleteDialogOpen(false); 
      setSelectedChurch(null); 
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'église:', error);
      toast.error('Erreur lors de la suppression de l\'église');
    }
  };

  const openDeleteDialog = (church: Church) => {
    setSelectedChurch(church);
    setIsDeleteDialogOpen(true);
  };

  const filteredChurches = churches.filter(church =>
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Contenu de filteredChurches avant rendu:', filteredChurches);

  return (
    <div className="p-2 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full dark:text-gray-100">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-100 flex items-center">
          <Building className="mr-2 h-6 sm:h-7 w-6 sm:w-7 text-blue-600 dark:text-blue-400" /> Gestion des Églises
        </h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600">
          <PlusCircle className="mr-2 h-5 w-5" /> Ajouter une église
        </Button>
      </div>

      <div className="relative w-full dark:text-gray-100">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Rechercher par nom ou adresse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
        />
      </div>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow className="dark:border-gray-700">
                  <TableHead className="text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Nom de l'Église</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="dark:divide-gray-700">
                {filteredChurches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={1} className="text-center text-gray-500 dark:text-gray-400 py-10">
                      Aucune église trouvée.
                      {searchTerm && " Essayez de modifier votre recherche."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredChurches.map((church) => (
                  <TableRow key={church.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:border-gray-700">
                    <TableCell className="font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{church.name}</TableCell>
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

export default ChurchManagement;