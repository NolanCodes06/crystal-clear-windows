<script>
(function () {
"use strict";

/* ---------------- Data ---------------- */
const ZIP_RAW = "__ZIPS__";
const ZIPS = {};
ZIP_RAW.split(";").forEach(s => { const p = s.split(","); ZIPS[p[0]] = { lat: +p[1], lng: +p[2], city: p.slice(3).join(",") }; });
const AREA_NAMES = {"78209":"Alamo Heights","78212":"Monte Vista","78215":"the Pearl","78258":"Stone Oak","78259":"Stone Oak","78260":"Timberwood Park","78261":"Encino Ranch","78023":"Helotes","78006":"Boerne","78015":"Fair Oaks Ranch","78154":"Schertz","78108":"Cibolo","78109":"Converse","78148":"Universal City","78163":"Bulverde","78238":"Leon Valley","78253":"Alamo Ranch","78249":"Medical Center","78229":"Medical Center","78230":"Shavano Park","78231":"Shavano Park","78232":"Hollywood Park","78248":"Hollywood Park","78213":"Castle Hills","78216":"Airport area","78217":"Northeast SA","78218":"Northeast SA","78247":"Northeast SA","78130":"New Braunfels","78132":"New Braunfels","78155":"Seguin","78070":"Spring Branch","78251":"Westover Hills","78245":"Westover Hills","78204":"Southtown","78210":"Southtown","78201":"Beacon Hill","78205":"Downtown","78207":"West Side","78256":"The Dominion","78257":"The Dominion","78266":"Garden Ridge","78124":"Marion","78114":"Floresville","78112":"Elmendorf","78052":"Lytle","78004":"Bergheim","78013":"Comfort"};

const SIZES = ["S", "M", "L", "D"];
const SIZE_INFO = {
  S: { name: "Small", plural: "Small windows", desc: "Under about 3 × 3 ft. Bathroom, transom, sidelight." },
  M: { name: "Medium", plural: "Medium windows", desc: "About 3 × 5 ft. A standard bedroom or living room window." },
  L: { name: "Large", plural: "Large windows", desc: "Bigger than 4 × 6 ft. Picture window or a big slider panel." },
  D: { name: "Glass door", plural: "Glass doors", desc: "Sliding patio door or French door. Count the whole door as one." }
};
const PKG = { exterior: "Outside only", standard: "Inside & Out", detail: "Full Detail" };
const PLAN = { once: { label: "One-time", visits: 1 }, twice: { label: "Twice a year", visits: 2 }, thrice: { label: "Every 4 months", visits: 3 }, quarterly: { label: "Quarterly", visits: 4 } };
const THANKS = { military: "Military and veterans", responder: "First responders", senior: "Seniors 65+" };
const LAST = { recent: "cleaned within a year", mid: "last cleaned 1 to 3 years ago", old: "3+ years or never cleaned" };
const DRIVEWAY = { S: "Small, 1-car (up to ~400 sq ft)", M: "Medium, 2-car (~800 sq ft)", L: "Large, 3-car or long (~1,200 sq ft)" };

/* ---------------- Utilities ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r2 = v => Math.round((+v || 0) * 100) / 100;
const clone = o => JSON.parse(JSON.stringify(o));
const int = v => { const n = parseInt(String(v).replace(/[^\d]/g, ""), 10); return isFinite(n) ? Math.max(0, Math.min(n, 999)) : 0; };
function money(v, forceCents) {
  v = r2(v); const neg = v < 0; const a = Math.abs(v);
  const cents = forceCents || Math.round(a * 100) % 100 !== 0;
  return (neg ? "−$" : "$") + a.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}
const pct = v => Math.round(v * 1000) / 10 + "%";
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function safe(fn, d) { try { return fn(); } catch (e) { return d; } }
const store = {
  get(k, d) { return safe(() => { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }, d); },
  set(k, v) { return safe(() => { localStorage.setItem(k, JSON.stringify(v)); return true; }, false); },
  del(k) { safe(() => localStorage.removeItem(k)); }
};
const sess = {
  get(k, d) { return safe(() => { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); }, d); },
  set(k, v) { safe(() => sessionStorage.setItem(k, JSON.stringify(v))); },
  del(k) { safe(() => sessionStorage.removeItem(k)); }
};
function deepMerge(a, b) {
  if (!b || typeof b !== "object") return a;
  const o = Array.isArray(a) ? a.slice() : Object.assign({}, a);
  Object.keys(b).forEach(k => {
    const av = a ? a[k] : undefined, bv = b[k];
    o[k] = (av && bv && typeof av === "object" && typeof bv === "object" && !Array.isArray(av) && !Array.isArray(bv)) ? deepMerge(av, bv) : bv;
  });
  return o;
}
const phoneDigits = p => { const d = String(p || "").replace(/\D/g, ""); return d.length === 10 ? "1" + d : d; };
const telHref = p => "tel:+" + phoneDigits(p);
const smsHref = (p, body) => "sms:+" + phoneDigits(p) + (body ? "?&body=" + encodeURIComponent(body) : "");
function toast(msg) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { ok = document.execCommand("copy"); } catch (e2) { ok = false; } ta.remove();
  }
  toast(ok ? "Copied" : "Copy didn't work here. Select the text and copy it.");
  if (btn && ok) { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1400); }
  return ok;
}
function downloadBlob(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function newRef() {
  const al = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; let s = "";
  const r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(5)) : Array.from({ length: 5 }, () => Math.random() * 256 | 0);
  for (let i = 0; i < 5; i++) s += al[r[i] % al.length];
  return "CC-" + s;
}
function encodeQuote(obj) {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  return "CCW1." + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeQuote(text) {
  const m = String(text || "").match(/CCW1\.([A-Za-z0-9_-]{20,})/);
  if (!m) throw new Error("No quote code found. It starts with CCW1.");
  let s = m[1].replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const obj = JSON.parse(decodeURIComponent(escape(atob(s))));
  if (!obj || !obj.q) throw new Error("That code is incomplete. Copy the whole thing.");
  return obj;
}

/* ---------------- Config (published + optional owner test override) ---------------- */
let CFG = deepMerge(clone(CONFIG), store.get("ccw.testConfig", null));
function reloadConfig() { CFG = deepMerge(clone(CONFIG), store.get("ccw.testConfig", null)); }
const testing = () => !!store.get("ccw.testConfig", null);

/* ---------------- Engine ---------------- */
function haversine(a, b) {
  const R = 3958.8, t = x => x * Math.PI / 180;
  const dLa = t(b.lat - a.lat), dLo = t(b.lng - a.lng);
  const s = Math.sin(dLa / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function placeName(zip) { return AREA_NAMES[zip] || (ZIPS[zip] ? ZIPS[zip].city : ""); }
function travelFor(zip, cfg) {
  zip = String(zip || "").trim();
  if (!/^\d{5}$/.test(zip)) return { status: "none" };
  const base = ZIPS[cfg.business.baseZip], to = ZIPS[zip];
  if (!base) return { status: "nobase", zip };
  if (!to) return { status: "unknown", zip };
  const miles = haversine(base, to) * (+cfg.travel.roadFactor || 1.2);
  const place = placeName(zip);
  const zones = cfg.travel.zones || [];
  for (let i = 0; i < zones.length; i++) if (miles <= +zones[i].upTo) return { status: "ok", zip, miles, place, zone: i, zoneName: zones[i].name, fee: +zones[i].fee || 0 };
  return { status: "far", zip, miles, place };
}

function computeQuote(q, cfg) {
  const res = { windows: [], addons: [], discounts: [], adjust: [], travelLine: null };
  const n = v => Math.max(0, Math.floor(+v || 0));
  const counts = {}; SIZES.forEach(s => (counts[s] = n(q.counts && q.counts[s])));
  const totalWin = SIZES.reduce((a, s) => a + counts[s], 0);
  const pkg = cfg.windows[q.pkg] ? q.pkg : "standard";
  const P = cfg.windows[pkg];
  const stories = [1, 2, 3].includes(+q.stories) ? +q.stories : 1;
  let winBase = 0;
  SIZES.forEach(s => { if (counts[s] > 0) { const a = r2(counts[s] * P[s]); winBase += a; res.windows.push({ label: SIZE_INFO[s].plural, d: counts[s] + " × " + money(P[s]), a }); } });
  const up = stories > 1 ? Math.min(n(q.upstairs), totalWin) : 0;
  const upRate = stories >= 3 ? +cfg.surcharges.upstairs3 : +cfg.surcharges.upstairs2;
  if (up) res.windows.push({ label: "Upstairs ladder work", d: up + " × " + money(upRate), a: r2(up * upRate) });
  const grids = Math.min(n(q.grids), totalWin);
  if (grids) res.windows.push({ label: "Grids on the glass", d: grids + " × " + money(cfg.surcharges.grids), a: r2(grids * cfg.surcharges.grids) });
  const preBuild = r2(winBase + up * upRate + grids * cfg.surcharges.grids);
  const factor = +(cfg.buildup[q.last] || 1);
  const buildAmt = r2(preBuild * (factor - 1));
  if (buildAmt > 0) res.windows.push({ label: "First-clean build-up", d: LAST[q.last] + ", +" + pct(factor - 1), a: buildAmt });

  const A = cfg.addons;
  const hw = Math.min(n(q.hardWater), totalWin), sky = n(q.skylights), mir = n(q.mirrors);
  if (hw) res.addons.push({ label: "Hard water spot treatment", d: hw + " × " + money(A.hardWater), a: r2(hw * A.hardWater), win: true });
  if (sky) res.addons.push({ label: "Skylights", d: sky + " × " + money(A.skylight), a: r2(sky * A.skylight), win: true });
  if (mir) res.addons.push({ label: "Mirrors and interior glass", d: mir + " × " + money(A.mirror), a: r2(mir * A.mirror), win: true });
  const windowsSub = r2(preBuild + buildAmt + res.addons.reduce((s, l) => s + l.a, 0));

  if (q.gutters) {
    const g = +A.gutters[String(stories)] || 0; const bundled = totalWin > 0;
    const a = bundled ? r2(g * (1 - (+A.gutterBundle || 0))) : g;
    res.addons.push({ label: "Gutter cleaning, " + stories + "-story", d: bundled ? money(g) + " less " + pct(A.gutterBundle) + " with windows" : "Gutters and downspouts", a });
  }
  const sol = n(q.solarPanels);
  if (sol) { const raw = r2(sol * A.solarPanel); const a = Math.max(raw, +A.solarMin || 0); res.addons.push({ label: "Solar panel wash", d: sol + " × " + money(A.solarPanel) + (a > raw ? ", " + money(A.solarMin) + " minimum" : ""), a }); }
  const rs = n(q.rescreen), rss = n(q.rescreenSolar);
  if (rs) res.addons.push({ label: "Rescreening", d: rs + " × " + money(A.rescreen), a: r2(rs * A.rescreen) });
  if (rss) res.addons.push({ label: "Solar screen rescreening", d: rss + " × " + money(A.rescreenSolar), a: r2(rss * A.rescreenSolar) });
  if (q.driveway && A.driveway[q.driveway] != null) res.addons.push({ label: "Driveway and walkway wash", d: DRIVEWAY[q.driveway], a: +A.driveway[q.driveway] });

  const servicesSub = r2(windowsSub + res.addons.filter(l => !l.win && !l.onsite).reduce((s, l) => s + l.a, 0));
  const D = cfg.discounts;
  const planPct = +(cfg.plans[q.plan] || 0);
  let discTotal = 0;
  if (planPct > 0 && windowsSub > 0) { const a = r2(windowsSub * planPct); discTotal += a; res.discounts.push({ label: PLAN[q.plan].label + " plan", d: pct(planPct) + " off window work", a: -a }); }
  if (q.thanks && THANKS[q.thanks] && servicesSub > 0) { const a = r2(servicesSub * D.thankYou); discTotal += a; res.discounts.push({ label: "Thank-you: " + THANKS[q.thanks], d: pct(D.thankYou) + " off", a: -a }); }
  if (q.neighbor && servicesSub > 0) { const a = r2(servicesSub * D.neighbor); discTotal += a; res.discounts.push({ label: "Neighbor deal", d: pct(D.neighbor) + " off" + (q.neighborName ? ", with " + q.neighborName : ""), a: -a }); }
  const cap = r2(servicesSub * D.cap);
  if (discTotal > cap) { res.discounts.push({ label: "Discount limit", d: "Savings cap at " + pct(D.cap), a: r2(discTotal - cap) }); discTotal = cap; }
  const afterDisc = r2(servicesSub - discTotal);
  let minAdj = 0;
  if (servicesSub > 0 && afterDisc < +cfg.minimum) { minAdj = r2(+cfg.minimum - afterDisc); res.adjust.push({ label: "Minimum visit", d: "Visits start at " + money(cfg.minimum), a: minAdj }); }

  const t = travelFor(q.zip, cfg);
  let fee = 0, travelKnown = true;
  if (t.status === "ok") {
    fee = t.fee; let d = (t.place ? t.place + ", " : "") + "about " + Math.round(t.miles) + " road mi, " + t.zoneName;
    if (fee > 0 && q.neighbor) { fee = r2(fee * D.neighborTripShare); d += ", split with neighbor"; }
    res.travelLine = { label: "Trip", d, a: fee, free: fee === 0 };
  } else if (t.status === "far") {
    travelKnown = false; res.travelLine = { label: "Trip", d: (t.place ? t.place + ", " : "") + "about " + Math.round(t.miles) + " road mi. Outside the regular area; Luke confirms the trip fee.", a: null };
  } else if (t.status === "unknown" || t.status === "nobase") {
    travelKnown = false; res.travelLine = { label: "Trip", d: "ZIP " + t.zip + " not on our map yet. Luke confirms travel.", a: null };
  } else {
    travelKnown = false; res.travelLine = { label: "Trip", d: "Add your ZIP to see travel. Free inside the home zone.", a: null };
  }
  const total = servicesSub > 0 ? r2(afterDisc + minAdj + fee) : 0;

  // time on site
  const T = cfg.time; let m = 0;
  SIZES.forEach(s => { m += counts[s] * T[s] * (pkg === "exterior" ? T.exteriorFactor : 1) + (pkg === "detail" ? counts[s] * T.detailExtra : 0); });
  m += up * T.upstairs + grids * T.grids; m *= factor;
  m += hw * T.hardWater + sky * T.skylight + mir * T.mirror;
  if (q.gutters) m += +T.gutters[String(stories)] || 0;
  if (sol) m += sol * T.solarPanel + T.solarSetup;
  m += (rs + rss) * T.rescreen;
  if (q.driveway && T.driveway[q.driveway]) m += T.driveway[q.driveway];
  if (m > 0) m += T.setup;

  return {
    pkg, stories, counts, totalWin, windowsSub, servicesSub, discTotal: r2(discTotal), afterDisc, minAdj, travel: t, fee, travelKnown,
    total, minutes: Math.round(m), plan: q.plan in PLAN ? q.plan : "once", visits: (PLAN[q.plan] || PLAN.once).visits,
    onsite: res.addons.some(l => l.onsite), lines: res, savedPerVisit: r2(planPct > 0 && windowsSub > 0 ? windowsSub * planPct : 0)
  };
}
function fmtMinutes(m) { if (!m) return "0 min"; m = Math.max(5, Math.round(m / 5) * 5); const h = Math.floor(m / 60), mm = m % 60; return (h ? h + " hr" : "") + (h && mm ? " " : "") + (mm ? mm + " min" : ""); }
function profitFor(res, cfg) {
  const o = cfg.ops; const site = res.minutes / 60;
  const trip = res.travel.status === "ok" || res.travel.status === "far" ? res.travel.miles * 2 : 0;
  const drive = trip / (+o.avgMph || 35);
  const vehicle = r2(trip * o.mileRate), supplies = r2((res.total - res.fee) * o.supplyPct), card = r2(res.total * o.cardFeePct);
  const keep = r2(res.total - vehicle - supplies - card);
  const hours = Math.max(.25, site + drive);
  return { site, drive, trip, vehicle, supplies, card, keep, perHour: r2(keep / hours), helper: r2(keep - hours * o.laborRate), hours };
}

function summaryText(res, q, c, ref) {
  const L = [];
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  L.push(CFG.business.name + " quote " + ref + " (" + date + ")");
  const cnt = SIZES.filter(s => res.counts[s]).map(s => res.counts[s] + " " + (s === "D" ? "door" + (res.counts[s] > 1 ? "s" : "") : s)).join(", ");
  L.push(PKG[res.pkg] + ": " + res.totalWin + " windows (" + (cnt || "none") + "), " + res.stories + "-story" + (res.stories > 1 && +q.upstairs ? ", " + Math.min(+q.upstairs, res.totalWin) + " upstairs" : "") + (+q.grids ? ", " + q.grids + " with grids" : ""));
  if (q.last !== "recent") L.push("Condition: " + LAST[q.last]);
  const ad = res.lines.addons.map(l => l.label + " (" + l.d + ")");
  if (res.lines.addons.some(l => l.onsite)) ad.push("ON-SITE ESTIMATE NEEDED");
  if (ad.length) L.push("Add-ons: " + ad.join("; "));
  const ds = res.lines.discounts.filter(l => l.a < 0).map(l => l.label + " " + l.d.split(" ")[0]);
  if (res.plan !== "once") L.push("Plan: " + PLAN[res.plan].label);
  if (ds.length) L.push("Savings: " + ds.join(", "));
  const t = res.lines.travelLine; L.push("Location: ZIP " + (q.zip || "not given") + (t ? ". " + t.d + (t.a ? ", " + money(t.a) : "") : ""));
  L.push("TOTAL: " + money(res.total) + " per visit" + (res.travelKnown ? "" : " plus travel if any") + (res.visits > 1 ? " (" + res.visits + " visits a year)" : ""));
  L.push("Time on site: about " + fmtMinutes(res.minutes));
  if (c) {
    if (c.name) L.push("Name: " + c.name);
    if (c.phone) L.push("Phone: " + c.phone);
    if (c.email) L.push("Email: " + c.email);
    if (c.address) L.push("Address: " + c.address);
    if (c.pref) L.push("Prefers: " + c.pref);
    if (c.notes) L.push("Notes: " + c.notes);
    if (c.ref) L.push("Referred by: " + c.ref);
  }
  return L.join("\n");
}

/* ---------------- Shared receipt HTML (site + owner tools) ---------------- */
function ticketGroups(res) {
  const g = (title, lines) => lines.length ? '<div class="og"><div class="og-t">' + esc(title) + "</div>" + lines.map(l =>
    '<div class="ol' + (l.a != null && l.a < 0 ? " neg" : "") + (l.a == null ? " warn" : "") + '"><span>' + esc(l.label) + '</span><span class="a">' + (l.a == null ? (l.onsite ? "On site" : "TBD") : (l.free ? "Free" : money(l.a))) + '</span>' + (l.d ? '<span class="d">' + esc(l.d) + "</span>" : "") + "</div>").join("") + "</div>" : "";
  const L = res.lines;
  return g(PKG[res.pkg], L.windows) + g("Add-ons", L.addons) + g("Savings", L.discounts.concat(L.adjust)) + (L.travelLine ? g("Travel", [L.travelLine]) : "");
}
function profitHTML(p, cfg) {
  return '<div class="profit">' +
    '<div><span>Time on site</span><b>' + fmtMinutes(Math.round(p.site * 60)) + "</b></div>" +
    '<div><span>Driving, round trip</span><b>' + (p.trip ? Math.round(p.trip) + " mi" : "n/a") + "</b></div>" +
    '<div><span>Vehicle at ' + money(cfg.ops.mileRate, true) + "/mi</span><b>" + money(p.vehicle) + "</b></div>" +
    '<div><span>Supplies</span><b>' + money(p.supplies) + "</b></div>" +
    '<div><span>Card fee, if card</span><b>' + money(p.card) + "</b></div>" +
    '<div class="hl"><span>You keep</span><b>' + money(p.keep) + "</b></div>" +
    '<div class="hl"><span>Per hour of your time</span><b>' + money(p.perHour) + "</b></div>" +
    '<div><span>With a helper at ' + money(cfg.ops.laborRate) + "/hr</span><b>" + money(p.helper) + "</b></div></div>";
}

/* ---------------- Quote builder state ---------------- */
const EXAMPLE = { zip: "78209", stories: 2, last: "mid", pkg: "standard", counts: { S: 4, M: 12, L: 3, D: 1 }, upstairs: 8, grids: 0, hardWater: 0, skylights: 0, mirrors: 0, gutters: false, solarPanels: 0, rescreen: 0, rescreenSolar: 0, driveway: "", plan: "once", thanks: "", neighbor: false, neighborName: "" };
const BLANK = Object.assign(clone(EXAMPLE), { zip: "", stories: 1, last: "recent", counts: { S: 0, M: 0, L: 0, D: 0 }, upstairs: 0 });
let draft = store.get("ccw.draft", null);
let Q = draft && draft.q ? deepMerge(clone(BLANK), draft.q) : clone(EXAMPLE);
let isExample = !(draft && draft.q);
const owner = () => sess.get("ccw.owner", false) === true;
let lastSig = "", lastRef = "";
function contact() {
  return {
    name: $("#cName").value.trim(), phone: $("#cPhone").value.trim(), email: $("#cEmail").value.trim(),
    address: $("#cAddress").value.trim(), pref: (($$('input[name="pref"]').find(i => i.checked) || {}).value) || "Text",
    notes: $("#cNotes").value.trim(), ref: $("#cRef").value.trim(), hp: $("#cWebsite").value.trim()
  };
}
function refFor() { const sig = JSON.stringify(Q); if (sig !== lastSig || !lastRef) { lastSig = sig; lastRef = newRef(); } return lastRef; }
function saveDraft() { const c = contact(); delete c.hp; store.set("ccw.draft", { q: Q, c }); }

/* ---------------- Render: static sections from config ---------------- */
function winIcon(s) {
  const st = 'fill="var(--glass-tint)" stroke="var(--ink)" stroke-width="2"';
  if (s === "S") return '<svg width="64" height="56" viewBox="0 0 64 56"><rect x="22" y="30" width="20" height="24" rx="1" ' + st + '/></svg>';
  if (s === "M") return '<svg width="64" height="56" viewBox="0 0 64 56"><rect x="19" y="12" width="26" height="42" rx="1" ' + st + '/><path d="M19 33h26" stroke="var(--ink)" stroke-width="2"/></svg>';
  if (s === "L") return '<svg width="64" height="56" viewBox="0 0 64 56"><rect x="5" y="14" width="54" height="40" rx="1" ' + st + '/><path d="M14 22l8-8" stroke="var(--glass)" stroke-width="2" stroke-linecap="round"/></svg>';
  return '<svg width="64" height="56" viewBox="0 0 64 56"><rect x="15" y="2" width="34" height="52" rx="1" ' + st + '/><path d="M32 2v52" stroke="var(--ink)" stroke-width="2"/><path d="M28 26v8M36 26v8" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/></svg>';
}
function stepperHTML(id, val, label) {
  return '<div class="stepper" data-stepper><button type="button" data-d="-1" aria-label="Fewer ' + esc(label) + '">−</button><input id="' + id + '" inputmode="numeric" value="' + (+val || 0) + '" aria-label="' + esc(label) + '"><button type="button" data-d="1" aria-label="More ' + esc(label) + '">+</button></div>';
}
function renderStatic() {
  const B = CFG.business;
  $$("[data-owner]").forEach(e => (e.textContent = B.owner || "Luke"));
  $$("[data-phone-text]").forEach(e => (e.textContent = B.phone));
  $$("[data-tel]").forEach(e => e.setAttribute("href", telHref(B.phone)));
  $$("[data-rating]").forEach(e => (e.textContent = B.rating));
  $$("[data-review-count]").forEach(e => (e.textContent = B.reviewCount));
  $$("[data-hours]").forEach(e => (e.textContent = B.hours));
  $$("[data-cap]").forEach(e => (e.textContent = pct(CFG.discounts.cap)));
  $$("[data-nb-pct]").forEach(e => (e.textContent = pct(CFG.discounts.neighbor)));
  $$("[data-ty-pct]").forEach(e => (e.textContent = pct(CFG.discounts.thankYou)));
  $$("[data-rain-days]").forEach(e => (e.textContent = CFG.guarantees.rainDays));
  $$("[data-rain-wrap]").forEach(e => (e.hidden = !CFG.guarantees.rain));
  $$("[data-bu]").forEach(e => { const f = +CFG.buildup[e.dataset.bu]; e.textContent = f > 1 ? "+" + pct(f - 1) : ""; });
  const em = $("[data-email-link]"); if (em) { em.hidden = !B.email; em.href = "mailto:" + B.email; em.textContent = B.email; }
  const rl = $("#reviewsLink"); if (rl) { rl.href = B.googleProfileUrl || "https://www.google.com/search?q=" + encodeURIComponent(B.name + " San Antonio"); }
  $("#testBanner").hidden = !testing();

  // rate card
  const W = CFG.windows;
  const typical = { S: 4, M: 12, L: 3, D: 1 };
  const typ = k => SIZES.reduce((a, s) => a + typical[s] * W[k][s], 0);
  $("#rateTable").innerHTML =
    "<thead><tr><th></th>" + Object.keys(PKG).map(k => '<th class="' + (k === "standard" ? "feat" : "") + '"><span class="pk">' + PKG[k] + (k === "standard" ? '<span class="badge">Most booked</span>' : "") + '</span><span class="pk-sub">' +
      ({ exterior: "Outside glass, frames and sills.", standard: "Both sides of the glass, sills wiped dry.", detail: "Inside & Out plus screens washed and tracks cleaned." })[k] + "</span></th>").join("") + "</tr></thead><tbody>" +
    SIZES.map(s => "<tr><th>" + SIZE_INFO[s].name + "<small>" + esc(SIZE_INFO[s].desc) + "</small></th>" + Object.keys(PKG).map(k => '<td class="' + (k === "standard" ? "feat" : "") + '">' + money(W[k][s]) + "<small> /ea</small></td>").join("") + "</tr>").join("") +
    "</tbody><tfoot><tr><td>Typical 20-window home</td>" + Object.keys(PKG).map(k => '<td class="mono">' + money(typ(k)) + "</td>").join("") + "</tr></tfoot>";
  const S = CFG.surcharges;
  $("#rateNotes").innerHTML =
    "<div><b>Upstairs:</b> +" + money(S.upstairs2) + " per window on a 2-story, +" + money(S.upstairs3) + " on a 3-story.</div>" +
    "<div><b>Grids on the glass:</b> +" + money(S.grids) + " per window. Grids between the panes don't count.</div>" +
    "<div><b>First cleans:</b> +" + pct(CFG.buildup.mid - 1) + " if it's been 1 to 3 years, +" + pct(CFG.buildup.old - 1) + " if longer.</div>" +
    "<div><b>Minimum visit:</b> " + money(CFG.minimum) + ". Travel is free inside the home zone.</div>";

  // package price hints
  $$("[data-pkprice]").forEach(e => { const k = e.dataset.pkprice; e.textContent = "From " + money(W[k].S) + " per window"; });

  // counts
  $("#counts").innerHTML = SIZES.map(s => '<div class="count-row"><div class="ico" aria-hidden="true">' + winIcon(s) + '</div><div class="meta"><b>' + SIZE_INFO[s].name + "</b><span>" + esc(SIZE_INFO[s].desc) + '</span></div><div class="unit" data-unit="' + s + '"></div>' + stepperHTML("cnt" + s, Q.counts[s], SIZE_INFO[s].plural.toLowerCase()) + "</div>").join("");

  // add-ons
  const A = CFG.addons;
  const row = (key, name, desc, ctl) => '<div class="addon"><div class="meta"><b>' + name + "</b><span" + (key ? ' id="desc-' + key + '"' : "") + ">" + desc + "</span></div>" + ctl + "</div>";
  $("#addons").innerHTML =
    row("hardWater", "Hard water spot treatment", "Takes off white sprinkler spots that normal cleaning leaves behind. " + money(A.hardWater) + " per window.", stepperHTML("hardWater", Q.hardWater, "windows to treat")) +
    row("gutters", "Gutter cleaning", "", '<label class="switch"><input type="checkbox" id="gutters" aria-label="Add gutter cleaning"><span></span></label>') +
    row("", "Solar panel wash", "Pure water and a soft brush. " + money(A.solarPanel) + " per panel, " + money(A.solarMin) + " minimum.", stepperHTML("solarPanels", Q.solarPanels, "solar panels")) +
    row("", "Skylights", "Roof side cleaned. " + money(A.skylight) + " each.", stepperHTML("skylights", Q.skylights, "skylights")) +
    row("", "Mirrors and interior glass", "Shower doors, big mirrors, glass rails. " + money(A.mirror) + " each.", stepperHTML("mirrors", Q.mirrors, "mirrors")) +
    row("", "Rescreen torn screens", "New mesh in your existing frame. " + money(A.rescreen) + " each.", stepperHTML("rescreen", Q.rescreen, "screens to rescreen")) +
    row("", "Rescreen solar screens", "Heavier sun-blocking mesh. " + money(A.rescreenSolar) + " each.", stepperHTML("rescreenSolar", Q.rescreenSolar, "solar screens to rescreen")) +
    row("", "Driveway and walkway wash", "Pressure washed, edges and the walk to the door.", '<select id="driveway" aria-label="Driveway size"><option value="">None</option>' + Object.keys(DRIVEWAY).map(k => '<option value="' + k + '">' + ({ S: "Small", M: "Medium", L: "Large" })[k] + ", " + money(A.driveway[k]) + "</option>").join("") + "</select>");

  // plan radios
  $("#planSeg").innerHTML = Object.keys(PLAN).map((k, i) => '<input type="radio" name="plan" id="pl' + i + '" value="' + k + '"><label for="pl' + i + '">' + PLAN[k].label + (CFG.plans[k] ? " <small>" + pct(CFG.plans[k]) + " off</small>" : "") + "</label>").join("");

  // plans table: typical one-story, 20 windows, inside & out, home zone
  const base = Object.assign(clone(BLANK), { counts: typical, pkg: "standard", zip: CFG.business.baseZip });
  const blurbs = { once: "Book when you need it.", twice: "Spring and fall. Beats the pollen and the holiday guests.", thrice: "Every season that matters here.", quarterly: "Always clean. Best price per visit." };
  $("#planTable").innerHTML = "<thead><tr><th>Plan</th><th>Discount</th><th>Typical house, per visit</th><th>Per year</th></tr></thead><tbody>" + Object.keys(PLAN).map(k => {
    const r = computeQuote(Object.assign(clone(base), { plan: k }), CFG);
    return '<tr class="' + (k === "quarterly" ? "best" : "") + '"><td class="pl"><b>' + PLAN[k].label + "</b><span>" + blurbs[k] + '</span></td><td class="n">' + (CFG.plans[k] ? pct(CFG.plans[k]) + " off" : "None") + '</td><td class="n">' + money(r.total) + '</td><td class="n">' + money(r.total * r.visits) + "</td></tr>";
  }).join("") + "</tbody>";

  // services with photo slots
  const IS = (CFG.images && CFG.images.services) || {};
  const svcs = [
    ["gutters", "s-gutter", "Gutter cleaning", "From " + money(A.gutters["1"]) + " for a 1-story, " + money(A.gutters["2"]) + " for a 2-story", "Live oak and pecan junk cleared out of the gutters and downspouts. " + pct(A.gutterBundle) + " off when you book it with windows."],
    ["hardWater", "s-window", "Hard water spot removal", money(A.hardWater) + " per window", "For the white sprinkler spots. I test a small spot first and tell you what will come off before you pay for it."],
    ["solar", "s-solar", "Solar panel cleaning", money(A.solarPanel) + " per panel, " + money(A.solarMin) + " minimum", "Dust and pollen cut your output. Pure water and a soft brush, so the panels dry without spots."],
    ["glass", "s-sky", "Skylights, mirrors and glass", money(A.skylight) + " skylights, " + money(A.mirror) + " mirrors", "Rooftop skylights, shower doors, big mirrors and glass rails. Add them in the quote."],
    ["driveway", "s-spray", "Power washing", "Driveways from " + money(A.driveway.S), "Driveways, walkways and patios, pressure washed from the street to your front door."],
    ["screens", "s-screen", "Screens and rescreening", money(A.rescreen) + " per screen, solar " + money(A.rescreenSolar), "Torn or faded screens get new mesh in the frame you already have. Full Detail also hand-washes every screen."]
  ];
  $("#services-list").innerHTML = svcs.map(s => '<div class="svc"><div class="photo" data-img-svc="' + s[0] + '" data-alt="' + esc(s[2]) + '"><svg class="ph-ico" aria-hidden="true"><use href="#' + s[1] + '"/></svg></div><h3>' + s[2] + '</h3><div class="p">' + esc(s[3]) + "</div><p>" + esc(s[4]) + "</p></div>").join("");

  // discounts
  const D = CFG.discounts;
  $("#dealList").innerHTML =
    "<li><b>Neighbor deal: " + pct(D.neighbor) + " off</b><span>Book the same day as someone on your street and you each save " + pct(D.neighbor) + ". You also split the trip fee.</span></li>" +
    "<li><b>Send a friend: " + money(D.referralCredit) + "</b><span>When someone you send my way books, you get " + money(D.referralCredit) + " off your next clean. They just put your name in the quote.</span></li>" +
    "<li><b>Plans: up to " + pct(CFG.plans.quarterly) + " off</b><span>Stay on a schedule and every visit costs less.</span></li>" +
    "<li><b>Stack them</b><span>Discounts add up to " + pct(D.cap) + " off. Every one is in the quote builder, so there's nothing to ask for.</span></li>";

  // about
  $("#aboutText").innerHTML = (CFG.about || []).map(p => "<p>" + esc(p) + "</p>").join("");

  // tear-off tabs
  $("#tabs").innerHTML = Array.from({ length: 26 }, () => '<a href="' + esc(telHref(B.phone)) + '" aria-label="Call ' + esc(B.phone) + '">' + esc(B.phone) + "</a>").join("");

  // FAQ
  const faqs = [
    ["How do I count my windows?", "Count every opening that has glass. A window with a top and bottom half that slide is still one window. A sliding patio door is one glass door. If you're stuck between two sizes, pick the bigger one."],
    ["Is the online price the real price?", "Yes. It's the price for what you entered. I walk around before I start, and if the count or sizes are different I show you the change first. Nothing gets added without your OK."],
    ["Do I need to be home?", "Not for outside only. For inside cleaning, someone 18 or older needs to let me in."],
    CFG.guarantees.rain ? ["What if it rains right after?", "If rain spots your outside glass within " + CFG.guarantees.rainDays + " days, I come back and redo the outside for free. Just text me a photo."] : null,
    ["Can you get hard water spots off?", "Most light spots come off. Our water is really hard, though, and spots that sat for years can etch into the glass. I test a small area first and tell you what will come off before you pay for it."],
    ["Do you do power washing?", "Yes. Driveways, walkways and patios. Pick a driveway size in the quote and it goes right on your ticket."],
    ["When do I pay?", "After the job, once you've looked over the glass and you're happy with it."],
    ["Do you do businesses?", "Yes. Storefronts and offices are quoted on site, usually on a monthly or quarterly route. Call or text to set up a walk-through."]
  ].filter(Boolean);
  $("#faqList").innerHTML = faqs.map(f => "<details><summary>" + esc(f[0]) + "</summary><p>" + esc(f[1]) + "</p></details>").join("");

  renderZones(); renderMap(); loadPhotos();
}

/* ---------------- Bind quote inputs ---------------- */
function writeInputs() {
  $("#zip").value = Q.zip || "";
  $$('input[name="stories"]').forEach(i => (i.checked = +i.value === +Q.stories));
  $$('input[name="last"]').forEach(i => (i.checked = i.value === Q.last));
  $$('input[name="pkg"]').forEach(i => (i.checked = i.value === Q.pkg));
  $$('input[name="plan"]').forEach(i => (i.checked = i.value === Q.plan));
  SIZES.forEach(s => ($("#cnt" + s).value = Q.counts[s] || 0));
  ["upstairs", "grids", "hardWater", "solarPanels", "skylights", "mirrors", "rescreen", "rescreenSolar"].forEach(k => { const el = $("#" + k); if (el) el.value = Q[k] || 0; });
  $("#gutters").checked = !!Q.gutters; $("#driveway").value = Q.driveway || "";
  $("#thanks").value = Q.thanks || ""; $("#neighbor").checked = !!Q.neighbor; $("#neighborName").value = Q.neighborName || "";
  $("#neighborName").hidden = !Q.neighbor;
  $("#exampleNote").hidden = !isExample;
}
function readInputs() {
  Q.zip = $("#zip").value.replace(/\D/g, "").slice(0, 5);
  Q.stories = +(($$('input[name="stories"]').find(i => i.checked) || {}).value || 1);
  Q.last = ($$('input[name="last"]').find(i => i.checked) || {}).value || "recent";
  Q.pkg = ($$('input[name="pkg"]').find(i => i.checked) || {}).value || "standard";
  Q.plan = ($$('input[name="plan"]').find(i => i.checked) || {}).value || "once";
  SIZES.forEach(s => (Q.counts[s] = int($("#cnt" + s).value)));
  ["upstairs", "grids", "hardWater", "solarPanels", "skylights", "mirrors", "rescreen", "rescreenSolar"].forEach(k => (Q[k] = int($("#" + k).value)));
  Q.gutters = $("#gutters").checked; Q.driveway = $("#driveway").value;
  Q.thanks = $("#thanks").value; Q.neighbor = $("#neighbor").checked; Q.neighborName = $("#neighborName").value.trim().slice(0, 80);
}
function bindBuilder() {
  const form = $("#quoteForm");
  form.addEventListener("submit", e => e.preventDefault());
  form.addEventListener("click", e => {
    const b = e.target.closest("[data-stepper] button"); if (!b) return;
    const inp = b.parentElement.querySelector("input"); inp.value = Math.max(0, int(inp.value) + (+b.dataset.d)); onChange();
  });
  form.addEventListener("input", e => { if (e.target.matches("[data-stepper] input")) e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3); onChange(e); });
  form.addEventListener("change", onChange);
  $("#clearExample").addEventListener("click", () => { Q = clone(BLANK); isExample = false; writeInputs(); onChange(); $("#zip").focus(); });
}
function onChange(e) {
  readInputs();
  if (isExample) { isExample = false; $("#exampleNote").hidden = true; }
  $("#neighborName").hidden = !Q.neighbor;
  saveDraft(); renderQuote();
}

/* ---------------- Render quote ---------------- */
let shownTotal = 0, tickRaf = 0, current = null;
function tickTo(v) {
  const el = $("#orderTotal"), mb = $("#mbarTotal");
  if (reduceMotion() || Math.abs(v - shownTotal) < 1) { el.textContent = money(v); mb.textContent = money(v); shownTotal = v; return; }
  const from = shownTotal, start = performance.now(), dur = 450; cancelAnimationFrame(tickRaf);
  const step = now => {
    const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3), cur = from + (v - from) * e;
    el.textContent = k < 1 ? money(Math.round(cur)) : money(v); mb.textContent = el.textContent;
    if (k < 1) tickRaf = requestAnimationFrame(step); else shownTotal = v;
  };
  tickRaf = requestAnimationFrame(step);
}
function renderQuote() {
  const res = computeQuote(Q, CFG); current = res;
  const W = CFG.windows[res.pkg];
  SIZES.forEach(s => { const u = $('[data-unit="' + s + '"]'); if (u) u.textContent = money(W[s]) + " ea"; });
  const stories = res.stories;
  $("#upstairsField").style.opacity = stories > 1 ? "1" : ".45";
  $("#upstairs").disabled = stories === 1;
  $("#upHint").textContent = stories > 1 ? "+" + money(stories >= 3 ? CFG.surcharges.upstairs3 : CFG.surcharges.upstairs2) + " each for ladder work" : "Only for 2 or 3 story homes";
  $("#gridHint").textContent = "+" + money(CFG.surcharges.grids) + " each. Grids sealed between the glass don't count.";
  const A = CFG.addons, g = +A.gutters[String(stories)];
  const gd = $("#desc-gutters"); if (gd) gd.textContent = stories + "-story home: " + money(g) + (res.totalWin ? ", or " + money(g * (1 - A.gutterBundle)) + " with windows (" + pct(A.gutterBundle) + " off)" : "") + ".";

  // travel note
  const t = res.travel, tn = $("#travelNote"); tn.classList.remove("warn");
  if (t.status === "ok") tn.innerHTML = "<b>" + esc(t.place || "ZIP " + t.zip) + "</b>, about " + Math.round(t.miles) + " road miles from " + esc(CFG.business.baseLabel) + ". " + esc(t.zoneName) + ": " + (t.fee ? "<b>" + money(t.fee) + " trip fee</b>" : "<b>free travel</b>") + ".";
  else if (t.status === "far") { tn.classList.add("warn"); tn.innerHTML = "<b>About " + Math.round(t.miles) + " road miles out.</b> That's past our regular area, but Luke may still come. He'll confirm the trip fee."; }
  else if (t.status === "unknown") { tn.classList.add("warn"); tn.innerHTML = "<b>We don't have that ZIP on the map.</b> Check it, or send the quote and Luke will confirm travel."; }
  else tn.textContent = "Travel is free inside the home zone.";

  // ticket
  $("#orderPkg").textContent = PKG[res.pkg] + " · " + res.totalWin + " window" + (res.totalWin === 1 ? "" : "s");
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  $("#orderMeta").innerHTML = esc(date) + "<br>" + (Q.zip ? "ZIP " + esc(Q.zip) : "ZIP not set");
  const body = ticketGroups(res);
  $("#orderBody").innerHTML = res.servicesSub > 0 || res.onsite ? body : '<div class="order-empty">Add a window or a service to start your ticket.</div>';
  tickTo(res.total);
  const sub = [];
  if (res.total > 0) {
    if (res.visits > 1) sub.push(PLAN[res.plan].label + ": " + res.visits + " visits, about " + money(res.total * res.visits) + ' a year. <span class="save">You save ' + money(res.savedPerVisit * res.visits) + " a year.</span>");
    sub.push("Time on site: about " + fmtMinutes(res.minutes) + ".");
    if (!res.travelKnown) sub.push("Travel confirmed by " + esc(CFG.business.owner) + ".");
  }
  $("#orderSub").innerHTML = sub.join("<br>");
  const foot = [];
  if (CFG.guarantees.rain) foot.push(CFG.guarantees.rainDays + "-day rain guarantee on outside glass");
  foot.push("Pay after the job, once you've checked the glass");
  foot.push("Price holds for 30 days");
  $("#orderFoot").innerHTML = foot.map(f => '<div class="g">' + esc(f) + "</div>").join("");

  // owner extras
  const ob = $("#ownerBox");
  if (owner() && res.total > 0) { ob.hidden = false; ob.innerHTML = "<b>Owner view</b>" + profitHTML(profitFor(res, CFG), CFG).replace('class="profit"', 'class="profit" style="background:transparent;padding:8px 0 0"'); }
  else ob.hidden = true;
  $("#saveDeskBtn").hidden = !owner();
  $("#bookLbl").textContent = CFG.business.calendlyUrl ? "Pick a time" : "Request a time";
}

/* ---------------- Actions: book / send / copy ---------------- */
function result(html, cls) { const el = $("#actionResult"); el.innerHTML = html ? '<div class="notice ' + (cls || "") + '">' + html + "</div>" : ""; if (html) el.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" }); }
function needQuote() { if (!current || (current.total <= 0 && !current.onsite)) { result("Add at least one window or service first, then try again.", "warn"); return false; } return true; }
function payloadFor(source) {
  const c = contact(), ref = refFor();
  const code = encodeQuote({ v: 1, ref, ts: Date.now(), total: current.total, q: Q, c: { name: c.name, phone: c.phone, email: c.email, address: c.address, pref: c.pref, notes: c.notes, ref: c.ref } });
  const text = summaryText(current, Q, c, ref);
  return { c, ref, code, text, full: text + "\n\nQuote code (for Luke's quote desk):\n" + code, source };
}
function fallbackActions(p, lead) {
  const B = CFG.business;
  const smsBody = p.text + "\n\n" + p.code;
  return (lead ? "<b>" + lead + "</b>" : "") +
    "<span>Tap one and hit send, or copy it and send it however you like.</span>" +
    '<div class="actions"><a class="btn primary sm" href="' + esc(smsHref(B.phone, smsBody)) + '"><svg><use href="#i-chat"/></svg>Text it to ' + esc(B.owner) + "</a>" +
    (B.email ? '<a class="btn ghost sm" href="mailto:' + esc(B.email) + "?subject=" + encodeURIComponent("Quote " + p.ref + ": " + money(current.total)) + "&body=" + encodeURIComponent(p.full) + '">Email it</a>' : "") +
    '<button type="button" class="btn ghost sm" data-copy-quote>Copy quote</button></div>' +
    '<span class="hint">' + esc(B.owner) + "'s number: <b class=\"mono\" style=\"user-select:all\">" + esc(B.phone) + "</b></span>";
}
async function emailQuote(p) {
  const B = CFG.business;
  const body = {
    name: p.c.name, phone: p.c.phone, email: p.c.email, address: p.c.address, zip: Q.zip, best_way_to_reach: p.c.pref,
    total: money(current.total), package: PKG[current.pkg], plan: PLAN[current.plan].label, quote: p.text, quote_code: p.code,
    _subject: (p.source === "booking" ? "Booking started " : "New quote ") + p.ref + ": " + money(current.total) + (p.c.name ? " from " + p.c.name : ""),
    _template: "box", _captcha: "false"
  };
  if (p.c.email) body._replyto = p.c.email;
  const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 12000);
  const r = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(B.quoteEmail), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
  clearTimeout(tm);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || String(j.success) !== "true") throw new Error(j.message || "Send failed");
  return true;
}
async function sendQuote() {
  if (!needQuote()) return;
  const p = payloadFor("quote");
  if (!p.c.name || !(p.c.phone || p.c.email)) {
    result("Add your name and a phone number or email in step 7, then send again.", "warn");
    $("#contactStep").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); setTimeout(() => $(p.c.name ? "#cPhone" : "#cName").focus(), 400); return;
  }
  if (p.c.hp) { result("<b>Sent.</b> Your quote number is " + esc(p.ref) + "."); return; }
  if (CFG.business.quoteEmail) {
    const btn = $("#sendBtn"); btn.disabled = true; result("Sending to " + esc(CFG.business.owner) + "...");
    try {
      await emailQuote(p);
      result("<b>Sent to " + esc(CFG.business.owner) + ".</b><span>Your quote number is <b class=\"mono\">" + esc(p.ref) + "</b>. He'll reach out by " + esc(p.c.pref.toLowerCase()) + " to confirm a day." + (CFG.business.calendlyUrl ? " Want to grab a time now?" : "") + "</span>" + (CFG.business.calendlyUrl ? '<div class="actions"><button type="button" class="btn primary sm" data-book>Pick a time</button></div>' : ""));
    } catch (e) {
      result(fallbackActions(p, "Couldn't send it from here. Use one of these instead."), "warn");
    } finally { btn.disabled = false; }
  } else {
    result(fallbackActions(p, "Send it your way"));
  }
}
function bookQuote() {
  if (!needQuote()) return;
  const B = CFG.business, p = payloadFor("booking");
  if (!B.calendlyUrl) { result(fallbackActions(p, "Online booking opens soon. Send your quote and " + esc(B.owner) + " will text you open times."), "warn"); return; }
  const params = new URLSearchParams();
  if (p.c.name) params.set("name", p.c.name);
  if (p.c.email) params.set("email", p.c.email);
  params.set("a1", (p.text + "\nCode: " + p.code).slice(0, 1900));
  if (p.c.address) params.set("a2", p.c.address);
  const url = B.calendlyUrl + (B.calendlyUrl.indexOf("?") > -1 ? "&" : "?") + params.toString();
  const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  result("<b>Your calendar opened in a new tab.</b><span>Your quote is already filled in, so " + esc(B.owner) + " sees exactly what you priced. Didn't open? <a href=\"" + esc(url) + "\" target=\"_blank\" rel=\"noopener\">Open the calendar</a>.</span>");
  if (B.quoteEmail && p.c.name && (p.c.phone || p.c.email) && !p.c.hp) emailQuote(p).catch(() => {});
}
function bindActions() {
  $("#sendBtn").addEventListener("click", sendQuote);
  $("#bookBtn").addEventListener("click", bookQuote);
  $("#copyBtn").addEventListener("click", e => { if (!needQuote()) return; copyText(payloadFor("copy").full, e.currentTarget); });
  $("#actionResult").addEventListener("click", e => {
    if (e.target.closest("[data-copy-quote]")) copyText(payloadFor("copy").full, e.target.closest("button"));
    if (e.target.closest("[data-book]")) bookQuote();
  });
  $("#saveDeskBtn").addEventListener("click", () => {
    if (!needQuote()) return; const p = payloadFor("desk");
    const list = store.get("ccw.desk", []); if (!list.some(x => x.ref === p.ref)) list.unshift({ ref: p.ref, code: p.code, saved: Date.now(), status: "new", note: "" });
    store.set("ccw.desk", list); toast("Saved " + p.ref + " to the quote desk");
  });
  $$("#quoteForm input[id^=c], #cNotes").forEach(el => el.addEventListener("input", saveDraft));
}

/* ---------------- Mobile total bar ---------------- */
function bindMbar() {
  const bar = $("#mbar"), sec = $("#quote"), ord = $("#order"); if (!("IntersectionObserver" in window)) return;
  let inSec = false, inOrd = false;
  const upd = () => bar.classList.toggle("show", inSec && !inOrd);
  new IntersectionObserver(es => { es.forEach(en => { if (en.target === sec) inSec = en.isIntersecting; else inOrd = en.isIntersecting; }); upd(); }, { threshold: [0, .25] }).observe(sec);
  new IntersectionObserver(es => { es.forEach(en => (inOrd = en.intersectionRatio > .25)); upd(); }, { threshold: [0, .25, .5] }).observe(ord);
}

/* ---------------- Photos (optional, from the images folder) ---------------- */
function imgSrc(name) { const I = CFG.images || {}; return name ? (I.folder || "") + name : ""; }
function loadImg(src) { return new Promise((res, rej) => { if (!src) return rej(new Error("none")); const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("missing")); im.src = src; }); }
function fillPhoto(el, src, alt, fail) { loadImg(src).then(im => { im.alt = alt || ""; im.decoding = "async"; el.innerHTML = ""; el.appendChild(im); el.classList.add("has-img"); }).catch(() => fail && fail()); }
function loadPhotos() {
  const I = CFG.images || {};
  const why = $('[data-img="why"]'); if (why) fillPhoto(why, imgSrc(I.why), why.dataset.alt, () => { why.hidden = true; $("#why").classList.add("nophoto"); });
  const own = $('[data-img="owner"]'); if (own) fillPhoto(own, imgSrc(I.owner), own.dataset.alt);
  // service tiles switch to photos only when every one of them has a photo, so the grid stays even
  const tiles = $$("[data-img-svc]");
  Promise.all(tiles.map(el => loadImg(imgSrc((I.services || {})[el.dataset.imgSvc])))).then(ims => tiles.forEach((el, i) => { ims[i].alt = el.dataset.alt || ""; el.innerHTML = ""; el.appendChild(ims[i]); el.classList.add("has-img"); })).catch(() => {});
  const g = (I.gallery || []).filter(x => x && x.before && x.after);
  $("#work").hidden = !g.length;
  $("#gallery").innerHTML = g.map((x, i) => '<figure class="ba" style="margin:0"><div class="ba-box" style="--cut:50%"><img src="' + esc(imgSrc(x.before)) + '" alt="Before" loading="lazy"><img class="after" src="' + esc(imgSrc(x.after)) + '" alt="After" loading="lazy"><span class="bar"></span><span class="knob" aria-hidden="true">↔</span><span class="lb l">Before</span><span class="lb r">After</span><input type="range" min="0" max="100" value="50" aria-label="Compare before and after, job ' + (i + 1) + '"></div>' + (x.caption ? "<figcaption>" + esc(x.caption) + "</figcaption>" : "") + "</figure>").join("");
  $$("#gallery .ba-box input").forEach(r => r.addEventListener("input", () => r.parentElement.style.setProperty("--cut", r.value + "%")));
}

/* ---------------- Area map ---------------- */
function zoneTint(i) { return ["var(--glass)", "var(--glass)", "var(--glass)", "var(--glass)"][i] || "var(--glass)"; }
const ZONE_OP = [0.26, 0.16, 0.09, 0.04];
function renderZones() {
  const z = CFG.travel.zones;
  $("#zoneTable").innerHTML = "<thead><tr><th>Zone</th><th>Road miles</th><th>Trip fee</th></tr></thead><tbody>" +
    z.map((x, i) => '<tr><td><span class="sw" style="background:var(--glass);opacity:' + (0.35 + ZONE_OP[i] * 2.2) + '"></span>' + esc(x.name) + "</td><td class=\"mono\">" + (i ? z[i - 1].upTo + " to " : "Up to ") + x.upTo + "</td><td>" + (x.fee ? money(x.fee) : "Free") + "</td></tr>").join("") +
    '<tr><td><span class="sw"></span>Farther out</td><td class="mono">' + z[z.length - 1].upTo + "+</td><td>Call</td></tr></tbody>";
}
function renderMap() {
  const svg = $("#areaMap"); if (!svg) return;
  const base = ZIPS[CFG.business.baseZip]; if (!base) { svg.innerHTML = ""; return; }
  const cx = 270, cy = 315, S = 7;
  const kx = Math.cos(base.lat * Math.PI / 180) * 69.17, ky = 69.17;
  const P = z => { const p = ZIPS[z]; return p ? [cx + (p.lng - base.lng) * kx * S, cy - (p.lat - base.lat) * ky * S] : null; };
  const rf = +CFG.travel.roadFactor || 1.2, zones = CFG.travel.zones;
  let h = '<defs><clipPath id="mclip"><rect x="0" y="0" width="560" height="560" rx="4"/></clipPath></defs><g clip-path="url(#mclip)">';
  for (let i = zones.length - 1; i >= 0; i--) {
    const r = zones[i].upTo / rf * S;
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="var(--glass)" fill-opacity="' + ZONE_OP[i] + '" stroke="var(--glass)" stroke-opacity=".55" stroke-width="1.2"' + (i ? ' stroke-dasharray="5 5"' : "") + "/>";
  }
  for (let i = 0; i < zones.length; i++) {
    const r = zones[i].upTo / rf * S, y = cy + r - 8;
    if (y > 552) continue;
    const label = zones[i].name + " · " + (zones[i].fee ? money(zones[i].fee) : "free");
    h += '<g><rect x="' + (cx - 52) + '" y="' + (y - 13) + '" width="104" height="20" rx="10" fill="var(--surface)" stroke="var(--line)"/><text x="' + cx + '" y="' + (y + 1.5) + '" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">' + esc(label) + "</text></g>";
  }
  const towns = [["78258", "Stone Oak", 9, 5, "start"], ["78023", "Helotes", -9, 5, "end"], ["78006", "Boerne", -9, 5, "end"], ["78015", "Fair Oaks Ranch", -9, 5, "end"], ["78163", "Bulverde", 9, 5, "start"], ["78070", "Spring Branch", 9, 5, "start"], ["78154", "Schertz", 9, 5, "start"], ["78109", "Converse", 9, 5, "start"], ["78130", "New Braunfels", 0, -10, "middle"], ["78155", "Seguin", 0, -10, "middle"], ["78253", "Alamo Ranch", -9, 5, "end"], ["78249", "Medical Center", -9, 5, "end"], ["78114", "Floresville", 9, 5, "start"], ["78052", "Lytle", -9, 5, "end"]];
  towns.forEach(([z, name, dx, dy, an]) => {
    const p = P(z); if (!p || p[0] < 8 || p[0] > 552 || p[1] < 8 || p[1] > 552) return;
    h += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.6" fill="var(--ink)"/><text x="' + (p[0] + dx).toFixed(1) + '" y="' + (p[1] + dy).toFixed(1) + '" text-anchor="' + an + '" font-size="14" fill="var(--ink)">' + esc(name) + "</text>";
  });
  h += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="var(--glass)" fill-opacity=".3"/><circle cx="' + cx + '" cy="' + cy + '" r="6" fill="var(--glass)" stroke="var(--surface)" stroke-width="2"/>' +
    '<text x="' + cx + '" y="' + (cy + 26) + '" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">Base: ' + esc(CFG.business.baseLabel) + "</text>";
  h += '<g transform="translate(18,24)"><path d="M0 0v22M-6 8L0 0l6 8" fill="none" stroke="var(--muted)" stroke-width="1.6"/><text x="0" y="38" text-anchor="middle" font-size="12" fill="var(--muted)">N</text></g>';
  const tenMi = 10 * S;
  h += '<g transform="translate(470,540)"><path d="M0 0h' + tenMi + '" stroke="var(--muted)" stroke-width="2"/><path d="M0 -4v8M' + tenMi + ' -4v8" stroke="var(--muted)" stroke-width="2"/><text x="' + tenMi / 2 + '" y="-8" text-anchor="middle" font-size="11" fill="var(--muted)">10 mi</text></g>';
  svg.innerHTML = h + "</g>";
}
function bindZipCheck() {
  const inp = $("#zipCheck"), out = $("#zipCheckOut");
  inp.addEventListener("input", () => {
    inp.value = inp.value.replace(/\D/g, "").slice(0, 5);
    const t = travelFor(inp.value, CFG);
    if (t.status === "ok") out.innerHTML = "<b>" + esc(t.place) + "</b>: " + esc(t.zoneName) + ", " + (t.fee ? money(t.fee) + " trip fee" : "free travel");
    else if (t.status === "far") out.innerHTML = "<b>" + esc(t.place || "That ZIP") + "</b> is about " + Math.round(t.miles) + " road miles out. Call to check.";
    else if (t.status === "unknown") out.textContent = "Not on our map. Call or text to check.";
    else out.textContent = "";
  });
}

/* ---------------- Hero: the squeegee pane ---------------- */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function paintScene(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#4F8DB8"); g.addColorStop(.45, "#9CC7DD"); g.addColorStop(.7, "#F2D3A2"); g.addColorStop(1, "#EBAA6A");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const sx = w * .7, sy = h * .63, sr = Math.min(w, h) * .065;
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 6);
  sg.addColorStop(0, "rgba(255,244,214,.95)"); sg.addColorStop(.18, "rgba(255,226,170,.55)"); sg.addColorStop(1, "rgba(255,210,140,0)");
  ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#FFF6DD"; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  const rnd = mulberry(7);
  // thin clouds
  ctx.fillStyle = "rgba(255,255,255,.35)";
  for (let i = 0; i < 5; i++) { const cx = rnd() * w, cy = h * (.12 + rnd() * .25), cw = w * (.18 + rnd() * .2); ctx.beginPath(); ctx.ellipse(cx, cy, cw, h * .012, 0, 0, Math.PI * 2); ctx.fill(); }
  const ridge = (baseY, amp, color, seed) => {
    const r = mulberry(seed); const ph = [r() * 6, r() * 6, r() * 6];
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) { const t = x / w; const y = h * baseY - h * amp * (Math.sin(t * 5.1 + ph[0]) * .5 + Math.sin(t * 11.3 + ph[1]) * .3 + Math.sin(t * 23 + ph[2]) * .12); ctx.lineTo(x, y); }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  };
  ridge(.69, .035, "#8FAAB6", 3);
  ridge(.75, .03, "#6E8F99", 5);
  // Tower of the Americas, far off
  const tx = w * .3, ty = h * .74, th = h * .29, tw = Math.max(3, w * .011);
  ctx.fillStyle = "#5F818B";
  ctx.beginPath(); ctx.moveTo(tx - tw * 1.1, ty); ctx.lineTo(tx - tw * .55, ty - th); ctx.lineTo(tx + tw * .55, ty - th); ctx.lineTo(tx + tw * 1.1, ty); ctx.fill();
  const pw = w * .062, ph2 = h * .03;
  ctx.beginPath(); ctx.moveTo(tx - pw / 2, ty - th); ctx.lineTo(tx - pw * .62, ty - th - ph2 * .55); ctx.lineTo(tx - pw / 2, ty - th - ph2); ctx.lineTo(tx + pw / 2, ty - th - ph2); ctx.lineTo(tx + pw * .62, ty - th - ph2 * .55); ctx.lineTo(tx + pw / 2, ty - th); ctx.fill();
  ctx.fillRect(tx - tw * .3, ty - th - ph2 - h * .045, tw * .6, h * .045);
  ridge(.83, .03, "#476A6F", 9);
  ridge(.92, .022, "#2E4B4D", 11);
  // live oak, foreground left
  // live oak: short leaning trunk, limbs reaching sideways, wide low crown
  ctx.fillStyle = "#1E3334"; ctx.strokeStyle = "#1E3334"; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(w * .05, h); ctx.quadraticCurveTo(w * .07, h * .88, w * .1, h * .83); ctx.lineTo(w * .135, h * .84); ctx.quadraticCurveTo(w * .11, h * .9, w * .12, h); ctx.fill();
  [[.11, .84, .3, .75, .022], [.11, .84, .02, .74, .018], [.12, .835, .2, .7, .016], [.2, .79, .36, .72, .01]].forEach(l => { ctx.lineWidth = w * l[4]; ctx.beginPath(); ctx.moveTo(w * l[0], h * l[1]); ctx.quadraticCurveTo(w * (l[0] + l[2]) / 2, h * (l[1] - .01), w * l[2], h * l[3]); ctx.stroke(); });
  const r2n = mulberry(21);
  for (let i = 0; i < 70; i++) {
    const t = r2n(), cx = w * (-.08 + t * .5), arch = Math.sin(t * Math.PI), cy = h * (.745 - arch * .06 + (r2n() - .5) * .05);
    const rr = w * (.018 + r2n() * .03);
    ctx.beginPath(); ctx.ellipse(cx, cy, rr * 1.5, rr, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function paintFilm(ctx, w, h) {
  ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, w, h);
  const rnd = mulberry(42);
  ctx.fillStyle = "rgba(205,198,182,.84)"; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 110; i++) { const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 90; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(170,160,138," + (.12 + rnd() * .14) + ")"); g.addColorStop(1, "rgba(170,160,138,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 900; i++) { ctx.fillStyle = "rgba(190,160,70," + (.18 + rnd() * .3) + ")"; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, .5 + rnd() * 1.1, 0, Math.PI * 2); ctx.fill(); }
  for (let i = 0; i < 80; i++) {
    const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 9;
    ctx.fillStyle = "rgba(238,235,226,.35)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = .9 + rnd(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  for (let i = 0; i < 16; i++) { const x = rnd() * w, len = h * (.1 + rnd() * .35), y0 = rnd() * h * .3; const g = ctx.createLinearGradient(0, y0, 0, y0 + len); g.addColorStop(0, "rgba(150,140,118,.0)"); g.addColorStop(.5, "rgba(150,140,118,.35)"); g.addColorStop(1, "rgba(150,140,118,0)"); ctx.strokeStyle = g; ctx.lineWidth = 1 + rnd() * 2; ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x + 2, y0 + len * .3, x - 2, y0 + len * .6, x + 1, y0 + len); ctx.stroke(); }
}
function initGlass() {
  const pane = $("#pane"), sc = $("#sceneCv"), fc = $("#filmCv"), sq = $("#squeegee"), rig = $("#rig");
  if (!pane || !sc.getContext) return;
  const sx = sc.getContext("2d"), fx = fc.getContext("2d");
  let W = 0, H = 0, state = "dirty", raf = 0, started = false, heroImg = null;
  function drawScene() { if (heroImg) { const s = Math.max(W / heroImg.width, H / heroImg.height), w = heroImg.width * s, h = heroImg.height * s; sx.drawImage(heroImg, (W - w) / 2, (H - h) / 2, w, h); } else paintScene(sx, W, H); }
  loadImg(imgSrc((CFG.images || {}).heroView)).then(im => { heroImg = im; if (W) drawScene(); }).catch(() => {});
  const hint = $("#paneHint");
  function size() {
    const r = pane.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    [sc, fc].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    sx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene();
    if (state === "clean") fx.clearRect(0, 0, W, H); else paintFilm(fx, W, H);
  }
  function erase(x0, y0, x1, y1, width) {
    fx.globalCompositeOperation = "destination-out"; fx.strokeStyle = "#000"; fx.lineCap = "round"; fx.lineJoin = "round"; fx.lineWidth = width;
    fx.beginPath(); fx.moveTo(x0, y0); fx.lineTo(x1, y1); fx.stroke(); fx.globalCompositeOperation = "source-over";
  }
  function buildPath() {
    const blade = Math.max(56, Math.min(W, H) * .27), step = blade * .8, pad = blade * .08;
    const rows = Math.max(2, Math.ceil((H - blade + 2 * pad) / step) + 1);
    const pts = []; let dir = 1;
    for (let i = 0; i < rows; i++) {
      const y = Math.min(H - blade / 2 + pad, blade / 2 - pad + i * step);
      const xa = dir > 0 ? -blade * .2 : W + blade * .2, xb = dir > 0 ? W + blade * .2 : -blade * .2;
      for (let k = 0; k <= 40; k++) pts.push([xa + (xb - xa) * k / 40, y]);
      if (i < rows - 1) {
        const ny = Math.min(H - blade / 2 + pad, blade / 2 - pad + (i + 1) * step), rr = (ny - y) / 2, ccy = y + rr;
        for (let k = 1; k < 12; k++) { const a = -Math.PI / 2 + Math.PI * k / 12; pts.push([xb + dir * Math.cos(a) * rr * .9, ccy + Math.sin(a) * rr]); }
      }
      dir *= -1;
    }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, blade };
  }
  function animate() {
    if (state !== "dirty") return;
    state = "wiping"; cancelAnimationFrame(raf);
    const { pts, cum, blade } = buildPath();
    $("#sqChannel").style.cssText = "top:" + (-blade / 2) + "px;height:" + blade + "px";
    $("#sqRubber").style.cssText = "top:" + (-blade / 2 + 2) + "px;height:" + (blade - 4) + "px";
    sq.classList.add("on");
    const total = cum[cum.length - 1], speed = Math.max(.7, W / 400), t0 = performance.now();
    let idx = 0;
    const frame = now => {
      const d = Math.min(total, (now - t0) * speed);
      while (idx < pts.length - 1 && cum[idx + 1] <= d) { erase(pts[idx][0], pts[idx][1], pts[idx + 1][0], pts[idx + 1][1], blade); idx++; }
      const i = Math.min(idx, pts.length - 2), seg = cum[i + 1] - cum[i] || 1, f = Math.min(1, Math.max(0, (d - cum[i]) / seg));
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
      erase(pts[i][0], pts[i][1], x, y, blade);
      const ang = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
      rig.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + ang.toFixed(3) + "rad)";
      if (d < total) raf = requestAnimationFrame(frame);
      else { sq.classList.remove("on"); fc.style.transition = "opacity .5s"; fc.style.opacity = "0"; setTimeout(() => { fx.clearRect(0, 0, W, H); fc.style.transition = "none"; fc.style.opacity = "1"; state = "clean"; }, 520); }
    };
    raf = requestAnimationFrame(frame);
  }
  // drag to clean
  let drag = null;
  pane.addEventListener("pointerdown", e => { if (state === "wiping") return; const r = pane.getBoundingClientRect(); drag = [e.clientX - r.left, e.clientY - r.top]; pane.setPointerCapture(e.pointerId); });
  pane.addEventListener("pointermove", e => { if (!drag) return; const r = pane.getBoundingClientRect(); const p = [e.clientX - r.left, e.clientY - r.top]; erase(drag[0], drag[1], p[0], p[1], Math.max(44, W * .12)); drag = p; if (state === "dirty") state = "touched"; });
  const end = () => { drag = null; };
  pane.addEventListener("pointerup", end); pane.addEventListener("pointercancel", end);
  $("#fogBtn").addEventListener("click", () => {
    cancelAnimationFrame(raf); sq.classList.remove("on"); state = "touched"; fc.style.opacity = "1"; paintFilm(fx, W, H);
    hint.textContent = "Drag across the glass to squeegee it.";
  });
  size();
  if ("ResizeObserver" in window) { let last = ""; new ResizeObserver(() => { const r = pane.getBoundingClientRect(); const k = Math.round(r.width) + "x" + Math.round(r.height); if (k !== last) { last = k; if (state === "wiping") { cancelAnimationFrame(raf); sq.classList.remove("on"); state = "clean"; } size(); } }).observe(pane); }
  if (reduceMotion()) { state = "clean"; fx.clearRect(0, 0, W, H); hint.textContent = "Tap Fog it up, then drag to clean."; return; }
  const go = () => { if (started) return; started = true; setTimeout(animate, 650); };
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { go(); io.disconnect(); } }, { threshold: .4 }); io.observe(pane); } else go();
}

/* ---------------- Links view ---------------- */
function renderLinks() {
  const B = CFG.business; const L = [];
  const lk = (href, icon, title, sub, cls, ext) => '<a class="lk ' + (cls || "") + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '><svg><use href="#' + icon + '"/></svg><span>' + esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "") + '</span><span class="arr">→</span></a>';
  L.push(lk("#quote", "i-calc", "Get my price in 60 seconds", "Instant quote, no phone call needed", "primary"));
  if (B.calendlyUrl) L.push(lk(B.calendlyUrl, "i-cal", "Book a time", "Pick a day on the calendar", "", true));
  L.push(lk(telHref(B.phone), "i-phone", "Call " + B.owner, B.phone));
  L.push(lk(smsHref(B.phone, "Hi " + B.owner + ", I'd like a window cleaning quote."), "i-chat", "Text " + B.owner, "Fastest way to reach him"));
  if (B.email) L.push(lk("mailto:" + B.email, "i-mail", "Email", B.email));
  if (B.googleReviewUrl) L.push(lk(B.googleReviewUrl, "i-star", "Leave a Google review", "Takes 30 seconds and helps a ton", "", true));
  if (B.instagram) L.push(lk(B.instagram, "i-ig", "Instagram", "Before and afters", "", true));
  if (B.tiktok) L.push(lk(B.tiktok, "i-tt", "TikTok", "", "", true));
  if (B.facebook) L.push(lk(B.facebook, "i-fb", "Facebook", "", "", true));
  if (B.nextdoor) L.push(lk(B.nextdoor, "i-home", "Nextdoor", "Recommend us to neighbors", "", true));
  L.push('<button type="button" class="lk" id="vcardBtn"><svg><use href="#i-user"/></svg><span>Save contact<small>Adds ' + esc(B.name) + ' to your phone</small></span><span class="arr">↓</span></button>');
  $("#linkList").innerHTML = L.join("");
  $("#vcardBtn").addEventListener("click", () => {
    const v = ["BEGIN:VCARD", "VERSION:3.0", "FN:" + B.name, "ORG:" + B.name, "TITLE:Window cleaning", "TEL;TYPE=CELL:+" + phoneDigits(B.phone), B.email ? "EMAIL:" + B.email : "", B.siteUrl ? "URL:" + B.siteUrl : "", "NOTE:Owner " + B.owner + ". Instant quotes online.", "END:VCARD"].filter(Boolean).join("\r\n");
    downloadBlob(new Blob([v], { type: "text/vcard" }), "crystal-clear-windows.vcf");
  });
}

/* ---------------- Router ---------------- */
let prevView = "main";
function route() {
  const h = location.hash;
  const v = h === "#links" ? "links" : h === "#admin" ? "admin" : "main";
  $("#viewMain").hidden = v !== "main"; $("#viewLinks").hidden = v !== "links"; $("#viewAdmin").hidden = v !== "admin";
  if (v === "links") { renderLinks(); window.scrollTo(0, 0); }
  if (v === "admin") { window.scrollTo(0, 0); if (window.CCW_ADMIN) window.CCW_ADMIN.render(); }
  if (v === "main") {
    renderQuote();
    if (prevView !== "main") { const el = h && h.length > 1 ? document.getElementById(h.slice(1)) : null; if (el) setTimeout(() => el.scrollIntoView(), 30); else window.scrollTo(0, 0); }
  }
  prevView = v;
}

/* ---------------- Boot ---------------- */
function boot() {
  renderStatic(); writeInputs();
  if (draft && draft.c) { const c = draft.c; $("#cName").value = c.name || ""; $("#cPhone").value = c.phone || ""; $("#cEmail").value = c.email || ""; $("#cAddress").value = c.address || ""; $("#cNotes").value = c.notes || ""; $("#cRef").value = c.ref || ""; $$('input[name="pref"]').forEach(i => (i.checked = i.value === (c.pref || "Text"))); }
  bindBuilder(); bindActions(); bindMbar(); bindZipCheck(); renderQuote(); initGlass();
  $("#stopTest").addEventListener("click", () => { store.del("ccw.testConfig"); reloadConfig(); refreshAll(); toast("Back to the published prices"); });
  window.addEventListener("hashchange", route); route();
}
function refreshAll() { renderStatic(); writeInputs(); renderQuote(); if (!$("#viewLinks").hidden) renderLinks(); }

window.CCW = { get CFG() { return CFG; }, CONFIG, ZIPS, SIZES, SIZE_INFO, PKG, PLAN, THANKS, LAST, DRIVEWAY, computeQuote, travelFor, profitFor, summaryText, ticketGroups, profitHTML, encodeQuote, decodeQuote, money, pct, esc, r2, clone, deepMerge, store, sess, copyText, downloadBlob, telHref, smsHref, fmtMinutes, toast, reloadConfig, refreshAll, placeName, owner, renderQuote, $, $$ };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
</script>
