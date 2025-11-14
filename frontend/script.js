
// User Management System with MySQL Backend
class UserManager {
    constructor() {
        this.currentUser = null;
        this.initializeUserSystem();
    }
    
    async initializeUserSystem() {
        // Check if user has a valid token
        try {
            const response = await api.verifyToken();
            if (response.success && response.user) {
                this.currentUser = response.user;
                this.showUserInfo();
            } else {
                this.showAuthButtons();
            }
        } catch (error) {
            console.log('No valid session found or backend not available:', error.message);
            this.showAuthButtons();
        }
        
        this.initializeAuthEventListeners();
    }
    
    initializeAuthEventListeners() {
        // Auth buttons
        document.getElementById('login-btn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('register-btn').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('view-stats-btn').addEventListener('click', () => this.showStatsModal());
        
        // Modal controls
        document.getElementById('close-auth').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('close-stats').addEventListener('click', () => this.hideStatsModal());
        document.getElementById('auth-switch-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
        
        // Form submission
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit();
        });
        
        // Reset stats
        document.getElementById('reset-stats-btn').addEventListener('click', () => this.resetStats());
        
        // Close modals on outside click
        document.getElementById('auth-modal').addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') this.hideAuthModal();
        });
        document.getElementById('stats-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stats-modal') this.hideStatsModal();
        });
    }
    
    showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');
        const emailGroup = document.getElementById('email-group');
        const confirmPasswordGroup = document.getElementById('confirm-password-group');
        
        if (mode === 'login') {
            title.textContent = 'Login';
            submitBtn.textContent = 'Login';
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = 'Register here';
            emailGroup.style.display = 'none';
            confirmPasswordGroup.style.display = 'none';
            document.getElementById('email').required = false;
            document.getElementById('confirm-password').required = false;
        } else {
            title.textContent = 'Register';
            submitBtn.textContent = 'Register';
            switchText.textContent = 'Already have an account?';
            switchLink.textContent = 'Login here';
            emailGroup.style.display = 'block';
            confirmPasswordGroup.style.display = 'block';
            document.getElementById('email').required = true;
            document.getElementById('confirm-password').required = true;
        }
        
        modal.dataset.mode = mode;
        modal.style.display = 'flex';
        document.getElementById('username').focus();
    }
    
    hideAuthModal() {
        document.getElementById('auth-modal').style.display = 'none';
        this.clearAuthForm();
        this.clearMessages();
    }
    
    async showStatsModal() {
        if (!this.currentUser) return;
        
        try {
            const response = await api.getStats();
            if (response.success) {
                const stats = response.stats;
                const winRate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
                
                document.getElementById('total-games').textContent = stats.totalGames;
                document.getElementById('total-wins').textContent = stats.totalWins;
                document.getElementById('win-rate').textContent = winRate + '%';
                document.getElementById('best-streak').textContent = stats.bestStreak;
                document.getElementById('easy-wins').textContent = `${stats.easyWins}/${stats.easyGames}`;
                document.getElementById('medium-wins').textContent = `${stats.mediumWins}/${stats.mediumGames}`;
                document.getElementById('hard-wins').textContent = `${stats.hardWins}/${stats.hardGames}`;
                document.getElementById('total-playtime').textContent = this.formatPlaytime(stats.totalPlaytime);
                
                document.getElementById('stats-modal').style.display = 'flex';
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            this.showMessage('Failed to load statistics', 'error');
        }
    }
    
    hideStatsModal() {
        document.getElementById('stats-modal').style.display = 'none';
    }
    
    toggleAuthMode() {
        const modal = document.getElementById('auth-modal');
        const currentMode = modal.dataset.mode;
        this.showAuthModal(currentMode === 'login' ? 'register' : 'login');
    }
    
    async handleAuthSubmit() {
        const mode = document.getElementById('auth-modal').dataset.mode;
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        this.clearMessages();
        
        if (mode === 'register') {
            if (password !== confirmPassword) {
                this.showMessage('Passwords do not match!', 'error');
                return;
            }
            if (password.length < 6) {
                this.showMessage('Password must be at least 6 characters long!', 'error');
                return;
            }
            await this.register(username, email, password);
        } else {
            await this.login(username, password);
        }
    }
    
    async register(username, email, password) {
        try {
            const response = await api.register(username, email, password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.showMessage('Registration successful!', 'success');
                setTimeout(() => {
                    this.hideAuthModal();
                    this.showUserInfo();
                }, 1500);
            }
        } catch (error) {
            this.showMessage(error.message || 'Registration failed', 'error');
        }
    }
    
    async login(username, password) {
        try {
            const response = await api.login(username, password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.showMessage('Login successful!', 'success');
                setTimeout(() => {
                    this.hideAuthModal();
                    this.showUserInfo();
                }, 1500);
            }
        } catch (error) {
            this.showMessage(error.message || 'Login failed', 'error');
        }
    }
    
    logout() {
        api.logout();
        this.currentUser = null;
        this.showAuthButtons();
        
        // Reset game scores when logging out
        if (window.ticTacToe) {
            window.ticTacToe.scores = { X: 0, O: 0, draws: 0 };
            window.ticTacToe.updateScoreDisplay();
        }
    }
    
    showUserInfo() {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('current-user-name').textContent = this.currentUser.username;
    }
    
    showAuthButtons() {
        document.getElementById('auth-buttons').style.display = 'flex';
        document.getElementById('user-info').style.display = 'none';
    }
    
    async updateUserStats(gameResult, difficulty, playtime) {
        if (!this.currentUser) return;
        
        try {
            const response = await api.updateStats(gameResult, difficulty, playtime);
            if (response.success) {
                // Update local user stats
                this.currentUser.stats = response.stats;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    formatPlaytime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    async resetStats() {
        if (!this.currentUser) return;
        
        if (confirm('Are you sure you want to reset all your statistics? This action cannot be undone.')) {
            try {
                const response = await api.resetStats();
                if (response.success) {
                    this.currentUser.stats = response.stats;
                    this.showStatsModal(); // Refresh the display
                }
            } catch (error) {
                console.error('Error resetting stats:', error);
                alert('Failed to reset statistics');
            }
        }
    }
    
    showMessage(text, type) {
        this.clearMessages();
        
        const message = document.createElement('div');
        message.className = `message ${type}-message`;
        message.textContent = text;
        
        const form = document.getElementById('auth-form');
        form.insertBefore(message, form.firstChild);
    }
    
    clearMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }
    
    clearAuthForm() {
        document.getElementById('auth-form').reset();
    }
}

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameMode = 'human-vs-computer';
        this.difficulty = 'medium';
        this.gameActive = false;
        this.scores = { X: 0, O: 0, draws: 0 };
        this.isComputerTurn = false;
        this.gameStartTime = null;
        
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];
        
        this.initializeEventListeners();
        this.updateScoreDisplay();
    }
    
    initializeEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.gameMode = e.target.id;
            });
        });
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.id;
            });
        });
        
        // Game controls
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('play-again').addEventListener('click', () => this.playAgain());
        
        // Board clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
    }
    
    startGame() {
        document.querySelector('.game-setup').style.display = 'none';
        document.querySelector('.game-area').style.display = 'block';
        this.gameActive = true;
        this.gameStartTime = Date.now();
        this.resetBoard();
        this.updatePlayerIndicator();
        
        if (this.gameMode === 'computer-vs-computer') {
            this.startComputerVsComputer();
        }
    }
    
    resetGame() {
        this.resetBoard();
        this.gameActive = true;
        this.currentPlayer = 'X';
        this.gameStartTime = Date.now();
        this.updatePlayerIndicator();
        
        if (this.gameMode === 'computer-vs-computer') {
            this.startComputerVsComputer();
        }
    }
    
    newGame() {
        document.querySelector('.game-setup').style.display = 'block';
        document.querySelector('.game-area').style.display = 'none';
        this.resetBoard();
        this.gameActive = false;
    }
    
    playAgain() {
        document.getElementById('game-result').style.display = 'none';
        this.resetGame();
    }
    
    resetBoard() {
        this.board = Array(9).fill('');
        this.isComputerTurn = false;
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        document.querySelector('.winning-line').classList.remove('show');
        document.querySelector('.winning-line').style.cssText = '';
    }
    
    handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        
        if (!this.gameActive || this.board[index] !== '' || this.isComputerTurn) {
            return;
        }
        
        if (this.gameMode === 'human-vs-computer') {
            // Only allow human player (X) to click
            if (this.currentPlayer === 'X') {
                this.makeMove(index, this.currentPlayer);
            }
        }
    }
    
    makeMove(index, player) {
        this.board[index] = player;
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        
        const winResult = this.checkWinner();
        if (winResult) {
            this.highlightWinningCells(winResult.combination);
            this.endGame(winResult.winner);
            return;
        }
        
        if (this.board.every(cell => cell !== '')) {
            this.endGame('draw');
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updatePlayerIndicator();
        
        // Handle computer moves
        if (this.gameMode === 'human-vs-computer' && this.currentPlayer === 'O') {
            this.isComputerTurn = true;
            setTimeout(() => this.makeComputerMove(), 800);
        }
    }
    makeComputerMove() {
        if (!this.gameActive) return;
        
        let move;
        switch (this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getMediumMove();
                break;
            case 'hard':
                move = this.getHardMove();
                break;
        }
        
        if (move !== -1) {
            // Add thinking animation
            const cell = document.querySelector(`[data-index="${move}"]`);
            cell.classList.add('computer-thinking');
            
            setTimeout(() => {
                cell.classList.remove('computer-thinking');
                this.makeMove(move, this.currentPlayer);
                this.isComputerTurn = false;
            }, 500);
        }
    }
    
    getRandomMove() {
        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null)
                                      .filter(val => val !== null);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    getMediumMove() {
        // 70% chance to play optimally, 30% random
        if (Math.random() < 0.7) {
            return this.getHardMove();
        }
        return this.getRandomMove();
    }
    
    getHardMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = this.currentPlayer;
                const winResult = this.checkWinner();
                if (winResult && winResult.winner === this.currentPlayer) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Try to block opponent
        const opponent = this.currentPlayer === 'X' ? 'O' : 'X';
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = opponent;
                const winResult = this.checkWinner();
                if (winResult && winResult.winner === opponent) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        
        // Take center if available
        if (this.board[4] === '') {
            return 4;
        }
        
        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => this.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available move
        return this.getRandomMove();
    }
    
    checkWinner() {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return { winner: this.board[a], combination: combination };
            }
        }
        return null;
    }
    
    highlightWinningCells(combination) {
        combination.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning');
        });
        this.drawWinningLine(combination);
    }
    
    drawWinningLine(combination) {
        const line = document.querySelector('.winning-line');
        const [a, b, c] = combination;
        
        // Calculate line position and rotation
        let lineStyle = '';
        
        if (a === 0 && b === 1 && c === 2) { // Top row
            lineStyle = 'top: 58px; left: 8px; width: 308px; transform: rotate(0deg);';
        } else if (a === 3 && b === 4 && c === 5) { // Middle row
            lineStyle = 'top: 166px; left: 8px; width: 308px; transform: rotate(0deg);';
        } else if (a === 6 && b === 7 && c === 8) { // Bottom row
            lineStyle = 'top: 274px; left: 8px; width: 308px; transform: rotate(0deg);';
        } else if (a === 0 && b === 3 && c === 6) { // Left column
            lineStyle = 'top: 8px; left: 58px; width: 308px; transform: rotate(90deg);';
        } else if (a === 1 && b === 4 && c === 7) { // Middle column
            lineStyle = 'top: 8px; left: 166px; width: 308px; transform: rotate(90deg);';
        } else if (a === 2 && b === 5 && c === 8) { // Right column
            lineStyle = 'top: 8px; left: 274px; width: 308px; transform: rotate(90deg);';
        } else if (a === 0 && b === 4 && c === 8) { // Diagonal \
            lineStyle = 'top: 8px; left: 8px; width: 435px; transform: rotate(45deg); transform-origin: 0 50%;';
        } else if (a === 2 && b === 4 && c === 6) { // Diagonal /
            lineStyle = 'top: 8px; right: 8px; width: 435px; transform: rotate(-45deg); transform-origin: 100% 50%;';
        }
        
        line.style.cssText = lineStyle;
        line.classList.add('show');
    }
    
    endGame(winner) {
        this.gameActive = false;
        const gameEndTime = Date.now();
        const playtime = Math.floor((gameEndTime - this.gameStartTime) / 1000);
        
        // Update local scores
        if (winner === 'draw') {
            this.scores.draws++;
            this.showResult('It\'s a Draw!', '#f39c12');
        } else {
            this.scores[winner]++;
            const winnerName = this.getPlayerName(winner);
            this.showResult(`${winnerName} Wins!`, winner === 'X' ? '#e74c3c' : '#3498db');
        }
        
        // Update user statistics if logged in and playing against computer
        if (window.userManager && window.userManager.currentUser && this.gameMode === 'human-vs-computer') {
            let gameResult;
            if (winner === 'draw') {
                gameResult = 'draw';
            } else if (winner === 'X') {
                gameResult = 'win'; // Human plays as X
            } else {
                gameResult = 'loss'; // Computer plays as O
            }
            
            window.userManager.updateUserStats(gameResult, this.difficulty, playtime);
        }
        
        this.updateScoreDisplay();
    }
    
    getPlayerName(player) {
        if (this.gameMode === 'computer-vs-computer') {
            return `Computer ${player}`;
        } else if (this.gameMode === 'human-vs-computer') {
            return player === 'X' ? 'Human' : 'Computer';
        }
        return `Player ${player}`;
    }
    
    showResult(text, color) {
        const resultElement = document.getElementById('game-result');
        const resultText = document.getElementById('result-text');
        
        resultText.textContent = text;
        resultText.style.color = color;
        
        // Create confetti effect for wins
        if (text.includes('Wins')) {
            this.createConfetti();
        }
        
        resultElement.style.display = 'flex';
    }
    
    createConfetti() {
        const confettiContainer = document.querySelector('.result-animation');
        const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confettiContainer.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 50);
        }
    }
    
    updatePlayerIndicator() {
        const indicator = document.getElementById('player-indicator');
        const playerName = this.getPlayerName(this.currentPlayer);
        indicator.textContent = `${playerName}'s Turn`;
        indicator.style.color = this.currentPlayer === 'X' ? '#e74c3c' : '#3498db';
    }
    
    updateScoreDisplay() {
        document.getElementById('x-score').textContent = this.scores.X;
        document.getElementById('o-score').textContent = this.scores.O;
        document.getElementById('draw-score').textContent = this.scores.draws;
    }
    
    startComputerVsComputer() {
        if (!this.gameActive) return;
        
        setTimeout(() => {
            if (this.gameActive && this.board.every(cell => cell === '' || this.board.indexOf('') !== -1)) {
                this.isComputerTurn = true;
                this.makeComputerMove();
                
                // Continue the computer vs computer game
                if (this.gameActive) {
                    setTimeout(() => this.startComputerVsComputer(), 1500);
                }
            }
        }, 1000);
    }
}

// Initialize the game and user system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
    window.ticTacToe = new TicTacToe();
});
            