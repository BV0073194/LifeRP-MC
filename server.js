const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- SERVER STATE ----------
let state = {
  orders: [],
  servedCount: 0,
  history: [],
};

// ---------- SOCKET LOGIC ----------
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current state to new client
  socket.emit("updateState", state);

  // Add new order
  socket.on("addOrder", (order) => {
    state.orders.push(order);
    io.emit("updateState", state);
  });

  // Update order (mark items ready)
  socket.on("updateOrder", (updatedOrder) => {
    const index = state.orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) state.orders[index] = updatedOrder;
    io.emit("updateState", state);
  });

  // Serve (remove) order
  socket.on("removeOrder", (id) => {
    const index = state.orders.findIndex(o => o.id === id);
    if (index !== -1) {
      const order = state.orders[index];
      state.orders.splice(index, 1);
      const time = new Date().toLocaleTimeString();
      state.history.push({
        player: order.player,
        items: order.items.map(i => i.name).join(", "),
        time,
      });
      state.servedCount++;
      io.emit("updateState", state);
    }
  });

  // Clear daily stats/history
  socket.on("clearHistory", () => {
    state.history = [];
    state.servedCount = 0;
    io.emit("updateState", state);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ---------- RENDER DEPLOY ----------
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
