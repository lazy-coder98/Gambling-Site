import React, { useState, useEffect } from 'react';
import type { WalletSystem, TokenType } from '../hooks/useWallet';
import { TOKENS } from '../hooks/useWallet';
import { X, Copy, Check, Info, ArrowUpRight, ArrowDownLeft, Gift, Zap } from 'lucide-react';

interface WalletModalProps {
  wallet: WalletSystem;
  isOpen: boolean;
  onClose: () => void;
  playClick: () => void;
}

export function WalletModal({ wallet, isOpen, onClose, playClick }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'faucet'>('deposit');
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [depositLogs, setDepositLogs] = useState<string[]>([]);
  const [isDepositing, setIsDepositing] = useState(false);
  const [faucetCooldown, setFaucetCooldown] = useState(0);

  const activeConf = TOKENS[wallet.activeToken];

  // Faucet timer logic
  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const cooldown = 60 * 1000;
      const remaining = wallet.lastFaucetClaim + cooldown - now;
      if (remaining > 0) {
        setFaucetCooldown(Math.ceil(remaining / 1000));
      } else {
        setFaucetCooldown(0);
      }
    };
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [wallet.lastFaucetClaim]);

  if (!isOpen) return null;

  const copyAddress = () => {
    playClick();
    navigator.clipboard.writeText(`0xSpinCasino${wallet.activeToken}AddressMockDepositOnly`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerMockDeposit = () => {
    if (isDepositing) return;
    playClick();
    setIsDepositing(true);
    setDepositLogs(['Initializing mock validator node...', 'Listening on blockchain ledger...']);
    
    setTimeout(() => {
      setDepositLogs(prev => [...prev, 'Incoming deposit detected! Block: #4810294']);
    }, 1000);

    setTimeout(() => {
      setDepositLogs(prev => [...prev, 'Confirmations: 1/3 (Validating transaction signature...)']);
    }, 2000);

    setTimeout(() => {
      setDepositLogs(prev => [...prev, 'Confirmations: 3/3 (Block finalized!)']);
    }, 3500);

    setTimeout(() => {
      const depositAmounts: Record<TokenType, number> = {
        BTC: 0.01,
        ETH: 0.25,
        USDT: 500,
        GOLD: 10000
      };
      const amount = depositAmounts[wallet.activeToken];
      wallet.deposit(wallet.activeToken, amount);
      setDepositLogs(prev => [...prev, `Successfully credited +${amount} ${wallet.activeToken}!`]);
      setIsDepositing(false);
    }, 4500);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAddress) {
      setWithdrawStatus({ type: 'error', message: 'Please enter a destination address.' });
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setWithdrawStatus({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }
    if (wallet.balances[wallet.activeToken] < amt) {
      setWithdrawStatus({ type: 'error', message: 'Insufficient balance.' });
      return;
    }

    const success = wallet.withdraw(wallet.activeToken, amt);
    if (success) {
      setWithdrawStatus({ type: 'success', message: `Withdrawal of ${amt} ${wallet.activeToken} submitted successfully!` });
      setWithdrawAmount('');
      setWithdrawAddress('');
      setTimeout(() => setWithdrawStatus({ type: 'idle', message: '' }), 5000);
    } else {
      setWithdrawStatus({ type: 'error', message: 'Withdrawal failed.' });
    }
  };

  const handleFaucet = () => {
    playClick();
    const res = wallet.claimFaucet();
    if (res.success) {
      setWithdrawStatus({ type: 'success', message: res.message });
      setTimeout(() => setWithdrawStatus({ type: 'idle', message: '' }), 4000);
    } else {
      setWithdrawStatus({ type: 'error', message: res.message });
      setTimeout(() => setWithdrawStatus({ type: 'idle', message: '' }), 4000);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Zap size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem' }}>Casino Cashier</h2>
          </div>
          <button style={styles.closeBtn} onClick={() => { playClick(); onClose(); }}>
            <X size={20} />
          </button>
        </div>

        {/* Token Selector Grid */}
        <div style={styles.tokenGrid}>
          {(Object.keys(TOKENS) as TokenType[]).map(tokenKey => {
            const token = TOKENS[tokenKey];
            const isSelected = wallet.activeToken === tokenKey;
            return (
              <button
                key={tokenKey}
                style={{
                  ...styles.tokenCard,
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                }}
                onClick={() => { playClick(); wallet.setActiveToken(tokenKey); }}
              >
                <span style={styles.tokenIcon}>{token.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={styles.tokenSymbol}>{token.symbol}</div>
                  <div style={styles.tokenBalance}>
                    {wallet.balances[tokenKey].toLocaleString(undefined, { maximumFractionDigits: token.decimals })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabButton, borderBottomColor: activeTab === 'deposit' ? 'var(--primary)' : 'transparent', color: activeTab === 'deposit' ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => { playClick(); setActiveTab('deposit'); }}
          >
            <ArrowDownLeft size={16} /> Deposit
          </button>
          <button
            style={{ ...styles.tabButton, borderBottomColor: activeTab === 'withdraw' ? 'var(--primary)' : 'transparent', color: activeTab === 'withdraw' ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => { playClick(); setActiveTab('withdraw'); }}
          >
            <ArrowUpRight size={16} /> Withdraw
          </button>
          <button
            style={{ ...styles.tabButton, borderBottomColor: activeTab === 'faucet' ? 'var(--primary)' : 'transparent', color: activeTab === 'faucet' ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => { playClick(); setActiveTab('faucet'); }}
          >
            <Gift size={16} /> Faucet
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'deposit' && (
            <div style={styles.depositSection}>
              <div style={styles.infoAlert}>
                <Info size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  This is a **simulated cryptocurrency casino**. Do not send actual funds. Click the simulated miner button below to trigger fake incoming ledger blocks!
                </span>
              </div>
              <div style={styles.depositDetails}>
                {/* Simulated SVG QR Code */}
                <div style={styles.qrWrapper}>
                  <svg width="120" height="120" viewBox="0 0 100 100" style={{ display: 'block' }}>
                    <rect width="100" height="100" fill="#fff" rx="4" />
                    {/* Corners */}
                    <rect x="5" y="5" width="25" height="25" fill="var(--bg-deep)" />
                    <rect x="7" y="7" width="21" height="21" fill="#fff" />
                    <rect x="11" y="11" width="13" height="13" fill="var(--bg-deep)" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="var(--bg-deep)" />
                    <rect x="72" y="7" width="21" height="21" fill="#fff" />
                    <rect x="76" y="11" width="13" height="13" fill="var(--bg-deep)" />
                    
                    <rect x="5" y="70" width="25" height="25" fill="var(--bg-deep)" />
                    <rect x="7" y="72" width="21" height="21" fill="#fff" />
                    <rect x="11" y="76" width="13" height="13" fill="var(--bg-deep)" />

                    {/* Random center dots to simulate a QR */}
                    <rect x="40" y="10" width="8" height="8" fill="var(--bg-deep)" />
                    <rect x="52" y="15" width="10" height="6" fill="var(--bg-deep)" />
                    <rect x="35" y="30" width="14" height="10" fill="var(--bg-deep)" />
                    <rect x="55" y="35" width="8" height="12" fill="var(--bg-deep)" />
                    <rect x="10" y="45" width="12" height="8" fill="var(--bg-deep)" />
                    <rect x="25" y="50" width="10" height="12" fill="var(--bg-deep)" />
                    <rect x="45" y="55" width="15" height="6" fill="var(--bg-deep)" />
                    <rect x="70" y="45" width="18" height="12" fill="var(--bg-deep)" />
                    <rect x="75" y="65" width="8" height="15" fill="var(--bg-deep)" />
                    <rect x="35" y="75" width="20" height="12" fill="var(--bg-deep)" />
                    <rect x="15" y="60" width="6" height="6" fill="var(--bg-deep)" />
                  </svg>
                </div>

                <div style={{ flex: 1, width: '100%' }}>
                  <div style={styles.inputLabel}>Your Mock {activeConf.name} ({activeConf.symbol}) Address</div>
                  <div className="glass-input-wrapper" style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="glass-input"
                      value={`0xSpinCasino${activeConf.symbol}AddressMockDepositOnly`}
                      readOnly
                      style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                    />
                    <button onClick={copyAddress} style={styles.copyBtn}>
                      {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <button
                    className="glass-button glass-button-primary"
                    style={{ width: '100%' }}
                    onClick={triggerMockDeposit}
                    disabled={isDepositing}
                  >
                    {isDepositing ? 'Mining block confirmations...' : `Trigger Mock Deposit (+${activeConf.symbol === 'GOLD' ? '10k' : activeConf.symbol === 'USDT' ? '500' : '0.25'} ${activeConf.symbol})`}
                  </button>
                </div>
              </div>

              {depositLogs.length > 0 && (
                <div style={styles.logsConsole}>
                  <div style={styles.logsTitle}>Validator Node Logs:</div>
                  {depositLogs.map((log, idx) => (
                    <div key={idx} style={{ ...styles.logLine, color: idx === depositLogs.length - 1 ? 'var(--success)' : '#fff' }}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdraw} style={styles.withdrawSection}>
              <div style={styles.infoAlert}>
                <Info size={16} color="var(--warning)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Enter any mock external wallet destination address. Real gas is simulated but transactions complete instantly.
                </span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={styles.inputLabel}>Recipient Address</div>
                <div className="glass-input-wrapper">
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Enter destination address..."
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ ...styles.inputLabel, display: 'flex', justifyContent: 'between', width: '100%' }}>
                  <span>Withdraw Amount</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                    Max: {wallet.balances[wallet.activeToken].toLocaleString(undefined, { maximumFractionDigits: activeConf.decimals })} {wallet.activeToken}
                  </span>
                </div>
                <div className="glass-input-wrapper">
                  <input
                    type="number"
                    className="glass-input"
                    step="any"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                  <button
                    type="button"
                    style={styles.maxBtn}
                    onClick={() => { playClick(); setWithdrawAmount(wallet.balances[wallet.activeToken].toString()); }}
                  >
                    MAX
                  </button>
                </div>
                <div style={styles.gasFee}>
                  Gas Fee Estimate: <span style={{ color: '#fff' }}>0.001 ETH (Free in Demo Mode)</span>
                </div>
              </div>

              {withdrawStatus.message && (
                <div
                  style={{
                    ...styles.statusBox,
                    background: withdrawStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: withdrawStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    color: withdrawStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {withdrawStatus.message}
                </div>
              )}

              <button type="submit" className="glass-button glass-button-danger" style={{ width: '100%', marginTop: '8px' }}>
                Submit Withdrawal
              </button>
            </form>
          )}

          {activeTab === 'faucet' && (
            <div style={styles.faucetSection}>
              <div style={styles.faucetIcon}>🎁</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', textAlign: 'center' }}>Faucet Claim Station</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '20px', maxWidth: '380px' }}>
                Need more test credits? Instantly claim standard test allocations of your active coin:
                <br />
                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', display: 'inline-block', marginTop: '6px' }}>
                  +{activeConf.faucetAmount} {activeConf.symbol}
                </span>
              </p>

              {withdrawStatus.message && activeTab === 'faucet' && (
                <div
                  style={{
                    ...styles.statusBox,
                    background: withdrawStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: withdrawStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    color: withdrawStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    width: '100%',
                    marginBottom: '12px'
                  }}
                >
                  {withdrawStatus.message}
                </div>
              )}

              <button
                className="glass-button glass-button-success"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                onClick={handleFaucet}
                disabled={faucetCooldown > 0}
              >
                {faucetCooldown > 0 ? `Faucet Cooldown (${faucetCooldown}s)` : 'Claim Tokens Now!'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 3, 15, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: 'var(--bg-surface)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    maxHeight: '90vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closeBtn: {
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: '0.2s',
  },
  tokenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  tokenCard: {
    border: '1px solid',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: '0.2s',
  },
  tokenIcon: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenSymbol: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  tokenBalance: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#fff',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border-light)',
    marginBottom: '16px',
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderBottom: '2px solid',
    cursor: 'pointer',
    transition: '0.2s',
  },
  tabContent: {
    minHeight: '220px',
  },
  depositSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoAlert: {
    display: 'flex',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    border: '1px dashed rgba(139, 92, 246, 0.2)',
    borderRadius: 'var(--radius-sm)',
    alignItems: 'center',
  },
  depositDetails: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  qrWrapper: {
    padding: '8px',
    background: '#fff',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: '6px',
    letterSpacing: '0.05em',
  },
  copyBtn: {
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
  },
  logsConsole: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    background: 'rgba(0,0,0,0.5)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    height: '110px',
    overflowY: 'auto',
  },
  logsTitle: {
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  logLine: {
    lineHeight: '1.4',
  },
  withdrawSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  maxBtn: {
    color: 'var(--primary)',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 'var(--radius-xs)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  gasFee: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  statusBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '16px',
  },
  faucetSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 0',
  },
  faucetIcon: {
    fontSize: '3rem',
    marginBottom: '10px',
    filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))',
  },
};
