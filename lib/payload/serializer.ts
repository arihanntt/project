// ============================================================
// StealthDrop — Payload Serializer / Deserializer
//
// Binary payload layout per sub-payload:
//   [4]  MAGIC        — 0x53 0x44 0x52 0x50 ("SDRP")
//   [1]  VERSION      — 0x01
//   [1]  MODE         — PayloadMode flag
//   [1]  FLAGS        — reserved, 0x00
//   [32] SALT         — PBKDF2 salt
//   [12] IV           — AES-GCM nonce
//   [4]  PAYLOAD_LEN  — uint32 BE, byte length of ciphertext (including 16-byte GCM tag)
//   [N]  CIPHERTEXT   — AES-GCM encrypted data + 16-byte auth tag
//
// Decoy mode layout (two concatenated sub-payloads):
//   [decoy sub-payload bytes] ++ [real sub-payload bytes]
//
// Decoder strategy:
//   1. Try password against sub-payload at offset 0.
//   2. If auth fails, find length of first sub-payload, try at that offset.
//   3. If both fail → AUTHENTICATION_FAILED.
// ============================================================

import {
  MAGIC,
  PAYLOAD_VERSION,
  PayloadMode,
  SALT_BYTES,
  IV_BYTES,
  HEADER_BYTES,
  EncodeMode,
} from '@/types';
import { encryptPayload, decryptPayload } from '@/lib/crypto/engine';

// -------------------------------------------------------
// Build a single sub-payload binary blob
// -------------------------------------------------------
export async function buildSubPayload(
  password: string,
  plaintext: Uint8Array,
  mode: EncodeMode,
  isDecoy: boolean
): Promise<Uint8Array> {
  const { salt, iv, ciphertext } = await encryptPayload(password, plaintext);

  const modeFlag =
    mode === 'image'
      ? PayloadMode.ImageOnly
      : isDecoy
      ? PayloadMode.Decoy
      : PayloadMode.TextOnly;

  const header = new Uint8Array(HEADER_BYTES);
  let o = 0;

  header.set(MAGIC, o); o += 4;           // [4] MAGIC
  header[o++] = PAYLOAD_VERSION;          // [1] VERSION
  header[o++] = modeFlag;                 // [1] MODE
  header[o++] = 0x00;                     // [1] FLAGS (reserved)
  header.set(salt, o); o += SALT_BYTES;   // [32] SALT
  header.set(iv, o); o += IV_BYTES;       // [12] IV
  header.set(u32BE(ciphertext.length), o);// [4] PAYLOAD_LEN

  const result = new Uint8Array(HEADER_BYTES + ciphertext.length);
  result.set(header, 0);
  result.set(ciphertext, HEADER_BYTES);
  return result;
}

// -------------------------------------------------------
// Build complete payload (optionally with decoy prepended)
// -------------------------------------------------------
export async function buildFullPayload(
  password: string,
  plaintext: Uint8Array,
  mode: EncodeMode,
  decoyPassword?: string,
  decoyPlaintext?: Uint8Array
): Promise<Uint8Array> {
  const realPayload = await buildSubPayload(password, plaintext, mode, false);

  if (decoyPassword && decoyPlaintext) {
    const decoyPayload = await buildSubPayload(
      decoyPassword,
      decoyPlaintext,
      'text',
      true
    );
    // Layout: [decoy] ++ [real]
    const combined = new Uint8Array(decoyPayload.length + realPayload.length);
    combined.set(decoyPayload, 0);
    combined.set(realPayload, decoyPayload.length);
    return combined;
  }

  return realPayload;
}

// -------------------------------------------------------
// Parse header fields from buf at offset.
// Returns null if magic/version invalid or buffer too short.
// -------------------------------------------------------
interface SubPayloadHeader {
  modeFlag: number;
  isDecoy: boolean;
  isImage: boolean;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertextLength: number;
  ciphertextOffset: number;
  totalLength: number; // header + ciphertext
}

function parseHeader(buf: Uint8Array, offset: number): SubPayloadHeader | null {
  if (buf.length - offset < HEADER_BYTES) return null;

  // Validate MAGIC
  for (let i = 0; i < 4; i++) {
    if (buf[offset + i] !== MAGIC[i]) return null;
  }

  // Validate VERSION
  if (buf[offset + 4] !== PAYLOAD_VERSION) return null;

  const modeFlag = buf[offset + 5];
  const isDecoy = (modeFlag & PayloadMode.Decoy) !== 0;
  const isImage = (modeFlag & PayloadMode.ImageOnly) !== 0;

  const saltStart = offset + 7;
  const salt = buf.slice(saltStart, saltStart + SALT_BYTES);

  const ivStart = saltStart + SALT_BYTES;
  const iv = buf.slice(ivStart, ivStart + IV_BYTES);

  const lenStart = ivStart + IV_BYTES;
  const ciphertextLength = fromU32BE(buf, lenStart);

  const ciphertextOffset = lenStart + 4;

  if (buf.length - ciphertextOffset < ciphertextLength) return null;

  return {
    modeFlag,
    isDecoy,
    isImage,
    salt,
    iv,
    ciphertextLength,
    ciphertextOffset,
    totalLength: HEADER_BYTES + ciphertextLength,
  };
}

// -------------------------------------------------------
// Try to decrypt a sub-payload at the given offset.
// Returns null on magic/format mismatch or auth failure.
// Never throws — callers check for null.
// -------------------------------------------------------
async function tryDecodeAt(
  buf: Uint8Array,
  offset: number,
  password: string
): Promise<{ plaintext: Uint8Array; mode: EncodeMode; isDecoy: boolean } | null> {
  const hdr = parseHeader(buf, offset);
  if (!hdr) return null;

  const ciphertext = buf.slice(hdr.ciphertextOffset, hdr.ciphertextOffset + hdr.ciphertextLength);

  try {
    const plaintext = await decryptPayload(password, hdr.salt, hdr.iv, ciphertext);
    const encMode: EncodeMode = hdr.isImage ? 'image' : 'text';
    return { plaintext, mode: encMode, isDecoy: hdr.isDecoy };
  } catch {
    // Wrong password → AES-GCM auth failure → return null (not throw)
    return null;
  }
}

// -------------------------------------------------------
// Main decode entry point.
// Tries:
//   1. Password against first sub-payload (offset 0)
//   2. If that fails, find end of first sub-payload, try there
// -------------------------------------------------------
export async function parseAndDecrypt(
  payloadBytes: Uint8Array,
  password: string
): Promise<{ plaintext: Uint8Array; mode: EncodeMode; isDecoy: boolean }> {
  // Attempt 1: sub-payload at offset 0
  const r0 = await tryDecodeAt(payloadBytes, 0, password);
  if (r0) return r0;

  // Attempt 2: look for a second sub-payload (decoy layout)
  const hdr0 = parseHeader(payloadBytes, 0);
  if (hdr0 && hdr0.totalLength < payloadBytes.length) {
    const r1 = await tryDecodeAt(payloadBytes, hdr0.totalLength, password);
    if (r1) return r1;
  }

  throw new Error('AUTHENTICATION_FAILED');
}

// -------------------------------------------------------
// u32 big-endian helpers
// -------------------------------------------------------
function u32BE(n: number): Uint8Array {
  return new Uint8Array([
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ]);
}

function fromU32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}
