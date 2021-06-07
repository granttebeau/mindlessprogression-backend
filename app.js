const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 8000;

const app = express();

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
      origin: "*",
    },
  });

io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });


    socket.on('new user', (usr) => {
        socket['name'] = usr.name;
        let users = [];
        for (let [key, val] of io.sockets.sockets) {
          if (val.rooms.size === 1) {
            users.push({"id": key, "name": val.name})
          }
        }
        io.emit('new user', users);
      });

    socket.on("new game", (game) => {
      socket.join(game.room);
      io.to(game.playerTwo).emit("join game", game)
    })

    socket.on("joining", (game) => {
      socket.join(game.room);

      io.to(game.playerOne).emit("joined", game)
    })

    socket.on("start game", game => {
      let number = Math.floor(Math.random() * 2);
      let id = !!number ? game.playerTwo : socket.id;
      let turns = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      // let turns = ['3']
      io.to(game.room).emit("game started", {id: id, turns: turns});
    })

    socket.on("restart game", game => {
      console.log(game);
      let number = Math.floor(Math.random() * 2);
      let id = !!number ? game.playerTwo : socket.id;
      let turns = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      // let turns = ['3']
      io.to(game.room).emit("game restarted", {id: id, turns: turns});
    })

    socket.on("your turn", round => {
      let next = round.nextPlayer;
      delete round.nextPlayer;
      io.to(next).emit("your turn", round) 
    })

    socket.on("last turn", round => {
      let next = round.nextPlayer;
      delete round.nextPlayer;
      io.to(next).emit("last turn", round)
    })

    socket.on("finished round", round => {
      
      io.to(round.room).emit("finished round", round)
    })

    socket.on("next round", game => {
      
      let deck = [
        { suit: 'H', number: 'A' },
        { suit: 'H', number: '4' },
        { suit: 'S', number: '8' },
        { suit: 'H', number: '3' },
        { suit: 'H', number: '2' },
        { suit: 'D', number: '5' },
        { suit: 'D', number: '7' },
        { suit: 'Jo', number: 'B' },
        { suit: 'D', number: '6' },
        { suit: 'D', number: '7' },
        { suit: 'H', number: '4' },
        { suit: 'H', number: '5' },
        { suit: 'H', number: '7' },
        { suit: 'H', number: '2' },
        { suit: 'H', number: '6' },
        { suit: 'D', number: '3' },
        { suit: 'H', number: '8' },
        { suit: 'H', number: '9' },
        { suit: 'D', number: '4' },
        { suit: 'H', number: '10' },
        { suit: 'H', number: 'J' },
        { suit: 'H', number: 'Q' },
        { suit: 'H', number: 'K' },
        { suit: 'D', number: 'A' },
        { suit: 'D', number: '2' },
        { suit: 'D', number: '5' },
        { suit: 'D', number: '6' },
        { suit: 'D', number: '7' },
        { suit: 'D', number: '8' },
        { suit: 'D', number: '9' },
        { suit: 'D', number: '10' },
        { suit: 'D', number: 'J' },
        { suit: 'D', number: 'Q' },
        { suit: 'D', number: 'K' },
        { suit: 'C', number: 'A' },
        { suit: 'C', number: '2' },
        { suit: 'C', number: '3' },
        { suit: 'C', number: '4' },
        { suit: 'S', number: '10' },
        { suit: 'S', number: '9' },
        { suit: 'C', number: '5' },
        { suit: 'C', number: '6' },
        { suit: 'C', number: '7' },
        { suit: 'C', number: '8' },
        { suit: 'C', number: '9' },
        { suit: 'C', number: '10' },
        { suit: 'C', number: 'J' },
        { suit: 'C', number: 'Q' },
        { suit: 'C', number: 'K' },
        { suit: 'S', number: 'A' },
        { suit: 'S', number: '2' },
        { suit: 'S', number: '3' },
        { suit: 'S', number: '4' },
        { suit: 'S', number: '5' },
        { suit: 'S', number: '6' },
        { suit: 'S', number: '7' },
        { suit: 'S', number: '8' },
        { suit: 'S', number: 'J' },
        { suit: 'S', number: 'Q' },
        { suit: 'S', number: 'K' },
        { suit: 'Jo', number: 'R' }
      ]
      deck = deck.concat(deck);
      // let deck = getNewDeck().concat(getNewDeck());
      let roundNum = numCards(game.round);
      
      let firstHand = [],
          secondHand = [];
      for (var i = 0; i < roundNum * 2; i++) {
        i % 2 === 0 ? firstHand.push(deck.shift()) : secondHand.push(deck.shift());
      }

      let playerOneGame = {
        room: game.room,
        round: game.round,
        roundsLeft: game.roundsLeft,
        playerOne: game.playerOne,
        playerTwo: game.playerTwo,
        deck: deck
      }
      let playerTwoGame = {
        room: game.room,
        round: game.round,
        roundsLeft: game.roundsLeft,
        playerOne: game.playerOne,
        playerTwo: game.playerTwo,
        deck: deck
      }

      if (game.playerOne === game.selector) {
        playerOneGame['hand'] = firstHand;
        playerOneGame['turn'] = false;
        playerTwoGame['hand'] = secondHand;
        playerTwoGame['turn'] = true;
      }
      else {
        playerOneGame['hand'] = secondHand;
        playerOneGame['turn'] = true;
        playerTwoGame['hand'] = firstHand;
        playerTwoGame['turn'] = false;
      }

      io.to(game.playerOne).emit("dealt hand", playerOneGame);
      io.to(game.playerTwo).emit("dealt hand", playerTwoGame);
    })
})

let numCards = (round) => {
  if (!!parseInt(round)) {
    return parseInt(round);
  }
  else if (round === 'J') {
    return 11;
  }
  else if (round === 'Q') {
    return 12;
  }
  else {
    return 13;
  }
}

let shuffleArray = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

let getNewDeck = () => {
  let suits = [ 'H', 'D', 'C', 'S'];
  let nums = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let cards = [];

  for (let i = 0; i < suits.length; i++) {
    for (var j = 0; j < nums.length; j++) {
      let newCard = {
        suit: suits[i],
        number: nums[j]
      }
      cards.push(newCard);
    }
  }

  cards.push({ suit: 'Jo', number: 'B'});
  cards.push({ suit: 'Jo', number: 'R'});
  console.log(JSON.parse(JSON.stringify(cards)));
  shuffleArray(cards);
  return cards;
}

server.listen(port, () => console.log("listening on port ", port));