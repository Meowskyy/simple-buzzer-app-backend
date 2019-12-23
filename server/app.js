const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 3000;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

var players = [];

io.on("connection", socket => {
  console.log("New client connected: " + socket.id);
  players.push({id: socket.id, name: "None" });

  socket.emit('players', players);

  socket.broadcast.emit('player-new-connected', socket.id);
  
  socket.on ('player-rename', data => {
    console.log(`Player ${data.id} renamed to: ${data.name}`);
    socket.broadcast.emit ('player-rename', data);
  });

  socket.on('player-hate', player => {
    console.log(`${player.name} hates it!`);
    socket.broadcast.emit('player-hate', player);
  })

  socket.on('player-love', player => {
    console.log(`${player.name} loves it!`);
    socket.broadcast.emit('player-love', player);
  })
  
  socket.on("disconnect", () => {
    var playerIndex = -1;
    for (var i = 0; i < players.length; i++) {
      if (socket.id === players[i].id) {
        playerIndex = i;
        break;
      }
    }

    if (playerIndex > -1) {
      players.splice(playerIndex, 1);
    }

    console.log("Client disconnected");
    socket.broadcast.emit('player-disconnected', socket.id);
  });

});

server.listen(port, () => console.log(`Listening on port ${port}`));