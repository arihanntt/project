// ============================================================
// StealthDrop — Cryptographic Engine
// Web Crypto API only. Correct two-phase PBKDF2 → HKDF pipeline.
// ============================================================

import {
  PBKDF2_ITERATIONS,
  PBKDF2_HASH,
  DERIVED_KEY_BITS,
  SALT_BYTES,
  IV_BYTES,
  KDF_INFO_AES,
  KDF_INFO_PRNG,
} from '@/types';

// -------------------------------------------------------
// Helper: ensure a Uint8Array has a clean ArrayBuffer backing.
// Slices are views into a larger buffer — we must be precise.
// -------------------------------------------------------
function toCleanArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// -------------------------------------------------------
// Generate cryptographically random bytes
// -------------------------------------------------------
export function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

// -------------------------------------------------------
// Phase 1: PBKDF2 — stretch password into raw key material bytes
// Returns 32 raw bytes (256 bits) of key material.
// -------------------------------------------------------
async function pbkdf2Bytes(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  // Import password as raw key for PBKDF2
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive 256 bits of key material from PBKDF2
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toCleanArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    passwordKey,
    DERIVED_KEY_BITS // 256 bits
  );

  return new Uint8Array(bits);
}

// -------------------------------------------------------
// Phase 2: HKDF — expand key material into domain-specific output
// info string separates AES key from PRNG seed.
// Returns 32 raw bytes (256 bits).
// -------------------------------------------------------
async function hkdfExpand(
  keyMaterial: Uint8Array,
  info: string
): Promise<Uint8Array> {
  // Import raw key material as HKDF key
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    toCleanArrayBuffer(keyMaterial),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Expand into 256 bits with domain separation info
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: PBKDF2_HASH,
      salt: new ArrayBuffer(0),
      info: toCleanArrayBuffer(new TextEncoder().encode(info)),
    },
    hkdfKey,
    DERIVED_KEY_BITS // 256 bits
  );

  return new Uint8Array(bits);
}

// -------------------------------------------------------
// Derive AES-256-GCM CryptoKey from password + salt
// Pipeline: PBKDF2 → HKDF("stealthdrop-aes-gcm") → AES key
// -------------------------------------------------------
export async function deriveAesKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const base = await pbkdf2Bytes(password, salt);
  const aesBytes = await hkdfExpand(base, KDF_INFO_AES);

  return crypto.subtle.importKey(
    'raw',
    toCleanArrayBuffer(aesBytes),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// -------------------------------------------------------
// Derive PRNG seed from password + salt
// Pipeline: PBKDF2 → HKDF("stealthdrop-prng") → 32 bytes
// -------------------------------------------------------
export async function derivePrngSeed(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const base = await pbkdf2Bytes(password, salt);
  return hkdfExpand(base, KDF_INFO_PRNG);
}

// -------------------------------------------------------
// AES-256-GCM Encrypt
// -------------------------------------------------------
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = randomBytes(IV_BYTES);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toCleanArrayBuffer(iv) },
    key,
    toCleanArrayBuffer(plaintext)
  );

  return { ciphertext: new Uint8Array(encrypted), iv };
}

// -------------------------------------------------------
// AES-256-GCM Decrypt — throws DOMException on auth failure
// -------------------------------------------------------
export async function aesGcmDecrypt(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toCleanArrayBuffer(iv) },
    key,
    toCleanArrayBuffer(ciphertext)
  );

  return new Uint8Array(decrypted);
}

// -------------------------------------------------------
// Full encrypt pipeline: derive key then AES-GCM encrypt
// -------------------------------------------------------
export async function encryptPayload(
  password: string,
  plaintext: Uint8Array
): Promise<{ salt: Uint8Array; iv: Uint8Array; ciphertext: Uint8Array }> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveAesKey(password, salt);
  const { ciphertext, iv } = await aesGcmEncrypt(key, plaintext);
  return { salt, iv, ciphertext };
}

// -------------------------------------------------------
// Full decrypt pipeline: derive key then AES-GCM decrypt
// Throws on wrong password (AES-GCM auth tag mismatch)
// -------------------------------------------------------
export async function decryptPayload(
  password: string,
  salt: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<Uint8Array> {
  const key = await deriveAesKey(password, salt);
  return aesGcmDecrypt(key, ciphertext, iv);
}
