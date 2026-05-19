import React, { useState } from 'react';
import type { WalletSystem } from '../hooks/useWallet';
import { TOKENS } from '../hooks/useWallet';
import type { AudioSystem } from '../hooks/useAudio';
import { 
  Menu, X, ShieldCheck, Wallet, Volume2, VolumeX, 
  Gamepad2, History, Award, Layers, Zap, Star
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  wallet: WalletSystem;
  audio: AudioSystem;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWallet: () => void;
}

export function Layout({ children, wallet, audio, activeTab, setActiveTab, onOpenWallet }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const activeConf = TOKENS[wallet.activeToken];

  const handleNavClick = (tabId: string) => {
    audio.playClick();
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const navItems = [
    { id: 'lobby', label: 'Games Lobby', icon: <Gamepad2 size={18} /> },
    { id: 'crash', label: 'Crash Rocket', icon: <Zap size={18} color="var(--primary)" />, isGame: true },
    { id: 'mines', label: 'Mines Sweeper', icon: <Layers size={18} color="var(--success)" />, isGame: true },
    { id: 'plinko', label: 'Plinko Drop', icon: <Star size={18} color="var(--accent)" />, isGame: true },
    { id: 'roulette', label: 'Color Roulette', icon: <Award size={18} color="var(--warning)" />, isGame: true },
    { id: 'verifier', label: 'Provably Fair', icon: <ShieldCheck size={18} /> },
    { id: 'history', label: 'Wager Logs', icon: <History size={18} /> },
  ];

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.menuToggle} onClick={() => { audio.playClick(); setSidebarOpen(!sidebarOpen); }}>
            <Menu size={22} />
          </button>
          
          <div style={styles.logo} onClick={() => handleNavClick('lobby')}>
            <span style={styles.logoBadge}>✦</span>
            <h1 style={styles.logoText}>NEXT<span>SPIN</span></h1>
            <span style={styles.byAuthor}>by Mohit Verma</span>
          </div>
        </div>

        {/* HEADER CONTROLS */}
        <div style={styles.headerRight}>
          {/* Sound Toggle */}
          <button style={styles.iconBtn} onClick={audio.toggleMute} title={audio.muted ? "Unmute sound FX" : "Mute sound FX"}>
            {audio.muted ? <VolumeX size={18} color="var(--text-muted)" /> : <Volume2 size={18} color="var(--success)" />}
          </button>

          {/* Wallet Balance Widget */}
          <button className="glass-button glass-button-primary" style={styles.walletBtn} onClick={onOpenWallet}>
            <Wallet size={16} />
            <span style={styles.walletSymbol}>{activeConf.icon}</span>
            <span style={styles.walletAmt}>
              {wallet.balances[wallet.activeToken].toLocaleString(undefined, { 
                minimumFractionDigits: activeConf.decimals === 0 ? 0 : 2,
                maximumFractionDigits: activeConf.decimals 
              })}
            </span>
            <span style={styles.walletCode}>{wallet.activeToken}</span>
          </button>

          <button className="glass-button glass-button-success" style={styles.faucetQuickBtn} onClick={onOpenWallet}>
            FAUCET
          </button>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <div style={styles.mainContainer}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          className="glass-panel"
          style={{
            ...styles.sidebar,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div style={styles.sidebarHeader}>
            <div style={styles.logoSmall}>
              <span style={styles.logoBadge}>✦</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>NEXTSPIN</span>
              <span style={styles.byAuthor}>by Mohit Verma</span>
            </div>
            <button style={styles.closeSidebarBtn} onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div style={styles.navGroup}>
            <div style={styles.navLabel}>Navigation</div>
            {navItems.filter(x => !x.isGame).map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                  }}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={styles.navGroup}>
            <div style={styles.navLabel}>Interactive Games</div>
            {navItems.filter(x => x.isGame).map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  style={{
                    ...styles.navItem,
                    backgroundColor: active ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                  }}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={styles.sidebarFooter}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>100% Provably Fair Node</span>
            </div>
          </div>
        </aside>

        {/* PAGE CONTENT CONTAINER */}
        <main style={styles.content}>
          <div style={styles.contentInner}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100vw',
  },
  header: {
    height: '68px',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderRadius: '0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  menuToggle: {
    cursor: 'pointer',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoBadge: {
    color: 'var(--primary)',
    fontWeight: 'bold',
    fontSize: '1.4rem',
    textShadow: '0 0 10px var(--primary-glow)',
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
  },
  byAuthor: {
    fontSize: '0.6rem',
    color: 'var(--text-muted)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginLeft: '6px',
    marginTop: '4px',
    whiteSpace: 'nowrap',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-light)',
    cursor: 'pointer',
    transition: '0.2s',
  },
  walletBtn: {
    height: '38px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    borderRadius: 'var(--radius-sm)',
  },
  walletSymbol: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
  },
  walletAmt: {
    fontWeight: 800,
    color: '#fff',
  },
  walletCode: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 600,
  },
  faucetQuickBtn: {
    height: '38px',
    fontSize: '0.8rem',
    fontWeight: 700,
    padding: '0 12px',
    display: 'none',
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
    position: 'relative',
    height: 'calc(100vh - 68px)',
  },
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    borderRadius: '0',
    transition: 'transform var(--transition-normal)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  logoSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  closeSidebarBtn: {
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  navGroup: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    paddingLeft: '10px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: '0.2s',
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid var(--border-light)',
    paddingTop: '14px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'rgba(9, 7, 20, 0.1)',
    position: 'relative',
  },
  contentInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px',
  },
};

// Setup document styles for hover logo span, header transitions, responsive media queries
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    h1[style*="font-family"] span {
      color: var(--primary) !important;
      text-shadow: 0 0 10px var(--primary-glow);
    }
    
    @media (min-width: 640px) {
      button[style*="display: none"] {
        display: inline-flex !important;
      }
    }

    @media (min-width: 1024px) {
      aside[style*="transform: translateX(-100%)"] {
        transform: translateX(0) !important;
        position: relative !important;
      }
      button[style*="width: 36px"] {
        display: none !important;
      }
      div[style*="height: calc(100vh - 68px)"] main[style*="overflow-y: auto"] {
        padding-left: 0;
      }
      button[style*="closeSidebarBtn"] {
        display: none !important;
      }
      div[style*="sidebarHeader"] {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}
export default Layout;
