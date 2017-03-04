# TicTacToeAI
A Tic Tac Toc implementation in Javascript with a simple AI

### Setup
No external plugins are required. Simply download the repository.

### Run
To run the game open `tictactoe.html` and enjoy.

### Usage
The game is supposed to be incorporated in an iFrame. It communicates with the parent window with a set of post messages (`window.postMessage`). All the messages must contain a messageType attribute, which can be one of six things:
<ul>
<li><b>SCORE</b> sent from the game to the service, informing of a new score submission. The message must also contain a score attribute</li>
<li><b>SAVE</b> Sent from the game to the service. The service should now store the sent game state. The message must also contain gameState attribute, containing game specific state information</li>
<li><b>LOAD_REQUEST</b> Sent from the game to the service, requesting that a game state (if there is one saved) is sent from the service to the game. The service will either respond with LOAD or ERROR</li>
<li><b>LOAD</b> Sent from the service to the game. It must contain a gameState attribute, which is the game state to be loaded</li>
<li><b>ERROR</b> Sent from the service to the game. It must contain info attributes, which contains textual information to be relayed to the user on what went wrong</li>
<li><b>SETTING</b> Sent from the game to the service once the game has finished loading. It must contain an options attribute,  which tells the game a specific configuration. This is mainly used to adjust the layout in the service by providing a desired resolution in pixels.

### Messages examples
Example message SCORE from game to the service

```json
var message = {
  "messageType": "SCORE",
  "score": 500.0
};
```

Example message SAVE from game to the service

```json
var message =  {
  "messageType": "SAVE",
  "gameState": {
    "playerItems": [
      "Sword",
      "Wizard Hat"
    ],
    "score": 506.0
  }
};
```

Example message LOAD_REQUEST from game to the service

```json
var message = {
  "messageType": "LOAD_REQUEST"
};
```

Example message LOAD from service to the game

```json
var message = {
  "messageType": "LOAD",
  "gameState": {
    "playerItems": [
      "Sword",
      "Wizard Hat"
    ],
    "score": 507.0 
  }
};
```

Example message ERROR from service to the game

```json
var message =  {
  "messageType": "ERROR",
  "info": "Gamestate could not be loaded"
};
```

Example message SETTING from game to the service

```json
var message =  {
  "messageType": "SETTING",
  "options": {
    "width": 400,
    "height": 300 
  }
};
```
