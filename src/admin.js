<script>
(function () {
"use strict";
const C = window.CCW;
const { $, $$, esc, money, pct, store, sess } = C;
const TABS = [["desk", "Quote desk"], ["pricing", "Pricing & settings"], ["kit", "Cards & QR"], ["photos", "Photos"], ["social", "Social kit"], ["playbook", "Growth playbook"], ["research", "Market research"], ["setup", "Setup guide"]];
const STATUSES = ["new", "contacted", "booked", "won", "lost"];
let tab = store.get("ccw.adminTab", "desk");
if (!TABS.some(t => t[0] === tab)) tab = "desk";
let filter = "all";

async function hashPass(p) {
  const s = "ccw-owner-v1:" + p;
  try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join(""); } } catch (e) {}
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return "f" + h.toString(16);
}

/* ---------------- Lock ---------------- */
function render() {
  const open = C.owner();
  $("#adLock").hidden = open; $("#adApp").hidden = !open; $("#lockBtn").hidden = !open;
  if (!open) renderLock(); else renderApp();
}
function renderLock() {
  const has = !!store.get("ccw.lock", null);
  const el = $("#adLock");
  if (!has) {
    el.innerHTML = '<form class="panel" id="lockForm"><div class="eyebrow">Owner tools</div><h2 style="font-size:1.6rem">Set your owner passcode</h2>' +
      '<p class="muted" style="font-size:15px">This keeps your saved quotes and owner tools private on this device. Set one on each phone or computer you use. It is a lock for this browser, not an online account.</p>' +
      '<div class="field"><label for="lp1">New passcode</label><input id="lp1" type="password" autocomplete="new-password" minlength="6" required></div>' +
      '<div class="field"><label for="lp2">Type it again</label><input id="lp2" type="password" autocomplete="new-password" minlength="6" required></div>' +
      '<div id="lockErr" class="hint" style="color:var(--danger)"></div><button class="btn primary" type="submit">Set passcode and open</button></form>';
    $("#lockForm").addEventListener("submit", async e => {
      e.preventDefault(); const a = $("#lp1").value, b = $("#lp2").value;
      if (a.length < 6) { $("#lockErr").textContent = "Use at least 6 characters."; return; }
      if (a !== b) { $("#lockErr").textContent = "Those don't match. Type them again."; return; }
      store.set("ccw.lock", await hashPass(a)); sess.set("ccw.owner", true); render(); C.renderQuote();
    });
  } else {
    el.innerHTML = '<form class="panel" id="lockForm"><div class="eyebrow">Owner tools</div><h2 style="font-size:1.6rem">Unlock</h2>' +
      '<div class="field"><label for="lp1">Passcode</label><input id="lp1" type="password" autocomplete="current-password" required></div>' +
      '<div id="lockErr" class="hint" style="color:var(--danger)"></div><button class="btn primary" type="submit">Unlock</button>' +
      '<button type="button" class="linkbtn" id="forgot" style="justify-self:start;font-size:14px">Forgot the passcode?</button><div id="forgotBox" hidden class="notice warn" style="font-size:14px"><span>Resetting erases the quotes saved on this device. Export them first if you can.</span><div class="actions"><button type="button" class="btn sm" id="doReset">Erase and reset this device</button></div></div></form>';
    $("#lockForm").addEventListener("submit", async e => {
      e.preventDefault();
      if ((await hashPass($("#lp1").value)) === store.get("ccw.lock", "")) { sess.set("ccw.owner", true); render(); C.renderQuote(); }
      else { $("#lockErr").textContent = "That passcode doesn't match."; $("#lp1").select(); }
    });
    $("#forgot").addEventListener("click", () => ($("#forgotBox").hidden = false));
    $("#doReset").addEventListener("click", () => { store.del("ccw.lock"); store.del("ccw.desk"); sess.del("ccw.owner"); render(); });
  }
  setTimeout(() => { const i = $("#lp1"); if (i) i.focus(); }, 50);
}
$("#lockBtn").addEventListener("click", () => { sess.del("ccw.owner"); render(); C.renderQuote(); });

/* ---------------- App shell ---------------- */
function renderApp() {
  $("#adTabs").innerHTML = TABS.map(t => '<button type="button" role="tab" aria-selected="' + (t[0] === tab) + '" data-tab="' + t[0] + '">' + t[1] + "</button>").join("");
  $$("#adTabs button").forEach(b => b.addEventListener("click", () => { tab = b.dataset.tab; store.set("ccw.adminTab", tab); renderApp(); window.scrollTo(0, 0); }));
  const body = $("#adBody");
  ({ desk: deskPanel, pricing: pricingPanel, kit: kitPanel, photos: photosPanel, social: socialPanel, playbook: playbookPanel, research: researchPanel, setup: setupPanel })[tab](body);
}

/* ---------------- Quote desk ---------------- */
function openQuote(code) {
  const o = C.decodeQuote(code);
  const res = C.computeQuote(o.q, C.CFG);
  return { o, res };
}
function contactLinks(c, q, res, ref) {
  const B = C.CFG.business; const L = [];
  if (c.phone) { L.push('<a class="btn xs" href="' + esc(C.telHref(c.phone)) + '">Call</a>'); L.push('<a class="btn xs" href="' + esc(C.smsHref(c.phone, "Hi " + (c.name || "there").split(" ")[0] + ", it's " + B.owner + " with " + B.name + ". Following up on your quote " + ref + " (" + money(res.total) + "). I have openings this week if you'd like to get on the schedule.")) + '">Text follow-up</a>'); }
  if (c.email) L.push('<a class="btn xs" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent("Your window cleaning quote " + ref) + '">Email</a>');
  if (c.address || q.zip) L.push('<a class="btn xs" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((c.address || "") + " " + (q.zip || "")) + '">Map</a>');
  if (c.phone && B.googleReviewUrl) L.push('<a class="btn xs" href="' + esc(C.smsHref(c.phone, "Hi " + (c.name || "there").split(" ")[0] + ", thanks for having me out! If the windows look good, would you leave a quick Google review? It really helps a small local business: " + B.googleReviewUrl + " Thank you! " + B.owner)) + '">Ask for review</a>');
  return L.join("");
}
function deskPanel(body) {
  const list = store.get("ccw.desk", []);
  const rows = list.map(it => { try { const { o, res } = openQuote(it.code); return { it, o, res }; } catch (e) { return { it, bad: true }; } });
  const good = rows.filter(r => !r.bad);
  const sumBy = st => good.filter(r => st.includes(r.it.status)).reduce((s, r) => s + (r.o.total || r.res.total), 0);
  const cnt = st => good.filter(r => r.it.status === st).length;
  const avg = good.length ? good.reduce((s, r) => s + (r.o.total || r.res.total), 0) / good.length : 0;
  body.innerHTML =
    '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Quote desk</h2><p class="muted" style="max-width:62ch">Customer quotes reach you two ways: inside Calendly bookings, and by email once quote emails are set up (see Setup guide). Each one ends with a quote code. Paste it here to see the full ticket and what you keep, then track it until it\'s won.</p></div>' +
    '<div class="kpis"><div class="kpi"><span class="v">' + cnt("new") + '</span><span class="l">New, not contacted</span></div><div class="kpi"><span class="v">' + money(sumBy(["new", "contacted", "booked"])) + '</span><span class="l">Open pipeline</span></div><div class="kpi"><span class="v">' + money(sumBy(["won"])) + '</span><span class="l">Won (' + cnt("won") + ' jobs)</span></div><div class="kpi"><span class="v">' + money(Math.round(avg)) + '</span><span class="l">Average quote</span></div></div>' +
    '<div class="panel"><h3>Open a quote</h3><textarea id="codeIn" placeholder="Paste the quote code (starts with CCW1.) or the whole email or Calendly booking text"></textarea><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn primary sm" id="openCode">Open quote</button><a class="btn ghost sm" href="#quote">Build a quote for a caller</a></div><div id="opened"></div></div>' +
    '<div class="panel"><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><h3>Saved quotes</h3><div class="chips" id="chips">' + ["all"].concat(STATUSES).map(s => '<button type="button" class="chip" data-f="' + s + '" aria-pressed="' + (filter === s) + '">' + s[0].toUpperCase() + s.slice(1) + "</button>").join("") + '</div></div><div class="qcards" id="qcards"></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px"><button type="button" class="btn ghost xs" id="exportQ">Export backup</button><label class="btn ghost xs" style="cursor:pointer">Import backup<input type="file" id="importQ" accept="application/json,.json" hidden></label><span class="hint" style="align-self:center">Saved quotes live in this browser. Export now and then so you never lose them.</span></div></div></div>';

  $("#openCode").addEventListener("click", () => {
    const out = $("#opened");
    try {
      const { o, res } = openQuote($("#codeIn").value);
      const c = o.c || {}; const p = C.profitFor(res, C.CFG); const changed = Math.abs((o.total || 0) - res.total) >= 0.01;
      out.innerHTML = '<div class="qcard" style="margin-top:6px"><div class="top"><b>' + esc(c.name || "No name given") + '</b><span class="mono muted">' + esc(o.ref) + '</span><span class="amt">' + money(o.total) + "</span></div>" +
        '<div class="info">' + [c.phone, c.email, c.address, o.q.zip && ("ZIP " + o.q.zip), c.pref && ("Prefers " + c.pref.toLowerCase()), new Date(o.ts).toLocaleString()].filter(Boolean).map(x => "<span>" + esc(x) + "</span>").join("") + "</div>" +
        (c.notes ? '<div class="notice" style="font-size:14px">' + esc(c.notes) + "</div>" : "") + (c.ref ? '<div class="hint">Referred by ' + esc(c.ref) + ". Give them a " + money(C.CFG.discounts.referralCredit) + " credit when this books.</div>" : "") +
        (changed ? '<div class="notice warn" style="font-size:14px">Your prices changed since this quote. Customer was quoted ' + money(o.total) + "; today's prices make it " + money(res.total) + ". Honor the quoted price.</div>" : "") +
        '<div class="order" style="border-radius:var(--r)"><div class="order-body" style="max-height:none">' + C.ticketGroups(res) + "</div></div>" + C.profitHTML(p, C.CFG) +
        '<div class="acts">' + contactLinks(c, o.q, res, o.ref) + '<button type="button" class="btn dark xs" id="saveOpened">Save to desk</button></div></div>';
      $("#saveOpened").addEventListener("click", () => {
        const l = store.get("ccw.desk", []); if (!l.some(x => x.ref === o.ref)) l.unshift({ ref: o.ref, code: C.encodeQuote(o), saved: Date.now(), status: "new", note: "" });
        store.set("ccw.desk", l); C.toast("Saved " + o.ref); deskPanel(body);
      });
    } catch (e) { out.innerHTML = '<div class="notice err" style="margin-top:6px">' + esc(e.message || "Couldn't read that code.") + "</div>"; }
  });
  $$("#chips .chip").forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; deskPanel(body); }));
  const shown = rows.filter(r => filter === "all" || r.it.status === filter);
  $("#qcards").innerHTML = shown.length ? shown.map(r => {
    if (r.bad) return '<div class="qcard"><div class="top"><b>Unreadable quote</b><span class="mono muted">' + esc(r.it.ref) + '</span></div><div class="acts"><button type="button" class="btn xs" data-del="' + esc(r.it.ref) + '">Delete</button></div></div>';
    const { it, o, res } = r, c = o.c || {};
    return '<div class="qcard" data-ref="' + esc(it.ref) + '"><div class="top"><span class="st ' + it.status + '">' + it.status + "</span><b>" + esc(c.name || "No name") + '</b><span class="mono muted" style="font-size:13px">' + esc(it.ref) + '</span><span class="amt">' + money(o.total || res.total) + "</span></div>" +
      '<div class="info"><span>' + esc(C.PKG[res.pkg]) + ", " + res.totalWin + " windows" + (res.plan !== "once" ? ", " + esc(C.PLAN[res.plan].label.toLowerCase()) : "") + "</span>" + (o.q.zip ? "<span>" + esc((C.placeName(o.q.zip) || "") + " " + o.q.zip) + "</span>" : "") + "<span>Saved " + new Date(it.saved).toLocaleDateString() + "</span>" + (c.pref ? "<span>Prefers " + esc(c.pref.toLowerCase()) + "</span>" : "") + "</div>" +
      '<div class="acts">' + contactLinks(c, o.q, res, it.ref) + '<select data-status aria-label="Status">' + STATUSES.map(s => "<option" + (s === it.status ? " selected" : "") + ">" + s + "</option>").join("") + '</select><button type="button" class="btn ghost xs" data-view>Details</button><button type="button" class="btn ghost xs" data-del="' + esc(it.ref) + '">Delete</button></div>' +
      '<textarea data-note placeholder="Notes: follow-up date, gate code, what they said">' + esc(it.note || "") + "</textarea>" +
      '<div data-detail hidden><div class="order" style="border-radius:var(--r)"><div class="order-body" style="max-height:none">' + C.ticketGroups(res) + "</div></div>" + C.profitHTML(C.profitFor(res, C.CFG), C.CFG) + (c.notes ? '<div class="hint">Customer notes: ' + esc(c.notes) + "</div>" : "") + "</div></div>";
  }).join("") : '<div class="muted" style="padding:10px 0">' + (list.length ? "Nothing with this status." : "No saved quotes yet. Open one above and save it, or build one for a caller.") + "</div>";
  const update = (ref, fn) => { const l = store.get("ccw.desk", []); const it = l.find(x => x.ref === ref); if (it) { fn(it); store.set("ccw.desk", l); } };
  $$("#qcards .qcard[data-ref]").forEach(card => {
    const ref = card.dataset.ref;
    const sel = card.querySelector("[data-status]"); if (sel) sel.addEventListener("change", () => { update(ref, it => (it.status = sel.value)); deskPanel(body); });
    const note = card.querySelector("[data-note]"); if (note) note.addEventListener("change", () => update(ref, it => (it.note = note.value)));
    const v = card.querySelector("[data-view]"); if (v) v.addEventListener("click", () => { const d = card.querySelector("[data-detail]"); d.hidden = !d.hidden; v.textContent = d.hidden ? "Details" : "Hide"; });
  });
  $$("#qcards [data-del]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "Tap again to delete"; setTimeout(() => { if (b.isConnected) { b.dataset.armed = ""; b.textContent = "Delete"; } }, 3000); return; }
    store.set("ccw.desk", store.get("ccw.desk", []).filter(x => x.ref !== b.dataset.del)); deskPanel(body);
  }));
  $("#exportQ").addEventListener("click", () => C.downloadBlob(new Blob([JSON.stringify(store.get("ccw.desk", []), null, 2)], { type: "application/json" }), "crystal-clear-quotes-" + new Date().toISOString().slice(0, 10) + ".json"));
  $("#importQ").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const inc = JSON.parse(rd.result); if (!Array.isArray(inc)) throw 0; const l = store.get("ccw.desk", []); let added = 0; inc.forEach(x => { if (x && x.ref && x.code && !l.some(y => y.ref === x.ref)) { l.push(x); added++; } }); l.sort((a, b) => b.saved - a.saved); store.set("ccw.desk", l); C.toast("Imported " + added + " quotes"); deskPanel(body); } catch (err) { C.toast("That file isn't a quote backup."); } };
    rd.readAsText(f);
  });
}

/* ---------------- Pricing & settings ---------------- */
let draftCfg = null;
const getP = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split("."); let a = o; ks.slice(0, -1).forEach(k => { if (a[k] == null) a[k] = {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };
const SECTIONS = [
  ["Upcharges", [["surcharges.upstairs2", "Upstairs window, 2-story", "$"], ["surcharges.upstairs3", "Upstairs window, 3-story", "$"], ["surcharges.grids", "Window with grids on glass", "$"], ["buildup.mid", "First clean, 1 to 3 yrs", "x"], ["buildup.old", "First clean, 3+ yrs", "x"], ["minimum", "Minimum visit", "$"]]],
  ["Add-ons", [["addons.hardWater", "Hard water, per window", "$"], ["addons.skylight", "Skylight, each", "$"], ["addons.mirror", "Mirror or interior glass", "$"], ["addons.gutters.1", "Gutters, 1-story", "$"], ["addons.gutters.2", "Gutters, 2-story", "$"], ["addons.gutters.3", "Gutters, 3-story", "$"], ["addons.gutterBundle", "Gutters off with windows", "%"], ["addons.solarPanel", "Solar, per panel", "$"], ["addons.solarMin", "Solar minimum", "$"], ["addons.rescreen", "Rescreen, each", "$"], ["addons.rescreenSolar", "Solar rescreen, each", "$"], ["addons.driveway.S", "Driveway, small", "$"], ["addons.driveway.M", "Driveway, medium", "$"], ["addons.driveway.L", "Driveway, large", "$"]]],
  ["Plans and discounts", [["plans.twice", "Twice a year plan", "%"], ["plans.thrice", "Every 4 months plan", "%"], ["plans.quarterly", "Quarterly plan", "%"], ["discounts.thankYou", "Thank-you discount", "%"], ["discounts.neighbor", "Neighbor deal", "%"], ["discounts.neighborTripShare", "Neighbor pays this much of trip fee", "%"], ["discounts.cap", "Most total discount", "%"], ["discounts.referralCredit", "Referral credit", "$"]]],
  ["Travel", [["business.baseZip", "Home base ZIP", "text"], ["business.baseLabel", "Base name on map", "text"], ["travel.roadFactor", "Road miles per straight mile", "num"]]],
  ["Contact, links and booking", [["business.owner", "Owner first name", "text"], ["business.phone", "Phone", "text"], ["business.email", "Email shown on site", "text"], ["business.hours", "Hours line", "text"], ["business.calendlyUrl", "Calendly link", "url"], ["business.quoteEmail", "Email quotes to", "text"], ["business.siteUrl", "Website address", "url"], ["business.googleReviewUrl", "Google review link", "url"], ["business.googleProfileUrl", "Google listing link", "url"], ["business.instagram", "Instagram link", "url"], ["business.facebook", "Facebook link", "url"], ["business.tiktok", "TikTok link", "url"], ["business.nextdoor", "Nextdoor link", "url"], ["business.rating", "Google rating", "text"], ["business.reviewCount", "Google review count", "num"], ["guarantees.rain", "Offer rain guarantee", "bool"], ["guarantees.rainDays", "Rain guarantee days", "num"]]],
  ["Your costs (only you see these)", [["ops.laborRate", "Helper pay per hour", "$"], ["ops.mileRate", "Vehicle cost per mile", "$"], ["ops.supplyPct", "Supplies, share of price", "%"], ["ops.cardFeePct", "Card fee", "%"], ["ops.avgMph", "Average driving speed", "num"]]]
];
function fieldHTML(path, label, type) {
  const v = getP(draftCfg, path), id = "f_" + path.replace(/\./g, "_");
  if (type === "bool") return '<div class="field"><label class="check" for="' + id + '"><input type="checkbox" id="' + id + '" data-path="' + path + '" data-type="bool"' + (v ? " checked" : "") + "><span>" + esc(label) + "</span></label></div>";
  let shown = v;
  if (type === "%") shown = Math.round(v * 1000) / 10;
  if (type === "x") shown = Math.round((v - 1) * 1000) / 10;
  const suffix = type === "%" || type === "x" ? " (%)" : type === "$" ? " ($)" : "";
  return '<div class="field"><label for="' + id + '">' + esc(label) + suffix + '</label><input id="' + id + '" type="' + (type === "text" || type === "url" ? "text" : "number") + '" step="any" data-path="' + path + '" data-type="' + type + '" value="' + esc(shown == null ? "" : shown) + '"' + (type === "url" ? ' placeholder="https://"' : "") + "></div>";
}
function pricingPanel(body) {
  if (!draftCfg) draftCfg = C.clone(C.CFG);
  const W = draftCfg.windows;
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Pricing & settings</h2><p class="muted" style="max-width:66ch">Change anything below, then tap <b>Try on this device</b> to see the site with those prices. Customers keep seeing the published prices until you copy the settings code into the site file and re-upload it.</p></div>' +
    (C.store.get("ccw.testConfig", null) ? '<div class="notice warn">You are testing custom prices on this device.</div>' : "") +
    '<div class="panel"><h3>Price per window</h3><div class="ptable"><table><thead><tr><th>Size</th>' + Object.keys(C.PKG).map(k => "<th>" + C.PKG[k] + "</th>").join("") + "</tr></thead><tbody>" +
    C.SIZES.map(s => "<tr><td><b>" + C.SIZE_INFO[s].name + "</b></td>" + Object.keys(C.PKG).map(k => '<td><input type="number" step="any" aria-label="' + esc(C.PKG[k] + ", " + C.SIZE_INFO[s].name) + '" data-path="windows.' + k + "." + s + '" data-type="$" value="' + W[k][s] + '"></td>').join("") + "</tr>").join("") + "</tbody></table></div></div>" +
    SECTIONS.map(([t, fs]) => '<div class="panel"><h3>' + esc(t) + '</h3><div class="settings-grid">' + fs.map(f => fieldHTML(f[0], f[1], f[2])).join("") + "</div>" +
      (t === "Travel" ? '<div class="ptable"><table><thead><tr><th>Zone name</th><th>Up to road miles</th><th>Trip fee ($)</th></tr></thead><tbody>' + draftCfg.travel.zones.map((z, i) => '<tr><td><input type="text" data-zone="' + i + '" data-k="name" value="' + esc(z.name) + '" aria-label="Zone ' + (i + 1) + ' name"></td><td><input type="number" step="any" data-zone="' + i + '" data-k="upTo" value="' + z.upTo + '" aria-label="Zone ' + (i + 1) + ' miles"></td><td><input type="number" step="any" data-zone="' + i + '" data-k="fee" value="' + z.fee + '" aria-label="Zone ' + (i + 1) + ' fee"></td></tr>').join("") + "</tbody></table></div>" : "") + "</div>").join("") +
    '<div class="panel"><div style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" class="btn primary sm" id="tryCfg">Try on this device</button><button type="button" class="btn ghost sm" id="stopCfg">Stop testing</button><button type="button" class="btn dark sm" id="codeCfg">Get settings code</button><button type="button" class="btn ghost sm" id="resetCfg">Reset to published</button></div><div id="cfgOut"></div></div></div>';
  $$("#adBody [data-path]").forEach(inp => inp.addEventListener("change", () => {
    const t = inp.dataset.type, p = inp.dataset.path; let v;
    if (t === "bool") v = inp.checked; else if (t === "text" || t === "url") v = inp.value.trim();
    else { v = parseFloat(inp.value); if (!isFinite(v)) v = 0; if (t === "%") v = v / 100; if (t === "x") v = 1 + v / 100; }
    if (p === "business.baseZip" && !C.ZIPS[v]) C.toast("That ZIP isn't on the map. Travel will show as TBD.");
    setP(draftCfg, p, v);
  }));
  $$("#adBody [data-zone]").forEach(inp => inp.addEventListener("change", () => { const z = draftCfg.travel.zones[+inp.dataset.zone]; z[inp.dataset.k] = inp.dataset.k === "name" ? inp.value.trim() : (parseFloat(inp.value) || 0); }));
  $("#tryCfg").addEventListener("click", () => { draftCfg.travel.zones.sort((a, b) => a.upTo - b.upTo); store.set("ccw.testConfig", draftCfg); C.reloadConfig(); C.refreshAll(); C.toast("Testing these prices on this device"); pricingPanel(body); });
  $("#stopCfg").addEventListener("click", () => { store.del("ccw.testConfig"); C.reloadConfig(); C.refreshAll(); draftCfg = C.clone(C.CFG); C.toast("Back to the published prices"); pricingPanel(body); });
  $("#resetCfg").addEventListener("click", () => { draftCfg = C.clone(C.CONFIG); pricingPanel(body); C.toast("Form reset to the published prices"); });
  $("#codeCfg").addEventListener("click", () => {
    const code = "const CONFIG = " + JSON.stringify(draftCfg, null, 2) + ";";
    $("#cfgOut").innerHTML = '<ol class="prose" style="padding-left:20px;margin:6px 0 0"><li>Open <b>index.html</b> in a plain text editor (VS Code, Notepad, or TextEdit set to plain text).</li><li>Find the line that says <span class="mono">SITE SETTINGS START</span>.</li><li>Select from <span class="mono">const CONFIG = {</span> down to the <span class="mono">};</span> just above <span class="mono">SITE SETTINGS END</span>, and paste this over it.</li><li>Save, then re-upload the file to your host.</li></ol><div class="copybox" id="cfgCode">' + esc(code) + '</div><button type="button" class="btn primary sm" id="copyCfg">Copy settings code</button>';
    $("#copyCfg").addEventListener("click", e => C.copyText(code, e.currentTarget));
  });
}

/* ---------------- Cards & QR ---------------- */
const BLUE = "#004A8E", INK = "#14110E", PAPER = "#FFFFFF";
const LOGO = new Path2D("__CWT_PATH__"), LOGO_W = __CWT_W__;
const BRUSH = new Path2D("__BRUSH_D__");
function siteBase() { const B = C.CFG.business; if (B.siteUrl) return B.siteUrl.replace(/#.*$/, "").replace(/\/?$/, "/"); const h = location.href.split("#")[0]; return /^https?:/.test(h) ? h : ""; }
function drawLogo(ctx, x, y, h, color) { ctx.save(); ctx.translate(x, y); const k = h / 100; ctx.scale(k, k); ctx.fillStyle = color; ctx.fill(LOGO); ctx.restore(); return LOGO_W * h / 100; }
function drawBrush(ctx, x, y, w, h, color) { ctx.save(); ctx.translate(x, y); ctx.scale(w / 400, h / 100); ctx.fillStyle = color; ctx.fill(BRUSH, "evenodd"); ctx.restore(); }
function drawQR(ctx, text, x, y, size, dark, light) {
  if (!window.qrcode) return false;
  const qr = window.qrcode(0, "M"); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), cell = Math.floor(size / (n + 8)), off = Math.floor((size - cell * n) / 2);
  ctx.fillStyle = light; ctx.fillRect(x, y, size, size); ctx.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(x + off + c * cell, y + off + r * cell, cell, cell);
  return true;
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" "); let line = "", yy = y;
  words.forEach(w => { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; });
  if (line) ctx.fillText(line, x, yy); return yy + lh;
}
const F = (w, size, fam) => w + " " + size + "px " + fam;
const DISP = '"Archivo", "Arial Black", sans-serif', SCRIPT = '"Kaushan Script", "Brush Script MT", cursive', BODY = '"Atkinson Hyperlegible", Arial, sans-serif';
function fitText(ctx, text, maxW, weight, size, fam) { let s = size; ctx.font = F(weight, s, fam); while (ctx.measureText(text).width > maxW && s > 10) { s -= 2; ctx.font = F(weight, s, fam); } return s; }
function phoneGlyph(ctx, cx, cy, r, bg, fg) {
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(cx - r * .5, cy - r * .5); const k = r / 24; ctx.scale(k, k); ctx.fillStyle = fg;
  ctx.fill(new Path2D("M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z")); ctx.restore();
}
function drawCardFront(cv) {
  const B = C.CFG.business, ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  const lw = drawLogo(ctx, 110, 120, 190, INK);
  ctx.fillStyle = INK; ctx.textBaseline = "alphabetic";
  const tx = 110 + lw + 50, tw = W - tx - 90;
  fitText(ctx, "CRYSTAL CLEAR", tw, 900, 78, DISP); ctx.fillText("CRYSTAL CLEAR", tx, 200);
  ctx.fillStyle = BLUE; fitText(ctx, "Window Washing", tw, 400, 74, SCRIPT); ctx.fillText("Window Washing", tx, 278);
  ctx.fillStyle = INK; ctx.font = F(800, 30, DISP); ctx.fillText("& POWER WASHING", tx + 4, 326);
  drawBrush(ctx, 60, 400, W - 120, 150, BLUE);
  phoneGlyph(ctx, 190, 475, 38, "#FFFFFF", BLUE);
  ctx.fillStyle = "#FFFFFF"; ctx.font = F(900, 74, DISP); ctx.fillText(B.phone.replace(/[()]/g, "").replace(" ", "-"), 250, 501);
  ctx.fillStyle = INK; ctx.font = F(400, 30, BODY); ctx.fillText("Owner-operated by " + B.owner, 110, 610);
  if (B.email) { ctx.textAlign = "right"; ctx.fillText(B.email, W - 110, 610); ctx.textAlign = "left"; }
}
function drawCardBack(cv, url) {
  const B = C.CFG.business, D = C.CFG.discounts, ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  ctx.fillStyle = BLUE; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(90, 110, 455, 455, 24) : ctx.rect(90, 110, 455, 455); ctx.fill();
  const ok = url ? drawQR(ctx, url, 102, 122, 431, INK, "#FFFFFF") : false;
  if (!ok) { ctx.fillStyle = "#535A61"; ctx.font = F(400, 26, BODY); wrapText(ctx, url ? "QR code didn't load. Check your connection." : "Add your website address to make the QR code.", 130, 320, 380, 34); }
  ctx.fillStyle = "#FFFFFF"; ctx.font = F(900, 60, DISP); ctx.fillText("SCAN FOR YOUR", 600, 200);
  ctx.font = F(400, 70, SCRIPT); ctx.fillText("instant price", 600, 280);
  ctx.font = F(400, 30, BODY);
  const lines = ["Book online in about a minute", pct(D.thankYou) + " off military and first responders"];
  if (C.CFG.guarantees.rain) lines.push(C.CFG.guarantees.rainDays + "-day rain guarantee");
  let y = 360; lines.forEach(l => { ctx.fillRect(600, y - 20, 12, 12); ctx.fillText(l, 628, y); y += 50; });
  ctx.font = F(900, 40, DISP); ctx.fillText(B.phone, 600, 565);
}
function drawHanger(cv, url) {
  const B = C.CFG.business, D = C.CFG.discounts, ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.setLineDash([18, 14]); ctx.strokeStyle = "#B8C0C7"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, 300, 200, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#8A939B"; ctx.font = F(400, 26, BODY); ctx.textAlign = "center"; ctx.fillText("die cut", W / 2, 308);
  const lw = LOGO_W * 260 / 100; drawLogo(ctx, (W - lw) / 2, 590, 260, INK);
  ctx.fillStyle = INK; ctx.font = F(900, 104, DISP); ctx.fillText("CRYSTAL CLEAR", W / 2, 990);
  ctx.fillStyle = BLUE; ctx.font = F(400, 112, SCRIPT); ctx.fillText("Window Washing", W / 2, 1110);
  ctx.fillStyle = INK; ctx.font = F(800, 46, DISP); ctx.fillText("& POWER WASHING", W / 2, 1180);
  const g = ctx.createLinearGradient(140, 0, W - 140, 0); g.addColorStop(0, "rgba(0,74,142,0)"); g.addColorStop(.12, BLUE); g.addColorStop(.88, BLUE); g.addColorStop(1, "rgba(0,74,142,0)");
  ctx.fillStyle = g; ctx.fillRect(140, 1225, W - 280, 8);
  ctx.fillStyle = INK; ctx.font = F(900, 86, DISP);
  let y = 1360; ["WE JUST CLEANED", "YOUR NEIGHBOR'S", "WINDOWS!"].forEach(l => { ctx.fillText(l, W / 2, y); y += 98; });
  drawBrush(ctx, 90, y - 30, W - 180, 330, BLUE);
  ctx.fillStyle = "#FFFFFF"; ctx.font = F(900, 150, DISP); ctx.fillText(pct(D.neighbor).replace(".0", "") + " OFF", W / 2, y + 140);
  ctx.font = F(700, 40, BODY); ctx.fillText("for you and your neighbor this week", W / 2, y + 210);
  const qy = y + 340, qs = 560;
  const ok = url ? drawQR(ctx, url, (W - qs) / 2, qy, qs, INK, "#FFFFFF") : false;
  if (!ok) { ctx.strokeStyle = "#D5DADF"; ctx.lineWidth = 5; ctx.strokeRect((W - qs) / 2, qy, qs, qs); }
  ctx.fillStyle = INK; ctx.font = F(900, 52, DISP); ctx.fillText("SCAN FOR YOUR PRICE", W / 2, qy + qs + 80);
  const py = qy + qs + 200; ctx.font = F(900, 96, DISP); const pw = ctx.measureText(B.phone.replace(/[()]/g, "").replace(" ", "-")).width;
  phoneGlyph(ctx, W / 2 - pw / 2 - 30, py - 32, 46, INK, "#FFFFFF");
  ctx.fillStyle = INK; ctx.fillText(B.phone.replace(/[()]/g, "").replace(" ", "-"), W / 2 + 40, py);
  ctx.font = F(700, 36, BODY); ctx.fillStyle = "#535A61"; ctx.fillText("CALL OR TEXT FOR A FREE ESTIMATE", W / 2, py + 70);
  ctx.textAlign = "left";
}
function kitPanel(body) {
  const base = siteBase(); const url = base ? base + "#links" : "";
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Cards, QR and door hangers</h2><p class="muted" style="max-width:66ch">Same look as the flyer. Every QR goes to your links page, where people can get a price, book, call, text or leave a review. Download the files and upload them to any print shop.</p></div>' +
    '<div class="panel"><div class="field"><label for="qrUrl">QR code goes to</label><input id="qrUrl" type="url" value="' + esc(url) + '" placeholder="https://yoursite.com/#links"><span class="hint">' + (base ? "Change it if you use a custom domain." : "Put the site online first, then paste its address here (or set Website address in Pricing & settings).") + "</span></div></div>" +
    '<div class="kit"><div class="panel"><h3>Business card, front</h3><canvas id="cvFront" width="1125" height="675"></canvas><button type="button" class="btn primary sm" data-dl="cvFront" data-name="card-front.png">Download front</button><h3 style="margin-top:8px">Business card, back</h3><canvas id="cvBack" width="1125" height="675"></canvas><button type="button" class="btn primary sm" data-dl="cvBack" data-name="card-back.png">Download back</button><span class="hint">3.75 × 2.25 in at 300 dpi with 1/8 in bleed. Prints as a standard 3.5 × 2 in card.</span></div>' +
    '<div class="panel hanger"><h3>Neighbor door hanger</h3><canvas id="cvHanger" width="1275" height="3300"></canvas><button type="button" class="btn primary sm" data-dl="cvHanger" data-name="door-hanger.png">Download door hanger</button><span class="hint">4.25 × 11 in at 300 dpi. Hang one on 10 to 20 houses around every job, the same day.</span></div>' +
    '<div class="panel"><h3>QR code</h3><canvas id="cvQR" width="1200" height="1200"></canvas><button type="button" class="btn primary sm" data-dl="cvQR" data-name="crystal-clear-qr.png">Download QR</button><span class="hint">For the truck, yard signs, invoices and the bottom of flyers.</span></div></div></div>';
  const draw = () => {
    const u = $("#qrUrl").value.trim();
    const q = $("#cvQR"), qctx = q.getContext("2d"); qctx.fillStyle = "#FFFFFF"; qctx.fillRect(0, 0, q.width, q.height);
    if (u && !drawQR(qctx, u, 0, 0, 1200, INK, "#FFFFFF")) { qctx.fillStyle = "#535A61"; qctx.font = F(400, 40, BODY); qctx.fillText("QR code didn't load.", 80, 600); }
    if (!u) { qctx.fillStyle = "#535A61"; qctx.font = F(400, 40, BODY); wrapText(qctx, "Add your website address above to make the QR code.", 80, 560, 1040, 54); }
    drawCardFront($("#cvFront")); drawCardBack($("#cvBack"), u); drawHanger($("#cvHanger"), u);
  };
  const fontsReady = document.fonts ? Promise.all(['900 40px "Archivo"', '400 40px "Kaushan Script"', '400 20px "Atkinson Hyperlegible"'].map(f => document.fonts.load(f).catch(() => {}))) : Promise.resolve();
  fontsReady.then(draw);
  if (!window.qrcode) setTimeout(draw, 900);
  $("#qrUrl").addEventListener("change", draw);
  $$("[data-dl]").forEach(b => b.addEventListener("click", () => { const cv = $("#" + b.dataset.dl); cv.toBlob(bl => bl && C.downloadBlob(bl, b.dataset.name), "image/png"); }));
}

/* ---------------- Photos (prompts for an image AI) ---------------- */
const PROMPTS = [
  ["heroView", "hero-view.jpg", "Hero window view", "Vertical 4:5, at least 1600 × 2000", "Photo looking out from inside a home at a sunny San Antonio, Texas backyard in late afternoon. A wide live oak tree, green St. Augustine grass, a limestone patio, and the Hill Country treeline in the distance under a soft blue sky with a few thin clouds. Warm golden light. The view fills the whole image edge to edge: no window frame, no reflections, no curtains, no people. Natural color, realistic, shot with a 35mm lens. No text, no logos."],
  ["why", "hard-water.jpg", "Hard water section", "Horizontal 4:3", "Macro photo of hard water spots on the outside of a house window in bright Texas sun. White mineral rings and dried sprinkler droplets on the glass, a blurred green lawn and a sprinkler head in the background. Shallow depth of field, realistic, high detail. No people, no text."],
  ["svc:gutters", "svc-gutters.jpg", "Gutter cleaning", "Horizontal 3:2", "Close-up photo of a gloved hand scooping wet brown oak leaves and twigs out of a white aluminum rain gutter on a one-story Texas home. Top of an aluminum ladder at the edge of the frame, clear blue sky, bright daylight. Realistic. No faces, no text, no logos."],
  ["svc:hardWater", "svc-hard-water.jpg", "Hard water removal", "Horizontal 3:2", "A gloved hand scrubbing a house window that has chalky white water spots, with half of the pane already crystal clear. Bright daylight, a suburban street faintly reflected in the glass. Realistic photo. No faces, no text."],
  ["svc:solar", "svc-solar.jpg", "Solar panel cleaning", "Horizontal 3:2", "A worker seen from behind on a sunny roof, cleaning dark blue residential solar panels with a long water-fed pole and soft brush, water sheeting off the panels. Spanish clay tile roof on a San Antonio home, clear sky. Realistic photo. No face visible, no text, no logos."],
  ["svc:glass", "svc-skylights.jpg", "Skylights, mirrors and glass", "Horizontal 3:2", "Looking up from inside a bright Texas living room at a spotless rectangular skylight, clear blue sky and a live oak branch visible through it, soft daylight falling on a white ceiling. Realistic interior photo. No people, no text, no logos."],
  ["svc:driveway", "svc-driveway.jpg", "Driveway washing", "Horizontal 3:2", "Pressure washing a concrete driveway in front of a Texas suburban home. A surface cleaner leaves a bright clean stripe through dark, dirty concrete, spray glinting in afternoon sun. Low angle, realistic photo. No faces, no text, no logos."],
  ["svc:screens", "svc-screens.jpg", "Screens and rescreening", "Horizontal 3:2", "Close-up of a gray window screen being rinsed with a garden hose on a driveway, dirty water running off the mesh, a stack of clean screens leaning against a garage door. Bright daylight, realistic photo. No faces, no text."],
  ["", "og-share.jpg", "Link preview image (Facebook, texts)", "Wide 1200 × 630", "Photo of a squeegee mid-stroke on a soapy house window, leaving a perfectly clear streak, deep blue Texas sky reflected in the clean glass. Lots of plain space on the left side. Realistic photo. No text, no logos. (Add the CWT logo and phone number on top in Canva.)"]
];
const REAL = [["owner", "luke.jpg", "About me photo", "Use a real photo, not AI. Phone camera, Luke from the chest up holding a squeegee in front of a clean window, outside in the shade, plain navy or white shirt, vertical. People hire the face they see."], ["", "job1-before.jpg + job1-after.jpg", "Before and afters", "Real jobs only. Same spot, same angle, same time of day, phone held sideways. Add each pair to images.gallery in the settings block. Don't use AI for these: they're your proof."]];
function photosPanel(body) {
  const I = C.CFG.images || {}, folder = I.folder || "images/";
  const srcFor = k => { if (!k) return ""; if (k.startsWith("svc:")) return folder + ((I.services || {})[k.slice(4)] || ""); return I[k] ? folder + I[k] : ""; };
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Photos</h2><p class="muted" style="max-width:68ch">Paste these into an image AI (ChatGPT, Gemini, Midjourney). Save each result with the file name shown, put them in a folder called <b>images</b> next to index.html, and upload the folder with the site. Missing photos are skipped, so add them whenever. A thumbnail shows here once a photo is in place.</p></div>' +
    '<div class="panel"><h3>Tips that keep them from looking fake</h3><ul class="prose" style="max-width:none;padding-left:20px"><li>Generate 3 or 4 and pick the one with the least plastic look. Skip anything with warped ladders, extra fingers or melted roof tiles.</li><li>Never let the AI write words or the phone number. Add text in Canva.</li><li>Use AI for scenery and close-ups only. Anything that shows Luke or a finished job should be a real photo.</li></ul></div>' +
    PROMPTS.map((p, i) => '<div class="panel prompt-card"><div class="thumb" data-thumb="' + esc(srcFor(p[0])) + '">' + esc(p[1]) + '</div><div class="copyblock"><div class="meta"><b style="color:var(--ink);font-size:15px">' + esc(p[2]) + '</b><span class="mono">' + esc(p[1]) + " · " + esc(p[3]) + '</span></div><div class="txt">' + esc(p[4]) + '</div><button type="button" class="btn ghost xs" data-cp="' + i + '" style="justify-self:start">Copy prompt</button></div></div>').join("") +
    REAL.map(r => '<div class="panel prompt-card"><div class="thumb" data-thumb="' + esc(srcFor(r[0])) + '">' + esc(r[1]) + '</div><div class="copyblock"><div class="meta"><b style="color:var(--ink);font-size:15px">' + esc(r[2]) + '</b><span class="mono">' + esc(r[1]) + '</span></div><div class="txt">' + esc(r[3]) + "</div></div></div>").join("") + "</div>";
  $$("[data-cp]").forEach(b => b.addEventListener("click", () => C.copyText(PROMPTS[+b.dataset.cp][4], b)));
  $$("[data-thumb]").forEach(t => { const s = t.dataset.thumb; if (!s) return; const im = new Image(); im.onload = () => { t.innerHTML = ""; t.appendChild(im); }; im.alt = ""; im.src = s; });
}

/* ---------------- Social kit ---------------- */
function socialPanel(body) {
  const B = C.CFG.business, D = C.CFG.discounts, site = (B.siteUrl || "[your website]").replace(/\/$/, ""), rev = B.googleReviewUrl || "[your Google review link]";
  const blocks = [
    ["Instagram bio", 150, "Window and power washing in San Antonio. Owner-operated by " + B.owner + ". " + pct(D.thankYou) + " off for military. Get your price below."],
    ["TikTok bio", 80, "SA window cleaning. Satisfying squeegee clips. Instant quotes below."],
    ["Facebook page bio", 255, "Owner-operated window and power washing for San Antonio, Alamo Heights, Stone Oak and Boerne. Windows, screens, hard water spots, gutters, solar panels, skylights and driveways. See your exact price online in about a minute."],
    ["Google Business Profile description", 750, B.name + " is an owner-operated window and power washing company based near the Pearl in San Antonio, serving Alamo Heights, Stone Oak, Helotes, Schertz, Fair Oaks Ranch, Boerne and nearby. We clean windows inside and out, hand-wash screens, clean tracks and sills, and treat the hard water spots San Antonio sprinklers leave behind. We also clean gutters, skylights, mirrors and solar panels, rescreen torn screens and pressure wash driveways. Prices are posted online, so you can see your exact quote in about a minute and book a time that works. Military, veterans, first responders and seniors get " + pct(D.thankYou) + " off, neighbors who book together save " + pct(D.neighbor) + (C.CFG.guarantees.rain ? ", and every outside clean comes with a " + C.CFG.guarantees.rainDays + "-day rain guarantee." : ".")],
    ["Nextdoor intro post", 0, "Hi neighbors! I'm " + B.owner + ", and I run " + B.name + ", a small window cleaning business here in San Antonio. I do inside and outside glass, screens, tracks, gutters and those white hard water spots from sprinklers. You can see your exact price on my site in about a minute, no phone tag: " + site + "\n\nIf you and a neighbor on your street book the same day, you both get " + pct(D.neighbor) + " off. Happy to answer questions here."],
    ["Neighborhood Facebook group post", 0, "Local window cleaner here. If your windows have that yellow pollen film or sprinkler spots, I can help. My prices are posted online so there are no surprises: " + site + "\n\nMilitary, first responders and seniors get " + pct(D.thankYou) + " off. Text me at " + B.phone + ". " + B.owner + ", " + B.name],
    ["Review request (send the same day)", 0, "Hi [name], thanks for having me out today! If the windows look good, would you leave a quick Google review? It really helps a small local business: " + rev + "\n\nThank you! " + B.owner + ", " + B.name],
    ["Quote follow-up (24 to 48 hours later)", 0, "Hi [name], it's " + B.owner + " with " + B.name + ". Following up on your quote for [total]. I have openings this week if you'd like to get on the schedule. Any questions, just text me back."],
    ["Plan offer (say it at the end of the job)", 0, "Glad you like how they turned out! If you want them to stay this way, I can put you on the quarterly plan. It's " + pct(C.CFG.plans.quarterly) + " off every visit and you never have to remember to call. Want me to pencil in the next one?"],
    ["Referral ask", 0, "If any neighbors ask who did your windows, send them my way. When they book, you get " + money(D.referralCredit) + " off your next clean. They just put your name in the quote."]
  ];
  const ideas = ["Split shot of a half-cleaned window: dirty side, clean side. Pin it to the top of the profile.", "Ten seconds of the squeegee fan stroke, no talking, just the sound.", "Close-up of sprinkler spots before and after. Caption: San Antonio water runs 15 to 20 grains hard.", "Wash a screen that looks clean and show the water that comes off it.", "Pollen season PSA in February and March: why the yellow film smears when you wipe it.", "A route day: three houses on one street, one coffee. Plug the neighbor deal.", "Thank-you post for a veteran customer, with permission, and the " + pct(D.thankYou) + " offer.", "Myth bust: newspaper and vinegar versus a squeegee and pure water.", "Track cleaning reveal. Gross, then clean.", "Solar panel rinse, with the customer's output app before and after if they share it.", "Screenshot of a new Google review next to the view out that customer's clean window.", "Holiday prep in November: clean glass before guests and photos."];
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Social kit</h2><p class="muted" style="max-width:66ch">Copy-ready text for every profile and the messages that turn one job into three. Grab the same handle everywhere if you can.</p></div>' +
    '<div class="panel"><h3>Handles to check</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">@crystalclearsatx</span><span class="tag">@crystalclearwindowssa</span><span class="tag">@ccwindows.sa</span></div><span class="hint">Put the links page (yoursite.com/#links) in every bio. Use one consistent name so Google matches your profiles to the business.</span></div>' +
    '<div class="two">' + blocks.map((b, i) => '<div class="panel copyblock"><div class="meta"><b style="color:var(--ink);font-size:15px">' + esc(b[0]) + "</b><span>" + (b[1] ? b[2].length + " / " + b[1] + " characters" : "") + '</span></div><div class="txt" id="sb' + i + '">' + esc(b[2]) + '</div><button type="button" class="btn ghost xs" data-cp="' + i + '" style="justify-self:start">Copy</button></div>').join("") + "</div>" +
    '<div class="panel"><h3>12 post ideas that work for window cleaners</h3><ol class="prose" style="max-width:none">' + ideas.map(x => "<li>" + esc(x) + "</li>").join("") + '</ol><span class="hint">Short vertical video beats photos. Post 3 times a week, same caption style, and always end with the links page.</span></div></div>';
  $$("[data-cp]").forEach(b => b.addEventListener("click", () => C.copyText(blocks[+b.dataset.cp][2], b)));
}

/* ---------------- Growth playbook ---------------- */
function src(url, label) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + "</a>"; }
function playbookPanel(body) {
  const D = C.CFG.discounts;
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Growth playbook</h2><p class="muted" style="max-width:66ch">What has worked for other window cleaners, what hasn\'t, and how the site already does the work for each one. Ranked by return for a one-person business.</p></div>' +
    '<div class="two"><div class="panel"><h3>Works</h3><ol class="prose works" style="max-width:none">' +
    "<li><b>Google reviews, asked for every time.</b>Window cleaners on the trade forums say most of their customers find them on Google, and reviews decide who gets the call. You're at " + esc(C.CFG.business.rating) + " from " + esc(C.CFG.business.reviewCount) + ". Aim for 25 by spring. Send the review text the same day (Social kit), and put the review link on the links page. " + src("https://community.windowcleaner.com/t/marketing-strategy-for-a-brand-new-business/42658", "Forum") + " · " + src("https://www.enrichlabs.ai/blog/window-cleaning-advertising-complete-guide-2026", "Enrich Labs") + "</li>" +
    "<li><b>Door hangers around every job.</b>Hang 10 to 20 on the street the same day: \"We just cleaned your neighbor's windows.\" The neighbor deal (" + pct(D.neighbor) + " off, split trip fee) gives them a reason to act now and fills your route on one street. Download it in Cards & QR. " + src("https://community.windowcleaner.com/t/getting-jobs/50176", "Forum") + "</li>" +
    "<li><b>Knocking doors with something free.</b>Owners report it's the cheapest way to get the first jobs. Saturday mornings in well-kept neighborhoods, a small freebie, a short line, then a door hanger for anyone not home. " + src("https://homefrontsuccess.substack.com/p/how-to-get-new-window-washing-customers-door-to-door", "Home Front Success") + "</li>" +
    "<li><b>Recurring plans.</b>Repeat cleans are faster and fill the calendar months ahead. Quarterly at " + pct(C.CFG.plans.quarterly) + " off matches what other shops offer. Pitch it at the end of every job while the glass looks its best. " + src("https://community.windowcleaner.com/t/maintenance-plans/42269", "Forum") + " · " + src("https://www.sweetwaternow.com/?p=443281", "Chip's plan tiers") + "</li>" +
    "<li><b>Bundling add-ons.</b>One cleaner bid gutters alone at $199 and sold windows plus gutters for $389 once he offered both. The quote builder shows gutters, hard water and screens on every quote, and gutters get " + pct(C.CFG.addons.gutterBundle) + " off with windows. " + src("https://community.windowcleaner.com/t/marketing-advice/46838", "Forum") + "</li>" +
    "<li><b>Posted prices.</b>The best-reviewed local shops mostly make you call. An instant price is a real edge, and it filters out people shopping for the cheapest number.</li>" +
    "<li><b>Partners who see dirty windows first.</b>Realtors (listing and move-in cleans), property managers, house cleaners, pool and lawn crews, HOAs. Offer them a referral credit. " + src("https://community.windowcleaner.com/t/marketing-strategy-for-a-brand-new-business/42658", "Forum") + "</li>" +
    "<li><b>Military City.</b>San Antonio has a huge military and veteran community. The " + pct(D.thankYou) + " thank-you is a common, respected offer, and it's one discount per home so it doesn't stack out of control.</li>" +
    "<li><b>Guarantees.</b>A rain guarantee and pay-after-you-check remove the risk of booking someone new. Gleam Team, one of the top-rated SA shops, runs a 7-day rain guarantee. " + src("https://threebestrated.com/window-cleaners-in-san-antonio-tx", "ThreeBestRated") + "</li>" +
    '</ol></div><div class="panel"><h3>Skip these</h3><ol class="prose works" style="max-width:none">' +
    "<li><b>Groupon and deep-discount sites.</b>Owners who tried it report one-time bargain hunters, a big share of the money going to the deal site, and customers who wait for the next deal instead of paying full price. " + src("https://community.windowcleaner.com/t/want-to-lose-your-butt-do-groupon/11291?page=2", "Forum") + " · " + src("https://community.windowcleaner.com/t/groupon-instant-customer-base-overnight/11364", "Forum") + "</li>" +
    "<li><b>Racing to the bottom on price.</b>Several local shops sit at $10 or more per window inside and out. Undercutting them trains customers to shop on price. Compete on clarity, reviews and speed.</li>" +
    "<li><b>Percent-off coupons on small jobs.</b>If you run a promo, make it a free add-on (free mirror or screen cleaning) or a dollar amount off a full-service job. " + src("https://community.windowcleaner.com/t/2020-door-hanger-and-eddm-ideas/52637", "Forum") + " · " + src("https://community.windowcleaner.com/t/what-coupons-work-well-for-you/43784?page=2", "Forum") + "</li>" +
    "<li><b>Driving far for tiny jobs.</b>The minimum visit and trip zones protect you. Group far-out jobs on one day (a Boerne day, a New Braunfels day) and use the neighbor deal to stack them. " + src("https://pressurewashingresource.com/community/t/how-much-do-you-charge-for-travel/15606", "Forum") + "</li>" +
    "<li><b>Discounting for anyone who asks.</b>Keep one fixed policy. Owners note the people who push hardest for a discount often expect the most. " + src("https://community.windowcleaner.com/t/discount-for-volume/24265", "Forum") + "</li>" +
    "<li><b>Paid ads before reviews.</b>Boosted posts and ads convert poorly until the profile has reviews and before-and-after photos. Build those first. " + src("https://www.enrichlabs.ai/blog/window-cleaning-advertising-complete-guide-2026", "Enrich Labs") + "</li>" +
    "<li><b>Nickel-and-dime invoices.</b>Customers prefer one clear price. The ticket shows the math, but the conversation should be about one total.</li>" +
    '</ol></div></div>' +
    '<div class="panel"><h3>First 30 days</h3><ol class="prose" style="max-width:none"><li><b>Week 1:</b> Put the site online, set up Calendly and quote emails (Setup guide). Add the website and photos to the Google profile. Order 250 cards and 250 door hangers.</li><li><b>Week 2:</b> Text past customers for a review and a referral. Post the intro on Nextdoor and in 3 neighborhood Facebook groups. Door hangers around every job.</li><li><b>Week 3:</b> Film 3 before-and-after clips and post 3 times a week. Drop cards with 5 realtors and 3 property managers.</li><li><b>Week 4:</b> Offer the quarterly plan on every job. Follow up every open quote within 48 hours from the Quote desk. Check which channel brought each job in.</li></ol></div>' +
    '<div class="panel"><h3>San Antonio season calendar</h3><div class="season"><div><b>Dec to Feb</b>Mountain cedar pollen. Slower months, so push plans and storefront routes.</div><div><b>Mar to May</b>Oak pollen and spring cleaning. Busiest stretch. Book plan customers first.</div><div><b>Jun to Sep</b>Sprinkler spots, dust and heat. Sell hard water treatment and solar panel washes. Start early in the day.</div><div><b>Oct to Nov</b>Leaves in gutters and pre-holiday cleans. Bundle gutters. Consider holiday light installs, which Gleam Team and Glass Geeks both sell.</div></div></div></div>';
}

/* ---------------- Market research ---------------- */
function researchPanel(body) {
  const W = C.CFG.windows;
  const comp = [
    ["Gleam Team Cleaning", "NW San Antonio (78250), serves Boerne", "Exterior $11, Starter $13, All-Star $15, Hall-of-Fame $19 per window", "$25 off first service, $50 off $500+, $30 off gutters, 10% referral credit, 7-day rain guarantee", "https://threebestrated.com/window-cleaners-in-san-antonio-tx"],
    ["Squeaky Dan's Window Cleaning", "NE San Antonio (78217)", "Inside and out from $10 per window", "Family-owned; one review describes two techs doing 19 windows plus screens in about 90 minutes", "https://threebestrated.com/window-cleaners-in-san-antonio-tx"],
    ["True View Window Cleaning", "San Antonio", "$10 per standard window inside and out, $49 starting price", "Thumbtack listing, insured and bonded claim", "https://next-www.thumbtack.com/tx/san-antonio/gutter-cleaners/true-view-window-cleaning-home-services/service/255798222699725964"],
    ["Glass Geeks", "Smithson Valley Rd (78261)", "Not published", "4.9 stars from about 1,400 reviews; windows, pressure washing, holiday lights", "https://reviews.birdeye.com/glass-geeks-window-cleaning-pressure-washing-147114654472008"],
    ["Wink & Shine Exterior Services", "San Antonio and Boerne", "Not published", "Windows, pressure washing, solar panels, gutters", "https://winkandshine.carrd.co/"],
    ["Boerne Window Cleaning Pros", "Boerne", "Not published", "Screens, hard water calcium removal, solar panels", "https://thebuildermarket.com/us/tx/comfort/windows"],
    ["Perfectly Clear Professional", "San Antonio and Boerne", "Not published", "In business since 1987", "https://homeguide.com/tx/san-antonio/pressure-washing/perfectly-clear-professional-window-cleaning-nvFLPcnVR"],
    ["First Act Exterior Cleaning", "Universal City", "Not published", "Veteran-owned; windows and pressure washing", "https://veteranbusinessowners.com/business/37736/first-act-exterior-cleaning"]
  ];
  const mkt = [
    ["Average whole-house clean, San Antonio", "$234 (typical $166 to $309)", "Angi", "https://servicemagic.com/tloc/San-Antonio-TX/Window-Cleaning/"],
    ["Average whole-house clean, Boerne", "$234 (typical $185 to $323)", "Angi", "https://match.angi.com/tloc/Boerne-TX/Window-Cleaning"],
    ["San Antonio range", "$182 to $242, extremes $89 to $357", "Homeyou", "https://www.homeyou.com/tx/window-cleaning-san-antonio-costs"],
    ["San Antonio per standard window", "$7 to $9", "HomeBlue", "https://www.homeblue.com/window-cleaning/san-antonio-tx-window-cleaning-cost.htm"],
    ["Thumbtack average job", "$165 to $180", "Thumbtack", "https://www.thumbtack.com/tx/san-antonio/window-cleaners"],
    ["National per window / per pane", "$8 to $16 per window, $4 to $8 per pane", "Jobber", "https://www.getjobber.com/academy/window-cleaning/how-to-price-window-cleaning/"],
    ["Screens / tracks / upstairs", "Screens about $5 each, tracks up to $5, 3rd and 4th floor +$3 to $5", "Sky's Window Cleaning", "https://skyswc.com/?p=2123"],
    ["Hard water treatment", "$5 to $12 per window extra", "2026 cost guide", "https://new.risingsunartscentre.org/news/cost-to-clean-windows-inside-and-out-2026.html"],
    ["Gutters, San Antonio", "1-story $70 to $250, 2-story $100 to $325", "This Old House", "https://www.thisoldhouse.com/near-me/texas/san-antonio/gutter-cleaning"],
    ["Driveway wash, San Antonio", "800 sq ft $140 to $250, about $190 average", "HomeBlue", "https://www.homeblue.com/pressure-washing/san-antonio-tx-pressure-washing-prices.htm"],
    ["Solar panel cleaning", "$15 to $25 per panel typical, many with a $100 minimum", "Bob Vila", "https://www.bobvila.com/articles/solar-panel-cleaning-cost/"],
    ["Rescreening labor", "$20 to $50 per screen", "HomeAdvisor", "https://www.homeadvisor.com/cost/doors-and-windows/install-a-screen"],
    ["Plan discounts", "Quarterly 15 to 20%, every 4 months 10%, twice a year 5%", "JotForm plan sheet, forum", "https://form.jotform.com/221843024819859"],
    ["Military / senior discounts", "10% common, one discount per home", "Forum", "https://community.windowcleaner.com/t/discount-for-volume/24265"],
    ["Minimum charge", "$100 to $150 typical", "Startup Financial Projection", "https://startupfinancialprojection.com/blogs/kpis/window-cleaning-service"],
    ["Vehicle cost", "IRS business rate 76 cents per mile from July 1, 2026", "IFEBP / IRS", "https://www.ifebp.org/detail-pages/news/2026/07/14/irs-increases-2026-standard-mileage-rates"],
    ["San Antonio water hardness", "15 to 20 grains per gallon", "Chambliss Plumbing", "https://chamblissplumbing.com/is-san-antonio-water-hard-or-soft/"]
  ];
  const typ = k => C.SIZES.reduce((a, s) => a + ({ S: 4, M: 12, L: 3, D: 1 })[s] * W[k][s], 0);
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Market research</h2><p class="muted" style="max-width:68ch">Researched October 2026 across San Antonio and Boerne shops, price guides and owner forums. Most local shops don\'t publish prices, so published local rates are anchored with the big price guides.</p></div>' +
    '<div class="panel"><h3>Local competitors</h3><div class="rtable"><table><thead><tr><th>Company</th><th>Area</th><th>Published prices</th><th>Offers and notes</th><th>Source</th></tr></thead><tbody>' + comp.map(r => "<tr><td><b>" + esc(r[0]) + "</b></td><td>" + esc(r[1]) + '</td><td class="n" style="white-space:normal">' + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + src(r[4], "Link") + "</td></tr>").join("") + "</tbody></table></div></div>" +
    '<div class="panel"><h3>Market numbers</h3><div class="rtable"><table><thead><tr><th>What</th><th>Number</th><th>Source</th></tr></thead><tbody>' + mkt.map(r => "<tr><td>" + esc(r[0]) + '</td><td class="n" style="white-space:normal">' + esc(r[1]) + "</td><td>" + src(r[3], r[2]) + "</td></tr>").join("") + "</tbody></table></div></div>" +
    '<div class="panel"><h3>How your prices were set</h3><ol class="prose" style="max-width:none">' +
    "<li><b>Inside & Out medium at " + money(W.standard.M) + ".</b> The published local floor is $10 inside and out (Squeaky Dan's, True View) and Gleam Team's in-and-out starter is $13. " + money(W.standard.M) + " sits just under the best-reviewed shop that posts prices, with a better booking experience.</li>" +
    "<li><b>Typical home lands on the market average.</b> A 20-window home (4 small, 12 medium, 3 large, 1 door) comes to " + money(typ("standard")) + " Inside & Out. Angi's San Antonio and Boerne averages are both $234.</li>" +
    "<li><b>Sizes scale with time on the glass.</b> Small is about two thirds of medium, large about 1.4 times, and a glass door about 1.25 times, matching how long each takes.</li>" +
    "<li><b>Exterior only is about 65% of Inside & Out</b> (" + money(typ("exterior")) + " for the typical home). Owners commonly charge around 60% for outside only, and Gleam Team's exterior rate is closer to 85% of its starter.</li>" +
    "<li><b>Full Detail adds about " + money(W.detail.M - W.standard.M) + " per medium window</b> for screens and tracks. Typical home: " + money(typ("detail")) + ", the top of San Antonio's typical range and still under Gleam Team's $19 top package.</li>" +
    "<li><b>Hard water at " + money(C.CFG.addons.hardWater) + " per window</b> sits mid-range of $5 to $12. San Antonio's very hard water makes this the most useful upsell in town.</li>" +
    "<li><b>Trip zones.</b> Inside about 20 road miles of the Pearl (most of the city inside Loop 1604) is free. Past that, flat fees of " + C.CFG.travel.zones.slice(1).map(z => money(z.fee)).join(", ") + " roughly cover the extra miles at the IRS rate plus part of the drive time, in line with owners who add around $50 for jobs more than 30 minutes out.</li>" +
    "<li><b>Minimum visit " + money(C.CFG.minimum) + "</b>, inside the usual $100 to $150 range, so a small far-off job still pays for the drive.</li>" +
    "<li><b>Discounts are capped at " + pct(C.CFG.discounts.cap) + "</b> so a plan, a thank-you and the neighbor deal together can't cut into the margin too far.</li></ol></div>" +
    '<div class="panel"><h3>Where this is weakest</h3><p class="muted">Only three local shops post prices, and the price guides blend in national data. Track your close rate in the Quote desk: if more than 8 in 10 quotes book, raise prices about 10%. If fewer than 3 in 10 book, look at which line customers question most.</p></div></div>';
}

/* ---------------- Setup guide ---------------- */
function setupPanel(body) {
  const B = C.CFG.business;
  const chk = [["Website address", B.siteUrl], ["Calendly link", B.calendlyUrl], ["Quote emails", B.quoteEmail], ["Google review link", B.googleReviewUrl], ["Email on the site", B.email], ["Instagram, Facebook or TikTok", B.instagram || B.facebook || B.tiktok]];
  body.innerHTML = '<div class="ad-panel"><div style="display:grid;gap:8px"><h2>Setup guide</h2><p class="muted" style="max-width:66ch">Do these once. Each one is a value in the settings block at the top of index.html, or in Pricing & settings here.</p></div>' +
    '<div class="panel"><h3>Status</h3><ul class="ok-list">' + chk.map(c => '<li><span class="dot ' + (c[1] ? "y" : "n") + '">' + (c[1] ? "✓" : "!") + "</span>" + esc(c[0]) + (c[1] ? ': <span class="mono" style="font-size:13px;word-break:break-all">' + esc(c[1]) + "</span>" : ": not set yet") + "</li>").join("") + "</ul></div>" +
    '<div class="two">' +
    '<div class="panel"><h3>1. Put the site online (free, 10 minutes)</h3><ol class="prose"><li>Make a free account at ' + src("https://app.netlify.com/drop", "app.netlify.com/drop") + ".</li><li>Put index.html in its own folder and drag the folder onto the page. You get a link like name.netlify.app.</li><li>In Site configuration, rename it, for example crystalclearsatx.netlify.app.</li><li>Optional: buy a domain like crystalclearsatx.com (about $10 to $20 a year) and connect it under Domain management.</li><li>Paste the address into <b>Website address</b> so QR codes point to it.</li></ol><p class=\"muted\" style=\"font-size:14px\">GitHub Pages works too: new repo, upload index.html, then Settings, Pages, deploy from the main branch.</p></div>" +
    '<div class="panel"><h3>2. Calendly booking (15 minutes)</h3><ol class="prose"><li>Sign up free at ' + src("https://calendly.com", "calendly.com") + " with the business email. Connect the calendar you actually use so jobs block real time.</li><li>Create one event type called <b>Window cleaning visit</b>. Set the length to 2 hours to start; you can change it later.</li><li>Set your working hours. Add a 30 minute buffer after each visit for driving, and at least 24 hours of minimum notice.</li><li>Open the event, then More options, Invitee form, Add new question. Add them in this order:<br><b>Question 1:</b> \"Your quote\", multiple lines. The site fills this in, so it must be first.<br><b>Question 2:</b> \"Service address\", one line.<br><b>Question 3:</b> Phone number type, required.</li><li>Copy the event link and paste it into <b>Calendly link</b>. Re-upload.</li><li>Test it: build a quote on the live site, tap Pick a time, and check that question 1 already has the quote in it.</li></ol><p class=\"muted\" style=\"font-size:14px\">Calendly emails you every booking with the quote and its code. Paste the code into the Quote desk to see your profit. " + src("https://calendly.com/help/how-to-pre-fill-invitee-information-in-your-calendly-link", "How prefill works") + " · " + src("https://calendly.com/help/how-to-add-or-remove-invitee-questions", "Adding questions") + "</p></div>" +
    '<div class="panel"><h3>3. Get quotes emailed to you (5 minutes)</h3><ol class="prose"><li>Put the email you check most into <b>Email quotes to</b> and re-upload.</li><li>On the live site, send yourself a test quote with Send to ' + esc(B.owner) + ".</li><li>The first time, FormSubmit emails you an activation link. Click it. That first test won't arrive; every quote after it will.</li><li>Each quote email has the customer's details, the full ticket and a quote code.</li><li>After activating, FormSubmit also emails a random alias address. Paste that into <b>Email quotes to</b> instead of the real address so bots can't scrape it from the page.</li></ol><p class=\"muted\" style=\"font-size:14px\">FormSubmit (" + src("https://formsubmit.co", "formsubmit.co") + ") is a free form service, so quote details pass through it on the way to your inbox. Until this is set up, customers send quotes by text from their own phone.</p></div>" +
    '<div class="panel"><h3>4. Google review link</h3><ol class="prose"><li>Open the Google Business Profile for ' + esc(B.name) + ".</li><li>Tap <b>Ask for reviews</b> and copy the link.</li><li>Paste it into <b>Google review link</b>. It shows up on the links page and in the Quote desk's Ask for review button.</li><li>Rename the listing to match the flyer and the site so customers know it's the same business.</li><li>While you're there, add the website address, your services, the service area and some before-and-after photos.</li></ol></div>" +
    '<div class="panel"><h3>5. Photos</h3><ol class="prose"><li>Open the Photos tab and make the pictures with an image AI, or use your own.</li><li>Save them with the exact file names into a folder called <b>images</b>.</li><li>Upload that folder next to index.html. Netlify Drop takes the whole folder at once.</li></ol></div><div class="panel"><h3>6. Change prices later</h3><ol class="prose"><li>Open yoursite.com/#admin and unlock.</li><li>Pricing & settings: change numbers, tap Try on this device, and check the quote.</li><li>Tap Get settings code, paste it into index.html as shown, and re-upload.</li></ol></div>' +
    '<div class="panel"><h3>7. About owner tools</h3><ol class="prose"><li>The passcode is set per device and keeps the Quote desk private in that browser. It is not an online account.</li><li>Saved quotes live in that browser. Use Export backup in the Quote desk now and then.</li><li>The links page is yoursite.com/#links. Put it in every social bio and on every card.</li></ol></div>' +
    "</div></div>";
}

window.CCW_ADMIN = { render };
})();
</script>
</body>
</html>
