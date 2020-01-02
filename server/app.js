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

function updatePlayerState(player, socket) {
    //console.log("Update state");
    //console.log(player);

    if (player.name === "Spectator") {
      console.log("Found Spectator");
      return false;
    }

    var foundPlayer = false;
    for (var i = 0; i < players.length; i++) {
        if (player.id === players[i].id) {
            if (players.length === 0) {
              console.log("Set " + player.name + " as host!");
              player.host = true;
              socket.emit('player-host', player);
            }

            console.log(`Player ${player.id} renamed to: ${player.name}`);
            players[i].name = player.name;
            foundPlayer = true;
            break;
        }
    }

    if (!foundPlayer) {
      console.log("Added new player: " + player.name);

      if (players.length === 0) {
        console.log("Set " + player.name + " as host!");
        player.host = true;
      }

      players.push(player);

      socket.emit('player-host', player);
    }

    return true;
}

function resetPlayerStates() {
  for (var i = 0; i < players.length; i++) {
    players[i].state = "None";
  }
}

io.on("connection", socket => {
  //console.log("New client connected: " + socket.id);
  //socket.emit('player-new-connected', players);
  
  socket.emit('players', players);
  
  socket.on ('player-rename', player => {
    if (updatePlayerState(player, socket)) {
      io.emit ('players', players);
    }
  });

  socket.on('player-hate', player => {
    //console.log(`${player.name} hates it!`);

    updatePlayerState(player, socket);

    socket.broadcast.emit('player-hate', player);
  })

  socket.on('player-love', player => {
    //console.log(`${player.name} loves it!`);

    updatePlayerState(player, socket);

    socket.broadcast.emit('player-love', player);
  })

  socket.on('reset-players', () => {

    resetPlayerStates();

    io.emit('players', players);
    io.emit('reset-player');
  })
  
  socket.on("disconnect", () => {
    var playerIndex = -1;
    var isHost = false;
    for (var i = 0; i < players.length; i++) {
      if (socket.id === players[i].id) {
        playerIndex = i;
        isHost = players[i].host;
        break;
      }
    }

    if (playerIndex > -1) {
      players.splice(playerIndex, 1);
    }

    if (isHost && players.length > 0) {
      players[0].host = true;
      io.emit('players', players);
      console.log("New host: " + players[0].name);
    }

    //console.log("Client disconnected");
    socket.broadcast.emit('player-disconnected', socket.id);
  });

});

server.listen(port, () => console.log(`Listening on port ${port}`));
