import React, { useState, useEffect, useRef } from 'react';
import type { WalletSystem } from '../../hooks/useWallet';
import { TOKENS } from '../../hooks/useWallet';
import type { AudioSystem } from '../../hooks/useAudio';
import { generateCrashMultiplier } from '../../utils/provablyFair';
import { Shield, Rocket, Award, Info, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CrashProps {
  wallet: WalletSystem;
  audio: AudioSystem;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onIncrementNonce: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const COLORS = {
  primary: '#8b5cf6',
  accent: '#d946ef',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  textSecondary: '#94a3b8',
  bgDeep: '#090714',
  bgSpace: '#0d0a1f',
  bgSurface: '#14112a',
};

const FONTS = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  display: "'Outfit', sans-serif",
};

export function Crash({ wallet, audio, serverSeed, clientSeed, nonce, onIncrementNonce }: CrashProps) {
  const [betAmount, setBetAmount] = useState('100');
  const [autoCashout, setAutoCashout] = useState('2.00');
  
  // Game states: 'lobby' | 'active' | 'crashed'
  const [gameState, setGameState] = useState<'lobby' | 'active' | 'crashed'>('lobby');
  const [timeToStart, setTimeToStart] = useState(5.0); // seconds
  const [multiplier, setMultiplier] = useState(1.00);
  // Player's personal state
  const [hasBet, setHasBet] = useState(false);
  const [betPlacedAmount, setBetPlacedAmount] = useState(0);
  const [playerStatus, setPlayerStatus] = useState<'betting' | 'cashed_out' | 'lost'>('betting');
  const [wonAmount, setWonAmount] = useState(0);
  const [cashedMultiplier, setCashedMultiplier] = useState(0);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const gridOffsetRef = useRef(0);
  
  // Dynamic outcome stores
  const targetCrashMultRef = useRef(1.00);
  const startTimeRef = useRef(0);
  const activeConf = TOKENS[wallet.activeToken];

  // Sound ticking throttle
  const lastTickMultiplierRef = useRef(1.00);

  // Refs to prevent stale closures inside animation frame loops
  const hasBetRef = useRef(hasBet);
  const playerStatusRef = useRef(playerStatus);
  const betPlacedAmountRef = useRef(betPlacedAmount);
  const autoCashoutRef = useRef(autoCashout);

  useEffect(() => { hasBetRef.current = hasBet; }, [hasBet]);
  useEffect(() => { playerStatusRef.current = playerStatus; }, [playerStatus]);
  useEffect(() => { betPlacedAmountRef.current = betPlacedAmount; }, [betPlacedAmount]);
  useEffect(() => { autoCashoutRef.current = autoCashout; }, [autoCashout]);

  // Clean up canvas animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const drawLobbyCanvas = (timeRemaining: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Dark Cyber Space Radial Background
    const radGrad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width);
    radGrad.addColorStop(0, '#100c2a');
    radGrad.addColorStop(1, '#070514');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw static grid lines
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Rocket on launch pad at origin (50, height - 50)
    const originX = 50;
    const originY = height - 50;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(0); // resting

    // Glowing thruster body
    const rG = ctx.createLinearGradient(-15, -6, 15, 6);
    rG.addColorStop(0, COLORS.accent);
    rG.addColorStop(1, COLORS.primary);
    ctx.fillStyle = rG;

    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red nose cap
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.quadraticCurveTo(22, 0, 12, 5);
    ctx.fill();

    // Wings
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-2, -6);
    ctx.moveTo(-8, 6);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-2, 6);
    ctx.stroke();

    ctx.restore();

    // Launch Pad guide line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, originY + 10);
    ctx.lineTo(80, originY + 10);
    ctx.stroke();

    // Draw real-time countdown multiplier/seconds right on the canvas!
    ctx.fillStyle = '#fff';
    ctx.font = `800 3.2rem ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    ctx.fillText(`${timeRemaining.toFixed(1)}s`, width / 2, height / 2 - 20);
    ctx.shadowBlur = 0;

    // Draw tiny guide text
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `600 0.85rem ${FONTS.sans}`;
    ctx.fillText("PREPARING LAUNCH", width / 2, height / 2 + 20);
  };

  // 1. Core loop state manager
  useEffect(() => {
    let lobbyInterval: any = null;

    if (gameState === 'lobby') {
      // Clear canvas animations
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      // Calculate outcome seed ahead of time so the hash is locked before flight
      targetCrashMultRef.current = generateCrashMultiplier(serverSeed, clientSeed, nonce + 1);

      setTimeToStart(5.0);
      setMultiplier(1.00);
      setWonAmount(0);

      // Render initial frame immediately
      drawLobbyCanvas(5.0);

      const start = Date.now();
      lobbyInterval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        const remaining = Math.max(0, 5.0 - elapsed);
        setTimeToStart(Number(remaining.toFixed(1)));
        
        drawLobbyCanvas(remaining);
        
        if (remaining <= 0) {
          clearInterval(lobbyInterval);
          // Transition to active flight phase!
          startFlight();
        }
      }, 100);
    }

    return () => {
      if (lobbyInterval) clearInterval(lobbyInterval);
    };
  }, [gameState, serverSeed, clientSeed, nonce]);

  const startFlight = () => {
    audio.playClick();
    onIncrementNonce(); // Bump nonce to lock seed
    setGameState('active');
    startTimeRef.current = Date.now();
    setMultiplier(1.00);
    lastTickMultiplierRef.current = 1.00;

    if (hasBetRef.current) {
      setPlayerStatus('betting');
    }

    // Start canvas animation loop
    particlesRef.current = [];
    gridOffsetRef.current = 0;
    renderLoop();
  };

  // 2. Flight Tick Loop
  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Calculate current multiplier exponentially
    // Formula: multiplier = 1.001 ^ elapsedMS
    const elapsed = Date.now() - startTimeRef.current;
    // Tweak climbing speed (divide by 1000 to scale elapsed to seconds)
    const elapsedSec = elapsed / 1000;
    const currentMultiplier = Math.pow(1.06, elapsedSec * 3);
    const clampedMult = Math.round(currentMultiplier * 100) / 100;
    
    setMultiplier(clampedMult);

    // Audio ticking sound speeding up
    if (clampedMult - lastTickMultiplierRef.current >= 0.08) {
      audio.playCrashTick(clampedMult);
      lastTickMultiplierRef.current = clampedMult;
    }

    // Check Auto-Cashout
    const autoTarget = parseFloat(autoCashoutRef.current);
    if (hasBetRef.current && playerStatusRef.current === 'betting' && !isNaN(autoTarget) && clampedMult >= autoTarget) {
      cashOut(clampedMult);
    }

    // Check Crash Event!
    if (clampedMult >= targetCrashMultRef.current) {
      // Exploded!
      triggerCrash(targetCrashMultRef.current);
      return;
    }

    // --- CANVAS GRAPHICS RENDERING ---
    ctx.clearRect(0, 0, width, height);

    // Draw Dark Cyber Space Radial Background
    const radGrad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width);
    radGrad.addColorStop(0, '#100c2a');
    radGrad.addColorStop(1, '#070514');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Moving grid background lines (simulates rocket forward velocity!)
    gridOffsetRef.current = (gridOffsetRef.current + (clampedMult * 1.5)) % 40;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1.5;
    
    // Vertical Grid
    for (let x = -gridOffsetRef.current; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Horizontal Grid
    for (let y = gridOffsetRef.current; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Transform coordinate bounds for flight line
    // Flight line starts at bottom left: (40, height - 40)
    // Rockets caps max height at top right: (width - 60, 40)
    const originX = 50;
    const originY = height - 50;
    const targetMaxX = width - 80;
    const targetMaxY = 60;

    // Calculate dynamic flight tip coordinates along an exponential curve
    // Scale curve height based on multiplier
    const progress = Math.min(1, (clampedMult - 1) / (Math.max(5, targetCrashMultRef.current) - 1));
    const rocketX = originX + (targetMaxX - originX) * progress;
    const rocketY = originY - (originY - targetMaxY) * Math.pow(progress, 1.6);

    // Draw beautiful neon exponential line
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(217, 70, 239, 0.5)';
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    // Draw quad bezier or multiple segments
    for (let i = 0; i <= 20; i++) {
      const p = i / 20 * progress;
      const x = originX + (targetMaxX - originX) * p;
      const y = originY - (originY - targetMaxY) * Math.pow(p, 1.6);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Spawn flight flame exhaust particles
    if (Math.random() < 0.8) {
      particlesRef.current.push({
        x: rocketX - 5,
        y: rocketY + 2,
        vx: -2 - Math.random() * 4,
        vy: (Math.random() - 0.5) * 3,
        color: Math.random() < 0.6 ? COLORS.accent : COLORS.danger,
        size: 2 + Math.random() * 4,
        life: 0,
        maxLife: 20 + Math.random() * 20
      });
    }

    // Update and draw flame particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      
      const alpha = 1 - (p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      return p.life < p.maxLife;
    });
    ctx.globalAlpha = 1.0; // reset alpha

    // Draw Rocket SVG capsule directly on Canvas using rendering paths
    ctx.save();
    ctx.translate(rocketX, rocketY);
    ctx.rotate(-Math.PI / 4 * progress); // Rotate slightly based on altitude slope

    // Rocket glowing thruster body
    const rG = ctx.createLinearGradient(-15, -6, 15, 6);
    rG.addColorStop(0, COLORS.accent);
    rG.addColorStop(1, COLORS.primary);
    ctx.fillStyle = rG;

    // Body capsule path
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red nose cap
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.quadraticCurveTo(22, 0, 12, 5);
    ctx.fill();

    // Wings
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-2, -6);
    ctx.moveTo(-8, 6);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-2, 6);
    ctx.stroke();

    ctx.restore();

    // Display real-time flight multiplier in giant text right on the canvas!
    ctx.fillStyle = '#fff';
    ctx.font = `800 3.2rem ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    ctx.fillText(`${clampedMult.toFixed(2)}x`, width / 2, height / 2 - 20);
    ctx.shadowBlur = 0;

    // Draw tiny guide text
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `600 0.85rem ${FONTS.sans}`;
    ctx.fillText("FLIGHT IN PROGRESS", width / 2, height / 2 + 20);

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);
  };

  const triggerCrash = (crashValue: number) => {
    audio.playExplosion();
    setGameState('crashed');
    
    if (hasBetRef.current && playerStatusRef.current === 'betting') {
      setPlayerStatus('lost');
    }

    setHasBet(false);

    // Draw crash state on Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Solid dark red alert background flash
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.danger;
    ctx.font = `800 3.5rem ${FONTS.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CRASHED @ ${crashValue.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `600 0.9rem ${FONTS.sans}`;
    ctx.fillText("LOBBY COOLDOWN STARTING...", canvas.width / 2, canvas.height / 2 + 35);

    // Automatically queue next lobby round in 3.5 seconds
    setTimeout(() => {
      setGameState('lobby');
    }, 3500);
  };

  const placeBet = () => {
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

    const deducted = wallet.deduct(amt, `Crash Bet placed`);
    if (deducted) {
      setHasBet(true);
      setBetPlacedAmount(amt);
      setPlayerStatus('betting');
    }
  };

  const cashOut = (exitMult: number) => {
    if (!hasBetRef.current || playerStatusRef.current !== 'betting') return;
    audio.playClick();

    const payout = betPlacedAmountRef.current * exitMult;
    
    wallet.credit(payout, `Crash Cashout (${exitMult}x)`);
    setWonAmount(payout);
    setCashedMultiplier(exitMult);
    setPlayerStatus('cashed_out');
    audio.playWin();

    // Drop confetti on win
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
  };

  return (
    <div style={styles.container}>
      
      {/* Banner */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rocket size={24} color="var(--primary)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Crash Galactic Flight</h2>
        </div>
        <div style={styles.fairBadge}>
          <Shield size={14} color="var(--primary)" />
          <span>Provably Fair Nonce: {nonce}</span>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        
        {/* Left sidebar bet settings */}
        <div className="glass-panel" style={styles.controlsPanel}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bet Amount</label>
            <div className="glass-input-wrapper">
              <input
                type="number"
                className="glass-input"
                value={betAmount}
                disabled={hasBet || gameState === 'active'}
                onChange={e => setBetAmount(e.target.value)}
              />
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{activeConf.icon}</span>
            </div>
            <div style={styles.quickBetRow}>
              <button disabled={hasBet || gameState === 'active'} onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) / 2 || 10).toString()); }} style={styles.quickBetBtn}>½</button>
              <button disabled={hasBet || gameState === 'active'} onClick={() => { audio.playClick(); setBetAmount((parseFloat(betAmount) * 2 || 100).toString()); }} style={styles.quickBetBtn}>2x</button>
              <button disabled={hasBet || gameState === 'active'} onClick={() => { audio.playClick(); setBetAmount(wallet.balances[wallet.activeToken].toString()); }} style={styles.quickBetBtn}>MAX</button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Auto Cashout Multiplier</label>
            <div className="glass-input-wrapper">
              <input
                type="number"
                step="0.05"
                className="glass-input"
                value={autoCashout}
                disabled={hasBet || gameState === 'active'}
                onChange={e => setAutoCashout(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x</span>
            </div>
          </div>

          {gameState === 'lobby' ? (
            <button
              className="glass-button glass-button-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '10px' }}
              disabled={hasBet}
              onClick={placeBet}
            >
              {hasBet ? 'Wager Locked!' : 'Bet for Next Flight'}
            </button>
          ) : (
            // Active flight
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hasBet && playerStatus === 'betting' ? (
                <button
                  className="glass-button glass-button-success"
                  style={{ width: '100%', padding: '14px', fontSize: '1.1rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
                  onClick={() => cashOut(multiplier)}
                >
                  CASH OUT ({(betPlacedAmount * multiplier).toFixed(2)} {wallet.activeToken})
                </button>
              ) : (
                <button
                  className="glass-button"
                  style={{ width: '100%', padding: '14px', fontSize: '1.1rem', color: 'var(--text-muted)' }}
                  disabled
                >
                  {hasBet && playerStatus === 'cashed_out' ? 'Cashed Out! ✓' : 'Spectating Flight'}
                </button>
              )}
            </div>
          )}

          {/* Personal Win Summary box */}
          {playerStatus === 'cashed_out' && wonAmount > 0 && (
            <div style={styles.winNotification}>
              <Award size={20} color="var(--warning)" style={{ marginRight: '6px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FLIGHT SECURED @ {cashedMultiplier.toFixed(2)}x</span>
                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>
                  +{wonAmount.toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken}!
                </div>
              </div>
            </div>
          )}

          {/* Lose alert */}
          {playerStatus === 'lost' && (
            <div style={{ ...styles.winNotification, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <AlertTriangle size={20} color="var(--danger)" style={{ marginRight: '6px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CRASHED BEFORE CASHOUT</span>
                <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1.1rem' }}>
                  -{betPlacedAmount} {wallet.activeToken}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Canvas graphics rendering panel */}
        <div className="glass-panel" style={styles.canvasPanel}>
          <canvas
            ref={canvasRef}
            width="580"
            height="360"
            style={styles.canvas}
          />

          {/* Lobby countdown screen overlay */}
          {gameState === 'lobby' && (
            <div style={styles.canvasLobbyOverlay}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Next Space Flight Preparing
              </h3>
              
              <div style={styles.countdownProgressBg}>
                <div
                  style={{
                    ...styles.countdownProgressBar,
                    width: `${(timeToStart / 5) * 100}%`
                  }}
                />
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                Rocket taking off in {timeToStart.toFixed(1)}s
              </div>

              {hasBet && (
                <div style={styles.betAlertTag}>
                  Wager Locked: {betPlacedAmount} {wallet.activeToken}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={styles.footerPanel}>
        <Info size={16} color="var(--primary)" />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Multiplier increments exponentially at 6% per second. Securing bets prior to the mathematical crash point is required to win.
        </span>
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    color: '#a78bfa',
    border: '1px solid rgba(139, 92, 246, 0.3)',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '0',
    borderRadius: 'var(--radius-lg)',
  },
  canvas: {
    width: '100%',
    maxWidth: '580px',
    height: '360px',
    display: 'block',
  },
  canvasLobbyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 5, 20, 0.94)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    padding: '20px',
    textAlign: 'center',
  },
  countdownProgressBg: {
    width: '100%',
    maxWidth: '240px',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginBottom: '14px',
    marginTop: '6px',
  },
  countdownProgressBar: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    boxShadow: '0 0 10px var(--primary-glow)',
    transition: 'width 0.1s linear',
  },
  betAlertTag: {
    marginTop: '16px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--success)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-xs)',
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
  winNotification: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    marginTop: '8px',
  },
  footerPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px dashed rgba(139, 92, 246, 0.2)',
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
export default Crash;
