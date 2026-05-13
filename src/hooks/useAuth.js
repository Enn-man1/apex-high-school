// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, Collections } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef  = doc(db, Collections.USERS, firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          setProfile(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
        } catch (e) {
          console.warn(e);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const docRef     = doc(db, Collections.USERS, credential.user.uid);
    const docSnap    = await getDoc(docRef);
    const profileData = docSnap.exists()
      ? { id: docSnap.id, ...docSnap.data() }
      : null;
    setProfile(profileData);
    return profileData;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const register = async ({ email, password, role, name, ...rest }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, Collections.USERS, credential.user.uid), {
      uid: credential.user.uid,
      email, name, role,
      createdAt: serverTimestamp(),
      ...rest,
    });
    return credential.user;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);