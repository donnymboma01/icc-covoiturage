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
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  UserCredential,
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
  updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { uploadImageToFirebase } from "@/utils/custom-functions";
import { cleanupFailedRegistration } from "@/utils/custom-functions";
import { storage } from "../../app/config/firebase-config";
import { resend } from "@/lib/resend";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const storage = getStorage(app, "icc-covoitturage.firebasestorage.app");
    console.log("Starting upload with storage bucket:", storage?.app?.options?.storageBucket);
    const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    console.log("Storage bucket:", storage.app.options.storageBucket);
    return await getDownloadURL(snapshot.ref);
  };

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

      let profilePictureUrl = "";
      if (values.profilePicture) {
        console.log("Début de téléchargement de l'image...");
        try {
          profilePictureUrl = await uploadImage(
            values.profilePicture,
            userCredential.user.uid
          );
          console.log("Image upload successful:", profilePictureUrl);
        } catch (uploadError) {
          console.error("Upload error details:", uploadError);
          throw new Error("Erreur lors du téléchargement de la photo de profil");
        }
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
        vehicle: values.isDriver ? values.vehicle : null,
        isVerified: false,
        driverStatus: values.isDriver ? "pending" : null
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userDocument);

      if (values.isDriver && values.vehicle) {
        const vehicleRef = doc(db, "vehicles", userCredential.user.uid);
        await setDoc(vehicleRef, {
          ...values.vehicle,
          userId: userCredential.user.uid,
          isActive: true
        });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        await setDoc(doc(db, "driverVerifications", userCredential.user.uid), {
          userId: userCredential.user.uid,
          verificationCode,
          isVerified: false,
          createdAt: new Date()
        });

        document.cookie = `pendingDriverId=${userCredential.user.uid}; path=/; max-age=86400; SameSite=Strict`;

        const emailResponse = await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            verificationCode,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error("Erreur lors de l'envoi de l'email de vérification");
        }

        console.log("Email verification response:", await emailResponse.json());
      } else {
       
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await setDoc(doc(db, "passengerVerifications", userCredential.user.uid), {
          userId: userCredential.user.uid,
          verificationCode,
          isVerified: false,
          createdAt: new Date()
        });
        
        document.cookie = `pendingPassengerId=${userCredential.user.uid}; path=/; max-age=86400; SameSite=Strict`;
        
        const emailResponse = await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            verificationCode,
            isPassenger: true
          }),
        });
        
        if (!emailResponse.ok) {
          throw new Error("Erreur lors de l'envoi de l'email de vérification");
        }
      }

      toast.success("Inscription réussie !");
      if (values.isDriver) {
        router.push("/verify-driver");
      } else {
        router.push("/verify-passenger");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (userCredential?.user) {
        await cleanupFailedRegistration(userCredential.user);
      }

      let errorMessage = "Une erreur est survenue lors de l'inscription";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Cet email est déjà utilisé";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email invalide";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Le mot de passe est trop faible";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Erreur de connexion réseau";
      } else if (error.message.includes("photo de profil")) {
        errorMessage = "Erreur lors du téléchargement de la photo de profil";
      } else if (error.message.includes("email de vérification")) {
        errorMessage = "Erreur lors de l'envoi de l'email de vérification";
      }

      toast.error(errorMessage);
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
                  className={`h-32 w-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 transition-all duration-300 ${profilePreview
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
              <FormLabel className="text-foreground">Nom complet</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Votre nom complet"
                  className="bg-background text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="exemple@email.com"
                  className="bg-background text-foreground"
                />
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
              <FormLabel className="text-foreground">Mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="bg-background text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
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
              <FormLabel className="text-foreground">Confirmer le mot de passe</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="bg-background text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
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
              <FormLabel className="text-foreground">Numéro de téléphone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="+33 6 12 34 56 78"
                  className="bg-background text-foreground"
                />
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
                  <FormLabel className="text-foreground">Marque du véhicule</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Marque"
                      className="bg-background text-foreground"
                    />
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
                  <FormLabel className="text-foreground">Modèle du véhicule</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Modèle"
                      className="bg-background text-foreground"
                    />
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
                  <FormLabel className="text-foreground">Couleur du véhicule</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Couleur"
                      className="bg-background text-foreground"
                    />
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
                  <FormLabel className="text-foreground">Plaque d'immatriculation</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="AB-123-CD"
                      className="bg-background text-foreground"
                    />
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
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
