import React, { useState } from 'react';
import {
  Key,
  Server,
  Link,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface AdminConfigModalProps {
  isOpen: boolean;
  hasApiKey: boolean;
  hasDirectEmbed: boolean;
  baseUrl: string;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  hasApiKey,
  hasDirectEmbed,
  baseUrl,
  onClose,
  onSaved,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>(baseUrl || 'https://app.emutize.com');
  const [directEmbedUrl, setDirectEmbedUrl] = useState<string>('');
  const [appName, setAppName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestStatus(null);

    try {
      // Save configuration on backend server (never on frontend)
      const res = await fetch('/api/emutize/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          baseUrl: serverUrl,
          directEmbedUrl: directEmbedUrl || undefined,
          defaultAppName: appName || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestStatus({
          type: 'success',
          message: 'Cập nhật cấu hình bảo mật thành công! Khóa và tham số đã được lưu tại máy chủ.',
        });
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      } else {
        setTestStatus({
          type: 'error',
          message: data.message || 'Không thể lưu cấu hình Emutize.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Lỗi kết nối: ${err?.message || 'Không thể liên lạc với máy chủ'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0d1629] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#080d1a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#2f8bff]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu hình kết nối Emutize</h3>
              <span className="text-xs text-slate-400">Thông tin xác thực an toàn cấp quản trị</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleTestAndSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status info bar */}
          <div className="p-3.5 bg-[#080d1a] rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 mb-1 text-slate-200 font-semibold">
              <Key className="w-3.5 h-3.5 text-[#2f8bff]" />
              <span>Chính sách bảo mật Emutize & Moon Studio</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Khóa API Key của Emutize (dạng <code className="text-[#2f8bff]">emtz_...</code>) được mã hóa và bảo vệ tại máy chủ backend qua biến môi trường hoặc lưu trữ phiên an toàn. Không bao giờ xuất hiện trên mã nguồn client.
            </p>
          </div>

          {/* Option 1: Emutize API Key */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Emutize API Key (Bearer Token)</span>
              {hasApiKey && (
                <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Đã có khóa trên máy chủ
                </span>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '•••••••••••••••••••••••••• (Nhập lại để thay đổi)' : 'emtz_xxxxxxxxxxxxxxxx'}
              className="w-full bg-[#070b16] border border-slate-700 focus:border-[#2f8bff] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-slate-400 block">
              Dùng để tự động cấp phát container Android qua endpoint <code className="text-slate-300">POST /api/v1/sessions/</code>.
            </span>
          </div>

          {/* Option 2: Emutize Capability Embed URL (Direct Link) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Hoặc: Emutize Capability Embed URL (Tùy chọn)</span>
              {hasDirectEmbed && (
                <span className="text-[10px] text-blue-400 font-normal flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Đang dùng liên kết trực tiếp
                </span>
              )}
            </label>
            <input
              type="text"
              value={directEmbedUrl}
              onChange={(e) => setDirectEmbedUrl(e.target.value)}
              placeholder="https://app.emutize.com/devices/embed/7/?token=..."
              className="w-full bg-[#070b16] border border-slate-700 focus:border-[#2f8bff] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-slate-400 block">
              Nếu bạn đã tạo một phiên thiết bị trên trang quản trị Emutize, bạn có thể dán liên kết Capability URL để mở trực tiếp trên Moon Studio.
            </span>
          </div>

          {/* Emutize Base URL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Máy chủ Emutize (Base URL)</span>
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://app.emutize.com"
              className="w-full bg-[#070b16] border border-slate-700 focus:border-[#2f8bff] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          {/* Default App Name in Library */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200">
              Tên ứng dụng mặc định trong thư viện Emutize (Tùy chọn)
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Tên APK trong library, ví dụ: MoonStudioApp"
              className="w-full bg-[#070b16] border border-slate-700 focus:border-[#2f8bff] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Feedback */}
          {testStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Official Provider Links */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Chưa có tài khoản Emutize?</span>
            <a
              href="https://emutize.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2f8bff] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Xem tài liệu & Đăng ký Emutize</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#2f8bff] hover:from-blue-500 hover:to-blue-400 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lưu & Áp dụng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
