import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyB4CPbEz5Ppt5ooP7XMx5GC7V-M-2ts-7Y",
  authDomain: "bardatenda-gestao.firebaseapp.com",
  projectId: "bardatenda-gestao",
  storageBucket: "bardatenda-gestao.firebasestorage.app",
  messagingSenderId: "143249175796",
  appId: "1:143249175796:web:915766d19ab0d40da85aa1"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export { app };
export default app;
