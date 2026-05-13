// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};



const app = initializeApp(firebaseConfig);

// Secondary app — used ONLY for creating new user accounts
// This prevents createUserWithEmailAndPassword from signing out the admin
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');

export const auth      = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db        = getFirestore(app);
export const storage   = getStorage(app);
export const FLW_PUBLIC_KEY = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY;
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

