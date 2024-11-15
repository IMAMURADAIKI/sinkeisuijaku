'use strict'

// マークと数字を定義
const suits = ['heart', 'diamond', 'spade', 'club'];
const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// マークと数字の各組み合わせを配列に追加
let cards = [];
suits.forEach(suit => {
    values.forEach(value => {
        cards.push(`${value}_${suit}`); 
    });
});

// 裏表の判定
let hasFlippedCard = false;
// 一枚目と二枚目に返したカード
let firstCard, secondCard;
// 二枚目以降カードをめくらないように
let lockBoard = false;
// コンピュータの記憶を保持するオブジェクト
let computerMemory = {};

// プレイヤーとコンピュータ
const players = [
    { name: 'プレイヤー', score: 0 },
    { name: 'コンピュータ', score: 0 }
];

// プレイヤーの順番を管理
let currentPlayerIndex = 0;

// ボタンクリックでstartGame関数を呼び出す
document.getElementById('start-button').addEventListener('click', startGame);

function startGame() {
    // タイトル画面を非表示
    document.getElementById('title-screen').classList.remove('active');
    // ゲーム画面を表示
    document.getElementById('game-screen').classList.add('active');
    // ゲームボードを生成
    createBoard();
}

// カードをシャッフル
function shuffle() {
    cards.sort(() => 0.5 - Math.random());
}

function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; 
    shuffle();

    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index; // カードの位置を記録

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.style.backgroundImage = `url("images/${card}.png")`;

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.style.backgroundImage = 'url("images/back.png")';

        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        cardElement.dataset.card = card;
        cardElement.addEventListener('click', flipCard);
        gameBoard.appendChild(cardElement);
    });

    updateScoreBoard();
    updateTurnIndicator();
}

// スコアを更新
function updateScoreBoard() {
    const scoreBoard = document.getElementById('score-board');
    scoreBoard.innerHTML = players.map(player =>
        `<div>${player.name}: ${player.score}</div>`
    ).join('');
}

// ターンを表示
function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turn-indicator');
    turnIndicator.textContent = `${players[currentPlayerIndex].name} の番です。`;
}

// クリックされたとき、問題がなければカードをめくる
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

// めくった二枚のカードがそろっているかチェック
function checkForMatch() {
    const firstCardNumber = firstCard.dataset.card.split('_')[0];
    const secondCardNumber = secondCard.dataset.card.split('_')[0];
    const isMatch = firstCardNumber === secondCardNumber;

    if (isMatch) {
        players[currentPlayerIndex].score++;
        updateScoreBoard();
        disableCards();

        // 現在のプレイヤーがコンピュータの場合、再度コンピュータのターンを行う
        if (players[currentPlayerIndex].name === 'コンピュータ') {
            setTimeout(computerTurn, 1500); // 揃えた場合も1.5秒待つ
        }
    } else {
        unflipCards();
        nextPlayer();
    }
}

function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setTimeout(() => {
        updateTurnIndicator();
    }, 1000);

    if (players[currentPlayerIndex].name === 'コンピュータ') {
        setTimeout(computerTurn, 1000);
    }
    
}

// コンピュータの行動
function computerTurn() {
    lockBoard = true;
    setTimeout(() => {
        const allCards = Array.from(document.querySelectorAll('.card:not(.matched):not(.flipped)'));

        let cardToFlip = [];
        // 記憶の中で揃えることができるカードを探す
        for (let cardName in computerMemory) {
            if (computerMemory[cardName].length >= 2) {
                // 2枚目のカードが揃うまで選ぶ
                cardToFlip = computerMemory[cardName].slice(0, 2).map(index => allCards.find(card => card.dataset.index == index));
                break;
            }
        }

        // 記憶にない場合はランダムにカードを選択
        if (!cardToFlip || cardToFlip.length < 2) {
            const remainingCards = allCards.filter(card => !computerMemory[card.dataset.card]);
            cardToFlip = remainingCards.sort(() => 0.5 - Math.random()).slice(0, 2);
            
            // 記憶にカードを追加
            cardToFlip.forEach(card => {
                const cardName = card.dataset.card;
                if (!computerMemory[cardName]) {
                    computerMemory[cardName] = [];
                }
                computerMemory[cardName].push(card.dataset.index);
            });
        }

        // 実際にカードをめくる
        cardToFlip.forEach(card => card.classList.add('flipped'));
        [firstCard, secondCard] = cardToFlip;
        checkForMatch();
    }, 1000);
}


// そろったカードをめくった状態のままにする
function disableCards() {
    lockBoard = true;
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    // 記憶から削除
    delete computerMemory[firstCard.dataset.card];
    delete computerMemory[secondCard.dataset.card];

    // 時間をおいて非表示にする
    setTimeout(() => {
        firstCard.style.visibility = 'hidden';
        secondCard.style.visibility = 'hidden';

        resetBoard();
        checkGameOver(); // 非表示にしてからゲームオーバーの確認を行う
    }, 1500);
}

// そろわなかったカードを元に戻す
function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

// ボードの状態を初期化
function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// ゲームオーバーを確認
function checkGameOver() {
    const allMatched = document.querySelectorAll('.card.matched').length === cards.length;
    if (allMatched) {
        setTimeout(() => {
            alert('ゲーム終了！' + (players[0].score > players[1].score ? 'あなたの勝ちです！' : 'コンピュータの勝ちです！'));
        }, 500);
    }
}

// 戻るボタンが押されたらタイトルに戻る
document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('title-screen').classList.add('active');
    resetGame();
});

function resetGame() {
    players.forEach(player => player.score = 0);
    currentPlayerIndex = 0;
    updateScoreBoard();
    updateTurnIndicator();
}
