import React from 'react';
import {
  HelpCircle,
  X,
  ShieldCheck,
  Server,
  FileCode,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  probeOk: boolean;
  probeMessage: string;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({
  isOpen,
  onClose,
  probeOk,
  probeMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0d1629] border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#080d1a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#2f8bff]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hướng dẫn kết nối & Xử lý sự cố</h3>
              <span className="text-xs text-slate-400">Tài liệu tích hợp chính thức Emutize Cloud Phone</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Diagnostic status banner */}
          <div className="p-3.5 bg-[#080d1a] rounded-xl border border-slate-800 flex items-start gap-3">
            {probeOk ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-white">Trạng thái kết nối máy chủ Emutize:</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{probeMessage}</p>
            </div>
          </div>

          {/* Issue 1: Không thể kết nối thiết bị Android */}
          <div className="bg-[#070b16] p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#2f8bff] flex items-center justify-center text-xs font-mono">1</span>
              Lỗi: "Không thể kết nối thiết bị Android. Vui lòng kiểm tra trạng thái Emutize hoặc thử kết nối lại"
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Lỗi này xuất hiện khi máy chủ Emutize từ chối yêu cầu do chưa có Khóa API (Bearer Token) hoặc khóa đã hết hạn, hoặc khi đường truyền phiên bị gián đoạn.
            </p>
            <div className="bg-[#0b1222] p-2.5 rounded-lg border border-slate-800 text-slate-300">
              <strong className="text-[#2f8bff]">Cách khắc phục:</strong> Nhấp vào nút <strong>"Cấu hình Emutize"</strong> ở góc trên bên phải, nhập API Key do Emutize cấp hoặc dán liên kết Capability Embed URL trực tiếp từ trang thiết bị.
            </div>
          </div>

          {/* Issue 2: Iframe bị chặn CSP frame-ancestors */}
          <div className="bg-[#070b16] p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#2f8bff] flex items-center justify-center text-xs font-mono">2</span>
              Quy tắc bảo mật CSP (`frame-ancestors`) của Emutize
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Theo tài liệu chính thức của Emutize (mục <code className="text-blue-300">Embedding guide</code>), máy chủ nhúng gửi tiêu đề <code className="text-slate-200">Content-Security-Policy: frame-ancestors</code>.
            </p>
            <div className="bg-[#0b1222] p-2.5 rounded-lg border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
              Nếu màn hình hiển thị trắng hoặc từ chối kết nối, quản trị viên Emutize cần thêm tên miền trang web của Moon Studio vào biến môi trường <span className="text-amber-300">EMBED_FRAME_ANCESTORS</span> của hệ thống Emutize.
            </div>
          </div>

          {/* Issue 3: Cài đặt tệp APK */}
          <div className="bg-[#070b16] p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#2f8bff] flex items-center justify-center text-xs font-mono">3</span>
              Yêu cầu tệp APK khi cài đặt
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Emutize chạy hạ tầng Android trên nền container Redroid kiến trúc <strong className="text-white">x86_64</strong>. Tệp APK tải lên cần hỗ trợ ABI x86_64 hoặc APK Universal để khởi chạy trơn tru với hiệu năng tối đa.
            </p>
          </div>

          {/* Issue 4: Chính sách xóa dữ liệu 15 phút */}
          <div className="bg-[#070b16] p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#2f8bff] flex items-center justify-center text-xs font-mono">4</span>
              Thời hạn rảnh (Idle Timeout 15 phút) & Bảo mật dữ liệu
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Nếu bạn không tương tác với màn hình trong vòng 15 phút, hạ tầng Emutize sẽ tự động thu hồi container để tiết kiệm tài nguyên. Luôn tải về các tệp dữ liệu quan trọng trước khi rời khỏi phiên.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#080d1a] border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <a
            href="https://emutize.com/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#2f8bff] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Tài liệu chính thức Emutize Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
