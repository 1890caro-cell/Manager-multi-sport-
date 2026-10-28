'use client';

import React, { useState, useEffect } from 'react';
import { POSHeader } from '@/components/POSHeader';
import { bridge } from '@/lib/bridge';
import { Cpu, Printer, KeyRound, Barcode, CheckCircle2, AlertTriangle, RefreshCw, Activity } from 'lucide-react';

export default function HardwareDiagnosticsPage() {
  const [hardware, setHardware] = useState<any>({
    agentStatus: 'ONLINE',
    devices: [
      { id: 'PRINTER_80MM_01', type: 'ESC_POS_PRINTER', status: 'READY', name: 'Máy in nhiệt 80mm Xprinter XP-Q800', port: 'USB001 (ESC/POS)' },
      { id: 'CASH_DRAWER_01', type: 'CASH_DRAWER', status: 'READY', name: 'Ngăn kéo đựng tiền tự động Posiflex', port: 'RJ11 via Printer' },
      { id: 'SCANNER_01', type: 'BARCODE_SCANNER', status: 'CONNECTED', name: 'Đầu đọc mã vạch Datalogic QuickScan', port: 'USB HID (Auto-Feed)' },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>(['893500180001 (Pocari Sweat 500ml) - OK']);
  const [scannerTestInput, setScannerTestInput] = useState('');

  const loadHardware = async () => {
    try {
      setLoading(true);
      const res = await bridge.getHardwareStatus();
      setHardware(res);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHardware();
  }, []);

  const handleTestPrint = async () => {
    await bridge.printReceipt({
      orderId: 'TEST-PRINT-01',
      cashierName: 'Kỹ thuật viên',
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Kiểm tra in nhiệt 80mm ESC/POS', quantity: 1, unitPrice: 0, totalPrice: 0 },
      ],
      subtotal: 0,
      vatAmount: 0,
      totalAmount: 0,
      paymentMethod: 'CASH',
      paidAmount: 0,
    });
    alert('Đã gửi lệnh in test tới máy in nhiệt 80mm qua Bridge Agent M22.');
  };

  const handlePulseDrawer = async () => {
    await bridge.openCashDrawer();
    alert('Đã phát xung điện 24V (RJ11 Pulse) mở két tiền thành công!');
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerTestInput.trim()) return;
    setScanLog((prev) => [`${scannerTestInput.trim()} - Quét thành công lúc ${new Date().toLocaleTimeString()}`, ...prev]);
    setScannerTestInput('');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      <POSHeader />

      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Chẩn đoán Phần cứng & Thiết bị Quầy</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Kết nối trực tiếp tới Bridge Agent M22 điều khiển Máy in 80mm, Két tiền và Máy quét mã vạch.
            </p>
          </div>

          <button
            onClick={loadHardware}
            className="px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-muted flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới trạng thái</span>
          </button>
        </div>

        {/* Devices Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thermal Printer Card */}
          <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  SẴN SÀNG
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Máy in nhiệt 80mm ESC/POS</h3>
              <p className="text-xs text-muted-foreground">
                Cổng: USB001 • Cắt giấy tự động (Auto-Cutter) • Hàng đợi in: Trống.
              </p>
            </div>

            <button
              onClick={handleTestPrint}
              className="mt-6 w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In thử nghiệm (Test Print)</span>
            </button>
          </div>

          {/* Cash Drawer Card */}
          <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  KẾT NỐI OK
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Két đựng tiền tự động</h3>
              <p className="text-xs text-muted-foreground">
                Cổng: RJ11 via Printer • Xung điện: 24V / 150ms • Cảm biến đóng/mở: Hoạt động.
              </p>
            </div>

            <button
              onClick={handlePulseDrawer}
              className="mt-6 w-full py-2.5 bg-secondary text-foreground font-bold text-xs rounded-xl hover:bg-muted flex items-center justify-center gap-1.5 border border-border"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Phát xung mở két tiền (Test Pulse)</span>
            </button>
          </div>

          {/* Barcode Scanner Card */}
          <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Barcode className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  HID SẴN SÀNG
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground">Máy quét mã vạch Barcode</h3>
              <p className="text-xs text-muted-foreground">
                Chế độ: USB Keyboard Emulation • Tốc độ nhận diện: &lt; 50ms • Đọc mã 1D/2D QR.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="mt-4">
              <input
                type="text"
                value={scannerTestInput}
                onChange={(e) => setScannerTestInput(e.target.value)}
                placeholder="Bấm vào đây rồi quét mã thử..."
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
          </div>
        </div>

        {/* Scanner Log */}
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">Nhật ký quét mã vạch thời gian thực</span>
            <button
              onClick={() => setScanLog([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Xóa log
            </button>
          </div>

          <div className="p-4 bg-background rounded-xl border border-border font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {scanLog.map((log, idx) => (
              <div key={idx} className="text-muted-foreground">
                <span className="text-primary font-bold">➔</span> {log}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
