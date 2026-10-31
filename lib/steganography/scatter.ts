// ============================================================
// StealthDrop — PRNG-based Pixel Position Scatterer
//
// Uses a Mulberry32 PRNG seeded with password-derived material
// to generate a deterministic shuffled permutation of pixel
// channel indices. This provides non-sequential LSB placement.
//
// SECURITY NOTE: The PRNG itself is NOT a cryptographic security
// mechanism. Encryption (AES-256-GCM) provides confidentiality.
// The PRNG's sole purpose is pixel-position scattering to make
// simple sequential LSB analysis harder.
// ============================================================

import { derivePrngSeed } from '@/lib/crypto/engine';

// -------------------------------------------------------
// Mulberry32 PRNG
// Fast, simple, deterministic 32-bit PRNG
// -------------------------------------------------------
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z = z ^ (z + Math.imul(z ^ (z >>> 7), z | 61));
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// -------------------------------------------------------
// Seed integer from PRNG seed bytes (first 4 bytes)
// -------------------------------------------------------
function seedToUint32(seedBytes: Uint8Array): number {
  return (
    ((seedBytes[0] << 24) |
      (seedBytes[1] << 16) |
      (seedBytes[2] << 8) |
      seedBytes[3]) >>>
    0
  );
}

// -------------------------------------------------------
// Fisher-Yates shuffle using the seeded PRNG
// Generates a deterministic permutation of [0, n)
// -------------------------------------------------------
export function generatePermutation(n: number, prng: () => number): Uint32Array {
  const indices = new Uint32Array(n);
  for (let i = 0; i < n; i++) indices[i] = i;

  // Fisher-Yates in-place shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  return indices;
}

// -------------------------------------------------------
// Build the pixel channel index permutation for LSB embedding
//
// There are width * height * 3 RGB channel slots in the image.
// We return a shuffled array of indices into that flat channel space.
// Index i maps to: pixel = floor(i/3), channel = i%3 (0=R, 1=G, 2=B)
//
// payloadBitCount: how many bits we need to embed
// -------------------------------------------------------
export async function buildScatterMap(
  password: string,
  salt: Uint8Array,
  totalChannels: number,
  payloadBitCount: number
): Promise<Uint32Array> {
  if (payloadBitCount > totalChannels) {
    throw new Error(
      `CAPACITY_EXCEEDED: Need ${payloadBitCount} bits but only ${totalChannels} RGB channels available`
    );
  }

  const seedBytes = await derivePrngSeed(password, salt);
  const seed = seedToUint32(seedBytes);
  const prng = mulberry32(seed);

  // Generate full permutation then slice to what we need
  const fullPerm = generatePermutation(totalChannels, prng);
  return fullPerm.slice(0, payloadBitCount);
}
