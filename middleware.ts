import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "./app/config/firebase-config";

export async function middleware(request: NextRequest) {
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (auth.currentUser) {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!userData?.isAdmin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (userData?.isDriver) {
      const verificationRef = doc(
        db,
        "driverVerifications",
        auth.currentUser.uid
      );
      const verificationDoc = await getDoc(verificationRef);
      const isVerified =
        verificationDoc.exists() && verificationDoc.data().isVerified === true;

      if (
        !isVerified &&
        !request.nextUrl.pathname.startsWith("/verify-driver")
      ) {
        const response = NextResponse.redirect(
          new URL("/verify-driver", request.url)
        );
        response.cookies.set("pendingDriverId", auth.currentUser.uid, {
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        return response;
      }
    }

    if (
      request.nextUrl.pathname === "/auth/login" ||
      request.nextUrl.pathname === "/auth/register"
    ) {
      return NextResponse.redirect(
        new URL(
          userData?.isDriver ? "/dashboard/driver" : "/dashboard/passenger",
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/login",
    "/auth/register",
    "/dashboard/:path*",
    "/profile",
    "/rides/:path*",
    "/home",
    "/",
    "/admin/:path*",
  ],
};

// import { NextResponse } from "next/server";
// import type { NextRequest} from "next/server";
// import { getAuth } from "firebase/auth";
// import { getFirestore, doc, getDoc } from 'firebase/firestore'
// import { app } from  "./app/config/firebase-config"

// export async function middleware(request : NextRequest) {
//     const auth = getAuth(app);
//     const db = getFirestore(app);
//     if(auth.currentUser && (
//         request.nextUrl.pathname.startsWith("/auth/login") ||
//             request.nextUrl.pathname.startsWith("/auth/register")
//     )){

//         const useRef = doc(db, "users", auth.currentUser.uid)
//         const userDoc = await getDoc(useRef)
//         const userData = userDoc.data();

//         return NextResponse.redirect(new URL(
//             userData?.isDriver ? "/dashboard/driver" :"dashboard/passenger",
//             request.url
//         ))
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher : ["/auth/login", "/auth/register"]
// }

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getAuth } from "firebase/auth";
// import { getFirestore, doc, getDoc } from "firebase/firestore";
// import { app } from "./app/config/firebase-config";

// export async function middleware(request: NextRequest) {
//   const auth = getAuth(app);
//   const db = getFirestore(app);

//   if (auth.currentUser) {
//     const userRef = doc(db, "users", auth.currentUser.uid);
//     const userDoc = await getDoc(userRef);
//     const userData = userDoc.data();

//     if (userData?.isDriver) {
//       const verificationRef = doc(db, "driverVerifications", auth.currentUser.uid);
//       const verificationDoc = await getDoc(verificationRef);
//       const isVerified = verificationDoc.exists() && verificationDoc.data().isVerified === true;

//       if (!isVerified && !request.nextUrl.pathname.startsWith("/verify-driver")) {
//         const response = NextResponse.redirect(new URL("/verify-driver", request.url));
//         response.cookies.set("pendingDriverId", auth.currentUser.uid, {
//           maxAge: 60 * 60 * 24,
//           path: "/",
//         });
//         return response;
//       }
//     }

//     if (request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/register") {
//       return NextResponse.redirect(
//         new URL(
//           userData?.isDriver ? "/dashboard/driver" : "/dashboard/passenger",
//           request.url
//         )
//       );
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/auth/login",
//     "/auth/register",
//     "/dashboard/:path*",
//     "/profile",
//     "/rides/:path*",
//     "/home",
//     "/"
//   ],
// };

// import { NextResponse } from "next/server";
// import type { NextRequest} from "next/server";
// import { getAuth } from "firebase/auth";
// import { getFirestore, doc, getDoc } from 'firebase/firestore'
// import { app } from  "./app/config/firebase-config"

// export async function middleware(request : NextRequest) {
//     const auth = getAuth(app);
//     const db = getFirestore(app);
//     if(auth.currentUser && (
//         request.nextUrl.pathname.startsWith("/auth/login") ||
//             request.nextUrl.pathname.startsWith("/auth/register")
//     )){

//         const useRef = doc(db, "users", auth.currentUser.uid)
//         const userDoc = await getDoc(useRef)
//         const userData = userDoc.data();

//         return NextResponse.redirect(new URL(
//             userData?.isDriver ? "/dashboard/driver" :"dashboard/passenger",
//             request.url
//         ))
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher : ["/auth/login", "/auth/register"]
// }
