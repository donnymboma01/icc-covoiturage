import { NextResponse } from "next/server";
import type { NextRequest} from "next/server";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { app } from  "./app/config/firebase-config"

export async function middleware(request : NextRequest) {
    const auth = getAuth(app);
    const db = getFirestore(app);
    if(auth.currentUser && (
        request.nextUrl.pathname.startsWith("/auth/login") ||
            request.nextUrl.pathname.startsWith("/auth/register")
    )){

        const useRef = doc(db, "users", auth.currentUser.uid)
        const userDoc = await getDoc(useRef)
        const userData = userDoc.data();

        return NextResponse.redirect(new URL(
            userData?.isDriver ? "/dashboard/driver" :"dashboard/passenger",
            request.url
        ))
    }

    return NextResponse.next();
}

export const config = {
    matcher : ["/auth/login", "/auth/register"]
}