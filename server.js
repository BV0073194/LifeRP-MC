const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let orders = []; // Shared in-memory state

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current orders on connect
  socket.emit("updateOrders", orders);

  socket.on("addOrder", (order) => {
    orders.push(order);
    io.emit("updateOrders", orders);
  });

  socket.on("updateOrder", (updated) => {
    const idx = orders.findIndex(o => o.id === updated.id);
    if (idx !== -1) orders[idx] = updated;
    io.emit("updateOrders", orders);
  });

  socket.on("removeOrder", (id) => {
    orders = orders.filter(o => o.id !== id);
    io.emit("updateOrders", orders);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Use Render’s dynamic port
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
