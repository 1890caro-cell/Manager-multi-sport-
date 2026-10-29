'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, AlertCircle, Upload, CheckCircle2, QrCode } from 'lucide-react';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
}

export function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 note
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    // Audio context may require user interaction or not supported
  }
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  isActive,
  onToggleActive,
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const containerId = 'pos-camera-qr-reader';
  const isMountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep latest onScanSuccess in a ref to avoid resetting scanner on parent re-renders
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // Enumerate cameras safely without blocking UI on mount
  const refreshCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!isMountedRef.current) return;
      if (devices && devices.length > 0) {
        const list = devices.map((d, index) => ({
          id: d.id,
          label: d.label || `Camera ${index + 1}`,
        }));
        setCameras(list);
        if (!selectedCameraId) {
          setSelectedCameraId(list[0].id);
        }
      }
    } catch (e) {
      // Permission not yet requested or no device; ignore quietly until user starts scanner
    }
  }, [selectedCameraId]);

  useEffect(() => {
    isMountedRef.current = true;
    refreshCameras();
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshCameras]);

  // Handle stopping the scanner cleanly
  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    const scanner = scannerRef.current;
    if (scanner) {
      isStoppingRef.current = true;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        console.warn('Lỗi khi dừng scanner:', err);
      } finally {
        isStoppingRef.current = false;
      }
    }
  }, []);

  // Handle starting the scanner
  const startScanner = useCallback(async () => {
    if (!isActive || isStartingRef.current || isStoppingRef.current) return;

    try {
      isStartingRef.current = true;
      setStarting(true);
      setError(null);

      // Ensure previous scanner cleared
      await stopScanner();

      if (!document.getElementById(containerId)) {
        isStartingRef.current = false;
        setStarting(false);
        return;
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      // Determine camera identifier or fallback constraint
      const cameraConfig: any = selectedCameraId
        ? selectedCameraId
        : { facingMode: { ideal: 'environment' } };

      await scanner.start(
        cameraConfig,
        config,
        (decodedText) => {
          if (!isMountedRef.current) return;
          setLastScanned(decodedText);
          playBeepSound();
          onScanSuccessRef.current(decodedText);
        },
        () => {
          // Frame without QR, ignore
        },
      );

      // Re-fetch cameras to get human-friendly labels now that permission is granted
      refreshCameras();

      if (isMountedRef.current) {
        setStarting(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Lỗi khi kích hoạt Camera:', err);
        const errMsg = err?.message || String(err);
        if (
          errMsg.includes('NotAllowedError') ||
          errMsg.includes('Permission denied') ||
          errMsg.includes('Permission')
        ) {
          setError(
            'Trình duyệt đang chặn quyền Camera. Hãy nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ URL để Cho phép (Allow) Camera rồi nhấn "Thử lại".',
          );
        } else if (
          errMsg.includes('NotFoundError') ||
          errMsg.includes('DevicesNotFoundError') ||
          errMsg.includes('OverconstrainedError')
        ) {
          setError(
            'Không tìm thấy thiết bị Camera phù hợp. Bạn có thể sử dụng nút "Tải ảnh QR" bên dưới hoặc nhập mã vé thủ công.',
          );
        } else {
          setError(
            errMsg || 'Không thể kết nối Camera. Vui lòng kiểm tra kết nối thiết bị và thử lại.',
          );
        }
        setStarting(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [isActive, selectedCameraId, stopScanner, refreshCameras]);

  // Manage lifecycle driven by isActive and selectedCameraId
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
      setError(null);
    }
  }, [isActive, selectedCameraId, startScanner, stopScanner]);

  // Fallback: Scan QR from uploaded image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStarting(true);
      setError(null);
      await stopScanner();

      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      playBeepSound();
      setLastScanned(decodedText);
      onScanSuccessRef.current(decodedText);
    } catch (err: any) {
      setError('Không thể nhận diện mã QR trong file ảnh này. Vui lòng thử ảnh rõ nét hơn.');
    } finally {
      setStarting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Hidden File Input for QR Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Camera Controls Bar */}
      <div className="flex items-center justify-between w-full mb-3 px-1 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleActive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isActive
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Tắt Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Bật Camera Quét Live</span>
              </>
            )}
          </button>

          {isActive && cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-2.5 py-1.5 text-foreground font-semibold focus:outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Camera Đang Quét
            </span>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
              title="Tải ảnh QR từ máy tính để quét"
            >
              <Upload className="w-3 h-3" />
              <span>Tải ảnh QR</span>
            </button>
          )}
        </div>
      </div>

      {/* Viewfinder Window */}
      <div className="relative w-full aspect-square max-w-sm bg-black rounded-3xl overflow-hidden border-2 border-border shadow-inner flex items-center justify-center">
        {/* html5-qrcode target container */}
        <div
          id={containerId}
          className={`w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-2xl ${
            isActive ? 'block' : 'hidden'
          }`}
        />

        {/* Inactive Placeholder */}
        {!isActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mb-3 text-muted-foreground/80">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-extrabold text-foreground mb-1">Camera đang tắt</h4>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Nhấn nút bên dưới để mở camera quét vé tự động của khách, hoặc tải ảnh QR từ máy.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleActive}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Bật Camera Quét Live</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl border border-border transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay when starting camera */}
        {isActive && starting && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <span className="text-sm font-bold">Đang kết nối Camera...</span>
            <span className="text-[11px] text-gray-400 mt-1">Vui lòng chờ tín hiệu video</span>
          </div>
        )}

        {/* Error overlay (only when active and error occurs) */}
        {isActive && error && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center z-30">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h5 className="text-xs font-bold text-destructive mb-2">Không thể bật Camera</h5>
            <p className="text-xs text-muted-foreground max-w-xs mb-4 leading-relaxed">{error}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
                className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-muted text-foreground text-xs font-semibold rounded-xl border border-border hover:bg-muted/80 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Laser Scanner Reticle Overlay when active */}
        {isActive && !starting && !error && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Corner brackets */}
            <div className="relative w-64 h-64 border-2 border-emerald-500/40 rounded-2xl">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

              {/* Animated laser line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#10b981] top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* Helpful Hint */}
      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        💡 Đưa mã QR vé trên điện thoại vào giữa khung quét hoặc dùng máy quét mã vạch USB/Bluetooth.
      </p>
    </div>
  );
};
