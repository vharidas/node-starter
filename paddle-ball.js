const { stdout, stdin } = process;
const { exec } = require('child_process');
const BALL_TEXTS = ['🏐', '⚽', '⚾', '🎾', '🏀'], PADDLE_TEXT = '⧋', WALL_TEXT = '█', BULLET_TEXT = '▲';
const showCursor = () => {
  stdout.cursorTo(0, 0);
  stdout.clearScreenDown();
  stdout.write('\x1B[?25h');
};
const hideCursor = () => {
  stdout.cursorTo(0, 0);
  stdout.clearScreenDown();
  stdout.write('\x1B[?25l');
};


const eraseBall = (ball) => {
  ball.visit((x, y) => {
    stdout.cursorTo(x, y);
    stdout.write(" ");
  })
}
const drawBall = (ball) => {
  ball.visit((x, y, img) => {
    stdout.cursorTo(x, y);
    stdout.write(img);
  })
}
const drawBullet = (x, y) => {
  stdout.cursorTo(x, y);
  stdout.write(BULLET_TEXT);
}
const eraseBullet = (x, y) => {
  stdout.cursorTo(x, y);
  stdout.write(' ');
}
const drawPaddle = (paddle) => {
  paddle.visit((x, y, width) => {
    stdout.cursorTo(x, y);
    stdout.write(PADDLE_TEXT.repeat(width));
  })
}
const erasePaddle = (paddle) => {
  paddle.visit((x, y, width) => {
    stdout.cursorTo(x, y);
    stdout.write(" ".repeat(width));
  })
}
const ensureBigWindow = () => {
  const [screenWidth, screenHeight] = stdout.getWindowSize();
  if (screenWidth < 120 || screenHeight < 40)
    throw new Error(`Need a minimum of 100x40 Window, current size=${screenWidth}x${screenHeight}`);
}
const CTRL_C = 3;
const captureStdin = (cb) => {
  stdin.setRawMode(true);
  stdin.on('data', (buffer) => {
    const char = buffer[0];
    if (char === CTRL_C) process.exit(1);
    if (char === 108) cb('left');
    if (char === 39) cb('right');
    if (char === 59) cb('up');
    if (char === 112) cb('down');
    if (char === 32) cb('space');
  });
}
class Paddle {
  constructor({ x, y, width }) {
    this.x = x;
    this.y = y;
    this.width = width;
  }
  moveRight(maxX) {
    this.x = Math.min(this.x + 4, maxX - this.width);
  }
  moveLeft(minX) {
    this.x = Math.max(minX, this.x - 4);
  }
  moveUp(minY) {
    this.y = Math.max(this.y + 2, minY);
  }
  moveDown(maxY) {
    this.y = Math.min(maxY, this.y - 2);
  }
  visit(visitor) {
    visitor(this.x, this.y, this.width);
  }
  hasPoint(x, y) {
    if (x < this.x) return false;
    if (x > this.x + this.width) return false;
    if (y < this.y) return false;
    if (y > this.y) return false;
    return true;
  }
}
class Wall {
  constructor({ x, y, width, height }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  hasPoint(x, y) {
    if (x < this.x) return false;
    if (x > (this.x + this.width)) return false;
    if (y < this.y) return false;
    if (y > (this.y + this.height)) return false;
    return true;
  }
  visit(visitor) {
    return visitor(this.x, this.y, this.width, this.height);
  }

}
/* randomizers */
const random = (max) => Math.floor(Math.random() * max);
const pickOne = (items) => items[random(items.length)];
const takeChance = (totalOutcomes) => random(totalOutcomes) == 0;
const identity = (x) => x;
const isOnTarget = (o, {x,y}) => [2,1,0].find(i=>o.hasPoint(x,y+i)||o.hasPoint(x+1-i,y));
class Bullets {
  constructor(minY) {
    this.bullets = [];
    this.minY = minY;
    this.cartridgesLeft = 0;
  }
  fire({ x, y }) {
    if (!this.cartridgesLeft) return;
    this.bullets.push({ x, y });
    this.cartridgesLeft--;
    return true;
  }
  reload() {
    this.cartridgesLeft += 10;
  }

  attack(targets, obstacles) {
    this.bullets.forEach(b => b.y-=2);
    const bulletHits = [];
    const targetHits = [];
    this.bullets.forEach(b => {
      if (b.y < this.minY) bulletHits.push(b);
    })
    obstacles.forEach(o => {
      this.bullets.forEach(b => {        
        if (o.hasPoint(b.x, b.y)) bulletHits.push(b);
      })
    })
    targets.forEach(t => {
      this.bullets.forEach(b => {
        if(isOnTarget(t,b)) {
          bulletHits.push(b);
          targetHits.push(t);
        }
      })
    })
    const rest = this.bullets.filter(b => !bulletHits.includes(b));
    this.bullets = rest;
    return targetHits;
  }
  getReserve(){
    return this.cartridgesLeft;
  }
  visit(visitor) {
    this.bullets.forEach(b => {
      visitor(b.x, b.y);
    })
  }
}
class Ball {
  constructor({ x, y, dx, dy, img }, onBounce) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.img = img;
    this.age = 0;
    this.onBounce = onBounce;
  }
  hasPoint(x, y) { return this.x === x && this.y === y; }
  move(obstacles) {
    this.age++;
    //if((this.age%5)) return;
    const nextX = this.x + this.dx;
    const nextY = this.y + this.dy;
    const rest = obstacles.filter(o => o !== this);
    const o = obstacles.find(o => o.hasPoint(nextX, nextY));
    
    if (!o) {
      this.x = nextX;
      this.y = nextY;
      return;
    }
    const isToRight = rest.find(o => o.hasPoint(this.x + Math.abs(this.dx), this.y));
    const isToLeft = rest.find(o => o.hasPoint(this.x - Math.abs(this.dx), this.y));
    const isToTop = rest.find(o => o.hasPoint(this.x, this.y - Math.abs(this.dy)));
    const isToBottom = rest.find(o => o.hasPoint(this.x, this.y + Math.abs(this.dy)));
    //console.log(isToTop && 'top',isToBottom && 'bot',isToLeft && 'left',isToRight && 'right');
    if (![isToBottom, isToLeft, isToRight, isToTop].some(identity)) {
      this.dx = -this.dx;
      this.dy = -this.dy;
    }
    //console.log(this.x,this.y, this.dx, this.dy);
    //console.log(nextX,nextY);
    if (isToRight || isToLeft) {
      this.dx = -this.dx;
      this.y = nextY;
    }
    if (isToTop || isToBottom) {
      this.dy = -this.dy;
      this.x = nextX;

    }
    this.onBounce();
  }
  visit(visitor) {
    return visitor(this.x, this.y, this.img);
  }
}
const isOutofBound = ball => {
  return ball.visit((x, y) => y > 40);
}
const gameOver = () => {
  exec('afplay /System/Library/Sounds/Purr.aiff');
  stdout.write('  Out!');
  setTimeout(() => {
    showCursor();
    process.exit(0);
  }, 3000);
}
const live = list => list.filter(identity);

const startBounce = (balls, walls, bullets, speed, onKill) => {
  const timer = setInterval(() => {
    bullets.visit(eraseBullet);

    const hitBalls = bullets.attack(live(balls), walls);
    //if(hitBalls.length) console.log(hitBalls);
    bullets.visit(drawBullet);
    hitBalls.forEach(b => {
      eraseBall(b);
      balls[balls.indexOf(b)] = null;
      onKill();
    });

    if (live(balls).length == 0) {
      clearInterval(timer);
      gameOver();
    }

    live(balls).forEach(ball => {
      eraseBall(ball);
      ball.move([...live(balls), ...walls]);
      drawBall(ball);

      if (isOutofBound(ball)) {
        clearInterval(timer);
        gameOver();
      }

    });
  }, 1000 / speed);
  return () => { clearInterval(timer) };
}
const drawWall = (wall) => {
  wall.visit((x, y, width, height) => {
    for (let r = y; r < (y + height); r++) {
      stdout.cursorTo(x + 1, r);
      stdout.write(WALL_TEXT.repeat(width));
    }
  });
}
const main = () => {
  ensureBigWindow();
  hideCursor();
  let score = 0;
  let bounces = 0;
  let speed = 5;
  let stop;
  const onKill = ()=>{
    score += 50;
    soundKill();
    updateScore();
  }
  const restartBounce = () => {
    stop && stop();
    stop = startBounce(balls, [paddle, topWall, leftWall, rightWall, midWall1, midWall2, midWall3], bullets, speed, onKill);
  }
  const updateScore = () => {
    const x = boundary.x2 + 6;
    const y = boundary.y2 / 2;
    stdout.cursorTo(x, y);
    stdout.write(' '.repeat(20));
    stdout.cursorTo(x, y + 2);
    stdout.write(' '.repeat(20));
    stdout.cursorTo(x, y + 4);
    stdout.write(' '.repeat(20));
    stdout.cursorTo(x, y);
    stdout.write(`Score: ${score}`);
    stdout.cursorTo(x, y + 2);
    stdout.write(`Speed: ${speed}`);
    stdout.cursorTo(x, y + 4);    
    stdout.write(`Cartridge: ${bullets.getReserve()}`);
  }
  const soundBounce = () => exec('afplay /System/Library/Sounds/Submarine.aiff');
  const soundBullet = () => exec('afplay /System/Library/Sounds/Hero.aiff');
  const soundKill = () => exec('afplay /System/Library/Sounds/Basso.aiff');
  const onBounce = () => {
    let restart = false;
    score = score + 1;
    bounces++;
    updateScore();
    soundBounce();
    if ((bounces % 5) == 0) {
      speed += 0.25;
      bullets.reload();
      restart = true;
    }
    if ((bounces % 10) == 0) {
      balls.push(new Ball({ x: 60, y: 6, dx: pickOne([-1, 1]), dy: pickOne([-1, 1]), img: pickOne(BALL_TEXTS) }, onBounce));
      restart = true;
    }
    restart && restartBounce();
  }
  const boundary = { x1: 1, y1: 8, x2: 121, y2: 40 };
  const paddle = new Paddle({ x: 50, y: 39, width: 8 });
  const balls = [new Ball({ x: 25, y: 3, dx: pickOne([-1, 1]), dy: pickOne([-1, 1]), img: pickOne(BALL_TEXTS) }, onBounce)];
  const leftWall = new Wall({ x: 1, y: 1, width: 1, height: 40 });
  const rightWall = new Wall({ x: 122, y: 1, width: 1, height: 40 });
  const topWall = new Wall({ x: boundary.x1, y: 1, width: boundary.x2, height: 1 });
  const midWall1 = new Wall({ x: 25, y: 10, width: 10, height: 1 });
  const midWall2 = new Wall({ x: 55, y: 15, width: 12, height: 1 });
  const midWall3 = new Wall({ x: 95, y: 9, width: 10, height: 1 });
  const bullets = new Bullets();
  [leftWall, rightWall, topWall, midWall1, midWall2, midWall3].forEach(drawWall);

  const fireBullet = () => {
    paddle.visit((x, y, width) => {
      bullets.fire({ x: (x + Math.round(width / 2)), y: y - 1 }) && soundBullet();
    })
  }
  drawPaddle(paddle);
  captureStdin((action) => {
    erasePaddle(paddle);
    const act = {
      left: () => paddle.moveLeft(boundary.x1 + 3),
      right: () => paddle.moveRight(boundary.x2),
      up: () => paddle.moveUp(3),
      down: () => paddle.moveDown(40),
      space: () => fireBullet(),
    }[action];
    act && act();
    drawPaddle(paddle);
  })
  restartBounce();
};
main();