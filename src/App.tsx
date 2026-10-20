import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProviderNotice } from './components/ProviderNotice';
import { DataWarningModal } from './components/DataWarningModal';
import { AndroidDeviceView } from './components/AndroidDeviceView';
import { FileManager } from './components/FileManager';
import { SessionInfoPanel } from './components/SessionInfoPanel';
import { AdminConfigModal } from './components/AdminConfigModal';
import { TroubleshootingModal } from './components/TroubleshootingModal';
import { AndroidSession, DeviceStatus, EmutizeProviderSpecs } from './types';

export default function App() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('idle');
  const [session, setSession] = useState<AndroidSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [providerSpecs, setProviderSpecs] = useState<EmutizeProviderSpecs | undefined>(undefined);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [hasDirectEmbed, setHasDirectEmbed] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('https://app.emutize.com');
  const [probeOk, setProbeOk] = useState<boolean>(false);
  const [probeMessage, setProbeMessage] = useState<string>('');

  // Modals
  const [isWarningModalOpen, setIsWarningModalOpen] = useState<boolean>(false);
  const [isAdminConfigOpen, setIsAdminConfigOpen] = useState<boolean>(false);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState<boolean>(false);

  // Fetch initial Emutize status
  const checkEmutizeStatus = async () => {
    try {
      const res = await fetch('/api/emutize/status');
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
      setHasDirectEmbed(data.hasDirectEmbed);
      setBaseUrl(data.baseUrl || 'https://app.emutize.com');
      setProbeOk(data.probeOk);
      setProbeMessage(data.probeMessage);
      setProviderSpecs(data.provider);

      if (data.activeSession) {
        setSession(data.activeSession);
        setDeviceStatus(data.activeSession.status);
      }
    } catch (err: any) {
      console.error('Failed to probe Emutize status:', err);
      setProbeMessage('Không thể kết nối đến máy chủ trung gian');
    }
  };

  useEffect(() => {
    checkEmutizeStatus();
  }, []);

  // User clicked "Kết nối thiết bị Android"
  const handleConnectRequest = () => {
    // Show mandatory data warning dialog first (Requirement 5)
    setIsWarningModalOpen(true);
  };

  // User confirmed data warning dialog: "Tôi đã hiểu — Tiếp tục"
  const handleWarningConfirmed = async () => {
    setIsWarningModalOpen(false);
    setDeviceStatus('connecting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/emutize/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok && data.success && data.session) {
        setSession(data.session);
        setDeviceStatus('booting');

        // Emutize container boots up within a few seconds
        setTimeout(() => {
          setDeviceStatus('active');
        }, 3000);
      } else {
        setDeviceStatus('disconnected');
        setErrorMessage(data.message || 'Không thể cấp phát phiên thiết bị từ Emutize.');
      }
    } catch (err: any) {
      setDeviceStatus('disconnected');
      setErrorMessage(err?.message || 'Lỗi mạng khi kết nối tới dịch vụ Emutize.');
    }
  };

  // User canceled data warning: "Quay lại"
  const handleWarningCancelled = () => {
    setIsWarningModalOpen(false);
    // Don't start session
  };

  // Disconnect / stop session
  const handleDisconnect = async () => {
    try {
      await fetch('/api/emutize/session/stop', { method: 'POST' });
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
    setSession(null);
    setDeviceStatus('ended');
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <Header
        status={deviceStatus}
        hasConfig={hasApiKey || hasDirectEmbed}
        onOpenSettings={() => setIsAdminConfigOpen(true)}
        onOpenTroubleshoot={() => setIsTroubleshootOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        {/* Mandatory Emutize Provider Disclosure Notice (Requirement 4) */}
        <ProviderNotice />

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left / Main Column: The Single Android Device View (Requirement 3 & 6) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-5">
            <AndroidDeviceView
              session={session}
              status={deviceStatus}
              errorMessage={errorMessage}
              onConnectRequest={handleConnectRequest}
              onDisconnectRequest={handleDisconnect}
              onReconnect={handleConnectRequest}
              onOpenSettings={() => setIsAdminConfigOpen(true)}
            />

            {/* Quick Helper Tips */}
            <div className="p-4 bg-[#0b1222] border border-slate-800 rounded-xl text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2f8bff]"></span>
                <span>Thao tác cảm ứng: Nhấp để chạm (tap), bấm giữ và kéo để vuốt (swipe).</span>
              </div>
              <button
                onClick={() => setIsTroubleshootOpen(true)}
                className="text-[#2f8bff] hover:underline font-medium shrink-0"
              >
                Xem tài liệu Emutize
              </button>
            </div>
          </div>

          {/* Right Column: File Manager & Session Information (Requirement 7, 8, 9) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-5">
            {/* Session Info & Infrastructure Specs */}
            <SessionInfoPanel
              session={session}
              status={deviceStatus}
              providerSpecs={providerSpecs}
              onEndSessionRequest={handleDisconnect}
            />

            {/* File Management & APK Installer */}
            <FileManager
              deviceStatus={deviceStatus}
              onRefreshDevice={() => {}}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080d1a] py-4 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-300">
              <span className="text-white">Moon </span>
              <span className="text-[#2f8bff]">Studio</span>
              <span className="text-slate-400 font-normal ml-1">Cloud Phone</span>
            </span>
            <span className="mx-2 text-slate-600">&bull;</span>
            <span>Hạ tầng Android đám mây được tích hợp từ Emutize</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Redroid Cloud Engine</span>
            <span>&bull;</span>
            <span>Bảo mật dữ liệu phiên</span>
          </div>
        </div>
      </footer>

      {/* Mandatory Data Warning Modal (Requirement 5) */}
      <DataWarningModal
        isOpen={isWarningModalOpen}
        onConfirm={handleWarningConfirmed}
        onCancel={handleWarningCancelled}
      />

      {/* Admin Emutize Configuration Modal */}
      <AdminConfigModal
        isOpen={isAdminConfigOpen}
        hasApiKey={hasApiKey}
        hasDirectEmbed={hasDirectEmbed}
        baseUrl={baseUrl}
        onClose={() => setIsAdminConfigOpen(false)}
        onSaved={checkEmutizeStatus}
      />

      {/* Troubleshooting & Guide Modal */}
      <TroubleshootingModal
        isOpen={isTroubleshootOpen}
        onClose={() => setIsTroubleshootOpen(false)}
        probeOk={probeOk}
        probeMessage={probeMessage}
      />
    </div>
  );
}
