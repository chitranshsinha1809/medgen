import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyADorOeqNO9xmyo_xgM0rwHYHpOSTlAsEE",
  authDomain: "med-gen-21458.firebaseapp.com",
  projectId: "med-gen-21458",
  storageBucket: "med-gen-21458.firebasestorage.app",
  messagingSenderId: "903814309996",
  appId: "1:903814309996:web:ffa7618aadab984ae75049"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);