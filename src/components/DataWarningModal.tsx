import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface DataWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DataWarningModal: React.FC<DataWarningModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-labelledby="warning-modal-title"
        className="w-full max-w-lg bg-[#0d1629] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 id="warning-modal-title" className="text-lg font-bold text-white tracking-tight">
              Lưu ý về dữ liệu máy ảo
            </h3>
            <span className="text-xs text-amber-300 font-medium">
              Thông báo an toàn bắt buộc trước khi kết nối thiết bị
            </span>
          </div>
        </div>

        {/* Content - EXACT TEXT REQUIRED BY SPEC */}
        <div className="px-6 py-5 space-y-4 text-slate-300 text-sm leading-relaxed">
          <p className="bg-[#080d1a] p-3.5 rounded-xl border border-slate-800 text-slate-200">
            Thiết bị Android này được cung cấp thông qua Emutize. Dữ liệu, ứng dụng, tệp đã tải lên và các thay đổi trên máy ảo có thể bị xóa khi phiên kết thúc hoặc theo chính sách lưu trữ của nhà cung cấp.
          </p>

          <p className="font-medium text-amber-200 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
            Không sử dụng máy ảo để lưu trữ dữ liệu quan trọng. Hãy tải các tệp cần thiết về thiết bị của bạn trước khi kết thúc phiên.
          </p>

          <p className="text-slate-400 text-xs italic">
            Moon Studio không đảm bảo dữ liệu sẽ được lưu giữ sau khi phiên máy ảo kết thúc.
          </p>

          {/* Emutize verified lifecycle spec summary */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Tự ngắt sau 15 phút rảnh</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Container cô lập từng phiên</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - EXACT LABELS REQUIRED BY SPEC */}
        <div className="bg-[#080d1a] border-t border-slate-800 px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#2f8bff] hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tôi đã hiểu — Tiếp tục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
