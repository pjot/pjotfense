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
    WAVE_COUNT : 60 * 30
};
Config.HEIGHT = 600 / Config.GRID_SIZE;
Config.WIDTH = 800 / Config.GRID_SIZE;

Game = function (canvas_id) {
    this.canvas_element = document.getElementById(canvas_id);
    this.canvas = this.canvas_element.getContext('2d');
    this.canvas_element.onmousemove = Game.onMouseMoveListener;
    this.canvas_element.onclick = Game.onClickListener;
    window.onkeydown = Game.onKeyDownListener;
    this.monsters = [];
    this.tiles = [];
    this.towers = [];
    this.bullets = [];
    this.counter = 0;
    this.monster_id = 0;
    this.bullet_id = 0;
    this.lives = 20;
    this.spawn = 0;
    this.current_level = 0;
    this.framed = false;
    this.coins = 200;
    this.wave_counter = Config.WAVE_COUNT;
    this.building = false;
};

Game.prototype.loop = function () {
    window.requestFrame(window.game.loop);
    window.game.doLoop();
};

Game.prototype.doLoop = function () {
    this.waveCounter();
    for (m in this.monsters)
    {
        this.monsters[m].move();
    }
    for (t in this.towers)
    {
        this.towers[t].attack();
    }
    this.draw();
    if (this.counter > 30 && this.spawn > 0)
    {
        r = Math.random();
        if (r > 0.66)
        {
            this.spawnMonster(Monster.RED, Math.round(40 * this.current_level));
        }
        if (r < 0.33)
        {
            this.spawnMonster(Monster.YELLOW, Math.round(120 * this.current_level));
        }
        else
        {
            this.spawnMonster(Monster.GREEN, Math.round(70 * this.current_level));
        }
        this.spawn--;
        this.counter = 0;
    }
    this.counter++;
};

Game.prototype.makeWave = function () {
    this.current_level++;
    this.spawn = 20;
    this.wave_counter = Config.WAVE_COUNT;
};

Game.prototype.clickTile = function () {
    if (this.framed)
    {
        if (this.framed.x == Config.WIDTH - 1 && this.framed.y == 0 && this.spawn == 0)
        {
            this.makeWave();
            return;
        }
        if (tower = this.getTowerAt(this.framed.x, this.framed.y))
        {
            tower.upgrade();
            return;
        }
        if (this.building)
        {
            this.buildTower(this.framed.x, this.framed.y, this.building);
        }
        return;
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

Game.prototype.spawnMonster = function (type, life) {
    monster = new Monster(this.level.start.x, this.level.start.y, type, life, this);
    this.monsters.push(monster);
    monster.draw();
};

Game.prototype.buildTower = function (x, y, type) {
    if (this.getTileAt(x, y).type == Tile.ROAD)
    {
        return;
    }
    if (this.coins >= Towers[type][1].cost)
    {
        tower = new Tower(x, y, type, this);
        this.towers.push(tower);
        this.coins -= Towers[type][1].cost;
    }
};

Game.prototype.frame = function (tile) {
    this.framed = tile;
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
    if (this.framed)
    {
        if (framed_tower = this.getTowerAt(this.framed.x, this.framed.y))
        {
            framed_tower.drawRange();
            framed_tower.drawInfo();
        }
        else
        {
            this.framed.drawFrame();
        }
    }
    if (this.spawn == 0)
    {
        this.canvas.fillStyle = 'black';
    }
    else
    {
        this.canvas.fillStyle = 'red';
    }
    this.canvas.font = '12px Arial';
    this.canvas.fillText(Math.ceil(this.wave_counter / 60), Config.WIDTH * Config.GRID_SIZE - 18, 15);

    this.canvas.fillStyle = 'black';
    this.canvas.fillText('$' + this.coins, Config.WIDTH * Config.GRID_SIZE - 150, 15);
};

Game.prototype.waveCounter = function () {
    this.wave_counter--;
    if (this.wave_counter == 0)
    {
        this.makeWave();
    }
};

Game.init = function () {
    window.game = new Game('game');
    window.game.run();
};

Game.onClickListener = function (e) {
    window.game.clickTile();
};

Game.onKeyDownListener = function (e) {
    window.game.keyDown(e);
};

Game.prototype.keyDown = function (e) {
    switch (e.keyCode)
    {
        case 65: // A
            this.building = Tower.BLACK;
            break;
        case 83: // S
            this.building = Tower.BLUE;
            break;
        case 68: // D
            this.building = Tower.YELLOW;
            break;
        case 27: // Esc
            this.building = false;
            break;
    }
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

Bullet = function (tower, monster, game, damage, type) {
    this.tower = tower;
    this.monster = monster;
    this.game = game;
    this.damage = damage;
    this.type = type;
    this.fade = Bullets[this.type].fade;
    this.draw = Bullets[this.type].draw;
    this.x = this.tower.getCenter().x;
    this.y = this.tower.getCenter().y;
    this.id = ++game.bullet_id;
    switch (this.type)
    {
        case Bullet.LASER:
            if (this.monster.life > this.damage)
            {
                this.monster.life -= this.damage;
                this.monster.show_life = 60;
                this.tower.xp += this.damage;
            }
            else
            {
                this.damage = this.monster.life;
                this.tower.xp += this.monster.life;
                this.monster.die()
            }
        break;
        case Bullet.AREA:
            for (m in this.game.monsters)
            {
                monster = this.game.monsters[m];
                if (this.tower.distanceTo(monster) < this.tower.getLevel().range)
                {
                    if (monster.life > this.damage)
                    {
                        monster.life -= this.damage;
                        monster.show_life = 60;
                        this.tower.xp += this.damage;
                    }
                    else
                    {
                        this.damage = monster.life;
                        this.tower.xp += monster.life;
                        monster.die()
                    }
                }
            }
        break;
    }
};

Bullet.prototype.distanceLeft = function () {
    monster_center = this.monster.getCenter();
    dx = Math.abs(monster_center.x - this.x);
    dy = Math.abs(monster_center.y - this.y);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};

Bullet.prototype.is = function (bullet) {
    return this.id == bullet.id;
};

Bullet.prototype.remove = function () {
    for (b in this.game.bullets)
    {
        bullet = this.game.bullets[b];
        if (this.is(bullet))
        {
            this.game.bullets.splice(b, 1);
            return;
        }
    }
};


Bullet.prototype.done = function () {
};

Tower.prototype.draw = function () {
    Tower.drawAt(this.game.canvas, this.getLevel().color, this.x, this.y);
    next_level = this.getNextLevel();
    if (next_level && this.xp > next_level.xp)
    {
        this.game.canvas.strokeStyle = this.game.coins >= next_level.cost ? 'green' : 'red';
        this.game.canvas.beginPath();
        this.game.canvas.rect(this.x + 3.5, this.y + 3.5, Config.GRID_SIZE - 6, Config.GRID_SIZE - 6);
        this.game.canvas.stroke();
        this.game.canvas.beginPath();
        this.game.canvas.rect(this.x + 4.5, this.y + 4.5, Config.GRID_SIZE - 8, Config.GRID_SIZE - 8);
        this.game.canvas.stroke();
    }
};

Tower.prototype.drawRange = function () {
    this.game.canvas.globalAlpha = 0.7;
    center = this.getCenter();
    this.game.canvas.beginPath();
    this.game.canvas.arc(
        center.x,
        center.y,
        this.getLevel().range,
        2 * Math.PI,
        false
    );
    this.game.canvas.strokeStyle = 'black';
    this.game.canvas.stroke();
    this.game.canvas.globalAlpha = 1;
};

Tower.prototype.drawInfo = function () {
    this.game.canvas.globalAlpha = 0.7;
    center = this.getCenter();
    this.game.canvas.fillStyle = 'white';
    this.game.canvas.fillRect(center.x + 10, center.y - 20, 120, 100);
    this.game.canvas.globalAlpha = 1;

    this.game.canvas.fillStyle = 'black';
    this.game.canvas.font = '12px Arial';
    level = this.getLevel();
    next_level = this.getNextLevel();

    stats = level.range + ', ' + level.damage + ', ' + level.beams;
    this.game.canvas.fillText(stats, center.x + 15, center.y - 10);

    xp = 'XP: ' + this.xp;
    this.game.canvas.fillText(xp, center.x + 15, center.y + 2);
    if (next_level)
    {
        next = 'Next level: ' + next_level.xp + ', $' + next_level.cost;
        this.game.canvas.fillText(next, center.x + 15, center.y + 14);
    }



};

Tower.drawAt = function (canvas, color, x, y) {
    canvas.fillStyle = color;
    canvas.fillRect(x + 4, y + 4, Config.GRID_SIZE - 8, Config.GRID_SIZE - 8);
};

Tower.prototype.getLevel = function () {
    return Towers[this.type][this.level];
};

Tower.prototype.fireAt = function (monster)
{
    level = this.getLevel();
    bullet = new Bullet(this, monster, this.game, level.damage, level.bullet);
    this.game.bullets.push(bullet);
};

Tower.prototype.getNextLevel = function () {
    return Towers[this.type][this.level + 1];
};

Tower.prototype.upgrade = function () {
    next_level = this.getNextLevel();
    if (next_level)
    {
        if (this.game.coins > next_level.cost && this.xp > next_level.xp)
        {
            this.game.coins -= next_level.cost; 
            this.level++;
        }
    }
};

Tower.prototype.attack = function () {
    if (this.reloaded < this.getLevel().reload)
    {
        this.reloaded++;
        return;
    }
    fire_monsters = []
    for (m in this.game.monsters)
    {
        monster = this.game.monsters[m];
        if (this.distanceTo(monster) < this.getLevel().range)
        {
            fire_monsters.push(monster);
        }
    }
    fire_monsters.sort(function (a, b) {
        if (a.distance == b.distance)
        {
            return 0;
        }
        return a.distance > b.distance ? 1 : -1;
    });
    beams = this.getLevel().beams;
    while (beams > 0)
    {
        if (fire_monsters.length > 0)
        {
            this.fireAt(fire_monsters.pop());
            this.reloaded = 0;
        }
        beams--;
    }
};

Tower.prototype.distanceTo = function (monster) {
    monster_center = monster.getCenter();
    tower_center = this.getCenter();
    dx = Math.abs(monster_center.x - tower_center.x);
    dy = Math.abs(monster_center.y - tower_center.y);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};

Monster = function (x, y, type, life, game) {
    this.x = x * Config.GRID_SIZE;
    this.y = y * Config.GRID_SIZE;
    this.type = type;
    this.game = game;
    this.current_tile = game.getTileAt(x, y);
    this.visited_tiles = [this.current_tile];
    this.life = life;
    this.original_life = life;
    this.distance = 0;
    this.id = ++game.monster_id;
    this.show_life = 0;
};

Monster.prototype.is = function (monster) {
    return this.id == monster.id;
};

Monster.prototype.die = function () {
    this.life = 0;
    for (m in this.game.monsters)
    {
        monster = this.game.monsters[m];
        if (this.is(monster))
        {
            this.game.monsters.splice(m, 1);
            this.game.coins += Math.floor(this.original_life / 20)
            return;
        }
    }
};

Monster.prototype.move = function () {
    next_tile = this.getNextTile();
    if ( ! next_tile)
    {
        this.die();
        game.lives--;
        return;
    }
    current_tile = this.current_tile;
    dx = next_tile.x - current_tile.x == 0 ? 0 : (next_tile.x - current_tile.x) / Math.abs(next_tile.x - current_tile.x);
    dy = next_tile.y - current_tile.y == 0 ? 0 : (next_tile.y - current_tile.y) / Math.abs(next_tile.y - current_tile.y);
    dx *= this.getDefault().speed;
    dy *= this.getDefault().speed;
    this.x += dx;
    this.y += dy;
    this.distance += Math.abs(dx) + Math.abs(dy);
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
    this.game.canvas.fillStyle = this.getDefault().color;
    this.game.canvas.fillRect(this.x + 5, this.y + 5, Config.GRID_SIZE - 10, Config.GRID_SIZE - 10);

    this.game.canvas.globalAlpha = this.show_life / 20;

    this.game.canvas.fillStyle = 'red';
    this.game.canvas.fillRect(this.x + 2, this.y - 2, Config.GRID_SIZE - 4, 4);

    this.game.canvas.fillStyle = 'green';
    this.game.canvas.fillRect(this.x + 2, this.y - 2, Math.ceil((this.life / this.original_life) * (Config.GRID_SIZE - 4)), 4);

    this.game.canvas.globalAlpha = 1;
    if (this.show_life != 0)
    {
        this.show_life--;
    }
};

Monster.prototype.getDefault = function () {
    return Monsters[this.type];
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
    if (this.frame && this.game.building)
    {
    }
};

Tile.prototype.drawFrame = function () {
    if ( ! this.game.building)
    {
        return;
    }
    if (this.type == Tile.EMPTY)
    {
        this.game.canvas.globalAlpha = 0.7;
    }
    else
    {
        this.game.canvas.globalAlpha = 0.3;
    }
    Tower.drawAt(this.game.canvas, Towers[this.game.building][1].color, this.x * Config.GRID_SIZE, this.y * Config.GRID_SIZE);
    this.game.canvas.beginPath();
    this.game.canvas.arc(
        this.x * Config.GRID_SIZE + Config.GRID_SIZE / 2,
        this.y * Config.GRID_SIZE + Config.GRID_SIZE / 2,
        Towers[this.game.building][1].range,
        2 * Math.PI,
        false
    );
    this.game.canvas.strokeStyle = 'black';
    this.game.canvas.stroke();
    this.game.canvas.globalAlpha = 1;
};

Tile.ROAD = 'road';
Tile.EMPTY = 'empty';

Monster.GREEN = 'green';
Monster.RED = 'red';
Monster.YELLOW = 'yellow';

Tower.BLUE = 'blue';
Tower.BLACK = 'black';
Tower.YELLOW = 'yellow';

Monsters = {};
Monsters[Monster.GREEN] = {
    speed : 1,
    color : 'green'
};

Monsters[Monster.RED] = {
    speed : 2,
    color : 'red'
};

Monsters[Monster.YELLOW] = {
    speed : 0.5,
    color : 'yellow'
};

Bullets = {};

Bullet.LASER = 'laser';
Bullet.ROCKET = 'rocket';
Bullet.AREA = 'area';
Bullets[Bullet.LASER] = {
    speed : 0,
    fade : 15,
    draw : function () {
        tower_center = this.tower.getCenter();
        monster_center = this.monster.getCenter();
        this.game.canvas.beginPath();
        this.game.canvas.strokeStyle = 'red';
        this.game.canvas.moveTo(tower_center.x, tower_center.y);
        this.game.canvas.lineTo(monster_center.x, monster_center.y);
        this.game.canvas.globalAlpha = this.fade / Bullets[Bullet.LASER].fade;
        this.game.canvas.stroke();
        this.game.canvas.globalAlpha = 1;
        this.fade--;
        if (this.fade == 0)
        {
            this.remove();
        }
    },
};

Bullets[Bullet.AREA] = {
    speed : 0,
    fade : 20,
    draw : function () {
        tower_center = this.tower.getCenter();
        this.game.canvas.beginPath();
        this.game.canvas.fillStyle = 'yellow';
        this.game.canvas.arc(tower_center.x, tower_center.y, this.tower.getLevel().range, Math.PI * 2, false);
        this.game.canvas.globalAlpha = 0.2 * this.fade / Bullets[Bullet.AREA].fade;
        this.game.canvas.fill();
        this.game.canvas.globalAlpha = 1;
        this.fade--;
        if (this.fade == 0)
        {
            this.remove();
        }
    }
};

Bullets[Bullet.ROCKET] = {
    speed : 4,
    draw : function () {
        if (this.monster.life == 0)
        {
            fire_monsters = []
            for (m in this.game.monsters)
            {
                fire_monsters.push(this.game.monsters[m]);
            }
            fire_monsters.sort(function (a, b) {
                if (a.distance == b.distance)
                {
                    return 0;
                }
                return a.distance > b.distance ? 1 : -1;
            });
            if (fire_monsters.length > 0)
            {
                this.monster = fire_monsters.pop();
            }
            else
            {
                this.remove();
            }
            return;
        }
        if (this.distanceLeft() < Bullets[Bullet.ROCKET].speed)
        {
            if (this.monster.life > this.damage)
            {
                this.monster.life -= this.damage;
                this.monster.show_life = 60;
                this.tower.xp += this.damage;
            }
            else
            {
                this.damage = this.monster.life;
                this.tower.xp += this.monster.life;
                this.monster.die()
            }
            this.remove();
        }
        distance_left = this.distanceLeft();
        monster_center = this.monster.getCenter();
        this.x = this.x + (monster_center.x - this.x) * (Bullets[Bullet.ROCKET].speed / distance_left);
        this.y = this.y + (monster_center.y - this.y) * (Bullets[Bullet.ROCKET].speed / distance_left);

        if (this.distanceLeft() < Bullets[Bullet.ROCKET].speed)
        {
            if (this.monster.life > this.damage)
            {
                this.monster.life -= this.damage;
                this.monster.show_life = 60;
                this.tower.xp += this.damage;
            }
            else
            {
                this.damage = this.monster.life;
                this.tower.xp += this.monster.life;
                this.monster.die()
            }
            this.remove();
        }
        this.game.canvas.beginPath();
        this.game.canvas.fillStyle = 'white';
        this.game.canvas.arc(this.x, this.y, 2, 2 * Math.PI, false);
        this.game.canvas.fill();
    }
};

Towers = {};

Towers[Tower.YELLOW] = {
    1 : {
        cost : 100,
        damage : 20,
        beams : 1,
        range : 80,
        reload : 60,
        bullet : Bullet.AREA,
        color : 'yellow'
    },
    2 : {
        cost : 100,
        damage : 40,
        beams : 1,
        range : 120,
        reload : 40,
        bullet : Bullet.AREA,
        color : 'yellow',
        xp : 200,
    },
};

Towers[Tower.BLUE] = {
    1 : {
        cost : 70,
        damage : 20,
        beams : 1,
        range : 100,
        reload : 30,
        bullet : Bullet.ROCKET,
        color : '#37C5DB'
    },
    2 : {
        cost : 100,
        damage : 30,
        beams : 1,
        range : 110,
        reload : 20,
        xp : 100,
        bullet : Bullet.ROCKET,
        color : '#3770DB'
    },
    3 : {
        cost : 200,
        damage : 40,
        beams : 1,
        range : 120,
        reload : 10,
        xp : 250,
        bullet : Bullet.ROCKET,
        color : '#3F37DB'
    },
    4 : {
        cost : 300,
        damage : 80,
        beams : 1,
        range : 300,
        reload : 10,
        xp : 600,
        bullet : Bullet.ROCKET,
        color : 'blue'
    }
};

Towers[Tower.BLACK] = {
    1 : {
        cost : 30,
        damage : 2,
        range : 50,
        beams : 1,
        reload : 5,
        bullet : Bullet.LASER,
        color : 'black'
    },
    2 : {
        cost : 50,
        damage : 2,
        range : 100,
        beams : 2,
        xp : 40,
        reload : 5,
        bullet : Bullet.LASER,
        color : 'black'
    },
    3 : {
        cost : 100,
        damage : 2,
        range : 200,
        beams : 3,
        xp : 100,
        reload : 5,
        bullet : Bullet.LASER,
        color : 'black'
    }
};

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
