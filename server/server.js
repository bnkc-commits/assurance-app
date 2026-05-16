const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("client"));

// API pour synchroniser les données
app.post("/api/sync", (req, res) => {
  console.log("Données reçues:", req.body);
  // Ici tu stockes dans ta base (MongoDB, PostgreSQL…)
  res.json({ status: "ok" });
});

// WebRTC signalisation via Socket.io
io.on("connection", (socket) => {
  console.log("Nouvelle connexion");
  socket.on("signal", (data) => {
    socket.broadcast.emit("signal", data);
  });
});

server.listen(3000, () => {
  console.log("Serveur en ligne sur http://localhost:3000");
});
