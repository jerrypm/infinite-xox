class InfiniteTicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.moveHistory = [];
        this.isPlayerTurn = true;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.maxPieces = 3;
        this.isProcessingMove = false;
        this.roundCount = 0;
        this.playerStartedLastRound = true;

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
        // Enhanced validation for infinite tic-tac-toe
        if (!this.isPlayerTurn || this.board[index] !== '' || this.gameOver) {
            return;
        }

        // Prevent rapid clicking during animations
        if (this.isProcessingMove) {
            return;
        }

        this.makePlayerMove(index);
    }

    makePlayerMove(index) {
        // In infinite tic-tac-toe: move oldest piece to new position when placing 4th piece
        if (this.countSymbols('X') === this.maxPieces) {
            const oldestIndex = this.getOldestMoveIndex('X');
            if (oldestIndex !== null) {
                this.moveOldestPiece(oldestIndex, index, 'X');
                return;
            }
        }

        this.makeMove(index, 'X');
    }

    makeMove(index, symbol) {
        // Validate move is legal
        if (this.gameOver || this.isProcessingMove) return;

        // Validate it's the correct player's turn
        if ((symbol === 'X' && !this.isPlayerTurn) || (symbol === 'O' && this.isPlayerTurn)) {
            console.warn('Invalid move: not player\'s turn');
            return;
        }

        this.isProcessingMove = true;

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

        // Check for draw (rare in infinite tic-tac-toe but possible)
        if (this.isDraw()) {
            this.isProcessingMove = false;
            this.handleDraw();
            return;
        }

        // Toggle turn and continue if no winner
        this.isPlayerTurn = !this.isPlayerTurn;
        this.updateTurnIndicator();
        this.updateStatusMessage();

        this.isProcessingMove = false;

        // Trigger AI move if it's AI's turn
        if (!this.isPlayerTurn && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 300);
        }
    }

    makeAIMove() {
        if (this.gameOver || this.isPlayerTurn || this.isProcessingMove) return;

        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null)
                                         .filter(index => index !== null);

        if (availableMoves.length === 0) {
            // If no moves available but game isn't over, switch turns
            this.isPlayerTurn = true;
            this.updateTurnIndicator();
            this.updateStatusMessage();
            return;
        }

        // Find the best move using enhanced strategy with timeout protection
        let moveIndex;
        try {
            moveIndex = this.findBestAIMove(availableMoves);
            if (moveIndex === null || !availableMoves.includes(moveIndex)) {
                // Fallback to random move if AI strategy fails
                moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            }
        } catch (error) {
            // If AI fails to find a move, pick random
            moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        // In infinite tic-tac-toe: move oldest piece to new position when placing 4th piece
        if (this.countSymbols('O') === this.maxPieces) {
            const oldestIndex = this.getOldestMoveIndex('O');
            if (oldestIndex !== null) {
                this.moveOldestPiece(oldestIndex, moveIndex, 'O');
                return;
            }
        }

        this.makeMove(moveIndex, 'O');
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

    findBestAIMove(availableMoves) {
        // 1. Try to win immediately
        let moveIndex = this.findWinningMove('O');
        if (moveIndex !== null && availableMoves.includes(moveIndex)) {
            return moveIndex;
        }

        // 2. Block player from winning
        moveIndex = this.findWinningMove('X');
        if (moveIndex !== null && availableMoves.includes(moveIndex)) {
            return moveIndex;
        }

        // 3. Look for moves that create multiple winning opportunities (fork)
        moveIndex = this.findForkingMove('O', availableMoves);
        if (moveIndex !== null) {
            return moveIndex;
        }

        // 4. Block player's forking attempts
        moveIndex = this.findForkingMove('X', availableMoves);
        if (moveIndex !== null) {
            return moveIndex; // Block the fork
        }

        // 5. Take center if available and strategically valuable
        if (availableMoves.includes(4)) {
            return 4;
        }

        // 6. Take strategic corners
        const strategicCorners = this.getStrategicCorners(availableMoves);
        if (strategicCorners.length > 0) {
            return strategicCorners[Math.floor(Math.random() * strategicCorners.length)];
        }

        // 7. Take any available move
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    findForkingMove(symbol, availableMoves) {
        for (const move of availableMoves) {
            // Simulate the move
            this.board[move] = symbol;

            // Count how many ways this move creates to win
            let winningWays = 0;
            for (const combo of this.winningCombinations) {
                const symbols = combo.map(index => this.board[index]);
                const symbolCount = symbols.filter(s => s === symbol).length;
                const emptyCount = symbols.filter(s => s === '').length;

                if (symbolCount === 2 && emptyCount === 1) {
                    winningWays++;
                }
            }

            // Undo the simulation
            this.board[move] = '';

            // If this move creates 2 or more ways to win, it's a fork
            if (winningWays >= 2) {
                return move;
            }
        }
        return null;
    }

    getStrategicCorners(availableMoves) {
        const corners = [0, 2, 6, 8].filter(index => availableMoves.includes(index));

        // Prioritize corners that are opposite to player's pieces
        const strategicCorners = [];
        const playerCorners = [0, 2, 6, 8].filter(index => this.board[index] === 'X');

        for (const corner of corners) {
            const oppositeCorner = this.getOppositeCorner(corner);
            if (playerCorners.includes(oppositeCorner)) {
                strategicCorners.push(corner);
            }
        }

        return strategicCorners.length > 0 ? strategicCorners : corners;
    }

    getOppositeCorner(corner) {
        const opposites = { 0: 8, 2: 6, 6: 2, 8: 0 };
        return opposites[corner];
    }

    countSymbols(symbol) {
        return this.board.filter(cell => cell === symbol).length;
    }

    getOldestMoveIndex(symbol) {
        // Find the oldest move for the given symbol
        const symbolMoves = this.moveHistory.filter(move => move.symbol === symbol);
        return symbolMoves.length > 0 ? symbolMoves[0].index : null;
    }

    moveOldestPiece(fromIndex, toIndex, symbol) {
        this.isProcessingMove = true;

        // Update board state - remove from old position and place at new position
        this.board[fromIndex] = '';
        this.board[toIndex] = symbol;

        // Update move history - remove oldest move and add new move
        const symbolMoves = this.moveHistory.filter(move => move.symbol === symbol);
        if (symbolMoves.length > 0) {
            const oldestMove = symbolMoves[0];
            const moveIndex = this.moveHistory.findIndex(move =>
                move.index === oldestMove.index &&
                move.symbol === oldestMove.symbol &&
                move.timestamp === oldestMove.timestamp
            );
            if (moveIndex !== -1) {
                this.moveHistory.splice(moveIndex, 1);
            }
        }

        // Add new move to history
        this.moveHistory.push({ index: toIndex, symbol, timestamp: Date.now() });

        // Visual feedback for movement
        const fromCell = document.querySelector(`[data-index="${fromIndex}"]`);

        // Add moving animation to indicate piece is being moved
        if (fromCell) {
            fromCell.classList.add('moving');
            setTimeout(() => {
                fromCell.classList.remove('moving');
                fromCell.classList.add('fade-out');
                setTimeout(() => {
                    this.updateCellDisplay(fromIndex, '');
                    fromCell.classList.remove('fade-out');
                }, 150);
            }, 300);
        }

        setTimeout(() => {
            this.updateCellDisplay(toIndex, symbol);
            this.updatePiecesCounter();

            // Check for winner after move
            if (this.checkWinner(symbol)) {
                this.handleRoundWin(symbol);
                return;
            }

            // Check for draw
            if (this.isDraw()) {
                this.isProcessingMove = false;
                this.handleDraw();
                return;
            }

            // Toggle turn
            this.isPlayerTurn = !this.isPlayerTurn;
            this.updateTurnIndicator();
            this.updateStatusMessage();
            this.isProcessingMove = false;

            // Trigger AI move if it's AI's turn
            if (!this.isPlayerTurn && !this.gameOver) {
                setTimeout(() => {
                    this.makeAIMove();
                }, 300);
            }
        }, 200);
    }

    removeOldestPiece(index, symbol) {
        // Immediately update board state
        this.board[index] = '';

        // Only remove the specific oldest move for this symbol
        const symbolMoves = this.moveHistory.filter(move => move.symbol === symbol);
        if (symbolMoves.length > 0) {
            const oldestMove = symbolMoves[0];
            const moveIndex = this.moveHistory.findIndex(move =>
                move.index === oldestMove.index &&
                move.symbol === oldestMove.symbol &&
                move.timestamp === oldestMove.timestamp
            );
            if (moveIndex !== -1) {
                this.moveHistory.splice(moveIndex, 1);
            }
        }

        // Add visual fade out effect
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('fade-out');
            setTimeout(() => {
                this.updateCellDisplay(index, '');
                cell.classList.remove('fade-out');
            }, 200);
        } else {
            this.updateCellDisplay(index, '');
        }
    }

    checkWinner(symbol) {
        return this.winningCombinations.some(combo =>
            combo.every(index => this.board[index] === symbol)
        );
    }

    isDraw() {
        // In infinite tic-tac-toe, a true draw is very rare
        // It occurs when both players have 3 pieces and no winning moves are possible
        if (this.countSymbols('X') === 3 && this.countSymbols('O') === 3) {
            const emptyCells = this.board.filter(cell => cell === '').length;
            if (emptyCells === 3) {
                // Check if any player can win in the next few moves
                return !this.canAnyoneWin();
            }
        }
        return false;
    }

    canAnyoneWin() {
        // Simulate a few moves ahead to see if anyone can win
        const emptyIndices = this.board.map((cell, index) => cell === '' ? index : null)
                                      .filter(index => index !== null);

        for (const index of emptyIndices) {
            // Try player move
            this.board[index] = 'X';
            if (this.checkWinner('X')) {
                this.board[index] = '';
                return true;
            }
            this.board[index] = '';

            // Try AI move
            this.board[index] = 'O';
            if (this.checkWinner('O')) {
                this.board[index] = '';
                return true;
            }
            this.board[index] = '';
        }
        return false;
    }

    handleDraw() {
        this.isProcessingMove = true;
        this.updateStatusMessage('Draw! Starting new round...');
        setTimeout(() => {
            this.resetRound();
        }, 1500);
    }

    handleRoundWin(symbol) {
        // Prevent multiple win handlers from running
        if (this.gameOver) return;

        const winningCombo = this.winningCombinations.find(combo =>
            combo.every(index => this.board[index] === symbol)
        );

        if (winningCombo) {
            this.showWinningLine(winningCombo);
        }

        // Immediately mark as game over to prevent further moves
        this.isProcessingMove = true;

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
        const winningLine = document.getElementById('winning-line');
        const gameBoard = document.querySelector('.game-board');
        const boardRect = gameBoard.getBoundingClientRect();

        // Calculate grid positions (each cell is roughly 1/3 of board width/height)
        const cellWidth = boardRect.width / 3;
        const cellHeight = boardRect.height / 3;
        const gap = 8; // CSS gap between cells

        // Get grid positions for first and last cells
        const pos1 = this.getGridPosition(combo[0]);
        const pos2 = this.getGridPosition(combo[2]);

        // Calculate actual pixel positions including gaps
        const x1 = pos1.col * (cellWidth + gap) + cellWidth / 2;
        const y1 = pos1.row * (cellHeight + gap) + cellHeight / 2;
        const x2 = pos2.col * (cellWidth + gap) + cellWidth / 2;
        const y2 = pos2.row * (cellHeight + gap) + cellHeight / 2;

        // Calculate line properties
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        // Apply styles with precise positioning
        winningLine.style.position = 'absolute';
        winningLine.style.width = `${length}px`;
        winningLine.style.height = '4px';
        winningLine.style.left = `${x1}px`;
        winningLine.style.top = `${y1 - 2}px`;
        winningLine.style.transform = `rotate(${angle}deg)`;
        winningLine.style.transformOrigin = '0 50%';
        winningLine.style.zIndex = '10';
        winningLine.style.borderRadius = '2px';
        winningLine.classList.add('show');

        setTimeout(() => {
            winningLine.classList.remove('show');
        }, 1500);
    }

    getGridPosition(index) {
        return {
            row: Math.floor(index / 3),
            col: index % 3
        };
    }

    resetRound() {
        this.board = Array(9).fill('');
        this.moveHistory = [];
        this.isProcessingMove = false;
        this.roundCount++;

        // Alternate who starts each round for fairness
        if (this.roundCount % 2 === 0) {
            this.isPlayerTurn = !this.playerStartedLastRound;
        } else {
            this.isPlayerTurn = this.playerStartedLastRound;
        }

        this.playerStartedLastRound = this.isPlayerTurn;

        this.updateDisplay();
        this.updateStatusMessage();
        this.updateTurnIndicator();
        this.updatePiecesCounter();

        // If it's AI's turn, trigger AI move immediately
        if (!this.isPlayerTurn && !this.gameOver) {
            setTimeout(() => {
                this.makeAIMove();
            }, 300);
        }
    }

    newGame() {
        this.board = Array(9).fill('');
        this.moveHistory = [];
        this.isPlayerTurn = true;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.isProcessingMove = false;
        this.roundCount = 0;
        this.playerStartedLastRound = true;

        this.hideGameOverModal();
        this.updateDisplay();
        this.updateScoreDisplay();
        this.updateStatusMessage();
        this.updateTurnIndicator();
        this.updatePiecesCounter();
    }

    updateDisplay() {
        // Update all cells
        document.querySelectorAll('.cell').forEach((_, index) => {
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