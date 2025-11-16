import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, onValue, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBBfWkcH8wZs5u_EjNZsMJ1hzApRqgVTOU",
  authDomain: "foodbank-crm-hackathon.firebaseapp.com",
  databaseURL: "https://foodbank-crm-hackathon-default-rtdb.firebaseio.com",
  projectId: "foodbank-crm-hackathon",
  storageBucket: "foodbank-crm-hackathon.firebasestorage.app",
  messagingSenderId: "397164954342",
  appId: "1:397164954342:web:ef67a6040420f936167127"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, onValue, set, update };
