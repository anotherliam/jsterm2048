"use strict";
const shuffle = require("lodash/shuffle");
const keypress = require("keypress");
function clear() {
    process.stdout.write('\x1b[2J');
}
keypress(process.stdin);
if (!process.stdin.setRawMode)
    process.exit();
else
    process.stdin.setRawMode(true);
const debug = false;
class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        const board = [];
        for (let x = 0; x < width; x++) {
            board.push((new Array(height)).fill(null));
        }
        this.tiles = board;
    }
}
;
;
class TileFactory {
    constructor() {
        this.lastId = -1;
    }
    generate(value) {
        this.lastId += 1;
        return {
            value,
            id: this.lastId
        };
    }
}
const waitForKey = () => new Promise((res, rej) => {
    process.stdin.once("keypress", (ch, key) => {
        if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            process.exit();
        }
        res(key);
    });
    process.stdin.resume();
});
class Game {
    constructor() {
        // Board is top left indexed 0,0 (x,y)
        // Board is array of columns which is an array of rows
        this.board = new Board(4, 4);
        this.tileFactory = new TileFactory();
        this.points = 0;
    }
    getAllEmptySpaces() {
        const result = [];
        this.board.tiles.forEach((col, colIdx) => {
            col.forEach((row, rowIdx) => {
                if (!row)
                    result.push({ x: rowIdx, y: colIdx });
            });
        });
        return result;
    }
    getTile({ x, y }) {
        return this.board.tiles[y][x] || null;
    }
    setTile({ x, y }, tile) {
        this.board.tiles[y][x] = tile;
        debug && console.log(`Setting tile ${tile} at `, { x, y });
    }
    prettyPrint() {
        clear();
        const pretty = this.board.tiles.map((row) => row.map((item) => item === null ? "[ ]" : `[${item.value}]`).join("|")).join("\n");
        console.log(`--- (Score: ${this.points}) ---`);
        console.log(pretty);
    }
    move(direction) {
        // Moves the board in the given direction
        let primaryKey = "y";
        let primaryStart = 1;
        let primaryEnd = (v) => v < this.board.height - 1;
        let primaryInc = 1;
        let secondaryKey = "x";
        let secondaryMax = this.board.width - 1;
        let shiftDir = -1;
        switch (direction) {
            case "up":
                primaryKey = "y";
                primaryStart = 1;
                primaryEnd = (v) => v <= this.board.height - 1;
                primaryInc = 1;
                secondaryMax = this.board.width - 1;
                shiftDir = -1;
                break;
            case "down":
                primaryKey = "y";
                primaryStart = this.board.height - 2;
                primaryEnd = (v) => v >= 0;
                primaryInc = -1;
                secondaryMax = this.board.width - 1;
                shiftDir = 1;
                break;
            case "left":
                primaryKey = "x";
                primaryStart = 1;
                primaryEnd = (v) => v <= this.board.width - 1;
                primaryInc = 1;
                secondaryMax = this.board.height - 1;
                shiftDir = -1;
                break;
            case "right":
                primaryKey = "x";
                primaryStart = this.board.width - 2;
                primaryEnd = (v) => v >= 0;
                primaryInc = -1;
                secondaryMax = this.board.height - 1;
                shiftDir = 1;
                break;
        }
        for (let i = primaryStart; primaryEnd(i); i += primaryInc) {
            for (let j = 0; j <= secondaryMax; j++) {
                const x = (primaryKey === "x") ? i : j;
                const y = (primaryKey === "x") ? j : i;
                const thisVector = { x, y };
                const node = this.getTile(thisVector);
                if (node) {
                    const shiftedVector = { ...thisVector };
                    shiftedVector[primaryKey] += shiftDir;
                    const toNode = this.getTile(shiftedVector);
                    if (!toNode) {
                        this.setTile(shiftedVector, node);
                        this.setTile(thisVector, null);
                    }
                    else {
                        // merge
                        if ((node.value === 1 && toNode.value === 2) ||
                            (node.value === 2 && toNode.value === 1) ||
                            (node.value >= 3 && toNode.value >= 3 && node.value === toNode.value)) {
                            toNode.value += node.value;
                            this.setTile(thisVector, null);
                            this.scorePoints(Math.floor(toNode.value / 3));
                        }
                    }
                }
            }
        }
    }
    scorePoints(val) {
        this.points += val;
    }
    spawnRandom(val = 2, num = 1, freeSpaces = null) {
        const spaces = freeSpaces || shuffle(this.getAllEmptySpaces());
        debug && console.log(`Spawning ${num} more. Spaces: `, spaces);
        const space = spaces.shift();
        if (space) {
            this.setTile(space, this.tileFactory.generate(val));
            if (num >= 2) {
                return this.spawnRandom(val, num - 1, spaces);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }
    async start() {
        // Spawn two random 2s and two random 1s
        this.prettyPrint();
        this.spawnRandom(2, 2);
        this.spawnRandom(1, 2);
        this.prettyPrint();
        // Game loop
        let ended = false;
        while (!ended) {
            const key = await waitForKey();
            if (["up", "down", "left", "right", "space"].includes(key.name)) {
                this.move(key.name);
                if (this.spawnRandom(Math.floor(Math.random() * 2) + 1)) {
                    this.prettyPrint();
                }
                else {
                    console.log("Game Over");
                    this.prettyPrint();
                    ended = true;
                }
            }
        }
        process.exit();
    }
}
const g = new Game();
g.start();
