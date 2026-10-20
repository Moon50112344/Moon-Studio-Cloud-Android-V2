import React from 'react';
import { Info, Server, Cpu } from 'lucide-react';

export const ProviderNotice: React.FC = () => {
  return (
    <div className="w-full bg-[#0d1629] border border-blue-900/40 rounded-xl p-3.5 sm:p-4 text-slate-300 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2f8bff]/10 border border-[#2f8bff]/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Server className="w-4 h-4 text-[#2f8bff]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white tracking-wide">
                Máy ảo Android được cung cấp bởi Emutize.
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-[#2f8bff] border border-[#2f8bff]/20 font-medium">
                Powered by Emutize
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hạ tầng Android đám mây độc lập chạy trên kiến trúc Redroid container (x86_64), kết nối truyền trực tiếp qua giao thức Emutize Player.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] text-slate-400 font-mono shrink-0">
          <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Cpu className="w-3 h-3 text-slate-400" /> Redroid x86_64
          </span>
          <span className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
            <Info className="w-3 h-3 text-[#2f8bff]" /> 1 Device / Session
          </span>
        </div>
      </div>
    </div>
  );
};
