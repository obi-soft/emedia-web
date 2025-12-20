import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwUxCJ6YUjwq4g2Rd0jILYk8Qk22cGRNg",
  authDomain: "emedia-180e7.firebaseapp.com",
  projectId: "emedia-180e7",
  storageBucket: "emedia-180e7.firebasestorage.app",
  messagingSenderId: "41932734644",
  appId: "1:41932734644:web:ba9d6290eaac6e0d7317e1",
  measurementId: "G-V4KHDJESQX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);