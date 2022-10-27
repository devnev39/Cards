import { initializeApp } from "firebase/app";

const config = {
  apiKey: "AIzaSyBWcabmCPe9ZjK6ildHKAfUvNZ7Y3p0BgI",
  authDomain: "cards-a409e.firebaseapp.com",
  databaseURL: "https://cards-a409e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cards-a409e",
  storageBucket: "cards-a409e.appspot.com",
  messagingSenderId: "615596806591",
  appId: "1:615596806591:web:8fc4bb66373075c3b0110a",
  measurementId: "G-VZWRYMPDDJ",
  databaseURL:"https://cards-9bb78-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(config);
export default app;