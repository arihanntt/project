// ============================================================
// StealthDrop — Image Utilities
// Handles: file → canvas, canvas → PNG blob, image scaling
// ============================================================

import type { ImageInfo } from '@/types';

// -------------------------------------------------------
// Load a File into an HTMLImageElement
// -------------------------------------------------------
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

// -------------------------------------------------------
// Get ImageData from an HTMLImageElement via offscreen canvas
// -------------------------------------------------------
export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// -------------------------------------------------------
// Get ImageData from a File
// -------------------------------------------------------
export async function fileToImageData(file: File): Promise<ImageData> {
  const img = await loadImageFromFile(file);
  return imageToImageData(img);
}

// -------------------------------------------------------
// Get ImageData from a data URL
// -------------------------------------------------------
export async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(imageToImageData(img));
    img.onerror = () => reject(new Error('Failed to load image from data URL'));
    img.src = dataUrl;
  });
}

// -------------------------------------------------------
// Convert ImageData → PNG Blob
// -------------------------------------------------------
export function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      },
      'image/png'
    );
  });
}

// -------------------------------------------------------
// Convert ImageData → PNG Data URL
// -------------------------------------------------------
export function imageDataToPngUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// -------------------------------------------------------
// Build ImageInfo from a File
// -------------------------------------------------------
export async function buildImageInfo(file: File): Promise<ImageInfo> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  return {
    file,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sizeBytes: file.size,
    dataUrl,
  };
}

// -------------------------------------------------------
// Generate a thumbnail data URL for preview
// -------------------------------------------------------
export function generateThumbnail(
  imageData: ImageData,
  maxSize = 300
): string {
  const { width, height } = imageData;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const tw = Math.floor(width * scale);
  const th = Math.floor(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d')!;

  // Draw scaled version
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
  ctx.drawImage(srcCanvas, 0, 0, tw, th);

  return canvas.toDataURL('image/png');
}

// -------------------------------------------------------
// Format file size for display
// -------------------------------------------------------
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// -------------------------------------------------------
// Convert a secret image to raw PNG bytes for embedding
// -------------------------------------------------------
export async function imageToPngBytes(imageData: ImageData): Promise<Uint8Array> {
  const blob = await imageDataToPngBlob(imageData);
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// -------------------------------------------------------
// Reconstruct an image from embedded PNG bytes
// -------------------------------------------------------
export async function pngBytesToImageData(bytes: Uint8Array): Promise<ImageData> {
  // Use slice to handle subarray views correctly (byteOffset might not be 0)
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buf], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to reconstruct image'));
      i.src = url;
    });
    return imageToImageData(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// -------------------------------------------------------
// Build a data URL from raw PNG bytes
// -------------------------------------------------------
export function pngBytesToDataUrl(bytes: Uint8Array): string {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buf], { type: 'image/png' });
  return URL.createObjectURL(blob);
}
