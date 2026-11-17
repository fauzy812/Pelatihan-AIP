export interface EncodedAttachment {
  dataUrl: string;
  fileName: string;
}

const MAX_NON_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_INPUT_BYTES = 8 * 1024 * 1024;

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid.'));
      img.onload = () => {
        const maxDim = 960;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function readAttachmentFile(
  file: File,
  allowPdf = false,
): Promise<EncodedAttachment> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (!isImage && !(allowPdf && isPdf)) {
    throw new Error(
      allowPdf
        ? 'Format file harus berupa gambar (JPG/PNG/WEBP) atau dokumen PDF.'
        : 'Format file harus berupa gambar (JPG/PNG/WEBP).',
    );
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_INPUT_BYTES) {
      throw new Error('Ukuran gambar melebihi batas maksimal 8 MB.');
    }
    const dataUrl = await compressImageToDataUrl(file);
    return { dataUrl, fileName: file.name };
  }

  if (file.size > MAX_NON_IMAGE_BYTES) {
    throw new Error('Ukuran file PDF maksimal 1,5 MB untuk penyimpanan lokal.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file PDF.'));
    reader.onload = () =>
      resolve({ dataUrl: String(reader.result), fileName: file.name });
    reader.readAsDataURL(file);
  });
}
