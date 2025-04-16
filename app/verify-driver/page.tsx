"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { app } from "@/app/config/firebase-config";

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
            // const cookies = document.cookie.split(';');
            // const pendingDriverIdCookie = cookies.find(cookie => cookie.trim().startsWith('pendingDriverId='));
            // const userId = pendingDriverIdCookie ? pendingDriverIdCookie.split('=')[1] : null;

            // if (!userId) {
            //     toast.error("Session expirée, veuillez vous reconnecter");
            //     router.push("/auth/login");
            //     return;
            // }
            const cookies = document.cookie
                .split(';')
                .map(cookie => cookie.trim())
                .reduce((acc, cookie) => {
                    const [key, value] = cookie.split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);

            const userId = cookies['pendingDriverId'];

            console.log("Cookie content:", cookies);
            console.log("UserId from cookie:", userId);

            if (!userId) {
                toast.error("Session expirée, veuillez vous reconnecter");
                router.push("/auth/login");
                return;
            }

            const verificationRef = doc(db, "driverVerifications", userId);

            console.log("Entered code:", code);
            console.log("Document path:", `driverVerifications/${userId}`);
            const verificationDoc = await getDoc(verificationRef);

            console.log("Verification data:", verificationDoc.data());

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

    const requestNewCode = async () => {
        try {
            const cookies = document.cookie
                .split(';')
                .map(cookie => cookie.trim())
                .reduce((acc, cookie) => {
                    const [key, value] = cookie.split('=');
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, string>);

            const userId = cookies['pendingDriverId'];

            if (!userId) {
                toast.error("Session expirée, veuillez vous reconnecter");
                router.push("/auth/login");
                return;
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Sauvegarder le nouveau code
            await setDoc(doc(db, "driverVerifications", userId), {
                verificationCode,
                createdAt: new Date(),
                isVerified: false
            });

            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() as UserData;

            await fetch('/api/send-verification', {
                method: 'POST',
                body: JSON.stringify({
                    email: userData.email,
                    verificationCode,
                    name: userData.fullName
                })
            });

            toast.success("Un nouveau code vous a été envoyé par email");
        } catch (error) {
            toast.error("Erreur lors de l'envoi du code");
            console.error("Erreur lors de l'envoi du code:", error);
        }
    };

    // const handleResendCode = () => {
    //     verifyCode();
    // };

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
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white"
                disabled={isLoading}
            >
                {isLoading ? "Vérification en cours..." : "Vérifier"}
            </Button>

            {showWelcomeDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full m-4 animate-in fade-in duration-200">
                        <div className="text-center space-y-6">
                            <h2 className="text-2xl font-bold">
                                Bienvenue dans la famille des conducteurs ICC, {fullName}! 🎉
                            </h2>

                            <div className="text-gray-700 text-lg">
                                Votre engagement en tant que conducteur est précieux pour notre communauté. Que Dieu vous bénisse abondamment.
                            </div>

                        </div>
                    </div>
                </div>
            )}

            <p>
                <button
                    onClick={requestNewCode}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Demander un code de vérification
                </button>

                {/* Vous n&apos;avez pas reçu le code ? <button onClick={handleResendCode}>Renvoyer le code</button> */}
            </p>

        </div>
    );
}
