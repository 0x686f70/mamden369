// State
let games = [];
let currentGameId = null;
let players = [];
let history = [];
let mode369 = false;
let winPoints = 100;
let currentPlayerId = null;
let selectedOpponentId = null; // For 369 mode with 3+ players
let lastOpponentId = {}; // Store last opponent for each player (for quick adjust)
let editingPlayerId = null; // For editing player name
let selectedAvatar = null; // For avatar selection
let playerAvatars = []; // Track avatars for new game form
let currentAvatarButtonIndex = null; // Track which button is being edited


// Avatar colors
const avatarColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'
];

// Avatar images (cartoon style)
const avatarImages = [
    '👨', '👩', '👴', '👵', '🧔', '👱', '👲', '🧕', '👳', '🤵',
    '👸', '🤴', '🧙', '🧛', '🧝', '🧞', '🦸', '🦹', '🧑‍🎓', '🧑‍🏫'
];

// Refresh Lucide icons after dynamic content changes
function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Render avatar selection grid
function renderAvatarGrid(containerId, currentAvatar) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    avatarImages.forEach(avatar => {
        const btn = document.createElement('button');
        btn.className = 'avatar-option';
        btn.textContent = avatar;
        btn.type = 'button';

        if (avatar === currentAvatar) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            // Remove selected from all
            container.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
            // Add selected to clicked
            btn.classList.add('selected');
            // Store selected avatar
            selectedAvatar = avatar;
        };

        container.appendChild(btn);
    });
}


// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconMap[type] || 'info'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i data-lucide="x"></i>
        </button>
    `;

    container.appendChild(toast);
    refreshIcons();

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==================== CUSTOM CONFIRM DIALOG ====================
let confirmCallback = null;

function showConfirm(title, message, onConfirm, type = 'warning') {
    const modal = document.getElementById('confirm-modal');
    const iconEl = document.getElementById('confirm-icon');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const okBtn = document.getElementById('confirm-ok-btn');

    // Set icon based on type
    iconEl.className = 'confirm-icon ' + type;
    const iconMap = {
        warning: 'alert-circle',
        danger: 'trash-2',
        success: 'check-circle',
        info: 'info'
    };
    iconEl.innerHTML = `<i data-lucide="${iconMap[type] || 'alert-circle'}"></i>`;

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmCallback = onConfirm;

    // Update button style based on type
    okBtn.className = type === 'danger' ? 'btn-danger' : 'btn-confirm';
    okBtn.innerHTML = `<i data-lucide="check"></i> Xác nhận`;

    modal.classList.remove('hidden');
    refreshIcons();

    // Setup button handlers
    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
        confirmCallback = null;
    };

    okBtn.onclick = () => {
        modal.classList.add('hidden');
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
    };
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    showHomeScreen();
    setupEventListeners();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('SW registration failed:', err));
    }
});

function setupEventListeners() {
    // Win option buttons
    document.querySelectorAll('.win-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.win-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Win points input in settings
    const winPointsInput = document.getElementById('win-points-input');
    if (winPointsInput) {
        winPointsInput.addEventListener('change', () => {
            winPoints = parseInt(winPointsInput.value) || 0;
            updateWinConditionDisplay();
            saveData();
        });
    }
}

// Data persistence
function saveData() {
    localStorage.setItem('scoreApp_games', JSON.stringify(games));
    localStorage.setItem('scoreApp_currentGameId', JSON.stringify(currentGameId));
    localStorage.setItem('scoreApp_mode369', JSON.stringify(mode369));
}

function loadData() {
    const savedGames = localStorage.getItem('scoreApp_games');
    const savedCurrentGameId = localStorage.getItem('scoreApp_currentGameId');
    const savedMode = localStorage.getItem('scoreApp_mode369');

    if (savedGames) games = JSON.parse(savedGames);
    if (savedCurrentGameId) currentGameId = JSON.parse(savedCurrentGameId);
    if (savedMode) mode369 = JSON.parse(savedMode);
}

function getCurrentGame() {
    return games.find(g => g.id === currentGameId);
}

function saveCurrentGame() {
    const game = getCurrentGame();
    if (game) {
        game.players = players;
        game.history = history;
        game.winPoints = winPoints;
        game.mode369 = mode369;
        game.lastModified = Date.now();
        saveData();
    }
}

// Screen Navigation
function showHomeScreen() {
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    renderSavedGames();
    updateContinueButton();
}

function showGameScreen() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    renderPlayers();
    updateLeaderDisplay();
    updateWinConditionDisplay();
    updateModeIndicator();
}

function showHome() {
    saveCurrentGame();
    showHomeScreen();
}

function updateContinueButton() {
    const continueBtn = document.getElementById('continue-btn');
    if (games.length === 0) {
        continueBtn.classList.add('disabled');
    } else {
        continueBtn.classList.remove('disabled');
    }
}

function renderSavedGames() {
    const container = document.getElementById('saved-games-list');
    const section = document.getElementById('saved-games-section');

    if (games.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = games.map(game => `
        <div class="saved-game-item" onclick="loadGame(${game.id})">
            <div class="saved-game-info">
                <span class="saved-game-name">${game.name}</span>
                <span class="saved-game-players">${game.players.length} người chơi</span>
            </div>
            <button class="saved-game-delete" onclick="event.stopPropagation(); deleteGame(${game.id})"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');
    refreshIcons();
}

// Game Management
function startNewGame() {
    document.getElementById('new-game-modal').classList.remove('hidden');
    // Generate default game name with current date
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const gameName = `MamDen ${day}/${month}/${year}`;
    document.getElementById('game-name-input').value = gameName;

    // Initialize player avatars
    playerAvatars = [avatarImages[0], avatarImages[1]];

    // Reset player inputs
    const container = document.getElementById('players-input-list');
    container.innerHTML = `
        <div class="player-input-item">
            <input type="text" placeholder="Tên người chơi 1" class="player-name-field" maxlength="20">
            <button type="button" class="player-avatar-btn" onclick="selectPlayerAvatar(this, 0)" title="Chọn icon">
                <span class="avatar-preview">${playerAvatars[0]}</span>
            </button>
            <button class="remove-player-input" onclick="removePlayerInput(this)"><i data-lucide="x"></i></button>
        </div>
        <div class="player-input-item">
            <input type="text" placeholder="Tên người chơi 2" class="player-name-field" maxlength="20">
            <button type="button" class="player-avatar-btn" onclick="selectPlayerAvatar(this, 1)" title="Chọn icon">
                <span class="avatar-preview">${playerAvatars[1]}</span>
            </button>
            <button class="remove-player-input" onclick="removePlayerInput(this)"><i data-lucide="x"></i></button>
        </div>
    `;
    refreshIcons();

    // Reset win options
    document.querySelectorAll('.win-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.win-option[data-points="50"]').classList.add('active');
}

function closeNewGameModal() {
    document.getElementById('new-game-modal').classList.add('hidden');
}

function addPlayerInput() {
    const container = document.getElementById('players-input-list');
    const count = container.children.length + 1;
    const avatarIndex = count - 1;
    playerAvatars[avatarIndex] = avatarImages[avatarIndex % avatarImages.length];

    const div = document.createElement('div');
    div.className = 'player-input-item';
    div.innerHTML = `
        <input type="text" placeholder="Tên người chơi ${count}" class="player-name-field" maxlength="20">
        <button type="button" class="player-avatar-btn" onclick="selectPlayerAvatar(this, ${avatarIndex})" title="Chọn icon">
            <span class="avatar-preview">${playerAvatars[avatarIndex]}</span>
        </button>
        <button class="remove-player-input" onclick="removePlayerInput(this)"><i data-lucide="x"></i></button>
    `;
    container.appendChild(div);
    div.querySelector('input').focus();
    refreshIcons();
}

function removePlayerInput(btn) {
    const container = document.getElementById('players-input-list');
    if (container.children.length > 2) {
        btn.parentElement.remove();
    } else {
        showToast('Cần ít nhất 2 người chơi!', 'warning');
    }
}

function confirmNewGame() {
    // Generate default game name with current date if empty
    let gameName = document.getElementById('game-name-input').value.trim();
    if (!gameName) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        gameName = `MamDen ${day}/${month}/${year}`;
    }
    const activeWinOption = document.querySelector('.win-option.active');
    winPoints = parseInt(activeWinOption?.dataset.points || 100);

    // Get mode 369 setting
    const newGameMode369 = document.getElementById('new-game-mode-369').checked;

    // Get player names
    const playerInputs = document.querySelectorAll('.player-name-field');
    const playerNames = [];
    playerInputs.forEach((input, index) => {
        const name = input.value.trim() || `Người chơi ${index + 1}`;
        playerNames.push(name);
    });

    if (playerNames.length < 2) {
        showToast('Cần ít nhất 2 người chơi!', 'warning');
        return;
    }

    // Create new game
    const newGame = {
        id: Date.now(),
        name: gameName,
        players: playerNames.map((name, index) => ({
            id: Date.now() + index,
            name: name,
            score: 0,
            color: avatarColors[index % avatarColors.length],
            avatar: playerAvatars[index] || avatarImages[index % avatarImages.length]
        })),
        history: [],
        winPoints: winPoints,
        mode369: newGameMode369,
        createdAt: Date.now(),
        lastModified: Date.now()
    };

    games.push(newGame);
    currentGameId = newGame.id;
    players = newGame.players;
    history = newGame.history;
    mode369 = newGame.mode369;

    saveData();
    closeNewGameModal();
    showGameScreen();
}

function continueGame() {
    if (games.length === 0) return;

    // Load most recently modified game
    const sortedGames = [...games].sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    loadGame(sortedGames[0].id);
}

function loadGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    currentGameId = gameId;
    players = game.players || [];
    history = game.history || [];
    winPoints = game.winPoints || 100;
    mode369 = game.mode369 || false;

    document.getElementById('mode-369').checked = mode369;
    document.getElementById('win-points-input').value = winPoints;

    saveData();
    showGameScreen();
}

function deleteGame(gameId) {
    showConfirm('Xóa game', 'Bạn có chắc muốn xóa game này?', () => {
        games = games.filter(g => g.id !== gameId);
        if (currentGameId === gameId) {
            currentGameId = games.length > 0 ? games[0].id : null;
        }
        saveData();
        renderSavedGames();
        updateContinueButton();
        showToast('Đã xóa game', 'success');
    }, 'danger');
}

function deleteCurrentGame() {
    showConfirm('Xóa game', 'Bạn có chắc muốn xóa game hiện tại?', () => {
        games = games.filter(g => g.id !== currentGameId);
        currentGameId = null;
        saveData();
        closeSettings();
        showHomeScreen();
        showToast('Đã xóa game', 'success');
    }, 'danger');
}

function showGameList() {
    const container = document.getElementById('game-list-container');

    if (games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon"><i data-lucide="list"></i></div>
                <p>Chưa có game nào</p>
            </div>
        `;
    } else {
        container.innerHTML = games.map(game => `
            <div class="game-list-item ${game.id === currentGameId ? 'active' : ''}" onclick="loadGame(${game.id}); closeGameListModal();">
                <div class="game-list-name">${game.name}</div>
                <div class="game-list-info">${game.players.length} người chơi • ${game.winPoints > 0 ? game.winPoints + ' điểm' : 'Không giới hạn'}</div>
            </div>
        `).join('');
    }

    refreshIcons();
    document.getElementById('game-list-modal').classList.remove('hidden');
}

function closeGameListModal() {
    document.getElementById('game-list-modal').classList.add('hidden');
}

// Player management
function addPlayer() {
    document.getElementById('add-player-modal').classList.remove('hidden');
    document.getElementById('player-name-input').value = '';
    // Select first avatar as default
    selectedAvatar = avatarImages[players.length % avatarImages.length];
    renderAvatarGrid('add-player-avatar-grid', selectedAvatar);
    document.getElementById('player-name-input').focus();
}

function closeAddPlayerModal() {
    document.getElementById('add-player-modal').classList.add('hidden');
}

function confirmAddPlayer() {
    const name = document.getElementById('player-name-input').value.trim();
    if (!name) {
        showToast('Vui lòng nhập tên người chơi', 'warning');
        return;
    }

    const player = {
        id: Date.now(),
        name: name,
        score: 0,
        color: avatarColors[players.length % avatarColors.length],
        avatar: selectedAvatar || avatarImages[players.length % avatarImages.length]
    };

    players.push(player);
    saveCurrentGame();
    renderPlayers();
    updateLeaderDisplay();
    closeAddPlayerModal();

    addToHistory(`Thêm người chơi: ${name} ${player.avatar}`, 0);
}

function deletePlayer(id, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    closePlayerMenu();
    const player = players.find(p => p.id === id);
    if (!player) return;
    showConfirm('Xóa người chơi', `Bạn có chắc muốn xóa "${player.name}"?`, () => {
        players = players.filter(p => p.id !== id);
        saveCurrentGame();
        renderPlayers();
        updateLeaderDisplay();
        addToHistory(`Xóa người chơi: ${player.name}`, 0);
        showToast(`Đã xóa ${player.name}`, 'success');
    }, 'danger');
}

function editPlayerName(id) {
    closePlayerMenu();
    const player = players.find(p => p.id === id);
    if (!player) return;

    editingPlayerId = id;
    selectedAvatar = player.avatar; // Store current avatar
    document.getElementById('edit-player-name-input').value = player.name;
    renderAvatarGrid('edit-avatar-grid', player.avatar);
    document.getElementById('edit-player-modal').classList.remove('hidden');
    document.getElementById('edit-player-name-input').focus();
    document.getElementById('edit-player-name-input').select();
}

function closeEditPlayerModal() {
    document.getElementById('edit-player-modal').classList.add('hidden');
    editingPlayerId = null;
}

function confirmEditPlayerName() {
    const newName = document.getElementById('edit-player-name-input').value.trim();
    if (!newName) {
        showToast('Vui lòng nhập tên người chơi', 'warning');
        return;
    }

    const player = players.find(p => p.id === editingPlayerId);
    if (!player) return;

    const oldName = player.name;
    const oldAvatar = player.avatar;
    let changed = false;

    if (newName !== player.name) {
        player.name = newName;
        changed = true;
    }

    if (selectedAvatar && selectedAvatar !== oldAvatar) {
        player.avatar = selectedAvatar;
        changed = true;
    }

    if (!changed) {
        closeEditPlayerModal();
        return;
    }

    saveCurrentGame();
    renderPlayers();
    updateLeaderDisplay();

    if (newName !== oldName && selectedAvatar !== oldAvatar) {
        addToHistory(`Đổi: ${oldName} → ${player.name} ${selectedAvatar}`, 0);
        showToast(`Đã đổi tên & icon`, 'success');
    } else if (newName !== oldName) {
        addToHistory(`Đổi tên: ${oldName} → ${player.name}`, 0);
        showToast(`Đã đổi tên thành ${player.name}`, 'success');
    } else {
        addToHistory(`Đổi icon: ${player.name} ${selectedAvatar}`, 0);
        showToast(`Đã đổi icon`, 'success');
    }

    closeEditPlayerModal();
}

function setupSwipeGestures() {
    const cards = document.querySelectorAll('.player-card-wrapper');
    cards.forEach(wrapper => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        const card = wrapper.querySelector('.player-card');
        const menu = wrapper.querySelector('.player-card-menu');

        const handleStart = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            isDragging = true;
            card.style.transition = 'none';
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            currentX = touch.clientX - startX;

            // Chỉ cho phép swipe sang trái (giá trị âm)
            if (currentX < 0) {
                card.style.transform = `translateX(${currentX}px)`;
            }
        };

        const handleEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            card.style.transition = 'transform 0.3s ease';

            // Nếu swipe quá 80px sang trái, mở menu
            if (currentX < -80) {
                card.style.transform = 'translateX(-120px)';
                wrapper.classList.add('menu-open');
            } else {
                // Nếu không đủ, đóng menu
                card.style.transform = 'translateX(0)';
                wrapper.classList.remove('menu-open');
            }
            currentX = 0;
        };

        // Touch events
        card.addEventListener('touchstart', handleStart, { passive: true });
        card.addEventListener('touchmove', handleMove, { passive: true });
        card.addEventListener('touchend', handleEnd);

        // Mouse events for desktop testing
        card.addEventListener('mousedown', handleStart);
        card.addEventListener('mousemove', handleMove);
        card.addEventListener('mouseup', handleEnd);
        card.addEventListener('mouseleave', handleEnd);
    });
}

function closePlayerMenu() {
    document.querySelectorAll('.player-card-wrapper').forEach(wrapper => {
        const card = wrapper.querySelector('.player-card');
        wrapper.classList.remove('menu-open');
        card.style.transform = 'translateX(0)';
    });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.player-card-wrapper') && !e.target.closest('.player-card-menu')) {
        closePlayerMenu();
    }
});

// Prevent swipe when clicking on billiard balls
document.addEventListener('click', (e) => {
    if (e.target.closest('.billiard-ball') || e.target.closest('.billiard-balls-container')) {
        e.stopPropagation();
    }
});

function renderPlayers() {
    const container = document.getElementById('players-list');

    if (players.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon"><i data-lucide="users"></i></div>
                <p>Chưa có người chơi</p>
                <p>Nhấn <i data-lucide="user-plus" style="width:16px;height:16px;vertical-align:middle;"></i> để thêm người chơi</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    container.innerHTML = players.map(player => {
        const scoreDisplay = player.score >= 0 ? player.score : player.score;

        return `
            <div class="player-card-wrapper" data-player-id="${player.id}">
                <div class="player-card" data-player-id="${player.id}">
                    <div class="player-card-header">
                        <div class="player-avatar" style="background: ${player.color}">${player.avatar || player.name.charAt(0).toUpperCase()}</div>
                        <span class="player-name">${player.name}</span>
                    </div>
                    <div class="player-card-bottom">
                        <span class="player-score-large ${player.score < 0 ? 'negative' : ''}" onclick="openScoreModal(${player.id})" style="cursor: pointer;">${scoreDisplay}</span>
                        <div class="billiard-balls-container" onclick="event.stopPropagation();">
                            <button class="billiard-ball ball-3" onclick="billiardBallClick(${player.id}, 1, event)" title="1 điểm" type="button"></button>
                            <button class="billiard-ball ball-6" onclick="billiardBallClick(${player.id}, 2, event)" title="2 điểm" type="button"></button>
                            <button class="billiard-ball ball-9" onclick="billiardBallClick(${player.id}, 3, event)" title="3 điểm" type="button"></button>
                            <button class="billiard-ball ball-cham" onclick="diCham(${player.id}, event)" title="Đi chấm" type="button">🎯</button>
                        </div>
                    </div>
                </div>
                <div class="player-card-menu">
                    <button class="menu-btn menu-edit" onclick="editPlayerName(${player.id})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="menu-btn menu-delete" onclick="deletePlayer(${player.id}, event)">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    refreshIcons();
    setupSwipeGestures();
}

function billiardBallClick(playerId, points, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // If mode 369 with 3+ players, show quick opponent selector
    if (mode369 && players.length > 2) {
        showQuickOpponentSelector(playerId, points);
    } else {
        // Direct action for 2 players or normal mode
        applyScoreChange(playerId, points, null);
    }
}

function showQuickOpponentSelector(playerId, amount) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Create quick selector modal
    const modal = document.createElement('div');
    modal.className = 'quick-selector-modal';
    modal.innerHTML = `
        <div class="quick-selector-content">
            <div class="quick-selector-header">
                <span>${amount >= 0 ? '+' : ''}${amount} điểm cho ${player.name}</span>
                <button class="quick-selector-close" onclick="this.closest('.quick-selector-modal').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="quick-selector-label">Chọn người đền:</div>
            <div class="quick-selector-list"></div>
            <button class="quick-selector-all-btn" id="quick-selector-all-btn">
                <i data-lucide="users"></i>
                <span>Tất cả đền</span>
            </button>
        </div>
    `;

    const list = modal.querySelector('.quick-selector-list');
    const allBtn = modal.querySelector('#quick-selector-all-btn');
    const opponents = players.filter(p => p.id !== playerId);

    // Setup "Tất cả đền" button
    allBtn.onclick = () => {
        applyScoreChange(playerId, amount, 'all');
        modal.remove();
    };

    opponents.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'quick-selector-btn';
        btn.innerHTML = `
            <div class="quick-selector-avatar" style="background: ${p.color}">${p.avatar || p.name.charAt(0).toUpperCase()}</div>
            <span>${p.name}</span>
        `;
        btn.onclick = () => {
            applyScoreChange(playerId, amount, p.id);
            modal.remove();
        };
        list.appendChild(btn);
    });

    document.body.appendChild(modal);
    refreshIcons();

    // Auto close after 5 seconds or click outside
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.remove();
        }
    }, 5000);

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function applyScoreChange(playerId, amount, opponentId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (mode369 && players.length > 1) {
        if (players.length === 2) {
            // 2 players: Auto-select the other player
            const otherPlayer = players.find(p => p.id !== playerId);
            if (otherPlayer) {
                player.score += amount;
                otherPlayer.score -= amount;
                otherPlayer.score = Math.round(otherPlayer.score * 100) / 100;

                addToHistory(
                    `${player.name}: ${amount >= 0 ? '+' : ''}${amount} (369 vs ${otherPlayer.name})`,
                    amount,
                    true
                );
            }
        } else if (opponentId === 'all') {
            // Tất cả đền: Người chơi chỉ nhận điểm từ người đền (KHÔNG nhận điểm từ bi)
            const opponents = players.filter(p => p.id !== playerId);
            const totalFromOpponents = amount * opponents.length; // Tổng điểm từ tất cả người đền

            // Người chơi chỉ nhận điểm từ người đền (không cộng điểm bi)
            player.score += totalFromOpponents;
            player.score = Math.round(player.score * 100) / 100;

            // Mỗi người khác trừ điểm
            opponents.forEach(p => {
                p.score -= amount;
                p.score = Math.round(p.score * 100) / 100;
            });

            addToHistory(
                `${player.name}: +${totalFromOpponents} (369 vs Tất cả - mỗi người đền ${amount} điểm)`,
                totalFromOpponents,
                true
            );
        } else if (opponentId) {
            // 3+ players: Use selected opponent
            const opponent = players.find(p => p.id === opponentId);
            if (opponent) {
                player.score += amount;
                opponent.score -= amount;
                opponent.score = Math.round(opponent.score * 100) / 100;

                // Save as last opponent
                lastOpponentId[playerId] = opponentId;

                addToHistory(
                    `${player.name}: ${amount >= 0 ? '+' : ''}${amount} (369 vs ${opponent.name})`,
                    amount,
                    true
                );
            }
        }
    } else {
        // Normal mode
        player.score += amount;
        addToHistory(
            `${player.name}: ${amount >= 0 ? '+' : ''}${amount}`,
            amount
        );
    }

    player.score = Math.round(player.score * 100) / 100;

    saveCurrentGame();
    renderPlayers();
    updateLeaderDisplay();
    checkWinCondition();
}


function updateLeaderDisplay() {
    if (players.length === 0) {
        document.getElementById('leader-avatar').style.background = 'var(--primary)';
        document.getElementById('leader-avatar').innerHTML = '';
        document.getElementById('leader-name').textContent = '--';
        return;
    }

    const leader = [...players].sort((a, b) => b.score - a.score)[0];
    const leaderAvatar = document.getElementById('leader-avatar');
    const leaderName = document.getElementById('leader-name');

    leaderAvatar.style.background = leader.color;
    leaderAvatar.innerHTML = leader.avatar || leader.name.charAt(0).toUpperCase();
    leaderName.textContent = leader.name;
}

function updateWinConditionDisplay() {
    const winText = document.getElementById('win-text');
    const winCondition = document.getElementById('win-condition');
    const currentWinPoints = document.getElementById('current-win-points');

    if (winPoints > 0) {
        winText.textContent = `đạt ${winPoints} điểm để thắng`;
        winCondition.style.display = 'flex';
    } else {
        winCondition.style.display = 'none';
    }

    if (currentWinPoints) {
        currentWinPoints.textContent = winPoints > 0 ? `${winPoints} điểm` : 'Không giới hạn';
    }
}

function checkWinCondition() {
    if (winPoints <= 0) return;

    const winner = players.find(p => p.score >= winPoints);
    if (winner) {
        showWinnerModal(winner);
    }
}

function showWinnerModal(winner) {
    document.getElementById('winner-name-display').textContent = winner.name;
    document.getElementById('winner-modal').classList.remove('hidden');
}

function closeWinnerModal() {
    document.getElementById('winner-modal').classList.add('hidden');
}

// Score modal
function openScoreModal(playerId) {
    currentPlayerId = playerId;
    selectedOpponentId = null;
    const player = players.find(p => p.id === playerId);

    document.getElementById('modal-player-name').textContent = `Cộng điểm: ${player.name}`;
    document.getElementById('score-input').value = '';

    // Show opponent selection for 369 mode with 3+ players
    const opponentContainer = document.getElementById('opponent-select-container');
    const opponentList = document.getElementById('opponent-select-list');

    if (mode369 && players.length > 2) {
        // Show opponent selection
        opponentContainer.classList.remove('hidden');
        opponentList.innerHTML = '';

        // Get list of opponents
        const opponents = players.filter(p => p.id !== playerId);
        let firstOpponent = null;

        opponents.forEach((p, index) => {
            const btn = document.createElement('button');
            btn.className = 'opponent-select-btn';
            btn.dataset.playerId = p.id;
            btn.innerHTML = `
                <div class="opponent-select-avatar" style="background: ${p.color}">${p.avatar || p.name.charAt(0).toUpperCase()}</div>
                <span>${p.name}</span>
            `;

            // Auto-select if this is the last opponent for this player, or select first if none selected
            if (lastOpponentId[playerId] === p.id) {
                btn.classList.add('selected');
                selectedOpponentId = p.id;
            } else if (index === 0) {
                firstOpponent = p;
            }

            btn.onclick = () => {
                document.querySelectorAll('.opponent-select-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOpponentId = p.id;
                // Save as last opponent for this player
                lastOpponentId[playerId] = p.id;
            };
            opponentList.appendChild(btn);
        });

        // If no opponent was selected (no lastOpponentId), auto-select the first one
        if (!selectedOpponentId && firstOpponent) {
            const firstBtn = opponentList.querySelector(`[data-player-id="${firstOpponent.id}"]`);
            if (firstBtn) {
                firstBtn.classList.add('selected');
                selectedOpponentId = firstOpponent.id;
                lastOpponentId[playerId] = firstOpponent.id;
            }
        }

        // Refresh icons after adding buttons
        refreshIcons();
    } else {
        // Hide opponent selection (2 players or normal mode)
        opponentContainer.classList.add('hidden');
        if (mode369 && players.length === 2) {
            // Auto-select the other player
            const otherPlayer = players.find(p => p.id !== playerId);
            if (otherPlayer) {
                selectedOpponentId = otherPlayer.id;
            }
        }
    }

    document.getElementById('score-modal').classList.remove('hidden');
    document.getElementById('score-input').focus();
}

function closeScoreModal() {
    document.getElementById('score-modal').classList.add('hidden');
    currentPlayerId = null;
    selectedOpponentId = null;
}

function quickScore(value) {
    const input = document.getElementById('score-input');
    const current = parseInt(input.value) || 0;
    input.value = current + value;
}

function submitScore(action) {
    const input = document.getElementById('score-input');
    let value = parseInt(input.value) || 0;

    if (value === 0) {
        showToast('Vui lòng nhập số điểm', 'warning');
        return;
    }

    // If subtract, make value negative
    if (action === 'subtract') {
        value = -Math.abs(value);
    } else {
        value = Math.abs(value);
    }

    const player = players.find(p => p.id === currentPlayerId);

    if (mode369 && players.length > 1) {
        // Mode 369: Logic depends on number of players
        if (players.length === 2) {
            // 2 players: Auto-select the other player
            const otherPlayer = players.find(p => p.id !== currentPlayerId);
            if (otherPlayer) {
                player.score += value;
                otherPlayer.score -= value;
                otherPlayer.score = Math.round(otherPlayer.score * 100) / 100;

                addToHistory(
                    `${player.name}: ${value >= 0 ? '+' : ''}${value} (369 vs ${otherPlayer.name})`,
                    value,
                    true
                );
            }
        } else if (players.length > 2) {
            // 3+ players: Only subtract from selected opponent
            if (!selectedOpponentId) {
                showToast('Vui lòng chọn người đền!', 'warning');
                return;
            }

            const opponent = players.find(p => p.id === selectedOpponentId);
            if (opponent) {
                player.score += value;
                opponent.score -= value;
                opponent.score = Math.round(opponent.score * 100) / 100;

                // Save as last opponent for this player
                lastOpponentId[currentPlayerId] = selectedOpponentId;

                addToHistory(
                    `${player.name}: ${value >= 0 ? '+' : ''}${value} (369 vs ${opponent.name})`,
                    value,
                    true
                );
            }
        }
    } else {
        // Normal mode
        player.score += value;
        addToHistory(
            `${player.name}: ${value >= 0 ? '+' : ''}${value}`,
            value
        );
    }

    player.score = Math.round(player.score * 100) / 100;

    saveCurrentGame();
    renderPlayers();
    updateLeaderDisplay();
    closeScoreModal();
    checkWinCondition();
}

// History
function addToHistory(action, points, is369 = false) {
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    history.unshift({
        id: Date.now(),
        time: time,
        action: action,
        points: points,
        is369: is369
    });

    // Keep only last 50 entries
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    saveCurrentGame();
}

// Settings
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('mode-369').checked = mode369;
    document.getElementById('win-points-input').value = winPoints;
}

function closeSettings() {
    // Save win points when closing
    winPoints = parseInt(document.getElementById('win-points-input').value) || 0;
    updateWinConditionDisplay();
    saveCurrentGame();
    document.getElementById('settings-modal').classList.add('hidden');
}

function toggleMode369() {
    mode369 = document.getElementById('mode-369').checked;
    saveCurrentGame();
    updateModeIndicator();
}

function updateModeIndicator() {
    const indicator = document.getElementById('mode-indicator');
    if (mode369) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

function resetAllScores() {
    showConfirm('Reset điểm', 'Reset điểm của tất cả người chơi về 0?', () => {
        players.forEach(p => p.score = 0);
        saveCurrentGame();
        renderPlayers();
        updateLeaderDisplay();
        addToHistory('Reset tất cả điểm', 0);
        showToast('Đã reset tất cả điểm', 'success');
    }, 'warning');
}

function shareGame() {
    if (players.length === 0) {
        showToast('Chưa có người chơi để chia sẻ!', 'warning');
        return;
    }

    const game = getCurrentGame();
    let shareText = `🎮 ${game?.name || 'Game'}\n`;
    shareText += `━━━━━━━━━━━━━━\n`;

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    sortedPlayers.forEach((p, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        shareText += `${medal} ${p.name}: ${p.score} điểm\n`;
    });

    if (navigator.share) {
        navigator.share({
            title: game?.name || 'Cộng Điểm',
            text: shareText
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Đã copy kết quả!', 'success');
        });
    }
}

// Handle Enter key in modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (!document.getElementById('add-player-modal').classList.contains('hidden')) {
            confirmAddPlayer();
        } else if (!document.getElementById('edit-player-modal').classList.contains('hidden')) {
            confirmEditPlayerName();
        } else if (!document.getElementById('score-modal').classList.contains('hidden')) {
            submitScore('add');
        } else if (!document.getElementById('new-game-modal').classList.contains('hidden')) {
            confirmNewGame();
        }
    }
    if (e.key === 'Escape') {
        closeAddPlayerModal();
        closeEditPlayerModal();
        closeScoreModal();
        closeSettings();
        closeNewGameModal();
        closeGameListModal();
        closeWinnerModal();
    }
});
