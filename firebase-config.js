import { initializeApp } from "firebase/app";
require("dotenv").config();

const config = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDMN,
  databaseURL: process.env.DBURL,
  projectId: process.env.PRJID,
  storageBucket: process.env.STRGBCKT,
  messagingSenderId: process.env.MSGSNDRID,
  appId: process.env.APPID,
  measurementId: process.env.MSRID,
  databaseURL: process.env.DBURL2
}

const app = initializeApp(config);
export default app;