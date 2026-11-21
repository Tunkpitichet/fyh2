import { UploadedImage } from '../types/world';

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
]);

export function isSupportedImageFile(file: File): boolean {
  if (SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'].includes(ext);
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () =>
      reject(new Error('Browser could not decode this image file. Please try JPEG, PNG, or WebP.'));
    img.src = dataUrl;
  });
}

export async function processUploadedFile(file: File): Promise<UploadedImage> {
  if (!isSupportedImageFile(file)) {
    throw new Error(
      `Unsupported format "${file.type || file.name}". Please upload JPEG, PNG, or WebP.`
    );
  }
  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }
  if (file.size > 40 * 1024 * 1024) {
    throw new Error('Image exceeds 40 MB limit. Please choose a smaller photograph.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const dims = await loadImageDimensions(dataUrl);

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
    dataUrl,
    width: dims.width,
    height: dims.height,
  };
}
