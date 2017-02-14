$(document).ready( function () {

    set_frame_resolution();
    addWebAppMessageListener();

    $('#start-game').click(function () {
        enabled = true;
    });

    $('#pause-game').click(function () {
        enabled = false;
        clearInterval(print_timer);
        setTimeout(save_game_state, 500);
    });

    $('#load-game').click(function () {
        load_request();
    });

    // Cell click handler
    $('.row>span').click(function () {
        if (!clicked) {
            // if first click in the grid, start the timer
            start_time = new Date().getTime();
            clicked = true;
            print_timer = setInterval(print_score, 200);
        }
        if (enabled && $(this).text().length == 0 && counter % 2 == 0) {
            // accepts only clicks in free cells and wait for the oppo to make the move

            counter++;
            $(this).text('X');
            board_dict[this.id] = $(this).text();
            enabled = false;

            var winner = check_board();
            if (!winner && counter < 9) {
                make_ai_move();
            } else if (winner == 'X') {
                terminate_game('You win!');
                send_score();
            } else if (counter == 9) {
                terminate_game('It\'s a tie!');
            }

        }
    });
});

var counter = 0, // counts the number of clicks in the grid (used to alternate Xs and Os)
    board_dict = {},
    enabled = true,
    start_time = 0, // in milliseconds
    end_time = 0, // in milliseconds
    previous_time = 0,
    clicked = false,
    print_timer,
    score = 100;

function init_board(board){
    $('.wrapper span').each(function(){
        $(this).text(board[this.id]);
        board_dict[this.id] = board[this.id];
    });
    enabled = true;
    print_score();
}

function print_score(){
    $('#score').text(calculate_score());
}

function terminate_game(message){
    enabled = false;
    clearInterval(print_timer);
    $('#winner').text(message);
    $("#pause-game").hide();
}

function make_ai_move(){

    enabled = false;

    if (counter >= 8){ // The game is finished. No more cells are free
        return;
    }

    counter++;

    var decision = calculate_next_move();
    console.log(decision)
    if (decision.win){
        $('.wrapper').find('span#' + decision.win).text('O');
        board_dict[decision.win] = 'O';
        check_O_winner();
    } else if (decision.stop_oppo){
        $('.wrapper').find('span#' + decision.stop_oppo).text('O');
        board_dict[decision.stop_oppo] = 'O';
        check_O_winner();
    } else if (decision.next_move){
        $('.wrapper').find('span#' + decision.next_move).text('O');
        board_dict[decision.next_move] = 'O';
        check_O_winner();
    } else if (decision.new_move){
        $('.wrapper').find('span#' + decision.new_move).text('O');
        board_dict[decision.new_move] = 'O';
        check_O_winner();
    } else {
        make_random_move()
    }
}

function calculate_next_move() {
    // This AI knows three different behaviours:
    // - WIN always win if possible with the current board status;
    // - BLOCK_OPPO if no chances to win with the current board status,
    //              but one or more chances for the opponent to win with
    //              the next move, then block it;
    // - RANDOM_MOVE make a random move if none of the above applies
    var decision = {'win': null, 'stop_oppo': null, 'next_move': null, 'new_move': null};
    for (var i=0; i<3; i++) {
        var row = {};
        for (var j=0; j<3; j++){
            var row_key = _int_to_string_value(3*i+j);
            row[row_key] = board_dict[row_key];
        }
        var row_occurrences = calculate_triplet_occurrences(row);
        decision = _update_decision(decision, calculate_next_cell(row, row_occurrences));
        if (decision.win){
            return decision;
        }

        var column = {};
        for (var j=0; j <= 6; j += 3){
            var column_key = _int_to_string_value(i+j);
            column[column_key] = board_dict[column_key];
        }
        var column_occurrences = calculate_triplet_occurrences(column);
        decision = _update_decision(decision, calculate_next_cell(column, column_occurrences));
        if (decision.win){
            return decision;
        }
    }

    var diagonal = {};
    diagonal[_int_to_string_value(0)] = board_dict[_int_to_string_value(0)];
    diagonal[_int_to_string_value(4)] = board_dict[_int_to_string_value(4)];
    diagonal[_int_to_string_value(8)] = board_dict[_int_to_string_value(8)];
    var diagonal_occurrences = calculate_triplet_occurrences(diagonal);
    decision = _update_decision(decision, calculate_next_cell(diagonal, diagonal_occurrences));
    if (decision.win){
        return decision;
    }

    diagonal = {};
    diagonal[_int_to_string_value(2)] = board_dict[_int_to_string_value(2)];
    diagonal[_int_to_string_value(4)] = board_dict[_int_to_string_value(4)];
    diagonal[_int_to_string_value(6)] = board_dict[_int_to_string_value(6)];
    diagonal_occurrences = calculate_triplet_occurrences(diagonal);
    decision = _update_decision(decision, calculate_next_cell(diagonal, diagonal_occurrences));

    return decision;
}

function make_random_move(){
    var random_cell = Math.floor(Math.random() * (8 + 1));
    var cell_id = _int_to_string_value(random_cell);
    if (board_dict[cell_id]) { // if the cell is already occupied try again
        make_random_move();
    } else {
        $('.wrapper').find('span#' + cell_id).text('O');
        board_dict[cell_id] = 'O';
    }
    check_O_winner();
}

function calculate_triplet_occurrences(triplet){
    // Return a dictionary containing the number of occurrences
    // for every Xs and Os in the triplet
    var counts = {'X': 0, 'O': 0};
    for (var key in triplet){
        counts[triplet[key]] = (counts[triplet[key]] + 1) || 1;
    }
    return counts;
}

function calculate_next_cell(row, row_occurrences){
    // Return a dictionary containing the two possible next moves
    // Return null values if no win or block_oppo moves are found
    var decision = {'win': null, 'stop_oppo': null};
    decision['win'] = _elaborate_next_move(row, row_occurrences, 'O', 'X', 2);
    decision['stop_oppo'] = _elaborate_next_move(row, row_occurrences, 'X', 'O', 2);
    decision['next_move'] = _elaborate_next_move(row, row_occurrences, 'O', 'X', 1);
    decision['new_move'] = _elaborate_next_move(row, row_occurrences, 'O', 'X', 0);
    return decision;
}

function _elaborate_next_move(row, row_occurrences, player, opponent, occurrences){
    if (row_occurrences[player] == occurrences && row_occurrences[opponent] == 0){
        for (var key in row){
            if (row[key] == '' || row[key] == null){
                return key;
            }
        }
    }
}

function _update_decision(decision, next_decision){
    // Update the decision dictionary
    decision['win'] = next_decision['win']; // win is always null, because otherwise it would have been already returned
    if (next_decision['stop_oppo'] != null){
        decision['stop_oppo'] = next_decision['stop_oppo']
    }
    if (next_decision['next_move'] != null){
        decision['next_move'] = next_decision['next_move']
    }
    if (next_decision['new_move'] != null){
        decision['new_move'] = next_decision['new_move']
    }
    return decision;
}

function check_O_winner(){
    var winner = check_board();
    if (winner == 'O') {
        terminate_game('You lose!');
    } else {
        enabled = true;
    }
}

function check_board() {
    // Check if there is a winner with the board at the current status,
    for (var i=0; i<3; i++) {
        var row = [board_dict[_int_to_string_value(3*i)],
                    board_dict[_int_to_string_value(3*i+1)],
                    board_dict[_int_to_string_value(3*i+2)]];
        if (check_triplet(row, 0)) {
            color_winner_cells_triplet([3*i,3*i+1,3*i+2]);
            return row[0];
        }

        var column = [board_dict[_int_to_string_value(i)],
                        board_dict[_int_to_string_value(i+3)],
                        board_dict[_int_to_string_value(i+6)]];
        if (check_triplet(column, 0)) {
            color_winner_cells_triplet([i,i+3,i+6]);
            return row[0];
        }
    }

    var diagonal = [board_dict[_int_to_string_value(0)],
                    board_dict[_int_to_string_value(4)],
                    board_dict[_int_to_string_value(8)]];
    if (check_triplet(diagonal, 0)) {
        color_winner_cells_triplet([0,4,8]);
        return diagonal[0];
    }

    diagonal = [board_dict[_int_to_string_value(2)],
                board_dict[_int_to_string_value(4)],
                board_dict[_int_to_string_value(6)]];
    if (check_triplet(diagonal, 0)) {
        color_winner_cells_triplet([2,4,6]);
        return diagonal[0];
    }
    return false;
}

function check_triplet(row, index) {
    // Check if the triplet of values are all the same
    if (row[index] == row[index+1] && row[index] == 'X' || row[index] == row[index+1] && row[index] == 'O') {
        if (index == 1) {
            return true;
        }
        return check_triplet(row, index + 1);
    }
    return false;
}

function color_winner_cells_triplet(indexes) {
    clearInterval(print_timer);
    for (var i = 0; i < indexes.length; i++) {
        $('.wrapper').find('span#' + _int_to_string_value(indexes[i])).css("background-color", "green");
    }
}

function _int_to_string_value(int_value){
    if (int_value == 0) {
        return 'first';
    } else if (int_value == 1) {
        return 'second';
    } else if (int_value == 2) {
        return 'third';
    } else if (int_value == 3) {
        return 'fourth';
    } else if (int_value == 4) {
        return 'fifth';
    } else if (int_value == 5) {
        return 'sixth'
    } else if (int_value == 6) {
        return 'seventh';
    } else if (int_value == 7) {
        return 'eight';
    } else if (int_value == 8) {
        return 'ninth';
    }
}

function calculate_score(){
    // The final score is calculated based on the time and the number of moves.
    // It is calculated as follows: moves*time (1 < final_score < 100)
    // The points are distributed like this:
    // - Moves :
    //      0 < moves < 3: 10 points
    //      4 moves      : 6  points
    //      5 moves      : 2  point
    // - Time (every 3 seconds points are decreased by 1):
    //      3s           : 10 points
    //      3 < time <= 6: 9 points
    //      ...
    //      30s          : 1  point
    // Maximum score = 10 points (3 moves) * 10 points (<3s) = 100
    // Mininum score = 1 point (5 moves) * 1 point (>30s) = 1
    var moves_score = calculate_moves_score();
    var time_score = calculate_time_score();
    if (moves_score < 0 || time_score < 0){
        return 0;
    }
    score = moves_score * time_score;
    return score;
}

function calculate_moves_score(){
    // Return the score based on the number of moves to win the game
    //      0 < moves < 3: 10 points
    //      4 moves      : 7  points
    //      moves >= 5   : 4  point
    var moves_score = 0;
    if (counter >= 0 && counter <= 5){ // 3rd move
        moves_score = 10;
    } else if (counter <= 7){ // 4th move
        moves_score = 7;
    } else {
        moves_score = 4; // 5th move
    }
    return moves_score;
}

function calculate_time_score(){
    // Return the score based on the time taken to win the game
    var x = calculate_total_time() / 3;
    x = parseInt(x.toString()); // keep only the decimal part, without approximation
    return 10 - x;
}

function calculate_total_time() {
    if (start_time == 0){
        start_time = new Date().getTime();
        end_time = start_time + 1
    }
    if (end_time == 0){
        end_time = new Date().getTime();
    }
    var total_time = ((end_time - start_time) / 1000) % 60 + previous_time;
    end_time = 0;
    return total_time;
}

function addWebAppMessageListener(){
    window.addEventListener("message", function(evt) {
        if(evt.data.messageType === "LOAD") {
            board_dict = evt.data.gameState.board;
            previous_time = evt.data.gameState.time;
            counter = evt.data.gameState.moves_count;
            init_board(board_dict);
        } else if (evt.data.messageType === "ERROR") {
            alert(evt.data.info);
        }
    });
}

function load_request () {
    var msg = {
        "message_type": "LOAD_REQUEST"
    };
    window.parent.postMessage(msg, "*");
}

function save_game_state(){
    $('.wrapper span').each(function(){
        board_dict[this.id] = $(this).text();
    });
    var msg = {
        "messageType": "SAVE",
        "gameState": {
            "board": board_dict,
            "time": calculate_total_time(),
            "moves_count": counter
        }
    };
    window.parent.postMessage(msg, "*");
}

function send_score (){
    var msg = {
        "messageType": "SCORE",
        "score": calculate_score()
    };
    window.parent.postMessage(msg, "*");
}

function set_frame_resolution(){
    // Request the service to set the resolution of the iframe
    var message =  {
        messageType: "SETTING",
        options: {
            "width": 400, //Integer
            "height": 500 //Integer
        }
    };
    window.parent.postMessage(message, "*");
}