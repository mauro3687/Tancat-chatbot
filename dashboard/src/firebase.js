// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCXPS4HjFx0Drk9mLXmabLFo7nLDrz1YDg",
  authDomain: "tancat-system.firebaseapp.com",
  projectId: "tancat-system",
  storageBucket: "tancat-system.firebasestorage.app",
  messagingSenderId: "536414510727",
  appId: "1:536414510727:web:8e8b1151cb89b2d751e222",
  measurementId: "G-ELF7G3T7MG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
