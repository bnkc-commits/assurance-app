const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("client"));

let requests = []; // stockage en mémoire (à remplacer par DB réelle)

// API pour synchroniser les données
app.post("/api/sync", (req, res) => {
  requests.push(req.body);
  console.log("Nouvelle demande:", req.body);
  res.json({ status: "ok" });
});

// API pour générer un registre PDF
app.get("/api/print", (req, res) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  doc.fontSize(18).text("Registre des Prospects", { align: "center" });
  doc.moveDown();

  requests.forEach((r, i) => {
    doc.fontSize(12).text(`${i+1}. Nom: ${r.name} | Demande: ${r.request}`);
  });

  doc.end();
});

// WebRTC signalisation via Socket.io
io.on("connection", (socket) => {
  console.log("Nouvelle connexion");
  socket.on("signal", (data) => {
    socket.broadcast.emit("signal", data);
  });
});

server.listen(PORT, () => {
  console.log(`Serveur en ligne sur le port ${PORT}`);
});
