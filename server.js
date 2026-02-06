// ==========================
// REQUIRED MODULES
// ==========================
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

// ==========================
// APP SETUP
// ==========================
const app = express();
const PORT = 3000;

// ==========================
// CLOUDINARY CONFIG
// ==========================
cloudinary.config({
  cloud_name: "mywallpapers",       // Replace with your Cloudinary cloud name
  api_key: "123456789012345",       // Replace with your Cloudinary API key
  api_secret: "AbCdEfGhIjKlMnOp"    // Replace with your Cloudinary API secret
});

// ==========================
// DATABASE (LOWDB v5+ FIX)
// ==========================
const adapter = new JSONFile("db.json");
const defaultData = { likes: [], favorites: [] }; // ✅ required for Lowdb v5+
const db = new Low(adapter, defaultData);

(async () => {
  await db.read();
})();

// ==========================
// MIDDLEWARE
// ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static("public"));
app.use(express.static("views"));

// ==========================
// HOME PAGE
// ==========================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// ==========================
// API: Get wallpapers from Cloudinary by category
// ==========================
app.get("/api/wallpapers/:category", async (req, res) => {
  const category = req.params.category;
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: `wallpapers/${category}/`,
      max_results: 500
    });
    const images = result.resources.map(img => img.secure_url);
    res.json(images);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// ==========================
// ADMIN LOGIN
// ==========================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    req.session.admin = true;
    res.redirect("/admin.html");
  } else {
    res.send("❌ Wrong username or password");
  }
});

// ==========================
// ADMIN PAGE (PROTECTED)
// ==========================
app.get("/admin.html", (req, res) => {
  if (!req.session.admin) return res.send("⛔ Access Denied");
  res.sendFile(__dirname + "/views/admin.html");
});

// ==========================
// MULTER TEMP STORAGE
// ==========================
const upload = multer({ dest: "temp/" });

// ==========================
// UPLOAD WALLPAPERS TO CLOUDINARY (with category)
// ==========================
app.post("/upload", upload.array("wallpaper"), async (req, res) => {
  if (!req.session.admin) return res.send("⛔ Not authorized");

  const category = req.body.category || "uncategorized";

  try {
    for (let file of req.files) {
      await cloudinary.uploader.upload(file.path, { folder: `wallpapers/${category}` });
    }
    res.send("✅ Uploaded to Cloudinary");
  } catch (err) {
    console.error(err);
    res.send("❌ Upload error");
  }
});

// ==========================
// LIKE API
// ==========================
app.post("/like", async (req, res) => {
  const image = req.body.image;

  await db.read();
  db.data.likes.push(image);
  await db.write();

  res.json({ success: true });
});

// ==========================
// LOGOUT
// ==========================
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
