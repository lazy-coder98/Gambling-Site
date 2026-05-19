import React, { useState, useEffect } from 'react';
import { TOKENS } from '../hooks/useWallet';
import type { TokenType } from '../hooks/useWallet';

interface BetLog {
  id: string;
  username: string;
  game: string;
  token: TokenType;
  amount: number;
  multiplier: number;
  profit: number;
  timestamp: number;
}

const USERNAME_POOL = [
  'DegenPro', 'Satoshi_99', 'BullRun2026', 'MoonBoy', 'WhaleRider', 
  'GigaChad', 'SolMaxi', 'BitcoinBillionaire', 'EtherDreamer', 'RiskTaker',
  'DiamondHands', 'PaperFists', 'AlphaWolf', 'CryptoKing', 'CasinoKid', 
  'HODL_boss', 'YOLOer', 'OptionSeller', 'MarginGod', 'Liquidated99'
];

const GAME_POOL = ['Crash', 'Mines', 'Plinko', 'Roulette'];

export function LiveBets() {
  const [bets, setBets] = useState<BetLog[]>([]);

  useEffect(() => {
    // Generate initial set of 8 random bets
    const initialBets: BetLog[] = Array.from({ length: 8 }, (_, idx) => generateRandomBet(idx.toString()));
    setBets(initialBets);

    // Keep adding new bets on an interval
    const interval = setInterval(() => {
      const newBet = generateRandomBet(Math.random().toString());
      setBets(prev => [newBet, ...prev].slice(0, 15)); // Limit list to latest 15 wagers
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const generateRandomBet = (id: string): BetLog => {
    const username = USERNAME_POOL[Math.floor(Math.random() * USERNAME_POOL.length)];
    const game = GAME_POOL[Math.floor(Math.random() * GAME_POOL.length)];
    
    // Choose token weighting
    const tokens: TokenType[] = ['USDT', 'GOLD', 'ETH', 'BTC'];
    const weights = [0.5, 0.3, 0.15, 0.05];
    let r = Math.random();
    let token: TokenType = 'USDT';
    for (let i = 0; i < tokens.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        token = tokens[i];
        break;
      }
    }

    // Bet size
    let amount = 0;
    if (token === 'BTC') amount = Number((0.0001 + Math.random() * 0.005).toFixed(5));
    else if (token === 'ETH') amount = Number((0.001 + Math.random() * 0.1).toFixed(4));
    else if (token === 'USDT') amount = Number((1 + Math.random() * 200).toFixed(2));
    else amount = Math.floor(100 + Math.random() * 2000);

    // Win outcome
    const winChance = game === 'Crash' ? 0.65 : game === 'Mines' ? 0.45 : game === 'Plinko' ? 0.70 : 0.48;
    const isWin = Math.random() < winChance;
    
    let multiplier = 0;
    if (isWin) {
      if (game === 'Crash') multiplier = Number((1.05 + Math.random() * 4).toFixed(2));
      else if (game === 'Mines') multiplier = Number((1.2 + Math.random() * 3).toFixed(2));
      else if (game === 'Plinko') {
        const plinkoMults = [0.5, 1, 1.5, 2, 5, 10];
        multiplier = plinkoMults[Math.floor(Math.random() * plinkoMults.length)];
      } else { // Roulette
        multiplier = Math.random() < 0.9 ? 2 : 14; // Red/Black vs Green
      }
    } else {
      if (game === 'Plinko') multiplier = 0.2; // Plinko usually returns some small fraction
      else multiplier = 0;
    }

    const profit = multiplier > 0 ? (amount * multiplier) - amount : -amount;

    return {
      id,
      username: username.substring(0, 3) + '***' + username.substring(username.length - 2),
      game,
      token,
      amount,
      multiplier,
      profit,
      timestamp: Date.now()
    };
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.liveIndicator}></span>
        <h3 style={styles.title}>Live Network Bets</h3>
        <span style={styles.usersCount}>⚡ 2,481 Online</span>
      </div>

      <div style={styles.tableHeader}>
        <div style={{ flex: '1.2' }}>Game</div>
        <div style={{ flex: '1.5' }}>Player</div>
        <div style={{ flex: '1.5', textAlign: 'right' }}>Bet Amount</div>
        <div style={{ flex: '1', textAlign: 'right' }}>Mult</div>
        <div style={{ flex: '1.5', textAlign: 'right' }}>Payout</div>
      </div>

      <div style={styles.list}>
        {bets.map(bet => {
          const isLoss = bet.multiplier < 1;
          const conf = TOKENS[bet.token];
          return (
            <div key={bet.id} style={styles.row}>
              <div style={{ flex: '1.2', fontWeight: 600, color: '#fff', fontSize: '0.8rem' }}>
                {bet.game}
              </div>
              <div style={{ flex: '1.5', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                {bet.username}
              </div>
              <div style={{ flex: '1.5', textAlign: 'right', fontSize: '0.78rem' }}>
                <span style={{ marginRight: '3px' }}>{conf.icon}</span>
                {bet.amount.toLocaleString(undefined, { maximumFractionDigits: conf.decimals })}
              </div>
              <div style={{
                flex: '1',
                textAlign: 'right',
                fontWeight: 700,
                fontSize: '0.78rem',
                color: isLoss ? 'var(--text-muted)' : 'var(--success)'
              }}>
                {bet.multiplier > 0 ? `${bet.multiplier.toFixed(2)}x` : '-'}
              </div>
              <div style={{
                flex: '1.5',
                textAlign: 'right',
                fontWeight: 700,
                fontSize: '0.78rem',
                color: bet.profit > 0 ? 'var(--success)' : 'var(--danger)'
              }}>
                {bet.profit > 0 ? '+' : ''}
                {bet.profit.toLocaleString(undefined, { maximumFractionDigits: conf.decimals })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '400px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '8px',
  },
  liveIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 10px var(--success-glow)',
    display: 'inline-block',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#fff',
    flex: 1,
  },
  usersCount: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  tableHeader: {
    display: 'flex',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-light)',
    marginBottom: '6px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflowY: 'auto',
    flex: 1,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    transition: 'background 0.2s',
  },
};
export default LiveBets;
