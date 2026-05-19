import React, { useState, useEffect, useRef } from 'react';
import type { WalletSystem } from '../../hooks/useWallet';
import { TOKENS } from '../../hooks/useWallet';
import type { AudioSystem } from '../../hooks/useAudio';
import { generatePlinkoPath } from '../../utils/provablyFair';
import { Shield, Sparkles, Award, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlinkoProps {
  wallet: WalletSystem;
  audio: AudioSystem;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onIncrementNonce: () => void;
}

interface PlinkoBall {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  row: number;
  path: number[]; // 0 = Left, 1 = Right
  betAmount: number;
  token: string;
  progress: number; // 0 to 1 between bounces
  speed: number;
}

interface Peg {
  x: number;
  y: number;
  glowTime: number; // For hit flashes
}

// Bins multipliers configurations based on Risk and Rows
const MULTIPLIERS: Record<'low' | 'medium' | 'high', Record<number, number[]>> = {
  low: {
    8:  [5.6, 1.6, 1.1, 1.0, 0.5, 1.0, 1.1, 1.6, 5.6],
    10: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    12: [10, 4.2, 2.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 2.0, 4.2, 10],
  },
  medium: {
    8:  [13, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13],
    10: [22, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22],
    12: [33, 11, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11, 33],
  },
  high: {
    8:  [29, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29],
    10: [76, 10, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10, 76],
    12: [170, 33, 8.5, 3.0, 1.0, 0.5, 0.2, 0.5, 1.0, 3.0, 8.5, 33, 170],
  }
};

export function Plinko({ wallet, audio, serverSeed, clientSeed, nonce, onIncrementNonce }: PlinkoProps) {
  const [betAmount, setBetAmount] = useState('100');
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState<8 | 10 | 12>(10);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ballsRef = useRef<PlinkoBall[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const activeConf = TOKENS[wallet.activeToken];
  const [wonNotification, setWonNotification] = useState<{ amount: number; mult: number } | null>(null);

  // Initialize peg board when row configuration changes
  useEffect(() => {
    generatePegs();
  }, [rows]);

  const generatePegs = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const newPegs: Peg[] = [];
    const startY = 50;
    const rowHeight = (height - 120) / (rows + 1);
    const spacingX = width / (rows + 2);

    for (let r = 0; r <= rows; r++) {
      // Row r has (r + 1) pegs
      const pegCount = r + 1;
      const rowWidth = (pegCount - 1) * spacingX;
      const startX = (width - rowWidth) / 2;

      for (let p = 0; p < pegCount; p++) {
        newPegs.push({
          x: startX + p * spacingX,
          y: startY + r * rowHeight,
          glowTime: 0
        });
      }
    }
    pegsRef.current = newPegs;
  };

  // Main canvas drawing and ball physics update tick
  useEffect(() => {
    let animationFrameId: number;
    
    const updateAndDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Deep cyber gradient space
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0c0a20');
      bgGrad.addColorStop(1, '#070514');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid helper layout details
      const startY = 50;
      const rowHeight = (height - 120) / (rows + 1);
      const spacingX = width / (rows + 2);

      // Draw Pegs (Bouncing contact nodes)
      pegsRef.current.forEach(peg => {
        if (peg.glowTime > 0) {
          peg.glowTime -= 0.05;
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'var(--accent)';
          ctx.fillStyle = 'var(--accent)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        }
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.glowTime > 0 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Multiplier Bins at the bottom
      const bins = MULTIPLIERS[risk][rows];
      const binWidth = width / bins.length;
      const binY = height - 50;
      const binHeight = 35;

      bins.forEach((mult, idx) => {
        // Center bins have lower multipliers (gray/green), edges have high multipliers (orange/red)
        const mid = (bins.length - 1) / 2;
        const dist = Math.abs(idx - mid) / mid;
        
        let color = 'rgba(139, 92, 246, 0.15)'; // primary violet
        let borderColor = 'rgba(139, 92, 246, 0.4)';
        
        if (dist > 0.8) {
          color = 'rgba(239, 68, 68, 0.25)'; // danger red
          borderColor = 'var(--danger)';
        } else if (dist > 0.4) {
          color = 'rgba(245, 158, 11, 0.2)'; // warning amber
          borderColor = 'var(--warning)';
        } else if (mult >= 1.0) {
          color = 'rgba(16, 185, 129, 0.15)'; // success emerald
          borderColor = 'var(--success)';
        }

        ctx.fillStyle = color;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        
        const binX = idx * binWidth + 4;
        ctx.beginPath();
        ctx.roundRect(binX, binY, binWidth - 8, binHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Mult Text
        ctx.fillStyle = '#fff';
        ctx.font = "800 0.8rem var(--font-sans)";
        ctx.textAlign = 'center';
        ctx.fillText(`${mult}x`, binX + (binWidth - 8) / 2, binY + 22);
      });

      // Update and Draw active falling Balls
      ballsRef.current = ballsRef.current.filter(ball => {
        ball.progress += ball.speed;

        if (ball.progress >= 1.0) {
          // Ball arrived at next peg!
          ball.progress = 0;
          ball.row += 1;

          if (ball.row <= rows) {
            // Highlight current peg that was just hit!
            const hitPegIdx = findPegIndex(ball.x, ball.y);
            if (hitPegIdx !== -1) {
              pegsRef.current[hitPegIdx].glowTime = 1.0;
              // Synthesize plink sound
              audio.playPlink(300 + ball.row * 35);
            }

            ball.x = ball.targetX;
            ball.y = ball.targetY;

            // Compute target peg coordinate
            const nextPegCount = ball.row + 1;
            const nextRowWidth = (nextPegCount - 1) * spacingX;
            const nextStartX = (width - nextRowWidth) / 2;
            
            // Determine active index offset
            const activeIndex = ball.path.slice(0, ball.row).reduce((acc, curr) => acc + curr, 0);
            ball.targetX = nextStartX + activeIndex * spacingX;
            ball.targetY = startY + ball.row * rowHeight;
          } else {
            // Ball reached bottom multipliers!
            resolveBallLanding(ball);
            return false; // delete ball
          }
        }

        // Interpolate ball coordinates smoothly using dynamic ease-out curves
        const t = ball.progress;
        // Simple gravity bounce easing
        const currentX = ball.x + (ball.targetX - ball.x) * t;
        const currentY = ball.y + (ball.targetY - ball.y) * t + Math.sin(t * Math.PI) * -12; // curve hop

        // Draw Ball
        ctx.fillStyle = 'var(--accent)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'var(--accent-glow)';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rows, risk]);

  // Find corresponding peg index at coordinates
  const findPegIndex = (x: number, y: number): number => {
    let bestIdx = -1;
    let bestDist = 999;
    pegsRef.current.forEach((peg, idx) => {
      const dist = Math.hypot(peg.x - x, peg.y - y);
      if (dist < bestDist && dist < 15) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  const resolveBallLanding = (ball: PlinkoBall) => {
    const rightBouncesCount = ball.path.reduce((acc, curr) => acc + curr, 0);
    
    // Bottom column matches count of right bounces
    const binColIdx = rightBouncesCount;
    const bins = MULTIPLIERS[risk][rows];
    const multiplierValue = bins[binColIdx];

    const payout = ball.betAmount * multiplierValue;

    // Credit wallet payout
    wallet.credit(payout, `Plinko drop landing (${multiplierValue}x)`);
    
    if (multiplierValue >= 1.0) {
      audio.playWin();
      setWonNotification({ amount: payout, mult: multiplierValue });
      setTimeout(() => setWonNotification(null), 4000);
    } else {
      audio.playLose();
    }

    // Special celebratory confetti blast for high multipliers
    if (multiplierValue >= 5.0) {
      confetti({
        particleCount: 60,
        spread: 45,
        origin: { y: 0.8 }
      });
    }
  };

  const dropBall = () => {
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

    // Deduct
    const deducted = wallet.deduct(amt, `Plinko drop bet`);
    if (!deducted) return;

    onIncrementNonce();

    // Generate path deterministic
    const path = generatePlinkoPath(serverSeed, clientSeed, nonce + 1, rows);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set starting ball position at the peak peg
    const startX = canvas.width / 2;
    const startY = 15;

    const startYPeg = 50;
    // Dynamic initial target (first peg row has 1 peg at center startX)
    const firstPegX = canvas.width / 2;
    const firstPegY = startYPeg;

    const newBall: PlinkoBall = {
      id: Math.random().toString(36).substring(2, 9),
      x: startX,
      y: startY,
      targetX: firstPegX,
      targetY: firstPegY,
      row: 0,
      path,
      betAmount: amt,
      token: wallet.activeToken,
      progress: 0,
      speed: 0.05 // bounce interpolation speed
    };

    ballsRef.current.push(newBall);
  };

  return (
    <div style={styles.container}>
      
      {/* Header Banner */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={24} color="var(--accent)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Plinko Neon Drop</h2>
        </div>
        <div style={styles.fairBadge}>
          <Shield size={14} color="var(--accent)" />
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
                onChange={e => setBetAmount(e.target.value)}
              />
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{activeConf.icon}</span>
            </div>
            <div style={styles.quickBetRow}>
              <button onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) / 2 || 10).toString()); }} style={styles.quickBetBtn}>½</button>
              <button onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) * 2 || 100).toString()); }} style={styles.quickBetBtn}>2x</button>
              <button onClick={() => { audio.playClick(); setBetAmount(wallet.balances[wallet.activeToken].toString()); }} style={styles.quickBetBtn}>MAX</button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Risk Tier</label>
            <div style={styles.riskToggleRow}>
              {(['low', 'medium', 'high'] as const).map(tier => {
                const isActive = risk === tier;
                return (
                  <button
                    key={tier}
                    style={{
                      ...styles.riskBtn,
                      borderColor: isActive ? (tier === 'high' ? 'var(--danger)' : tier === 'medium' ? 'var(--warning)' : 'var(--success)') : 'var(--border-light)',
                      backgroundColor: isActive ? (tier === 'high' ? 'rgba(239, 68, 68, 0.12)' : tier === 'medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)') : 'rgba(0, 0, 0, 0.2)',
                      color: isActive ? '#fff' : 'var(--text-secondary)'
                    }}
                    onClick={() => { audio.playClick(); setRisk(tier); }}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Peg Rows</label>
            <select
              value={rows}
              onChange={e => { audio.playClick(); setRows(parseInt(e.target.value) as any); }}
              style={styles.select}
            >
              <option value="8">8 Rows</option>
              <option value="10">10 Rows</option>
              <option value="12">12 Rows</option>
            </select>
          </div>

          <button
            className="glass-button glass-button-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '10px', gap: '6px' }}
            onClick={dropBall}
          >
            <Play size={16} fill="currentColor" /> Drop Test Ball
          </button>

          {wonNotification && (
            <div style={styles.winNotification}>
              <Award size={20} color="var(--warning)" style={{ marginRight: '6px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LANDED MULTIPLIER {wonNotification.mult}x</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>
                  +{wonNotification.amount.toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken}!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Plinko Board */}
        <div className="glass-panel" style={styles.canvasPanel}>
          <canvas
            ref={canvasRef}
            width="480"
            height="400"
            style={styles.canvas}
          />
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
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
    color: '#e879f9',
    border: '1px solid rgba(217, 70, 239, 0.3)',
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
  canvasPanel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: '420px',
  },
  canvas: {
    width: '100%',
    maxWidth: '480px',
    height: '400px',
    display: 'block',
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
  riskToggleRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  riskBtn: {
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 0',
    fontWeight: 700,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
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
  winNotification: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    marginTop: '8px',
  },
};

// Handle responsive layout grid changes using media queries
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 768px) {
      div[style*="layoutGrid"] {
        grid-template-columns: 280px 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}
export default Plinko;
