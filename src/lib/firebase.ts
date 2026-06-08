import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoIsFnbyKl08sUmxKTOaUh-r1QuXuc2Iw",
  authDomain: "voxel-ba393.firebaseapp.com",
  projectId: "voxel-ba393",
  storageBucket: "voxel-ba393.firebasestorage.app",
  messagingSenderId: "1034342406554",
  appId: "1:1034342406554:web:b835f6d80d3a4467330223",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
