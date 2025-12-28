
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Analytics often fails in server/Node environments, optional

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh8WyPFz1nXFudNto0es4ZsnEjawtdKPg",
  authDomain: "gogocash-acp.firebaseapp.com",
  projectId: "gogocash-acp",
  storageBucket: "gogocash-acp.firebasestorage.app",
  messagingSenderId: "868624295342",
  appId: "1:868624295342:web:afc27b00bece85b226143f",
  measurementId: "G-5GZ28N934K"
};

// Initialize Firebase (Singleton pattern to avoid re-initialization errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null; 

export { app };
