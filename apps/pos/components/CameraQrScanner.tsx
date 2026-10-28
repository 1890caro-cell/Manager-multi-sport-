'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

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

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'pos-camera-qr-reader';
  const isMountedRef = useRef(true);

  // Initialize camera list
  useEffect(() => {
    isMountedRef.current = true;
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMountedRef.current) return;
        if (devices && devices.length > 0) {
          const list = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }));
          setCameras(list);
          setSelectedCameraId(list[0].id);
        } else {
          setError('Không tìm thấy thiết bị camera trên máy tính.');
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        console.warn('Lỗi kiểm tra camera:', err);
        setError('Vui lòng cấp quyền truy cập Camera trong trình duyệt để quét QR.');
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Manage scanner lifecycle
  useEffect(() => {
    if (!isActive) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {});
          }
        } catch {}
      }
      return;
    }

    let isSubscribed = true;
    setStarting(true);
    setError(null);

    const initScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(containerId);
        }

        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const cameraIdOrConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        await scanner.start(
          cameraIdOrConfig,
          config,
          (decodedText) => {
            if (!isSubscribed) return;
            playBeepSound();
            onScanSuccess(decodedText);
          },
          () => {
            // Frame did not contain a QR, keep looking
          },
        );

        if (isSubscribed) {
          setStarting(false);
        }
      } catch (err: any) {
        if (isSubscribed) {
          console.error('Lỗi khởi động camera scanner:', err);
          setError(
            err.message ||
              'Không thể kích hoạt Camera. Vui lòng kiểm tra quyền truy cập camera của trình duyệt.',
          );
          setStarting(false);
        }
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, [isActive, selectedCameraId, onScanSuccess]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Camera Controls Bar */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
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

        {isActive && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Camera Đang Quét
          </span>
        )}
      </div>

      {/* Viewfinder Window */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-2 border-border shadow-inner flex items-center justify-center">
        {/* html5-qrcode target container */}
        <div
          id={containerId}
          className={`w-full h-full overflow-hidden ${isActive ? 'block' : 'hidden'}`}
        />

        {/* Inactive Placeholder */}
        {!isActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/40 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-bold text-foreground">Camera đang tắt</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
              Bấm nút <strong className="text-primary font-semibold">&ldquo;Bật Camera Quét Live&rdquo;</strong> ở trên để sử dụng webcam hoặc máy quét camera nhận diện vé.
            </p>
          </div>
        )}

        {/* Loading overlay when starting camera */}
        {isActive && starting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mb-2" />
            <span className="text-xs font-bold">Đang kết nối Camera...</span>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center z-30">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-xs font-bold text-destructive max-w-xs mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null);
                onToggleActive();
              }}
              className="px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Laser Scanner Reticle Overlay when active */}
        {isActive && !starting && !error && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Corner brackets */}
            <div className="relative w-64 h-64 border-2 border-primary/40 rounded-2xl">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

              {/* Animated laser line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_8px_#10b981] top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
