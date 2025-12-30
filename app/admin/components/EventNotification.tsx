"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/hooks/useAuth";
import { Mail, Loader2, CheckCircle, AlertCircle, Users, Send, Eye, Car, User } from "lucide-react";

interface SendResult {
    sent: number;
    failed: number;
    total: number;
    failedEmails?: string[];
}

interface EmailConfig {
    eventTitle: string;
    emailSubject: string;
    greeting: string;
    mainMessage: string;
    callToAction: string;
    buttonText: string;
}

type RecipientType = "drivers" | "passengers";

const EventNotification = () => {
    const { user } = useAuth();
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<SendResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [recipientType, setRecipientType] = useState<RecipientType>("drivers");

    const [config, setConfig] = useState<EmailConfig>({
        eventTitle: "",
        emailSubject: "",
        greeting: "Bonjour",
        mainMessage: "",
        callToAction: "",
        buttonText: recipientType === "drivers" ? "Proposer un trajet" : "Trouver un trajet",
    });

    const updateConfig = (field: keyof EmailConfig, value: string) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const handleRecipientTypeChange = (type: RecipientType) => {
        setRecipientType(type);
        setConfig((prev) => ({
            ...prev,
            buttonText: type === "drivers" ? "Proposer un trajet" : "Trouver un trajet",
        }));
        setResult(null);
        setError(null);
    };

    const isFormValid = () => {
        return (
            config.eventTitle.trim() !== "" &&
            config.emailSubject.trim() !== "" &&
            config.mainMessage.trim() !== "" &&
            config.callToAction.trim() !== ""
        );
    };

    const handleSendNotifications = async () => {
        if (!user?.uid || !isFormValid()) return;

        setIsSending(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/send-event-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adminId: user.uid,
                    config,
                    recipientType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de l'envoi");
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setIsSending(false);
            setShowConfirm(false);
        }
    };

    const recipientLabel = recipientType === "drivers" ? "conducteurs vérifiés" : "passagers";

    return (
        <div className="space-y-6">
            <Card className="p-6 dark:bg-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            Notification aux utilisateurs
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Composez et envoyez un email aux conducteurs ou passagers
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <Label className="mb-3 block">Destinataires</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleRecipientTypeChange("drivers")}
                            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${recipientType === "drivers"
                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                        >
                            <Car className="h-5 w-5" />
                            <span className="font-medium">Conducteurs</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRecipientTypeChange("passengers")}
                            className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${recipientType === "passengers"
                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                        >
                            <User className="h-5 w-5" />
                            <span className="font-medium">Passagers</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {recipientType === "drivers"
                            ? "Email envoyé aux conducteurs dont le compte est vérifié."
                            : "Email envoyé à tous les utilisateurs non-conducteurs."}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="eventTitle">Titre de l&apos;événement</Label>
                            <Input
                                id="eventTitle"
                                placeholder="Ex: Nuit de la traversée 2025-2026"
                                value={config.eventTitle}
                                onChange={(e) => updateConfig("eventTitle", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emailSubject">Sujet de l&apos;email</Label>
                            <Input
                                id="emailSubject"
                                placeholder="Ex: Trouvez un trajet pour la Nuit de la traversée !"
                                value={config.emailSubject}
                                onChange={(e) => updateConfig("emailSubject", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mainMessage">Message principal</Label>
                        <textarea
                            id="mainMessage"
                            className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Décrivez l'événement..."
                            value={config.mainMessage}
                            onChange={(e) => updateConfig("mainMessage", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="callToAction">Appel à l&apos;action (encadré)</Label>
                        <textarea
                            id="callToAction"
                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
                            placeholder="Ex: Rendez-vous sur l'application pour trouver ou proposer un trajet..."
                            value={config.callToAction}
                            onChange={(e) => updateConfig("callToAction", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buttonText">Texte du bouton</Label>
                        <Input
                            id="buttonText"
                            placeholder={recipientType === "drivers" ? "Proposer un trajet" : "Trouver un trajet"}
                            value={config.buttonText}
                            onChange={(e) => updateConfig("buttonText", e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full"
                        disabled={!isFormValid()}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
                    </Button>
                </div>
            </Card>

            {showPreview && isFormValid() && (
                <Card className="p-6 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Aperçu de l&apos;email
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-700 p-4 text-center">
                            <h4 className="text-white font-bold text-lg">ICC Covoiturage</h4>
                            <p className="text-slate-300 text-sm">{config.eventTitle}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-900">
                            <p className="text-gray-800 dark:text-gray-100 font-semibold mb-2">
                                {config.greeting} [Nom] !
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                                {config.mainMessage}
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 my-3">
                                <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">
                                    {config.callToAction}
                                </p>
                            </div>
                            <div className="text-center mt-4">
                                <span className="inline-block bg-slate-700 text-white px-4 py-2 rounded text-sm">
                                    {config.buttonText}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="p-6 dark:bg-gray-800">
                {result && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${result.failed === 0
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            {result.failed === 0 ? (
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            )}
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                                Envoi terminé
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {result.total}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {result.sent}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Envoyés</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {result.failed}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Échoués</p>
                            </div>
                        </div>
                        {result.failedEmails && result.failedEmails.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">
                                    Emails non envoyés :
                                </p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                                    {result.failedEmails.map((email, index) => (
                                        <li key={index}>{email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <span className="text-red-700 dark:text-red-400">{error}</span>
                        </div>
                    </div>
                )}

                {!showConfirm ? (
                    <Button
                        onClick={() => setShowConfirm(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        disabled={isSending || !isFormValid()}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer aux {recipientLabel}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                            <p className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Confirmer l&apos;envoi à tous les {recipientLabel} ?
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                Cette action ne peut pas être annulée.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowConfirm(false)}
                                variant="outline"
                                className="flex-1"
                                disabled={isSending}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSendNotifications}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Confirmer
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default EventNotification;
