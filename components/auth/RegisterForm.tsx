/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
// import fs from "fs/promises";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { MdAddAPhoto, MdPhotoCamera } from "react-icons/md";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "../../app/config/firebase-config";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { RegisterSchema } from "@/lib/schemas";
import { toast } from "sonner";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface VehicleDoc {
  userId: string;
  brand: string;
  model: string;
  color: string;
  seats: number;
  licensePlate: string;
  isActive: boolean;
}

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phoneNumber: "",
      isDriver: false,
      church: "",
      profilePicture: undefined,
      vehicle: {
        brand: "",
        model: "",
        color: "",
        seats: 1,
        licensePlate: "",
      },
    },
  });

  const isDriver = form.watch("isDriver");

  // useEffect(() => {
  //   const fetchChurches = async () => {
  //     const churchesCollection = collection(db, "churches");
  //     const churchesSnapshot = await getDocs(churchesCollection);
  //     const churchesList = churchesSnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       name: doc.data().name,
  //     }));
  //     setChurches(churchesList);
  //   };

  //   fetchChurches();
  // }, [db]);
  // Replace the existing useEffect with this improved version
  useEffect(() => {
    const fetchChurches = async () => {
      const churchesCollection = collection(db, "churches");
      const churchesSnapshot = await getDocs(churchesCollection);

      const churchMap = new Map();

      churchesSnapshot.docs.forEach((doc) => {
        const church = doc.data();
        const normalizedName = church.name.trim().toLowerCase();

        if (!churchMap.has(normalizedName)) {
          churchMap.set(normalizedName, {
            id: doc.id,
            name: church.name.trim(),
          });
        }
      });

      const uniqueChurches = Array.from(churchMap.values());
      uniqueChurches.sort((a, b) => a.name.localeCompare(b.name));
      setChurches(uniqueChurches);
    };

    fetchChurches();
  }, [db]);

  const handleProfilePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 10MB");
        return;
      }

      const localUrl = URL.createObjectURL(file);
      setProfilePreview(localUrl);
      form.setValue("profilePicture", file);
      return () => URL.revokeObjectURL(localUrl);
    }
  };

  const uploadImage = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.filepath;
  };

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    try {
      setIsLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      let profilePictureUrl = "";
      if (values.profilePicture) {
        profilePictureUrl = await uploadImage(
          values.profilePicture,
          userCredential.user.uid
        );
      }

      const churchRef = await addDoc(collection(db, "churches"), {
        name: values.church,
        adminUserIds: [],
        contactEmail: "",
        contactPhone: "",
        address: "",
      });

      const userDocument = {
        uid: userCredential.user.uid,
        email: values.email,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        isDriver: values.isDriver,
        createdAt: new Date(),
        churchIds: [churchRef.id],
        profilePicture: profilePictureUrl || null
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userDocument);

      if (values.isDriver && values.vehicle) {
        const vehicleDoc = {
          userId: userCredential.user.uid,
          ...values.vehicle,
          isActive: true,
        };
        await addDoc(collection(db, "vehicles"), vehicleDoc);
      }

      await auth.signOut();
      toast.success("Inscription réussie");
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Une erreur est survenue, veuillez essayer plus tard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormItem>
          <FormLabel>Photo de profil</FormLabel>
          <FormControl>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div
                  className={`h-32 w-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 transition-all duration-300 ${
                    profilePreview
                      ? "border-none"
                      : "hover:border-primary hover:bg-gray-100"
                  }`}
                >
                  {profilePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={profilePreview}
                        alt="Profile Preview"
                        width={128}
                        height={128}
                        className="w-full h-full rounded-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <MdPhotoCamera className="text-white text-3xl" />
                      </div>
                    </div>
                  ) : (
                    <MdAddAPhoto className="text-gray-400 text-3xl group-hover:text-primary transition-colors" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicture}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1 text-sm text-muted-foreground">
                <p className="font-medium">Choisissez une photo de profil</p>
                <p>JPG, PNG. Taille maximale 10MB</p>
              </div>
            </div>
          </FormControl>
        </FormItem>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entrez votre nom complet</FormLabel>
              <FormControl>
                <Input placeholder="Nom complet" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="church"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sélectionnez votre église</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une église" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une église" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
                <Input placeholder="+32 4 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDriver"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Je souhaite être conducteur</FormLabel>
            </FormItem>
          )}
        />

        {isDriver && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="vehicle.brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marque du véhicule</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Renault" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modèle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Clio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Noir" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle.seats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de places</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle.licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plaque d'immatriculation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: AB-123-CD" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
