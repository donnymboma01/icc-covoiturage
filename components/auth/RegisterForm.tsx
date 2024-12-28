/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
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
import { uploadImageToFirebase } from "@/utils/custom-functions";
import { cleanupFailedRegistration } from "@/utils/custom-functions";

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

  const initializeFirebase = async () => {
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
      isDriver: false,
      church: "",
      isStar: false,
      ministry: "",
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

  useEffect(() => {
    initializeFirebase();
  }, []);

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
    try {
      const path = `profile-pictures/${userId}/${file.name}`;
      const downloadURL = await uploadImageToFirebase(file, path);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  // const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
  //   await initializeFirebase();
  //   console.log("Form submitted with values:", values);
  //   console.log("Form validation state:", form.formState);
  //   let userCredential;

  //   try {
  //     setIsLoading(true);

  //     userCredential = await createUserWithEmailAndPassword(
  //       auth,
  //       values.email,
  //       values.password
  //     );

  //     let profilePictureUrl = "";
  //     if (values.profilePicture) {
  //       profilePictureUrl = await uploadImage(
  //         values.profilePicture,
  //         userCredential.user.uid
  //       );
  //     }

  //     const userDocument = {
  //       uid: userCredential.user.uid,
  //       email: values.email,
  //       fullName: values.fullName,
  //       phoneNumber: values.phoneNumber,
  //       isDriver: values.isDriver,
  //       createdAt: new Date(),
  //       churchIds: [values.church],
  //       isStar: values.isStar,
  //       ministry: values.isStar ? values.ministry : null,
  //       profilePicture: profilePictureUrl || null,
  //     };

  //     await setDoc(doc(db, "users", userCredential.user.uid), userDocument);

  //     if (values.isDriver && values.vehicle) {
  //       const vehicleDoc = {
  //         userId: userCredential.user.uid,
  //         ...values.vehicle,
  //         isActive: true,
  //       };
  //       await addDoc(collection(db, "vehicles"), vehicleDoc);
  //     }

  //     await auth.signOut();

  //     setTimeout(() => {
  //       toast.success("Inscription réussie");
  //       router.push("/auth/login");
  //     }, 1000);
  //   } catch (authError: any) {
  //     console.log("Detailed error:", authError);
  //     console.error("Registration error:", authError);
  //     if (userCredential?.user) {
  //       await cleanupFailedRegistration(userCredential.user);
  //     }
  //     switch (authError.code) {
  //       case "auth/email-already-in-use":
  //         toast.error(
  //           "L'adresse e-mail que vous avez saisie est déjà associée à un autre profil."
  //         );
  //         break;
  //       case "auth/weak-password":
  //         toast.error(
  //           "Le mot de passe est trop faible. Veuillez en choisir un plus sécurisé."
  //         );
  //         break;
  //       case "auth/invalid-email":
  //         toast.error(
  //           "L'adresse e-mail saisie est invalide. Veuillez vérifier et réessayer."
  //         );
  //         break;
  //       case "auth/network-request-failed":
  //         toast.error(
  //           "Erreur réseau. Vérifiez votre connexion internet et réessayez."
  //         );
  //         break;
  //       case "storage/object-not-found":
  //         toast.error(
  //           "Erreur lors du téléchargement de l'image. Veuillez réessayer."
  //         );
  //         break;
  //       default:
  //         console.error("Erreur d'authentification :", authError);
  //         toast.error(
  //           "Une erreur inattendue est survenue. Veuillez rafraichir la page et réessayer svp."
  //         );
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    await initializeFirebase();
    let userCredential;

    try {
      setIsLoading(true);

      userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let profilePictureUrl = "";
      if (values.profilePicture) {
        const path = `profile-pictures/${userCredential.user.uid}/${values.profilePicture.name}`;
        profilePictureUrl = await uploadImageToFirebase(
          values.profilePicture,
          path
        );
      }

      const userDocument = {
        uid: userCredential.user.uid,
        email: values.email,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        isDriver: values.isDriver,
        createdAt: new Date(),
        churchIds: [values.church],
        isStar: values.isStar,
        ministry: values.isStar ? values.ministry : null,
        profilePicture: profilePictureUrl || null,
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

      setTimeout(() => {
        toast.success("Inscription réussie");
        router.push("/auth/login");
      }, 1000);
    } catch (authError: any) {
      console.log("Detailed error:", authError);

      if (userCredential?.user) {
        await cleanupFailedRegistration(userCredential.user);
      }

      switch (authError.code) {
        case "auth/email-already-in-use":
          toast.error(
            "L'adresse e-mail que vous avez saisie est déjà associée à un autre profil."
          );
          break;
        case "auth/weak-password":
          toast.error(
            "Le mot de passe est trop faible. Veuillez en choisir un plus sécurisé."
          );
          break;
        case "auth/invalid-email":
          toast.error(
            "L'adresse e-mail saisie est invalide. Veuillez vérifier et réessayer."
          );
          break;
        case "auth/network-request-failed":
          toast.error(
            "Erreur réseau. Vérifiez votre connexion internet et réessayez."
          );
          break;
        case "storage/object-not-found":
          toast.error(
            "Erreur lors du téléchargement de l'image. Veuillez réessayer."
          );
          break;
        default:
          console.error("Erreur d'authentification :", authError);
          toast.error(
            "Une erreur inattendue est survenue. Veuillez rafraichir la page et réessayer."
          );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDriver) {
      form.setValue("vehicle.brand", "");
      form.setValue("vehicle.model", "");
      form.setValue("vehicle.color", "");
      form.setValue("vehicle.seats", 1);
      form.setValue("vehicle.licensePlate", "");
    }
  }, [isDriver, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("Form validation errors:", errors);
          toast.error("Veuillez remplir tous les champs correctement");
        })}
        className="space-y-6"
      >
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
                <p>
                  {" "}
                  <strong>
                    La photo de profil est obligatoire pour les conducteurs !
                  </strong>{" "}
                </p>
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
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
                <Input placeholder="0492 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isStar"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                Je suis S.T.A.R (Serviteur Travaillant Activement pour le
                Royaume)
              </FormLabel>
            </FormItem>
          )}
        />

        {form.watch("isStar") && (
          <FormField
            control={form.control}
            name="ministry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Votre ministère/département</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Chorale, Accueil, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                  <FormLabel>Marque du véhicule *</FormLabel>
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
                  <FormLabel>Modèle *</FormLabel>
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
                  <FormLabel>Couleur *</FormLabel>
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
                  <FormLabel>Nombre de places *</FormLabel>
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
                  <FormLabel>Plaque d'immatriculation *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: AB-123-CD" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-800">
              <span>
                Consentement loi RGPD (Réglement sur la Protection des Données)
              </span>
              <span className="transition group-open:rotate-180">
                <svg
                  fill="none"
                  height="24"
                  shapeRendering="geometricPrecision"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </span>
            </summary>
            <div className="mt-4 space-y-4 text-slate-600">
              <p>
                Les informations personnelles figurant dans le présent
                formulaire sont traitées avec confidentialité par Impact Centre
                Chrétien et conformément au règlement 2016/679 du Parlement
                européen et du Conseil du 27 avril 2016 relatif à la protection
                des personnes physiques à légard du traitement des données à
                caractère personnel et à la libre circulation de ces données
                (RGPD).
              </p>

              <p>
                Ces données personnelles sont nécessaires pour vous informer et
                vous inscrire aux différentes activités organisées par l'Eglise
                et à des fins de gestion interne. Elles seront conservées
                pendant la durée nécessaire pour atteindre les finalités visées
                ci-dessus.
              </p>

              <p>
                En tant que personne concernée, vous avez le droit, à tout
                moment, de consulter, de mettre à jour, de rectifier vos données
                personnelles ou d'en demander la suppression.
              </p>

              <p>
                Si vous souhaitez exercer un ou plusieurs des droits
                susmentionnés ou obtenir de plus amples informations sur la
                protection de vos données personnelles, vous pouvez envoyer un
                e-mail à l'adresse contact@impactcentrechretien.be.
              </p>

              <p>
                J'accepte que mes données personnelles récoltées via ce
                formulaire soient traitées par Impact Centre Chrétien pour les
                finalités d'information et d'inscriptions aux événements de
                l'Eglise et pour le suivi de la gestion interne;
              </p>

              <p>
                J'autorise la prise et la diffusion de photos ou de fragments
                d'images me concernant sur les sites web et les réseaux sociaux
                des églises connectées Impact Centre Chrétien.
              </p>

              <p>
                J'accepte de recevoir des informations de la part d'Impact
                Centre Chrétien.
              </p>
            </div>
          </details>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          onTouchStart={(e) => {
            console.log("Button touched");
            e.currentTarget.click();
          }}
        >
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
