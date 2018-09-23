const SCALE = 15;
const WIDTH = 30;
const HEIGHT = 30;
const SPEED = 400;

/** One-time setup: find HTML canvas element */

const canvas = document.getElementById('board');
canvas.setAttribute('height', HEIGHT * SCALE);
canvas.setAttribute('width', WIDTH * SCALE);
const ctx = canvas.getContext('2d');

/** Point: */

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x * SCALE, this.y * SCALE, SCALE / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  static newRandom() {
    const randRange = (low, hi) => low + Math.floor(Math.random() * (hi - low));
    return new Point(randRange(1, WIDTH), randRange(1, HEIGHT));
  }

  isOutOfBound() {
    return this.x <= 0 || this.x >= WIDTH || this.y <= 0 || this.y >= HEIGHT;
  }
}

/** Food pellet */

class Pellet {
  constructor(x, y) {
    this.pt = new Point(x, y);
  }

  static newRandom() {
    const pt = Point.newRandom();
    return new Pellet(pt.x, pt.y);
  }

  draw() {
    this.pt.draw('green');
  }
}

/** Snake */

class Snake {
  constructor(keymap, start, dir, color = 'orange') {
    this.keymap = keymap; // mapping of keys to directions
    this.parts = [start]; // list of x-y coordinates of parts
    this.dir = dir; // dir to move on next move
    this.growBy = 0; // how many to grow by (goes up after eating)
    this.color = color;
    this.countKeyPress = 0;
  }

  draw() {
    for (const p of this.parts) p.draw(this.color);
  }

  contains(pt) {
    return this.parts.some(me => me.x === pt.x && me.y === pt.y);
  }

  crashIntoSelf() {
    return this.parts.slice(1).some(pt => {
      return pt.x === this.head().x && pt.y === this.head().y;
    });
  }

  crashIntoWall() {
    return this.head().isOutOfBound();
  }

  head() {
    return this.parts[0];
  }

  move() {
    const { x, y } = this.head();
    let pt;
    if (this.dir === 'left') pt = new Point(x - 1, y);
    if (this.dir === 'right') pt = new Point(x + 1, y);
    if (this.dir === 'up') pt = new Point(x, y - 1);
    if (this.dir === 'down') pt = new Point(x, y + 1);
    this.parts.unshift(pt);
  }

  handleKey(key) {
    if (this.keymap[key] !== undefined) this.changeDir(this.keymap[key]);
  }

  changeDir(dir) {
    if (
      !(
        (this.dir === 'left' && dir === 'right') ||
        (this.dir === 'right' && dir === 'left') ||
        (this.dir === 'up' && dir === 'down') ||
        (this.dir === 'down' && dir === 'up')
      ) &&
      this.countKeyPress === 0
    ) {
      this.dir = dir;
      this.countKeyPress = 1;
    }
  }

  grow() {
    this.growBy += 2;
  }

  truncate() {
    if (this.growBy === 0) this.parts.pop();
    else this.growBy--;
  }

  eats(food) {
    const head = this.head();
    return food.find(f => f.pt.x === head.x && f.pt.y === head.y);
  }
}

/** Overall game. */

class Game {
  constructor(snakes) {
    this.snakes = snakes;
    this.food = [];
    this.numFood = 7;

    this.interval = null;
    this.keyListener = this.onkey.bind(this);
  }

  refillFood() {
    while (this.food.length < this.numFood) {
      let newFood = Pellet.newRandom();
      let notOnTopOfSnake = true;
      for (let snake of this.snakes) {
        if (snake.contains(newFood.pt)) {
          notOnTopOfSnake = false;
        }
      }
      if (
        notOnTopOfSnake &&
        !this.food.some(pt => {
          return pt.x === newFood.pt.x && pt.y === newFood.pt.y;
        })
      ) {
        this.food.push(newFood);
      }
    }
  }

  play() {
    document.addEventListener('keydown', this.keyListener);
    this.interval = window.setInterval(this.tick.bind(this), SPEED);
  }

  onkey(e) {
    for (let snake of this.snakes) {
      snake.handleKey(e.key);
    }
  }

  removeFood(pellet) {
    console.log('food before', this.food);
    this.food = this.food.filter(
      f => f.pt.x !== pellet.pt.x || f.pt.y !== pellet.pt.y
    );
    console.log('food after', this.food);
  }
  moveSnakes() {
    for (let snake of this.snakes) {
      snake.move();
      snake.truncate();
      snake.draw();
      let eaten;
      if ((eaten = snake.eats(this.food))) {
        this.removeFood(eaten);
        snake.grow();
      }
      snake.countKeyPress = 0;
    }
  }

  noDeadSnakes() {
    for (let snake of this.snakes) {
      if (snake.crashIntoSelf.call(snake) || snake.crashIntoWall.call(snake)) {
        return false;
      }
    }
    return true;
  }

  noSnakeCollision() {
    for (let i = 0; i < this.snakes.length - 1; i++) {
      for (let j = i + 1; j < this.snakes.length; j++) {
        if (this.snakes[j].contains(this.snakes[i].head())) {
          return false;
        }
      }
    }
    return true;
  }

  tick() {
    console.log('tick');
    if (this.noDeadSnakes() && this.noSnakeCollision()) {
      ctx.clearRect(0, 0, SCALE * WIDTH, SCALE * HEIGHT);
      for (const f of this.food) {
        f.draw();
      }
      this.moveSnakes();
      this.refillFood();
    } else {
      window.clearInterval(this.interval);
      window.removeEventListener('keydown', this.keyListener);
    }
  }
}

const snake1 = new Snake(
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' },
  new Point(2, 2),
  'right'
);

const snake2 = new Snake(
  { a: 'left', d: 'right', w: 'up', s: 'down' },
  new Point(18, 18),
  'left',
  'blue'
);

const game = new Game([snake1, snake2]);

game.play();
