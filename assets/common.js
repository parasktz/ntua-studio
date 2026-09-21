/* =====================================================================
   ΚΟΙΝΟΣ ΚΩΔΙΚΑΣ — φορτώνεται σε κάθε σελίδα μετά τα Firebase SDK
   και το config.js.
   ===================================================================== */

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.database();
/* ---------- Βοηθητικά ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const fmtDate = ds => { const [y,m,d] = ds.split("-"); return `${d}/${m}/${y}`; };
const dayName = ds => ["Κυρ","Δευ","Τρί","Τετ","Πέμ","Παρ","Σάβ"][new Date(ds+"T12:00:00").getDay()];
const fmtHour = h => `${pad(h)}:00–${pad(h+1)}:00`;
const normEmail = e => String(e || "").trim().toLowerCase();
const daysDiff = ds => Math.round((new Date(ds+"T00:00:00") - new Date(todayStr()+"T00:00:00")) / 86400000);

function toast(msg, err) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = err ? "err show" : "show";
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), 3800);
}

/* ---------- Κατάσταση & realtime φόρτωση δεδομένων ---------- */
const S = {
  sessionId: null,
  session: null,        // { title, dateFrom, dateTo, hourStart, hourEnd }
  blocked: {},          // { "2026-10-01": { "9": true } }
  requests: {},         // { rid: { name, email, dept, notes, status, ... } }
  bookings: {},         // { "2026-10-01": { "9": { email, name, desc } } }
  weekIndex: 0,
  _ls: []
};
let _onData = () => {};
function watchData(cb) { if (cb) { _onData = cb; cb(); } }

function _detach() { S._ls.forEach(({ ref, cb }) => ref.off("value", cb)); S._ls = []; }
function _listen(ref, cb) { ref.on("value", cb); S._ls.push({ ref, cb }); }
function _fire() {
  const t = $("topSessionTitle");
  if (t) t.textContent = S.session ? S.session.title : "";
  _onData();
}

db.ref("activeSession").on("value", snap => {
  const sid = snap.val();
  if (sid === S.sessionId) { _fire(); return; }
  _detach();
  S.sessionId = sid;
  S.session = null; S.blocked = {}; S.requests = {}; S.bookings = {}; S.reqReady = false;
  if (!sid) { _fire(); return; }
  const base = db.ref("sessions/" + sid);
  _listen(base.child("meta"),     s => { S.session  = s.val(); _fire(); });
  _listen(base.child("blocked"),  s => { S.blocked  = s.val() || {}; _fire(); });
  _listen(base.child("requests"), s => { S.requests = s.val() || {}; S.reqReady = true; _fire(); });
  _listen(base.child("bookings"), s => { S.bookings = s.val() || {}; _fire(); });
});

/* ---------- Παράγωγα δεδομένα ---------- */
function sessionDates() {
  if (!S.session) return [];
  const out = [];
  let d = new Date(S.session.dateFrom + "T12:00:00");
  const end = new Date(S.session.dateTo + "T12:00:00");
  while (d <= end && out.length < 400) {
    out.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function sessionHours() {
  if (!S.session) return [];
  const out = [];
  for (let h = S.session.hourStart; h < S.session.hourEnd; h++) out.push(h);
  return out;
}
function approvedUsers() {
  return Object.entries(S.requests)
    .filter(([, r]) => r.status === "approved")
    .map(([id, r]) => ({ id, ...r }));
}
function userSlots(email) {
  const out = [];
  for (const [date, hrs] of Object.entries(S.bookings || {}))
    for (const [h, b] of Object.entries(hrs || {}))
      if (normEmail(b.email) === normEmail(email)) out.push({ date, hour: +h, ...b });
  out.sort((a, b) => a.date === b.date ? a.hour - b.hour : a.date.localeCompare(b.date));
  return out;
}
function userHoursOn(email, date) {
  return Object.values(S.bookings?.[date] || {}).filter(b => normEmail(b.email) === normEmail(email)).length;
}
/* Ο χρήστης αλλάζει slot μόνο έως LOCK_DAYS ημέρα(-ες) πριν την ημερομηνία */
const userCanEditDate = date => daysDiff(date) >= LOCK_DAYS;

/* ---------- Modal (στις σελίδες που έχουν #overlay) ---------- */
function openModal({ title, meta, bodyHTML, buttons }) {
  if (!$("overlay")) return;
  $("mTitle").textContent = title || "";
  $("mMeta").textContent = meta || "";
  $("mBody").innerHTML = bodyHTML || "";
  const bt = $("mBtns");
  bt.innerHTML = "";
  (buttons || []).forEach(b => {
    const el = document.createElement("button");
    el.className = "btn " + (b.kind || "secondary");
    el.textContent = b.label;
    el.onclick = () => { const r = b.onClick ? b.onClick() : null; if (r !== false) closeModal(); };
    bt.appendChild(el);
  });
  $("overlay").classList.add("open");
}
const closeModal = () => { const o = $("overlay"); if (o) o.classList.remove("open"); };

document.addEventListener("DOMContentLoaded", () => {
  const ov = $("overlay");
  if (ov) {
    ov.addEventListener("click", e => { if (e.target === ov) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  }
  const lo = $("btnLogout");
  if (lo) lo.addEventListener("click", async () => { await auth.signOut(); location.href = "index.html"; });
});

/* =====================================================================
   ΗΜΕΡΟΛΟΓΙΟ — κοινός renderer (εβδομάδα-εβδομάδα)
   who: "admin" | "user" · myEmail: email συνδεδεμένου χρήστη (για "user")
   ===================================================================== */
function buildCalendar(containerId, who, myEmail, onCellClick) {
  const box = $(containerId);
  if (!box) return;
  if (!S.session) { box.innerHTML = '<p class="empty">Δεν έχει οριστεί ενεργό session.</p>'; return; }
  const dates = sessionDates(), hours = sessionHours();
  if (!dates.length || !hours.length) { box.innerHTML = '<p class="empty">Μη έγκυρο χρονικό παράθυρο.</p>'; return; }

  const weeks = Math.ceil(dates.length / 7);
  S.weekIndex = Math.min(Math.max(S.weekIndex, 0), weeks - 1);
  const wi = S.weekIndex;
  const wDates = dates.slice(wi * 7, wi * 7 + 7);

  let html = `
    <div class="cal-head">
      <div class="cal-range">${fmtDate(wDates[0])} – ${fmtDate(wDates[wDates.length-1])}
        <span class="hint" style="font-weight:400"> · εβδομάδα ${wi+1}/${weeks}</span></div>
      <div class="cal-nav">
        <button class="btn secondary small" data-nav="-1" ${wi===0?"disabled":""}>← Προηγούμενη</button>
        <button class="btn secondary small" data-nav="1" ${wi===weeks-1?"disabled":""}>Επόμενη →</button>
      </div>
    </div>
    <div class="cal-scroll"><table class="cal"><thead><tr><th></th>`;
  wDates.forEach(d => html += `<th>${dayName(d)}<span class="d">${fmtDate(d)}</span></th>`);
  html += `</tr></thead><tbody>`;

  hours.forEach(h => {
    html += `<tr><td class="hour">${fmtHour(h)}</td>`;
    wDates.forEach(date => {
      const b = S.bookings?.[date]?.[h];
      const blocked = !!S.blocked?.[date]?.[h];
      const past = daysDiff(date) < 0;
      let cls = "slot", tag = "", title = "";
      if (blocked) { cls += " blocked"; title = "Μη διαθέσιμο (κλειστό studio)"; }
      else if (b) {
        const mine = who === "user" && normEmail(b.email) === normEmail(myEmail);
        if (who === "admin" || mine) {
          cls += " mine";
          tag = esc(who === "admin" ? (b.name || b.email) : (b.desc || "Κράτησή μου"));
          title = `${b.name || b.email} — ${b.desc || ""}`;
        } else { cls += " other"; tag = "Δεσμευμένο"; title = "Δεσμευμένο από άλλον χρήστη"; }
      }
      if (past) cls += " past";
      else if (who === "user" && !userCanEditDate(date)) cls += " locked";
      html += `<td class="${cls}" data-date="${date}" data-hour="${h}" title="${esc(title)}">${tag?`<span class="tag">${tag}</span>`:""}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>
    <div class="legend">
      <span><i class="l-free"></i>Διαθέσιμο</span>
      <span><i class="l-mine"></i>${who==="admin"?"Κράτηση χρήστη":"Δική μου κράτηση"}</span>
      ${who==="user"?'<span><i class="l-other"></i>Δεσμευμένο από άλλον</span>':""}
      <span><i class="l-blocked"></i>Μη διαθέσιμο studio</span>
      <span><i class="l-locked"></i>Κλειδωμένο (παρελθόν / &lt;${LOCK_DAYS} ημέρα)</span>
    </div>`;
  box.innerHTML = html;

  box.querySelectorAll("[data-nav]").forEach(btn => btn.onclick = () => {
    S.weekIndex += +btn.dataset.nav; buildCalendar(containerId, who, myEmail, onCellClick);
  });
  box.querySelectorAll("td.slot").forEach(td =>
    td.addEventListener("click", () => onCellClick(td.dataset.date, +td.dataset.hour)));
}

/* =====================================================================
   ΛΟΓΑΡΙΑΣΜΟΙ & EMAIL — όλα μέσω Firebase, χωρίς τρίτες υπηρεσίες.
   • Με την ΥΠΟΒΟΛΗ αίτησης δημιουργείται λογαριασμός με κρυπτογραφικά
     τυχαίο μυστικό (που δεν το γνωρίζει κανείς) και ΤΟ ΙΔΙΟ το Firebase
     στέλνει αυτόματα email «Ορισμός κωδικού»: ο χρήστης ορίζει τον
     προσωπικό του κωδικό, ο οποίος δεν λήγει ποτέ.
   • Κανένας κωδικός δεν ταξιδεύει ποτέ μέσα σε email και ούτε κωδικός
     ούτε email εμφανίζονται σε URL — ο σύνδεσμος του Firebase περιέχει
     μόνο ένα μίας χρήσης, χρονικά περιορισμένο token ενέργειας.
   • Ειδοποιήσεις με ελεύθερο κείμενο (έγκριση, αλλαγές από τον admin)
     ανοίγουν ως έτοιμα email στο πρόγραμμα αλληλογραφίας του
     διαχειριστή, για αποστολή με ένα κλικ.
   ===================================================================== */
function baseURL() {
  let b = APP_URL || location.href.replace(/[?#].*$/, "").replace(/[^\/]*$/, "");
  if (!b.endsWith("/")) b += "/";
  return b;
}
/* Ο σύνδεσμος ΔΕΝ περιέχει ποτέ email ή κωδικό — μόνο τη σελίδα εισόδου */
const scheduleLink = () => baseURL() + "schedule.html";

/* Κρυπτογραφικά τυχαίο αρχικό μυστικό λογαριασμού (24 χαρακτήρες).
   ΔΕΝ αποστέλλεται και ΔΕΝ αποθηκεύεται πουθενά σε αναγνώσιμη μορφή —
   ο χρήστης ορίζει δικό του κωδικό μέσω του email του Firebase. */
function randomSecret(len = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  let p = "";
  for (let i = 0; i < len; i++) p += chars[a[i] % chars.length];
  return p;
}

/* Δεύτερη σύνδεση Firebase, ώστε η δημιουργία λογαριασμού να μην
   επηρεάζει τον συνδεδεμένο χρήστη/διαχειριστή της σελίδας */
let _secApp = null;
function secondaryAuth() {
  if (!_secApp) _secApp = firebase.initializeApp(FIREBASE_CONFIG, "acctCreate");
  return _secApp.auth();
}

/* Δημιουργία λογαριασμού (αν δεν υπάρχει) + email «Ορισμός κωδικού»
   που στέλνει ΤΟ ΙΔΙΟ το Firebase. Επιστρέφει:
   "created" | "exists" | "error" */
async function provisionAccount(email) {
  email = normEmail(email);
  try {
    await secondaryAuth().createUserWithEmailAndPassword(email, randomSecret());
    await secondaryAuth().signOut();
    try { await auth.sendPasswordResetEmail(email); } catch (e) {}
    return "created";
  } catch (e) {
    if (e.code === "auth/email-already-in-use") return "exists";
    console.error("provisionAccount:", e);
    return "error";
  }
}

/* Ανοίγει έτοιμο email στο προεπιλεγμένο πρόγραμμα αλληλογραφίας */
function openMailDraft(to, subject, message) {
  const a = document.createElement("a");
  a.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const slotsText = email => {
  const s = userSlots(email);
  return s.length ? s.map(x => `• ${dayName(x.date)} ${fmtDate(x.date)}  ${fmtHour(x.hour)}  — ${x.desc || ""}`).join("\n")
                  : "— καμία κράτηση —";
};

/* Αλλαγές σε slots από τον ADMIN → έτοιμο email ενημέρωσης προς τον
   χρήστη με τον πλήρη νέο προγραμματισμό του. Διαδοχικές αλλαγές του
   ίδιου χρήστη ομαδοποιούνται σε ένα email. (Οι αλλαγές που κάνει ο
   ίδιος ο χρήστης εμφανίζονται ζωντανά στη σελίδα του.) */
const _pendingMail = {};
function queueChangeEmail(email) {
  email = normEmail(email);
  clearTimeout(_pendingMail[email]);
  _pendingMail[email] = setTimeout(() => { delete _pendingMail[email]; openChangeEmail(email); }, 2500);
}
function openChangeEmail(email) {
  const u = approvedUsers().find(x => normEmail(x.email) === email);
  const name = u ? u.name : email;
  const subject = `Ενημέρωση κρατήσεων βιντεοσκόπησης — ${S.session ? S.session.title : ""}`;
  const body = `Αγαπητέ/ή ${name},\n\nΟι κρατήσεις σας στο studio ενημερώθηκαν από τον διαχειριστή. Τρέχων προγραμματισμός:\n\n${slotsText(email)}\n\nΠροβολή/αλλαγές: ${scheduleLink()}`;
  openMailDraft(email, subject, body);
  toast(`Άνοιξε email ενημέρωσης προς ${email} — πατήστε αποστολή.`);
}
