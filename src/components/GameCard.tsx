import React from 'react';
import { Zap } from 'lucide-react';

interface GameCardProps {
  id: 'crash' | 'mines' | 'plinko' | 'roulette';
  title: string;
  description: string;
  badgeText?: string;
  badgeType?: 'primary' | 'success' | 'danger' | 'warning';
  rtp: string;
  onClick: () => void;
}

export function GameCard({ id, title, description, badgeText, badgeType = 'primary', rtp, onClick }: GameCardProps) {
  
  // Render high fidelity vector art based on game type
  const renderArt = () => {
    switch (id) {
      case 'crash':
        return (
          <svg viewBox="0 0 160 120" style={styles.artSvg}>
            <defs>
              <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            {/* Grid Line */}
            <path d="M 20,100 L 140,100" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <path d="M 20,20 L 20,100" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            
            {/* Exponential Curve */}
            <path
              d="M 20,100 Q 60,95 100,70 T 135,35"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Glowing rocket capsule */}
            <g transform="translate(135, 35) rotate(-35)">
              {/* Flame tail */}
              <path d="M -10,0 L -25,-4 L -20,0 L -25,4 Z" fill="var(--danger)" />
              <path d="M -10,0 L -18,-2 L -15,0 L -18,2 Z" fill="var(--warning)" />
              {/* Rocket body */}
              <ellipse cx="0" cy="0" rx="14" ry="7" fill="url(#rocketGrad)" />
              <path d="M 5,0 L 14,0" stroke="#fff" strokeWidth="2" />
              <circle cx="-3" cy="0" r="3" fill="var(--bg-deep)" />
            </g>
          </svg>
        );
      case 'mines':
        return (
          <svg viewBox="0 0 160 120" style={styles.artSvg}>
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="var(--warning)" />
              </linearGradient>
            </defs>
            {/* 3x3 Grid illustration */}
            <g transform="translate(25, 10)">
              {/* Tile 1 (unturned) */}
              <rect x="0" y="0" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
              {/* Tile 2 (diamond) */}
              <rect x="40" y="0" width="30" height="30" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="var(--success)" strokeWidth="1.5" />
              <path d="M 55,7 L 63,15 L 55,23 L 47,15 Z" fill="var(--success)" />
              {/* Tile 3 (unturned) */}
              <rect x="80" y="0" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />

              {/* Row 2 */}
              <rect x="0" y="38" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
              {/* Mine exploded */}
              <rect x="40" y="38" width="30" height="30" rx="6" fill="rgba(239, 68, 68, 0.15)" stroke="var(--danger)" strokeWidth="1.5" />
              <circle cx="55" cy="53" r="7" fill="var(--danger)" />
              <path d="M 55,42 L 55,44 M 55,62 L 55,64 M 44,53 L 46,53 M 64,53 L 66,53" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
              
              <rect x="80" y="38" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />

              {/* Row 3 */}
              <rect x="0" y="76" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
              <rect x="40" y="76" width="30" height="30" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
              {/* Tile 9 (diamond) */}
              <rect x="80" y="76" width="30" height="30" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="var(--success)" strokeWidth="1.5" />
              <path d="M 95,83 L 103,91 L 95,99 L 87,91 Z" fill="var(--success)" />
            </g>
          </svg>
        );
      case 'plinko':
        return (
          <svg viewBox="0 0 160 120" style={styles.artSvg}>
            {/* Pyramid pegs */}
            <g fill="rgba(255,255,255,0.3)">
              <circle cx="80" cy="20" r="2.5" />
              
              <circle cx="70" cy="36" r="2.5" />
              <circle cx="90" cy="36" r="2.5" />
              
              <circle cx="60" cy="52" r="2.5" />
              <circle cx="80" cy="52" r="2.5" fill="var(--primary)" />
              <circle cx="100" cy="52" r="2.5" />
              
              <circle cx="50" cy="68" r="2.5" />
              <circle cx="70" cy="68" r="2.5" />
              <circle cx="90" cy="68" r="2.5" />
              <circle cx="110" cy="68" r="2.5" />

              <circle cx="40" cy="84" r="2.5" />
              <circle cx="60" cy="84" r="2.5" />
              <circle cx="80" cy="84" r="2.5" />
              <circle cx="100" cy="84" r="2.5" />
              <circle cx="120" cy="84" r="2.5" />
            </g>

            {/* Bouncing neon Ball path */}
            <path d="M 80,10 L 80,20 L 70,36 L 80,52 L 90,68 L 80,84 L 80,105" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="80" cy="52" r="5" fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 5px var(--accent-glow))' }} />
            
            {/* Multiplier Bins */}
            <g transform="translate(10, 102)">
              <rect x="20" y="0" width="16" height="12" rx="2" fill="rgba(239, 68, 68, 0.2)" stroke="var(--danger)" />
              <rect x="40" y="0" width="16" height="12" rx="2" fill="rgba(245, 158, 11, 0.2)" stroke="var(--warning)" />
              <rect x="60" y="0" width="16" height="12" rx="2" fill="rgba(16, 185, 129, 0.2)" stroke="var(--success)" />
              <rect x="80" y="0" width="16" height="12" rx="2" fill="rgba(16, 185, 129, 0.2)" stroke="var(--success)" />
              <rect x="100" y="0" width="16" height="12" rx="2" fill="rgba(245, 158, 11, 0.2)" stroke="var(--warning)" />
              <rect x="120" y="0" width="16" height="12" rx="2" fill="rgba(239, 68, 68, 0.2)" stroke="var(--danger)" />
            </g>
          </svg>
        );
      case 'roulette':
        return (
          <svg viewBox="0 0 160 120" style={styles.artSvg}>
            <defs>
              <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="rgba(13, 10, 31, 1)" />
                <stop offset="100%" stopColor="rgba(139, 92, 246, 0.15)" />
              </radialGradient>
            </defs>
            {/* Outer spinning wheel dial */}
            <circle cx="80" cy="60" r="46" fill="url(#wheelGlow)" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            
            {/* Colored Segment slices */}
            <g stroke="#000" strokeWidth="1">
              {/* Segment red */}
              <path d="M 80,60 L 80,18 A 42,42 0 0,1 110,31 Z" fill="var(--danger)" />
              {/* Segment black */}
              <path d="M 80,60 L 110,31 A 42,42 0 0,1 122,60 Z" fill="rgba(0,0,0,0.8)" />
              {/* Segment red */}
              <path d="M 80,60 L 122,60 A 42,42 0 0,1 110,89 Z" fill="var(--danger)" />
              {/* Segment black */}
              <path d="M 80,60 L 110,89 A 42,42 0 0,1 80,102 Z" fill="rgba(0,0,0,0.8)" />
              {/* Segment green (Zero jackpot) */}
              <path d="M 80,60 L 80,102 A 42,42 0 0,1 50,89 Z" fill="var(--success)" />
              {/* Segment red */}
              <path d="M 80,60 L 50,89 A 42,42 0 0,1 38,60 Z" fill="var(--danger)" />
              {/* Segment black */}
              <path d="M 80,60 L 38,60 A 42,42 0 0,1 50,31 Z" fill="rgba(0,0,0,0.8)" />
              {/* Segment red */}
              <path d="M 80,60 L 50,31 A 42,42 0 0,1 80,18 Z" fill="var(--danger)" />
            </g>

            {/* Inner cap */}
            <circle cx="80" cy="60" r="16" fill="var(--bg-space)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <circle cx="80" cy="60" r="6" fill="#fff" />
            
            {/* Spinning ball pointer */}
            <circle cx="106" cy="42" r="3.5" fill="#fff" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' }} />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success': return 'badge-success';
      case 'danger': return 'badge-danger';
      case 'warning': return 'badge-warning';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="glass-panel glass-panel-glow" style={styles.card} onClick={onClick}>
      {/* Top badges bar */}
      <div style={styles.badgeBar}>
        {badgeText && <span className={`badge ${getBadgeStyle()}`}>{badgeText}</span>}
        <span style={styles.rtpBadge}>⚡ {rtp} RTP</span>
      </div>

      {/* Vector art center */}
      <div style={styles.artContainer}>
        {renderArt()}
      </div>

      {/* Info footer */}
      <div style={styles.info}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.desc}>{description}</p>
      </div>

      {/* Quick Play Trigger Hover state */}
      <div style={styles.playAction}>
        <span>Play Now</span>
        <Zap size={14} fill="currentColor" />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '320px',
  },
  badgeBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  rtpBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  artContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '130px',
    position: 'relative',
    margin: '10px 0',
  },
  artSvg: {
    width: '100%',
    maxHeight: '140px',
    display: 'block',
  },
  info: {
    marginTop: 'auto',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 800,
    marginBottom: '4px',
    color: '#fff',
    fontFamily: 'var(--font-display)',
  },
  desc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  playAction: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 0',
    transform: 'translateY(100%)',
    transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Insert pure CSS styles dynamically in our card elements
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .glass-panel-glow:hover div[style*="transform: translateY(100%)"] {
      transform: translateY(0%) !important;
    }
    .glass-panel-glow:hover div[style*="margin-top: auto"] {
      transform: translateY(-20px);
      opacity: 0.15;
    }
    .glass-panel-glow div[style*="margin-top: auto"] {
      transition: all var(--transition-normal);
    }
  `;
  document.head.appendChild(style);
}
export default GameCard;
