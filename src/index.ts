const shuffle = require("lodash/shuffle");
const keypress = require("keypress");

function clear() {
    process.stdout.write('\x1b[2J');
}

keypress(process.stdin);
if (!process.stdin.setRawMode) process.exit();
else process.stdin.setRawMode(true);

const debug = false;

class Board {
    width: number;
    height: number;
    tiles: (ITile | null)[][];
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        const board = [];
        for (let x = 0; x < width; x++) {
            board.push((new Array(height)).fill(null));
        }
        this.tiles = board;
    }
}

interface IVector {
    x: number,
    y: number
};

interface ITile {
    value: number,
    id: number
};

class TileFactory {
    lastId: number;
    constructor() {
        this.lastId = -1;
    }
    generate(value: number): ITile {
        this.lastId += 1;
        return {
            value,
            id: this.lastId
        }
    }
}

interface IKey {
    ctrl: boolean,
    name: string
} 

const waitForKey = () => new Promise<IKey>((res, rej) => {
    process.stdin.once("keypress", (ch, key: IKey) => {
        if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            process.exit();
        }
        res(key);
    });
    process.stdin.resume();
})


class Game {
    board: Board;
    tileFactory: TileFactory;
    points: number

    constructor() {
        // Board is top left indexed 0,0 (x,y)
        // Board is array of columns which is an array of rows
        this.board = new Board(4, 4);
        this.tileFactory = new TileFactory();
        this.points = 0;
    }

    getAllEmptySpaces() {
        const result: IVector[] = [];
        this.board.tiles.forEach((col, colIdx) => {
            col.forEach((row, rowIdx) => {
                if (!row) result.push({x: rowIdx, y: colIdx})
            })
        });
        return result;
    }
    getTile({x, y}: IVector): ITile | null {
        return this.board.tiles[y][x] || null;
    }
    setTile({x, y}: IVector, tile: ITile| null): void {
        this.board.tiles[y][x] = tile;
        debug && console.log(`Setting tile ${tile} at `, {x, y});
    }
    prettyPrint() {
        clear();
        const pretty = this.board.tiles.map(
            (row) => row.map((item) => item === null ? "[ ]" : `[${item.value}]`).join("|")
        ).join("\n");
        console.log(`--- (Score: ${this.points}) ---`);
        console.log(pretty);
    }
    move(direction: string) {
        // Moves the board in the given direction
        let primaryKey: "x" | "y" = "y";
        let primaryStart = 1;
        let primaryEnd = (v: number) => v < this.board.height - 1;
        let primaryInc = 1;
        let secondaryKey: "x" | "y" = "x";
        let secondaryMax = this.board.width - 1;
        let shiftDir = -1;
        switch (direction) {
            case "up":
                primaryKey = "y";
                primaryStart = 1;
                primaryEnd = (v: number) => v <= this.board.height - 1;
                primaryInc = 1;
                secondaryMax = this.board.width - 1;
                shiftDir = -1;
                break;
            case "down":
                primaryKey = "y";
                primaryStart = this.board.height - 2;
                primaryEnd = (v: number) => v >= 0;
                primaryInc = -1;
                secondaryMax = this.board.width - 1;
                shiftDir = 1;
                break;
            case "left":
                primaryKey = "x";
                primaryStart = 1;
                primaryEnd = (v: number) => v <= this.board.width - 1;
                primaryInc = 1;
                secondaryMax = this.board.height - 1;
                shiftDir = -1;
                break;
            case "right":
                primaryKey = "x";
                primaryStart = this.board.width - 2;
                primaryEnd = (v: number) => v >= 0;
                primaryInc = -1;
                secondaryMax = this.board.height - 1;
                shiftDir = 1;
                break;
        }
        for (let i = primaryStart; primaryEnd(i); i += primaryInc) {
            for (let j = 0; j <= secondaryMax; j++) {
                const x = (primaryKey === "x") ? i : j;
                const y = (primaryKey === "x") ? j : i;
                const thisVector: IVector = {x, y};
                const node = this.getTile(thisVector);
                if (node) {
                    const shiftedVector = {...thisVector};
                    shiftedVector[primaryKey] += shiftDir;
                    const toNode = this.getTile(shiftedVector);
                    if (!toNode) {
                        this.setTile(shiftedVector, node);
                        this.setTile(thisVector, null);
                    } else {
                        if (toNode.value === node.value) {
                            // merge
                            this.scorePoints(node.value);
                            toNode.value *= 2;
                            this.setTile(thisVector, null);
                        }
                    }
                }
            }
        }
    }
    scorePoints(val: number) {
        this.points += val;
    }
    spawnRandom(val = 2, num = 1, freeSpaces: IVector[] | null = null): boolean {
        const spaces = freeSpaces || shuffle(this.getAllEmptySpaces());
        debug && console.log(`Spawning ${num} more. Spaces: `, spaces);
        const space = spaces.shift();
        if (space) {
            this.setTile(space, this.tileFactory.generate(val));
            if (num >= 2) {
                return this.spawnRandom(val, num - 1, spaces);
            } else {
                return true;
            }
        } else {
            return false;
        }
    }
    async start() {
        // Spawn two random 2s
        this.prettyPrint();
        this.spawnRandom(2, 2);
        this.prettyPrint();
        // Game loop
        let ended = false;
        while (!ended) {
            const key = await waitForKey();
            if (["up", "down", "left", "right", "space"].includes(key.name)) {
                this.move(key.name);
                if (this.spawnRandom()) {
                    this.prettyPrint();
                } else {
                    console.log("You lose :(");
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