// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1KYJ0bYMcdIdReZXpS7YLLZlFiCcA1MQ",
  authDomain: "inkswell-blog.firebaseapp.com",
  projectId: "inkswell-blog",
  storageBucket: "inkswell-blog.firebasestorage.app",
  messagingSenderId: "1020641397791",
  appId: "1:1020641397791:web:1fd8e6171bc603c792192a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
export const db=getFirestore(app)