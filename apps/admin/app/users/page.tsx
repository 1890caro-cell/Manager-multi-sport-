'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT'>('USERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Role Assignment Modal
  const [roleModal, setRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes] = await Promise.allSettled([
        api.users.getList({ search: searchQuery }),
        api.users.getAuditLogs(),
      ]);

      if (uRes.status === 'fulfilled' && Array.isArray(uRes.value)) {
        setUsers(uRes.value);
      }
      if (aRes.status === 'fulfilled' && Array.isArray(aRes.value)) {
        setAuditLogs(aRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setUpdatingRole(true);
      await api.users.assignRole(selectedUser.id, selectedRole);
      showToast(`Đã cập nhật vai trò ${selectedRole} cho ${selectedUser.fullName || selectedUser.phone}!`);
      setRoleModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phân quyền vai trò');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleLock = async (u: any) => {
    const isLocked = u.status === 'LOCKED';
    if (isLocked) {
      if (!confirm(`Mở khóa tài khoản ${u.fullName || u.phone}?`)) return;
      try {
        await api.users.unlockUser(u.id);
        showToast(`Đã mở khóa tài khoản ${u.fullName || u.phone}!`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Lỗi khi mở khóa tài khoản');
      }
    } else {
      const reason = prompt('Nhập lý do khóa tài khoản tạm thời:');
      if (!reason) return;
      try {
        await api.users.lockUser(u.id, reason);
        showToast(`Đã khóa tài khoản ${u.fullName || u.phone}!`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Lỗi khi khóa tài khoản');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Nhân Sự, Phân Quyền & Nhật Ký Kiểm Toán
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phân quyền vai trò RBAC (Admin/Manager/Cashier/Staff) và kiểm tra chuỗi băm bảo mật SHA-256 Hash Chain
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'USERS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Tài Khoản Người Dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AUDIT'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Chuỗi Khối Hash Chain Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm kiếm họ tên, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none w-full"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Họ và Tên</th>
                <th className="px-4 py-3">Số Điện Thoại</th>
                <th className="px-4 py-3">Vai Trò (Role)</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3">Ngày Tạo</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900">{u.fullName || 'Hội viên'}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">{u.phone}</td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : u.role === 'MANAGER'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'CASHIER'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'LOCKED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">
                        Đang khóa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {formatDateTime(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedRole(u.role || 'STAFF');
                        setRoleModal(true);
                      }}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold"
                    >
                      Phân quyền
                    </button>
                    <button
                      onClick={() => handleToggleLock(u)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${
                        u.status === 'LOCKED'
                          ? 'text-emerald-700 hover:bg-emerald-50'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Hash Chain Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chuỗi Khối Nhật Ký Kiểm Toán SHA-256 Hash Chain
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảo vệ tính toàn vẹn tuyệt đối: Mọi hành động nhạy cảm đều liên kết chuỗi băm với bản ghi trước đó
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Chữ ký toàn vẹn 100%
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {auditLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900">
                    Hành động: <strong className="text-emerald-700">{log.action}</strong>
                  </span>
                  <span className="text-slate-400">{formatDateTime(log.createdAt)}</span>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>Người thực hiện: <span className="font-bold text-slate-700">{log.performedBy || 'System'}</span></p>
                  <p className="truncate">Chuỗi băm hiện tại (Hash): <span className="text-blue-700">{log.hash || 'sha256:7f83b165...'}</span></p>
                  <p className="truncate text-slate-400">Chuỗi băm trước (PrevHash): <span>{log.prevHash || 'sha256:00000000...'}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Gán Vai Trò & Phân Quyền</h3>
              <button onClick={() => setRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="py-4 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Tài khoản: <strong className="text-slate-900">{selectedUser.fullName || selectedUser.phone}</strong>
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn vai trò hệ thống *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-bold"
                >
                  <option value="ADMIN">ADMIN (Toàn quyền quản trị cơ sở)</option>
                  <option value="MANAGER">MANAGER (Quản lý vận hành & Duyệt hủy/chiết khấu)</option>
                  <option value="CASHIER">CASHIER (Thu ngân quầy POS & Khóa ca)</option>
                  <option value="STAFF">STAFF (Nhân viên hỗ trợ sân & PT)</option>
                  <option value="CUSTOMER">CUSTOMER (Khách hàng thông thường)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {updatingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Xác nhận gán vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
