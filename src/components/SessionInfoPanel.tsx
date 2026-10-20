import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  Cpu,
  Layers,
  StopCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AndroidSession, DeviceStatus, EmutizeProviderSpecs } from '../types';

interface SessionInfoPanelProps {
  session: AndroidSession | null;
  status: DeviceStatus;
  providerSpecs?: EmutizeProviderSpecs;
  onEndSessionRequest: () => void;
}

export const SessionInfoPanel: React.FC<SessionInfoPanelProps> = ({
  session,
  status,
  providerSpecs,
  onEndSessionRequest,
}) => {
  const [sessionUptime, setSessionUptime] = useState<string>('00:00:00');
  const [confirmEndModal, setConfirmEndModal] = useState<boolean>(false);

  // Live timer for session uptime
  useEffect(() => {
    if (!session || status !== 'active') {
      setSessionUptime('00:00:00');
      return;
    }

    const startMs = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const hours = Math.floor(diffSec / 3600).toString().padStart(2, '0');
      const mins = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
      const secs = (diffSec % 60).toString().padStart(2, '0');
      setSessionUptime(`${hours}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, status]);

  const getStatusLabel = () => {
    switch (status) {
      case 'active':
        return { text: 'Đang sử dụng', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      case 'connecting':
        return { text: 'Đang kết nối', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
      case 'booting':
        return { text: 'Đang khởi động', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
      case 'disconnected':
        return { text: 'Đã mất kết nối', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
      case 'ended':
        return { text: 'Phiên đã kết thúc', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
      case 'unavailable':
        return { text: 'Không khả dụng', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
      default:
        return { text: 'Chưa kết nối', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };
    }
  };

  const currentStatusInfo = getStatusLabel();

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#2f8bff]" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Thông tin phiên & Hạ tầng
          </h2>
        </div>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${currentStatusInfo.bg} ${currentStatusInfo.color}`}>
          {currentStatusInfo.text}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4 text-xs">
        {/* Session Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#070b16] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Thời gian hoạt động
            </span>
            <span className="text-base font-bold font-mono text-white tracking-wider">
              {sessionUptime}
            </span>
          </div>

          <div className="bg-[#070b16] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Hạn rảnh (Idle Timeout)
            </span>
            <span className="text-base font-bold font-mono text-amber-300">
              {providerSpecs?.idleTimeoutMinutes || 15} phút
            </span>
          </div>
        </div>

        {/* Technical specs */}
        <div className="bg-[#070b16] p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">Hạ tầng Android</span>
            <span className="font-mono text-slate-200 font-semibold">
              {session?.backend || 'Redroid Cloud Container'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">Kiến trúc CPU</span>
            <span className="font-mono text-slate-200">x86_64 Cloud Virtualization</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-400">Nhà cung cấp đám mây</span>
            <span className="font-semibold text-white">Emutize (agent.emutize.com)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Chính sách bộ nhớ</span>
            <span className="text-amber-400 font-medium">Cô lập & Dọn dẹp sau khi thoát</span>
          </div>
        </div>

        {/* Provider policy notice */}
        <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#2f8bff] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Mỗi phiên là một container Android x86_64 riêng biệt. Nhằm bảo đảm an toàn dữ liệu, nhà cung cấp Emutize sẽ hủy container khi hết thời gian chờ hoặc khi người dùng chủ động kết thúc phiên.
          </p>
        </div>

        {/* End Session Button if active */}
        {status === 'active' && (
          <button
            onClick={() => setConfirmEndModal(true)}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-semibold transition flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4 text-rose-400" />
            <span>Kết thúc phiên thiết bị</span>
          </button>
        )}
      </div>

      {/* Confirmation modal before ending session (Requirement 9) */}
      {confirmEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d1629] border border-rose-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận kết thúc phiên</h3>
                <span className="text-xs text-rose-300">Giải phóng tài nguyên Emutize Container</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Bạn có chắc chắn muốn kết thúc phiên làm việc với thiết bị Android hiện tại không?
            </p>

            <div className="bg-[#080d1a] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 mb-5 leading-relaxed">
              <strong className="block mb-1 text-white font-semibold">Lưu ý quan trọng:</strong>
              Theo thiết kế bảo mật của Emutize, container Android sẽ bị đóng và dữ liệu tạm thời chưa được tải về máy của bạn sẽ bị giải phóng.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmEndModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Tiếp tục sử dụng
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmEndModal(false);
                  onEndSessionRequest();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Đồng ý kết thúc phiên</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
