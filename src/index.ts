// TODO
// - add sounds
// - fix heads colision (once one snake is dead, it can't kill the other)

interface Point {
  x: number
  y: number
}

function pointsEq(a: Point, b: Point) {
  return a.x == b.x && a.y == b.y
}

function drawPoint(ctx: CanvasRenderingContext2D, p: Point, color: string) {
  ctx.shadowColor = color
  ctx.shadowBlur = 20
  ctx.fillStyle = color
  ctx.fillRect(p.x, p.y, 1, 1)
}

class Snake {
  dir: { x: number; y: number } | null
  // Cache the next direction so if dirrection is
  // changed before the next move, we still move in
  // the firs requested direction
  nextDir: { x: number; y: number } | null
  tail: Point[] = []
  get points() {
    return [this.pos, ...this.tail]
  }
  size = 10

  constructor(
    public pos: Point,
    private controls: { left: string; up: string; right: string; down: string },
    private color: [r: number, v: number, b: number],
    public shrinkSise: number = 1
  ) {
    // TODO: fix leak
    document.addEventListener("keydown", (e) => {
      const k = e.key.toLocaleLowerCase()
      let x = 0,
        y = 0
      if (k === this.controls.left) {
        x = -1
      } else if (k == this.controls.up) {
        y = -1
      } else if (k === this.controls.right) {
        x = 1
      } else if (k === this.controls.down) {
        y = 1
      } else if (k === "Space") {
        this.dir = null
        return
      } else {
        return
      }

      // Can't move on itself
      if (this.dir != null && ((this.dir.x && x) || (this.dir.y && y))) {
        return
      }
      this.dir = { x, y }
      this.nextDir = this.nextDir || this.dir
    })
  }

  move() {
    if (!this.dir) {
      return
    }

    const dir = this.nextDir || this.dir
    this.nextDir = null

    // tail
    this.tail.unshift(this.pos)
    this.tail = this.tail.slice(0, this.size)

    this.pos = {
      x: this.pos.x + dir.x,
      y: this.pos.y + dir.y,
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.points.forEach((p, i) => {
      const minAlpha = 0.4
      const alpha = minAlpha + (1 - i / this.points.length) * (1 - minAlpha)
      drawPoint(
        ctx,
        p,
        `rgba(${this.color.map((n) => `${n}`).join()}, ${alpha}`
      )
    })
  }
}

class Food {
  constructor(public pos: Point, public size: number, public color: string) {}
}

function SnakeGame() {
  const scale = 15
  const w = 40
  const h = 30
  let snakes: Snake[]
  let food: Food[] = []
  let running = false
  let step: number //ms
  let enablePortal = true
  let frame = 0
  let endFrame = 0

  function createRandomFood() {
    return Math.random() < 0.1 ? createFood(20, "#ff0") : createFood(3, "#09f")
  }

  function createFood(size: number, color: string) {
    // TODO: optimize
    // TODO: no food on other food
    const allPoints = snakes.flatMap((s) => s.points)
    for (;;) {
      const pos = {
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h),
      }
      if (!allPoints.some((p) => pointsEq(p, pos))) {
        return new Food(pos, size, color)
      }
    }
  }

  // Create the canvas
  const canvas = document.createElement("canvas")
  document.body.appendChild(canvas)
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)

  newGame()

  let accumulator = 0
  function loop(time: number) {
    accumulator = accumulator || time
    while (accumulator <= time) {
      update()
      accumulator += step
    }
    draw()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  function update() {
    if (!running) {
      return
    }

    frame++

    if (endFrame) {
      if (frame >= endFrame) {
        newGame()
      }
      return
    }
    if (frame % 20 === 0) {
      snakes.forEach((s) => s.size--)
    }
    for (const snake of snakes) {
      snake.move()

      // portal
      if (enablePortal) {
        snake.pos.x = (snake.pos.x + w) % w
        snake.pos.y = (snake.pos.y + h) % h
      }

      // check if lost
      const allPoints = [
        ...snake.tail,
        ...snakes.filter((sn) => sn !== snake).flatMap((s) => s.points),
      ]
      if (
        allPoints.some((p) => pointsEq(p, snake.pos)) ||
        snake.pos.x !== (snake.pos.x + w) % w ||
        snake.pos.y !== (snake.pos.y + h) % h
      ) {
        snake.size -= snake.shrinkSise
      }
      if (snake.size < 0) {
        snakes = snakes.filter((sn) => sn !== snake)
      }

      // food
      const eaten = food.filter((f) => pointsEq(snake.pos, f.pos))
      eaten.forEach((f) => {
        delete food[food.indexOf(f)]
        food.push(createRandomFood())
        snake.size += f.size
        step = step * 0.985 // Speed-up game
      })
    }

    // Poison
    if (frame % 500 === 0) {
      ;[...Array(9)].forEach(() => food.push(createFood(-9, "#c0f")))
    }

    if (snakes.length <= 1 && !endFrame) {
      endFrame = frame + 20
    }
  }

  function newGame() {
    snakes = [
      new Snake(
        { x: w / 4, y: h / 2 },
        { left: "a", up: "w", right: "d", down: "s" },
        [255, 0, 0],
        20
      ),
      new Snake(
        { x: w / 2, y: h / 2 },
        {
          left: "g",
          up: "y",
          right: "j",
          down: "h",
        },
        [0, 255, 0],
        20
      ),
      new Snake(
        { x: (w / 4) * 3, y: h / 2 },
        {
          left: "arrowleft",
          up: "arrowup",
          right: "arrowright",
          down: "arrowdown",
        },
        [255, 125, 0],
        20
      ),
    ]
    food = [...Array(8)].map(createRandomFood)
    step = 100
    frame = 0
    running = true
    endFrame = 0
  }

  function draw() {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, w, h)
    snakes.forEach((snake) => snake.draw(ctx))
    food.forEach((f) => drawPoint(ctx, f.pos, f.color))
  }
}

SnakeGame()
