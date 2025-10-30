'use client';
import { useEffect } from 'react';
import '../../styles/solitaire.css';

interface Card {
  suit: string; rank: string; color: 'red' | 'black'; value: number; isFaceUp: boolean;
}

export default function SolitaireGame({
  playerId,
  playerAddress,
  displayName
}: {
  playerId: string;
  playerAddress: string;   // 0x...
  displayName?: string;    // örn. Farcaster username
}) {
  useEffect(() => {
    const DOMAIN_TAG = window.location.hostname.replace(/\./g, '_');
    const SCORE_TOTALS_KEY = `solitaireAccumulatedScores_${DOMAIN_TAG}`;
    const currentPlayerId = playerId || '@guest';
    const isMobile = /Android|iPhone|iPad|iPod|Farcaster|Warpcast/i.test(navigator.userAgent);

    const SUITS = ['♠','♣','♥','♦'];
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

    const stockPile = document.getElementById('stock')!;
    const wastePile = document.getElementById('waste')!;
    const foundationPiles = document.querySelectorAll('.foundation');
    const tableauPiles = document.querySelectorAll('.tableau');
    const scoreDisplay = document.querySelector('.score-display')!;
    const newGameButtons = document.querySelectorAll('.new-game-btn');
    const gameContainer = document.getElementById('game-container')!;
    const winModal = document.getElementById('win-modal')!;
    const winningPlayerNameDisplay = document.getElementById('winning-player-name')!;
    const currentPlayerStatus = document.getElementById('current-player-status')!;
    const checkInBtn = document.getElementById('checkin-btn')!;
    const checkInLbBtn = document.getElementById('checkin-leaderboard-btn')!;
    const scoreLbBtn = document.getElementById('leaderboard-btn')!;
    const checkInLbModal = document.getElementById('checkin-leaderboard-modal')!;
    const scoreLbModal = document.getElementById('leaderboard-modal')!;
    const checkInLbClose = document.getElementById('close-checkin-leaderboard-btn')!;
    const scoreLbClose = document.getElementById('close-leaderboard-btn')!;
    const checkInLbTbody = checkInLbModal.querySelector('tbody')!;
    const scoreLbTbody = scoreLbModal.querySelector('tbody')!;
    const streakPill = document.getElementById('streak-pill')!;

    let deck: Card[] = [];
    let deckArr: Card[] = [];
    let cardIdCounter = 0;
    let draggedCards: HTMLElement[] = [];
    let selectedCard: HTMLElement | null = null;
    let score = 0;
    let hasWon = false;

    function setScore(v:number){ score = Math.max(0,v); (scoreDisplay as any).textContent = `Score: ${score}`; }
    function updateScore(d:number){ setScore(score + d); }
    function updatePlayerStatus(){ if(currentPlayerStatus) currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`; }

    function saveScoreIfWin(playerId: string, addScore: number) {
      const scores = JSON.parse(localStorage.getItem(SCORE_TOTALS_KEY) || '{}');
      scores[playerId] = (scores[playerId] || 0) + addScore;
      localStorage.setItem(SCORE_TOTALS_KEY, JSON.stringify(scores));
    }


    function createDeck() {
      deck = [];
      for (const s of SUITS) for (const r of RANKS) {
        deck.push({ suit: s, rank: r, color: (s==='♥'||s==='♦')?'red':'black', value: RANKS.indexOf(r)+1, isFaceUp:false });
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
      if (!cardData.isFaceUp) card.classList.add('face-down'); else card.draggable = true;
      card.dataset.rank = cardData.rank; card.dataset.suit = cardData.suit;
      card.dataset.value = String(cardData.value); card.dataset.color = cardData.color;

      const rank = document.createElement('div'); rank.classList.add('rank'); rank.textContent = cardData.rank;
      const suit = document.createElement('div'); suit.classList.add('suit'); suit.textContent = cardData.suit;
      card.append(rank, suit);

      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragend', onDragEnd);

      if (isMobile) {
        card.addEventListener('touchend', (e) => {
          const now = Date.now(); const lastTap = (card as any)._lastTap || 0;
          if (now - lastTap < 300) onCardDoubleClick(e as any);
          else selectOrMoveCard(card);
          (card as any)._lastTap = now;
        });
      } else {
        card.addEventListener('dblclick', onCardDoubleClick as any);
      }
      return card;
    }

    function dealCards() {
      for (let i=0;i<7;i++){
        const pileCards: Card[] = [];
        for (let j=0;j<=i;j++){ const c = deckArr.pop(); if(c) pileCards.push(c); }
        if (pileCards.length) pileCards[pileCards.length-1].isFaceUp = true;
        for (const c of pileCards) (tableauPiles[i] as HTMLElement).appendChild(createCardElement(c));
      }
      for (const c of deckArr) stockPile.appendChild(createCardElement(c));
      const ph = stockPile.querySelector('.pile-placeholder') as HTMLElement|null;
      if (ph) ph.style.display = 'none';
    }

    function validateMove(cardsToMove: HTMLElement[], destPile: HTMLElement) {
      const topCardToMove = cardsToMove[0];
      if (destPile === topCardToMove.parentElement) return false;
      if (destPile.classList.contains('foundation')) {
        if (cardsToMove.length>1) return false;
        const top = destPile.lastElementChild as HTMLElement|null;
        if (!top || top.classList.contains('pile-placeholder')) return topCardToMove.dataset.value === '1';
        return (top.dataset.suit===topCardToMove.dataset.suit &&
               parseInt(top.dataset.value!) + 1 === parseInt(topCardToMove.dataset.value!));
      }
      if (destPile.classList.contains('tableau')) {
        const top = destPile.lastElementChild as HTMLElement|null;
        if (!top) return topCardToMove.dataset.rank === 'K';
        return (top.dataset.color !== topCardToMove.dataset.color &&
               parseInt(top.dataset.value!) === parseInt(topCardToMove.dataset.value!) + 1);
      }
      return false;
    }

    function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
      cards.forEach((c)=>toPile.appendChild(c));
      if (toPile.classList.contains('foundation')) updateScore(10);
      else if (fromPile.id==='waste' && toPile.classList.contains('tableau')) updateScore(5);
      else if (fromPile.classList.contains('foundation') && toPile.classList.contains('tableau')) updateScore(-15);

      if (fromPile.classList.contains('tableau') && fromPile.children.length>0) {
        const top = fromPile.lastElementChild as HTMLElement;
        if (top.classList.contains('face-down')) { top.classList.remove('face-down'); top.draggable = true; updateScore(5); }
      }
      checkWinCondition();
      autoCheckForFullOpen();
    }

    function onDragStart(e: DragEvent) {
      const card = e.target as HTMLElement;
      if (card.classList.contains('face-down')) return;
      const pile = card.parentElement as HTMLElement;
      if (pile.classList.contains('tableau')) {
        const arr = Array.from(pile.children) as HTMLElement[]; const idx = arr.indexOf(card);
        draggedCards = arr.slice(idx);
      } else draggedCards = [card];
      e.dataTransfer?.setData('text/plain', card.id);
      setTimeout(()=>draggedCards.forEach(c=>c.classList.add('dragging')),0);
    }
    function onDragEnd(){ draggedCards.forEach(c=>c.classList.remove('dragging')); draggedCards=[]; }

    function onCardDoubleClick(e: Event) {
      const card = e.currentTarget as HTMLElement;
      const src = card.parentElement as HTMLElement;
      const v = parseInt(card.dataset.value!);
      for (const f of Array.from(foundationPiles) as HTMLElement[]) {
        const top = f.lastElementChild as HTMLElement|null;
        if (!top || top.classList.contains('pile-placeholder')) {
          if (card.dataset.rank==='A' || v===1) { moveCards([card], src, f); return; }
        } else if (top.dataset.suit===card.dataset.suit && parseInt(top.dataset.value!) + 1 === v) {
          moveCards([card], src, f); return;
        }
      }
    }

    function selectOrMoveCard(card: HTMLElement) {
      if (card.classList.contains('face-down')) return;
      if (!selectedCard){ selectedCard=card; card.classList.add('selected'); return; }
      if (selectedCard===card){ card.classList.remove('selected'); selectedCard=null; return; }
      const dest = card.parentElement as HTMLElement;
      if (validateMove([selectedCard], dest)) {
        moveCards([selectedCard], selectedCard.parentElement as HTMLElement, dest);
        selectedCard.classList.remove('selected'); selectedCard=null;
      } else {
        selectedCard.classList.remove('selected'); selectedCard=card; card.classList.add('selected');
      }
    }

    async function postWinOnchain(s:number){
      if(!playerAddress) return;
      try{
        await fetch('/api/recordwin',{ method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ playerAddress, score: s, displayName })
        });
      }catch(e){ console.error('recordwin failed', e); }
    }

    // 🔥 auto-win: tüm kartlar açıldığında otomatik kazanç
    function autoCheckForFullOpen() {
      const hiddenCards = document.querySelectorAll('.card.face-down');
      if (hiddenCards.length === 0 && !hasWon) {
        checkWinCondition();
      }
    }

function checkWinCondition() {
  let total = 0;
  foundationPiles.forEach(p => {
    total += (p as HTMLElement).querySelectorAll('.card').length;
  });

  if (total === 52 && !hasWon) {
    hasWon = true;
    updateScore(100);
    saveScoreIfWin(currentPlayerId, score);

    if (winningPlayerNameDisplay)
      winningPlayerNameDisplay.textContent = displayName || currentPlayerId;

    winModal.classList.add('show');

    // 🟡 Başta pending durumu göster
    const confirmDiv = document.getElementById('onchain-confirm');
    if (confirmDiv) {
      confirmDiv.textContent = '⌛ Pending on-chain confirmation...';
      confirmDiv.classList.remove('confirmed');
    }

    // 🧾 Zincir işlemi başlat
    fetch('/api/recordwin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerAddress, score: 100, displayName }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.tx && confirmDiv) {
          confirmDiv.textContent = '✅ On-chain confirmed';
          confirmDiv.classList.add('confirmed');
        } else if (confirmDiv) {
          confirmDiv.textContent = '⚠️ On-chain failed';
        }
      })
      .catch(() => {
        if (confirmDiv)
          confirmDiv.textContent = '⚠️ On-chain error (check console)';
      });
  }
}
    
    function resetGame() {
  cardIdCounter = 0;
  hasWon = false;
  setScore(0);

  // tüm bölgeleri sıfırla
  [stockPile, wastePile, ...foundationPiles].forEach(p => {
    (p as HTMLElement).innerHTML = '<div class="pile-placeholder"></div>';
  });
  tableauPiles.forEach(p => ((p as HTMLElement).innerHTML = ''));

  winModal.classList.remove('show');

  // yeni oyun oluştur
  createDeck();
  shuffleDeck();
  dealCards();
  gameContainer.classList.add('active');
  }

    async function doDailyCheckIn() {
      if (!playerAddress) return;
      try {
        const r = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerAddress, displayName, onchain: false })
        });
        const d = await r.json();
        if (d.ok) {
          if (!d.alreadyToday) {
            setScore(score + d.add);
            const btn = checkInBtn as HTMLButtonElement;
            btn.textContent = `✓ Checked In Today (+${d.add})`;
            btn.classList.add('checked');
            btn.setAttribute('aria-disabled', 'true');
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
    // ✅ BASE_URL'i .env'den al, fallback olarak sabit vercel domainini kullan
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://solitaire-frame.vercel.app";

    const r = await fetch(`${base}/api/leaderboard/checkin?limit=20`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (!r.ok) {
      console.error("checkin fetch failed:", r.status, await r.text());
      return;
    }

    const d = await r.json();
    console.log("📊 Check-in leaderboard data:", d);

    checkInLbTbody.innerHTML = '';
    (d.items || []).forEach((it: any, i: number) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${it.name}</td><td>${it.points}</td>`;
      checkInLbTbody.appendChild(tr);
    });

    checkInLbModal.classList.add('show');
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
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

    stockPile.addEventListener('click', () => {
      const top = stockPile.lastElementChild as HTMLElement;
      if (top && !top.classList.contains('pile-placeholder')) {
        top.classList.remove('face-down'); top.draggable = true; wastePile.appendChild(top);
      } else {
        const wasteCards = Array.from(wastePile.querySelectorAll('.card')).reverse() as HTMLElement[];
        wasteCards.forEach(c=>{ c.classList.add('face-down'); c.draggable=false; stockPile.appendChild(c); });
      }
      autoCheckForFullOpen();
    });

    [...foundationPiles, ...tableauPiles].forEach(p => (p as HTMLElement).addEventListener('dragover',(e)=>e.preventDefault()));
    [...foundationPiles, ...tableauPiles].forEach(p => (p as HTMLElement).addEventListener('drop',(e)=>{
      e.preventDefault(); const dest = e.currentTarget as HTMLElement;
      if (validateMove(draggedCards, dest)) moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
    }));

    // 🎯 Geri kalan fonksiyonlar (check-in, leaderboard) seninkiyle aynı
    // ...
    // (doDailyCheckIn, openCheckinLeaderboard, openScoreLeaderboard, resetGame)
    // ...

    newGameButtons.forEach(b=>b.addEventListener('click', resetGame));
    checkInBtn.addEventListener('click', doDailyCheckIn);
    checkInLbBtn.addEventListener('click', openCheckinLeaderboard);
    scoreLbBtn.addEventListener('click', openScoreLeaderboard);
    checkInLbClose.addEventListener('click', ()=>checkInLbModal.classList.remove('show'));
    scoreLbClose.addEventListener('click', ()=>scoreLbModal.classList.remove('show'));

    updatePlayerStatus();
    resetGame();
  }, [playerId, playerAddress, displayName]);


return (
  <>
    <div className="game-container" id="game-container">
      <h1>Solitaire</h1>
      <div className="score-display">Score: 0</div>
      <div id="current-player-status"></div>

      {/* 🃏 Daily Check-in */}
      <div className="checkin-wrapper">
        <div id="streak-pill" className="streak-pill hidden">🔥 Streak: 0</div>
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

      {/* 🔁 Controls */}
      <div className="controls">
        <button className="new-game-btn">♻️ New Game</button>
      </div>
    </div>

    {/* 🏅 Win Modal */}
    <div id="win-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>You Win!</h2>
        <p>Score saved for: <span id="winning-player-name"></span></p>
        <p id="onchain-confirm" className="onchain-status">⌛ Pending on-chain confirmation...</p>
        <button className="new-game-btn play-again-btn">Play Again</button>
      </div>
    </div>

    {/* 🧮 Score Leaderboard */}
    <div id="leaderboard-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>🏆 Leaderboard (Win Score)</h2>
        <table id="leaderboard-table">
          <thead>
            <tr><th>Rank</th><th>Name</th><th>Total</th></tr>
          </thead>
          <tbody></tbody>
        </table>
        <button id="close-leaderboard-btn" className="control-btn">Close</button>
      </div>
    </div>

    {/* 🃏 Check-in Leaderboard */}
    <div id="checkin-leaderboard-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>🏅 Leaderboard (Check-in Points)</h2>
        <table id="checkin-leaderboard-table">
          <thead>
            <tr><th>Rank</th><th>Name</th><th>Points</th></tr>
          </thead>
          <tbody></tbody>
        </table>
        <button id="close-checkin-leaderboard-btn" className="control-btn">Close</button>
      </div>
    </div>
  </>
);

}
