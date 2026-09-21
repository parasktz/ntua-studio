/* =====================================================================
   ΡΥΘΜΙΣΕΙΣ ΠΛΑΤΦΟΡΜΑΣ — συμπληρώστε τα στοιχεία σας (βλ. README)
   Το αρχείο αυτό φορτώνεται από όλες τις σελίδες.
   ===================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};

/* Δημόσιο URL του φακέλου της πλατφόρμας (μπαίνει στους συνδέσμους των
   email), π.χ. "https://studio.uniwa.gr/booking/". Αν μείνει κενό,
   χρησιμοποιείται αυτόματα η τρέχουσα διεύθυνση. */
const APP_URL = "";

const MAX_HOURS_PER_DATE = 4;   // μέγιστες ώρες ανά χρήστη ανά ημέρα
const LOCK_DAYS = 1;            // αλλαγές έως 1 ημέρα πριν τη βιντεοσκόπηση
