import React from 'react';
import type { WalletSystem } from '../hooks/useWallet';
import { TOKENS } from '../hooks/useWallet';
import { History, ArrowUpRight, ArrowDownLeft, Gift, ShieldAlert } from 'lucide-react';

interface WagerLogsProps {
  wallet: WalletSystem;
}

export function WagerLogs({ wallet }: WagerLogsProps) {
  const logs = wallet.transactions;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={16} color="var(--success)" />;
      case 'withdraw': return <ArrowUpRight size={16} color="var(--danger)" />;
      case 'faucet': return <Gift size={16} color="var(--primary)" />;
      default: return <History size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <History size={24} color="var(--primary)" />
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Account Transaction &amp; Wager Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Inspect history of deposits, faucet claims, game bets, and secured win multipliers.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={styles.panel}>
        {logs.length === 0 ? (
          <div style={styles.emptyState}>
            <ShieldAlert size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>Ledger history is empty</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger some wagers or deposit free test tokens to populate lists!</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Token</th>
                  <th style={styles.th}>Wager / Transfer</th>
                  <th style={styles.th}>Date &amp; Time</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const conf = TOKENS[log.token];
                  const isPositive = log.amount > 0;
                  
                  return (
                    <tr key={log.id} style={styles.tbodyRow}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                          {renderIcon(log.type)}
                          <span style={{ textTransform: 'capitalize' }}>
                            {log.type.replace('game_', '')}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={styles.tokenDot}>{conf.icon}</span>
                          <strong>{log.token}</strong>
                        </div>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 800, color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                        {isPositive ? '+' : ''}
                        {log.amount.toLocaleString(undefined, { maximumFractionDigits: conf.decimals })}
                      </td>
                      <td style={{ ...styles.td, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-light)',
  },
  panel: {
    backgroundColor: 'var(--bg-surface)',
    padding: '20px',
    overflow: 'hidden',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 10px',
    textAlign: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  theadRow: {
    borderBottom: '1.5px solid var(--border-light)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tbodyRow: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '14px 16px',
    fontSize: '0.85rem',
    color: '#fff',
  },
  tokenDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
};
export default WagerLogs;
