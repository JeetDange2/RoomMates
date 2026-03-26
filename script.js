// --- State & LocalStorage Management ---
const STORAGE_KEY_PLAYERS = 'rummy_players';
const STORAGE_KEY_GAMES = 'rummy_games';
const STORAGE_KEY_THEME = 'rummy_theme';
const STORAGE_KEY_DARES = 'rummy_dares';

let players = JSON.parse(localStorage.getItem(STORAGE_KEY_PLAYERS)) || [];
let games = JSON.parse(localStorage.getItem(STORAGE_KEY_GAMES)) || [];
let dares = JSON.parse(localStorage.getItem(STORAGE_KEY_DARES)) || ['Buy Snacks', 'Do 10 Pushups', 'Sing a song', 'Clean the table', 'Tell a joke'];

function savePlayers() {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
}

function saveGames() {
    localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(games));
}

function saveDares() {
    localStorage.setItem(STORAGE_KEY_DARES, JSON.stringify(dares));
}

// --- Theme Management ---
const themeToggle = document.getElementById('theme-toggle');
let currentTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
}

applyTheme(currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);
    });
}

// --- Utility Functions ---
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculatePlayerStats(playerId) {
    const playerGames = games.filter(g => g.scores.some(s => s.playerId === playerId));
    const totalGames = playerGames.length;
    const wins = playerGames.filter(g => g.winnerId === playerId).length;
    
    let totalPoints = 0;
    let pointsToday = 0;
    let pointsWeek = 0;
    let pointsMonth = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let individualScores = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate points and streaks (assuming games are chronological)
    playerGames.forEach(g => {
        const scoreObj = g.scores.find(s => s.playerId === playerId);
        if (scoreObj) {
            const pts = scoreObj.score;
            totalPoints += pts;
            individualScores.push(pts);

            const gDate = new Date(g.date);
            if (gDate >= startOfToday) pointsToday += pts;
            if (gDate >= startOfWeek) pointsWeek += pts;
            if (gDate >= startOfMonth) pointsMonth += pts;
        }

        if (g.winnerId === playerId) {
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
            currentStreak = 0;
        }
    });

    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const avgScore = totalGames > 0 ? Math.round(totalPoints / totalGames) : 0;

    return { totalGames, wins, totalPoints, pointsToday, pointsWeek, pointsMonth, winRate, avgScore, currentStreak, maxStreak, individualScores };
}

function getBadges(stats) {
    const badges = [];
    if (stats.wins >= 1) badges.push('First Win 🏆');
    if (stats.wins >= 10) badges.push('Veteran 🎖️');
    if (stats.maxStreak >= 3) badges.push('Hat-trick 🎩');
    if (stats.maxStreak >= 5) badges.push('Unstoppable 🚀');
    if (stats.totalPoints >= 1000) badges.push('1k Club 💎');
    return badges;
}

// --- Confetti Animation ---
function fireConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// --- Dashboard Logic (index.html) ---
if (document.getElementById('leaderboard-table')) {
    const leaderboardFilter = document.getElementById('leaderboard-filter');

    function updateDashboard() {
        // Stats Overview
        document.getElementById('total-games').textContent = games.length;

        // Calculate Session and Today Games
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const gamesToday = games.filter(g => new Date(g.date) >= startOfToday).length;
        document.getElementById('today-games').textContent = gamesToday;

        let sessionCount = 0;
        if (games.length > 0) {
            const sorted = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));
            const timeSinceLastGame = (now - new Date(sorted[0].date)) / (1000 * 60 * 60);
            if (timeSinceLastGame <= 2) {
                sessionCount = 1;
                for (let i = 0; i < sorted.length - 1; i++) {
                    const current = new Date(sorted[i].date);
                    const prev = new Date(sorted[i+1].date);
                    if ((current - prev) / (1000 * 60 * 60) <= 2) {
                        sessionCount++;
                    } else {
                        break;
                    }
                }
            }
        }
        document.getElementById('session-games').textContent = sessionCount;

        const playerStatsList = players.map(p => {
            const stats = calculatePlayerStats(p.id);
            return { ...p, ...stats };
        });

        // Top Player (All Time)
        if (playerStatsList.length > 0) {
            const topPlayer = [...playerStatsList].sort((a, b) => b.wins - a.wins)[0];
            document.getElementById('top-player').textContent = topPlayer && topPlayer.wins > 0 ? topPlayer.name : '-';
            
            const onFirePlayer = [...playerStatsList].sort((a, b) => b.currentStreak - a.currentStreak)[0];
            document.getElementById('on-fire-player').textContent = onFirePlayer && onFirePlayer.currentStreak >= 2 ? `${onFirePlayer.name} (${onFirePlayer.currentStreak} 🔥)` : '-';
        }

        // Leaderboard Filtering
        const timeframe = leaderboardFilter ? leaderboardFilter.value : 'all';
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let filteredGames = games;
        if (timeframe === 'today') filteredGames = games.filter(g => new Date(g.date) >= startOfToday);
        else if (timeframe === 'week') filteredGames = games.filter(g => new Date(g.date) >= startOfWeek);
        else if (timeframe === 'month') filteredGames = games.filter(g => new Date(g.date) >= startOfMonth);

        const leaderboardStats = players.map(p => {
            const pGames = filteredGames.filter(g => g.scores.some(s => s.playerId === p.id));
            const tGames = pGames.length;
            const tWins = pGames.filter(g => g.winnerId === p.id).length;
            let tPoints = 0;
            pGames.forEach(g => {
                const s = g.scores.find(x => x.playerId === p.id);
                if (s) tPoints += s.score;
            });
            const wRate = tGames > 0 ? Math.round((tWins / tGames) * 100) : 0;
            const allTimeStats = calculatePlayerStats(p.id);
            return { ...p, wins: tWins, totalPoints: tPoints, winRate: wRate, currentStreak: allTimeStats.currentStreak, totalGames: tGames, pointsToday: allTimeStats.pointsToday, pointsWeek: allTimeStats.pointsWeek, pointsMonth: allTimeStats.pointsMonth, allTimePoints: allTimeStats.totalPoints };
        }).filter(p => p.totalGames > 0 || timeframe === 'all');

        const tbody = document.querySelector('#leaderboard-table tbody');
        tbody.innerHTML = '';
        
        const sortedPlayers = [...leaderboardStats].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.totalPoints - b.totalPoints; // If wins tie, lower points is better (usually in rummy)
        });

        sortedPlayers.forEach((p, index) => {
            let rankDisplay = index + 1;
            if (index === 0) rankDisplay = '<span style="font-size: 1.4rem; margin-right: 4px; filter: drop-shadow(0 2px 4px rgba(255,215,0,0.4));" title="Champion">🏆</span> ';
            else if (index === 1) rankDisplay = '<span style="font-size: 1.3rem; margin-right: 4px; filter: drop-shadow(0 2px 4px rgba(192,192,192,0.4));" title="Runner Up">🥈</span> ';
            else if (index === 2) rankDisplay = '<span style="font-size: 1.3rem; margin-right: 4px; filter: drop-shadow(0 2px 4px rgba(205,127,50,0.4));" title="Third Place">🥉</span> ';
            else rankDisplay = `<span style="padding-left: 8px; color: var(--text-muted);">${index + 1}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; white-space: nowrap;">${rankDisplay}</td>
                <td style="font-weight: 500;">${p.name} ${p.currentStreak >= 3 ? '🔥' : ''}</td>
                <td>${p.wins}</td>
                <td>${p.pointsToday}</td>
                <td>${p.pointsWeek}</td>
                <td>${p.pointsMonth}</td>
                <td>${p.allTimePoints}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${p.winRate}%</span>
                        <div class="progress-bg" style="width: 50px; margin: 0;">
                            <div class="progress-fill" style="width: ${p.winRate}%"></div>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Recent Matches
        const recentList = document.getElementById('recent-matches-list');
        recentList.innerHTML = '';
        const recentGames = [...games].reverse().slice(0, 5);
        
        if (recentGames.length === 0) {
            recentList.innerHTML = '<li class="match-item text-muted">No games played yet.</li>';
        }

        recentGames.forEach(g => {
            const winner = players.find(p => p.id === g.winnerId);
            const date = new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const li = document.createElement('li');
            li.className = 'match-item';
            li.innerHTML = `
                <div class="match-header">
                    <span>${date}</span>
                    <span class="match-winner">🏆 ${winner ? winner.name : 'Unknown'}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                    ${g.scores.map(s => {
                        const p = players.find(pl => pl.id === s.playerId);
                        return `${p ? p.name : 'Unknown'}: ${s.score}`;
                    }).join(' | ')}
                </div>
            `;
            recentList.appendChild(li);
        });
    }

    updateDashboard();

    if (leaderboardFilter) {
        leaderboardFilter.addEventListener('change', updateDashboard);
    }

    // New Game Modal Logic
    const newGameBtn = document.getElementById('new-game-btn');
    const newGameModal = document.getElementById('new-game-modal');
    const closeBtn = newGameModal.querySelector('.close-btn');
    const playerCheckboxes = document.getElementById('player-checkboxes');
    const scoreInputs = document.getElementById('score-inputs');
    const newGameForm = document.getElementById('new-game-form');

    newGameBtn.addEventListener('click', () => {
        if (players.length < 2) {
            alert('Please add at least 2 players first!');
            window.location.href = '/players.html';
            return;
        }
        
        // Populate checkboxes
        playerCheckboxes.innerHTML = '';
        players.forEach(p => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="chk-${p.id}" value="${p.id}">
                <label for="chk-${p.id}">${p.name}</label>
            `;
            playerCheckboxes.appendChild(div);
        });

        scoreInputs.innerHTML = '';
        newGameModal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => newGameModal.classList.remove('active'));

    // Handle checkbox changes to show score inputs
    playerCheckboxes.addEventListener('change', () => {
        const selectedIds = Array.from(playerCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value);
        
        scoreInputs.innerHTML = '';
        selectedIds.forEach(id => {
            const player = players.find(p => p.id === id);
            const div = document.createElement('div');
            div.className = 'score-input-group';
            div.innerHTML = `
                <label>${player.name}</label>
                <input type="number" name="score-${id}" required placeholder="Score">
            `;
            scoreInputs.appendChild(div);
        });
    });

    newGameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedIds = Array.from(playerCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value);
        
        if (selectedIds.length < 2) {
            alert('Select at least 2 players.');
            return;
        }

        const scores = [];
        selectedIds.forEach(id => {
            const scoreVal = parseInt(newGameForm.elements[`score-${id}`].value, 10);
            scores.push({ playerId: id, score: scoreVal });
        });

        const rule = document.getElementById('winner-rule').value;
        let winnerId = null;

        if (rule === 'lowest') {
            const minScore = Math.min(...scores.map(s => s.score));
            // Handle ties by picking the first one or logic (simplifying to first min)
            winnerId = scores.find(s => s.score === minScore).playerId;
        } else {
            const maxScore = Math.max(...scores.map(s => s.score));
            winnerId = scores.find(s => s.score === maxScore).playerId;
        }

        const newGame = {
            id: generateId(),
            date: new Date().toISOString(),
            scores: scores,
            winnerId: winnerId,
            rule: rule
        };

        games.push(newGame);
        saveGames();
        
        newGameModal.classList.remove('active');
        newGameForm.reset();
        scoreInputs.innerHTML = '';
        
        updateDashboard();
        fireConfetti();
        
        // Trigger Loser Wheel if there are losers
        const losers = scores.filter(s => s.playerId !== winnerId);
        if (losers.length > 0) {
            setTimeout(() => showLoserWheel(scores, winnerId), 1500);
        }
    });

    // Loser Wheel Logic
    const loserWheelModal = document.getElementById('loser-wheel-modal');
    const closeWheelBtn = loserWheelModal.querySelector('.close-btn-wheel');
    const spinBtn = document.getElementById('spin-btn');
    const wheel = document.getElementById('wheel');
    const wheelResult = document.getElementById('wheel-result');
    const biggestLoserText = document.getElementById('biggest-loser-text');
    const newDareInput = document.getElementById('new-dare-input');
    const addDareBtn = document.getElementById('add-dare-btn');
    const daresList = document.getElementById('dares-list');
    let currentBiggestLoser = null;

    function renderDares() {
        daresList.innerHTML = '';
        dares.forEach((dare, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.marginBottom = '8px';
            li.style.padding = '8px';
            li.style.background = 'rgba(255, 255, 255, 0.05)';
            li.style.borderRadius = '5px';
            li.innerHTML = `
                <span>${dare}</span>
                <button class="icon-btn delete-dare-btn" data-index="${index}" style="color: var(--danger-color); font-size: 0.8rem;">❌</button>
            `;
            daresList.appendChild(li);
        });

        document.querySelectorAll('.delete-dare-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                dares.splice(idx, 1);
                if(dares.length === 0) dares.push('Buy Snacks'); // Keep at least one
                saveDares();
                renderDares();
                drawWheel();
            });
        });
    }

    addDareBtn.addEventListener('click', () => {
        const val = newDareInput.value.trim();
        if(val) {
            dares.push(val);
            saveDares();
            newDareInput.value = '';
            renderDares();
            drawWheel();
        }
    });

    function drawWheel() {
        wheel.innerHTML = '';
        const sliceAngle = 360 / dares.length;
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        
        dares.forEach((dare, index) => {
            const slice = document.createElement('div');
            slice.className = 'wheel-segment';
            slice.style.backgroundColor = colors[index % colors.length];
            slice.style.transform = `rotate(${index * sliceAngle}deg) skewY(${90 - sliceAngle}deg)`;
            wheel.appendChild(slice);
        });
    }

    function showLoserWheel(scores, winnerId) {
        const losers = scores.filter(s => s.playerId !== winnerId);
        if (losers.length === 0) return;

        // Find biggest loser (highest score)
        const biggestLoserScore = Math.max(...losers.map(l => l.score));
        const biggestLoserId = losers.find(l => l.score === biggestLoserScore).playerId;
        currentBiggestLoser = players.find(p => p.id === biggestLoserId);

        biggestLoserText.innerHTML = `Biggest Loser: <strong>${currentBiggestLoser ? currentBiggestLoser.name : 'Unknown'}</strong>! Spin for your dare!`;
        
        renderDares();
        drawWheel();

        wheel.style.transform = 'rotate(0deg)';
        wheelResult.classList.add('hidden');
        loserWheelModal.classList.add('active');
    }

    closeWheelBtn.addEventListener('click', () => loserWheelModal.classList.remove('active'));

    spinBtn.addEventListener('click', () => {
        if (dares.length === 0) return;
        
        spinBtn.disabled = true;
        const spins = 5; // number of full rotations
        const randomDegree = Math.floor(Math.random() * 360);
        const totalDegree = (spins * 360) + randomDegree;
        
        wheel.style.transform = `rotate(${totalDegree}deg)`;
        
        setTimeout(() => {
            // Calculate winning dare
            const sliceAngle = 360 / dares.length;
            const normalizedDegree = totalDegree % 360;
            // Pointer is at top (0 deg). If wheel rotates clockwise by X deg, 
            // the segment at top is 360 - X.
            const pointerAngle = (360 - normalizedDegree) % 360;
            const selectedIndex = Math.floor(pointerAngle / sliceAngle);
            
            const selectedDare = dares[selectedIndex];
            
            wheelResult.innerHTML = `🎯 <strong>${currentBiggestLoser ? currentBiggestLoser.name : 'Loser'}</strong> must:<br><span style="color: var(--text-color);">${selectedDare}</span>!`;
            wheelResult.classList.remove('hidden');
            spinBtn.disabled = false;
        }, 3000); // matches transition duration
    });
}

// --- Players Logic (players.html) ---
if (document.getElementById('players-grid')) {
    const playersGrid = document.getElementById('players-grid');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerModal = document.getElementById('player-modal');
    const closeBtn = playerModal.querySelector('.close-btn');
    const playerForm = document.getElementById('player-form');
    const modalTitle = document.getElementById('player-modal-title');

    function renderPlayers() {
        playersGrid.innerHTML = '';
        
        if (players.length === 0) {
            playersGrid.innerHTML = '<p class="text-muted">No players added yet. Click "+ Add Player" to start.</p>';
            return;
        }

        const playerStatsList = players.map(p => {
            return { p, stats: calculatePlayerStats(p.id) };
        });

        const activePlayers = playerStatsList.filter(item => item.stats.totalGames > 0);
        let minPoints = Infinity;
        let maxPoints = -Infinity;

        if (activePlayers.length > 0) {
            minPoints = Math.min(...activePlayers.map(item => item.stats.totalPoints));
            maxPoints = Math.max(...activePlayers.map(item => item.stats.totalPoints));
        }

        playerStatsList.forEach(({ p, stats }) => {
            const badges = getBadges(stats);
            
            let auraClass = '';
            if (stats.totalGames > 0 && minPoints !== maxPoints) {
                if (stats.totalPoints === minPoints) {
                    auraClass = 'aura-green';
                } else if (stats.totalPoints === maxPoints) {
                    auraClass = 'aura-red';
                }
            }
            
            const card = document.createElement('div');
            card.className = `player-card glass-card ${auraClass}`;
            card.innerHTML = `
                <div class="player-header">
                    <h3>${p.name} ${stats.currentStreak >= 3 ? '🔥' : ''}</h3>
                    <div class="player-actions">
                        <button class="icon-btn edit-btn" data-id="${p.id}" title="Edit">✏️</button>
                        <button class="icon-btn delete-btn" data-id="${p.id}" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="player-stats-grid">
                    <div class="player-stat">
                        <span>Wins</span>
                        <strong>${stats.wins}</strong>
                    </div>
                    <div class="player-stat">
                        <span>Win Rate</span>
                        <strong>${stats.winRate}%</strong>
                    </div>
                    <div class="player-stat">
                        <span>Avg Score</span>
                        <strong>${stats.avgScore}</strong>
                    </div>
                    <div class="player-stat">
                        <span>Games</span>
                        <strong>${stats.totalGames}</strong>
                    </div>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${stats.winRate}%"></div>
                </div>
                <div class="player-recent-scores" style="margin-top: 15px; font-size: 0.85rem;">
                    <span style="color: var(--text-muted); display: block; margin-bottom: 5px;">Recent Game Points:</span>
                    <div>
                        ${stats.individualScores.slice(-7).map(score => `<span class="score-pill" style="display: inline-block; margin: 0 4px 4px 0; padding: 2px 8px; font-size: 0.75rem; border-radius: 10px;">${score}</span>`).join('') || '<span class="text-muted">No games yet</span>'}
                    </div>
                </div>
                <div class="player-points-breakdown" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px; margin-top: 15px; text-align: center; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; text-transform: uppercase;">Today</span>
                        <strong style="font-size: 0.9rem; color: var(--primary-color);">${stats.pointsToday}</strong>
                    </div>
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; text-transform: uppercase;">Week</span>
                        <strong style="font-size: 0.9rem; color: var(--primary-color);">${stats.pointsWeek}</strong>
                    </div>
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; text-transform: uppercase;">Month</span>
                        <strong style="font-size: 0.9rem; color: var(--primary-color);">${stats.pointsMonth}</strong>
                    </div>
                    <div>
                        <span style="font-size: 0.65rem; color: var(--text-muted); display: block; text-transform: uppercase;">All Time</span>
                        <strong style="font-size: 0.9rem; color: var(--primary-color);">${stats.totalPoints}</strong>
                    </div>
                </div>
                <div class="badges-container" style="margin-top: 15px;">
                    ${badges.map(b => `<span class="badge">${b}</span>`).join('')}
                </div>
            `;
            playersGrid.appendChild(card);
        });

        // Attach event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const player = players.find(p => p.id === id);
                document.getElementById('player-id').value = player.id;
                document.getElementById('player-name').value = player.name;
                modalTitle.textContent = 'Edit Player';
                playerModal.classList.add('active');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this player? Game history containing this player will still exist but show "Unknown".')) {
                    players = players.filter(p => p.id !== id);
                    savePlayers();
                    renderPlayers();
                }
            });
        });
    }

    renderPlayers();

    addPlayerBtn.addEventListener('click', () => {
        playerForm.reset();
        document.getElementById('player-id').value = '';
        modalTitle.textContent = 'Add Player';
        playerModal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => playerModal.classList.remove('active'));

    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('player-id').value;
        const name = document.getElementById('player-name').value.trim();

        if (id) {
            // Edit
            const player = players.find(p => p.id === id);
            if (player) player.name = name;
        } else {
            // Add
            players.push({ id: generateId(), name });
        }

        savePlayers();
        playerModal.classList.remove('active');
        renderPlayers();
    });
}

// --- History Logic (history.html) ---
if (document.getElementById('full-history-list')) {
    const historyList = document.getElementById('full-history-list');
    const filterSelect = document.getElementById('history-filter');

    // Populate filter
    players.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        filterSelect.appendChild(option);
    });

    function renderHistory(filterId = 'all') {
        historyList.innerHTML = '';
        
        let filteredGames = [...games].reverse();
        if (filterId !== 'all') {
            filteredGames = filteredGames.filter(g => g.scores.some(s => s.playerId === filterId));
        }

        if (filteredGames.length === 0) {
            historyList.innerHTML = '<p class="text-muted">No games found.</p>';
            return;
        }

        filteredGames.forEach(g => {
            const winner = players.find(p => p.id === g.winnerId);
            const date = new Date(g.date).toLocaleString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            const card = document.createElement('div');
            card.className = 'history-card glass-card';
            
            let scoresHtml = g.scores.map(s => {
                const p = players.find(pl => pl.id === s.playerId);
                const pName = p ? p.name : 'Unknown';
                const isWinner = s.playerId === g.winnerId;
                return `<span class="score-pill ${isWinner ? 'winner' : ''}">${pName}: ${s.score}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="history-details">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px;">${date}</div>
                    <div style="font-weight: 500; margin-bottom: 5px;">
                        Winner: <span style="color: var(--success-color)">${winner ? winner.name : 'Unknown'}</span>
                    </div>
                    <div class="history-scores">
                        ${scoresHtml}
                    </div>
                </div>
                <button class="danger-btn delete-game-btn" data-id="${g.id}">Delete</button>
            `;
            historyList.appendChild(card);
        });

        document.querySelectorAll('.delete-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this game record?')) {
                    games = games.filter(g => g.id !== id);
                    saveGames();
                    renderHistory(filterSelect.value);
                }
            });
        });
    }

    renderHistory();

    filterSelect.addEventListener('change', (e) => {
        renderHistory(e.target.value);
    });
}
