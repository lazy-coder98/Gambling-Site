import React, { useState, useRef } from 'react';
import type { WalletSystem } from '../../hooks/useWallet';
import { TOKENS } from '../../hooks/useWallet';
import type { AudioSystem } from '../../hooks/useAudio';
import { generateRouletteNumber } from '../../utils/provablyFair';
import { Shield, Sparkles, Award, RotateCw, History } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RouletteProps {
  wallet: WalletSystem;
  audio: AudioSystem;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onIncrementNonce: () => void;
}

// 15 pockets sequence
const WHEEL_POCKETS = [
  { num: 0, color: 'green' },
  { num: 11, color: 'black' },
  { num: 5, color: 'red' },
  { num: 10, color: 'black' },
  { num: 6, color: 'red' },
  { num: 9, color: 'black' },
  { num: 7, color: 'red' },
  { num: 8, color: 'black' },
  { num: 1, color: 'red' },
  { num: 14, color: 'black' },
  { num: 2, color: 'red' },
  { num: 13, color: 'black' },
  { num: 3, color: 'red' },
  { num: 12, color: 'black' },
  { num: 4, color: 'red' },
];

export function Roulette({ wallet, audio, serverSeed, clientSeed, nonce, onIncrementNonce }: RouletteProps) {
  // Bets per pocket type
  const [betRed, setBetRed] = useState('0');
  const [betBlack, setBetBlack] = useState('0');
  const [betGreen, setBetGreen] = useState('0');

  const [activeChip, setActiveChip] = useState(10); // Active chip size to add
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{ num: number; color: string } | null>(null);
  
  // Historical wheel landings
  const [history, setHistory] = useState<Array<{ num: number; color: string }>>(() => {
    const list = [
      { num: 5, color: 'red' },
      { num: 14, color: 'black' },
      { num: 0, color: 'green' },
      { num: 2, color: 'red' },
      { num: 10, color: 'black' }
    ];
    return list;
  });

  const [wonAmount, setWonAmount] = useState(0);

  // Wheel styling references for CSS transition rotation
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const activeConf = TOKENS[wallet.activeToken];

  const clearBets = () => {
    audio.playClick();
    setBetRed('0');
    setBetBlack('0');
    setBetGreen('0');
    setWonAmount(0);
  };

  const handleChipClick = (lane: 'red' | 'black' | 'green') => {
    if (isSpinning) return;
    audio.playClick();

    const currentBets: Record<string, string> = { red: betRed, black: betBlack, green: betGreen };
    const currAmt = parseFloat(currentBets[lane]) || 0;
    const nextAmt = currAmt + activeChip;
    
    // Check wallet balance bounds
    const totalWagered = (parseFloat(betRed) || 0) + (parseFloat(betBlack) || 0) + (parseFloat(betGreen) || 0) + activeChip;
    if (wallet.balances[wallet.activeToken] < totalWagered) {
      alert("Insufficient wallet balance for this chip placement.");
      return;
    }

    if (lane === 'red') setBetRed(nextAmt.toString());
    else if (lane === 'black') setBetBlack(nextAmt.toString());
    else setBetGreen(nextAmt.toString());
  };

  const handleSpin = () => {
    if (isSpinning) return;
    
    const wRed = parseFloat(betRed) || 0;
    const wBlack = parseFloat(betBlack) || 0;
    const wGreen = parseFloat(betGreen) || 0;
    const totalWager = wRed + wBlack + wGreen;

    if (totalWager <= 0) {
      alert("Please place at least one wager on Red, Black, or Green to spin!");
      return;
    }

    if (wallet.balances[wallet.activeToken] < totalWager) {
      alert("Insufficient balance.");
      return;
    }

    audio.playClick();
    setIsSpinning(true);
    setWonAmount(0);

    // Deduct bets
    const deducted = wallet.deduct(totalWager, `Roulette wagers Red: ${wRed}, Black: ${wBlack}, Green: ${wGreen}`);
    if (!deducted) {
      setIsSpinning(false);
      return;
    }

    onIncrementNonce();

    // Determine deterministic outcome via cryptographic server seed
    const outcomePocketNum = generateRouletteNumber(serverSeed, clientSeed, nonce + 1);
    
    // Find pocket info
    const pocketIdx = WHEEL_POCKETS.findIndex(p => p.num === outcomePocketNum);
    const landingPocket = WHEEL_POCKETS[pocketIdx];

    // Compute rotation angles
    // Each pocket spans (360 / 15) = 24 degrees
    // Wheel dial rotates clockwise
    const pocketDegrees = 24;
    const landingAngle = 360 - (pocketIdx * pocketDegrees);
    
    // Spin around multiple times (e.g. 5-7 revolutions) to make it highly dramatic
    const extraSpins = 360 * 6; 
    const finalAngle = landingAngle + extraSpins;

    const wheelElement = wheelRef.current;
    if (wheelElement) {
      wheelElement.style.transition = 'none';
      wheelElement.style.transform = `rotate(0deg)`;
      
      // Force repaint
      void wheelElement.offsetHeight;

      wheelElement.style.transition = 'transform 6.5s cubic-bezier(0.1, 0.8, 0.1, 1)';
      wheelElement.style.transform = `rotate(${finalAngle}deg)`;
    }

    // Play spinning ticking loop effect
    const spinStart = Date.now();
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - spinStart;
      if (elapsed >= 6500) {
        clearInterval(tickInterval);
      } else {
        // Rhythmic wooden contact click proportional to slowdown
        if (tickCount < 30) {
          audio.playPlink(440 + (tickCount % 5) * 40);
          tickCount++;
        }
      }
    }, 200);

      // Conclude spin
      setTimeout(() => {
        clearInterval(tickInterval);
        resolveSpin(landingPocket, wRed, wBlack, wGreen);
      }, 6500);
  };

  const resolveSpin = (
    result: typeof WHEEL_POCKETS[0],
    wRed: number,
    wBlack: number,
    wGreen: number
  ) => {
    setIsSpinning(false);
    setSpinResult(result);
    
    // Add to history
    setHistory(prev => [result, ...prev].slice(0, 10));

    // Calculate payouts
    let payout = 0;
    if (result.color === 'red') {
      payout = wRed * 2;
    } else if (result.color === 'black') {
      payout = wBlack * 2;
    } else if (result.color === 'green') {
      payout = wGreen * 14;
    }

    if (payout > 0) {
      wallet.credit(payout, `Roulette payout on ${result.color} (${result.num})`);
      setWonAmount(payout);
      audio.playWin();

      // Trigger Confetti explosion on any win!
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 }
      });
    } else {
      audio.playLose();
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Header Banner */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RotateCw size={24} color="var(--warning)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Color Wheel Roulette</h2>
        </div>
        <div style={styles.fairBadge}>
          <Shield size={14} color="var(--warning)" />
          <span>Provably Fair Nonce: {nonce}</span>
        </div>
      </div>

      {/* Visual Outcome History strip */}
      <div className="glass-panel" style={styles.historyStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Spins:</span>
        </div>
        <div style={styles.historyChips}>
          {history.map((hist, idx) => (
            <div
              key={idx}
              style={{
                ...styles.historyChip,
                backgroundColor: hist.color === 'green' ? 'var(--success)' : hist.color === 'red' ? 'var(--danger)' : '#000',
                border: hist.color === 'green' ? '1px solid rgba(16,185,129,0.5)' : hist.color === 'red' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {hist.num}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.layoutGrid}>
        
        {/* Left Side Roulette Wheel dial */}
        <div className="glass-panel" style={styles.wheelPanel}>
          {/* Landing dial pointer pin */}
          <div style={styles.wheelPointer}>▼</div>

          {/* Wheel dial container */}
          <div ref={wheelRef} style={styles.wheelDial}>
            {/* Display Pockets dynamically */}
            {WHEEL_POCKETS.map((pocket, idx) => {
              const angle = idx * (360 / 15);
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.wheelSlice,
                    transform: `rotate(${angle}deg)`,
                    borderBottomColor: pocket.color === 'green' ? 'var(--success)' : pocket.color === 'red' ? 'var(--danger)' : '#000',
                  }}
                >
                  <span style={styles.wheelNumber}>{pocket.num}</span>
                </div>
              );
            })}
            
            {/* Inner cap */}
            <div style={styles.wheelCap}>
              <div style={styles.wheelCapCore}>
                {spinResult && !isSpinning ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LANDED</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: spinResult.color === 'green' ? 'var(--success)' : spinResult.color === 'red' ? 'var(--danger)' : '#fff' }}>
                      {spinResult.num}
                    </div>
                  </div>
                ) : (
                  <Sparkles size={28} color="var(--primary)" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Chip Tray & Betting Layout board */}
        <div className="glass-panel" style={styles.boardPanel}>
          
          {/* Chip Selector Tray */}
          <div style={styles.chipTray}>
            <div style={styles.trayLabel}>Chips selector</div>
            <div style={styles.chips}>
              {[1, 5, 10, 50, 100, 500].map(val => {
                const isActive = activeChip === val;
                return (
                  <button
                    key={val}
                    style={{
                      ...styles.chip,
                      borderColor: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      background: isActive ? 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' : 'rgba(255,255,255,0.03)',
                      boxShadow: isActive ? '0 0 10px var(--primary-glow)' : 'none',
                      color: isActive ? '#fff' : 'var(--text-secondary)'
                    }}
                    onClick={() => { audio.playClick(); setActiveChip(val); }}
                  >
                    ${val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Betting Lanes Layout Board */}
          <div style={styles.lanesGrid}>
            
            {/* Red Lane bet card */}
            <div
              className="glass-panel"
              style={{ ...styles.laneCard, borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.04)' }}
              onClick={() => handleChipClick('red')}
            >
              <div style={styles.laneHeader}>
                <span style={{ ...styles.laneColorDot, backgroundColor: 'var(--danger)' }}></span>
                <span style={styles.laneTitle}>RED</span>
                <span style={styles.lanePayout}>2x Payout</span>
              </div>
              <div style={styles.laneBetAmt}>
                {parseFloat(betRed) > 0 ? `${parseFloat(betRed)} ${wallet.activeToken}` : 'Place chip here'}
              </div>
            </div>

            {/* Black Lane bet card */}
            <div
              className="glass-panel"
              style={{ ...styles.laneCard, borderColor: '#334155', background: 'rgba(0, 0, 0, 0.2)' }}
              onClick={() => handleChipClick('black')}
            >
              <div style={styles.laneHeader}>
                <span style={{ ...styles.laneColorDot, backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)' }}></span>
                <span style={styles.laneTitle}>BLACK</span>
                <span style={styles.lanePayout}>2x Payout</span>
              </div>
              <div style={styles.laneBetAmt}>
                {parseFloat(betBlack) > 0 ? `${parseFloat(betBlack)} ${wallet.activeToken}` : 'Place chip here'}
              </div>
            </div>

            {/* Green Lane bet card */}
            <div
              className="glass-panel"
              style={{ ...styles.laneCard, borderColor: 'var(--success)', background: 'rgba(16, 185, 129, 0.04)', gridColumn: 'span 2' }}
              onClick={() => handleChipClick('green')}
            >
              <div style={styles.laneHeader}>
                <span style={{ ...styles.laneColorDot, backgroundColor: 'var(--success)' }}></span>
                <span style={styles.laneTitle}>GREEN (ZERO JACKPOT)</span>
                <span style={styles.lanePayout}>14x Payout</span>
              </div>
              <div style={styles.laneBetAmt}>
                {parseFloat(betGreen) > 0 ? `${parseFloat(betGreen)} ${wallet.activeToken}` : 'Place chip here'}
              </div>
            </div>

          </div>

          {/* Actions button row */}
          <div style={styles.actionsBar}>
            <button className="glass-button" onClick={clearBets} disabled={isSpinning}>
              Clear Bets
            </button>
            <button
              className="glass-button glass-button-primary"
              style={{ flex: 1, padding: '14px', fontSize: '1.05rem', boxShadow: '0 0 20px var(--primary-glow)' }}
              onClick={handleSpin}
              disabled={isSpinning}
            >
              {isSpinning ? 'Spinning wheel...' : 'Spin the Wheel!'}
            </button>
          </div>

          {/* Personal Win banner */}
          {wonAmount > 0 && !isSpinning && (
            <div style={styles.winNotification}>
              <Award size={22} color="var(--warning)" style={{ marginRight: '8px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Roulette Landing Win!</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.2rem' }}>
                  +{wonAmount.toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken}!
                </div>
              </div>
            </div>
          )}

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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 'var(--radius-xs)',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  historyStrip: {
    backgroundColor: 'var(--bg-surface)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderRadius: 'var(--radius-md)',
  },
  historyChips: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
  },
  historyChip: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  wheelPanel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '30px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: '340px',
  },
  wheelPointer: {
    fontSize: '1.6rem',
    color: '#fff',
    zIndex: 10,
    marginBottom: '-8px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  wheelDial: {
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    border: '6px solid rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSlice: {
    position: 'absolute',
    top: '0',
    left: '110px', // width of slice is 60px -> (280/2) - (60/2) = 110px
    width: '60px',
    height: '140px',
    transformOrigin: 'bottom center',
    borderBottom: '140px solid', // triangle shape
    borderLeft: '18px solid transparent',
    borderRight: '18px solid transparent',
    display: 'flex',
    justifyContent: 'center',
  },
  wheelNumber: {
    position: 'absolute',
    top: '115px', // relative distance to bottom center of triangle
    color: '#fff',
    fontWeight: '900',
    fontSize: '0.78rem',
    textAlign: 'center',
    width: '100%',
  },
  wheelCap: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-deep)',
    border: '3px solid rgba(255,255,255,0.1)',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelCapCore: {
    width: '82px',
    height: '82px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-space)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)',
  },
  boardPanel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  chipTray: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  trayLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  chips: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  chip: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '2px dashed',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s',
  },
  lanesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  laneCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: '0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  laneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  laneColorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  laneTitle: {
    fontWeight: 800,
    fontSize: '0.9rem',
    color: '#fff',
  },
  lanePayout: {
    marginLeft: 'auto',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  laneBetAmt: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  actionsBar: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  winNotification: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
  },
};

// Handle responsive layout grid changes using media queries
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 768px) {
      div[style*="layoutGrid"] {
        grid-template-columns: 310px 1fr !important;
      }
    }
    .laneCard:hover {
      filter: brightness(1.15);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(255,255,255,0.02) !important;
    }
    .laneCard:active {
      transform: translateY(1px);
    }
  `;
  document.head.appendChild(style);
}
export default Roulette;
