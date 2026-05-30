import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyC0ioQ6-9PaelP6NKaBp3UoXjPjTMbF7sQ",
  authDomain: "fromutk.firebaseapp.com",
  projectId: "fromutk",
  storageBucket: "fromutk.firebasestorage.app",
  messagingSenderId: "191549601290",
  appId: "1:191549601290:web:c7cc9a129fe19bb45fd1f3",
  measurementId: "G-ECGN9ZFMBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

