import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Smartphone,
  Maximize2,
  Minimize2,
  RefreshCw,
  Power,
  Volume2,
  Volume1,
  Keyboard,
  Home,
  ArrowLeft,
  Square,
  AlertCircle,
  Wifi,
  WifiOff,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { AndroidSession, DeviceStatus } from '../types';

declare global {
  interface Window {
    Emutize?: {
      embed: (
        target: HTMLElement | string,
        opts: {
          embedUrl: string;
          width?: string;
          height?: string;
          radius?: string;
        }
      ) => {
        iframe: HTMLIFrameElement;
        on: (event: string, fn: (data: any) => void) => any;
        input: (event: any) => any;
        key: (code: number) => any;
        destroy: () => void;
      };
      version: string;
    };
  }
}

interface AndroidDeviceViewProps {
  session: AndroidSession | null;
  status: DeviceStatus;
  errorMessage?: string;
  onConnectRequest: () => void;
  onDisconnectRequest: () => void;
  onReconnect: () => void;
  onOpenSettings: () => void;
}

export const AndroidDeviceView: React.FC<AndroidDeviceViewProps> = ({
  session,
  status,
  errorMessage,
  onConnectRequest,
  onDisconnectRequest,
  onReconnect,
  onOpenSettings,
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [deviceBootingTimer, setDeviceBootingTimer] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const embedSlotRef = useRef<HTMLDivElement>(null);
  const emutizeInstanceRef = useRef<any>(null);

  // Timer while booting
  useEffect(() => {
    let interval: any = null;
    if (status === 'booting' || status === 'connecting') {
      setDeviceBootingTimer(0);
      interval = setInterval(() => {
        setDeviceBootingTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setDeviceBootingTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Mount Emutize instance or iframe when session is active
  useEffect(() => {
    if (status === 'active' && session?.embedUrl && embedSlotRef.current) {
      setStreamError(false);
      // Clean up previous instance
      if (emutizeInstanceRef.current) {
        try {
          emutizeInstanceRef.current.destroy();
        } catch (e) {
          console.warn('Destroy error:', e);
        }
        emutizeInstanceRef.current = null;
      }
      embedSlotRef.current.innerHTML = '';

      if (window.Emutize && typeof window.Emutize.embed === 'function') {
        try {
          const dev = window.Emutize.embed(embedSlotRef.current, {
            embedUrl: session.embedUrl,
            width: '100%',
            height: '100%',
            radius: '16px',
          });

          dev.on('ready', () => {
            console.log('Emutize real Android device is live and ready');
            setStreamError(false);
          });

          dev.on('ended', (e: any) => {
            console.log('Emutize session ended:', e?.reason);
            setStreamError(true);
          });

          emutizeInstanceRef.current = dev;
        } catch (err) {
          console.error('Emutize SDK embed error, falling back to direct iframe:', err);
          createFallbackIframe(session.embedUrl);
        }
      } else {
        createFallbackIframe(session.embedUrl);
      }
    }

    return () => {
      if (emutizeInstanceRef.current) {
        try {
          emutizeInstanceRef.current.destroy();
        } catch (e) {
          // ignore
        }
        emutizeInstanceRef.current = null;
      }
    };
  }, [status, session?.embedUrl]);

  const createFallbackIframe = (url: string) => {
    if (!embedSlotRef.current) return;
    embedSlotRef.current.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.borderRadius = '16px';
    iframe.style.background = '#060a14';
    iframe.setAttribute('allow', 'clipboard-write; camera; microphone; autoplay');
    iframe.onerror = () => setStreamError(true);
    embedSlotRef.current.appendChild(iframe);
  };

  // Remote key control commands
  const handleKeyCommand = (code: number, name: string) => {
    if (!session || status !== 'active') return;

    if (emutizeInstanceRef.current && typeof emutizeInstanceRef.current.key === 'function') {
      emutizeInstanceRef.current.key(code);
    } else {
      // Direct postMessage to frame
      const iframe = embedSlotRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'emutize:key', code }, '*');
      }
    }

    // Also call server backend if per-session agent is used
    fetch('/api/emutize/session/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyCode: code, command: name }),
    }).catch(() => {});
  };

  // Text input transmission
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || status !== 'active') return;

    if (emutizeInstanceRef.current && typeof emutizeInstanceRef.current.input === 'function') {
      emutizeInstanceRef.current.input({ type: 'text', text: textInput });
    } else {
      const iframe = embedSlotRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'emutize:input', event: { type: 'text', text: textInput } },
          '*'
        );
      }
    }

    setTextInput('');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-[#0b1222] border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Device Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#080d1a] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#2f8bff]" />
            <span className="font-semibold text-white tracking-wide">Thiết bị Android #1</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono text-[11px]">
            {session ? `${session.backend} (x86_64)` : 'Chưa gán container'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {status === 'active' && (
            <>
              <button
                onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition"
                title="Xoay màn hình"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#2f8bff]" />
                <span className="hidden sm:inline">
                  {orientation === 'portrait' ? 'Dọc' : 'Ngang'}
                </span>
              </button>

              <button
                onClick={() => setShowTextInput(!showTextInput)}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                  showTextInput
                    ? 'bg-[#2f8bff]/20 text-[#2f8bff] border-[#2f8bff]/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Bàn phím nhập văn bản"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nhập chữ</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          {status === 'active' ? (
            <button
              onClick={onDisconnectRequest}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium flex items-center gap-1 transition"
              title="Ngắt kết nối phiên"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Ngắt kết nối</span>
            </button>
          ) : (
            <button
              onClick={onConnectRequest}
              disabled={status === 'connecting' || status === 'booting'}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20"
            >
              {status === 'connecting' || status === 'booting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kết nối...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Kết nối thiết bị</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Screen Area */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-5 min-h-[460px] md:min-h-[580px] bg-[#070b16]">
        {/* State 1: Active Connected State -> Live Android Screen */}
        {status === 'active' && session && !streamError && (
          <div
            className={`relative mx-auto transition-all duration-300 shadow-2xl rounded-2xl p-2 bg-[#0d1629] border border-slate-700/80 ${
              orientation === 'portrait'
                ? 'w-full max-w-[380px] h-[580px] sm:h-[640px]'
                : 'w-full max-w-[680px] h-[400px] sm:h-[460px]'
            }`}
          >
            {/* Device screen slot where Emutize embeds */}
            <div
              ref={embedSlotRef}
              className="w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-inner"
            >
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#2f8bff]" />
                <span className="text-xs">Đang truyền phát màn hình từ Emutize...</span>
              </div>
            </div>

            {/* Hardware buttons toolbar on device side / bottom */}
            <div className="mt-2.5 flex items-center justify-center gap-8 py-1.5 bg-[#080d1a] rounded-xl border border-slate-800 text-slate-400">
              <button
                onClick={() => handleKeyCommand(4, 'back')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
                title="Quay lại (Back - Key 4)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleKeyCommand(3, 'home')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
                title="Màn hình chính (Home - Key 3)"
              >
                <Home className="w-4 h-4 text-[#2f8bff]" />
              </button>

              <button
                onClick={() => handleKeyCommand(187, 'recents')}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
                title="Đa nhiệm (Recent Apps - Key 187)"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* State 2: Connecting / Booting State */}
        {(status === 'connecting' || status === 'booting') && (
          <div className="flex flex-col items-center justify-center max-w-md text-center p-6 bg-[#0d1629]/90 border border-blue-500/30 rounded-2xl shadow-xl">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2f8bff] animate-spin" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#080d1a] border border-blue-400 text-blue-300">
                {deviceBootingTimer}s
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">
              {status === 'booting' ? 'Đang khởi động máy ảo Android...' : 'Đang thiết lập phiên Emutize...'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm">
              Hạ tầng Emutize đang cấp phát container Redroid (x86_64) và khởi chạy luồng truyền phát video thời gian thực.
            </p>

            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mb-2">
              <div className="bg-gradient-to-r from-blue-600 to-[#2f8bff] h-full w-2/3 animate-pulse rounded-full"></div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Thời gian khởi tạo tiêu chuẩn: ~10 - 20 giây
            </span>
          </div>
        )}

        {/* State 3: Disconnected / Error State (EXACT Vietnamese string requirement) */}
        {(status === 'disconnected' || status === 'unavailable' || status === 'ended' || streamError) && (
          <div className="flex flex-col items-center justify-center max-w-lg text-center p-6 bg-[#0d1629] border border-rose-500/30 rounded-2xl shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3.5">
              <WifiOff className="w-7 h-7 text-rose-400" />
            </div>

            {/* STRICT REQUIREMENT: "Không thể kết nối thiết bị Android. Vui lòng kiểm tra trạng thái Emutize hoặc thử kết nối lại." */}
            <h3 className="text-sm sm:text-base font-bold text-rose-300 mb-2">
              Không thể kết nối thiết bị Android. Vui lòng kiểm tra trạng thái Emutize hoặc thử kết nối lại.
            </h3>

            {errorMessage && (
              <p className="text-xs text-slate-400 bg-[#080d1a] border border-slate-800 p-2.5 rounded-lg mb-4 text-left w-full font-mono">
                {errorMessage}
              </p>
            )}

            <p className="text-xs text-slate-400 mb-5">
              Phiên thiết bị có thể đã hết hạn (15 phút rảnh), chưa được cấp quyền qua khóa API Emutize, hoặc liên kết nhúng cần được khởi tạo lại.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onReconnect}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử kết nối lại</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              >
                Kiểm tra cấu hình Emutize
              </button>
            </div>
          </div>
        )}

        {/* State 4: Idle / Chưa kết nối */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center max-w-md text-center p-6 sm:p-8 bg-[#0d1629] border border-slate-800 rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#2f8bff]/10 border border-[#2f8bff]/30 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-[#2f8bff]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              Thiết bị Android Cloud sẵn sàng
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Nhấn nút kết nối bên dưới để đọc xác nhận bảo mật dữ liệu và khởi động thiết bị Android thực tế trên nền tảng đám mây Emutize.
            </p>

            <button
              onClick={onConnectRequest}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#2f8bff] hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <Wifi className="w-4 h-4" />
              <span>Bắt đầu kết nối thiết bị Android</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating text input bar when enabled */}
      {showTextInput && status === 'active' && (
        <div className="p-3 bg-[#080d1a] border-t border-slate-800 flex items-center gap-2">
          <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập nội dung văn bản muốn gửi vào ô nhập liệu của Android..."
              className="flex-1 bg-[#0d1629] border border-slate-700 focus:border-[#2f8bff] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#2f8bff] hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

      {/* Device Hardware Controls Bottom Bar */}
      {status === 'active' && (
        <div className="px-4 py-2 bg-[#080d1a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Trực tiếp từ Emutize Agent</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleKeyCommand(24, 'volume_up')}
              className="hover:text-white transition flex items-center gap-1"
              title="Tăng âm lượng (Key 24)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Âm lượng +</span>
            </button>
            <button
              onClick={() => handleKeyCommand(25, 'volume_down')}
              className="hover:text-white transition flex items-center gap-1"
              title="Giảm âm lượng (Key 25)"
            >
              <Volume1 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Âm lượng -</span>
            </button>
            <button
              onClick={() => handleKeyCommand(26, 'power')}
              className="hover:text-amber-400 transition flex items-center gap-1"
              title="Khóa/Bật màn hình (Power - Key 26)"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nguồn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
