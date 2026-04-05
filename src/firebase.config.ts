import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase configuration - using a demo project
// For production, replace with your own Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyBkXqJxEFUb_KsJdxJxPlZfJxX8dVk5XQU",
  authDomain: "too-far-game.firebaseapp.com",
  projectId: "too-far-game",
  storageBucket: "too-far-game.appspot.com",
  messagingSenderId: "123456789",
  databaseURL: "https://too-far-game-default-rtdb.firebaseio.com",
  appId: "1:123456789:web:abcd1234efgh5678ijkl9012"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
