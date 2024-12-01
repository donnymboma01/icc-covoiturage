/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { MdLogin } from "react-icons/md";
import Link from "next/link";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { LoginSchema } from "@/lib/schemas";
import { Button } from "../ui/button";

import { app } from "../../app/config/firebase-config";
import {getAuth, onAuthStateChanged, signInWithEmailAndPassword} from "firebase/auth";
import { useRouter } from "next/navigation";
import { getDoc, doc, getFirestore } from "firebase/firestore";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Pour Djedou et Jason : ce useEffect permet de rediriger l'utilisateur vers le dashboard correspondant après la connexion.
  // une fois connecté, on ne reviendra plus sur la page de connexion tant qu"on est pas deconnecté.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)
        const userData = userDoc.data()

        router.push(userData?.isDriver ? '/dashboard/driver' : '/dashboard/passenger')
      }
    })

    return () => unsubscribe()
  }, [auth, db, router])

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    try {
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const user = userCredential.user;
      const token = await userCredential.user.getIdToken();
      console.log("token: ", token);

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      console.log("user: ", user);

      if (userData?.isDriver) {
        router.push("/dashboard/driver");
      } else {
        router.push("/dashboard/passanger");
      }

      toast.success("Connexion réussie");
    } catch (error: any) {
      console.log("Firebase error code:", error.code);

      let errorMessage: string;

      if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou mot de passe incorrect";
        toast.error(errorMessage);
        form.setError("email", { message: errorMessage });
        form.setError("password", { message: errorMessage });
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Trop de tentatives, réessayez plus tard";
        toast.error(errorMessage);
        form.setError("root", { message: errorMessage });
      } else {
        errorMessage = "Une erreur est survenue lors de la connexion";
        toast.error(errorMessage);
        form.setError("root", { message: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-md:p-2 md:container">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{"Votre email"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Entrez votre email"
                        type="email"
                        className="lowercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{"Mot de passe"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Entrer votre mot de passe"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "En cours de connexion ..." : "connexion"}
            <MdLogin className="ml-2" />
          </Button>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas de compte ?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
