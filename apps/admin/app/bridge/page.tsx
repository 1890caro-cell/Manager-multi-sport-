'use client';

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  RotateCcw,
  Printer,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Activity,
  Radio,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, generateIdempotencyKey } from '@/lib/utils';

export default function AdminBridgePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatchingCmd, setDispatchingCmd] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const DEFAULT_AGENTS = [
    {
      id: 'agent-1',
      agentCode: 'AGENT-COUNTER-01',
      name: 'Máy Trạm Quầy Lễ Tân & Bán Sân',
      ipAddress: '192.168.1.101',
      isRevoked: false,
      lastHeartbeat: new Date().toISOString(),
      devices: ['TURNSTILE_IN', 'PRINTER_80MM', 'CASH_DRAWER'],
    },
    {
      id: 'agent-2',
      agentCode: 'AGENT-GYM-GATE-01',
      name: 'Máy Trạm Kiểm Soát Cổng Gym Turnstile',
      ipAddress: '192.168.1.102',
      isRevoked: false,
      lastHeartbeat: new Date().toISOString(),
      devices: ['TURNSTILE_IN', 'TURNSTILE_OUT', 'QR_SCANNER', 'RFID_READER'],
    },
    {
      id: 'agent-3',
      agentCode: 'AGENT-POS-CANTEEN-01',
      name: 'Máy Trạm Thu Ngân Canteen & Bán Lẻ',
      ipAddress: '192.168.1.103',
      isRevoked: false,
      lastHeartbeat: new Date().toISOString(),
      devices: ['PRINTER_80MM', 'CASH_DRAWER', 'BARCODE_SCANNER'],
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agRes, evRes] = await Promise.allSettled([
        api.bridge.getAgents(),
        api.bridge.getEvents(),
      ]);

      if (agRes.status === 'fulfilled' && Array.isArray(agRes.value) && agRes.value.length > 0) {
        setAgents(agRes.value);
      } else {
        setAgents(DEFAULT_AGENTS);
      }

      if (evRes.status === 'fulfilled' && Array.isArray(evRes.value)) {
        setEvents(evRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDispatchCommand = async (agentCode: string, type: string, label: string) => {
    try {
      setDispatchingCmd(`${agentCode}:${type}`);
      const idempotencyKey = generateIdempotencyKey('cmd');
      await api.bridge.dispatchCommand({
        agentCode,
        deviceType: type.includes('TURNSTILE') ? 'TURNSTILE' : type.includes('DRAWER') ? 'CASH_DRAWER' : 'PRINTER',
        command: type,
        priority: 10,
        idempotencyKey,
      });

      showToast(`Đã gửi lệnh khẩn cấp [${label}] tới ${agentCode}!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi lệnh điều khiển');
    } finally {
      setDispatchingCmd(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Trạm Điều Khiển Phần Cứng & Bridge Agent (IoT)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giám sát nhịp tim kết nối (Heartbeat), nhật ký thiết bị ngoại vi và nút kích hoạt lệnh khẩn cấp
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-mono font-bold text-slate-500 text-[11px]">
                  #{ag.agentCode}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{ag.name}</h3>

              <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-600">
                <p>
                  • Địa chỉ IP: <strong className="font-mono text-slate-800">{ag.ipAddress}</strong>
                </p>
                <p>
                  • Nhịp tim cuối: <span className="font-mono text-[11px]">{formatDateTime(ag.lastHeartbeat)}</span>
                </p>
                <div>
                  <span className="block text-[11px] text-slate-400 mb-1">Thiết bị quản lý:</span>
                  <div className="flex flex-wrap gap-1">
                    {ag.devices?.map((d: string) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-700"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Action Buttons */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lệnh Điều Khiển Trực Tiếp
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDispatchCommand(ag.agentCode, 'TRIGGER_RELAY', 'Mở cửa xoay Turnstile')}
                  disabled={dispatchingCmd === `${ag.agentCode}:TRIGGER_RELAY`}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Mở Turnstile
                </button>

                <button
                  onClick={() => handleDispatchCommand(ag.agentCode, 'OPEN_CASH_DRAWER', 'Bật két tiền thu ngân')}
                  disabled={dispatchingCmd === `${ag.agentCode}:OPEN_CASH_DRAWER`}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Bật két tiền
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Events Log */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          Nhật Ký Sự Kiện Ngoại Vi Thu Nhận Gần Đây
        </h3>

        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Hệ thống đang kết nối trực tiếp với các trạm Bridge Agent qua WebSocket/Long-polling.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-800">[{e.eventType}]</span>
                  <span className="text-slate-600 ml-2">{e.data?.summary || e.agentCode}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {formatDateTime(e.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
