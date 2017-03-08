/*jslint browser:true, plusplus:true, vars: true */
"use strict";
// http://stackoverflow.com/questions/13756482/create-copy-of-multi-dimensional-array-not-reference-javascript
//create a clone of current game state board
Array.prototype.clone = function () {
    var arr = [], i;
    for (i = 0; i < this.length; i++) {
        arr[i] = this[i].slice();
    }
    return arr;
};
function Game() {
    var that = this;
    this.map = [];
    this.paused = false; //flag whether the game is paused or not, this can be true or false
    this.won = false; //flag whether the game has been won or not, this can be true or false
    this.rejectClick = false; //flag to prevent user from clicking
    this.move = 0;
    this.aiHistory = [];

    this.initOnceDone = false;
    /**
     * Only initalize once for these functions, can prevent race condition
     */
    this.initOnce = function () {
        if (this.initOnceDone) {
            return false;
        }

        this.canvas = document.getElementsByTagName("canvas")[0];
        //event listener listens for users click and applies their click to the board
        this.canvas.addEventListener('click', function (e) {
            that.onclick(that.canvas, e);
        });
        this.context = this.canvas.getContext('2d');
        this.initOnceDone = true;
    };

    this.init = function () {
        //initialize variables
        this.map = [];
        this.paused = false;
        this.won = false;
        this.rejectClick = false;
        this.move = 0;
        this.aiHistory = [];
        this.initOnce();

        var i, j;
        //we will create a 2D array representing a blank board in order to initialize the game
        for (i = 0; i <= 6; i++) {
            this.map[i] = [];
            for (j = 0; j <= 7; j++) {
                this.map[i][j] = 0;
            }
        }
        //print blank board to screen
        this.clear();
        this.drawMask();
        this.print();
    };

    this.playerMove = function () {
        //determine whether it is a players move. Return 1 if so, else return -1
        if (this.move % 2 === 0) {
            return 1;
        }
        return -1;
    };

    this.print = function () {
        var i, j, msg;
        msg = "\n";
        //display whos move it is: user or AI
        msg += "Move: " + this.move;
        msg += "\n";
        for (i = 0; i < 6; i++) {
            for (j = 0; j < 7; j++) {
                msg += " " + this.map[i][j];
            }
            msg += "\n";
        }
        console.log(msg);
    };

    this.printState = function (state) {
        //display current board state
        var i, j, msg = "\n";
        for (i = 0; i < 6; i++) {
            for (j = 0; j < 7; j++) {
                msg += " " + state[i][j];
            }
            msg += "\n";
        }
        console.log(msg);
    };

    this.win = function (player) {
        //the following function is used when either player has successfully won
        this.paused = true;
        this.won = true;
        this.rejectClick = false;
        var msg = null;
        //winning player or draw is displayed
        if (player > 0) {
            msg = "Player 1 wins";
        } else if (player < 0) {
            msg = "Player 2 wins";
        } else {
            msg = "It's a draw";
        }
        //user has the option to reset the game to play again.
        msg += " - Click to reset";
        this.context.save();
        this.context.font = '14pt sans-serif';
        this.context.fillStyle = "#111";
        this.context.fillText(msg, 200, 20);
        this.context.restore();

        console.info(msg);
    };
    this.fillMap = function (state, column, value) {
        //used to update game state. begin by creating a clone of the current board
        var tempMap = state.clone();
        //if not a valid click, return -1
        if (tempMap[0][column] !== 0 || column < 0 || column > 6) {
            return -1;
        }
        //initialize variables
        var done = false,
            row = 0,
            i;
        for (i = 0; i < 5; i++) {
            if (tempMap[i + 1][column] !== 0) {
                done = true;
                row = i;
                break;
            }
        }
        if (!done) {
            row = 5;
        }
        //set current selected spot to be filled and return the board
        tempMap[row][column] = value;
        return tempMap;

    };

    this.action = function (column, callback) {
        //if game is paused or won don't complete action
        if (this.paused || this.won) {
            return 0;
        }
        //check if it is a valid click
        if (this.map[0][column] !== 0 || column < 0 || column > 6) {
            return -1;
        }

        var done = false;
        var row = 0, i;
        for (i = 0; i < 5; i++) {
            if (this.map[i + 1][column] !== 0) {
                done = true;
                row = i;
                break;
            }
        }
        if (!done) {
            row = 5;
        }
        //animate move, show circle falling from top of screen
        this.animate(column, this.playerMove(this.move), row, 0, function () {
            that.map[row][column] = that.playerMove(that.move);
            that.move++;
            that.draw();
            that.check();
            that.print();
            callback();
        });
        this.paused = true;
        return 1;
    };

    this.check = function () {
        //check function is used to determine whether there is a current winner
        var i, j, k;
        var temp_r = 0, temp_b = 0, temp_br = 0, temp_tr = 0;
        for (i = 0; i < 6; i++) {
            for (j = 0; j < 7; j++) {
                temp_r = 0;
                temp_b = 0;
                temp_br = 0;
                temp_tr = 0;
                for (k = 0; k <= 3; k++) {
                    //from (i,j) to right
                    if (j + k < 7) {
                        temp_r += this.map[i][j + k];
                    }
                    //from (i,j) to bottom
                    if (i + k < 6) {
                        temp_b += this.map[i + k][j];
                    }

                    //from (i,j) to bottom-right
                    if (i + k < 6 && j + k < 7) {
                        temp_br += this.map[i + k][j + k];
                    }

                    //from (i,j) to top-right
                    if (i - k >= 0 && j + k < 7) {
                        temp_tr += this.map[i - k][j + k];
                    }
                }
                //if there is 4 peices in a row, set game to be won
                if (Math.abs(temp_r) === 4) {
                    this.win(temp_r);
                } else if (Math.abs(temp_b) === 4) {
                    this.win(temp_b);
                } else if (Math.abs(temp_br) === 4) {
                    this.win(temp_br);
                } else if (Math.abs(temp_tr) === 4) {
                    this.win(temp_tr);
                }

            }
        }
        // check if draw
        if ((this.move === 42) && (!this.won)) {
            this.win(0);
        }
    };

    this.drawCircle = function (x, y, r, fill, stroke) {
        this.context.save();
        this.context.fillStyle = fill;
        this.context.strokeStyle = stroke;
        this.context.beginPath();
        this.context.arc(x, y, r, 0, 2 * Math.PI, false);
        this.context.fill();
        this.context.restore();
    };
    this.drawMask = function () {
        // draw the mask which is the empty game board
        // http://stackoverflow.com/questions/6271419/how-to-fill-the-opposite-shape-on-canvas
        // -->  http://stackoverflow.com/a/11770000/917957

        this.context.save();
        this.context.fillStyle = "#ddd";
        this.context.beginPath();
        var x, y;
        for (y = 0; y < 6; y++) {
            for (x = 0; x < 7; x++) {
                this.context.arc(75 * x + 100, 75 * y + 50, 25, 0, 2 * Math.PI);
                this.context.rect(75 * x + 150, 75 * y, -100, 100);
            }
        }
        this.context.fill();
        this.context.restore();
    };

    this.draw = function () {
        var x, y;
        var fg_color;
        for (y = 0; y < 6; y++) {
            for (x = 0; x < 7; x++) {
                fg_color = "transparent";
                //if it is player 1s turn, set colour to red and draw a red circle
                if (this.map[y][x] >= 1) {
                    fg_color = "#ff4136";
                //else set colour to blue and draw a blue circle for the A1
                } else if (this.map[y][x] <= -1) {
                    fg_color = "#0074d9";
                }
                this.drawCircle(75 * x + 100, 75 * y + 50, 25, fg_color, "black");
            }
        }
    };
    this.clear = function () {
        //clear the game board
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    this.animate = function (column, move, to_row, cur_pos, callback) {
        //function used for animating the tiles dropping down from the top of the screen
        var fg_color = "transparent";
        //if player 1s move, set colour to red
        if (move >= 1) {
            fg_color = "#ff4136";
        //if player 2s move, set colour to blue
        } else if (move <= -1) {
            fg_color = "#0074d9";
        }
        if (to_row * 75 >= cur_pos) {
          //animate circle dropping from top of screen
            this.clear();
            this.draw();
            this.drawCircle(75 * column + 100, cur_pos + 50, 25, fg_color, "black");
            this.drawMask();
            window.requestAnimationFrame(function () {
                that.animate(column, move, to_row, cur_pos + 25, callback);
            });
        } else {
            callback();
        }
    };

    this.onregion = function (coord, x, radius) {
      //check whether click was in region of the game board
        if ((coord[0] - x)*(coord[0] - x) <=  radius * radius) {
            return true;
        }
        return false;
    };
    this.oncircle = function (coord, centerCoord, radius) {
        if ((coord[0] - centerCoord[0]) * (coord[0] - centerCoord[0]) <=  radius * radius
                && (coord[1] - centerCoord[1]) * (coord[1] - centerCoord[1]) <=  radius * radius) {
            return true;
        }
        return false;
    };

    this.onclick = function (canvas, e) {
        //check if game is over or not
        if (this.rejectClick) {
            return false;
        }
        //if game has been won start new game
        if (this.won) {
            this.init();
            return false;
        }
        var rect = canvas.getBoundingClientRect(),
            x = e.clientX - rect.left,// - e.target.scrollTop,
            y = e.clientY - rect.top;// - e.target.scrollLeft;

        var j, valid;
        for (j = 0; j < 7; j++) {
            if (this.onregion([x, y], 75 * j + 100, 25)) {
                // console.log("clicked region " + j);
                this.paused = false;
                valid = this.action(j, function () {
                    that.ai(-1);
                });
                if (valid === 1) { // give user retry if action is invalid
                    this.rejectClick = true;
                }
                break; //because there will be no 2 points that are clicked at a time
            }
        }
    };

    this.ai = function (aiMoveValue) {
        //console.log(this.aiHistory);
        var choice = null;
        //copy the current state of the board
        var state = this.map.clone();

        function checkState(state) {
            var winVal = 0;
            var chainVal = 0;
            var i, j, k;
            var temp_r = 0, temp_b = 0, temp_br = 0, temp_tr = 0;
            //nested for loop used to check the state of the board to determine which is the best move for the AI
            for (i = 0; i < 6; i++) {
                for (j = 0; j < 7; j++) {
                    temp_r = 0;
                    temp_b = 0;
                    temp_br = 0;
                    temp_tr = 0;
                    for (k = 0; k <= 3; k++) {
                        //from (i,j) to right
                        if (j + k < 7) {
                            temp_r += state[i][j + k];
                        }
                        //from (i,j) to bottom
                        if (i + k < 6) {
                            temp_b += state[i + k][j];
                        }

                        //from (i,j) to bottom-right
                        if (i + k < 6 && j + k < 7) {
                            temp_br += state[i + k][j + k];
                        }

                        //from (i,j) to top-right
                        if (i - k >= 0 && j + k < 7) {
                            temp_tr += state[i - k][j + k];
                        }
                    }
                    //compute chain values for heuristic for the AI
                    chainVal += temp_r * temp_r * temp_r;
                    chainVal += temp_b * temp_b * temp_b;
                    chainVal += temp_br * temp_br * temp_br;
                    chainVal += temp_tr * temp_tr * temp_tr;
                    //if any value equals 4, meaning there are four in a row, set win value to temp value. meaning we have a winner
                    if (Math.abs(temp_r) === 4) {
                        winVal = temp_r;
                    } else if (Math.abs(temp_b) === 4) {
                        winVal = temp_b;
                    } else if (Math.abs(temp_br) === 4) {
                        winVal = temp_br;
                    } else if (Math.abs(temp_tr) === 4) {
                        winVal = temp_tr;
                    }

                }
            }
            return [winVal, chainVal];
        }
        function value(state, depth, alpha, beta) {
            var val = checkState(state);
            if (depth >= 4) { // if slow (or memory consumption is high), lower the value

                var retValue = 0;

                // if win, value = +inf
                var winVal = val[0];
                var chainVal = val[1] * aiMoveValue;
                retValue = chainVal;

                // If a move leads to winning, then execute it
                if (winVal === 4 * aiMoveValue) { // return a large value if AI wins because the AI wants to win
                    retValue = 999999;
                } else if (winVal === 4 * aiMoveValue * -1) { // AI loses, AI hates losing, return a low value
                    retValue = 999999 * -1;
                }
                retValue -= depth * depth;

                return [retValue, -1];
            }

            var win = val[0];
            // if already won, then return the value right away
            if (win === 4 * aiMoveValue) { // AI wins, AI wants to win of course
                return [999999 - depth * depth, -1];
            }
            if (win === 4 * aiMoveValue * -1) { // AI loses, AI hates losing, return low value
                return [999999 * -1 - depth * depth, -1];
            }

            if (depth % 2 === 0) {
                //compute minmax with alpha beta pruning. min state will return what an optimal users move would be to minimize AIs score
                return minState(state, depth + 1, alpha, beta);
            }
            //if not, then return the move which will maximize the AIs score.
            return maxState(state, depth + 1, alpha, beta);

        }
        function choose(choice) {
            return choice[Math.floor(Math.random() * choice.length)];
        }
        function maxState(state, depth, alpha, beta) {
            var v = -100000000007;
            var move = -1;
            var tempVal = null;
            var tempState = null;
            var moveQueue = [];
            var j;
            //compute all possible states of the board at next depth
            for (j = 0; j < 7; j++) {
                tempState = that.fillMap(state, j, aiMoveValue);
                if (tempState !== -1) {

                    tempVal = value(tempState, depth, alpha, beta);
                    if (tempVal[0] > v) {
                        v = tempVal[0];
                        move = j;
                        moveQueue = [];
                        moveQueue.push(j);
                    } else if (tempVal[0] === v) {
                        moveQueue.push(j);
                    }

                    // alpha-beta pruning
                    if (v > beta) {
                        move = choose(moveQueue);
                        return [v, move];
                    }
                    alpha = Math.max(alpha, v);
                }
            }
            move = choose(moveQueue);

            return [v, move];
        }
        function minState(state, depth, alpha, beta) {
            var v = 100000000007;
            var move = -1;
            var tempVal = null;
            var tempState = null;
            var moveQueue = [];
            var j;

            for (j = 0; j < 7; j++) {
                tempState = that.fillMap(state, j, aiMoveValue * -1);
                if (tempState !== -1) {

                    tempVal = value(tempState, depth, alpha, beta);
                    if (tempVal[0] < v) {
                        v = tempVal[0];
                        move = j;
                        moveQueue = [];
                        moveQueue.push(j);
                    } else if (tempVal[0] === v) {
                        moveQueue.push(j);
                    }

                    // alpha-beta pruning
                    if (v < alpha) {
                        move = choose(moveQueue);
                        return [v, move];
                    }
                    beta = Math.min(beta, v);
                }
            }
            move = choose(moveQueue);

            return [v, move];
        }
        var choice_val = maxState(state, 0, -100000000007, 100000000007);
        choice = choice_val[1];
        var val = choice_val[0];
        console.info("AI " + aiMoveValue + " choose column: " + choice + " (value: " + val + ")");

        this.paused = false;
        var done = this.action(choice, function () {
            that.rejectClick = false;
            //that.ai(-aiMoveValue);
        });

        // if fail, then random
        while (done < 0) {
            console.error("Falling back to random agent");
            choice = Math.floor(Math.random() * 7);
            done = this.action(choice, function () {
                that.rejectClick = false;
            });
        }

    };
    this.init();
}
document.addEventListener('DOMContentLoaded', function () {
    this.game = new Game();
    //this.game.ai(1);
});
