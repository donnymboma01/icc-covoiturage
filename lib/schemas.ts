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

// export const RegisterSchema = z
//   .object({
//     email: z.string().email("Email invalide"),
//     password: z
//       .string()
//       .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
//     confirmPassword: z.string(),
//     fullName: z.string().min(2, "Le nom complet est requis"),
//     phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
//     isDriver: z.boolean().default(false),
//     profilePicture: z.instanceof(File).optional(),
//     church: z.string().min(1, "Veuillez sélectionner une église"),
//     vehicle: z
//       .object({
//         brand: z.string().min(1, "La marque du véhicule est requise"),
//         model: z.string().min(1, "Le modèle du véhicule est requis"),
//         color: z.string().min(1, "La couleur du véhicule est requise"),
//         seats: z.number().min(1, "Le nombre de places doit être supérieur à 0"),
//         licensePlate: z
//           .string()
//           .min(1, "La plaque d'immatriculation est requise"),
//       })
//       .optional(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Les mots de passe ne correspondent pas",
//     path: ["confirmPassword"],
//   })
//   .refine(
//     (data) => {
//       if (data.isDriver) {
//         return (
//           data.vehicle &&
//           data.vehicle.brand &&
//           data.vehicle.model &&
//           data.vehicle.color &&
//           data.vehicle.seats &&
//           data.vehicle.licensePlate
//         );
//       }
//       return true;
//     },
//     {
//       message:
//         "Les informations du véhicule sont requises pour les conducteurs",
//       path: ["vehicle"],
//     }
//   );

export const RegisterSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Le nom complet est requis"),
    phoneNumber: z.string().min(10, "Numéro de téléphone invalide"),
    isDriver: z.boolean().default(false),
    profilePicture: z.instanceof(File).optional(),
    church: z.string().min(1, "Veuillez sélectionner une église"),
    isStar: z.boolean().default(false),
    ministry: z.string().optional(),
    vehicle: z
      .object({
        brand: z.string(),
        model: z.string(),
        color: z.string(),
        seats: z.number(),
        licensePlate: z.string(),
      })
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.isDriver) {
      if (!data.vehicle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Les informations du véhicule sont requises pour les conducteurs",
          path: ["vehicle"],
        });
      } else {
        if (
          !data.vehicle.brand ||
          !data.vehicle.model ||
          !data.vehicle.color ||
          !data.vehicle.seats ||
          !data.vehicle.licensePlate
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Toutes les informations du véhicule sont requises",
            path: ["vehicle"],
          });
        }
      }
    }
  });
