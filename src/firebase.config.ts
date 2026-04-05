import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEJ7YvtjHaX-zf-L638JOxF0Mfss-J_GM",
  authDomain: "toofarnew.firebaseapp.com",
  databaseURL: "https://toofarnew-default-rtdb.firebaseio.com",
  projectId: "toofarnew",
  storageBucket: "toofarnew.firebasestorage.app",
  messagingSenderId: "260120279873",
  appId: "1:260120279873:web:cd130b7f1bb9051c93bfc0",
  measurementId: "G-RGSD5ZF4BT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
