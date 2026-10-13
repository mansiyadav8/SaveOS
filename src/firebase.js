// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBe7vwhcqKlKN_M2HudpMF0oZX0MxR-HsM",
  authDomain: "saveos-b120f.firebaseapp.com",
  projectId: "saveos-b120f",
  storageBucket: "saveos-b120f.firebasestorage.app",
  messagingSenderId: "461350420594",
  appId: "1:461350420594:web:61fcd774b44e5b2e9a02eb",
  measurementId: "G-XVD2J5SGBM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
