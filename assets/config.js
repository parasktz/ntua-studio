/* =====================================================================
   ΡΥΘΜΙΣΕΙΣ ΠΛΑΤΦΟΡΜΑΣ — συμπληρώστε τα στοιχεία σας (βλ. README)
   Το αρχείο αυτό φορτώνεται από όλες τις σελίδες.
   ===================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyByB7YNibl7j5md-BVOAuoKziyfkmiutjk",
  authDomain: "ntua-studio.firebaseapp.com",
  databaseURL: "https://ntua-studio-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ntua-studio",
  storageBucket: "ntua-studio.firebasestorage.app",
  messagingSenderId: "310321089066",
  appId: "1:310321089066:web:9b46d1fe8db08ae879d153"
};

/* ΠΡΟΑΙΡΕΤΙΚΟ — πλήρως αυτόματη αποστολή email με το ΔΩΡΕΑΝ πρόγραμμα
   του EmailJS (χωρίς κάρτα, ~200 email/μήνα). Βλ. README, βήμα 3.
   Αν μείνει κενό: κατά την έγκριση και τις αλλαγές του διαχειριστή
   ανοίγει έτοιμο email (mailto) για αποστολή με ένα κλικ — επίσης δωρεάν. */
const EMAILJS = {
  publicKey:  "",
  serviceId:  "",
  templateId: ""
};

/* Δημόσιο URL του φακέλου της πλατφόρμας (μπαίνει στους συνδέσμους των
   email), π.χ. "https://studio.uniwa.gr/booking/". Αν μείνει κενό,
   χρησιμοποιείται αυτόματα η τρέχουσα διεύθυνση. */
const APP_URL = "";

const MAX_HOURS_PER_DATE = 4;   // μέγιστες ώρες ανά χρήστη ανά ημέρα
const LOCK_DAYS = 1;            // αλλαγές έως 1 ημέρα πριν τη βιντεοσκόπηση
