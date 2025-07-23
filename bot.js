function createBot() {
  return {
    id: 'bot',
    x: 1,
    y: 1,
    cooldown: 0,
    think(state) {
      if (this.cooldown-- > 0) return null;

      const danger = state.bombs.some(b => Math.abs(b.x - this.x) + Math.abs(b.y - this.y) < 3);
      if (danger) {
        this.cooldown = 20;
        return ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
      }

      const near = state.map[this.y]?.[this.x + 1] === 2 ||
                   state.map[this.y]?.[this.x - 1] === 2 ||
                   state.map[this.y + 1]?.[this.x] === 2 ||
                   state.map[this.y - 1]?.[this.x] === 2;
      if (near) {
        this.cooldown = 30;
        return 'drop';
      }

      this.cooldown = 15;
      return ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
    }
  };
}

module.exports = { createBot };
