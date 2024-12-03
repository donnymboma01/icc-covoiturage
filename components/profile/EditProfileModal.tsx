/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  currentUser: any;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}: EditProfileModalProps) {
  const [userData, setUserData] = useState({
    fullName: currentUser?.fullName || "",
    phoneNumber: currentUser?.phoneNumber || "",
    profilePicture: currentUser?.profilePicture || "",
    vehicle: currentUser?.vehicle || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(userData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full sm:w-[90%] md:w-[600px] lg:w-[500px] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Modifier le profil
          </DialogTitle>
          {/* <Button
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            X
          </Button> */}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData.profilePicture || ""} />
            </Avatar>
          </div>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={userData.fullName}
                onChange={(e) =>
                  setUserData({ ...userData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Téléphone</Label>
              <Input
                id="phoneNumber"
                value={userData.phoneNumber}
                onChange={(e) =>
                  setUserData({ ...userData, phoneNumber: e.target.value })
                }
                required
              />
            </div>

            {currentUser?.isDriver && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Informations du véhicule</h3>
                <div>
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={userData.vehicle?.brand || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        vehicle: { ...userData.vehicle, brand: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    value={userData.vehicle?.model || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        vehicle: { ...userData.vehicle, model: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    value={userData.vehicle?.color || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        vehicle: { ...userData.vehicle, color: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="seats">Nombre de places</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max="9"
                    value={userData.vehicle?.seats || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        vehicle: {
                          ...userData.vehicle,
                          seats: parseInt(e.target.value),
                        },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licensePlate">Plaque d'immatriculation</Label>
                  <Input
                    id="licensePlate"
                    value={userData.vehicle?.licensePlate || ""}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        vehicle: {
                          ...userData.vehicle,
                          licensePlate: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="bottom-0 bg-white pt-4">
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  //   return (
  //     <Dialog open={isOpen} onOpenChange={onClose}>
  //       <DialogContent className="sm:max-w-[425px]">
  //         <DialogHeader>
  //           <DialogTitle>Modifier le profil</DialogTitle>
  //         </DialogHeader>
  //         <form onSubmit={handleSubmit} className="space-y-4">
  //           <div className="flex justify-center mb-4">
  //             <Avatar className="h-24 w-24">
  //               <AvatarImage
  //                 src={userData.profilePicture || "/default-avatar.png"}
  //               />
  //             </Avatar>
  //           </div>
  //           <div className="grid gap-4">
  //             <div>
  //               <Label htmlFor="fullName">Nom complet</Label>
  //               <Input
  //                 id="fullName"
  //                 value={userData.fullName}
  //                 onChange={(e) =>
  //                   setUserData({ ...userData, fullName: e.target.value })
  //                 }
  //                 required
  //               />
  //             </div>
  //             <div>
  //               <Label htmlFor="phoneNumber">Téléphone</Label>
  //               <Input
  //                 id="phoneNumber"
  //                 value={userData.phoneNumber}
  //                 onChange={(e) =>
  //                   setUserData({ ...userData, phoneNumber: e.target.value })
  //                 }
  //                 required
  //               />
  //             </div>
  //             {/* <div>
  //               <Label htmlFor="profilePicture">Photo de profil (URL)</Label>
  //               <Input
  //                 id="profilePicture"
  //                 value={userData.profilePicture}
  //                 onChange={(e) =>
  //                   setUserData({ ...userData, profilePicture: e.target.value })
  //                 }
  //               />
  //             </div> */}
  //           </div>
  //           <DialogFooter>
  //             <Button type="submit">Enregistrer</Button>
  //           </DialogFooter>
  //         </form>
  //       </DialogContent>
  //     </Dialog>
  //   );
}
