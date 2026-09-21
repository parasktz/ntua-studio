/* =====================================================================
   ΡΥΘΜΙΣΕΙΣ ΠΛΑΤΦΟΡΜΑΣ — συμπληρώστε τα στοιχεία σας (βλ. README)
   Το αρχείο αυτό φορτώνεται από όλες τις σελίδες.
   ===================================================================== */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByB7YNibl7j5md-BVOAuoKziyfkmiutjk",
  authDomain: "ntua-studio.firebaseapp.com",
  databaseURL: "https://ntua-studio-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ntua-studio",
  storageBucket: "ntua-studio.firebasestorage.app",
  messagingSenderId: "310321089066",
  appId: "1:310321089066:web:9b46d1fe8db08ae879d153"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/* Δημόσιο URL του φακέλου της πλατφόρμας (μπαίνει στους συνδέσμους των
   email), Αν μείνει κενό,
   χρησιμοποιείται αυτόματα η τρέχουσα διεύθυνση. */
const APP_URL = "https://parasktz.github.io/ntua-studio/";

/* Επιτρεπόμενα domains ιδρυματικού email για τη φόρμα αίτησης.
   Γίνονται δεκτά και όλα τα subdomains (π.χ. mail.ntua.gr,
   central.ntua.gr). Κενή λίστα [] = χωρίς περιορισμό. */
const ALLOWED_EMAIL_DOMAINS = ["ntua.gr"];
const MAX_HOURS_PER_DATE = 4;   // μέγιστες ώρες ανά χρήστη ανά ημέρα
const LOCK_DAYS = 1;            // αλλαγές έως 1 ημέρα πριν τη βιντεοσκόπηση
