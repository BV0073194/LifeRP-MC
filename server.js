const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.emit('message', 'Welcome to the Socket.IO demo!');
  socket.on('chat', (msg) => {
    io.emit('chat', msg);
  });
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
