"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/app/config/firebase-config";
import { FaWhatsapp } from "react-icons/fa";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

interface Vehicle {
    brand: string;
    model: string;
    color: string;
    seats: number;
    licensePlate: string;
}

export interface UserData {
    ministry: string | boolean | undefined;
    uid: string;
    profilePicture?: string;
    fullName: string;
    isDriver: boolean;
    email: string;
    phoneNumber: string;
    vehicle?: Vehicle;
    fcmToken?: string | null;
    churchIds?: string[];
    isStar: string | boolean | undefined;
    isVerified?: boolean;
}

export default function VerifyDriver() {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
    const [fullName, setFullName] = useState("");
    const router = useRouter();
    const db = getFirestore(app);

    const verifyCode = async () => {
        if (!code || code.length !== 6) {
            toast.error("Veuillez entrer un code valide à 6 chiffres");
            return;
        }

        setIsLoading(true);
        try {
            const cookies = document.cookie.split(';');
            const pendingDriverIdCookie = cookies.find(cookie => cookie.trim().startsWith('pendingDriverId='));
            const userId = pendingDriverIdCookie ? pendingDriverIdCookie.split('=')[1] : null;

            if (!userId) {
                toast.error("Session expirée, veuillez vous reconnecter");
                router.push("/auth/login");
                return;
            }

            const verificationRef = doc(db, "driverVerifications", userId);
            const verificationDoc = await getDoc(verificationRef);

            if (!verificationDoc.exists()) {
                toast.error("Aucune vérification en attente");
                return;
            }

            const verificationData = verificationDoc.data();

            if (String(verificationData.verificationCode).trim() !== String(code).trim()) {
                toast.error("Code incorrect");
                return;
            }

            const createdAt = verificationData.createdAt.toDate();
            const now = new Date();
            if (now.getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000) {
                toast.error("Code expiré, veuillez demander un nouveau code");
                return;
            }

            await updateDoc(verificationRef, {
                isVerified: true
            });

            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() as UserData;

            await updateDoc(userRef, {
                driverStatus: "verified",
                isVerified: true
            });

            setFullName(userData.fullName);
            setShowWelcomeDialog(true);

            toast.success("Compte conducteur vérifié avec succès!");

            document.cookie = "pendingDriverId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            setTimeout(() => {
                setShowWelcomeDialog(false);
                router.push("/profile");
            }, 7000);

        } catch (error) {
            console.error("Erreur de vérification:", error);
            toast.error("Une erreur est survenue lors de la vérification");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = () => {
        verifyCode();
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6">Vérification du compte conducteur</h1>
            <p className="mb-4 text-gray-600">
                Entrez le code à 6 chiffres reçu par email pour activer votre compte conducteur
            </p>
            <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mb-4"
                maxLength={6}
                type="text"
            />
            <Button
                onClick={verifyCode}
                className="w-full"
                disabled={isLoading}
            >
                {isLoading ? "Vérification..." : "Vérifier"}
            </Button>

            {showWelcomeDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full m-4 animate-in fade-in duration-200">
                        <div className="text-center space-y-6">
                            <h2 className="text-2xl font-bold">
                                Bienvenue dans la famille des conducteurs ICC, {fullName}! 🎉
                            </h2>

                            <div className="text-gray-700 text-lg">
                                Votre engagement en tant que conducteur est précieux pour notre communauté. Pour une meilleure coordination, rejoignez notre groupe WhatsApp dédié aux conducteurs ICC!
                            </div>

                            <a
                                href="https://chat.whatsapp.com/EwRXbJyf6Gj6e4otwMNuiE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
                            >
                                <FaWhatsapp className="text-2xl" />
                                Rejoindre le groupe WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <p>
                Vous n&apos;avez pas reçu le code ? <button onClick={handleResendCode}>Renvoyer le code</button>
            </p>

        </div>
    );
}
