import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBEiRq8ygwYM2uubCouNDN-R_oGVTMNfEs",
  authDomain: "ssc-tasks.firebaseapp.com",
  projectId: "ssc-tasks",
  storageBucket: "ssc-tasks.firebasestorage.app",
  messagingSenderId: "612327259711",
  appId: "1:612327259711:web:4f95b6cdd2f2c397f3c28a",
  measurementId: "G-WYH2J2D3KF"
};

const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === "web"
    ? initializeAuth(app, { persistence: browserLocalPersistence })
    : initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });

export const db = getFirestore(app);
