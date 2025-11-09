const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// --- Shared in-memory state ---
let orders = [];
let history = [];
let servedCount = 0;

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Socket.IO
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current state
  socket.emit("init", { orders, history, servedCount });

  // Add new order
  socket.on("addOrder", (order) => {
    orders.push(order);
    io.emit("updateOrders", orders);
  });

  // Update order (item done/ready)
  socket.on("updateOrder", (updated) => {
    const idx = orders.findIndex(o => o.id === updated.id);
    if (idx !== -1) orders[idx] = updated;
    io.emit("updateOrders", orders);
  });

  // Serve (remove) order
  socket.on("removeOrder", (id) => {
    const order = orders.find(o => o.id === id);
    if (order) {
      orders = orders.filter(o => o.id !== id);
      servedCount++;
      history.push({
        player: order.player,
        items: order.items.map(i => i.name).join(", "),
        time: new Date().toLocaleTimeString()
      });
      io.emit("updateOrders", orders);
      io.emit("updateHistory", { history, servedCount });
    }
  });

  // Clear history & reset counter
  socket.on("clearHistory", () => {
    history = [];
    servedCount = 0;
    io.emit("updateHistory", { history, servedCount });
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
