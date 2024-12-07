import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, {
    message: "Le nom d'utilisateur est obligatoire",
  }),
  password: z.string().min(1, { message: "Le mot de passe est obligatoire" }),
});

export const RideSchema = z.object({
  departureAddress: z.string().min(1, "L'adresse de départ est requise"),
  arrivalAddress: z.string().min(1, "L'adresse d'arrivée est requise"),
  departureTime: z.string().min(1, "La date et l'heure sont requises"),
  availableSeats: z.number().min(1, "Au moins une place disponible"),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["weekly", "monthly"]).optional(),
  price: z.number().optional(),
  waypoints: z.array(z.string()).optional(),
  status: z.enum(["active", "cancelled"]).default("active"),
});

// export const RegisterSchema = z.object({
//   email: z.string().email("Email invalide"),
//   password: z
//     .string()
//     .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
//   fullName: z.string().min(2, "Le nom complet est requis"),
//   phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
//   isDriver: z.boolean().default(false),
//   profilePicture: z.instanceof(File).optional(),
//   // Vehicle fields (conditional based on isDriver)
//   vehicle: z
//     .object({
//       brand: z.string(),
//       model: z.string(),
//       color: z.string(),
//       seats: z.number().min(1),
//       licensePlate: z.string(),
//     })
//     .optional(),
// });
export const RegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide"),

    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
      .max(50, "Le mot de passe ne doit pas dépasser 50 caractères"),

    confirmPassword: z.string(),

    fullName: z
      .string()
      .min(2, "Le nom complet doit contenir au moins 2 caractères")
      .max(50, "Le nom complet ne doit pas dépasser 50 caractères"),

    phoneNumber: z
      .string()
      .min(10, "Le numéro doit contenir au moins 10 chiffres")
      .max(15, "Le numéro ne doit pas dépasser 15 chiffres")
      .regex(/^[+]?[\d\s-]+$/, "Format de numéro de téléphone invalide"),

    isDriver: z.boolean().default(false),

    profilePicture: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.size <= 10 * 1024 * 1024,
        "L'image ne doit pas dépasser 10MB"
      ),

    church: z.string().min(1, "Veuillez sélectionner une église"),

    vehicle: z
      .object({
        brand: z
          .string()
          .min(1, "La marque est requise")
          .max(30, "La marque ne doit pas dépasser 30 caractères"),
        model: z
          .string()
          .min(1, "Le modèle est requis")
          .max(30, "Le modèle ne doit pas dépasser 30 caractères"),
        color: z
          .string()
          .min(1, "La couleur est requise")
          .max(20, "La couleur ne doit pas dépasser 20 caractères"),
        seats: z
          .number()
          .min(1, "Le véhicule doit avoir au moins 1 place")
          .max(9, "Le véhicule ne peut pas avoir plus de 9 places"),
        licensePlate: z
          .string()
          .min(1, "La plaque d'immatriculation est requise")
          .max(
            10,
            "La plaque d'immatriculation ne doit pas dépasser 10 caractères"
          )
          .regex(/^[A-Z0-9-]+$/, "Format de plaque d'immatriculation invalide"),
      })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// export const RegisterSchema = z.object({
//   email: z.string().email("Email invalide"),
//   password: z
//     .string()
//     .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
//   fullName: z.string().min(2, "Le nom complet est requis"),
//   phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
//   isDriver: z.boolean().default(false),
//   profilePicture: z.instanceof(File).optional(),
//   church: z.string().min(1, "Veuillez sélectionner une église"),
//   vehicle: z
//     .object({
//       brand: z.string(),
//       model: z.string(),
//       color: z.string(),
//       seats: z.number().min(1),
//       licensePlate: z.string(),
//     })
//     .optional(),
// });
