require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 3000
const CLIENT_URL = process.env.CLIENT_URL

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('room:join', (data) => {
    const { roomId, email } = data;
    console.log(data);
    // send a msg that someone has joined a room
    io.to(roomId).emit('user:joined', { email, id: socket.id })
    socket.join(roomId)

    // send back the data received to all the users
    io.to(socket.id).emit('room:join', data)
  })

});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});