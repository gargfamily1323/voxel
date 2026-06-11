import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

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

/**
 * Cross-platform Google sign-in.
 * - Web: Firebase popup flow.
 * - Native (Android/iOS via Capacitor): native Google Sign-In via
 *   @capacitor-firebase/authentication, then bridge the credential into
 *   the JS Firebase SDK so onAuthStateChanged fires.
 */
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }
  return signInWithPopup(auth, googleProvider);
}
