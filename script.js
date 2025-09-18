class InfiniteTicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.moveHistory = [];
        this.isPlayerTurn = true;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.maxPieces = 3;

        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        // Cell clicks
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Button clicks
        document.getElementById('reset-round-btn').addEventListener('click', () => this.resetRound());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.newGame());
    }

    handleCellClick(index) {
        if (!this.isPlayerTurn || this.board[index] !== '' || this.gameOver) {
            return;
        }

        this.makePlayerMove(index);
    }

    makePlayerMove(index) {
        // Handle player piece limit before making the move
        if (this.countSymbols('X') >= this.maxPieces) {
            const oldestIndex = this.getOldestMoveIndex('X');
            if (oldestIndex !== null) {
                this.removeOldestPiece(oldestIndex, 'X');
            }
        }

        this.makeMove(index, 'X');
    }

    makeMove(index, symbol) {
        this.board[index] = symbol;
        this.moveHistory.push({ index, symbol, timestamp: Date.now() });

        // Update visual display
        this.updateCellDisplay(index, symbol);
        this.updatePiecesCounter();

        // Check for winner immediately after the move
        if (this.checkWinner(symbol)) {
            this.handleRoundWin(symbol);
            return;
        }

        // Toggle turn and continue if no winner
        this.isPlayerTurn = symbol === 'O'; // Set turn based on who just moved
        this.updateTurnIndicator();
        this.updateStatusMessage();

        // Trigger AI move if it's AI's turn
        if (!this.isPlayerTurn && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 500);
        }
    }

    makeAIMove() {
        if (this.gameOver || this.isPlayerTurn) return;

        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null)
                                         .filter(index => index !== null);

        if (availableMoves.length === 0) return;

        // Handle AI piece limit before making the move
        if (this.countSymbols('O') >= this.maxPieces) {
            const oldestIndex = this.getOldestMoveIndex('O');
            if (oldestIndex !== null) {
                this.removeOldestPiece(oldestIndex, 'O');
            }
        }

        // Find the best move using strategy
        let moveIndex;

        // 1. Try to win
        moveIndex = this.findWinningMove('O');
        if (moveIndex !== null) {
            this.makeMove(moveIndex, 'O');
            return;
        }

        // 2. Try to block player from winning
        moveIndex = this.findWinningMove('X');
        if (moveIndex !== null) {
            this.makeMove(moveIndex, 'O');
            return;
        }

        // 3. Take center if available
        if (this.board[4] === '') {
            this.makeMove(4, 'O');
            return;
        }

        // 4. Take corners
        const corners = [0, 2, 6, 8].filter(index => this.board[index] === '');
        if (corners.length > 0) {
            const randomCorner = corners[Math.floor(Math.random() * corners.length)];
            this.makeMove(randomCorner, 'O');
            return;
        }

        // 5. Take any available move
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        this.makeMove(randomMove, 'O');
    }

    findWinningMove(symbol) {
        for (const combo of this.winningCombinations) {
            const symbols = combo.map(index => this.board[index]);
            const symbolCount = symbols.filter(s => s === symbol).length;
            const emptyCount = symbols.filter(s => s === '').length;

            if (symbolCount === 2 && emptyCount === 1) {
                return combo[symbols.indexOf('')];
            }
        }
        return null;
    }

    countSymbols(symbol) {
        return this.board.filter(cell => cell === symbol).length;
    }

    getOldestMoveIndex(symbol) {
        // Find the oldest move for the given symbol
        const symbolMoves = this.moveHistory.filter(move => move.symbol === symbol);
        return symbolMoves.length > 0 ? symbolMoves[0].index : null;
    }

    removeOldestPiece(index, symbol) {
        this.board[index] = '';
        this.moveHistory = this.moveHistory.filter(move => move.index !== index);

        // Add fade-out animation
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.classList.add('old');

        setTimeout(() => {
            this.updateCellDisplay(index, '');
            cell.classList.remove('old');
        }, 300);
    }

    checkWinner(symbol) {
        return this.winningCombinations.some(combo =>
            combo.every(index => this.board[index] === symbol)
        );
    }

    handleRoundWin(symbol) {
        const winningCombo = this.winningCombinations.find(combo =>
            combo.every(index => this.board[index] === symbol)
        );

        if (winningCombo) {
            this.showWinningLine(winningCombo);
        }

        if (symbol === 'X') {
            this.playerScore++;
            this.updateStatusMessage('You Win This Round!');

            if (this.playerScore >= 3) {
                this.updateStatusMessage('You Win The Game!');
                this.gameOver = true;
                setTimeout(() => this.showGameOverModal('You Win The Game!'), 1500);
                return;
            }
        } else {
            this.aiScore++;
            this.updateStatusMessage('AI Wins This Round!');

            if (this.aiScore >= 3) {
                this.updateStatusMessage('AI Wins The Game!');
                this.gameOver = true;
                setTimeout(() => this.showGameOverModal('AI Wins The Game!'), 1500);
                return;
            }
        }

        this.updateScoreDisplay();

        // Reset board after a delay but continue the game
        setTimeout(() => {
            this.resetRound();
        }, 1500);
    }

    showWinningLine(combo) {
        const cells = document.querySelectorAll('.cell');
        const firstCell = cells[combo[0]];
        const lastCell = cells[combo[2]];
        const winningLine = document.getElementById('winning-line');

        const rect1 = firstCell.getBoundingClientRect();
        const rect2 = lastCell.getBoundingClientRect();
        const containerRect = document.querySelector('.game-board').getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - containerRect.left;
        const y1 = rect1.top + rect1.height / 2 - containerRect.top;
        const x2 = rect2.left + rect2.width / 2 - containerRect.left;
        const y2 = rect2.top + rect2.height / 2 - containerRect.top;

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        winningLine.style.width = `${length}px`;
        winningLine.style.height = '4px';
        winningLine.style.left = `${x1}px`;
        winningLine.style.top = `${y1}px`;
        winningLine.style.transform = `rotate(${angle}deg)`;
        winningLine.style.transformOrigin = '0 50%';
        winningLine.classList.add('show');

        setTimeout(() => {
            winningLine.classList.remove('show');
        }, 1500);
    }

    resetRound() {
        this.board = Array(9).fill('');
        this.moveHistory = [];

        // Keep the same turn sequence as before the reset
        this.updateDisplay();
        this.updateStatusMessage();

        // If it's AI's turn, trigger AI move immediately
        if (!this.isPlayerTurn && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 500);
        }
    }

    newGame() {
        this.board = Array(9).fill('');
        this.moveHistory = [];
        this.isPlayerTurn = true;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;

        this.hideGameOverModal();
        this.updateDisplay();
        this.updateScoreDisplay();
        this.updateStatusMessage();
        this.updateTurnIndicator();
        this.updatePiecesCounter();
    }

    updateDisplay() {
        // Update all cells
        document.querySelectorAll('.cell').forEach((cell, index) => {
            this.updateCellDisplay(index, this.board[index]);
        });
    }

    updateCellDisplay(index, symbol) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = symbol;
        cell.className = 'cell';

        if (symbol === 'X') {
            cell.classList.add('x');
        } else if (symbol === 'O') {
            cell.classList.add('o');
        }

        if (symbol !== '') {
            cell.classList.add('new');
            setTimeout(() => cell.classList.remove('new'), 300);
        }
    }

    updateStatusMessage(message = null) {
        const statusElement = document.getElementById('status-message');

        if (message) {
            statusElement.textContent = message;
        } else {
            statusElement.textContent = this.isPlayerTurn ? 'Your Turn (X)' : 'AI Turn (O)';
        }
    }

    updateTurnIndicator() {
        const playerIndicator = document.getElementById('player-indicator');
        const aiIndicator = document.getElementById('ai-indicator');

        playerIndicator.classList.toggle('active', this.isPlayerTurn);
        aiIndicator.classList.toggle('active', !this.isPlayerTurn);

        // Add pulse animation to active indicator
        if (this.isPlayerTurn) {
            playerIndicator.classList.add('pulse');
            aiIndicator.classList.remove('pulse');
        } else {
            aiIndicator.classList.add('pulse');
            playerIndicator.classList.remove('pulse');
        }
    }

    updateScoreDisplay() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
    }

    updatePiecesCounter() {
        document.getElementById('player-pieces').textContent = this.countSymbols('X');
        document.getElementById('ai-pieces').textContent = this.countSymbols('O');
    }

    showGameOverModal(message) {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('modal-title');
        const messageElement = document.getElementById('modal-message');
        const finalPlayerScore = document.getElementById('final-player-score');
        const finalAiScore = document.getElementById('final-ai-score');

        title.textContent = this.playerScore > this.aiScore ? 'Victory!' : 'Game Over!';
        messageElement.textContent = message;
        finalPlayerScore.textContent = this.playerScore;
        finalAiScore.textContent = this.aiScore;

        modal.classList.add('show');
    }

    hideGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        modal.classList.remove('show');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InfiniteTicTacToe();
});