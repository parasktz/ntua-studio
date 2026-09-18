/* ─────────────────────────────────────────────────────────────
   Κοινή λογική σύνδεσης για όλες τις σελίδες.
   Firebase Authentication με "σύνδεσμο μέσω email" (χωρίς κωδικούς),
   αποκλειστικά για ιδρυματικές διευθύνσεις ΕΜΠ (…ntua.gr), και
   ΜΟΝΟ για λογαριασμούς που έχει εγκρίνει ο διαχειριστής.
   Στη βάση των κρατήσεων δεν αποθηκεύεται τίποτα σχετικό με τη σύνδεση.
   ───────────────────────────────────────────────────────────── */
import {
  getAuth, onAuthStateChanged, isSignInWithEmailLink,
  signInWithEmailLink, sendSignInLinkToEmail, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, get }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

/* Δεκτές μόνο διευθύνσεις ΕΜΠ: name@ntua.gr ή σχολών, π.χ. name@mail.ntua.gr.
   Ο έλεγχος γίνεται με @ntua.gr / .ntua.gr ώστε να ΜΗΝ περνά π.χ. το "kati-ntua.gr". */
export function emailAllowed(email){
  const e = String(email || "").trim().toLowerCase();
  return e.endsWith("@ntua.gr") || e.endsWith(".ntua.gr");
}

/* Τα κλειδιά της βάσης δεν επιτρέπουν τελείες: name@mail.ntua.gr → name@mail,ntua,gr */
export const emailKey = e => String(e || "").trim().toLowerCase().replace(/\./g, ",");

/* Είναι το email εγκεκριμένο; / Είναι διαχειριστής; */
export async function isApproved(app, email){
  try{ return (await get(ref(getDatabase(app), "approved/" + emailKey(email)))).exists(); }
  catch{ return false; }
}
export async function isAdmin(app, email){
  try{ return (await get(ref(getDatabase(app), "admins/" + emailKey(email)))).exists(); }
  catch{ return false; }
}

/* Αν η τρέχουσα διεύθυνση είναι σύνδεσμος σύνδεσης από email, ολοκλήρωσε τη σύνδεση. */
export async function completeSignInIfLink(auth){
  if (!isSignInWithEmailLink(auth, location.href)) return;
  let email = localStorage.getItem("emailForSignIn") || "";
  if (!email)  /* π.χ. ο σύνδεσμος ανοίχτηκε σε άλλη συσκευή */
    email = (prompt("Για επιβεβαίωση, γράψε το email ΕΜΠ στο οποίο στάλθηκε ο σύνδεσμος:") || "").trim();
  try{
    await signInWithEmailLink(auth, email, location.href);
    localStorage.removeItem("emailForSignIn");
  }finally{
    /* Καθάρισμα του συνδέσμου από τη γραμμή διεύθυνσης */
    history.replaceState(null, "", location.pathname);
  }
}

/* Φύλακας σελίδας: τρέχει το onReady μόνο για συνδεδεμένο, εγκεκριμένο χρήστη ΕΜΠ
   (ή διαχειριστή) — αλλιώς στέλνει στη σελίδα σύνδεσης. */
export function requireAuth(app, onReady){
  const auth = getAuth(app);
  completeSignInIfLink(auth)
    .catch(() => alert("Η σύνδεση μέσω του συνδέσμου απέτυχε (έληξε ή δόθηκε λάθος email). Ζήτησε νέο σύνδεσμο."))
    .finally(() => {
      onAuthStateChanged(auth, async user => {
        if (!user) return location.replace("login.html");
        if (!emailAllowed(user.email))
          return signOut(auth).finally(() => location.replace("login.html"));
        const ok = (await isApproved(app, user.email)) || (await isAdmin(app, user.email));
        if (!ok){
          alert("Ο λογαριασμός σου δεν έχει εγκριθεί ακόμα από τον διαχειριστή του studio.");
          return signOut(auth).finally(() => location.replace("login.html"));
        }
        onReady(user, auth);
      });
    });
}

/* Αποστολή συνδέσμου σύνδεσης· πατώντας τον, ο χρήστης καταλήγει στο index.html.
   Χρησιμοποιείται και από τη σελίδα διαχείρισης κατά την έγκριση. */
export async function sendLoginLink(auth, email){
  await sendSignInLinkToEmail(auth, email, {
    url: new URL("index.html", location.href).href,
    handleCodeInApp: true
  });
}

/* Ίδιο με το παραπάνω, από τη συσκευή του ίδιου του χρήστη: θυμάται το email
   ώστε το κλικ στον σύνδεσμο να ολοκληρώνει τη σύνδεση χωρίς άλλη ερώτηση. */
export async function requestLink(auth, email){
  await sendLoginLink(auth, email);
  localStorage.setItem("emailForSignIn", email);
}

export { signOut };
