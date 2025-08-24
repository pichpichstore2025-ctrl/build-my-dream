
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC23F_xamTg8K9-FujG4dXwmNgJstmjrxI",
  authDomain: "online-sale-system.firebaseapp.com",
  projectId: "online-sale-system",
  storageBucket: "online-sale-system.appspot.com",
  messagingSenderId: "312889401518",
  appId: "1:312889401518:web:a2ae4c38176d0aca9a0d3f",
  measurementId: "G-MEPVEBZ36J"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
