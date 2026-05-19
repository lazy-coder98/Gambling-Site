/**
 * Provably Fair Hashing and Outcome Translators
 */

// Pure JavaScript synchronous SHA-256 implementation
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const lengthProperty = 'length';
  let i, j; // Used as a temporary index.

  let result = '';
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let asciiBitCount = asciiLength * 8;
  words[asciiBitCount >>> 5] |= 0x80 << (24 - (asciiBitCount & 31));
  words[(((asciiBitCount + 64) >>> 9) << 4) + 15] = asciiBitCount;

  for (i = 0; i < asciiLength; i++) {
    words[i >>> 2] |= ascii.charCodeAt(i) << (24 - (i & 3) * 8);
  }

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] || 0;
      } else {
        const s0: number = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1: number = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >>> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

// Generate random cryptographic seed
export function generateSeed(): string {
  const chars = 'abcdef0123456789';
  let seed = '';
  for (let i = 0; i < 64; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)];
  }
  return seed;
}

/**
 * Game outcome generators based on Server Seed, Client Seed, and Nonce
 */

// 1. Crash Multiplier Generator
// House edge: 3%. A 1/33 chance of instant crash at 1.00x.
export function generateCrashMultiplier(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = sha256(`${serverSeed}-${clientSeed}-${nonce}`);
  
  // Take first 8 characters (32 bits) of the hash to create a value
  const value = parseInt(hash.substring(0, 8), 16);
  
  // 1 in 33 chance of instant crash (3.03% house edge)
  if (value % 33 === 0) {
    return 1.00;
  }
  
  // Scale the value mathematically
  const max = Math.pow(2, 32);
  const multiplier = (max * 0.98) / (max - value);
  
  // Round to 2 decimal places, clamp minimum at 1.01x
  return Math.max(1.01, Math.round(multiplier * 100) / 100);
}

// 2. Mines Board Generator
// Generates array of 25 numbers, where selected index values will be Mines (true) or Diamonds (false).
export function generateMinesBoard(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): boolean[] {
  const hash = sha256(`${serverSeed}-${clientSeed}-${nonce}`);
  const board = Array(25).fill(false);
  
  const indices: number[] = Array.from({ length: 25 }, (_, i) => i);
  
  // Permute list of indices based on segments of the hash
  for (let i = 24; i > 0; i--) {
    // Read 2 bytes (4 hex characters) starting at index (i * 2) % 60
    const startHex = (i * 2) % 60;
    const value = parseInt(hash.substring(startHex, startHex + 4), 16);
    const j = value % (i + 1);
    
    // Swap elements i and j
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }
  
  // The first `mineCount` indices in the permuted array are mines
  for (let i = 0; i < mineCount; i++) {
    board[indices[i]] = true;
  }
  
  return board;
}

// 3. Plinko Path Generator
// Returns an array of numbers representing bounces (0 = Left, 1 = Right)
export function generatePlinkoPath(serverSeed: string, clientSeed: string, nonce: number, rows: number): number[] {
  const hash = sha256(`${serverSeed}-${clientSeed}-${nonce}`);
  const path: number[] = [];
  
  for (let i = 0; i < rows; i++) {
    // Take two hex characters per bounce row
    const startHex = (i * 2) % 64;
    const value = parseInt(hash.substring(startHex, startHex + 2), 16);
    
    // If even -> Left (0), odd -> Right (1)
    path.push(value % 2 === 0 ? 0 : 1);
  }
  
  return path;
}

// 4. Roulette Spinning Outcome
// Generates a pocket index from 0 to 14
// 0 = Green (Jackpot), 1-7 = Red, 8-14 = Black
export function generateRouletteNumber(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = sha256(`${serverSeed}-${clientSeed}-${nonce}`);
  const value = parseInt(hash.substring(0, 8), 16);
  return value % 15;
}
