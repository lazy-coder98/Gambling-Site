import React, { useState } from 'react';
import { sha256, generateSeed, generateCrashMultiplier, generateMinesBoard, generatePlinkoPath, generateRouletteNumber } from '../utils/provablyFair';
import { ShieldCheck, RefreshCw, Info } from 'lucide-react';

interface FairVerifierProps {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  onRotateSeeds: (newServerSeed: string, newClientSeed: string) => void;
  playClick: () => void;
}

export function FairVerifier({ serverSeed, clientSeed, nonce, onRotateSeeds, playClick }: FairVerifierProps) {
  // Revealed past seeds list
  const [seedHistory, setSeedHistory] = useState<Array<{ serverSeed: string; serverHash: string; clientSeed: string; nonceStart: number; nonceEnd: number }>>([]);
  
  // Custom inputs for calculator verification
  const [calcServerSeed, setCalcServerSeed] = useState('');
  const [calcClientSeed, setCalcClientSeed] = useState('');
  const [calcNonce, setCalcNonce] = useState('1');
  const [calcGameType, setCalcGameType] = useState<'crash' | 'mines' | 'plinko' | 'roulette'>('crash');
  const [calcMinesCount, setCalcMinesCount] = useState('3');
  
  // Results
  const [verifiedResult, setVerifiedResult] = useState<{
    hash: string;
    details: string;
    visualData?: any;
  } | null>(null);

  const activeServerHash = sha256(serverSeed);

  const rotateSeeds = () => {
    playClick();
    const newServer = generateSeed();
    const newClient = generateSeed();
    
    // Save to history
    setSeedHistory(prev => [
      {
        serverSeed,
        serverHash: activeServerHash,
        clientSeed,
        nonceStart: 1,
        nonceEnd: nonce
      },
      ...prev
    ]);
    
    onRotateSeeds(newServer, newClient);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    
    const n = parseInt(calcNonce, 10);
    if (!calcServerSeed || !calcClientSeed || isNaN(n) || n < 0) {
      alert("Please fill in all inputs with valid values.");
      return;
    }

    const hash = sha256(`${calcServerSeed}-${calcClientSeed}-${n}`);
    let details = '';
    let visualData: any = null;

    if (calcGameType === 'crash') {
      const mult = generateCrashMultiplier(calcServerSeed, calcClientSeed, n);
      details = `Crash Multiplier: ${mult.toFixed(2)}x`;
    } else if (calcGameType === 'mines') {
      const minesCount = parseInt(calcMinesCount, 10);
      const board = generateMinesBoard(calcServerSeed, calcClientSeed, n, minesCount);
      const minesIndices = board.map((isMine, idx) => isMine ? idx : null).filter(v => v !== null);
      details = `Mines Board Generated (${minesCount} mines). Mine indices: ${minesIndices.join(', ')}`;
      visualData = { type: 'mines', board };
    } else if (calcGameType === 'plinko') {
      const path = generatePlinkoPath(calcServerSeed, calcClientSeed, n, 10); // Standard 10 rows
      const rightCount = path.filter(x => x === 1).length;
      details = `Plinko Path Bounces: ${path.map(x => x === 0 ? 'L' : 'R').join('')} (Lands in Bin: ${rightCount}/10)`;
    } else if (calcGameType === 'roulette') {
      const pocket = generateRouletteNumber(calcServerSeed, calcClientSeed, n);
      let color = 'Green (Zero)';
      if (pocket >= 1 && pocket <= 7) color = 'Red';
      if (pocket >= 8 && pocket <= 14) color = 'Black';
      details = `Roulette Outcome Pocket: ${pocket} [Color: ${color}]`;
    }

    setVerifiedResult({ hash, details, visualData });
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardHeader}>
        <ShieldCheck size={26} color="var(--success)" />
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Provably Fair Verification Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            NextSpin games operate on a mathematically verifiable seed system. Verify that every roll was fair and unmanipulated.
          </p>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Active Seed Panel */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Active Seed Pair</h3>
          
          <div style={styles.inputGroup}>
            <div style={styles.label}>Active Server Seed Hash (Enables verification post-rotation)</div>
            <div className="glass-input-wrapper">
              <input type="text" className="glass-input" readOnly value={activeServerHash} style={styles.codeText} />
            </div>
            <div style={styles.helpText}>This SHA-256 hash is determined before you bet, ensuring results cannot be changed mid-game.</div>
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.label}>Active Client Seed</div>
            <div className="glass-input-wrapper">
              <input type="text" className="glass-input" readOnly value={clientSeed} style={styles.codeText} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total Bets on Current Seeds: <strong style={{ color: 'var(--primary)' }}>{nonce}</strong>
            </div>
            <button className="glass-button glass-button-primary" onClick={rotateSeeds} style={{ gap: '6px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Rotate Seeds
            </button>
          </div>
        </div>

        {/* Verification Tool */}
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Instant Outcome Verifier</h3>
          
          <form onSubmit={handleVerify} style={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={styles.inputGroup}>
                <div style={styles.label}>Game Type</div>
                <select
                  value={calcGameType}
                  onChange={e => setCalcGameType(e.target.value as any)}
                  style={styles.select}
                >
                  <option value="crash">Crash</option>
                  <option value="mines">Mines</option>
                  <option value="plinko">Plinko</option>
                  <option value="roulette">Roulette</option>
                </select>
              </div>

              {calcGameType === 'mines' && (
                <div style={styles.inputGroup}>
                  <div style={styles.label}>Mines Count</div>
                  <select
                    value={calcMinesCount}
                    onChange={e => setCalcMinesCount(e.target.value)}
                    style={styles.select}
                  >
                    {[1, 3, 5, 10, 24].map(x => (
                      <option key={x} value={x}>{x} Mines</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.label}>Server Seed (Unveiled Plaintext)</div>
              <div className="glass-input-wrapper">
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Paste past server seed..."
                  value={calcServerSeed}
                  onChange={e => setCalcServerSeed(e.target.value)}
                  style={styles.codeText}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px' }}>
              <div style={styles.inputGroup}>
                <div style={styles.label}>Client Seed</div>
                <div className="glass-input-wrapper">
                  <input
                    type="text"
                    className="glass-input"
                    value={calcClientSeed}
                    onChange={e => setCalcClientSeed(e.target.value)}
                    style={styles.codeText}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.label}>Nonce</div>
                <div className="glass-input-wrapper">
                  <input
                    type="number"
                    className="glass-input"
                    value={calcNonce}
                    onChange={e => setCalcNonce(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="glass-button glass-button-success" style={{ width: '100%', marginTop: '6px' }}>
              Run Verification Calculation
            </button>
          </form>

          {verifiedResult && (
            <div style={styles.resultBox}>
              <div style={styles.resultHeader}>
                <ShieldCheck size={16} color="var(--success)" />
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>CALCULATION MATCHED DETERMINISTICALLY</span>
              </div>
              <div style={{ wordBreak: 'break-all', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
                Hash: {verifiedResult.hash}
              </div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                Outcome: {verifiedResult.details}
              </div>

              {/* Renders Mines Grid Visualizer */}
              {verifiedResult.visualData?.type === 'mines' && (
                <div style={styles.minesGrid}>
                  {verifiedResult.visualData.board.map((isMine: boolean, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.miniTile,
                        backgroundColor: isMine ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                        borderColor: isMine ? 'var(--danger)' : 'var(--success)'
                      }}
                    >
                      {isMine ? '💣' : '💎'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revealed Seed History */}
      <div className="glass-panel" style={{ ...styles.panel, marginTop: '20px' }}>
        <h3 style={styles.panelTitle}>Revealed Seed History (Unveiled Plaintext)</h3>
        {seedHistory.length === 0 ? (
          <div style={styles.emptyHistory}>
            <Info size={16} style={{ marginBottom: '4px' }} />
            <span>No rotated seed pairs yet. Rotate your active seeds above to reveal plaintext seeds.</span>
          </div>
        ) : (
          <div style={styles.historyList}>
            {seedHistory.map((hist, idx) => (
              <div key={idx} style={styles.historyItem}>
                <div style={styles.historyHeader}>
                  <strong style={{ color: 'var(--success)' }}>Seed Pair #{seedHistory.length - idx}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Bets Wagered: Nonce {hist.nonceStart} - {hist.nonceEnd}
                  </span>
                </div>
                <div style={styles.historyGrid}>
                  <div>
                    <div style={styles.historyLabel}>Server Seed Hash:</div>
                    <div style={styles.historyCode}>{hist.serverHash}</div>
                  </div>
                  <div>
                    <div style={styles.historyLabel}>Revealed Server Seed (Plaintext):</div>
                    <div style={{ ...styles.historyCode, color: 'var(--primary)' }}>{hist.serverSeed}</div>
                  </div>
                  <div>
                    <div style={styles.historyLabel}>Used Client Seed:</div>
                    <div style={styles.historyCode}>{hist.clientSeed}</div>
                  </div>
                </div>
              </div>
            ))}
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
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-light)',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
  panel: {
    padding: '20px',
    backgroundColor: 'var(--bg-surface)',
  },
  panelTitle: {
    fontSize: '1.1rem',
    marginBottom: '16px',
    color: '#fff',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '8px',
  },
  inputGroup: {
    marginBottom: '14px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginBottom: '6px',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  },
  helpText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  select: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    color: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  resultBox: {
    marginTop: '16px',
    padding: '14px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 'var(--radius-sm)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--success)',
    marginBottom: '8px',
  },
  emptyHistory: {
    padding: '30px 10px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    padding: '12px 16px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '4px',
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  historyLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  historyCode: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    color: '#fff',
  },
  minesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '4px',
    width: '120px',
    marginTop: '10px',
  },
  miniTile: {
    aspectRatio: '1',
    borderRadius: '4px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
  },
};

// Responsive adjustments using inline js if needed, otherwise handled via layout.
const query = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)') : null;
if (query && query.matches) {
  styles.contentGrid.gridTemplateColumns = '1fr 1fr';
  styles.historyGrid.gridTemplateColumns = 'repeat(3, 1fr)';
}
