import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyB4CPbEz5Ppt5ooP7XMx5GC7V-M-2ts-7Y",
  authDomain: "bardatenda-gestao.firebaseapp.com",
  projectId: "bardatenda-gestao",
  storageBucket: "bardatenda-gestao.firebasestorage.app",
  messagingSenderId: "143249175796",
  appId: "1:143249175796:web:df3c805dd997947ca85aa1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
