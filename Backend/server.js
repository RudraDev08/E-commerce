import express from "express";
import https from "https";
import fs from "fs";
import path from "path";

const app = express();

// test route
app.get("/test", (req, res) => {
  res.send("✅ HTTPS SERVER IS WORKING");
});

// SSL options
const sslOptions = {
  key: fs.readFileSync(path.resolve("cert/key.pem")),
  cert: fs.readFileSync(path.resolve("cert/cert.pem")),
};

const PORT = 5000;

// HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🔐 HTTPS Server running at https://localhost:${PORT}`);
});
