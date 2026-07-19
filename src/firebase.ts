import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-0wBXZrub2OZyZRfwSNmKEP4zuyuT9sI",
  authDomain: "endless-runner-855e6.firebaseapp.com",
  projectId: "endless-runner-855e6",
  storageBucket: "endless-runner-855e6.firebasestorage.app",
  messagingSenderId: "941177251614",
  appId: "1:941177251614:web:5efb2d68912ddb89e70b0f",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const authReady: Promise<void> = signInAnonymously(auth)
  .then(() => undefined)
  .catch((err) => {
    console.error("[firebase] anonymous sign-in failed:", err);
  });
