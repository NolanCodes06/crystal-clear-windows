<script>
/* ================================================================
   SITE SETTINGS START
   Change prices, links and contact info here, save, and re-upload.
   Owner tools (yoursite.com/#admin > Pricing & settings) can
   generate this whole block for you. Percentages are decimals:
   0.10 means 10%.
   ================================================================ */
const CONFIG = {
  business: {
    name: "Crystal Clear Window Washing",
    owner: "Luke",
    phone: "(210) 726-3608",
    email: "door2dumped@gmail.com",      // shows an Email button when filled in
    hours: "Call or text any day.",
    baseZip: "78215",       // travel is measured from here (the Pearl)
    baseLabel: "the Pearl",
    siteUrl: "https://nolancodes06.github.io/crystal-clear-windows/", // used for the QR code
    calendlyUrl: "",        // e.g. https://calendly.com/crystalclearsatx/window-cleaning
    quoteEmail: "door2dumped@gmail.com", // where "Send to Luke" quotes get emailed (see Setup guide)
    googleReviewUrl: "",    // Google Business Profile > Ask for reviews link
    googleProfileUrl: "",   // link to the Google listing
    instagram: "",
    facebook: "",
    tiktok: "",
    nextdoor: "",
    rating: "5.0",
    reviewCount: 6
  },
  windows: {               // price per window, by package and size
    exterior: { S: 5,  M: 8,  L: 11, D: 10 },
    standard: { S: 8,  M: 12, L: 17, D: 15 },
    detail:   { S: 10, M: 15, L: 21, D: 18 }
  },
  surcharges: { upstairs2: 3, upstairs3: 5, grids: 4 },
  buildup: { recent: 1, mid: 1.1, old: 1.2 },
  addons: {
    hardWater: 8, skylight: 15, mirror: 6,
    gutters: { "1": 129, "2": 189, "3": 249 }, gutterBundle: 0.10,
    solarPanel: 8, solarMin: 99,
    rescreen: 35, rescreenSolar: 60,
    driveway: { S: 119, M: 179, L: 249 }
  },
  plans: { once: 0, twice: 0.05, thrice: 0.10, quarterly: 0.15 },
  discounts: { thankYou: 0.10, neighbor: 0.10, cap: 0.25, neighborTripShare: 0.5, referralCredit: 25 },
  minimum: 129,
  travel: {
    roadFactor: 1.2,       // straight-line miles x this = estimated road miles
    zones: [
      { upTo: 20, fee: 0,  name: "Home zone" },
      { upTo: 30, fee: 20, name: "Zone 2" },
      { upTo: 40, fee: 35, name: "Zone 3" },
      { upTo: 55, fee: 50, name: "Zone 4" }
    ]
  },
  guarantees: { rain: true, rainDays: 7 },
  // Edit this so it sounds like Luke. Each line is its own paragraph.
  about: [
    "I'm Luke, and Crystal Clear is my business. When you book, I'm the one who shows up, and I'm the one who checks every window before I call it done.",
    "I clean windows and power wash all over San Antonio, from Alamo Heights and Stone Oak out to Boerne. I post my prices so you know the number before I get there.",
    "If something isn't right when I'm finished, tell me and I'll fix it before I leave."
  ],
  // Photos go in a folder named "images" next to index.html, using these exact file names.
  // Missing photos are skipped automatically. Owner tools > Photos has a prompt for each one.
  images: {
    folder: "images/",
    heroView: "hero-view.jpg",
    owner: "luke.jpg",
    why: "hard-water.jpg",
    services: { gutters: "svc-gutters.jpg", hardWater: "svc-hard-water.jpg", solar: "svc-solar.jpg", glass: "svc-skylights.jpg", driveway: "svc-driveway.jpg", screens: "svc-screens.jpg" },
    // Real job photos only, same angle before and after. Example:
    // { before: "job1-before.jpg", after: "job1-after.jpg", caption: "Stone Oak, sprinkler spots" }
    gallery: []
  },
  ops: { laborRate: 25, mileRate: 0.76, supplyPct: 0.04, cardFeePct: 0.03, avgMph: 35 },
  time: {                  // minutes, used for time-on-site and profit estimates
    S: 4, M: 6, L: 9, D: 8, exteriorFactor: 0.5, detailExtra: 3, upstairs: 2, grids: 3,
    hardWater: 6, skylight: 10, mirror: 4, gutters: { "1": 45, "2": 70, "3": 100 },
    solarPanel: 3, solarSetup: 20, rescreen: 20, driveway: { S: 60, M: 90, L: 120 }, setup: 15
  }
};
/* ======================= SITE SETTINGS END ======================= */
</script>
