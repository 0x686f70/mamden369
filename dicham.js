// ==================== ĐI CHẤM FEATURE ====================
function diCham(playerId, event) {
    event.stopPropagation();

    const chamPlayer = players.find(p => p.id === playerId);
    if (!chamPlayer) return;

    // Confirm action
    showConfirm(
        `${chamPlayer.name} đi chấm?`,
        `${chamPlayer.name} sẽ nhận 12 điểm từ mỗi người chơi!`,
        () => {
            executeDiCham(playerId);
        }
    );
}

function executeDiCham(playerId) {
    const chamPlayer = players.find(p => p.id === playerId);
    if (!chamPlayer) return;

    const otherPlayers = players.filter(p => p.id !== playerId);
    const totalGain = otherPlayers.length * 12;

    // Update scores
    chamPlayer.score += totalGain;
    otherPlayers.forEach(p => {
        p.score -= 12;
    });

    // Save and update UI
    saveCurrentGame();
    renderPlayers();
    updateLeaderDisplay();

    // Add to history
    addToHistory(`🎯 ${chamPlayer.name} đi chấm (+${totalGain} điểm)`, totalGain);

    // EPIC CELEBRATION!
    launchFireworks();
    showEpicTexts(chamPlayer.name);
    createConfetti();

    // Haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }
}

function launchFireworks() {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF00FF', '#00FFFF', '#FFA500'];
    const numberOfFireworks = 15;

    for (let i = 0; i < numberOfFireworks; i++) {
        setTimeout(() => {
            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight;
            const color = colors[Math.floor(Math.random() * colors.length)];

            createFirework(startX, startY, color);
        }, i * 200);
    }
}

function createFirework(startX, startY, color) {
    const particles = 30;

    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.left = startX + 'px';
        particle.style.bottom = '0px';
        particle.style.backgroundColor = color;

        const angle = (Math.PI * 2 * i) / particles;
        const velocity = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animation = `explode ${0.8 + Math.random() * 0.4}s ease-out forwards`;

        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1500);
    }
}

function showEpicTexts(playerName) {
    const messages = [
        'Hay vcl',
        'vl mấy thằng ngu',
        'chúng mày tuổi loz',
        'tao là bố chúng mày',
        'mấy thằng mày quá là ngu',
        `chào bố ${playerName.toUpperCase()} đi`
    ];

    messages.forEach((message, index) => {
        setTimeout(() => {
            const text = document.createElement('div');
            text.className = 'epic-text';
            text.textContent = message;
            text.style.bottom = '20%';
            text.style.left = '50%';
            text.style.animationDelay = (index * 0.3) + 's';

            document.body.appendChild(text);

            setTimeout(() => text.remove(), 3000);
        }, index * 400);
    });
}

function createConfetti() {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF00FF', '#FFA500', '#00FFFF'];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            confetti.style.animationDelay = (Math.random() * 0.5) + 's';

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}
