# Infinite Tic-Tac-Toe

A modern web-based implementation of infinite tic-tac-toe with AI opponent, inspired by the iOS Swift version.

## Features

- **Infinite Gameplay**: Each player can only have 3 pieces on the board. When placing a 4th piece, the oldest piece disappears
- **Smart AI Opponent**: AI uses strategy to win or block player moves
- **Modern UI**: Dark theme with smooth animations and responsive design
- **Score Tracking**: First to win 3 rounds wins the game
- **Visual Feedback**: Winning line animations, piece counters, and turn indicators

## How to Play

1. You play as X, AI plays as O
2. Click on any empty cell to place your piece
3. Each player can only have 3 pieces on the board maximum
4. When you place a 4th piece, your oldest piece will automatically disappear
5. First to get 3 in a row wins the round
6. First to win 3 rounds wins the game

## Running the Game

### Option 1: Simple File Opening
Just open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
For the best experience, run a local server:

```bash
# Navigate to the project directory
cd /Users/jeripurnamamaulid/Documents/Web/web-infinite-xox

# Start a local server (Python 3)
python3 -m http.server 8000

# Or with Python 2
python -m SimpleHTTPServer 8000

# Or with Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## Game Logic Improvements

This web version fixes several issues from the original iOS code:

1. **Better AI Strategy**: AI now prioritizes center and corners after checking for wins/blocks
2. **Improved Turn Management**: Fixed turn switching logic to prevent confusion
3. **Enhanced Move History**: Better tracking of piece placement for infinite mechanics
4. **Visual Feedback**: Added animations and indicators for better UX

## Technical Stack

- **HTML5**: Semantic structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: Pure ES6+ without dependencies
- **Responsive Design**: Works on desktop and mobile devices

## File Structure

```
web-infinite-xox/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and animations
├── script.js           # Game logic and interactions
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Customization

The game uses CSS custom properties (variables) for easy theming. You can modify colors and styles by changing the `:root` variables in `styles.css`.

---

**Enjoy playing Infinite Tic-Tac-Toe!** 🎮# infinite-xox
