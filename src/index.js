var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var shuffle = require("lodash/shuffle");
var keypress = require("keypress");
function clear() {
    process.stdout.write('\x1b[2J');
}
keypress(process.stdin);
if (!process.stdin.setRawMode)
    process.exit();
else
    process.stdin.setRawMode(true);
var debug = false;
var Board = /** @class */ (function () {
    function Board(width, height) {
        this.width = width;
        this.height = height;
        var board = [];
        for (var x = 0; x < width; x++) {
            board.push((new Array(height)).fill(null));
        }
        this.tiles = board;
    }
    return Board;
}());
;
;
var TileFactory = /** @class */ (function () {
    function TileFactory() {
        this.lastId = -1;
    }
    TileFactory.prototype.generate = function (value) {
        this.lastId += 1;
        return {
            value: value,
            id: this.lastId
        };
    };
    return TileFactory;
}());
var waitForKey = function () { return new Promise(function (res, rej) {
    process.stdin.once("keypress", function (ch, key) {
        if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            process.exit();
        }
        res(key);
    });
    process.stdin.resume();
}); };
var Game = /** @class */ (function () {
    function Game() {
        // Board is top left indexed 0,0 (x,y)
        // Board is array of columns which is an array of rows
        this.board = new Board(4, 4);
        this.tileFactory = new TileFactory();
        this.points = 0;
    }
    Game.prototype.getAllEmptySpaces = function () {
        var result = [];
        this.board.tiles.forEach(function (col, colIdx) {
            col.forEach(function (row, rowIdx) {
                if (!row)
                    result.push({ x: rowIdx, y: colIdx });
            });
        });
        return result;
    };
    Game.prototype.getTile = function (_a) {
        var x = _a.x, y = _a.y;
        return this.board.tiles[y][x] || null;
    };
    Game.prototype.setTile = function (_a, tile) {
        var x = _a.x, y = _a.y;
        this.board.tiles[y][x] = tile;
        debug && console.log("Setting tile " + tile + " at ", { x: x, y: y });
    };
    Game.prototype.prettyPrint = function () {
        clear();
        var pretty = this.board.tiles.map(function (row) { return row.map(function (item) { return item === null ? "[ ]" : "[" + item.value + "]"; }).join("|"); }).join("\n");
        console.log("--- (Score: " + this.points + ") ---");
        console.log(pretty);
    };
    Game.prototype.move = function (direction) {
        var _this = this;
        // Moves the board in the given direction
        var primaryKey = "y";
        var primaryStart = 1;
        var primaryEnd = function (v) { return v < _this.board.height - 1; };
        var primaryInc = 1;
        var secondaryKey = "x";
        var secondaryMax = this.board.width - 1;
        var shiftDir = -1;
        switch (direction) {
            case "up":
                primaryKey = "y";
                primaryStart = 1;
                primaryEnd = function (v) { return v <= _this.board.height - 1; };
                primaryInc = 1;
                secondaryMax = this.board.width - 1;
                shiftDir = -1;
                break;
            case "down":
                primaryKey = "y";
                primaryStart = this.board.height - 2;
                primaryEnd = function (v) { return v >= 0; };
                primaryInc = -1;
                secondaryMax = this.board.width - 1;
                shiftDir = 1;
                break;
            case "left":
                primaryKey = "x";
                primaryStart = 1;
                primaryEnd = function (v) { return v <= _this.board.width - 1; };
                primaryInc = 1;
                secondaryMax = this.board.height - 1;
                shiftDir = -1;
                break;
            case "right":
                primaryKey = "x";
                primaryStart = this.board.width - 2;
                primaryEnd = function (v) { return v >= 0; };
                primaryInc = -1;
                secondaryMax = this.board.height - 1;
                shiftDir = 1;
                break;
        }
        for (var i = primaryStart; primaryEnd(i); i += primaryInc) {
            for (var j = 0; j <= secondaryMax; j++) {
                var x = (primaryKey === "x") ? i : j;
                var y = (primaryKey === "x") ? j : i;
                var thisVector = { x: x, y: y };
                var node = this.getTile(thisVector);
                if (node) {
                    var shiftedVector = __assign({}, thisVector);
                    shiftedVector[primaryKey] += shiftDir;
                    var toNode = this.getTile(shiftedVector);
                    if (!toNode) {
                        this.setTile(shiftedVector, node);
                        this.setTile(thisVector, null);
                    }
                    else {
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
    };
    Game.prototype.scorePoints = function (val) {
        this.points += val;
    };
    Game.prototype.spawnRandom = function (val, num, freeSpaces) {
        if (val === void 0) { val = 2; }
        if (num === void 0) { num = 1; }
        if (freeSpaces === void 0) { freeSpaces = null; }
        var spaces = freeSpaces || shuffle(this.getAllEmptySpaces());
        debug && console.log("Spawning " + num + " more. Spaces: ", spaces);
        var space = spaces.shift();
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
    };
    Game.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ended, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Spawn two random 2s
                        this.prettyPrint();
                        this.spawnRandom(2, 2);
                        this.prettyPrint();
                        ended = false;
                        _a.label = 1;
                    case 1:
                        if (!!ended) return [3 /*break*/, 3];
                        return [4 /*yield*/, waitForKey()];
                    case 2:
                        key = _a.sent();
                        if (["up", "down", "left", "right", "space"].includes(key.name)) {
                            this.move(key.name);
                            if (this.spawnRandom()) {
                                this.prettyPrint();
                            }
                            else {
                                console.log("You lose :(");
                                this.prettyPrint();
                                ended = true;
                            }
                        }
                        return [3 /*break*/, 1];
                    case 3:
                        process.exit();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Game;
}());
var g = new Game();
g.start();
