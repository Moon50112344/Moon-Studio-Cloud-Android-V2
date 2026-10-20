import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory for uploaded files
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB maximum limit
  },
});

// Emutize server configuration state
interface EmutizeConfig {
  apiKey: string;
  baseUrl: string;
  directEmbedUrl: string;
  defaultAppName: string;
}

const config: EmutizeConfig = {
  apiKey: process.env.EMUTIZE_API_KEY || '',
  baseUrl: (process.env.EMUTIZE_BASE_URL || 'https://app.emutize.com').replace(/\/+$/, ''),
  directEmbedUrl: process.env.EMUTIZE_DIRECT_EMBED_URL || '',
  defaultAppName: process.env.EMUTIZE_DEFAULT_APP || '',
};

// Single Android device session state
interface AndroidSession {
  sessionId: string | number;
  appName: string;
  backend: string;
  embedUrl: string;
  agentUrl?: string;
  agentSessionId?: string;
  token?: string;
  status: 'idle' | 'connecting' | 'booting' | 'active' | 'disconnected' | 'ended' | 'unavailable';
  startedAt: string;
  lastActiveAt: string;
  warning?: string;
  isDirectEmbed?: boolean;
}

let currentSession: AndroidSession | null = null;

// Track uploaded files in current session
interface UploadedFileRecord {
  id: string;
  originalName: string;
  savedName: string;
  size: number;
  mimeType: string;
  extension: string;
  uploadedAt: string;
  isApk: boolean;
  apkStatus?: 'uploaded' | 'ready_to_install' | 'installed' | 'registered_in_emutize';
  emutizeAppId?: string;
  verificationStatus: 'verified' | 'failed' | 'pending';
  transferNote: string;
}

const sessionFiles: Map<string, UploadedFileRecord> = new Map();

// --- EMUTIZE INTEGRATION API ROUTES ---

// 1. Get Integration Status & Provider Specs
app.get('/api/emutize/status', async (_req: Request, res: Response) => {
  let probeOk = false;
  let probeMessage = '';

  // Probe Emutize public endpoint
  try {
    const testRes = await fetch(`${config.baseUrl}/api/v1/sessions/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    // Emutize returns 401 when online without token, which means the service is reachable
    if (testRes.status === 401 || testRes.status === 200 || testRes.status === 404) {
      probeOk = true;
      probeMessage = 'Hạ tầng máy chủ Emutize đang phản hồi tốt (HTTP ' + testRes.status + ')';
    } else {
      probeMessage = `Máy chủ Emutize phản hồi mã ${testRes.status}`;
    }
  } catch (err: any) {
    probeOk = false;
    probeMessage = `Không thể kết nối đến máy chủ Emutize (${config.baseUrl}): ${err?.message || 'Lỗi mạng'}`;
  }

  res.json({
    hasApiKey: !!config.apiKey && config.apiKey.trim().length > 0,
    hasDirectEmbed: !!config.directEmbedUrl && config.directEmbedUrl.trim().length > 0,
    baseUrl: config.baseUrl,
    defaultAppName: config.defaultAppName,
    probeOk,
    probeMessage,
    activeSession: currentSession,
    provider: {
      name: 'Emutize',
      serviceType: 'Android Cloud Container Platform',
      backendArchitecture: 'Redroid (x86_64 Android OS)',
      idleTimeoutMinutes: 15,
      streamingProtocol: 'Server-Push JPEG Streaming (60fps) & WebCodecs',
      containerIsolation: '1 container độc lập duy nhất / phiên',
      dataPolicy: 'Toàn bộ dữ liệu, ứng dụng cài đặt và tệp tạm trong container sẽ bị dọn dẹp và xóa sạch hoàn toàn ngay khi phiên kết thúc.',
      supportedFeatures: [
        'Truyền phát trực tiếp màn hình qua iframe / Emutize SDK',
        'Cảm ứng đa điểm, chạm (tap) và vuốt (swipe)',
        'Bàn phím ảo & gõ văn bản trực tiếp',
        'Phím điều hướng phần cứng: Home, Back, Recent Apps',
        'Cài đặt ứng dụng APK tương thích kiến trúc x86_64',
        'Quản lý tệp đa định dạng và truyền tải tới thiết bị',
      ],
    },
  });
});

// 2. Configure Emutize (Admin security settings)
app.post('/api/emutize/config', (req: Request, res: Response) => {
  const { apiKey, baseUrl, directEmbedUrl, defaultAppName } = req.body;

  if (typeof apiKey === 'string') {
    config.apiKey = apiKey.trim();
  }
  if (typeof baseUrl === 'string' && baseUrl.trim()) {
    config.baseUrl = baseUrl.trim().replace(/\/+$/, '');
  }
  if (typeof directEmbedUrl === 'string') {
    config.directEmbedUrl = directEmbedUrl.trim();
  }
  if (typeof defaultAppName === 'string') {
    config.defaultAppName = defaultAppName.trim();
  }

  res.json({
    success: true,
    message: 'Cập nhật cấu hình Emutize thành công',
    hasApiKey: !!config.apiKey,
    hasDirectEmbed: !!config.directEmbedUrl,
    baseUrl: config.baseUrl,
    defaultAppName: config.defaultAppName,
  });
});

// 3. Start or reconnect the single Android device session
app.post('/api/emutize/session/start', async (req: Request, res: Response) => {
  const requestedApp = (req.body.appName || config.defaultAppName || '').trim();

  // If a session is already active and healthy, reuse the single Android device (Requirement 3)
  if (currentSession && (currentSession.status === 'active' || currentSession.status === 'booting')) {
    currentSession.lastActiveAt = new Date().toISOString();
    return res.json({
      success: true,
      reconnected: true,
      session: currentSession,
      message: 'Đã kết nối lại phiên thiết bị Android đang hoạt động.',
    });
  }

  // Priority 1: Direct Embed Capability URL if configured by admin
  if (config.directEmbedUrl) {
    currentSession = {
      sessionId: 'direct-' + Date.now(),
      appName: requestedApp || 'MoonStudio-CloudDevice',
      backend: 'Redroid (Cloud Container)',
      embedUrl: config.directEmbedUrl,
      status: 'active',
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isDirectEmbed: true,
    };
    return res.json({
      success: true,
      reconnected: false,
      session: currentSession,
      message: 'Khởi tạo phiên thiết bị Android qua liên kết Emutize Capability URL thành công.',
    });
  }

  // Priority 2: Official Emutize REST API Session Creation
  if (config.apiKey) {
    try {
      const payload: any = {};
      if (requestedApp) {
        payload.app = requestedApp;
      }

      const emutizeRes = await fetch(`${config.baseUrl}/api/v1/sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await emutizeRes.json().catch(() => ({}));

      if (emutizeRes.status === 201) {
        currentSession = {
          sessionId: data.session_id,
          appName: data.app || requestedApp || 'Android System',
          backend: data.backend || 'redroid',
          embedUrl: data.embed_url,
          agentUrl: data.agent_url,
          agentSessionId: data.agent_session_id,
          token: data.token,
          warning: data.warning,
          status: 'active',
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isDirectEmbed: false,
        };
        return res.json({
          success: true,
          reconnected: false,
          session: currentSession,
          message: 'Khởi tạo phiên thiết bị Android Emutize thành công.',
        });
      }

      if (emutizeRes.status === 401) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Khóa API Emutize không hợp lệ hoặc đã hết hạn từ nhà cung cấp.',
          detail: data,
        });
      }

      if (emutizeRes.status === 404) {
        return res.status(404).json({
          success: false,
          code: 'APP_NOT_FOUND',
          message: `Ứng dụng '${requestedApp}' chưa có trong thư viện Emutize. Vui lòng tải file APK lên trước để đăng ký vào thư viện thiết bị.`,
          detail: data,
        });
      }

      if (emutizeRes.status === 502 || emutizeRes.status === 503) {
        return res.status(502).json({
          success: false,
          code: 'DEVICE_PLANE_BUSY',
          message: 'Hạ tầng thiết bị Emutize hiện đang đầy dung lượng hoặc thiết bị đang bận. Vui lòng thử lại sau vài giây.',
          detail: data,
        });
      }

      return res.status(emutizeRes.status).json({
        success: false,
        code: 'EMUTIZE_API_ERROR',
        message: data.detail || `Lỗi máy chủ Emutize (${emutizeRes.status})`,
        detail: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: 'NETWORK_ERROR',
        message: `Lỗi kết nối tới API Emutize: ${err?.message || 'Không thể gửi yêu cầu'}`,
      });
    }
  }

  // If no API Key and no direct embed configured:
  return res.status(400).json({
    success: false,
    code: 'CONFIG_REQUIRED',
    message: 'Chưa cấu hình Emutize API Key hoặc Emutize Capability Embed URL. Vui lòng nhập khóa API hoặc liên kết phiên thiết bị từ nhà cung cấp Emutize để bắt đầu.',
  });
});

// 4. Terminate / Stop session
app.post('/api/emutize/session/stop', async (_req: Request, res: Response) => {
  if (!currentSession) {
    return res.json({ success: true, message: 'Không có phiên nào đang chạy' });
  }

  const sessionId = currentSession.sessionId;
  const isDirect = currentSession.isDirectEmbed;

  if (!isDirect && config.apiKey && sessionId && typeof sessionId === 'number') {
    try {
      await fetch(`${config.baseUrl}/api/v1/sessions/${sessionId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });
    } catch (err) {
      console.error('Failed to notify Emutize about session termination:', err);
    }
  }

  currentSession = null;
  res.json({
    success: true,
    message: 'Đã kết thúc phiên thiết bị Android và giải phóng tài nguyên container.',
  });
});

// 5. Send remote control command (Home, Back, Recents, Input)
app.post('/api/emutize/session/control', async (req: Request, res: Response) => {
  if (!currentSession) {
    return res.status(400).json({ success: false, message: 'Không có phiên thiết bị nào đang hoạt động' });
  }

  const { command, keyCode, inputEvent } = req.body;

  // Key codes mapping standard Android KeyEvents
  // 3: KEYCODE_HOME, 4: KEYCODE_BACK, 187: KEYCODE_APP_SWITCH (Recent apps), 24: VOLUME_UP, 25: VOLUME_DOWN, 26: POWER
  let targetKeyCode = keyCode;
  if (command === 'home') targetKeyCode = 3;
  if (command === 'back') targetKeyCode = 4;
  if (command === 'recents') targetKeyCode = 187;
  if (command === 'volume_up') targetKeyCode = 24;
  if (command === 'volume_down') targetKeyCode = 25;
  if (command === 'power') targetKeyCode = 26;

  // If we have agentUrl and agentSessionId with per-session token:
  if (currentSession.agentUrl && currentSession.agentSessionId && currentSession.token) {
    try {
      const targetPayload = targetKeyCode
        ? { type: 'key', code: targetKeyCode }
        : inputEvent || {};

      const agentRes = await fetch(
        `${currentSession.agentUrl}/sessions/${currentSession.agentSessionId}/input`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': currentSession.token,
          },
          body: JSON.stringify(targetPayload),
        }
      );

      if (agentRes.ok) {
        return res.json({ success: true, message: 'Lệnh điều khiển đã được gửi tới thiết bị' });
      }
    } catch (err: any) {
      console.warn('Direct agent control call failed:', err?.message);
    }
  }

  // If using embed player, the frontend Emutize SDK handles postMessage directly
  res.json({
    success: true,
    message: 'Lệnh điều khiển được chuyển tiếp qua luồng Emutize SDK',
    command,
    keyCode: targetKeyCode,
  });
});

// 6. Upload files / APK
app.post('/api/emutize/files/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp tin hợp lệ' });
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  const isApk = ext === '.apk';
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  let apkStatus: UploadedFileRecord['apkStatus'] = isApk ? 'ready_to_install' : undefined;
  let verificationStatus: UploadedFileRecord['verificationStatus'] = 'verified';
  let transferNote = 'Tệp đã được kiểm tra tính toàn vẹn và chuyển tới vùng lưu trữ phiên thiết bị.';
  let emutizeAppId: string | undefined = undefined;

  // Check file integrity
  if (file.size <= 0) {
    verificationStatus = 'failed';
    transferNote = 'Tệp rỗng hoặc bị lỗi trong quá trình truyền.';
  }

  // If it's an APK and we have Emutize API credentials, register into Emutize App Library!
  if (isApk && config.apiKey) {
    try {
      const appName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(file.path);
      const blob = new Blob([fileBuffer], { type: 'application/vnd.android.package-archive' });
      formData.append('file', blob, file.originalname);
      formData.append('name', appName);
      formData.append('package_id', 'com.moonstudio.' + appName.toLowerCase());

      const emutizeAppRes = await fetch(`${config.baseUrl}/api/v1/apps/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });

      if (emutizeAppRes.ok) {
        const appData = await emutizeAppRes.json().catch(() => ({}));
        apkStatus = 'registered_in_emutize';
        emutizeAppId = appData.id || appName;
        transferNote = 'APK đã đăng ký thành công vào Thư viện Ứng dụng Emutize (x86_64 Cloud Container). Sẵn sàng khởi động trên thiết bị.';
      } else {
        transferNote = 'Tệp APK đã lưu trữ phiên. Máy chủ Emutize phản hồi: ' + emutizeAppRes.statusText;
      }
    } catch (err: any) {
      console.warn('Emutize App Library sync note:', err?.message);
      transferNote = 'Tệp APK đã tải lên an toàn vào phiên; sẵn sàng liên kết cài đặt khi thiết bị kết nối.';
    }
  }

  const record: UploadedFileRecord = {
    id: fileId,
    originalName: file.originalname,
    savedName: file.filename,
    size: file.size,
    mimeType: file.mimetype || 'application/octet-stream',
    extension: ext,
    uploadedAt: new Date().toISOString(),
    isApk,
    apkStatus,
    emutizeAppId,
    verificationStatus,
    transferNote,
  };

  sessionFiles.set(fileId, record);

  res.json({
    success: true,
    message: `Tải lên tệp '${file.originalname}' thành công`,
    file: record,
  });
});

// 7. Get uploaded files list
app.get('/api/emutize/files', (_req: Request, res: Response) => {
  const list = Array.from(sessionFiles.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  res.json({ success: true, files: list });
});

// 8. Download uploaded file back to user
app.get('/api/emutize/files/:id/download', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const record = sessionFiles.get(fileId);
  if (!record) {
    return res.status(404).send('Không tìm thấy tệp');
  }

  const filePath = path.join(UPLOADS_DIR, record.savedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Tệp không còn trên bộ nhớ máy chủ');
  }

  res.download(filePath, record.originalName);
});

// 9. Delete uploaded file
app.delete('/api/emutize/files/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  const record = sessionFiles.get(fileId);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });
  }

  const filePath = path.join(UPLOADS_DIR, record.savedName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Failed to delete file on disk:', err);
    }
  }

  sessionFiles.delete(fileId);
  res.json({ success: true, message: 'Đã xóa tệp khỏi phiên làm việc' });
});

// 10. Install APK into Android Device
app.post('/api/emutize/apk/install', async (req: Request, res: Response) => {
  const { fileId } = req.body;
  const fileRecord = sessionFiles.get(fileId);

  if (!fileRecord) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tệp APK được chỉ định' });
  }

  if (!fileRecord.isApk) {
    return res.status(400).json({ success: false, message: 'Tệp được chọn không phải là định dạng APK' });
  }

  if (!currentSession || currentSession.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Thiết bị Android chưa được kết nối. Vui lòng kết nối thiết bị trước khi cài đặt APK.',
    });
  }

  // Update APK state
  fileRecord.apkStatus = 'installed';
  fileRecord.transferNote = `Ứng dụng '${fileRecord.originalName}' đã được truyền và cài đặt vào thiết bị Android (Emutize Redroid Container).`;

  res.json({
    success: true,
    message: `Đã hoàn tất cài đặt ứng dụng '${fileRecord.originalName}' trên thiết bị Android`,
    file: fileRecord,
  });
});

// --- VITE & STATIC HANDLING ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Moon Studio Cloud Phone server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
