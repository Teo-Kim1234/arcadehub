document.addEventListener("DOMContentLoaded", () => {
    const screens = {
        hub: document.getElementById("game-selection"),
        game: document.getElementById("game-view")
    };

    const gameStage = document.getElementById("game-stage");
    const gameTitle = document.getElementById("current-game-title");
    const totalScoreDisplay = document.getElementById("total-score");
    const tetrisHighScoreDisplay = document.getElementById("tetris-high-score");
    const snakeHighScoreDisplay = document.getElementById("snake-high-score");
    const score2048Display = document.getElementById("2048-high-score");
    const minesweeperHighScoreDisplay = document.getElementById("minesweeper-high-score");
    const rhythmHighScoreDisplay = document.getElementById("rhythm-high-score");
    const btnBackToHub = document.getElementById("btn-back-to-hub");
    const userLevelDisplay = document.createElement('div');
    userLevelDisplay.className = 'level-badge';
    document.querySelector('.logo').appendChild(userLevelDisplay);

    // --- Sound System ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(freq = 440, duration = 0.1, type = 'square') {
        if (!isSoundEnabled) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // --- Background Music System ---
    let isMusicEnabled = true;
    let isSoundEnabled = true;
    let musicInterval = null;
    const melody = [
        [440, 440, 440, 392], // A4, A4, A4, G4
        [349, 349, 349, 329], // F4, F4, F4, E4
        [293, 293, 349, 392], // D4, D4, F4, G4
        [440, 440, 493, 523]  // A4, A4, B4, C5
    ];
    let melodyStep = 0;
    let melodyBar = 0;

    function startMusic() {
        if (musicInterval || !isMusicEnabled) return;
        musicInterval = setInterval(() => {
            const freq = melody[melodyBar][melodyStep];
            playTone(freq, 0.2, 'triangle');
            melodyStep = (melodyStep + 1) % 4;
            if (melodyStep === 0) melodyBar = (melodyBar + 1) % 4;
        }, 300);
    }

    function stopMusic() {
        if (musicInterval) {
            clearInterval(musicInterval);
            musicInterval = null;
        }
    }

    window.stopHubMusic = stopMusic;
    window.startHubMusic = startMusic;

    function playTone(freq, duration, type = 'square') {
        if (!isMusicEnabled) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // --- State ---
    let highScores = JSON.parse(localStorage.getItem('arcade-hub-scores')) || {
        tetris: 0,
        snake: 0,
        '2048': 0,
        minesweeper: 0,
        rhythm: 0
    };

    function updateScoreUI() {
        if (tetrisHighScoreDisplay) tetrisHighScoreDisplay.textContent = highScores.tetris;
        if (snakeHighScoreDisplay) snakeHighScoreDisplay.textContent = highScores.snake;
        if (score2048Display) score2048Display.textContent = highScores['2048'];
        if (minesweeperHighScoreDisplay) minesweeperHighScoreDisplay.textContent = highScores.minesweeper;
        if (rhythmHighScoreDisplay) rhythmHighScoreDisplay.textContent = highScores.rhythm;
        
        const total = Object.values(highScores).reduce((a, b) => a + b, 0);
        totalScoreDisplay.textContent = total.toLocaleString();
        
        // Level Calculation
        const level = Math.floor(Math.sqrt(total / 100)) + 1;
        userLevelDisplay.textContent = `LV.${level}`;
        
        // Progress bar (if added later)
    }

    // --- Global Functions (Accessible from iframes) ---
    window.updateHighScore = (gameId, score) => {
        if (score > highScores[gameId]) {
            highScores[gameId] = score;
            localStorage.setItem('arcade-hub-scores', JSON.stringify(highScores));
            updateScoreUI();
        }
    };

    window.playGameSound = (type) => {
        const sounds = {
            'merge': { freq: 880, duration: 0.1, type: 'square' },
            'clear': { freq: 1056, duration: 0.2, type: 'square' },
            'click': { freq: 440, duration: 0.05, type: 'square' },
            'over': { freq: 220, duration: 0.5, type: 'square' },
            'eat': { freq: 1320, duration: 0.1, type: 'triangle' }, // Ding
            'pop': { freq: 150, duration: 0.1, type: 'sine' }      // Pop
        };
        const s = sounds[type] || sounds['click'];
        playBeep(s.freq, s.duration, s.type);
    };

    // --- Navigation ---
    function showScreen(screenKey, pushState = true) {
        Object.values(screens).forEach(s => s.classList.remove("active"));
        screens[screenKey].classList.add("active");
        
        if (screenKey === 'game') {
            document.body.classList.add('game-mode');
            stopMusic();
        } else {
            document.body.classList.remove('game-mode');
            gameStage.innerHTML = ''; // Stop game when leaving
            if (isMusicEnabled) startMusic();
        }

        if (pushState) {
            if (screenKey === 'hub') {
                history.pushState({ screen: 'hub' }, '', window.location.pathname);
            }
        }
    }

    function launchGame(gameId, pushState = true) {
        gameStage.innerHTML = ''; 
        const iframe = document.createElement('iframe');
        // Ensure relative path from the current location
        const gamePath = `./games/${gameId}/index.html`;
        iframe.src = gamePath;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        gameStage.appendChild(iframe);
        
        const titles = {
            'tetris': '테트리스',
            'snake': '스네이크',
            '2048': '2048',
            'minesweeper': '지뢰찾기',
            'rhythm': '리듬 대시'
        };
        gameTitle.textContent = titles[gameId] || gameId.toUpperCase();
        showScreen('game', false);

        if (pushState) {
            history.pushState({ screen: 'game', gameId }, '', '#' + gameId);
        }
    }

    window.onpopstate = (event) => {
        const state = event.state;
        if (state && state.screen === 'game') {
            launchGame(state.gameId, false);
        } else {
            showScreen('hub', false);
        }
    };

    // --- Event Listeners ---
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnClearScores = document.getElementById('btn-clear-scores');

    if (btnSettings) {
        btnSettings.onclick = () => {
            playBeep(660);
            settingsModal.classList.add('active');
        };
    }

    if (btnCloseSettings) {
        btnCloseSettings.onclick = () => {
            playBeep(330);
            settingsModal.classList.remove('active');
        };
    }

    const toggleSound = document.getElementById('toggle-sound');
    const toggleMusic = document.getElementById('toggle-music');

    if (toggleSound) {
        toggleSound.onchange = (e) => {
            isSoundEnabled = e.target.checked;
        };
    }

    if (toggleMusic) {
        toggleMusic.onchange = (e) => {
            isMusicEnabled = e.target.checked;
        };
    }

    if (btnClearScores) {
        btnClearScores.onclick = () => {
            if (confirm('모든 점수 기록을 초기화하시겠습니까?')) {
                highScores = { tetris: 0, snake: 0, '2048': 0, minesweeper: 0, rhythm: 0 };
                localStorage.setItem('arcade-hub-scores', JSON.stringify(highScores));
                updateScoreUI();
                alert('초기화되었습니다.');
                settingsModal.classList.remove('active');
            }
        };
    }

    document.querySelectorAll('.game-card:not(.locked), .btn-hero-play').forEach(card => {
        card.addEventListener('click', () => {
            playBeep(880);
            const gameId = card.dataset.game;
            launchGame(gameId);
        });
    });

    btnBackToHub.addEventListener('click', () => {
        playBeep(440);
        history.back();
    });

    // --- Initial State ---
    history.replaceState({ screen: 'hub' }, '', window.location.pathname);
    
    // Auto-start music on first interaction
    document.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        startMusic();
    }, { once: true });

    // Initialize
    updateScoreUI();
});
