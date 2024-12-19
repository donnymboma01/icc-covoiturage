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
import { MdClose, MdAddAPhoto } from "react-icons/md";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
    churchId: currentUser?.churchIds?.[0] || "",
    isStar: currentUser?.isStar || false,
    ministry: currentUser?.ministry || "",
  });
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // Le bon code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...userData,
      churchIds: userData.churchId ? [userData.churchId] : [],
    };

    try {
      await onSubmit(dataToSubmit);
      window.location.reload();
      toast.success("Modifications enregistrées");
      onClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  // const handleImageUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   // Créer l'aperçu
  //   const previewUrl = URL.createObjectURL(file);
  //   setImagePreview(previewUrl);

  //   try {
  //     const storage = getStorage();
  //     const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);

  //     await uploadBytes(storageRef, file);
  //     const downloadURL = await getDownloadURL(storageRef);

  //     setUserData((prev) => ({
  //       ...prev,
  //       profilePicture: downloadURL,
  //     }));

  //     toast.success("Photo de profil mise à jour");
  //     console.log("La photo de profil a été modifiée avec succès");
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //     toast.error("Erreur lors du téléchargement de l'image");
  //   }
  // };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          let width = img.width;
          let height = img.height;
          const maxSize = 1200;

          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Échec de la compression"));
            },
            "image/jpeg",
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      const loadingToast = toast.loading("Téléchargement en cours...");

      const storage = getStorage();
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(
        storage,
        `profile-pictures/${currentUser.uid}/${fileName}`
      );

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setUserData((prev) => ({
        ...prev,
        profilePicture: downloadURL,
      }));

      URL.revokeObjectURL(previewUrl);
      toast.dismiss(loadingToast);
      toast.success("Photo mise à jour avec succès");
    } catch (error) {
      console.error("Probleme de telechargement: ", error);
      toast.error("Erreur lors du téléchargement. Veuillez réessayer.");
    }
  };

  const handleChurchChange = (value: string) => {
    console.log("Selected church ID:", value);
    console.log("New church ID selected:", value);
    setUserData((prev) => ({
      ...prev,
      churchId: value,
      churchIds: [value],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-x-0 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] sm:max-w-[600px] md:max-w-[800px] max-h-[90vh] bg-white rounded-lg shadow-lg z-[200] flex flex-col">
        <DialogHeader className="sticky top-0 z-[201] px-4 py-3 bg-white border-b">
          <DialogTitle className="text-xl font-semibold">
            Modifier son profil
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-6 relative">
              <div className="relative group">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-blue-100">
                  <AvatarImage
                    src={imagePreview || userData.profilePicture || ""}
                  />
                </Avatar>

                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <MdAddAPhoto size={20} />
                  <input
                    type="file"
                    id="profile-picture"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
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

                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        id="isStar"
                        checked={userData.isStar}
                        onChange={(e) =>
                          setUserData({ ...userData, isStar: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isStar">
                        Je suis S.T.A.R (Serviteur Travaillant Activement pour
                        le Royaume)
                      </Label>
                    </div>

                    {userData.isStar && (
                      <div>
                        <Label htmlFor="ministry">Ministère/Département</Label>
                        <Input
                          id="ministry"
                          value={userData.ministry}
                          onChange={(e) =>
                            setUserData({
                              ...userData,
                              ministry: e.target.value,
                            })
                          }
                          placeholder="Ex: Chorale, Accueil, etc."
                          className="mt-1"
                        />
                      </div>
                    )}
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
