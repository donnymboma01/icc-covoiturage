"use client";

import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NavBar from "@/components/NavBar";
import { useEffect } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});


// export const metadata = {
//   manifest: '/manifest.json',
//   themeColor: '#000000',
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: 'default',
//     title: "ICC Covoiturage",
//   },
//   icons: {
//     apple: '/icon-192x192.png',
//   }
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("Service Worker registered successfully!");
        } catch (error) {
          console.error("Error registering Service Worker:", error);
        }
      } else {
        console.error("Service Workers are not supported in this browser.");
      }
    };

    registerServiceWorker();
  }, []);

  // return (
  //   <html lang="en">
  //     <head>
  //       <link rel="manifest" href="/manifest.json" />
  //       <meta name="theme-color" content="#000000" />
  //       <link rel="apple-touch-icon" href="/icon-192x192.png" />
  //     </head>
  //     <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
  //       <NavBar />
  //       {children}
  //       <Toaster richColors />
  //     </body>
  //   </html>
  // );
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <NavBar />
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
