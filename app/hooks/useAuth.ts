import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

interface ExtendedUser extends User {
  isDriver?: boolean;
  isAdmin?: boolean;
  fullName?: string;
  churchIds?: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = async (updates: {
    isDriver?: boolean;
    isAdmin?: boolean;
    fullName?: string;
    churchIds?: string[];
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

