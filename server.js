const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ room }) => {
    if (!room || typeof room !== "string") return;
    socket.join(room);
    socket.emit("receiveMessage", `✅ Joined room: ${room}`);
    socket.to(room).emit("receiveMessage", "👋 A new user joined the room");
  });

  socket.on("sendMessage", ({ room, msg }) => {
    if (!room || !msg) return;
    io.to(room).emit("receiveMessage", msg);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`TranChat server running on http://0.0.0.0:${PORT}`);
});
