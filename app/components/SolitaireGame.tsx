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
        const isMobile = /Android|iPhone|iPad|iPod|Mobile|Farcaster/i.test(navigator.userAgent);

        let currentPlayerId = playerId || '@guest';
        const SUITS = ['♠', '♣', '♥', '♦'];
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const ACCUMULATED_SCORES_KEY = 'solitaireAccumulatedScores';

        const stockPile = document.getElementById('stock')!;
        const wastePile = document.getElementById('waste')!;
        const foundationPiles = document.querySelectorAll('.foundation');
        const tableauPiles = document.querySelectorAll('.tableau');
        const scoreDisplay = document.querySelector('.score-display')!;
        const newGameButtons = document.querySelectorAll('.new-game-btn');
        const gameContainer = document.getElementById('game-container')!;
        const winModal = document.getElementById('win-modal')!;
        const finalScoreDisplay = document.getElementById('final-score');
        const winningPlayerNameDisplay = document.getElementById('winning-player-name')!;
        const leaderboardBtn = document.getElementById('leaderboard-btn')!;
        const leaderboardModal = document.getElementById('leaderboard-modal')!;
        const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn')!;
        const leaderboardTableBody = leaderboardModal.querySelector('tbody')!;
        const autoFinishBtn = document.getElementById('auto-finish-btn') as HTMLButtonElement | null;
        const currentPlayerStatus = document.getElementById('current-player-status');

        let deck: Card[] = [];
        let score = 0;
        let cardIdCounter = 0;
        let draggedCards: HTMLElement[] = [];
        let isGameActive = false;

        function updatePlayerStatus() {
            if (currentPlayerStatus)
                currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`;
        }

        function saveAccumulatedScore(pid: string, newScore: number) {
            const scores = JSON.parse(localStorage.getItem(ACCUMULATED_SCORES_KEY) || '{}');
            scores[pid] = (scores[pid] || 0) + newScore;
            localStorage.setItem(ACCUMULATED_SCORES_KEY, JSON.stringify(scores));
        }

        function handleGameEndOrReset(_isWin = false) {
            if (!isGameActive && score === 0) return;
            saveAccumulatedScore(currentPlayerId, score);
            isGameActive = false;
        }

        function updateScore(points: number, absolute = false) {
            if (absolute) score = points;
            else score += points;
            if (score < 0) score = 0;
            (scoreDisplay as HTMLElement).textContent = `Score: ${score}`;
            if (points !== 0) isGameActive = true;
        }

        function createDeck() {
            deck = [];
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    deck.push({
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
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }

        function createCardElement(cardData: Card) {
            const card = document.createElement('div');
            card.id = `card-${cardIdCounter++}`;
            card.classList.add('card', cardData.color);

            if (!cardData.isFaceUp) {
                card.classList.add('face-down');
            } else {
                // 💻 web: draggable açık, 📱 mobil: kapalı
                card.draggable = !isMobile;
            }

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

            // 💻 Web: drag & drop + double-click
            card.addEventListener('dragstart', onDragStart);
            card.addEventListener('dragend', onDragEnd);
            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                onCardDoubleClick(e);
            });

            // 📱 Mobil: pointer events ile anında tepki (tap-to-move + double-tap)
            if (isMobile) {
                card.draggable = false;
                let lastTap = 0;

                card.addEventListener('pointerup', (e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (el.classList.contains('face-down')) return;

                    const now = Date.now();
                    const dt = now - lastTap;
                    lastTap = now;

                    // 👆👆 double-tap (240ms eşiği ile hızlı)
                    if (dt < 240) { onCardDoubleClick(e as any); return; }

                    // 👆 tek tap → seç / taşı
                    const selected = document.querySelector('.card.selected') as HTMLElement | null;
                    if (!selected) {
                        el.classList.add('selected');
                        try { (navigator as any).vibrate?.(12); } catch {}
                        return;
                    }
                    if (selected === el) {
                        el.classList.remove('selected');
                        return;
                    }
                    const src = selected.parentElement as HTMLElement;
                    const dest = el.parentElement as HTMLElement;
                    if (validateMove([selected], dest)) moveCards([selected], src, dest);
                    selected.classList.remove('selected');
                });
            }

            return card;
        }

        function dealCards() {
            // Tableau
            for (let i = 0; i < 7; i++) {
                const pileCards: Card[] = [];
                for (let j = 0; j <= i; j++) {
                    const cardData = deck.pop();
                    if (cardData) pileCards.push(cardData);
                }
                if (pileCards.length > 0) pileCards[pileCards.length - 1].isFaceUp = true;
                for (const cardData of pileCards) {
                    (tableauPiles[i] as HTMLElement).appendChild(createCardElement(cardData));
                }
            }
            // Stock
            for (const cardData of deck) {
                stockPile.appendChild(createCardElement(cardData));
            }
            const placeholder = stockPile.querySelector('.pile-placeholder') as HTMLElement | null;
            if (placeholder) placeholder.style.display = 'none';
        }

        function resetGame() {
            handleGameEndOrReset(false);
            cardIdCounter = 0;

            [stockPile, wastePile, ...foundationPiles, ...tableauPiles].forEach(pile => {
                const el = pile as HTMLElement;
                el.innerHTML = '';
                if (el.classList.contains('foundation') || el.id === 'waste' || el.id === 'stock') {
                    el.innerHTML = '<div class="pile-placeholder"></div>';
                }
            });

            winModal.classList.remove('show');
            leaderboardModal.classList.remove('show');
            if (autoFinishBtn) autoFinishBtn.style.display = 'none';
            winningPlayerNameDisplay.textContent = currentPlayerId;

            updateScore(0, true);
            createDeck();
            shuffleDeck();
            dealCards();

            // ✅ görünürlük garantisi (splash sonrası)
            gameContainer.classList.add('active');
        }

        function validateMove(cardsToMove: HTMLElement[], destPile: HTMLElement) {
            const topCardToMove = cardsToMove[0];
            if (destPile === topCardToMove.parentElement) return false;

            if (destPile.classList.contains('foundation')) {
                if (cardsToMove.length > 1) return false;
                const top = destPile.lastElementChild as HTMLElement | null;
                if (!top && topCardToMove.dataset.value === '1') return true;
                if (top && top.dataset.suit === topCardToMove.dataset.suit &&
                    parseInt(top.dataset.value!) + 1 === parseInt(topCardToMove.dataset.value!)) return true;
            }

            if (destPile.classList.contains('tableau')) {
                const top = destPile.lastElementChild as HTMLElement | null;
                if (!top) return topCardToMove.dataset.rank === 'K';
                if (top.dataset.color !== topCardToMove.dataset.color &&
                    parseInt(top.dataset.value!) === parseInt(topCardToMove.dataset.value!) + 1) return true;
            }
            return false;
        }

        function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
            cards.forEach(card => toPile.appendChild(card));

            // skor
            if (toPile.classList.contains('foundation')) updateScore(10);
            else if (fromPile.id === 'waste' && toPile.classList.contains('tableau')) updateScore(5);
            else if (fromPile.classList.contains('foundation') && toPile.classList.contains('tableau')) updateScore(-15);

            // tableau'da üst kartı çevir
            if (fromPile.classList.contains('tableau') && fromPile.children.length > 0) {
                const topCard = fromPile.lastElementChild as HTMLElement;
                if (topCard.classList.contains('face-down')) {
                    topCard.classList.remove('face-down');
                    topCard.draggable = !isMobile;
                    updateScore(5);
                }
            }
        }

        // 💻 Drag & Drop (web)
        function onDragStart(e: DragEvent) {
            const draggedCard = e.target as HTMLElement;
            if (!draggedCard || draggedCard.classList.contains('face-down')) return;
            const pile = draggedCard.parentElement as HTMLElement;
            if (pile.classList.contains('tableau')) {
                const all = Array.from(pile.children) as HTMLElement[];
                const idx = all.indexOf(draggedCard);
                draggedCards = all.slice(idx);
            } else {
                draggedCards = [draggedCard];
            }
            e.dataTransfer?.setData('text/plain', draggedCard.id);
            setTimeout(() => draggedCards.forEach(c => c.classList.add('dragging')), 0);
        }
        function onDragOver(e: DragEvent) { e.preventDefault(); }
        function onDrop(e: DragEvent) {
            e.preventDefault();
            const dest = e.currentTarget as HTMLElement;
            if (draggedCards.length && validateMove(draggedCards, dest)) {
                moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
            }
        }
        function onDragEnd() { draggedCards.forEach(c => c.classList.remove('dragging')); draggedCards = []; }

        // 💻 dblclick + 📱 double-tap birleşik handler
        function onCardDoubleClick(e: MouseEvent) {
            const card = e.currentTarget as HTMLElement;
            const src = card.parentElement as HTMLElement;
            const value = parseInt(card.dataset.value!);

            for (const foundationPile of Array.from(foundationPiles) as HTMLElement[]) {
                const top = foundationPile.lastElementChild as HTMLElement | null;

                // boş foundation ve As
                if ((!top || top.classList.contains('pile-placeholder')) && (card.dataset.rank === 'A' || value === 1)) {
                    moveCards([card], src, foundationPile);
                    updateScore(10);
                    return;
                }
                // aynı suit ve +1
                if (top && top.dataset.suit === card.dataset.suit &&
                    parseInt(top.dataset.value!) + 1 === value) {
                    moveCards([card], src, foundationPile);
                    updateScore(10);
                    return;
                }
            }
        }

        // Listeners
        newGameButtons.forEach(b => b.addEventListener('click', resetGame));

        [...foundationPiles, ...tableauPiles].forEach(p => {
            (p as HTMLElement).addEventListener('drop', onDrop as any);
            (p as HTMLElement).addEventListener('dragover', onDragOver as any);
        });

        // 📱 Mobil: boş pile'a dokunarak taşıma (pointerup ile hızlı)
        if (isMobile) {
            [...foundationPiles, ...tableauPiles].forEach(p => {
                (p as HTMLElement).addEventListener('pointerup', () => {
                    const selected = document.querySelector('.card.selected') as HTMLElement | null;
                    if (!selected) return;
                    const dest = p as HTMLElement;
                    const src = selected.parentElement as HTMLElement;
                    if (validateMove([selected], dest)) moveCards([selected], src, dest);
                    selected.classList.remove('selected');
                });
            });
        }

        // stok tıklamaları
        stockPile.addEventListener('click', () => {
            const card = stockPile.lastElementChild as HTMLElement | null;
            if (card && !card.classList.contains('pile-placeholder')) {
                card.classList.remove('face-down');
                card.draggable = !isMobile;
                wastePile.appendChild(card);
            } else {
                const wasteCards = Array.from(wastePile.querySelectorAll('.card')).reverse() as HTMLElement[];
                wasteCards.forEach(c => {
                    c.classList.add('face-down');
                    c.draggable = false;
                    stockPile.appendChild(c);
                });
            }
        });

        leaderboardBtn.addEventListener('click', () => {
            const scores = JSON.parse(localStorage.getItem(ACCUMULATED_SCORES_KEY) || '{}');
            const sorted = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
            leaderboardTableBody.innerHTML = '';
            sorted.slice(0, 10).forEach(([n, s], i) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${i + 1}</td><td>${n}</td><td>${s}</td>`;
                leaderboardTableBody.append(row);
            });
            leaderboardModal.classList.add('show');
        });
        closeLeaderboardBtn.addEventListener('click', () => leaderboardModal.classList.remove('show'));

        updatePlayerStatus();
        resetGame();
        gameContainer.classList.add('active'); // ekstra garanti
    }, [playerId]);

    return (
        <>
            <div className="game-container" id="game-container">
                <h1>Solitaire</h1>
                <div className="score-display">Score: 0</div>
                <div id="current-player-status"></div>

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
                    <button id="leaderboard-btn" className="control-btn">Leaderboard</button>
                    <button id="auto-finish-btn" className="control-btn" style={{ display: 'none' }}>Auto-Finish</button>
                </div>
            </div>

            <div id="win-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>You Win!</h2>
                    <p id="final-score"></p>
                    <p>Score saved for: <span id="winning-player-name"></span></p>
                    <button className="new-game-btn play-again-btn">Play Again</button>
                </div>
            </div>

            <div id="leaderboard-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>Leaderboard (Accumulated Score)</h2>
                    <table id="leaderboard-table">
                        <thead><tr><th>Rank</th><th>Name</th><th>Total Score</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <button id="close-leaderboard-btn" className="control-btn">Close</button>
                </div>
            </div>
        </>
    );
}
