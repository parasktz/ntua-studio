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

/* EmailJS — ΑΥΤΟΜΑΤΗ αποστολή όλων των email (δωρεάν πρόγραμμα, χωρίς
   κάρτα, ~200 email/μήνα). Οδηγίες ενεργοποίησης: README, βήμα 3.
   Όσο τα πεδία είναι κενά, η πλατφόρμα λειτουργεί με τον εναλλακτικό
   τρόπο: ανοίγει έτοιμο email στο πρόγραμμα αλληλογραφίας του admin. */
const EMAILJS = {
  publicKey:  "eLq4Nzn-K-57wx9Q-",   // Account → General → Public Key
  serviceId:  "service_p2r2sk3v1",   // Email Services → π.χ. "service_abc1234"
  templateId: "template_studio_ntua"    // Email Templates → π.χ. "template_xyz5678"
};

/* Δημόσιο URL του φακέλου της πλατφόρμας (μπαίνει στους συνδέσμους των
   email), π.χ. "https://studio.ntua.gr/booking/". Αν μείνει κενό,
   χρησιμοποιείται αυτόματα η τρέχουσα διεύθυνση. */
const APP_URL = "";

const MAX_HOURS_PER_DATE = 4;   // μέγιστες ώρες ανά χρήστη ανά ημέρα
const LOCK_DAYS = 1;            // αλλαγές έως 1 ημέρα πριν τη βιντεοσκόπηση
