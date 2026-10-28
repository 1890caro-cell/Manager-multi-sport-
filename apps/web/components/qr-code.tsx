'use client';

import React from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  expiresInSeconds?: number;
  onRefresh?: () => void;
  showCopy?: boolean;
}

export function QrCodeDisplay({
  value,
  size = 220,
  label,
  sublabel,
  expiresInSeconds,
  onRefresh,
  showCopy = true,
}: QrCodeProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate an SVG QR-like pattern based on string hash for deterministic visual display
  // Or encode as an SVG with standard squares
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value,
  )}&margin=10`;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="relative group p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImageUrl}
          alt={label || 'QR Code'}
          width={size}
          height={size}
          className="rounded-lg object-contain"
          loading="eager"
        />
        {expiresInSeconds !== undefined && expiresInSeconds > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
            {expiresInSeconds}s
          </div>
        )}
      </div>

      {label && <p className="mt-3 font-semibold text-slate-900 text-sm">{label}</p>}
      {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}

      <div className="mt-3 flex items-center gap-2">
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới QR</span>
          </button>
        )}
      </div>
    </div>
  );
}
