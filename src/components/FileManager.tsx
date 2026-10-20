import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  FileArchive,
  Image,
  Music,
  Video,
  FileCode,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  PlayCircle,
  Loader2,
  HardDrive,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { UploadedFile, DeviceStatus } from '../types';

interface FileManagerProps {
  deviceStatus: DeviceStatus;
  onRefreshDevice?: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  deviceStatus,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [apkInstallingId, setApkInstallingId] = useState<string | null>(null);
  const [confirmApkModal, setConfirmApkModal] = useState<UploadedFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/emutize/files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadSingleFile(selectedFiles[i]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadSingleFile = async (file: File) => {
    // Check 200MB limit
    if (file.size > 200 * 1024 * 1024) {
      setUploadFeedback({
        type: 'error',
        message: `Tệp '${file.name}' vượt quá giới hạn dung lượng 200MB cho phép của nhà cung cấp.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress progression for UX realism
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 250);

      const res = await fetch('/api/emutize/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadFeedback({
          type: 'success',
          message: data.message || `Đã chuyển tệp '${file.name}' tới thiết bị thành công.`,
        });
        await fetchFiles();
      } else {
        setUploadFeedback({
          type: 'error',
          message: data.message || 'Lỗi khi tải tệp lên hệ thống Emutize.',
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: `Lỗi kết nối khi truyền tệp: ${err?.message || 'Đường truyền gián đoạn'}`,
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  const handleDownload = (file: UploadedFile) => {
    window.location.href = `/api/emutize/files/${file.id}/download`;
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tệp '${file.originalName}' khỏi phiên làm việc không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/emutize/files/${file.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleInstallApk = async (file: UploadedFile) => {
    setConfirmApkModal(null);
    setApkInstallingId(file.id);

    try {
      const res = await fetch('/api/emutize/apk/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadFeedback({
          type: 'success',
          message: data.message || `Cài đặt ${file.originalName} thành công trên Android.`,
        });
        await fetchFiles();
      } else {
        setUploadFeedback({
          type: 'error',
          message: data.message || 'Không thể cài đặt APK lên thiết bị.',
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: `Lỗi khi gửi lệnh cài đặt APK: ${err?.message || 'Lỗi hệ thống'}`,
      });
    } finally {
      setApkInstallingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: UploadedFile) => {
    const ext = file.extension.toLowerCase();
    if (ext === '.apk') return <PlayCircle className="w-4 h-4 text-emerald-400" />;
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext))
      return <Image className="w-4 h-4 text-purple-400" />;
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext))
      return <Music className="w-4 h-4 text-pink-400" />;
    if (['.mp4', '.mkv', '.webm'].includes(ext))
      return <Video className="w-4 h-4 text-cyan-400" />;
    if (['.zip', '.rar', '.tar', '.gz', '.7z'].includes(ext))
      return <FileArchive className="w-4 h-4 text-amber-400" />;
    if (['.json', '.xml', '.csv', '.js', '.ts'].includes(ext))
      return <FileCode className="w-4 h-4 text-indigo-400" />;
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-[#080d1a] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-5 h-5 text-[#2f8bff]" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Quản lý tệp thiết bị
            </h2>
            <span className="text-xs text-slate-400">
              Hỗ trợ truyền tệp & cài đặt APK tới máy ảo Emutize (Tối đa 200MB/tệp)
            </span>
          </div>
        </div>

        <button
          onClick={fetchFiles}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          title="Làm mới danh sách tệp"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4 flex-1">
        {/* Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              uploadSingleFile(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-slate-700 hover:border-[#2f8bff]/60 bg-[#070b16]/60 hover:bg-[#070b16] rounded-xl p-5 text-center cursor-pointer transition group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <div className="w-10 h-10 rounded-xl bg-[#2f8bff]/10 border border-[#2f8bff]/30 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition">
            <UploadCloud className="w-5 h-5 text-[#2f8bff]" />
          </div>
          <p className="text-xs font-semibold text-white group-hover:text-[#2f8bff] transition">
            Nhấp hoặc kéo thả tệp vào đây để tải lên thiết bị
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
            Hỗ trợ APK (cài đặt ứng dụng), PDF, DOC, DOCX, XLS, CSV, JSON, ZIP, hình ảnh (PNG, JPG), âm thanh, video...
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
            <span>Dung lượng tối đa: 200MB</span>
            <span>&bull;</span>
            <span>Xác minh mã checksum tự động</span>
          </div>
        </div>

        {/* Progress Bar when uploading */}
        {isUploading && (
          <div className="bg-[#080d1a] border border-blue-500/30 p-3 rounded-xl animate-fade-in">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2f8bff]" />
                Đang truyền tải tệp tới vùng lưu trữ máy ảo...
              </span>
              <span className="font-mono text-blue-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-[#2f8bff] h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Feedback message banner */}
        {uploadFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              uploadFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {uploadFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{uploadFeedback.message}</p>
            </div>
          </div>
        )}

        {/* Files List Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#070b16]">
          <div className="px-4 py-2.5 bg-[#080d1a] border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Danh sách tệp trong phiên ({files.length})</span>
            <span className="font-mono text-[10px] text-slate-500">Tự xóa khi phiên kết thúc</span>
          </div>

          {files.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <HardDrive className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              Chưa có tệp nào được tải lên trong phiên làm việc này.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-800/30 transition"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-slate-200 truncate max-w-xs" title={file.originalName}>
                          {file.originalName}
                        </p>
                        {file.isApk && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            APK
                          </span>
                        )}
                        {file.verificationStatus === 'verified' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                            Đã xác minh
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                        {formatFileSize(file.size)} &bull; {file.transferNote}
                      </p>
                    </div>
                  </div>

                  {/* Actions for file */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* APK Install button */}
                    {file.isApk && (
                      <button
                        onClick={() => setConfirmApkModal(file)}
                        disabled={apkInstallingId === file.id || deviceStatus !== 'active'}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 transition ${
                          deviceStatus === 'active'
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
                        }`}
                        title={
                          deviceStatus === 'active'
                            ? 'Cài đặt APK lên thiết bị Android'
                            : 'Cần kết nối thiết bị Android trước khi cài đặt'
                        }
                      >
                        {apkInstallingId === file.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Đang cài...</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Cài đặt APK</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      title="Tải tệp về máy tính"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* APK Installation Confirmation Modal */}
      {confirmApkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0d1629] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận cài đặt APK</h3>
                <span className="text-xs text-slate-400">Emutize Cloud Android Container</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Bạn đang yêu cầu cài đặt ứng dụng <strong className="text-white font-mono">{confirmApkModal.originalName}</strong> lên thiết bị Android đám mây đang chạy.
            </p>

            <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-3 text-xs text-slate-400 mb-5 space-y-1.5 font-mono">
              <div>Dung lượng: {formatFileSize(confirmApkModal.size)}</div>
              <div>Kiến trúc tương thích: x86_64 / Universal</div>
              <div>Cơ chế: Chuyển gói tin tới Redroid subsystem</div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmApkModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleInstallApk(confirmApkModal)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Tiến hành cài đặt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
