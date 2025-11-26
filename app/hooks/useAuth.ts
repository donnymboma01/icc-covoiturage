import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

export interface ExtendedUser extends User {
  isDriver?: boolean;
  isAdmin?: boolean;
  fullName?: string;
  churchIds?: string[];
  isVerified?: boolean;
  isStar?: boolean;
  // phoneNumber is already in User as string | null
  profilePicture?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = async (updates: {
    isDriver?: boolean;
    isAdmin?: boolean;
    fullName?: string;
    churchIds?: string[];
    phoneNumber?: string;
    profilePicture?: string;
  }) => {
    if (!user?.uid) return;

    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...firebaseUser,
            isDriver: userData.isDriver,
            isAdmin: userData.isAdmin,
            fullName: userData.fullName,
            churchIds: userData.churchIds,
            isVerified: userData.isVerified,
            isStar: userData.isStar,
            phoneNumber: userData.phoneNumber || firebaseUser.phoneNumber || null,
            profilePicture: userData.profilePicture || firebaseUser.photoURL || undefined,
          });
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading, updateUser };
};

