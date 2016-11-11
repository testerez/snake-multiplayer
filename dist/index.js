function pointsEq(a, b) {
    return a.x == b.x && a.y == b.y;
}
function drawPoint(ctx, p, color) {
    if (color === void 0) { color = '#fff'; }
    ctx.fillStyle = color;
    ctx.fillRect(p.x, p.y, 1, 1);
}
var Snake = (function () {
    function Snake(pos) {
        var _this = this;
        this.pos = pos;
        this.tail = [];
        this.size = 10;
        // TODO: fix leak
        document.addEventListener('keydown', function (e) {
            var k = e.keyCode;
            var x = 0, y = 0;
            if (k === 37) {
                x = -1;
            }
            else if (k == 38) {
                y = -1;
            }
            else if (k === 39) {
                x = 1;
            }
            else if (k === 40) {
                y = 1;
            }
            else if (k === 32) {
                _this.dir = null;
                return;
            }
            else {
                return;
            }
            // Can't move on itself
            if (_this.dir != null && (_this.dir.x && x || _this.dir.y && y)) {
                return;
            }
            _this.dir = { x: x, y: y };
            _this.nextDir = _this.nextDir || _this.dir;
        });
    }
    Object.defineProperty(Snake.prototype, "points", {
        get: function () {
            return [this.pos].concat(this.tail);
        },
        enumerable: true,
        configurable: true
    });
    Snake.prototype.move = function () {
        if (!this.dir) {
            return;
        }
        var dir = this.nextDir || this.dir;
        this.nextDir = null;
        // tail
        this.tail.unshift(this.pos);
        this.tail = this.tail.slice(0, this.size);
        this.pos = {
            x: this.pos.x + dir.x,
            y: this.pos.y + dir.y,
        };
    };
    Snake.prototype.draw = function (ctx) {
        var color = 255;
        this.points.forEach(function (p) {
            var c = Math.round(color);
            drawPoint(ctx, p, "rgb(" + c + "," + c + "," + c + ")");
            color *= 0.999;
        });
    };
    return Snake;
}());
function SnakeGame() {
    var scale = 15;
    var w = 40;
    var h = 30;
    var snake;
    var food = [];
    var running = false;
    var step; //ms
    var enablePortal = true;
    function createFood() {
        // TODO: optimize
        var _loop_1 = function() {
            var f = {
                x: Math.floor(Math.random() * w),
                y: Math.floor(Math.random() * h),
            };
            if (!snake.points.some(function (p) { return pointsEq(p, f); })) {
                return { value: f };
            }
        };
        for (;;) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object") return state_1.value;
        }
    }
    // Create the canvas
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = w * scale;
    canvas.height = h * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    newGame();
    var accumulator = 0;
    function loop(time) {
        accumulator = accumulator || time;
        while (accumulator <= time) {
            update();
            accumulator += step;
        }
        draw();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    function update() {
        if (!running) {
            return;
        }
        snake.move();
        // portal
        if (enablePortal) {
            snake.pos.x = (snake.pos.x + w) % w;
            snake.pos.y = (snake.pos.y + h) % h;
        }
        // check if lost
        if (snake.tail.some(function (p) { return pointsEq(p, snake.pos); }) ||
            snake.pos.x !== (snake.pos.x + w) % w ||
            snake.pos.y !== (snake.pos.y + h) % h) {
            gameOver();
        }
        // food
        var eaten = food.filter(function (f) { return pointsEq(snake.pos, f); });
        eaten.forEach(function (f) {
            delete food[food.indexOf(f)];
            food.push(createFood());
            snake.size += 3;
            step = step * 0.999; // Speed-up game
        });
    }
    function gameOver() {
        newGame();
    }
    function newGame() {
        snake = new Snake({ x: w / 2, y: h / 2 });
        food = [createFood(), createFood()];
        step = 100;
        running = true;
    }
    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        snake.draw(ctx);
        food.forEach(function (f) { return drawPoint(ctx, f, '#09f'); });
    }
}
SnakeGame();
