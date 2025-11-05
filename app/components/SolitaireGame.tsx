// app/components/SolitaireGame.tsx
'use client';

import { useEffect } from 'react';
import '../../styles/solitaire.css';
import { ethers } from 'ethers';

// Kullanıcı cüzdanı (MetaMask/Rabby) için helper
import { getUserContract } from '@/app/lib/contract';
// Farcaster MiniApp SDK (miniapp içinden wallet provider almak için)
import { sdk } from '@farcaster/miniapp-sdk';
// Kontrat adresi/ABI (hem Farcaster hem dış cüzdan için)
import { CHECKIN_CONTRACT, CHECKIN_ABI } from '@/app/lib/contract';

interface Card {
  suit: string;
  rank: string;
  color: 'red' | 'black';
  value: number;
  isFaceUp: boolean;
}

export default function SolitaireGame({
  playerId,
  playerAddress,
  displayName,
}: {
  playerId: string;
  playerAddress: string;
  displayName?: string;
}) {
  useEffect(() => {
    // ---------- SABİTLER / DOM ----------
    const DOMAIN_TAG = window.location.hostname.replace(/\./g, '_');
    const SCORE_TOTALS_KEY = `solitaireAccumulatedScores_${DOMAIN_TAG}`;
    const currentPlayerId = playerId || '@guest';
    const isMobile = /Android|iPhone|iPad|iPod|Farcaster|Warpcast/i.test(navigator.userAgent);
    const isFarcaster = /farcaster|warpcast/i.test(navigator.userAgent);

    const SUITS = ['♠', '♣', '♥', '♦'];
    const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const stockPile = document.getElementById('stock') as HTMLElement;
    const wastePile = document.getElementById('waste') as HTMLElement;
    const foundationPiles = document.querySelectorAll('.foundation') as NodeListOf<HTMLElement>;
    const tableauPiles = document.querySelectorAll('.tableau') as NodeListOf<HTMLElement>;
    const scoreDisplay = document.querySelector('.score-display') as HTMLElement;
    const newGameButtons = document.querySelectorAll('.new-game-btn') as NodeListOf<HTMLButtonElement>;
    const gameContainer = document.getElementById('game-container') as HTMLElement;
    const winModal = document.getElementById('win-modal') as HTMLElement;
    const winningPlayerNameDisplay = document.getElementById('winning-player-name') as HTMLElement;
    const currentPlayerStatus = document.getElementById('current-player-status') as HTMLElement;
    const checkInBtn = document.getElementById('checkin-btn') as HTMLButtonElement;
    const checkInLbBtn = document.getElementById('checkin-leaderboard-btn') as HTMLButtonElement;
    const scoreLbBtn = document.getElementById('leaderboard-btn') as HTMLButtonElement;
    const checkInLbModal = document.getElementById('checkin-leaderboard-modal') as HTMLElement;
    const scoreLbModal = document.getElementById('leaderboard-modal') as HTMLElement;
    const checkInLbClose = document.getElementById('close-checkin-leaderboard-btn') as HTMLButtonElement;
    const scoreLbClose = document.getElementById('close-leaderboard-btn') as HTMLButtonElement;
    const checkInLbTbody = checkInLbModal.querySelector('tbody') as HTMLElement;
    const scoreLbTbody = scoreLbModal.querySelector('tbody') as HTMLElement;
    const streakPill = document.getElementById('streak-pill') as HTMLElement;
    const testTxBtn = document.getElementById('test-tx-btn') as HTMLButtonElement | null;

    // ---------- STATE ----------
    let deck: Card[] = [];
    let deckArr: Card[] = [];
    let cardIdCounter = 0;
    let draggedCards: HTMLElement[] = [];
    let selectedCard: HTMLElement | null = null;
    let score = 0;
    let hasWon = false;

    // ---------- HELPERS ----------
    function setScore(v: number) {
      score = Math.max(0, v);
      scoreDisplay.textContent = `Score: ${score}`;
    }
    function updateScore(d: number) {
      setScore(score + d);
    }
    function updatePlayerStatus() {
      if (currentPlayerStatus) currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`;
    }
    function saveScoreIfWin(pid: string, addScore: number) {
      const scores = JSON.parse(localStorage.getItem(SCORE_TOTALS_KEY) || '{}');
      scores[pid] = (scores[pid] || 0) + addScore;
      localStorage.setItem(SCORE_TOTALS_KEY, JSON.stringify(scores));
    }

    function ensurePlaceholder(pile: HTMLElement) {
      let ph = pile.querySelector('.pile-placeholder') as HTMLElement | null;
      if (!ph) {
        ph = document.createElement('div');
        ph.className = 'pile-placeholder';
        pile.appendChild(ph);
      }
      // tap hedefi
      if (!(ph as any)._bound) {
        (ph as any)._bound = true;
        ph.addEventListener('touchend', () => selectOrMoveCard(ph!));
        ph.addEventListener('click', () => selectOrMoveCard(ph!));
      }
    }
    function removePlaceholder(pile: HTMLElement) {
      const ph = pile.querySelector('.pile-placeholder');
      if (ph) ph.remove();
    }

    function createDeck() {
      deck = [];
      for (const s of SUITS) {
        for (const r of RANKS) {
          deck.push({
            suit: s,
            rank: r,
            color: s === '♥' || s === '♦' ? 'red' : 'black',
            value: RANKS.indexOf(r) + 1,
            isFaceUp: false,
          });
        }
      }
      deckArr = [...deck];
    }
    function shuffleDeck() {
      for (let i = deckArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckArr[i], deckArr[j]] = [deckArr[j], deckArr[i]];
      }
    }

    function createCardElement(cardData: Card) {
      const card = document.createElement('div');
      card.id = `card-${cardIdCounter++}`;
      card.classList.add('card', cardData.color);
      if (!cardData.isFaceUp) card.classList.add('face-down');
      else card.draggable = true;

      card.dataset.rank = cardData.rank;
      card.dataset.suit = cardData.suit;
      card.dataset.value = String(cardData.value);
      card.dataset.color = cardData.color;

      const rank = document.createElement('div');
      rank.classList.add('rank');
      rank.textContent = cardData.rank;
      const suit = document.createElement('div');
      suit.classList.add('suit');
      suit.textContent = cardData.suit;
      card.append(rank, suit);

      // DnD
      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragend', onDragEnd);

      // Tap to move / dbl tap to foundation
      if (isMobile) {
        card.addEventListener('touchend', (e) => {
          const now = Date.now();
          const lastTap = (card as any)._lastTap || 0;
          if (now - lastTap < 300) onCardDoubleClick(e as any);
          else selectOrMoveCard(card);
          (card as any)._lastTap = now;
        });
      } else {
        card.addEventListener('dblclick', onCardDoubleClick as any);
        card.addEventListener('click', () => selectOrMoveCard(card));
      }

      return card;
    }

    function dealCards() {
      // tableau
      for (let i = 0; i < 7; i++) {
        const pile = tableauPiles[i] as HTMLElement;
        const pileCards: Card[] = [];
        for (let j = 0; j <= i; j++) {
          const c = deckArr.pop();
          if (c) pileCards.push(c);
        }
        if (pileCards.length) pileCards[pileCards.length - 1].isFaceUp = true;
        for (const c of pileCards) pile.appendChild(createCardElement(c));
        // üzerine kart gelmişse placeholder kaldır
        if (pile.querySelector('.card')) removePlaceholder(pile);
      }
      // stock
      for (const c of deckArr) stockPile.appendChild(createCardElement(c));
      const ph = stockPile.querySelector('.pile-placeholder') as HTMLElement | null;
      if (ph) ph.style.display = 'none';
    }

    // ---------- KURALLAR ----------
    function validateMove(cardsToMove: HTMLElement[], destPile: HTMLElement) {
      const topCardToMove = cardsToMove[0];
      if (!topCardToMove || destPile === topCardToMove.parentElement) return false;

      // Foundation: aynı suit, değer +1. Boşsa sadece A
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

      // Tableau: farklı renk, değer -1. Boşsa sadece K
      if (destPile.classList.contains('tableau')) {
        const top = destPile.lastElementChild as HTMLElement | null;
        if (!top || top.classList.contains('pile-placeholder')) {
          return topCardToMove.dataset.rank === 'K';
        }
        return (
          top.dataset.color !== topCardToMove.dataset.color &&
          parseInt(top.dataset.value!) === parseInt(topCardToMove.dataset.value!) + 1
        );
      }

      return false;
    }

    function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
      // boş tableau → yalnızca K
      const isEmptyTableau =
        toPile.classList.contains('tableau') && !toPile.querySelector('.card');

      // hedefte placeholder varsa kaldır
      removePlaceholder(toPile);

      // boş değilse kuralı doğrula
      if (!isEmptyTableau && !validateMove(cards, toPile)) return;

      // taşı
      cards.forEach((c) => toPile.appendChild(c));

      // kaynak üstteki kartı aç
      if (fromPile.classList.contains('tableau')) {
        const top = fromPile.lastElementChild as HTMLElement | null;
        if (top && top.classList.contains('face-down')) {
          top.classList.remove('face-down');
          top.draggable = true;
          updateScore(5);
        }
        // kaynak boşaldıysa placeholder ekle
        if (!fromPile.querySelector('.card')) ensurePlaceholder(fromPile);
      }

      checkWinCondition();
      autoFinishIfAllOpen();
    }

    function onDragStart(e: DragEvent) {
      const card = e.target as HTMLElement;
      if (card.classList.contains('face-down')) return;
      const pile = card.parentElement as HTMLElement;
      if (pile.classList.contains('tableau')) {
        const arr = Array.from(pile.children) as HTMLElement[];
        const idx = arr.indexOf(card);
        draggedCards = arr.slice(idx);
      } else draggedCards = [card];

      e.dataTransfer?.setData('text/plain', card.id);
      setTimeout(() => draggedCards.forEach((c) => c.classList.add('dragging')), 0);
    }
    function onDragEnd() {
      draggedCards.forEach((c) => c.classList.remove('dragging'));
      draggedCards = [];
    }

    function onCardDoubleClick(e: Event) {
      const card = e.currentTarget as HTMLElement;
      const src = card.parentElement as HTMLElement;
      const v = parseInt(card.dataset.value!);

      for (const f of Array.from(foundationPiles)) {
        const top = f.lastElementChild as HTMLElement | null;
        if (!top || top.classList.contains('pile-placeholder')) {
          if (card.dataset.rank === 'A' || v === 1) {
            moveCards([card], src, f);
            return;
          }
        } else if (top.dataset.suit === card.dataset.suit && parseInt(top.dataset.value!) + 1 === v) {
          moveCards([card], src, f);
          return;
        }
      }
    }

    function selectOrMoveCard(card: HTMLElement) {
      if (card.classList.contains('face-down')) return;

      // 1) ilk seçim
      if (!selectedCard) {
        selectedCard = card;
        card.classList.add('selected');
        return;
      }

      // 2) aynı karta dokunma → iptal
      if (selectedCard === card) {
        card.classList.remove('selected');
        selectedCard = null;
        return;
      }

      // 3) hedef sütunu bul
      let destPile: HTMLElement | null = null;

      if (card.classList.contains('card')) {
        destPile = card.closest('.pile') as HTMLElement | null;
      }
      if (!destPile && card.classList.contains('pile-placeholder')) {
        destPile = card.parentElement as HTMLElement;
      }

      // 4) foundation otomatik fırsatı
      if (!destPile) {
        const v = parseInt(selectedCard.dataset.value!);
        for (const f of Array.from(foundationPiles)) {
          const top = f.lastElementChild as HTMLElement | null;
          if (!top || top.classList.contains('pile-placeholder')) {
            if (v === 1) {
              destPile = f;
              break;
            }
          } else if (top.dataset.suit === selectedCard.dataset.suit && parseInt(top.dataset.value!) + 1 === v) {
            destPile = f;
            break;
          }
        }
      }

      if (!destPile) {
        // sadece seçimi değiştir
        selectedCard.classList.remove('selected');
        selectedCard = card;
        card.classList.add('selected');
        return;
      }

      // 5) seçilen kart + altındaki açık kartlar
      const fromPile = selectedCard.parentElement as HTMLElement;
      const pileCards = Array.from(fromPile.children) as HTMLElement[];
      const selectedIndex = pileCards.indexOf(selectedCard);
      let cardsToMove: HTMLElement[] = [selectedCard];

      if (selectedIndex >= 0) {
        const tail = pileCards.slice(selectedIndex);
        cardsToMove = tail.filter((c) => !c.classList.contains('face-down'));
      }

      // 6) boş tableau → sadece K
      const isEmptyTableau =
        destPile.classList.contains('tableau') &&
        (destPile.children.length === 0 ||
          (destPile.children.length === 1 && destPile.firstElementChild?.classList.contains('pile-placeholder')));

      if (isEmptyTableau) {
        if (selectedCard.dataset.rank === 'K') {
          moveCards(cardsToMove, fromPile, destPile);
        }
        selectedCard.classList.remove('selected');
        selectedCard = null;
        return;
      }

      // 7) normal validasyon
      if (validateMove(cardsToMove, destPile)) {
        moveCards(cardsToMove, fromPile, destPile);
      }

      selectedCard?.classList.remove('selected');
      selectedCard = null;
    }

    // ---------- OTOMATİK BİTİRME ----------
    function autoFinishIfAllOpen() {
      const hidden = document.querySelectorAll('.card.face-down');
      if (hidden.length !== 0 || hasWon) return;

      let moved = true;
      let safety = 0;
      while (moved && safety++ < 100) {
        moved = false;
        const allTableau = Array.from(tableauPiles) as HTMLElement[];
        for (const pile of allTableau) {
          const top = pile.lastElementChild as HTMLElement | null;
          if (!top || top.classList.contains('face-down')) continue;

          const v = parseInt(top.dataset.value!);
          for (const f of Array.from(foundationPiles) as HTMLElement[]) {
            const fTop = f.lastElementChild as HTMLElement | null;

            if (!fTop || fTop.classList.contains('pile-placeholder')) {
              if (top.dataset.rank === 'A' || v === 1) {
                moveCards([top], pile, f);
                moved = true;
                break;
              }
            } else if (fTop.dataset.suit === top.dataset.suit && parseInt(fTop.dataset.value!) + 1 === v) {
              moveCards([top], pile, f);
              moved = true;
              break;
            }
          }
        }
      }
    }

    // ---------- KAZANMA & ON-CHAIN ----------
    async function checkWinCondition() {
      let total = 0;
      foundationPiles.forEach((p) => {
        total += (p as HTMLElement).querySelectorAll('.card').length;
      });
      if (total !== 52 || hasWon) return;

      hasWon = true;
      saveScoreIfWin(currentPlayerId, score);

      if (winningPlayerNameDisplay)
        winningPlayerNameDisplay.textContent = `${displayName || currentPlayerId} (${score} pts)`;

      winModal.classList.add('show');

      const confirmDiv = document.getElementById('onchain-confirm');
      if (confirmDiv) {
        confirmDiv.textContent = '⌛ Waiting for wallet confirmation...';
        confirmDiv.classList.remove('confirmed');
      }

      try {
        let txHash: string | null = null;
        let toAddr: string | null = null;

        if (isFarcaster && (window as any).sdk?.wallet) {
          // Farcaster MiniApp içinden
          const provider = await sdk.wallet.getEthereumProvider();
          const browserProvider = new ethers.BrowserProvider(provider);
          const signer = await browserProvider.getSigner();
          const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, signer);

          const tx = await contract.recordMyWin(score);
          const rc = await tx.wait();
          txHash = (rc as any).hash ?? (rc as any).transactionHash;
          toAddr = await signer.getAddress();
        } else {
          // Dış cüzdan (MetaMask / Rabby)
          const { contract, signer } = await getUserContract();

          if (playerAddress) {
            try {
              toAddr = ethers.getAddress(playerAddress);
            } catch {
              toAddr = null;
            }
          }
          if (!toAddr) toAddr = await signer.getAddress();

          const tx = await contract.recordMyWin(score);
          const rc = await tx.wait();
          txHash = (rc as any).hash ?? (rc as any).transactionHash;
        }

        if (confirmDiv && txHash) {
          const url = `https://basescan.org/tx/${txHash}`;
          confirmDiv.innerHTML = `✅ On-chain confirmed<br><a href="${url}" target="_blank" rel="noreferrer">View on Basescan</a>`;
          confirmDiv.classList.add('confirmed');
        }

        // KV’ye yaz (off-chain liderboard)
        fetch('/api/recordwin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerAddress: toAddr, score, displayName }),
        }).catch(() => {});
      } catch (err) {
        console.error('⚠️ recordMyWin failed:', err);
        const div = document.getElementById('onchain-confirm');
        if (div) div.textContent = '⚠️ Transaction rejected or failed';
      }
    }

    // ---------- CHECK-IN & LEADERBOARD ----------
    async function doDailyCheckIn() {
      if (!playerAddress) return;
      try {
        const r = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerAddress, displayName, onchain: false }),
        });
        const d = await r.json();
        if (d.ok) {
          if (!d.alreadyToday) {
            setScore(score + d.add);
            checkInBtn.textContent = `✓ Checked In Today (+${d.add})`;
            checkInBtn.classList.add('checked');
            checkInBtn.setAttribute('aria-disabled', 'true');
          }
          if (streakPill) {
            if (d.streak > 0) {
              streakPill.textContent = `🔥 Streak: ${d.streak}`;
              streakPill.classList.remove('hidden');
            } else streakPill.classList.add('hidden');
          }
        }
      } catch (e) {
        console.error('checkin failed', e);
      }
    }

    async function openCheckinLeaderboard() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const url = `${base}/api/leaderboard/checkin?limit=20`;

        const r = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          mode: 'cors',
        });
        if (!r.ok) return;

        const d = await r.json();
        checkInLbTbody.innerHTML = '';
        (d.items || []).forEach((it: any, i: number) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${i + 1}</td><td>${it.name}</td><td>${it.points}</td>`;
          checkInLbTbody.appendChild(tr);
        });
        checkInLbModal.classList.add('show');
      } catch (err) {
        console.error('⚠️ Failed to fetch leaderboard:', err);
      }
    }

    async function openScoreLeaderboard() {
      const r = await fetch('/api/leaderboard/score?limit=20');
      const d = await r.json();
      scoreLbTbody.innerHTML = '';
      (d.items || []).forEach((it: any, i: number) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${it.name}</td><td>${it.score}</td>`;
        scoreLbTbody.appendChild(tr);
      });
      scoreLbModal.classList.add('show');
    }

    // ---------- STOCK / WASTE ----------
    stockPile.addEventListener('click', () => {
      const top = stockPile.lastElementChild as HTMLElement;
      if (top && !top.classList.contains('pile-placeholder')) {
        top.classList.remove('face-down');
        top.draggable = true;
        wastePile.appendChild(top);
      } else {
        const wasteCards = Array.from(wastePile.querySelectorAll('.card')).reverse() as HTMLElement[];
        wasteCards.forEach((c) => {
          c.classList.add('face-down');
          c.draggable = false;
          stockPile.appendChild(c);
        });
      }
    });

    // ---------- DnD hedefleri ----------
    [...foundationPiles, ...tableauPiles].forEach((p) =>
      p.addEventListener('dragover', (e) => e.preventDefault()),
    );
    [...foundationPiles, ...tableauPiles].forEach((p) =>
      p.addEventListener('drop', (e) => {
        e.preventDefault();
        const dest = e.currentTarget as HTMLElement;
        if (validateMove(draggedCards, dest)) {
          moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
        }
      }),
    );

    // ---------- TOUCH BINDER ----------
    function attachTouchHandlers() {
      document.querySelectorAll('.pile-placeholder').forEach((ph) => {
        const h = ph as HTMLElement;
        if (!(h as any)._bound) {
          (h as any)._bound = true;
          h.addEventListener('touchend', () => selectOrMoveCard(h));
          h.addEventListener('click', () => selectOrMoveCard(h));
        }
      });
      document.querySelectorAll('.card').forEach((c) => {
        const h = c as HTMLElement;
        if (!(h as any)._touchBound) {
          (h as any)._touchBound = true;
          h.addEventListener('touchend', () => selectOrMoveCard(h));
          h.addEventListener('click', () => selectOrMoveCard(h));
        }
      });
    }

    // ---------- RESET ----------
    function resetGame() {
      cardIdCounter = 0;
      hasWon = false;
      setScore(0);

      // stock & foundations temizle + placeholder
      [stockPile, wastePile, ...Array.from(foundationPiles)].forEach((p) => {
        p.innerHTML = '';
        ensurePlaceholder(p);
      });

      // tableau temizle + placeholder
      Array.from(tableauPiles).forEach((p) => {
        p.innerHTML = '';
        ensurePlaceholder(p);
      });

      winModal.classList.remove('show');
      draggedCards = [];
      selectedCard = null;

      createDeck();
      shuffleDeck();
      dealCards();

      // stock placeholder gizle
      const ph = stockPile.querySelector('.pile-placeholder') as HTMLElement | null;
      if (ph) ph.style.display = 'none';

      gameContainer.classList.add('active');
    }

    // ---------- BUTONLAR & İLK DAĞITIM ----------
    newGameButtons.forEach((b) => {
      if ((b as any)._bound) return;
      (b as any)._bound = true;
      b.addEventListener('click', () => {
        resetGame();
        setTimeout(attachTouchHandlers, 100);
      });
    });

    resetGame();
    setTimeout(attachTouchHandlers, 100);

    checkInBtn.addEventListener('click', doDailyCheckIn);
    checkInLbBtn.addEventListener('click', openCheckinLeaderboard);
    scoreLbBtn.addEventListener('click', openScoreLeaderboard);
    checkInLbClose.addEventListener('click', () => checkInLbModal.classList.remove('show'));
    scoreLbClose.addEventListener('click', () => scoreLbModal.classList.remove('show'));

    updatePlayerStatus();

    if (testTxBtn && !(testTxBtn as any)._bound) {
      (testTxBtn as any)._bound = true;
      testTxBtn.addEventListener('click', async () => {
        try {
          const { contract } = await getUserContract();
          const tx = await contract.recordMyWin(123);
          const receipt = await tx.wait();
          alert(`✅ TX Confirmed!\n${(receipt as any).transactionHash ?? (receipt as any).hash}`);
        } catch (err) {
          console.error('❌ Test TX failed:', err);
          alert('❌ TX failed. Check console for details.');
        }
      });
    }

    // cleanup (gerekirse)
    return () => {};
  }, [playerId, playerAddress, displayName]);

  // ---------- JSX (useEffect DIŞI) ----------
  return (
    <>
      <div className="game-container" id="game-container">
        <h1>Solitaire</h1>
        <div className="score-display">Score: 0</div>
        <div id="current-player-status"></div>

        {/* 🃏 Daily Check-in */}
        <div className="checkin-wrapper">
          <div id="streak-pill" className="streak-pill hidden">
            🔥 Streak: 0
          </div>
          <button id="checkin-btn" className="checkin-btn" aria-disabled="false">
            🃏 Claim Daily Reward
          </button>
          <div className="checkin-hint">+5 daily • +10 every 3 days bonus</div>

          <div className="checkin-controls">
            <button id="checkin-leaderboard-btn" className="control-btn alt">
              🏆 Check-in Leaderboard
            </button>
            <button id="leaderboard-btn" className="control-btn alt">
              🧮 Score Leaderboard
            </button>
          </div>
        </div>

        {/* 🂡 Game Area */}
        <div className="top-piles">
          <div className="stock-waste-piles">
            <div id="stock" className="pile">
              <div className="pile-placeholder"></div>
            </div>
            <div id="waste" className="pile">
              <div className="pile-placeholder"></div>
            </div>
          </div>
          <div className="foundation-piles">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} id={`foundation-${i}`} className="pile foundation">
                <div className="pile-placeholder"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="tableau-piles">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} id={`tableau-${i}`} className="pile tableau"></div>
          ))}
        </div>

        {/* 🔁 Controls */}
        <div className="controls">
          <button className="new-game-btn">♻️ New Game</button>
          <button id="test-tx-btn" className="control-btn">
            🧪 Test Onchain TX
          </button>
        </div>
      </div>

      {/* 🏅 Win Modal */}
      <div id="win-modal" className="modal-overlay">
        <div className="modal-content">
          <h2>You Win!</h2>
          <p>
            Score saved for: <span id="winning-player-name"></span>
          </p>
          <p id="onchain-confirm" className="onchain-status">
            ⌛ Pending on-chain confirmation...
          </p>
          <button className="new-game-btn play-again-btn">Play Again</button>
        </div>
      </div>

      {/* 🧮 Score Leaderboard */}
      <div id="leaderboard-modal" className="modal-overlay">
        <div className="modal-content">
          <h2>🏆 Leaderboard (Win Score)</h2>
          <table id="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <button id="close-leaderboard-btn" className="control-btn">
            Close
          </button>
        </div>
      </div>

      {/* 🃏 Check-in Leaderboard */}
      <div id="checkin-leaderboard-modal" className="modal-overlay">
        <div className="modal-content">
          <h2>🏅 Leaderboard (Check-in Points)</h2>
          <table id="checkin-leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
          <button id="close-checkin-leaderboard-btn" className="control-btn">
            Close
          </button>
        </div>
      </div>
    </>
  );
}
