window.requestFrame = (function () {
    return window.requestAnimationFrame     || 
        window.webkitRequestAnimationFrame  || 
        window.mozRequestAnimationFrame     || 
        window.oRequestAnimationFrame       || 
        window.msRequestAnimationFrame      || 
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

Config = {
    GRID_SIZE : 20,
};
Config.HEIGHT = 600 / Config.GRID_SIZE;
Config.WIDTH = 800 / Config.GRID_SIZE;

Game = function (canvas_id) {
    this.canvas_element = document.getElementById(canvas_id);
    this.canvas = this.canvas_element.getContext('2d');
    this.canvas_element.onmousemove = Game.onMouseMoveListener;
    this.canvas_element.onclick = Game.onClickListener;
    this.monsters = [];
    this.tiles = [];
    this.towers = [];
    this.bullets = [];
    this.counter = 0;
};

Game.prototype.loop = function () {
    window.requestFrame(window.game.loop);
    window.game.doLoop();
};

Game.prototype.doLoop = function () {
    for (m in this.monsters)
    {
        this.monsters[m].move();
    }
    for (t in this.towers)
    {
        this.towers[t].attack();
    }
    this.draw();
    if (this.counter > 30)
    {
        this.spawnMonster(Monster.RED);
        this.counter = 0;
    }
    this.counter++;
};

Game.prototype.addTower = function () {
    for (t in this.tiles)
    {
        tile = this.tiles[t];
        if (tile.frame)
        {
            if (tower = this.getTowerAt(tile.x, tile.y))
            {
                tower.upgrade();
                return;
            }
            this.buildTower(tile.x, tile.y, Tower.BLUE);
            return;
        }
    }
};

Game.prototype.getTileAt = function (x, y)
{
    for (i in this.tiles)
    {
        tile = this.tiles[i];
        if (tile.x == x && tile.y == y)
        {
            return tile;
        }
    }
    return false;
};

Game.prototype.getTowerAt = function (x, y)
{
    x *= Config.GRID_SIZE;
    y *= Config.GRID_SIZE;
    for (t in this.towers)
    {
        tower = this.towers[t];
        if (tower.x == x && tower.y == y)
        {
            return tower;
        }
    }
    return false;
};

Game.prototype.run = function () {
    this.loadLevel(Level);
    this.draw();
    this.loop();
};

Game.prototype.loadLevel = function (level) {
    this.tiles = [];
    for (x = 0; x < Config.WIDTH; x++)
    {
        for (y = 0; y < Config.HEIGHT; y++)
        {
            this.tiles.push(new Tile(x, y, Tile.EMPTY, this));
        }
    }
    this.level = level;
    for (l in this.level.tiles)
    {
        tile = this.level.tiles[l];
        this.getTileAt(tile[0], tile[1]).type = Tile.ROAD;
    }
};

Game.prototype.spawnMonster = function (type) {
    monster = new Monster(this.level.start.x, this.level.start.y, type, this);
    this.monsters.push(monster);
    monster.draw();
};

Game.prototype.buildTower = function (x, y, type) {
    if (this.getTileAt(x, y).type == Tile.ROAD)
    {
        return;
    }
    tower = new Tower(x, y, type, this);
    this.towers.push(tower);
    tower.draw();
};

Game.prototype.frame = function (tile) {
    for (t in this.tiles)
    {
        this.tiles[t].frame = false;
        if (this.tiles[t].is(tile))
        {
            this.tiles[t].frame = true;
        }
    }
};

Game.prototype.draw = function () {
    for (i in this.tiles)
    {
        this.tiles[i].draw();
    }
    for (t in this.towers)
    {
        this.towers[t].draw();
    }
    for (m in this.monsters)
    {
        this.monsters[m].draw();
    }
    for (b in this.bullets)
    {
        this.bullets[b].draw();
    }
};

Game.init = function () {
    window.game = new Game('game');
    window.game.run();
};

Game.onClickListener = function (e) {
    window.game.addTower();
};

Game.onMouseMoveListener = function (e) {
    var event = e || window.event,
        tile = window.game.getTileAt(
            Math.floor(event.offsetX / window.Config.GRID_SIZE),
            Math.floor(event.offsetY / window.Config.GRID_SIZE)
        );
    if (tile !== false)
    {
        tile.game.frame(tile);
    }
};

Tower = function (x, y, type, game) {
    this.x = x * Config.GRID_SIZE;
    this.y = y * Config.GRID_SIZE;
    this.type = type;
    this.game = game;
    this.level = 1;
    this.can_fire = true;
    this.reloaded = 0;
    this.xp = 0;
};

Tower.prototype.getCenter = function () {
    return {
        x : this.x + 0.5 * Config.GRID_SIZE,
        y : this.y + 0.5 * Config.GRID_SIZE
    };
};

Bullet = function (tower, monster, game) {
    this.tower = tower;
    this.monster = monster;
    this.game = game;
    this.fade = 10;
    this.removed = false;
};

Bullet.prototype.remove = function () {
    this.removed = true;
};

Bullet.prototype.draw = function () {
    if (this.removed)
    {
        return;
    }
    tower_center = this.tower.getCenter();
    monster_center = this.monster.getCenter();
    this.game.canvas.beginPath();
    this.game.canvas.strokeStyle = 'white';
    this.game.canvas.moveTo(tower_center.x, tower_center.y);
    this.game.canvas.lineTo(monster_center.x, monster_center.y);
    this.game.canvas.globalAlpha = this.fade / 10;
    this.game.canvas.stroke();
    this.game.canvas.globalAlpha = 1;
    this.fade--;
    if (this.fade == 0)
    {
        this.remove();
    }
};

Tower.prototype.draw = function () {
    this.game.canvas.fillStyle = this.getLevel().color;
    this.game.canvas.fillRect(this.x + 4, this.y + 4, Config.GRID_SIZE - 8, Config.GRID_SIZE - 8);
};

Tower.prototype.getLevel = function () {
    return Towers[this.type][this.level];
};

Tower.prototype.fireAt = function (monster)
{
    bullet = new Bullet(this, monster, this.game);
    this.game.bullets.push(bullet);
    damage = this.getLevel().damage;
    if (monster.life > damage)
    {
        monster.life -= damage;
        this.xp += damage;
    }
    else
    {
        monster.die()
        this.xp += monster.life;
    }
};

Tower.prototype.upgrade = function () {
    if (Towers[this.type][this.level + 1])
    {
        this.level++;
    }
};

Tower.prototype.attack = function () {
    if (this.reloaded < 30)
    {
        this.reloaded++;
        return;
    }
    monsters = this.game.monsters;
    monsters.sort(function(a, b) {
        if (a.distance == b.distance)
        {
            return 0;
        }
        return a.distance < b.distance ? 1 : -1;
    });
    for (m in this.game.monsters)
    {
        monster = monsters[m];
        if (monster.isAlive() && this.distanceTo(monster) < this.getLevel().range)
        {
            this.fireAt(monster);
            this.reloaded = 0;
            break;
        }
    }

};

Tower.prototype.distanceTo = function (monster) {
    monster_center = monster.getCenter();
    tower_center = this.getCenter();
    dx = Math.abs(monster_center.x - tower_center.x);
    dy = Math.abs(monster_center.y - tower_center.y);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};

Monster = function (x, y, type, game) {
    this.x = x * Config.GRID_SIZE;
    this.y = y * Config.GRID_SIZE;
    this.type = type;
    this.game = game;
    this.current_tile = game.getTileAt(x, y);
    this.visited_tiles = [this.current_tile];
    this.is_dead = false;    
    this.life = 50;
    this.distance = 0;
};

Monster.prototype.die = function () {
    this.is_dead = true;
};

Monster.prototype.isAlive = function () {
    return this.is_dead == false;
};

Monster.prototype.move = function () {
    next_tile = this.getNextTile();
    if (this.is_dead)
    {
        return;
    }
    current_tile = this.current_tile;
    dx = next_tile.x - current_tile.x == 0 ? 0 : (next_tile.x - current_tile.x) / Math.abs(next_tile.x - current_tile.x);
    dy = next_tile.y - current_tile.y == 0 ? 0 : (next_tile.y - current_tile.y) / Math.abs(next_tile.y - current_tile.y);
    this.x += dx;
    this.y += dy;
    this.distance += Math.abs(dx) + Math.abs(dy);
    if (this.type == Monster.RED)
    {
        this.x += dx;
        this.y += dy;
        this.distance += Math.abs(dx) + Math.abs(dy);
    }
    if (this.x == next_tile.x * Config.GRID_SIZE && this.y == next_tile.y * Config.GRID_SIZE)
    {
        this.visited_tiles.push(this.current_tile);
        this.current_tile = next_tile;
    }
};

Monster.prototype.hasVisited = function (tile) {
    for (t in this.visited_tiles)
    {
        visited_tile = this.visited_tiles[t];
        if (tile.is(visited_tile))
        {
            return true;
        }
    }
    return false;
};

Monster.prototype.getNextTile = function () {
    tiles = this.getTiles();
    for (t in tiles)
    {
        tile = tiles[t];
        if (tile !== false && tile.type == Tile.ROAD)
        {
            if ( ! this.hasVisited(tile))
            {
                return tile;
            }
        }
    }
    this.die();
};

Monster.prototype.getPreviousTile = function () {
    tiles = this.getTiles();
    for (t in tiles)
    {
        tile = tiles[t];
        if (tile !== false && tile.type == Tile.ROAD)
        {
            if (this.hasVisited(tile) && ! tile.is(this.current_tile))
            {
                return tile;
            }
        }
    }
};

Monster.prototype.getTiles = function () {
    return [
        this.game.getTileAt(this.current_tile.x - 1, this.current_tile.y),
        this.game.getTileAt(this.current_tile.x + 1, this.current_tile.y),
        this.game.getTileAt(this.current_tile.x, this.current_tile.y + 1),
        this.game.getTileAt(this.current_tile.x, this.current_tile.y - 1)
    ];
};

Monster.prototype.getCenter = function () {
    return {
        x : this.x + Config.GRID_SIZE * 0.5,
        y : this.y + Config.GRID_SIZE * 0.5
    };
};

Monster.prototype.draw = function () {
    if (this.is_dead)
    {
        return;
    }
    switch (this.type)
    {
        case Monster.GREEN:
            this.game.canvas.fillStyle = 'green';
            break;
        case Monster.RED:
            this.game.canvas.fillStyle = 'red';
            break;
    }
    this.game.canvas.fillRect(this.x + 5, this.y + 5, Config.GRID_SIZE - 10, Config.GRID_SIZE - 10);
    this.game.canvas.fillStyle = 'black';
    this.game.canvas.font = '10px Arial';
    this.game.canvas.fillText(this.life, this.x + 4, this.y);
};

Tile = function (x, y, type, game) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.game = game;
    this.frame = false;
};

Tile.prototype.getCenter = function () {
    return {
        x : (this.x + 0.5) * Config.GRID_SIZE,
        y : (this.y + 0.5) * Config.GIRD_SIZE
    };
};

Tile.prototype.is = function (tile) {
    return this.x == tile.x && this.y == tile.y;
};

Tile.prototype.draw = function () {
    switch (this.type)
    {
        case Tile.ROAD:
            this.game.canvas.fillStyle = '#888888';
            break;
        case Tile.EMPTY:
            this.game.canvas.fillStyle = '#cccccc';
            break;
    }
    this.game.canvas.fillRect(this.x * Config.GRID_SIZE, this.y * Config.GRID_SIZE, Config.GRID_SIZE, Config.GRID_SIZE);
    if (this.frame)
    {
        this.game.canvas.fillStyle = 'rgba(255, 125, 0, 0.5)';
        this.game.canvas.fillRect(this.x * Config.GRID_SIZE, this.y * Config.GRID_SIZE, Config.GRID_SIZE, Config.GRID_SIZE);
    }
};

Tile.ROAD = 'road';
Tile.EMPTY = 'empty';

Monster.GREEN = 'green';
Monster.RED = 'red';

Tower.BLUE = 'blue';

Towers = {};
Towers[Tower.BLUE] = {
    1 : {
        damage : 20,
        range : 100,
        color : '#37C5DB'
    },
    2 : {
        damage : 30,
        range : 110,
        color : '#3770DB'
    },
    3 : {
        damage : 40,
        range : 120,
        color : '#3F37DB'
    }
}
Level = {
    start : {
        x : 1,
        y : 0
    },
    end : {
        x : 39,
        y : 1,
    },
    tiles : [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
        [1, 7],
        [1, 8],
        [1, 9],
        [1, 10],
        [1, 11],
        [2, 11],
        [3, 11],
        [3, 10],
        [3, 9],
        [3, 8],
        [3, 7],
        [3, 6],
        [3, 5],
        [3, 4],
        [3, 3],
        [3, 2],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
        [8, 1],
        [9, 1],
        [10, 1],
        [11, 1],
        [12, 1],
        [13, 1],
        [14, 1],
        [15, 1],
        [16, 1],
        [17, 1],
        [18, 1],
        [19, 1],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 1],
        [24, 1],
        [25, 1],
        [26, 1],
        [27, 1],
        [28, 1],
        [29, 1],
        [30, 1],
        [31, 1],
        [32, 1],
        [33, 1],
        [34, 1],
        [35, 1],
        [36, 1],
        [37, 1],
        [38, 1],
        [39, 1]
    ]
};
