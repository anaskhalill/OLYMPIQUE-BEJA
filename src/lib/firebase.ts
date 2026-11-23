import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern for Firebase initialization
const getFirebaseApp = () => {
    try {
        if (getApps().length > 0) return getApp();
        if (firebaseConfig.apiKey && firebaseConfig.projectId) {
            return initializeApp(firebaseConfig);
        }
    } catch (error) {
        console.error("Firebase init error:", error);
    }
    return null;
};

const app = getFirebaseApp();
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

// Instantiate providers lazily to avoid potential issues during module load
export const getGoogleProvider = () => new GoogleAuthProvider();
export const getFacebookProvider = () => new FacebookAuthProvider();
