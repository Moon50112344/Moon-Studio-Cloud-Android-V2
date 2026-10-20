export type DeviceStatus =
  | 'idle' // Chưa kết nối
  | 'connecting' // Đang kết nối
  | 'booting' // Đang khởi động
  | 'active' // Đang sử dụng / Đang hoạt động
  | 'disconnected' // Đã mất kết nối
  | 'ended' // Phiên đã kết thúc
  | 'unavailable'; // Không khả dụng

export interface AndroidSession {
  sessionId: string | number;
  appName: string;
  backend: string;
  embedUrl: string;
  agentUrl?: string;
  agentSessionId?: string;
  token?: string;
  status: DeviceStatus;
  startedAt: string;
  lastActiveAt: string;
  warning?: string;
  isDirectEmbed?: boolean;
}

export interface UploadedFile {
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

export interface EmutizeProviderSpecs {
  name: string;
  serviceType: string;
  backendArchitecture: string;
  idleTimeoutMinutes: number;
  streamingProtocol: string;
  containerIsolation: string;
  dataPolicy: string;
  supportedFeatures: string[];
}

export interface EmutizeStatusResponse {
  hasApiKey: boolean;
  hasDirectEmbed: boolean;
  baseUrl: string;
  defaultAppName?: string;
  probeOk: boolean;
  probeMessage: string;
  activeSession: AndroidSession | null;
  provider: EmutizeProviderSpecs;
}
