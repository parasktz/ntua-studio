# Πλατφόρμα χρονοπρογραμματισμού Studio βιντεοσκόπησης

Λειτουργεί **εξ ολοκλήρου δωρεάν** στο πρόγραμμα **Spark** του Firebase (χωρίς κάρτα): Realtime Database (JSON) για τα δεδομένα και Firebase Authentication για τους λογαριασμούς. Με την έγκριση ενός αιτήματος από τη σελίδα διαχείρισης, δημιουργείται αυτόματα λογαριασμός χρήστη και του αποστέλλεται email με τον **προσωπικό του κωδικό**, ο οποίος **δεν έχει ημερομηνία λήξης** — η πρώτη (και κάθε επόμενη) σύνδεση γίνεται όποτε θέλει ο χρήστης.

## Αρχεία

```
index.html            Αίτηση βιντεοσκόπησης (δημόσια)
login.html            Είσοδος διαχειριστή
admin.html            Πίνακας διαχείρισης (ρυθμίσεις, ημερολόγιο, αιτήματα, χρήστες)
schedule.html         Χρονοπρογραμματισμός χρήστη (σύνδεση με email + κωδικό)
assets/config.js      Ρυθμίσεις (Firebase config, προαιρετικό EmailJS, σταθερές)
assets/common.js      Κοινός κώδικας (δεδομένα, ημερολόγιο, email)
assets/styles.css     Κοινή εμφάνιση
```

Ανεβάζετε **όλο τον φάκελο** σε οποιαδήποτε στατική φιλοξενία (Firebase Hosting, GitHub Pages, server ιδρύματος).

## Πώς δουλεύει η ροή

1. Ο ενδιαφερόμενος υποβάλλει αίτηση στο `index.html` με το ιδρυματικό του email.
2. Ο διαχειριστής συνδέεται (`login.html`, credentials από το Firebase Authentication) και στο `admin.html` → «Αιτήματα» πατά **Έγκριση**. Τότε:
   - δημιουργείται λογαριασμός χρήστη στο Firebase Authentication με τυχαίο κωδικό,
   - στέλνεται στον χρήστη email με τον σύνδεσμο του `schedule.html` και τον **κωδικό του** (χωρίς λήξη).
3. Ο χρήστης συνδέεται στο `schedule.html` και επιλέγει slots (έως 4 ώρες/ημέρα, με περιγραφή εργασίας ανά slot). Βλέπει αναλυτικά μόνο τα δικά του· τα ξένα εμφανίζονται ως «Δεσμευμένο» και τα κλειστά από τον admin ως μη διαθέσιμα. Αλλαγές έως 1 ημέρα πριν την ημερομηνία.
4. Ο admin βλέπει και επεξεργάζεται **όλα** τα slots. Κάθε αλλαγή (από χρήστη ή admin) στέλνει στον χρήστη email με τον νέο του προγραμματισμό (διαδοχικές αλλαγές ομαδοποιούνται).
5. «Ξέχασα τον κωδικό» → email επαναφοράς που στέλνει **το ίδιο το Firebase** (δωρεάν). Ο σύνδεσμος επαναφοράς ισχύει για περιορισμένο χρόνο, αλλά αφορά μόνο την ανάκτηση — ο κωδικός εισόδου δεν λήγει ποτέ.

## Βήμα 1 — Firebase project (δωρεάν πρόγραμμα Spark)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**. Δεν χρειάζεται αναβάθμιση — όλα δουλεύουν στο δωρεάν Spark.
2. **Build → Realtime Database → Create database** (π.χ. `europe-west1`), locked mode. Στα **Rules** επικολλήστε:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "admins": {
      "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": false }
    },
    "activeSession": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "sessions": {
      "$sid": {
        "meta":    { ".read": true, ".write": "auth != null && root.child('admins').child(auth.uid).exists()" },
        "blocked": { ".read": true, ".write": "auth != null && root.child('admins').child(auth.uid).exists()" },
        "requests": {
          ".read": true,
          "$rid": { ".write": "(auth != null && root.child('admins').child(auth.uid).exists()) || !data.exists()" }
        },
        "bookings": { ".read": true, ".write": "auth != null" }
      }
    }
  }
}
```

   Δηλαδή: ρυθμίσεις, διαθεσιμότητα και έγκριση αλλάζουν **μόνο από διαχειριστή**· οι επισκέπτες μόνο **δημιουργούν** αιτήματα· οι κρατήσεις απαιτούν **συνδεδεμένο χρήστη** (με τον κωδικό που του στάλθηκε).

3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. **Authentication → Users → Add user**: δημιουργήστε τον/τους **διαχειριστές** (email + κωδικός). Με αυτά τα credentials, όπως αποθηκεύονται στο Firebase, γίνεται η είσοδος στο `login.html`.
5. **Ορισμός δικαιωμάτων admin**: αντιγράψτε το **User UID** του διαχειριστή (στήλη στο Authentication → Users) και στο **Realtime Database → Data** δημιουργήστε τον κόμβο:

```
admins
  └─ <UID_ΤΟΥ_ADMIN>: true
```

   (κουμπί «+» στη ρίζα → όνομα `admins` → μέσα του «+» → όνομα το UID, τιμή `true`). Χωρίς αυτό, ο λογαριασμός συνδέεται αλλά δεν αναγνωρίζεται ως διαχειριστής.

6. **Project settings (⚙) → General → Your apps → Web app (</>)**: αντιγράψτε το `firebaseConfig` και περάστε το στο `assets/config.js` (`FIREBASE_CONFIG` — προσοχή στο `databaseURL`). Συμπληρώστε και το `APP_URL` με το τελικό URL του φακέλου (μπαίνει στους συνδέσμους των email).

## Βήμα 2 — Αποστολή email (δωρεάν)

Το email έγκρισης πρέπει να περιέχει τον κωδικό του χρήστη, κάτι που τα έτοιμα email του Firebase δεν υποστηρίζουν, οπότε υπάρχουν δύο δωρεάν τρόποι:

**Α. Χωρίς καμία ρύθμιση (προεπιλογή):** με την έγκριση, ο κωδικός εμφανίζεται στον διαχειριστή και ανοίγει **έτοιμο email** (με παραλήπτη, θέμα, κωδικό και σύνδεσμο) στο πρόγραμμα αλληλογραφίας του — αποστολή με ένα κλικ από το ιδρυματικό του email. Το ίδιο ισχύει για τις ειδοποιήσεις αλλαγών που κάνει ο admin.

**Β. Πλήρως αυτόματα με EmailJS (δωρεάν πρόγραμμα, χωρίς κάρτα, ~200 email/μήνα):**
1. Λογαριασμός στο [emailjs.com](https://www.emailjs.com) → **Add New Service** (συνδέστε το ιδρυματικό Gmail/Outlook) → κρατήστε το **Service ID**.
2. **Email Templates → Create New Template** με: To Email = `{{to_email}}`, Subject = `{{subject}}`, Content = `{{message}}`.
3. **Account → General** → **Public Key**.
4. Περάστε Public Key, Service ID, Template ID στο `EMAILJS` του `assets/config.js`.

Με το Β, το email έγκρισης (με τον κωδικό), ο σύνδεσμος και **όλες** οι ειδοποιήσεις αλλαγών (και όταν την αλλαγή κάνει ο ίδιος ο χρήστης) στέλνονται αυτόματα. Τα email «Ξέχασα τον κωδικό» στέλνονται πάντα αυτόματα από το ίδιο το Firebase, και στις δύο περιπτώσεις.

## Βήμα 3 — Φιλοξενία

- **Firebase Hosting** (δωρεάν στο Spark): `npm i -g firebase-tools`, `firebase login`, `firebase init hosting`, βάλτε τα αρχεία στον φάκελο `public`, `firebase deploy`.
- Εναλλακτικά GitHub Pages ή ο web server του ιδρύματος — απλώς ανεβάστε τον φάκελο όπως είναι.

## Δομή δεδομένων στη βάση (JSON)

```
admins/<uid>: true                      ← ποιοι λογαριασμοί είναι διαχειριστές
activeSession: "<sessionId>"
sessions/<sessionId>/
  meta:     { title, dateFrom, dateTo, hourStart, hourEnd, updatedAt }
  blocked:  { "2026-10-03": { "15": true } }        ← μη διαθέσιμα slots
  requests: { <id>: { name, email, dept, notes,
                      status: pending|approved|rejected,
                      createdAt, decidedAt, account } }
  bookings: { "2026-10-03": { "10": { email, name, desc, updatedAt } } }
```

Κάθε session κρατά τίτλο, χρονικό παράθυρο, κλειστά slots και τους εγκεκριμένους χρήστες με τα στοιχεία των αιτημάτων τους. Για νέα περίοδο, ο admin αλλάζει τίτλο/ημερομηνίες — ή δημιουργείτε νέο κόμβο `sessions` και δείχνετε το `activeSession` σε αυτόν, ώστε να διατηρηθεί το ιστορικό.

## Σημειώσεις

- Οι κωδικοί **δεν αποθηκεύονται πουθενά** στη βάση — μόνο στο Firebase Authentication (κρυπτογραφημένα) και στο email που λαμβάνει ο χρήστης. Αν χαθεί το email, χρησιμοποιείται η «Επαναφορά κωδικού» (κουμπί υπάρχει και στον admin, στα εγκεκριμένα αιτήματα).
- Αν εγκριθεί email που έχει ήδη λογαριασμό (π.χ. από προηγούμενη περίοδο), δεν δημιουργείται νέος: στέλνεται αυτόματα email επαναφοράς κωδικού από το Firebase, μαζί με τον σύνδεσμο χρονοπρογραμματισμού.
- Οι έλεγχοι «4 ώρες/ημέρα» και «κλείδωμα 1 ημέρας» (σταθερές `MAX_HOURS_PER_DATE`, `LOCK_DAYS` στο `config.js`) εφαρμόζονται στη σελίδα· για απόλυτη επιβολή τους μπορούν αργότερα να προστεθούν validation rules.
