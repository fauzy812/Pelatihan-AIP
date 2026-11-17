import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface ManagementBriefPayload {
  metricsSummary: {
    totalAssets: number;
    baikCount: number;
    baikPercentage: number;
    rusakRinganCount: number;
    rusakBeratCount: number;
    activePicCount: number;
    inRepairCount: number;
    totalAssetValue: number;
    totalMaintenanceCost: number;
    mttrDays: number;
  };
  categoryStats: Array<{
    categoryName: string;
    total: number;
    baik: number;
    rusakRingan: number;
    rusakBerat: number;
  }>;
  smartInsights: Array<{
    assetName: string;
    kodeBarangBmd: string;
    kondisi: string;
    repairCount: number;
    totalRepairCost: number;
    nilaiPerolehan: number;
    reasons: string[];
    recommendation: string;
  }>;
  idleAssets: Array<{
    assetName: string;
    unitKerja: string;
    idleDays: number;
  }>;
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'SI-ASET SMART DPUBMSDA' });
});

app.post('/api/ai/management-brief', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      error:
        'GEMINI_API_KEY belum dikonfigurasi pada panel Settings > Secrets. Tambahkan kunci API Gemini yang valid untuk mengaktifkan penyusunan Management Brief AI.',
    });
    return;
  }

  const body = req.body as Partial<ManagementBriefPayload>;
  if (!body || !body.metricsSummary) {
    res.status(400).json({
      error: 'Data ringkasan aset tidak lengkap untuk dianalisis.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      'Anda adalah Analis Manajemen Barang Milik Daerah (BMD) senior untuk Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air (DPUBMSDA) Kabupaten Sidoarjo.',
      'Susun Management Brief eksekutif formal berbahasa Indonesia berdasarkan data aktual inventaris dan pemeliharaan aset berikut:',
      JSON.stringify(body, null, 2),
      'Berikan analisis tajam berbasis angka aktual: evaluasi kesehatan armada/peralatan, deteksi lemon asset (kerusakan berulang atau biaya servis >50% nilai perolehan), efisiensi MTTR, rekomendasi realokasi aset menganggur, dan prioritas penganggaran pemeliharaan atau penghapusan BMD.',
    ].join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'Gunakan bahasa Indonesia formal birokrasi pemerintah daerah yang ringkas, objektif, dan berorientasi keputusan anggaran/BMD. Jangan mengarang angka di luar data yang diberikan.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ringkasanEksekutif: {
              type: Type.STRING,
              description:
                'Paragraf ringkasan eksekutif kondisi aset DPUBMSDA periode berjalan.',
            },
            sorotanKritis: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '3 sampai 4 poin temuan kritis terkait aset rusak berat, kerusakan berulang, atau biaya servis tinggi.',
            },
            rekomendasiAnggaran: {
              type: Type.STRING,
              description:
                'Rekomendasi kebijakan anggaran pemeliharaan vs pengadaan/penghapusan BMD.',
            },
            rencanaTindakLanjut: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '3 sampai 4 langkah tindak lanjut konkret untuk Pengurus Barang, Teknisi, dan Kepala Bidang.',
            },
          },
          required: [
            'ringkasanEksekutif',
            'sorotanKritis',
            'rekomendasiAnggaran',
            'rencanaTindakLanjut',
          ],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      res.status(502).json({
        error: 'Layanan AI tidak mengembalikan konten analisis.',
      });
      return;
    }

    const parsed = JSON.parse(rawText);
    res.json({
      brief: parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const rawMsg =
      err instanceof Error ? err.message : 'Terjadi kesalahan pada layanan AI.';
    let cleanMsg = rawMsg;
    let statusCode = 500;
    try {
      const parsedErr = JSON.parse(rawMsg) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsedErr?.error) {
        if (
          parsedErr.error.code === 503 ||
          parsedErr.error.status === 'UNAVAILABLE'
        ) {
          statusCode = 503;
          cleanMsg =
            'Server model Gemini AI sedang mengalami beban permintaan tinggi sementara. Silakan ulangi beberapa saat lagi.';
        } else if (parsedErr.error.message) {
          cleanMsg = parsedErr.error.message;
        }
      }
    } catch {
      // rawMsg is already plain text
    }
    res.status(statusCode).json({
      error: `Gagal menyusun Management Brief AI: ${cleanMsg}`,
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output tidak ditemukan.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SI-ASET SMART DPUBMSDA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
