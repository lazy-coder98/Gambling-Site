import React, { useState } from 'react';
import type { WalletSystem } from '../../hooks/useWallet';
import { TOKENS } from '../../hooks/useWallet';
import type { AudioSystem } from '../../hooks/useAudio';
import { generateMinesBoard } from '../../utils/provablyFair';
import { Bomb, Shield, Award, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MinesProps {
  wallet: WalletSystem;
  audio: AudioSystem;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onIncrementNonce: () => void;
}

// Combinations nCr helper
function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let result = 1;
  for (let i = 1; i <= r; i++) {
    result = result * (n - i + 1) / i;
  }
  return result;
}

// Calculate Mines multiplier
export function getMinesMultiplier(mineCount: number, diamondsRevealed: number): number {
  if (diamondsRevealed === 0) return 1.0;
  const totalTiles = 25;
  const diamondsCount = totalTiles - mineCount;
  
  if (diamondsRevealed > diamondsCount) return 0;
  
  const houseEdge = 0.99; // 1% house edge
  const probability = nCr(diamondsCount, diamondsRevealed) / nCr(totalTiles, diamondsRevealed);
  const rawMultiplier = 1 / probability;
  
  // Return multiplier formatted to 2 decimals
  return Math.round(rawMultiplier * houseEdge * 100) / 100;
}

interface TileState {
  index: number;
  isRevealed: boolean;
  isMine: boolean;
}

export function Mines({ wallet, audio, serverSeed, clientSeed, nonce, onIncrementNonce }: MinesProps) {
  const [betAmount, setBetAmount] = useState('100');
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [board, setBoard] = useState<TileState[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [wonAmount, setWonAmount] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);

  const activeConf = TOKENS[wallet.activeToken];

  const startGame = () => {
    audio.playClick();
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }
    if (wallet.balances[wallet.activeToken] < amt) {
      alert("Insufficient wallet balance.");
      return;
    }

    // Deduct bet from wallet
    const deducted = wallet.deduct(amt, `Mines Bet (Mines: ${minesCount})`);
    if (!deducted) return;

    // Increment nonce for Provably Fair
    onIncrementNonce();

    // Generate board outcome from active seed hashes
    const mineLayout = generateMinesBoard(serverSeed, clientSeed, nonce + 1, minesCount);
    
    const initialBoard: TileState[] = Array.from({ length: 25 }, (_, idx) => ({
      index: idx,
      isRevealed: false,
      isMine: mineLayout[idx]
    }));

    setBoard(initialBoard);
    setRevealedCount(0);
    setGameState('playing');
    setWonAmount(0);
  };

  const handleTileClick = (tileIdx: number) => {
    if (gameState !== 'playing') return;
    const tile = board[tileIdx];
    if (tile.isRevealed) return;

    audio.playClick();
    
    // Reveal tile
    const updatedBoard = [...board];
    updatedBoard[tileIdx] = { ...tile, isRevealed: true };
    setBoard(updatedBoard);

    if (tile.isMine) {
      // Exploded!
      audio.playExplosion();
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
      
      // Reveal all mines on the board
      setBoard(updatedBoard.map(t => t.isMine ? { ...t, isRevealed: true } : t));
      setGameState('ended');
      audio.playLose();
    } else {
      // Diamond found!
      const nextRevealedCount = revealedCount + 1;
      setRevealedCount(nextRevealedCount);
      
      const currentMult = getMinesMultiplier(minesCount, nextRevealedCount);
      const betAmt = parseFloat(betAmount);
      const nextPayout = betAmt * currentMult;
      
      // Synthesize custom pitch tone based on revealed count (ascending scale)
      audio.playPlink(330 + nextRevealedCount * 50);

      // Auto check if player successfully found ALL diamonds
      const maxDiamonds = 25 - minesCount;
      if (nextRevealedCount === maxDiamonds) {
        // Absolute Jackpot!
        cashOutGame(updatedBoard, nextPayout);
      }
    }
  };

  const cashOutGame = (activeBoard = board, forcedPayout?: number) => {
    if (gameState !== 'playing') return;
    audio.playClick();

    const currentMult = getMinesMultiplier(minesCount, revealedCount);
    const betAmt = parseFloat(betAmount);
    const payout = forcedPayout || (betAmt * currentMult);
    
    // Credit payout
    wallet.credit(payout, `Mines Cashout (${currentMult}x)`);
    setWonAmount(payout);
    setGameState('ended');

    // Reveal rest of board
    setBoard(activeBoard.map(t => ({ ...t, isRevealed: true })));
    audio.playWin();

    // Trigger fireworks confetti!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const currentMult = getMinesMultiplier(minesCount, revealedCount);
  const betAmt = parseFloat(betAmount);
  const estimatedPayout = betAmt * currentMult;
  const nextMult = getMinesMultiplier(minesCount, revealedCount + 1);

  return (
    <div style={{ ...styles.container, ...(shakeScreen ? styles.shakeContainer : {}) }}>
      
      {/* Game Headline Banner */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bomb size={24} color="var(--success)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Diamond Mines Sweeper</h2>
        </div>
        <div style={styles.fairBadge}>
          <Shield size={14} color="var(--success)" />
          <span>Provably Fair Nonce: {nonce}</span>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* Left Side Controls Panel */}
        <div className="glass-panel" style={styles.controlsPanel}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bet Amount</label>
            <div className="glass-input-wrapper">
              <input
                type="number"
                className="glass-input"
                value={betAmount}
                disabled={gameState === 'playing'}
                onChange={e => setBetAmount(e.target.value)}
              />
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{activeConf.icon}</span>
            </div>
            <div style={styles.quickBetRow}>
              <button disabled={gameState === 'playing'} onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) / 2 || 10).toString()); }} style={styles.quickBetBtn}>½</button>
              <button disabled={gameState === 'playing'} onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) * 2 || 100).toString()); }} style={styles.quickBetBtn}>2x</button>
              <button disabled={gameState === 'playing'} onClick={() => { audio.playClick(); setBetAmount(wallet.balances[wallet.activeToken].toString()); }} style={styles.quickBetBtn}>MAX</button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={styles.label}>Mines count</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>{minesCount} Mines</span>
            </div>
            <select
              value={minesCount}
              disabled={gameState === 'playing'}
              onChange={e => { audio.playClick(); setMinesCount(parseInt(e.target.value)); }}
              style={styles.select}
            >
              {[1, 2, 3, 5, 8, 10, 15, 20, 24].map(x => (
                <option key={x} value={x}>{x} Mines ({25 - x} Diamonds)</option>
              ))}
            </select>
          </div>

          {gameState === 'playing' ? (
            <div style={styles.actionsColumn}>
              <div style={styles.liveStats}>
                <div style={styles.statLine}>
                  <span>Gems Discovered</span>
                  <strong style={{ color: 'var(--success)' }}>{revealedCount} / {25 - minesCount}</strong>
                </div>
                <div style={styles.statLine}>
                  <span>Current Multiplier</span>
                  <strong style={{ color: 'var(--warning)', fontSize: '1.25rem' }}>{currentMult.toFixed(2)}x</strong>
                </div>
                <div style={styles.statLine}>
                  <span>Next Gem Multiplier</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{nextMult.toFixed(2)}x</span>
                </div>
              </div>

              <button
                className="glass-button glass-button-success"
                style={{ width: '100%', padding: '14px', fontSize: '1.1rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
                onClick={() => cashOutGame()}
                disabled={revealedCount === 0}
              >
                CASH OUT ({estimatedPayout.toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken})
              </button>
            </div>
          ) : (
            <button
              className="glass-button glass-button-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '10px' }}
              onClick={startGame}
            >
              Place Bet
            </button>
          )}

          {wonAmount > 0 && (
            <div style={styles.winNotification}>
              <Award size={20} color="var(--warning)" style={{ marginRight: '6px' }} />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CONGRATULATIONS</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.15rem' }}>
                  +{wonAmount.toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken}!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Game Board */}
        <div className="glass-panel" style={styles.boardPanel}>
          <div style={styles.grid}>
            {board.map((tile, idx) => {
              const isRevealed = tile.isRevealed;
              const isMine = tile.isMine;
              
              // Define rendering look
              let tileContent = null;
              let customStyle: React.CSSProperties = {};

              if (isRevealed) {
                customStyle = {
                  transform: 'rotateY(180deg)',
                  backgroundColor: isMine ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  borderColor: isMine ? 'var(--danger)' : 'var(--success)',
                  boxShadow: isMine ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(16, 185, 129, 0.3)'
                };
                tileContent = isMine ? (
                  <Bomb size={32} color="var(--danger)" style={styles.rotatedArt} />
                ) : (
                  <div style={styles.rotatedDiamondWrapper}>
                    <Sparkles size={28} color="var(--warning)" />
                  </div>
                );
              } else {
                // Unturned state
                customStyle = {
                  cursor: gameState === 'playing' ? 'pointer' : 'default',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                };
              }

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.tile,
                    ...customStyle,
                  }}
                  onClick={() => handleTileClick(idx)}
                >
                  {tileContent}
                </div>
              );
            })}

            {/* Grid overlay message when idle */}
            {gameState === 'idle' && (
              <div style={styles.boardOverlay}>
                <Sparkles size={38} color="var(--primary)" style={{ marginBottom: '10px' }} />
                <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Mines Board Inactive</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Place a wager on the left controls to start sweeps!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    transition: 'transform 0.05s',
  },
  shakeContainer: {
    animation: 'shake 0.4s ease-in-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '12px',
  },
  fairBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-xs)',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  controlsPanel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  boardPanel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: '380px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  quickBetRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginTop: '4px',
  },
  quickBetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '6px 0',
    cursor: 'pointer',
    textAlign: 'center',
    transition: '0.2s',
  },
  select: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    color: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  actionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  liveStats: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  winNotification: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    marginTop: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    width: '100%',
    maxWidth: '380px',
    aspectRatio: '1',
    position: 'relative',
  },
  tile: {
    aspectRatio: '1',
    borderRadius: 'var(--radius-md)',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s, border-color 0.3s, box-shadow 0.3s',
    userSelect: 'none',
  },
  rotatedArt: {
    transform: 'rotateY(180deg)',
    animation: 'float 2s infinite ease-in-out',
  },
  rotatedDiamondWrapper: {
    transform: 'rotateY(180deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 0 6px var(--warning-glow))',
  },
  boardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 7, 20, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    padding: '20px',
  },
};

// Handle responsive layout grid changes using media query listeners
const mQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
if (mQuery && mQuery.matches) {
  styles.layoutGrid.gridTemplateColumns = '280px 1fr';
}
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 768px) {
      div[style*="layoutGrid"] {
        grid-template-columns: 280px 1fr !important;
      }
    }
    .quickBetBtn:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      color: #fff !important;
    }
  `;
  document.head.appendChild(style);
}
export default Mines;
