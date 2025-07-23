function createGame(playerIds, bot = null) {
  const map = Array.from({ length: 15 }, (_, y) =>
    Array.from({ length: 20 }, (_, x) => {
      if (y % 2 === 1 && x % 2 === 1) return 1;
      return Math.random() < 0.2 ? 2 : 0;
    })
  );

  const players = {};
  playerIds.forEach((id, i) => {
    players[id] = { id, x: i === 0 ? 1 : 18, y: i === 0 ? 1 : 13, alive: true };
  });
  if (bot) players[bot.id] = { id: bot.id, x: 1, y: 13, alive: true };

  const bombs = [];
  const explosions = [];
  const inputs = {};
  let updateCallback = () => {};
  let eventCallback = () => {};
  let ended = false;

  function input(id, dir) {
    inputs[id] = dir;
  }

  function dropBomb(id) {
    const p = players[id];
    if (p && p.alive && !bombs.some(b => b.x === p.x && b.y === p.y)) {
      bombs.push({ x: p.x, y: p.y, timer: 180, owner: id });
      eventCallback('bombDrop');
    }
  }

  function tick() {
    if (ended) return;

    Object.entries(inputs).forEach(([id, dir]) => {
      const p = players[id];
      if (!p || !p.alive) return;
      const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 0];
      const [nx, ny] = [p.x + dx, p.y + dy];
      if (map[ny]?.[nx] === 0 && !Object.values(players).some(op => op.x === nx && op.y === ny))
        Object.assign(p, { x: nx, y: ny });
    });

    if (bot && players[bot.id]?.alive) {
      const action = bot.think({ map, bombs });
      if (action === 'drop') dropBomb(bot.id);
      else if (action) input(bot.id, action);
    }

    bombs.forEach(b => b.timer--);
    const exploded = bombs.filter(b => b.timer <= 0);
    exploded.forEach(b => {
      bombs.splice(bombs.indexOf(b), 1);
      eventCallback('bombExplode');
      explode(b.x, b.y);
    });

    explosions.forEach(e => e.timer--);
    explosions.filter(e => e.timer <= 0).forEach(e => explosions.splice(explosions.indexOf(e), 1));

    Object.values(players).forEach(p => {
      if (!p.alive) return;
      if (explosions.some(e => e.x === p.x && e.y === p.y)) p.alive = false;
    });

    if (Object.values(players).filter(p => p.alive).length <= 1) ended = true;

    updateCallback({ map, players, bombs, explosions });
  }

  function explode(x, y) {
    for (let dx = -2; dx <= 2; dx++) if (map[y]?.[x + dx] !== 1) addExplosion(x + dx, y);
    for (let dy = -2; dy <= 2; dy++) if (map[y + dy]?.[x] !== 1) addExplosion(x, y + dy);
  }

  function addExplosion(x, y) {
    explosions.push({ x, y, timer: 30 });
    if (map[y]?.[x] === 2) map[y][x] = 0;
  }

  return {
    input,
    dropBomb,
    onUpdate: cb => (updateCallback = cb),
    onEvent: cb => (eventCallback = cb),
    endGame: () => (ended = true),
    get ended() { return ended; },
    tick
  };
}

function tickGame(game) {
  game.tick?.();
}

module.exports = { createGame, tickGame };
