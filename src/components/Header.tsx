import React from 'react';
import { Smartphone, ShieldCheck, Settings, ExternalLink, HelpCircle } from 'lucide-react';
import { DeviceStatus } from '../types';

interface HeaderProps {
  status: DeviceStatus;
  hasConfig: boolean;
  onOpenSettings: () => void;
  onOpenTroubleshoot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  hasConfig,
  onOpenSettings,
  onOpenTroubleshoot,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Đang hoạt động
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Đang kết nối
          </span>
        );
      case 'booting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-[#2f8bff] border border-[#2f8bff]/30">
            <span className="w-2 h-2 rounded-full bg-[#2f8bff] animate-pulse"></span>
            Đang khởi động
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Mất kết nối
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Phiên đã kết thúc
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Không khả dụng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Chưa kết nối
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080d1a]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity - STRICTLY follows: Moon Studio, Moon in white, Studio in #2f8bff, same line */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#131f3d] to-[#0c1427] border border-slate-700/80 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-[#2f8bff]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
                <span className="text-white">Moon </span>
                <span className="text-[#2f8bff]">Studio</span>
                <span className="text-slate-300 font-medium ml-1.5 text-base sm:text-lg">Cloud Phone</span>
              </h1>
            </div>
          </div>

          {/* Powered by Emutize Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2f8bff]" />
            <span>Powered by <strong className="text-white font-semibold">Emutize</strong></span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:block">
            {getStatusBadge()}
          </div>

          <button
            onClick={onOpenTroubleshoot}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium transition flex items-center gap-1.5"
            title="Hướng dẫn & Xử lý sự cố"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Trợ giúp</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              hasConfig
                ? 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
                : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 animate-pulse'
            }`}
            title="Cấu hình Emutize"
          >
            <Settings className="w-4 h-4 text-[#2f8bff]" />
            <span className="hidden sm:inline">{hasConfig ? 'Cấu hình Emutize' : 'Cần cấu hình'}</span>
          </button>

          <a
            href="https://emutize.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-[#2f8bff] transition ml-1"
          >
            <span>emutize.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
