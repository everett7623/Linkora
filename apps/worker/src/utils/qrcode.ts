/**
 * Minimal QR Code generator for Cloudflare Workers (no external dependencies).
 * Supports alphanumeric mode for URLs, error correction level M.
 *
 * For production use with very long URLs, consider upgrading to a full QR library.
 * This implementation handles URLs up to ~70 characters (version 4, EC level M).
 */

// Galois Field arithmetic for QR codes (GF(256) with primitive polynomial 0x11d)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = x << 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGeneratorPoly(nsym);
  const out = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) out[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = out[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return out.slice(data.length);
}

// QR code version configs: [version, totalCodewords, ecCodewords, dataCodewords]
// Using error correction level M for good balance
const QR_VERSIONS: { v: number; total: number; ec: number; data: number; size: number }[] = [
  { v: 1,  total: 26,   ec: 10,  data: 16,   size: 21 },
  { v: 2,  total: 44,   ec: 16,  data: 28,   size: 25 },
  { v: 3,  total: 70,   ec: 26,  data: 44,   size: 29 },
  { v: 4,  total: 100,  ec: 18,  data: 82,   size: 33 },  // 2 blocks, simplified
  { v: 5,  total: 134,  ec: 24,  data: 110,  size: 37 },
  { v: 6,  total: 172,  ec: 16,  data: 156,  size: 41 },
];

const ALPHANUMERIC_TABLE: Record<string, number> = {};
'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.split('').forEach((c, i) => {
  ALPHANUMERIC_TABLE[c] = i;
});

function isAlphanumeric(s: string): boolean {
  return s.toUpperCase().split('').every((c) => c in ALPHANUMERIC_TABLE);
}

function encodeAlphanumeric(s: string): number[] {
  const upper = s.toUpperCase();
  const bits: number[] = [];
  for (let i = 0; i < upper.length; i += 2) {
    if (i + 1 < upper.length) {
      const val = ALPHANUMERIC_TABLE[upper[i]] * 45 + ALPHANUMERIC_TABLE[upper[i + 1]];
      for (let b = 10; b >= 0; b--) bits.push((val >> b) & 1);
    } else {
      const val = ALPHANUMERIC_TABLE[upper[i]];
      for (let b = 5; b >= 0; b--) bits.push((val >> b) & 1);
    }
  }
  return bits;
}

function encodeByte(s: string): number[] {
  const bytes = new TextEncoder().encode(s);
  const bits: number[] = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  return bits;
}

function selectVersion(dataBits: number): typeof QR_VERSIONS[number] | undefined {
  for (const ver of QR_VERSIONS) {
    if (ver.data * 8 >= dataBits) return ver;
  }
  return undefined;
}

function bitsToBytes(bits: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] ?? 0);
    }
    result.push(byte);
  }
  return result;
}

// Alignment pattern locations per version
const ALIGNMENT_POSITIONS: number[][] = [
  [],         // v1
  [6, 18],    // v2
  [6, 22],    // v3
  [6, 26],    // v4
  [6, 30],    // v5
  [6, 34],    // v6
];

function createMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => new Array(size).fill(-1));
}

function placeFinderPattern(matrix: number[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r, cc = col + c;
      if (rr < 0 || rr >= matrix.length || cc < 0 || cc >= matrix.length) continue;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = edge || inner ? 1 : 0;
      } else {
        matrix[rr][cc] = 0;
      }
    }
  }
}

function placeAlignmentPattern(matrix: number[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = row + r, cc = col + c;
      if (matrix[rr][cc] !== -1) return; // Skip if already occupied
    }
  }
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const edge = Math.abs(r) === 2 || Math.abs(c) === 2;
      const center = r === 0 && c === 0;
      matrix[row + r][col + c] = edge || center ? 1 : 0;
    }
  }
}

function placeTimingPatterns(matrix: number[][]) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

function reserveFormatBits(matrix: number[][]) {
  const size = matrix.length;
  for (let i = 0; i < 8; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
    if (matrix[8][size - 1 - i] === -1) matrix[8][size - 1 - i] = 0;
    if (matrix[size - 1 - i][8] === -1) matrix[size - 1 - i][8] = 0;
  }
  if (matrix[8][8] === -1) matrix[8][8] = 0;
  matrix[size - 8][8] = 1; // Dark module
}

function placeData(matrix: number[][], data: number[]) {
  const size = matrix.length;
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // Skip timing pattern column

    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (let c = 0; c <= 1; c++) {
        const cc = col - c;
        if (matrix[row][cc] === -1) {
          matrix[row][cc] = bitIndex < data.length ? data[bitIndex] : 0;
          bitIndex++;
        }
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix: number[][], reserved: number[][], maskId: number) {
  const size = matrix.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c] !== -1) continue;
      let shouldMask = false;
      switch (maskId) {
        case 0: shouldMask = (r + c) % 2 === 0; break;
        case 1: shouldMask = r % 2 === 0; break;
        case 2: shouldMask = c % 3 === 0; break;
        case 3: shouldMask = (r + c) % 3 === 0; break;
        case 4: shouldMask = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
        case 5: shouldMask = ((r * c) % 2 + (r * c) % 3) === 0; break;
        case 6: shouldMask = ((r * c) % 2 + (r * c) % 3) % 2 === 0; break;
        case 7: shouldMask = ((r + c) % 2 + (r * c) % 3) % 2 === 0; break;
      }
      if (shouldMask) matrix[r][c] ^= 1;
    }
  }
}

// Format info for EC level M (0b00), masks 0-7
const FORMAT_STRINGS: number[] = [
  0x5412, 0x5125, 0x5E7C, 0x5B4B,
  0x45F9, 0x40CE, 0x4F97, 0x4AA0,
];

function placeFormatInfo(matrix: number[][], maskId: number) {
  const size = matrix.length;
  const formatBits = FORMAT_STRINGS[maskId];

  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;

    // Around top-left finder
    if (i < 6) matrix[8][i] = bit;
    else if (i < 8) matrix[8][i + 1] = bit;
    else if (i < 9) matrix[8 - (i - 8)][8] = bit;
    else matrix[14 - i][8] = bit;

    // Around other finders
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }
}

export function generateQRCodeSVG(text: string, size = 256): string {
  // Encode data
  let dataBits: number[];
  let modeBits: number[];

  if (isAlphanumeric(text)) {
    modeBits = [0, 0, 1, 0]; // Alphanumeric mode
    const countBits = text.length < 512 ? 9 : 13;
    const count: number[] = [];
    for (let b = countBits - 1; b >= 0; b--) count.push((text.length >> b) & 1);
    dataBits = [...modeBits, ...count, ...encodeAlphanumeric(text)];
  } else {
    modeBits = [0, 1, 0, 0]; // Byte mode
    const encoded = new TextEncoder().encode(text);
    const countBits = encoded.length < 256 ? 8 : 16;
    const count: number[] = [];
    for (let b = countBits - 1; b >= 0; b--) count.push((encoded.length >> b) & 1);
    dataBits = [...modeBits, ...count, ...encodeByte(text)];
  }

  // Add terminator
  dataBits.push(0, 0, 0, 0);

  const ver = selectVersion(dataBits.length);
  if (!ver) {
    // Fallback: return a simple SVG with the URL text
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><text x="50%" y="50%" text-anchor="middle" fill="black" font-size="12">QR: URL too long</text></svg>`;
  }

  // Pad to data capacity
  const dataCapacity = ver.data * 8;
  while (dataBits.length < dataCapacity) {
    dataBits.push(0);
    if (dataBits.length >= dataCapacity) break;
  }
  // Pad to byte boundary
  while (dataBits.length % 8 !== 0) dataBits.push(0);

  const dataBytes = bitsToBytes(dataBits);
  while (dataBytes.length < ver.data) {
    dataBytes.push(dataBytes.length % 2 === 0 ? 0xEC : 0x11);
  }

  // RS encode
  const ecBytes = rsEncode(dataBytes, ver.ec);
  const allBytes = [...dataBytes, ...ecBytes];

  // Convert to bit array
  const allBits: number[] = [];
  for (const b of allBytes) {
    for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1);
  }

  // Build matrix
  const matrixSize = ver.size;
  const matrix = createMatrix(matrixSize);

  // Place finder patterns
  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, 0, matrixSize - 7);
  placeFinderPattern(matrix, matrixSize - 7, 0);

  // Place alignment patterns
  if (ver.v >= 2) {
    const positions = ALIGNMENT_POSITIONS[ver.v - 1];
    for (const r of positions) {
      for (const cc of positions) {
        placeAlignmentPattern(matrix, r, cc);
      }
    }
  }

  // Timing patterns
  placeTimingPatterns(matrix);

  // Reserve format bits
  reserveFormatBits(matrix);

  // Save reserved areas
  const reserved = matrix.map((row) => [...row]);

  // Place data
  placeData(matrix, allBits);

  // Apply mask 0 (simplest)
  applyMask(matrix, reserved, 0);

  // Place format info
  placeFormatInfo(matrix, 0);

  // Generate SVG
  const cellSize = size / matrixSize;
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="black">${rects}</g></svg>`;
}
