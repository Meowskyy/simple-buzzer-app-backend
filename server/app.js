const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 3000;
const index = require("./routes/index");

const app = express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

var players = [];

function updatePlayerState(player) {
    console.log("Update state");

    for (var i = 0; i < players.length; i++) {
        if (player.id === players[i].id) {
            console.log("Found player");
            players[i] = player;
            break;
        }
    }
}

io.on("connection", socket => {
  console.log("New client connected: " + socket.id);
  players.push({ id: socket.id, name: "None", state: "None" });

  socket.emit('players', players);

  socket.broadcast.emit('player-new-connected', socket.id);
  
  socket.on ('player-rename', player => {
    console.log(`Player ${player.id} renamed to: ${player.name}`);

    updatePlayerState(player);

    io.emit ('player-rename', player);
  });

  socket.on('player-hate', player => {
    console.log(`${player.name} hates it!`);

    updatePlayerState(player);

    socket.broadcast.emit('player-hate', player);
  })

  socket.on('player-love', player => {
    console.log(`${player.name} loves it!`);

    updatePlayerState(player);

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
