import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUdoXEXxfKMUwbNvRkhz4L0SQdD5jPEuA",
  authDomain: "too-far-61df3.firebaseapp.com",
  databaseURL: "https://too-far-61df3-default-rtdb.firebaseio.com",
  projectId: "too-far-61df3",
  storageBucket: "too-far-61df3.firebasestorage.app",
  messagingSenderId: "1003510689024",
  appId: "1:1003510689024:web:021490b81bc16697fe57e5",
  measurementId: "G-J1YXVC81W0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
