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
export const RegisterSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom complet est requis"),
  phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
  isDriver: z.boolean().default(false),
  profilePicture: z.instanceof(File).optional(),
  church: z.string().min(1, "Veuillez sélectionner une église"),
  vehicle: z
    .object({
      brand: z.string(),
      model: z.string(),
      color: z.string(),
      seats: z.number().min(1),
      licensePlate: z.string(),
    })
    .optional(),
});
