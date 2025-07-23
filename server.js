const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createGame, tickGame } = require('./game');
const { createBot } = require('./bot');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let waitingPlayer = null;
let games = new Map();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('play', () => {
    if (waitingPlayer) {
      startGame([waitingPlayer, socket]);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      setTimeout(() => {
        if (waitingPlayer === socket) {
          const bot = createBot();
          startGame([socket], bot);
          waitingPlayer = null;
        }
      }, 10000);
    }
  });

  socket.on('move', (dir) => {
    const game = games.get(socket.id);
    if (game) game.input(socket.id, dir);
  });

  socket.on('drop', () => {
    const game = games.get(socket.id);
    if (game) game.dropBomb(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const game = games.get(socket.id);
    if (game) game.endGame(socket.id);
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

function startGame(players, bot = null) {
  const sockets = Array.isArray(players) ? players : [players];
  const game = createGame(sockets.map(s => s.id), bot);

  sockets.forEach(s => {
    s.emit('init', { playerId: s.id });
    games.set(s.id, game);
  });

  game.onUpdate((state) => {
    sockets.forEach(s => s.emit('state', state));
  });

  game.onEvent((event) => {
    sockets.forEach(s => s.emit(event));
  });

  const interval = setInterval(() => {
    if (game.ended) return clearInterval(interval);
    tickGame(game);
  }, 1000 / 60);
}

server.listen(3000, () => {
  console.log('Game server running on http://localhost:3000');
});
