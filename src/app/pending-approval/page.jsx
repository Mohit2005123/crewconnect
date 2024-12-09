'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function PendingApproval() {
  const router = useRouter();

  useEffect(() => {
    // Get the current user's UID
    const user = auth.currentUser;
    if (!user) {
      router.push("/login"); // Redirect to login if no user is signed in
      return;
    }

    // Set up Firestore listener
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData.role === "admin") {
          // Redirect to dashboard if user becomes admin
          router.push("/dashboard");
        }
      }
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold">Signup Request Sent</h1>
        <p className="mt-4 text-gray-600">
          Your request to become an admin has been sent. Please wait for approval.
        </p>
      </div>
    </div>
  );
}
