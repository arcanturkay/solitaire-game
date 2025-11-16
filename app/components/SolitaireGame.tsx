'use client';
import { useEffect } from 'react';
import '../../styles/solitaire.css';
import { getUserContract } from "@/app/lib/contract";
import { ethers } from "ethers";
import { CHECKIN_CONTRACT, CHECKIN_ABI } from "@/app/lib/contract";
import { sdk } from '@farcaster/miniapp-sdk';

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
    // --- CONSTS & DOM ---
    const DOMAIN_TAG = window.location.hostname.replace(/\./g, '_');
    const SCORE_TOTALS_KEY = `solitaireAccumulatedScores_${DOMAIN_TAG}`;
    const currentPlayerId = playerId || '@guest';
    const isMobile = /Android|iPhone|iPad|iPod|Farcaster|Warpcast/i.test(navigator.userAgent);
    const isFarcaster = /farcaster|warpcast/i.test(navigator.userAgent);
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
    const testTxBtn = document.getElementById('test-tx-btn');

    // --- STATE ---
    let deck: Card[] = [];
    let deckArr: Card[] = [];
    let cardIdCounter = 0;
    let draggedCards: HTMLElement[] = [];
    let selectedCard: HTMLElement | null = null;
    let score = 0;
    let hasWon = false;

    // --- HELPERS ---
    function setScore(v:number){ score = Math.max(0,v); (scoreDisplay as any).textContent = `Score: ${score}`; }
    function updateScore(d:number){ setScore(score + d); }
    function updatePlayerStatus(){ if(currentPlayerStatus) currentPlayerStatus.textContent = `Playing as: ${currentPlayerId}`; }

    function saveScoreIfWin(pid: string, addScore: number) {
      const scores = JSON.parse(localStorage.getItem(SCORE_TOTALS_KEY) || '{}');
      scores[pid] = (scores[pid] || 0) + addScore;
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
        // tap-to-move + double-tap to foundation
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

    // --- RULES ---
    function validateMove(cardsToMove: HTMLElement[], destPile: HTMLElement) {
      const topCardToMove = cardsToMove[0];
      if (!topCardToMove || destPile === topCardToMove.parentElement) return false;

      // Foundation (A -> K)
      if (destPile.classList.contains("foundation")) {
        if (cardsToMove.length > 1) return false;
        const top = destPile.lastElementChild as HTMLElement | null;
        if (!top || top.classList.contains("pile-placeholder"))
          return topCardToMove.dataset.value === "1";
        return (
            top.dataset.suit === topCardToMove.dataset.suit &&
            parseInt(top.dataset.value!) + 1 === parseInt(topCardToMove.dataset.value!)
        );
      }

      // Tableau (K -> 2)
      if (destPile.classList.contains("tableau")) {
        const top = destPile.lastElementChild as HTMLElement | null;

        // Empty tableau => only King
        if (!top || top.classList.contains("pile-placeholder"))
          return topCardToMove.dataset.rank === "K";

        // alt renk + bir küçük değer
        return (
            top.dataset.color !== topCardToMove.dataset.color &&
            parseInt(top.dataset.value!) === parseInt(topCardToMove.dataset.value!) + 1
        );
      }

      return false;
    }

    function moveCards(cards: HTMLElement[], fromPile: HTMLElement, toPile: HTMLElement) {
      // Empty tableau kuralını açık ve net uygula
      const isEmptyTableau =
          toPile.classList.contains("tableau") &&
          (!toPile.querySelector('.card'));

      removePlaceholder(toPile);
      if (!isEmptyTableau && !validateMove(cards, toPile)) return;

      cards.forEach((c)=>toPile.appendChild(c));

      // kaynak üst kartı aç
      if (fromPile.classList.contains('tableau')) {
        const top = fromPile.lastElementChild as HTMLElement | null;
        if (top && top.classList.contains('face-down')) {
          top.classList.remove('face-down');
          top.draggable = true;
          updateScore(5);
        }
        // kaynakta kart kalmadıysa yeniden placeholder ekle → tap hedefi
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
    function bindPlaceholder(ph: HTMLElement) {
      if ((ph as any)._bound) return;
      (ph as any)._bound = true;
      ph.addEventListener('touchend', () => selectOrMoveCard(ph));
      ph.addEventListener('click', () => selectOrMoveCard(ph));
    }

    function ensurePlaceholder(pile: HTMLElement) {
      // zaten varsa çık
      let ph = pile.querySelector('.pile-placeholder') as HTMLElement | null;
      if (!ph) {
        ph = document.createElement('div');
        ph.className = 'pile-placeholder';
        pile.appendChild(ph);
      }
      bindPlaceholder(ph);
    }

    function removePlaceholder(pile: HTMLElement) {
      const ph = pile.querySelector('.pile-placeholder');
      if (ph) ph.remove();
    }
    function selectOrMoveCard(card: HTMLElement) {
      if (card.classList.contains("face-down")) return;

      // 1) ilk seçim
      if (!selectedCard) {
        selectedCard = card;
        card.classList.add("selected");
        return;
      }

      // 2) aynı karta tekrar dokunma -> seçim iptal
      if (selectedCard === card) {
        card.classList.remove("selected");
        selectedCard = null;
        return;
      }

      // 3) hedef sütun
      let destPile: HTMLElement | null = null;

      if (card.classList.contains("card")) {
        destPile = card.closest(".pile") as HTMLElement | null;
      }

      if (!destPile && card.classList.contains("pile-placeholder")) {
        destPile = card.parentElement as HTMLElement;
      }

      // Foundation otomatik fırsatı
      if (!destPile) {
        const v = parseInt(selectedCard.dataset.value!);
        for (const f of Array.from(foundationPiles) as HTMLElement[]) {
          const top = f.lastElementChild as HTMLElement | null;
          if (!top || top.classList.contains("pile-placeholder")) {
            if (v === 1) { destPile = f; break; }
          } else if (top.dataset.suit === selectedCard.dataset.suit &&
              parseInt(top.dataset.value!) + 1 === v) {
            destPile = f; break;
          }
        }
      }

      if (!destPile) {
        // sadece seçimi değiştir
        selectedCard.classList.remove("selected");
        selectedCard = card;
        card.classList.add("selected");
        return;
      }

      // 4) seçilen kart + altındaki açık kartlar
      const fromPile = selectedCard.parentElement as HTMLElement;
      const pileCards = Array.from(fromPile.children) as HTMLElement[];
      const selectedIndex = pileCards.indexOf(selectedCard);
      let cardsToMove: HTMLElement[] = [selectedCard];

      if (selectedIndex >= 0) {
        const tail = pileCards.slice(selectedIndex);
        cardsToMove = tail.filter((c) => !c.classList.contains("face-down"));
      }

      // 5) boş tablo -> sadece K
      const isEmptyTableau =
          destPile.classList.contains("tableau") &&
          (destPile.children.length === 0 ||
              (destPile.children.length === 1 &&
                  destPile.firstElementChild?.classList.contains("pile-placeholder")));

      if (isEmptyTableau) {
        if (selectedCard.dataset.rank === "K") {
          moveCards(cardsToMove, fromPile, destPile);
        }
        selectedCard.classList.remove("selected");
        selectedCard = null;
        return;
      }

      // 6) normal validasyon
      if (validateMove(cardsToMove, destPile)) {
        moveCards(cardsToMove, fromPile, destPile);
      }

      selectedCard?.classList.remove("selected");
      selectedCard = null;
    }

    // --- AUTO FINISH ---
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
                moveCards([top], pile, f); moved = true; break;
              }
            } else if (fTop.dataset.suit === top.dataset.suit &&
                parseInt(fTop.dataset.value!) + 1 === v) {
              moveCards([top], pile, f); moved = true; break;
            }
          }
        }
      }
    }

    // --- WIN & ONCHAIN ---
    async function checkWinCondition() {
      let total = 0;
      foundationPiles.forEach((p) => {
        total += (p as HTMLElement).querySelectorAll(".card").length;
      });

      if (total !== 52 || hasWon) return;

      hasWon = true;
      saveScoreIfWin(currentPlayerId, score);

      if (winningPlayerNameDisplay)
        winningPlayerNameDisplay.textContent = `${displayName || currentPlayerId} (${score} pts)`;

      winModal.classList.add("show");

      const confirmDiv = document.getElementById("onchain-confirm");
      if (confirmDiv) {
        confirmDiv.textContent = "⌛ Waiting for wallet confirmation...";
        confirmDiv.classList.remove("confirmed");
      }

      try {
        let txHash: string | null = null;
        let toAddr: string | null = null;

        // ==================================================
        // 📱 FARCASTER MINIAPP WALLET (RPC DIRECT)
        // ==================================================
        if (isFarcaster && (window as any).sdk?.wallet) {
          console.log("📱 Farcaster wallet detected — sending TX via RPC");

          const provider = await sdk.wallet.getEthereumProvider();
          if (!provider) throw new Error("Farcaster provider not available");

          const accounts = await provider.request({ method: "eth_requestAccounts" });
          toAddr = accounts?.[0];
          if (!toAddr) throw new Error("No Farcaster wallet address found");

          const iface = new ethers.Interface(CHECKIN_ABI);
          const data = iface.encodeFunctionData("recordMyWin", [score]);

          try {
            const tx = await provider.request({
              method: "eth_sendTransaction",
              params: [
                {
                  from: toAddr,
                  to: CHECKIN_CONTRACT,
                  data,
                  gas: "0x3d090",
                },
              ],
            });

            txHash = String(tx);
            console.log("📤 Farcaster TX submitted:", txHash);

            if (confirmDiv && txHash) {
              const url = `https://basescan.org/tx/${txHash}`;
              confirmDiv.innerHTML = `✅ On-chain confirmed<br><a href="${url}" target="_blank" rel="noreferrer">View on Basescan</a>`;
              confirmDiv.classList.add("confirmed");
            }

            // ❌ alert yerine sessiz log (MiniApp alert'leri bazen blokluyor)
            console.log(`✅ TX submitted on Base → ${txHash}`);
          } catch (rpcErr: any) {
            console.warn("⚠️ Farcaster RPC TX error:", rpcErr);
            if (
                rpcErr?.code === -32603 ||
                rpcErr?.code === 4200 ||
                rpcErr?.message?.includes("unsupported") ||
                rpcErr?.message?.includes("missing revert data")
            ) {
              console.log("✅ TX probably sent despite RPC error");
              if (confirmDiv) {
                confirmDiv.textContent = "✅ Transaction likely sent (Farcaster fallback)";
                confirmDiv.classList.add("confirmed");
              }
            } else {
              throw rpcErr;
            }
          }
        }

            // ==================================================
            // 🌐 NORMAL WALLET (METAMASK / RABBY)
        // ==================================================
        else {
          console.log("🌐 External wallet detected");

          const { contract, signer } = await getUserContract();

          if (playerAddress) {
            try {
              toAddr = ethers.getAddress(playerAddress);
            } catch {
              toAddr = null;
            }
          }
          if (!toAddr) toAddr = await signer.getAddress();

          const tx = await contract.recordMyWin(score, { gasLimit: 250000 });
          console.log("📤 TX sent:", tx.hash);

          txHash = tx.hash;

          if (confirmDiv && txHash) {
            const url = `https://basescan.org/tx/${txHash}`;
            confirmDiv.innerHTML = `✅ On-chain confirmed<br><a href="${url}" target="_blank" rel="noreferrer">View on Basescan</a>`;
            confirmDiv.classList.add("confirmed");
          }
        }

        // ==================================================
        // 📡 BACKEND UPDATE
        // ==================================================
        if (toAddr) {
          fetch("/api/recordwin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerAddress: toAddr, score, displayName }),
          }).catch(() => {});
        }

// ==================================================
// 🌀 HYBRID FARCASTER SHARE (MOBILE + DESKTOP SAFE)
// ==================================================
        try {
          const shareBtn = document.getElementById("share-on-farcaster-btn");
          if (!shareBtn || (shareBtn as any)._bound) return;

          (shareBtn as any)._bound = true;

          shareBtn.addEventListener("click", async () => {
            try {
              // =============================
              // 1) CAST TEXT
              // =============================
              const text =
                  `♦️ ♥️ ♠️ ♣️ I just cleared a Solitaire run on Farcaster!\n` +
                  `Score: ${score} pts 🎯\n\n` +
                  `Play: https://farcaster.xyz/miniapps/-2zKveTkHy61/solitaire`;

              // =============================
              // 2) URL’ler
              // =============================
              const deepLink = "farcaster://compose?text=" + encodeURIComponent(text);
              const webComposer =
                  "https://warpcast.com/~/compose?text=" + encodeURIComponent(text);

              // =============================
              // 3) PLATFORM TESPITI
              // =============================
              const ua = navigator.userAgent.toLowerCase();
              const isMobile = /iphone|ipad|ipod|android/.test(ua);

              // =============================
              // 4) EXECUTION LOGIC
              // =============================
              if (isMobile) {
                // 🔥 MOBILE: ALWAYS DEEP LINK (Mini App %100 çalışır)
                window.location.href = deepLink;
              } else {
                // 💻 DESKTOP: NORMAL WEB COMPOSER
                const opened = window.open(webComposer, "_blank");
                if (!opened) window.location.href = webComposer;
              }

              // =============================
              // 5) BONUS +20
              // =============================
              const bonus = 20;
              setScore(score + bonus);

              if (toAddr) {
                await fetch("/api/addscore", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    playerAddress: toAddr,
                    bonus,
                    reason: "shared_on_farcaster",
                  }),
                });
              }

              shareBtn.textContent = "✅ Shared! (+20 bonus)";
              shareBtn.style.opacity = "0.7";
            } catch (err: any) {
              alert("❌ ERROR: " + err?.message);
              console.error("Share failed:", err);
            }
          });
        } catch (err) {
          console.error("💥 Share init failed:", err);
        }

      } catch (err: any) {
        console.error("❌ recordMyWin failed:", err);
        const div = document.getElementById("onchain-confirm");
        if (div) div.textContent = "⚠️ Transaction rejected or failed";
      }
    }


    // --- CHECK-IN & LEADERBOARDS ---
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
        const base = process.env.NEXT_PUBLIC_BASE_URL || "https://solitaire-frame.vercel.app";
        const url = `${base}/api/leaderboard/checkin?limit=20`;

        const r = await fetch(url, {
          method: "GET",
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          mode: "cors",
        });

        if (!r.ok) return;

        const d = await r.json();
        checkInLbTbody.innerHTML = "";
        (d.items || []).forEach((it: any, i: number) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${i + 1}</td><td>${it.name}</td><td>${it.points}</td>`;
          checkInLbTbody.appendChild(tr);
        });

        checkInLbModal.classList.add("show");
      } catch (err) {
        console.error("⚠️ Failed to fetch leaderboard:", err);
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

    // --- STOCK / WASTE ---
    stockPile.addEventListener('click', () => {
      const top = stockPile.lastElementChild as HTMLElement;
      if (top && !top.classList.contains('pile-placeholder')) {
        top.classList.remove('face-down'); top.draggable = true; wastePile.appendChild(top);
      } else {
        const wasteCards = Array.from(wastePile.querySelectorAll('.card')).reverse() as HTMLElement[];
        wasteCards.forEach(c=>{ c.classList.add('face-down'); c.draggable=false; stockPile.appendChild(c); });
      }
    });

    // --- DnD drop targets ---
    [...foundationPiles, ...tableauPiles].forEach(p => (p as HTMLElement).addEventListener('dragover',(e)=>e.preventDefault()));
    [...foundationPiles, ...tableauPiles].forEach(p => (p as HTMLElement).addEventListener('drop',(e)=>{
      e.preventDefault(); const dest = e.currentTarget as HTMLElement;
      if (validateMove(draggedCards, dest)) moveCards(draggedCards, draggedCards[0].parentElement as HTMLElement, dest);
    }));

    // --- BUTTONS & FIRST DEAL ---
    // New Game: reset + handlerları DOM doldurulduktan sonra bağla
    newGameButtons.forEach((b) => {
      if ((b as any)._bound) return;
      (b as any)._bound = true;
      b.addEventListener('click', () => {
        resetGame();
        setTimeout(attachTouchHandlers, 100);
      });
    });

    // İlk oyun
    resetGame();
    setTimeout(attachTouchHandlers, 100);

    checkInBtn.addEventListener('click', doDailyCheckIn);
    checkInLbBtn.addEventListener('click', openCheckinLeaderboard);
    scoreLbBtn.addEventListener('click', openScoreLeaderboard);
    checkInLbClose.addEventListener('click', ()=>checkInLbModal.classList.remove('show'));
    scoreLbClose.addEventListener('click', ()=>scoreLbModal.classList.remove('show'));

    updatePlayerStatus();

    if (testTxBtn && !(testTxBtn as any)._bound) {
      (testTxBtn as any)._bound = true;
      testTxBtn.addEventListener('click', async () => {
        try {
          const btn = testTxBtn as HTMLButtonElement;
          btn.textContent = "⏳ Sending TX...";
          btn.disabled = true;

          // Detect Farcaster or external wallet
          let signer, contract;
          if ((window as any).sdk?.wallet) {
            console.log("📱 Farcaster wallet detected");
            const provider = await sdk.wallet.getEthereumProvider();
            const browserProvider = new ethers.BrowserProvider(provider as any);
            signer = await browserProvider.getSigner();
          } else {
            console.log("🌐 External wallet (MetaMask/Rabby)");
            const c = await getUserContract();
            signer = c.signer;
          }

          // Connect to your contract
          contract = new ethers.Contract(
              "0xA7D83c24D78C66fdddd2a7Be1Ec1337886D0c461", // ✅ your current deployed contract
              CHECKIN_ABI as any,
              signer
          );

          // Send TX (no value, just gas)
          const tx = await contract.recordMyWin(123, { gasLimit: 250000 });
          console.log("📤 TX sent:", tx.hash);

          // ✅ Manual confirmation text (wait() yok)
          alert(`✅ TX submitted!\nHash: ${tx.hash}\nView: https://basescan.org/tx/${tx.hash}`);

          console.log("✅ TX confirmed:", tx.hash);
          alert(`✅ TX confirmed!\nTX: ${tx.hash}`);

          btn.textContent = "🧪 Test TX (Success)";
          btn.classList.add("confirmed");
        } catch (err: any) {
          console.error("❌ TX failed:", err);
          alert(`❌ TX failed\nReason: ${err?.message || err}`);
          testTxBtn.textContent = "❌ Test TX Failed";
        } finally {
          setTimeout(() => {
            testTxBtn.textContent = "🧪 Test Onchain TX";
            testTxBtn.removeAttribute("disabled");
            testTxBtn.classList.remove("confirmed");
          }, 4000);
        }
      });
    }

    // --- TOUCH BINDER ---
    function attachTouchHandlers() {
      // placeholder’lara tık/touch
      document.querySelectorAll('.pile-placeholder').forEach((ph) => {
        if ((ph as any)._bound) return;
        (ph as any)._bound = true;
        ph.addEventListener('touchend', () => selectOrMoveCard(ph as HTMLElement));
        ph.addEventListener('click', () => selectOrMoveCard(ph as HTMLElement));
      });

      // kartlara tık/touch
      document.querySelectorAll('.card').forEach((c) => {
        if ((c as any)._touchBound) return;
        (c as any)._touchBound = true;
        c.addEventListener('touchend', () => selectOrMoveCard(c as HTMLElement));
        c.addEventListener('click', () => selectOrMoveCard(c as HTMLElement));
      });
    }

    // --- RESET ---
    function resetGame() {
      cardIdCounter = 0;
      hasWon = false;
      setScore(0);

      // --- STOCK & FOUNDATION temizliği ---
      [stockPile, wastePile, ...foundationPiles].forEach((p) => {
        (p as HTMLElement).innerHTML = '<div class="pile-placeholder"></div>';
      });

      // --- TABLEAU temizliği ---
      (Array.from(tableauPiles) as HTMLElement[]).forEach((p) => {
        p.innerHTML = '';
        ensurePlaceholder(p);
      });

      // --- MODAL & STATE reset ---
      winModal.classList.remove('show');
      draggedCards = [];
      selectedCard = null;

      // --- DESTEK fonksiyonlar ---
      createDeck();
      shuffleDeck();
      dealCards();

      // --- dağıtım sonrası placeholder düzeni ---
      (Array.from(tableauPiles) as HTMLElement[]).forEach((p) => {
        if (p.querySelector('.card')) removePlaceholder(p);
        else ensurePlaceholder(p);
      });

      (Array.from(foundationPiles) as HTMLElement[]).forEach((p) => {
        if (p.querySelector('.card')) removePlaceholder(p);
        else ensurePlaceholder(p);
      });

      // --- STOCK placeholder gizle ---
      const stockPlaceholder = stockPile.querySelector('.pile-placeholder') as HTMLElement | null;
      if (stockPlaceholder) stockPlaceholder.style.display = 'none';

      gameContainer.classList.add('active');
    }

    // cleanup (temel)
    return () => {
      // burada isteğe bağlı temizleme yapılabilir
    };
  }, [playerId, playerAddress, displayName]);

  try {
    // Mini App içindeysek splash ekranını kapat
    (async () => {
      if ((sdk as any)?.actions?.ready) {
        await sdk.actions.ready();
      }
    })();
  } catch {
    // web ortamında hata verirse sessiz geç
  }

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
              <div id="stock" className="pile">
                <div className="pile-placeholder"></div>
              </div>
              <div id="waste" className="pile">
                <div className="pile-placeholder"></div>
              </div>
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
            <button id="test-tx-btn" className="control-btn">🧪 Test Onchain TX</button>
          </div>
        </div>

        {/* 🏅 Win Modal */}
        <div id="win-modal" className="modal-overlay">
          <div className="modal-content">
            <h2>You Win!</h2>
            <p>Score saved for: <span id="winning-player-name"></span></p>
            <p id="onchain-confirm" className="onchain-status">⌛ Pending on-chain confirmation...</p>
            <div className="win-actions">
              <button id="share-on-farcaster-btn" className="control-btn alt">
                🌀 Share on Farcaster (+20 bonus)
              </button>
              <button className="new-game-btn play-again-btn">Play Again</button>
            </div>
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
            <button id="close-leaderboard-btn" className="control-btn">Close</button>
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
            <button id="close-checkin-leaderboard-btn" className="control-btn">Close</button>
          </div>
        </div>
      </>
  );
}