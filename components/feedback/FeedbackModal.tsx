/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { submitFeedback } from "@/utils/feedback-service";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: "driver" | "passenger";
}

const FeedbackModal = ({
  isOpen,
  onClose,
  userId,
  userType,
}: FeedbackModalProps) => {
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemType || !description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await submitFeedback({
        userId,
        userType,
        problemType,
        description,
        isUrgent,
      });

      toast.success("Votre signalement a été envoyé avec succès");
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'envoi du feedback:", error);
      toast.error("Une erreur est survenue lors de l'envoi");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Signaler un problème</DialogTitle>
        </DialogHeader>
        <div className="text-center text-sm text-gray-500 italic my-4">
          <p>
            “Le SEIGNEUR déteste les menteurs, mais il approuve ceux qui disent
            la vérité.”
          </p>
          <p className="font-bold mt-1">Proverbes 12:22</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select value={problemType} onValueChange={setProblemType}>
            <SelectTrigger>
              <SelectValue placeholder="Type de problème" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Problème technique</SelectItem>
              <SelectItem value="behavior">Comportement inapproprié</SelectItem>
              <SelectItem value="safety">Problème de sécurité</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Décrivez le problème..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex items-center justify-between">
            <span>Problème urgent ?</span>
            <Switch checked={isUrgent} onCheckedChange={setIsUrgent} />
          </div>

          <Button type="submit" className="w-full">
            Envoyer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default FeedbackModal;
