// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD3ErGjDTEa6aNH4Vpsys6YqKMaB0iV0Co",
  authDomain: "schoolapp-94c19.firebaseapp.com",
  projectId: "schoolapp-94c19",
  storageBucket: "schoolapp-94c19.firebasestorage.app",
  messagingSenderId: "189543043204",
  appId: "1:189543043204:web:91779db707b10ac288f2d1",
};



const app = initializeApp(firebaseConfig);

// Secondary app — used ONLY for creating new user accounts
// This prevents createUserWithEmailAndPassword from signing out the admin
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');

export const auth      = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const FLW_PUBLIC_KEY = 'FLWPUBK_TEST-119416feb7fcb1218244d8646ae9d768-X';
// Replace with your actual key from https://dashboard.flutterwave.com

export const Collections = {
  USERS:         'users',
  STUDENTS:      'students',
  TEACHERS:      'teachers',
  CLASSES:       'classes',
  ATTENDANCE:    'attendance',
  GRADES:        'grades',
  ASSIGNMENTS:   'assignments',
  ANNOUNCEMENTS: 'announcements',
  TIMETABLE:     'timetable',
  FEES:          'fees',
  MESSAGES:      'messages',
  PAYMENTS:      'payments',
};

