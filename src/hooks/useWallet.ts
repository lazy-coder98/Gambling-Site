import { useState, useEffect } from 'react';

export type TokenType = 'BTC' | 'ETH' | 'USDT' | 'GOLD';

export interface TokenConfig {
  symbol: TokenType;
  name: string;
  decimals: number;
  initialBalance: number;
  icon: string;
  faucetAmount: number;
}

export const TOKENS: Record<TokenType, TokenConfig> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', decimals: 6, initialBalance: 0.085, icon: '₿', faucetAmount: 0.005 },
  ETH: { symbol: 'ETH', name: 'Ethereum', decimals: 4, initialBalance: 1.5, icon: 'Ξ', faucetAmount: 0.1 },
  USDT: { symbol: 'USDT', name: 'Tether', decimals: 2, initialBalance: 1000.0, icon: '₮', faucetAmount: 250.0 },
  GOLD: { symbol: 'GOLD', name: 'Spin Gold', decimals: 0, initialBalance: 25000, icon: '✦', faucetAmount: 5000 },
};

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'faucet' | 'game_bet' | 'game_win';
  token: TokenType;
  amount: number;
  timestamp: number;
  description: string;
}

export function useWallet() {
  const [balances, setBalances] = useState<Record<TokenType, number>>(() => {
    const saved = localStorage.getItem('casino_balances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      BTC: TOKENS.BTC.initialBalance,
      ETH: TOKENS.ETH.initialBalance,
      USDT: TOKENS.USDT.initialBalance,
      GOLD: TOKENS.GOLD.initialBalance,
    };
  });

  const [activeToken, setActiveToken] = useState<TokenType>(() => {
    const saved = localStorage.getItem('casino_active_token');
    return (saved as TokenType) || 'USDT';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('casino_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [lastFaucetClaim, setLastFaucetClaim] = useState<number>(() => {
    const saved = localStorage.getItem('casino_last_faucet');
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('casino_balances', JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem('casino_active_token', activeToken);
  }, [activeToken]);

  useEffect(() => {
    localStorage.setItem('casino_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('casino_last_faucet', lastFaucetClaim.toString());
  }, [lastFaucetClaim]);

  const addTransaction = (
    type: Transaction['type'],
    token: TokenType,
    amount: number,
    description: string
  ) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      token,
      amount,
      timestamp: Date.now(),
      description,
    };
    setTransactions(prev => [newTx, ...prev].slice(0, 50)); // Limit to last 50
  };

  const deduct = (amount: number, description: string): boolean => {
    if (amount <= 0) return false;
    if (balances[activeToken] < amount) return false;

    setBalances(prev => ({
      ...prev,
      [activeToken]: Math.max(0, prev[activeToken] - amount),
    }));
    addTransaction('game_bet', activeToken, -amount, description);
    return true;
  };

  const credit = (amount: number, description: string) => {
    if (amount <= 0) return;
    setBalances(prev => ({
      ...prev,
      [activeToken]: prev[activeToken] + amount,
    }));
    addTransaction('game_win', activeToken, amount, description);
  };

  const deposit = (token: TokenType, amount: number) => {
    if (amount <= 0) return;
    setBalances(prev => ({
      ...prev,
      [token]: prev[token] + amount,
    }));
    addTransaction('deposit', token, amount, `Mock Deposit Verified`);
  };

  const withdraw = (token: TokenType, amount: number): boolean => {
    if (amount <= 0) return false;
    if (balances[token] < amount) return false;

    setBalances(prev => ({
      ...prev,
      [token]: Math.max(0, prev[token] - amount),
    }));
    addTransaction('withdraw', token, -amount, `Mock Withdrawal Confirmed`);
    return true;
  };

  const claimFaucet = (): { success: boolean; message: string; amount?: number } => {
    const now = Date.now();
    const cooldown = 60 * 1000; // 1-minute faucet cooldown for instant developer testing ease
    const timeRemaining = lastFaucetClaim + cooldown - now;

    if (timeRemaining > 0) {
      const sec = Math.ceil(timeRemaining / 1000);
      return { success: false, message: `Please wait ${sec} seconds before claiming again.` };
    }

    const faucetAmount = TOKENS[activeToken].faucetAmount;
    setBalances(prev => ({
      ...prev,
      [activeToken]: prev[activeToken] + faucetAmount,
    }));
    setLastFaucetClaim(now);
    addTransaction('faucet', activeToken, faucetAmount, `Faucet Claimed`);

    return { success: true, message: `Successfully claimed ${faucetAmount} ${activeToken}!`, amount: faucetAmount };
  };

  return {
    balances,
    activeToken,
    setActiveToken,
    transactions,
    deduct,
    credit,
    deposit,
    withdraw,
    claimFaucet,
    lastFaucetClaim
  };
}

export type WalletSystem = ReturnType<typeof useWallet>;
