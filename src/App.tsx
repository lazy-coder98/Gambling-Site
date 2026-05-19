import React, { useState, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useAudio } from './hooks/useAudio';
import { generateSeed } from './utils/provablyFair';

// Components
import Layout from './components/Layout';
import GameCard from './components/GameCard';
import LiveBets from './components/LiveBets';
import { WalletModal } from './components/WalletModal';
import { FairVerifier } from './components/FairVerifier';
import WagerLogs from './components/WagerLogs';

// Games
import Mines from './games/Mines/Mines';
import Crash from './games/Crash/Crash';
import Plinko from './games/Plinko/Plinko';
import Roulette from './games/Roulette/Roulette';

// Icons
import { Trophy, TrendingUp, BarChart2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('lobby');
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Initialize wallet & audio contexts
  const wallet = useWallet();
  const audio = useAudio();

  // Provably Fair States
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState(0);

  // Generate initial seeds on mount
  useEffect(() => {
    setServerSeed(generateSeed());
    setClientSeed(generateSeed());
    setNonce(0);
  }, []);

  const handleIncrementNonce = () => {
    setNonce(prev => prev + 1);
  };

  const handleRotateSeeds = (newServer: string, newClient: string) => {
    setServerSeed(newServer);
    setClientSeed(newClient);
    setNonce(0);
  };

  // Compute Personal Wager Metrics from wallet transaction array
  const wagers = wallet.transactions.filter(t => t.type === 'game_bet');
  const wins = wallet.transactions.filter(t => t.type === 'game_win');
  
  const totalBets = wagers.length;
  
  // Calculate relative wagers in USDT values for simplified display metrics
  const totalWageredUSDT = wagers.reduce((acc, tx) => {
    const amt = Math.abs(tx.amount);
    if (tx.token === 'BTC') return acc + amt * 65000;
    if (tx.token === 'ETH') return acc + amt * 3000;
    if (tx.token === 'GOLD') return acc + amt * 0.1;
    return acc + amt; // USDT is 1:1
  }, 0);

  const totalWonUSDT = wins.reduce((acc, tx) => {
    const amt = tx.amount;
    if (tx.token === 'BTC') return acc + amt * 65000;
    if (tx.token === 'ETH') return acc + amt * 3000;
    if (tx.token === 'GOLD') return acc + amt * 0.1;
    return acc + amt;
  }, 0);

  const netProfit = totalWonUSDT - totalWageredUSDT;

  const handleGameSelect = (gameId: string) => {
    audio.playClick();
    setActiveTab(gameId);
  };

  // Content routing resolver
  const renderTabContent = () => {
    switch (activeTab) {
      case 'lobby':
        return (
          <div style={styles.lobbyWrapper}>
            {/* Cyber Neon Hero Welcome Banner */}
            <div className="glass-panel" style={styles.heroBanner}>
              <div style={styles.heroLeft}>
                <div style={styles.heroBadge}>⚡ SIMULATED PROVABLY FAIR PLAY</div>
                <h2 style={styles.heroTitle}>Next-Gen Cyber Casino</h2>
                <p style={styles.heroDesc}>
                  Wager mock cryptocurrency tokens on real-time physics engines, exponential flying rockets, and sweeping mine grids. Fast, fluid, and mathematically 100% fair.
                </p>
                <div style={styles.heroActions}>
                  <button className="glass-button glass-button-primary" onClick={() => handleGameSelect('crash')}>
                    Blastoff Crash
                  </button>
                  <button className="glass-button" onClick={() => setIsWalletOpen(true)}>
                    Claim Faucet Free
                  </button>
                </div>
              </div>
              <div style={styles.heroRight} className="float">
                ✦
              </div>
            </div>

            {/* Account Performance Metrics Grid */}
            <div style={styles.metricsGrid}>
              <div className="glass-panel" style={styles.metricCard}>
                <BarChart2 size={20} color="var(--primary)" />
                <div>
                  <div style={styles.metricLabel}>Total Wagered</div>
                  <div style={styles.metricVal}>${totalWageredUSDT.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
              </div>
              <div className="glass-panel" style={styles.metricCard}>
                <TrendingUp size={20} color={netProfit >= 0 ? "var(--success)" : "var(--danger)"} />
                <div>
                  <div style={styles.metricLabel}>Net Profit</div>
                  <div style={{ ...styles.metricVal, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="glass-panel" style={styles.metricCard}>
                <Trophy size={20} color="var(--warning)" />
                <div>
                  <div style={styles.metricLabel}>Bets Wagered</div>
                  <div style={styles.metricVal}>{totalBets} rounds</div>
                </div>
              </div>
            </div>

            {/* Split Grid: Left side Game Selection, Right side Live Bet drawer */}
            <div style={styles.lobbyBodyGrid}>
              <div style={styles.gamesColumn}>
                <h3 style={styles.sectionTitle}>Cyber Interactive Suite</h3>
                <div className="grid-2">
                  <GameCard
                    id="crash"
                    title="Galactic Crash"
                    description="Ride the exponential curves of the cyber rocket and cash out wagers before it crashes!"
                    badgeText="TRENDING"
                    rtp="98.5%"
                    onClick={() => handleGameSelect('crash')}
                  />
                  <GameCard
                    id="mines"
                    title="Diamond Mines"
                    description="Custom sweep grid of cards. Flip over sparkling gems and cash out multipliers before hitting mines!"
                    badgeText="PROVABLY FAIR"
                    badgeType="success"
                    rtp="99.0%"
                    onClick={() => handleGameSelect('mines')}
                  />
                  <GameCard
                    id="plinko"
                    title="Neon Plinko"
                    description="Spawns physics-based balls bouncing down peg pyramids into huge bottom multipliers!"
                    badgeText="NEW"
                    badgeType="warning"
                    rtp="98.0%"
                    onClick={() => handleGameSelect('plinko')}
                  />
                  <GameCard
                    id="roulette"
                    title="Color Roulette"
                    description="Eased rotating color dial wheel. Place concurrent bets on Red, Black, or Green jackpot!"
                    badgeText="HOT"
                    badgeType="danger"
                    rtp="97.3%"
                    onClick={() => handleGameSelect('roulette')}
                  />
                </div>
              </div>
              
              <div style={styles.feedColumn}>
                <LiveBets />
              </div>
            </div>
          </div>
        );
      case 'crash':
        return (
          <Crash
            wallet={wallet}
            audio={audio}
            serverSeed={serverSeed}
            clientSeed={clientSeed}
            nonce={nonce}
            onIncrementNonce={handleIncrementNonce}
          />
        );
      case 'mines':
        return (
          <Mines
            wallet={wallet}
            audio={audio}
            serverSeed={serverSeed}
            clientSeed={clientSeed}
            nonce={nonce}
            onIncrementNonce={handleIncrementNonce}
          />
        );
      case 'plinko':
        return (
          <Plinko
            wallet={wallet}
            audio={audio}
            serverSeed={serverSeed}
            clientSeed={clientSeed}
            nonce={nonce}
            onIncrementNonce={handleIncrementNonce}
          />
        );
      case 'roulette':
        return (
          <Roulette
            wallet={wallet}
            audio={audio}
            serverSeed={serverSeed}
            clientSeed={clientSeed}
            nonce={nonce}
            onIncrementNonce={handleIncrementNonce}
          />
        );
      case 'verifier':
        return (
          <FairVerifier
            serverSeed={serverSeed}
            clientSeed={clientSeed}
            nonce={nonce}
            onRotateSeeds={handleRotateSeeds}
            playClick={audio.playClick}
          />
        );
      case 'history':
        return <WagerLogs wallet={wallet} />;
      default:
        return <div>Routing Error</div>;
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-deep)', minHeight: '100vh', width: '100vw' }}>
      <Layout
        wallet={wallet}
        audio={audio}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWallet={() => setIsWalletOpen(true)}
      >
        {renderTabContent()}
      </Layout>

      {/* Persistence Wallet & Claim Modal */}
      <WalletModal
        wallet={wallet}
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        playClick={audio.playClick}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  lobbyWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroBanner: {
    background: 'linear-gradient(135deg, rgba(20, 17, 42, 0.9) 0%, rgba(13, 10, 31, 0.9) 100%)',
    borderColor: 'var(--border-glow)',
    padding: '30px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroLeft: {
    maxWidth: '580px',
    zIndex: 2,
  },
  heroBadge: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
    display: 'inline-block',
    border: '1px solid rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.1)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  heroTitle: {
    fontSize: '2.2rem',
    fontWeight: 900,
    fontFamily: 'var(--font-display)',
    marginBottom: '10px',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    textShadow: '0 0 15px rgba(139,92,246,0.15)',
  },
  heroDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  heroRight: {
    fontSize: '7rem',
    fontWeight: 'bold',
    color: 'var(--primary)',
    opacity: 0.12,
    display: 'none',
    zIndex: 1,
    fontFamily: 'var(--font-display)',
    userSelect: 'none',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: 'var(--bg-surface)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: 'var(--radius-md)',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#fff',
    fontFamily: 'var(--font-display)',
    marginTop: '2px',
  },
  lobbyBodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
  },
  gamesColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.01em',
  },
  feedColumn: {
    width: '100%',
  },
};

// Insert responsive stylesheet for banner text sizes, columns split
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 640px) {
      div[style*="heroRight"] {
        display: block !important;
      }
    }
    @media (min-width: 1024px) {
      div[style*="lobbyBodyGrid"] {
        grid-template-columns: 1fr 340px !important;
      }
    }
    @media (max-width: 640px) {
      div[style*="metricsGrid"] {
        grid-template-columns: 1fr !important;
      }
      h2[style*="heroTitle"] {
        font-size: 1.6rem !important;
      }
    }
  `;
  document.head.appendChild(style);
}
export default App;
