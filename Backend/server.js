import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());

// Create room endpoint
app.get("/create", (req, res) => {
  const roomId = uuidv4();
  res.json({ url: `http://localhost:5173/room/${roomId}` });
});

// Socket.io signaling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);

    socket.on("signal", (data) => {
      io.to(data.to).emit("signal", { from: socket.id, data: data.signal });
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-left", socket.id);
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
