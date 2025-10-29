'use client';
import { useEffect } from 'react';
import '../../styles/solitaire.css';

interface Card {
    suit: string;
    rank: string;
    color: 'red' | 'black';
    value: number;
    isFaceUp: boolean;
}

export default function SolitaireGame({ playerId }: { playerId: string }) {
    useEffect(() => {
        // === Keys & Consts ===
        const DOMAIN_TAG = window.location.hostname.replace(/\./g, '_');
        const SCORE_TOTALS_KEY = `solitaireAccumulatedScores_${DOMAIN_TAG}`; // score leaderboard (win sonrası eklenir)
        const CHECKIN_STATE_KEY = (pid: string) => `solitaireDailyCheckIn_${DOMAIN_TAG}_${pid}`; // { lastDate, streak, lastBonusAt }
        const CHECKIN_LEADERBOARD_KEY = `solitaireCheckinStreaks_${DOMAIN_TAG}`; // { playerId: streak }
        const currentPlayerId = playerId || '@guest';

        const SUITS = ['♠', '♣', '♥', '♦'];
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const isMobile = /Android|iPhone|iPad|iPod|Farcaster|Warpcast/i.test(navigator.userAgent);

        // === DOM refs ===
        const stockPile = document.getElementById('stock');
        const wastePile = document.getElementById('waste');
        const foundationPiles = document.querySelectorAll('.foundation');
        const tableauPiles = document.querySelectorAll('.tableau');
        const scoreDisplay = document.querySelector('.score-display');
        const newGameButtons = document.querySelectorAll('.new-game-btn');
        const gameContainer = document.getElementById('game-container');

        const winModal = document.getElementById('win-modal');
        const winningPlayerNameDisplay = document.getElementById('winning-player-name');

        const scoreLbBtn = document.getElementById('leaderboard-btn');
        const scoreLbModal = document.getElementById('leaderboard-modal');
        const scoreLbClose = document.getElementById('close-leaderboard-btn');
        const scoreLbTbody = scoreLbModal?.querySelector('tbody') as HTMLElement;

        // Check-in UI
        const checkInBtn = document.getElementById('checkin-btn');
        const checkInLbBtn = document.getElementById('checkin-leaderboard-btn');
        const checkInLbModal = document.getElementById('checkin-leaderboard-modal');
        const checkInLbClose = document.getElementById('close-checkin-leaderboard-btn');
        const checkInLbTbody = checkInLbModal?.querySelector('tbody') as HTMLElement;
        const streakPill = document.getElementById('streak-pill');

        const currentPlayerStatus = document.getElementById('current-player-status');

        // === Game state ===
        let deck: Card[] = [];
        let cardIdCounter = 0;
        let draggedCards: HTMLElement[] = [];
        let selectedCard: HTMLElement | null = null;
        let score = 0;
        let hasWon = false;

        // === Helpers ===
        function todayStr(): string {
            return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        }
        function yyyymmddToDate(s: string): Date {
            return new Date(s + 'T00:00:00');
        }
        function isYesterday(last: string | null, today: string): boolean {
            if (!last) return false;
            const dLast = yyyymmddToDate(last);
            const dToday = yyyymmddToDate(today);
            const diff = (dToday.getTime() - dLast.getTime()) / (1000 * 3600 * 24);
            return diff === 1;
        }

        function updatePlayerStatus() {
            if (currentPlayerStatus) currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`;
        }
        function setScore(v: number) {
            score = Math.max(0, v);
            scoreDisplay!.textContent = `Score: ${score}`;
        }
        function updateScore(delta: number) {
            setScore(score + delta);
        }

        // === Leaderboard: only on WIN ===
        function saveScoreIfWin(playerId: string, addScore: number) {
            const scores = JSON.parse(localStorage.getItem(SCORE_TOTALS_KEY) || '{}');
            scores[playerId] = (scores[playerId] || 0) + addScore;
            localStorage.setItem(SCORE_TOTALS_KEY, JSON.stringify(scores));
        }

        // === CHECK-IN STATE ===
        type CheckInState = { lastDate: string | null; streak: number; lastBonusAt?: number };
        function loadCheckinState(pid: string): CheckInState {
            const raw = localStorage.getItem(CHECKIN_STATE_KEY(pid));
            if (!raw) return { lastDate: null, streak: 0, lastBonusAt: 0 };
            try {
                const obj = JSON.parse(raw);
                return { lastDate: obj.lastDate ?? null, streak: obj.streak ?? 0, lastBonusAt: obj.lastBonusAt ?? 0 };
            } catch {
                return { lastDate: null, streak: 0, lastBonusAt: 0 };
            }
        }
        function saveCheckinState(pid: string, st: CheckInState) {
            localStorage.setItem(CHECKIN_STATE_KEY(pid), JSON.stringify(st));
        }
        function updateCheckinLeaderboard(pid: string, streak: number) {
            const data = JSON.parse(localStorage.getItem(CHECKIN_LEADERBOARD_KEY) || '{}');
            data[pid] = streak;
            localStorage.setItem(CHECKIN_LEADERBOARD_KEY, JSON.stringify(data));
        }

        // === CHECK-IN UI ===
        function refreshCheckInUI() {
            const state = loadCheckinState(currentPlayerId);
            const t = todayStr();
            const alreadyToday = state.lastDate === t;

            // button
            if (checkInBtn) {
                if (alreadyToday) {
                    checkInBtn.textContent = `✓ Checked In Today (Day ${state.streak})`;
                    checkInBtn.classList.add('checked');
                    checkInBtn.setAttribute('aria-disabled', 'true');
                } else {
                    const nextDay = state.streak > 0 ? ` (Day ${state.streak + 1})` : '';
                    checkInBtn.textContent = `🃏 Claim Daily +5 Points${nextDay}`;
                    checkInBtn.classList.remove('checked');
                    checkInBtn.removeAttribute('aria-disabled');
                }
            }

            // pill
            if (streakPill) {
                if (state.streak > 0) {
                    streakPill.textContent = `Streak: ${state.streak}`;
                    streakPill.classList.remove('hidden');
                } else {
                    streakPill.classList.add('hidden');
                }
            }
        }

        function performCheckIn() {
            const t = todayStr();
            const state = loadCheckinState(currentPlayerId);
            if (state.lastDate === t) return; // already claimed today

            // streak calc
            let newStreak = 1;
            if (isYesterday(state.lastDate, t)) newStreak = state.streak + 1;

            // base +5
            updateScore(5);

            // 3-day multiples → +10 bonus
            let bonus = 0;
            if (newStreak % 3 === 0) {
                bonus = 10;
                updateScore(bonus);
                // mini pulse anim + label
                checkInBtn?.classList.add('pulse');
                setTimeout(() => checkInBtn?.classList.remove('pulse'), 450);
            }

            const newState: CheckInState = { lastDate: t, streak: newStreak, lastBonusAt: (newStreak % 3 === 0) ? newStreak : state.lastBonusAt ?? 0 };
            saveCheckinState(currentPlayerId, newState);
            updateCheckinLeaderboard(currentPlayerId, newStreak);
            refreshCheckInUI();
        }

        // === Deck ===
        let deckArr: Card[] = [];
        function createDeck() {
            deckArr = [];
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    deckArr.push({
                        suit,
                        rank,
                        color: suit === '♥' || suit === '♦' ? 'red' : 'black',
                        value: RANKS.indexOf(rank) + 1,
                        isFaceUp: false,
                    });
                }
            }
        }
        function shuffleDeck() {
            for (let i = deckArr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deckArr[i], deckArr[j]] = [deckArr[j], deckArr[i]];
            }
        }

        // === Card element ===
        function createCardElement(cardData: Card) {
            const card = document.createElement('div');
            card.id = `card-${cardIdCounter++}`;
            card.classList.add('card', cardData.color);
            if (!cardData.isFaceUp) card.classList.add('face-down');
            else card.draggable = true;
            card.dataset.rank = cardData.rank;
            card.dataset.suit = cardData.suit;
            card.dataset.value = cardData.value.toString();
            card.dataset.color = cardData.color;

            const rank = document.createElement('div');
            rank.classList.add('rank');
            rank.textContent = cardData.rank;
            const suit = document.createElement('div');
            suit.classList.add('suit');
            suit.textContent = cardData.suit;
            card.append(rank, suit);

            // Drag
            card.addEventListener('dragstart', onDragStart);
            card.addEventListener('dragend', onDragEnd);

            // Double tap / double click to foundation
            if (isMobile) {
                card.addEventListener('touchend', (e) => {
                    const now = Date.now();
                    const lastTap = (card as any)._lastTap || 0;
                    if (now - lastTap < 300) onCardDoubleClick(e as any);
                    else selectOrMoveCard(card);
                    (card as any)._lastTap = now;
                });
            } else {
                card.addEventListener('dblclick', onCardDoubleClick);
            }

            return card;
        }

        // === Deal ===
        function dealCards() {
            for (let i = 0; i < 7; i++) {
                const pileCards: Card[] = [];
                for (let j = 0; j <= i; j++) {
                    const cardData = deckArr.pop();
                    if (cardData) pileCards.push(cardData);
                }
                if (pileCards.length) pileCards[pileCards.length - 1].isFaceUp = true;
                for (const c of pileCards) {
                    const el = createCardElement(c);
                    (tableauPiles[i] as HTMLElement).appendChild(el);
                }
            }
            for (const c of deckArr) {
                stockPile!.appendChild(createCardElement(c));
            }
            const ph = stockPile!.querySelector('.pile-placeholder') as HTMLElement | null;
            if (ph) ph.style.display = 'none';
        }

        // === Move rules ===
        function validateMove(cardsToMove: HTMLElement[], destPile: HTMLElement) {
            const topCardToMove = cardsToMove[0];
            if (destPile === topCardToMove.parentElement) return false;

            // Foundation
            if (destPile.classList.contains('foundation')) {
                if (cardsToMove.length > 1) return false;
                const top = destPile.lastElementChild as HTMLElement | null;
                if (!top || top.classList.contains('pile-placeholder')) {
                    return topCardToMove.dataset.value === '1'; // Ace
                }
                return (
                    top.dataset.suit === topCardToMove.dataset.suit &&
                    parseInt(top.dataset.value!) + 1 === parseInt(topCardToMove.dataset.value!)
                );
            }

            // Tableau
            if (destPile.classList.contains('tableau')) {
                const top = destPile.lastElementChild as HTMLElement | null;
                if (!top) return topCardToMove.dataset.rank === 'K';
                return (
                    top.dataset.color !== topCardToMove.dataset.color &&
                    parseInt(top.dataset.value!) === parseInt(topCardToMove.dataset.value!) + 1
                );
            }
            return false;
        }

        function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
            cards.forEach((c) => toPile.appendChild(c));

            // Scoring (lightweight)
            if (toPile.classList.contains('foundation')) updateScore(10);
            else if (fromPile.id === 'waste' && toPile.classList.contains('tableau')) updateScore(5);
            else if (fromPile.classList.contains('foundation') && toPile.classList.contains('tableau')) updateScore(-15);

            // Flip top of fromPile if tableau
            if (fromPile.classList.contains('tableau') && fromPile.children.length > 0) {
                const topCard = fromPile.lastElementChild as HTMLElement;
                if (topCard.classList.contains('face-down')) {
                    topCard.classList.remove('face-down');
                    topCard.draggable = true;
                    updateScore(5);
                }
            }
            checkWinCondition();
        }

        // === Drag handlers ===
        function onDragStart(e: DragEvent) {
            const draggedCard = e.target as HTMLElement;
            if (draggedCard.classList.contains('face-down')) return;
            const pile = draggedCard.parentElement as HTMLElement;
            if (pile.classList.contains('tableau')) {
                const arr = Array.from(pile.children) as HTMLElement[];
                const idx = arr.indexOf(draggedCard);
                draggedCards = arr.slice(idx);
            } else {
                draggedCards = [draggedCard];
            }
            e.dataTransfer?.setData('text/plain', draggedCard.id);
            setTimeout(() => draggedCards.forEach((c) => c.classList.add('dragging')), 0);
        }
        function onDragEnd() {
            draggedCards.forEach((c) => c.classList.remove('dragging'));
            draggedCards = [];
        }

        // === Double click/tap → foundation ===
        function onCardDoubleClick(e: Event) {
            const card = e.currentTarget as HTMLElement;
            const src = card.parentElement as HTMLElement;
            const v = parseInt(card.dataset.value!);

            for (const foundation of Array.from(foundationPiles) as HTMLElement[]) {
                const top = foundation.lastElementChild as HTMLElement | null;

                if (!top || top.classList.contains('pile-placeholder')) {
                    if (card.dataset.rank === 'A' || v === 1) {
                        moveCards([card], src, foundation);
                        return;
                    }
                } else if (top.dataset.suit === card.dataset.suit && parseInt(top.dataset.value!) + 1 === v) {
                    moveCards([card], src, foundation);
                    return;
                }
            }
        }

        // === Tap-to-move (mobile) ===
        function selectOrMoveCard(card: HTMLElement) {
            if (card.classList.contains('face-down')) return;

            if (!selectedCard) {
                selectedCard = card;
                card.classList.add('selected');
                return;
            }
            if (selectedCard === card) {
                card.classList.remove('selected');
                selectedCard = null;
                return;
            }

            const destPile = card.parentElement as HTMLElement;
            if (validateMove([selectedCard], destPile)) {
                moveCards([selectedCard], selectedCard.parentElement as HTMLElement, destPile);
                selectedCard.classList.remove('selected');
                selectedCard = null;
            } else {
                selectedCard.classList.remove('selected');
                selectedCard = card;
                card.classList.add('selected');
            }
        }

        // === Win check ===
        function checkWinCondition() {
            let total = 0;
            foundationPiles.forEach((p) => {
                total += (p as HTMLElement).querySelectorAll('.card').length;
            });
            if (total === 52 && !hasWon) {
                hasWon = true;
                updateScore(100);
                saveScoreIfWin(currentPlayerId, score);
                showWinModal();
            }
        }

        function showWinModal() {
            if (winningPlayerNameDisplay) winningPlayerNameDisplay.textContent = currentPlayerId;
            winModal?.classList.add('show');
            launchConfetti();
        }

        function launchConfetti() {
            import('canvas-confetti')
                .then((confetti) => {
                    const cnv = document.createElement('canvas');
                    cnv.style.position = 'fixed';
                    cnv.style.inset = '0';
                    cnv.style.width = '100%';
                    cnv.style.height = '100%';
                    cnv.style.zIndex = '9999';
                    document.body.appendChild(cnv);
                    const fire = confetti.default.create(cnv, { resize: true });
                    fire({ particleCount: 160, spread: 70, origin: { y: 0.6 } });
                    setTimeout(() => cnv.remove(), 6000);
                })
                .catch(() => { /* confetti opsiyonel */ });
        }

        // === Stock / waste behavior ===
        stockPile!.addEventListener('click', () => {
            const top = stockPile!.lastElementChild as HTMLElement;
            if (top && !top.classList.contains('pile-placeholder')) {
                top.classList.remove('face-down');
                top.draggable = true;
                wastePile!.appendChild(top);
            } else {
                const wasteCards = Array.from(wastePile!.querySelectorAll('.card')).reverse() as HTMLElement[];
                wasteCards.forEach((c) => {
                    c.classList.add('face-down');
                    c.draggable = false;
                    stockPile!.appendChild(c);
                });
            }
        });

        // === Board listeners (drop/dragover) ===
        ;[...foundationPiles, ...tableauPiles].forEach((p) =>
            (p as HTMLElement).addEventListener('dragover', (e) => e.preventDefault())
        );
        ;[...foundationPiles, ...tableauPiles].forEach((p) =>
            (p as HTMLElement).addEventListener('drop', (e) => {
                e.preventDefault();
                const dest = e.currentTarget as HTMLElement;
                if (validateMove(draggedCards, dest)) {
                    moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
                }
            })
        );

        // === Reset / Start ===
        function resetGame() {
            cardIdCounter = 0;
            hasWon = false;
            setScore(0);
            ;[stockPile, wastePile, ...foundationPiles].forEach((pile) => {
                (pile as HTMLElement).innerHTML = '<div class="pile-placeholder"></div>';
            });
            tableauPiles.forEach((pile) => ((pile as HTMLElement).innerHTML = ''));
            winModal?.classList.remove('show');

            createDeck();
            shuffleDeck();
            dealCards();
            gameContainer?.classList.add('active');

            refreshCheckInUI();
        }

        // === Event binding ===
        newGameButtons.forEach((b) => b.addEventListener('click', resetGame));

        scoreLbBtn?.addEventListener('click', () => {
            const scores = JSON.parse(localStorage.getItem(SCORE_TOTALS_KEY) || '{}');
            const sorted = Object.entries(scores).sort((a: any, b: any) => b[1] - a[1]);
            scoreLbTbody.innerHTML = '';
            sorted.slice(0, 10).forEach(([name, sc], i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${i + 1}</td><td>${name}</td><td>${sc}</td>`;
                scoreLbTbody.appendChild(tr);
            });
            scoreLbModal?.classList.add('show');
        });
        scoreLbClose?.addEventListener('click', () => scoreLbModal?.classList.remove('show'));

        checkInBtn?.addEventListener('click', performCheckIn);

        checkInLbBtn?.addEventListener('click', () => {
            const data = JSON.parse(localStorage.getItem(CHECKIN_LEADERBOARD_KEY) || '{}') as Record<string, number>;
            const sorted = Object.entries(data).sort((a, b) => (b[1] - a[1]));
            checkInLbTbody.innerHTML = '';
            sorted.slice(0, 10).forEach(([name, streak], i) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${i + 1}</td><td>${name}</td><td>${streak}</td>`;
                checkInLbTbody.appendChild(tr);
            });
            checkInLbModal?.classList.add('show');
        });
        checkInLbClose?.addEventListener('click', () => checkInLbModal?.classList.remove('show'));

        updatePlayerStatus();
        resetGame();
    }, [playerId]);

    return (
        <>
            <div className="game-container" id="game-container">
                <h1>Solitaire</h1>
                <div className="score-display">Score: 0</div>
                <div id="current-player-status"></div>

                {/* Daily Check-in Card */}
                <div className="checkin-wrapper">
                    <div id="streak-pill" className="streak-pill hidden">Streak: 0</div>
                    <button id="checkin-btn" className="checkin-btn" aria-disabled="false">
                        🃏 Claim Daily +5 Points
                    </button>
                    <div className="checkin-hint">Check-in every day. Every 3 days → +10 bonus 🎁</div>
                    <button id="checkin-leaderboard-btn" className="control-btn alt">Check-in Leaderboard</button>
                </div>

                <div className="top-piles">
                    <div className="stock-waste-piles">
                        <div id="stock" className="pile"><div className="pile-placeholder"></div></div>
                        <div id="waste" className="pile"><div className="pile-placeholder"></div></div>
                    </div>
                    <div className="foundation-piles">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} id={`foundation-${i}`} className="pile foundation">
                                <div className="pile-placeholder"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tableau-piles">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} id={`tableau-${i}`} className="pile tableau"></div>
                    ))}
                </div>

                <div className="controls">
                    <button className="new-game-btn">New Game</button>
                    <button id="leaderboard-btn" className="control-btn">Score Leaderboard</button>
                </div>
            </div>

            {/* Win Modal */}
            <div id="win-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>You Win!</h2>
                    <p>Score saved for: <span id="winning-player-name"></span></p>
                    <button className="new-game-btn play-again-btn">Play Again</button>
                </div>
            </div>

            {/* Score Leaderboard Modal */}
            <div id="leaderboard-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>Leaderboard (Total Score)</h2>
                    <table id="leaderboard-table">
                        <thead><tr><th>Rank</th><th>Name</th><th>Total Score</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <button id="close-leaderboard-btn" className="control-btn">Close</button>
                </div>
            </div>

            {/* Check-in Leaderboard Modal */}
            <div id="checkin-leaderboard-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>Check-in Leaderboard (Streak)</h2>
                    <table id="checkin-leaderboard-table">
                        <thead><tr><th>Rank</th><th>Name</th><th>Streak (days)</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <button id="close-checkin-leaderboard-btn" className="control-btn">Close</button>
                </div>
            </div>
        </>
    );
}
