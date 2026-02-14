// This file serves as a placeholder for the actual Firebase configuration.
// In a production environment, you would replace these values with your actual Firebase project keys.

export const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: "abf-prep-mali.firebaseapp.com",
  projectId: "abf-prep-mali",
  storageBucket: "abf-prep-mali.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export const initializeFirebase = () => {
  console.log("Firebase initialized with config:", firebaseConfig);
  // import { initializeApp } from "firebase/app";
  // return initializeApp(firebaseConfig);
};