/* eslint-disable @typescript-eslint/no-unused-vars */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { MdClose } from "react-icons/md";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  currentUser: any;
  churches: { id: string; name: string }[];
}

export function EditProfileModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  churches,
}: EditProfileModalProps) {
  console.log("Churches in modal:", churches);
  const [userData, setUserData] = useState({
    fullName: currentUser?.fullName || "",
    phoneNumber: currentUser?.phoneNumber || "",
    profilePicture: currentUser?.profilePicture || "",
    vehicle: currentUser?.vehicle || null,
    email: currentUser?.email || "",
    churchId: currentUser?.churchIds?.[0] || "", // Get first church ID from array
  });
  const [open, setOpen] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log("Submitting userData:", userData);

  //   const updatedUserData = {
  //     ...userData,
  //     churchIds: userData.churchId ? [userData.churchId] : [],
  //   };

  //   try {
  //     await onSubmit(updatedUserData);
  //     onClose();
  //   } catch (error) {
  //     console.error("Erreur lors de la modification du profil: ", error);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...userData,
      churchIds: userData.churchId ? [userData.churchId] : [],
    };

    try {
      await onSubmit(dataToSubmit);
      toast.success("Modifications enregistrées");
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la modification");
    }
  };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // Email validation
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(userData.email)) {
  //     toast.error("Veuillez entrer une adresse email valide");
  //     return;
  //   }

  //   try {
  //     await onSubmit(userData);
  //     toast.success("Modifications enregistrées avec succès");
  //     onClose();
  //   } catch (error: any) {
  //     if (error.code === "auth/requires-recent-login") {
  //       toast.error(
  //         "Pour des raisons de sécurité, veuillez vous reconnecter pour modifier votre email"
  //       );
  //     } else {
  //       toast.error("Erreur lors de la modification du profil");
  //     }
  //   }
  // };

  const handleChurchChange = (value: string) => {
    console.log("Selected church ID:", value);
    console.log("New church ID selected:", value);
    setUserData((prev) => ({
      ...prev,
      churchId: value,
      churchIds: [value], // Update both churchId and churchIds
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-x-0 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] sm:max-w-[600px] md:max-w-[800px] max-h-[90vh] bg-white rounded-lg shadow-lg z-[200] flex flex-col">
        <DialogHeader className="sticky top-0 z-[201] px-4 py-3 bg-white border-b">
          <DialogTitle className="text-xl font-semibold">
            Modifier son profil
          </DialogTitle>
          {/* <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100"
          >
            <MdClose className="h-5 w-5" />
          </button> */}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-6">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-blue-100">
                <AvatarImage src={userData.profilePicture || ""} />
              </Avatar>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Nom complet</Label>
                      <Input
                        id="fullName"
                        value={userData.fullName}
                        onChange={(e) =>
                          setUserData({ ...userData, fullName: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Téléphone</Label>
                      <Input
                        id="phoneNumber"
                        value={userData.phoneNumber}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            phoneNumber: e.target.value,
                          })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) =>
                        setUserData({ ...userData, email: e.target.value })
                      }
                      required
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="church">Église</Label>
                    <div>
                      <Label htmlFor="church">Église</Label>
                      <Select
                        value={userData.churchId}
                        onValueChange={(value) => {
                          console.log("Church selected:", value);
                          setUserData((prev) => ({
                            ...prev,
                            churchId: value,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez une église" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[300]">
                          {churches.map((church) => (
                            <SelectItem key={church.id} value={church.id}>
                              {church.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* <Select
                      value={userData.churchId}
                      onValueChange={handleChurchChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez votre église" />
                      </SelectTrigger>
                      <SelectContent>
                        {churches?.map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                  </div>
                </div>
              </div>

              {currentUser?.isDriver && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Informations du véhicule
                  </h3>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="brand">Marque</Label>
                        <Input
                          id="brand"
                          value={userData.vehicle?.brand || ""}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              vehicle: {
                                ...userData.vehicle,
                                brand: e.target.value,
                              },
                            })
                          }
                          required
                          className="mt-1"
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
                              vehicle: {
                                ...userData.vehicle,
                                model: e.target.value,
                              },
                            })
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="color">Couleur</Label>
                        <Input
                          id="color"
                          value={userData.vehicle?.color || ""}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              vehicle: {
                                ...userData.vehicle,
                                color: e.target.value,
                              },
                            })
                          }
                          required
                          className="mt-1"
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
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="licensePlate">
                          Plaque d'immatriculation
                        </Label>
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
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="bottom-0 z-[201] px-4 py-3 bg-white border-t mt-4">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
