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
        let currentPlayerId = playerId || '@guest';
        const SUITS = ['♠', '♣', '♥', '♦'];
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const WINS_KEY = 'solitaireWins';

        const stockPile = document.getElementById('stock');
        const wastePile = document.getElementById('waste');
        const foundationPiles = document.querySelectorAll('.foundation');
        const tableauPiles = document.querySelectorAll('.tableau');
        const newGameButtons = document.querySelectorAll('.new-game-btn');
        const gameContainer = document.getElementById('game-container');
        const winModal = document.getElementById('win-modal');
        const winningPlayerNameDisplay = document.getElementById('winning-player-name');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const leaderboardModal = document.getElementById('leaderboard-modal');
        const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
        const leaderboardTableBody = leaderboardModal!.querySelector('tbody');
        const currentPlayerStatus = document.getElementById('current-player-status');

        let deck: Card[] = [];
        let cardIdCounter = 0;
        let draggedCards: HTMLElement[] = [];

        // 🧩 Oyuncu adı
        function updatePlayerStatus() {
            if (currentPlayerStatus)
                currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`;
        }

        // 🏆 Win kaydet
        function saveWin(playerId: string) {
            const wins = JSON.parse(localStorage.getItem(WINS_KEY) || '{}');
            wins[playerId] = (wins[playerId] || 0) + 1;
            localStorage.setItem(WINS_KEY, JSON.stringify(wins));
        }

        // 🔁 Yeni oyun başlat
        function resetGame() {
            cardIdCounter = 0;
            [stockPile, wastePile, ...foundationPiles, ...tableauPiles].forEach(pile => {
                pile!.innerHTML = '';
                if (pile!.classList.contains('foundation') || pile!.id === 'waste' || pile!.id === 'stock')
                    pile!.innerHTML = '<div class="pile-placeholder"></div>';
            });
            winModal!.classList.remove('show');
            leaderboardModal!.classList.remove('show');
            createDeck();
            shuffleDeck();
            dealCards();
            gameContainer!.classList.add('active');
        }

        // 🎴 Deste oluştur
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

        // 🔀 Karıştır
        function shuffleDeck() {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        }

        // 🂡 Kart DOM
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
            card.addEventListener('dragstart', onDragStart);
            card.addEventListener('dragend', onDragEnd);
            card.addEventListener('dblclick', e => {
                e.stopPropagation();
                onCardDoubleClick(e);
            });
            card.addEventListener('touchend', e => {
                const now = Date.now();
                const lastTap = (card as any)._lastTap || 0;
                if (now - lastTap < 300) onCardDoubleClick(e as any);
                (card as any)._lastTap = now;
            });

            return card;
        }

        // 🃏 Kartları dağıt
        function dealCards() {
            for (let i = 0; i < 7; i++) {
                const pileCards: Card[] = [];
                for (let j = 0; j <= i; j++) {
                    const cardData = deck.pop();
                    if (cardData) pileCards.push(cardData);
                }
                if (pileCards.length > 0) pileCards[pileCards.length - 1].isFaceUp = true;
                for (const cardData of pileCards) {
                    const cardElement = createCardElement(cardData);
                    (tableauPiles[i] as HTMLElement).appendChild(cardElement);
                }
            }
            for (const cardData of deck) {
                const cardElement = createCardElement(cardData);
                stockPile!.appendChild(cardElement);
            }
            const placeholder = stockPile!.querySelector('.pile-placeholder') as HTMLElement | null;
            if (placeholder) placeholder.style.display = 'none';
        }

        // ♣️♦️ Kurallı taşıma kontrolü
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

        // 🔁 Kart taşıma işlemi
        function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
            cards.forEach(card => toPile.appendChild(card));
            if (fromPile.classList.contains('tableau') && fromPile.children.length > 0) {
                const topCard = fromPile.lastElementChild as HTMLElement;
                if (topCard.classList.contains('face-down')) {
                    topCard.classList.remove('face-down');
                    topCard.draggable = true;
                }
            }
            checkWinCondition();
        }

        // 🏁 Kazanma kontrolü
        function checkWinCondition() {
            let totalFoundationCards = 0;
            foundationPiles.forEach(pile => {
                totalFoundationCards += (pile as HTMLElement).querySelectorAll('.card').length;
            });
            if (totalFoundationCards === 52) {
                saveWin(currentPlayerId);
                console.log(`🏆 ${currentPlayerId} won the game!`);
                winningPlayerNameDisplay!.textContent = currentPlayerId;
                winModal!.classList.add('show');
            }
        }

        // 🎯 Drag & Drop
        function onDragStart(e: DragEvent) {
            const draggedCard = e.target as HTMLElement;
            if (draggedCard.classList.contains('face-down')) return;
            const pile = draggedCard.parentElement as HTMLElement;
            if (pile.classList.contains('tableau')) {
                const all = Array.from(pile.children) as HTMLElement[];
                const idx = all.indexOf(draggedCard);
                draggedCards = all.slice(idx);
            } else draggedCards = [draggedCard];
            e.dataTransfer!.setData('text/plain', draggedCard.id);
            setTimeout(() => draggedCards.forEach(c => c.classList.add('dragging')), 0);
        }
        function onDragOver(e: DragEvent) { e.preventDefault(); }
        function onDrop(e: DragEvent) {
            e.preventDefault();
            const dest = e.currentTarget as HTMLElement;
            if (validateMove(draggedCards, dest))
                moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
        }
        function onDragEnd() { draggedCards.forEach(c => c.classList.remove('dragging')); draggedCards = []; }

        // ♠️ Otomatik çift tıklama taşıması
        function onCardDoubleClick(e: MouseEvent) {
            const card = e.currentTarget as HTMLElement;
            const src = card.parentElement as HTMLElement;
            const value = parseInt(card.dataset.value!);

            for (const foundationPile of Array.from(foundationPiles) as HTMLElement[]) {
                const top = foundationPile.lastElementChild as HTMLElement | null;
                if ((!top || top.classList.contains('pile-placeholder')) &&
                    (card.dataset.rank === 'A' || value === 1)) {
                    moveCards([card], src, foundationPile);
                    return;
                }
                if (top && top.dataset.suit === card.dataset.suit &&
                    parseInt(top.dataset.value!) + 1 === value) {
                    moveCards([card], src, foundationPile);
                    return;
                }
            }
        }

        // 🧠 Event listeners
        newGameButtons.forEach(b => b.addEventListener('click', resetGame));
        [...foundationPiles, ...tableauPiles].forEach(p =>
            (p as HTMLElement).addEventListener('drop', onDrop as any)
        );
        [...foundationPiles, ...tableauPiles].forEach(p =>
            (p as HTMLElement).addEventListener('dragover', onDragOver as any)
        );
        stockPile!.addEventListener('click', () => {
            const card = stockPile!.lastElementChild as HTMLElement;
            if (card && !card.classList.contains('pile-placeholder')) {
                card.classList.remove('face-down');
                card.draggable = true;
                wastePile!.appendChild(card);
            } else {
                const wasteCards = Array.from(wastePile!.querySelectorAll('.card')).reverse() as HTMLElement[];
                wasteCards.forEach(c => { c.classList.add('face-down'); c.draggable = false; stockPile!.appendChild(c); });
            }
        });

        leaderboardBtn!.addEventListener('click', () => {
            const wins = JSON.parse(localStorage.getItem(WINS_KEY) || '{}');
            const sorted = Object.entries(wins).sort((a, b) => (b[1] as number) - (a[1] as number));
            leaderboardTableBody!.innerHTML = '';
            sorted.slice(0, 10).forEach(([n, w], i) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${i + 1}</td><td>${n}</td><td>${w}</td>`;
                leaderboardTableBody!.append(row);
            });
            leaderboardModal!.classList.add('show');
        });

        closeLeaderboardBtn!.addEventListener('click', () => leaderboardModal!.classList.remove('show'));

        const playAgainBtn = document.querySelector('.play-again-btn') as HTMLButtonElement | null;
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                winModal!.classList.remove('show');
                resetGame();
            });
        }

        updatePlayerStatus();
        resetGame();
    }, [playerId]);

    return (
        <>
            <div className="game-container" id="game-container">
                <h1>Solitaire</h1>
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
                </div>
            </div>

            <div id="win-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>You Win!</h2>
                    <p>Win recorded for: <span id="winning-player-name"></span></p>
                    <button className="new-game-btn play-again-btn">Play Again</button>
                </div>
            </div>

            <div id="leaderboard-modal" className="modal-overlay">
                <div className="modal-content">
                    <h2>Leaderboard (Total Wins)</h2>
                    <table id="leaderboard-table">
                        <thead><tr><th>Rank</th><th>Name</th><th>Total Wins</th></tr></thead>
                        <tbody></tbody>
                    </table>
                    <button id="close-leaderboard-btn" className="control-btn">Close</button>
                </div>
            </div>
        </>
    );
}