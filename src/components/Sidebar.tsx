import React from 'react';
import { User, AppView } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User;
  onLogout: () => void;
  newLeadsCount: number;
  availableCarsCount: number;
  pendingQuotationsCount: number;
  over45DaysCarsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  newLeadsCount,
  availableCarsCount,
  pendingQuotationsCount,
  over45DaysCarsCount,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const canManageUsers = isAdmin;

  const navItems = [
    {
      id: 'DASHBOARD' as AppView,
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      badge: null,
      subtitle: 'KPIs & Báo cáo',
    },
    {
      id: 'LEADS' as AppView,
      label: 'Quản Lý Lead',
      icon: Users,
      badge: newLeadsCount > 0 ? `${newLeadsCount} mới` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      subtitle: 'Phễu khách hàng',
    },
    {
      id: 'INVENTORY' as AppView,
      label: 'Quản Trị Kho Xe',
      icon: Car,
      badge: availableCarsCount > 0 ? `${availableCarsCount} xe` : null,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      alertBadge: over45DaysCarsCount > 0 ? `${over45DaysCarsCount} 🚩` : null,
      subtitle: isAdmin || isManager ? 'Giá thu & Lợi nhuận' : 'Tra cứu kho xe',
    },
    {
      id: 'QUOTATIONS' as AppView,
      label: 'Báo Giá & Đặt Cọc',
      icon: FileText,
      badge: pendingQuotationsCount > 0 ? `${pendingQuotationsCount} chờ` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      subtitle: 'Lăn bánh & Duyệt cọc',
    },
    {
      id: 'WEBSITE' as AppView,
      label: 'Website Showroom',
      icon: Globe,
      badge: 'Công khai',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      subtitle: 'Thu cũ & Lái thử',
    },
  ];

  if (canManageUsers) {
    navItems.push({
      id: 'USERS' as AppView,
      label: 'Quản Lý Nhân Sự',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      subtitle: 'Phân quyền & Khóa',
    });
  }

  return (
    <aside 
      className="w-64 flex-shrink-0 flex flex-col justify-between select-none border-r border-slate-800 text-slate-300"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      {/* Upper Navigation */}
      <div className="p-4 space-y-6">
        {/* Navigation Category Label */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Phân Hệ Nghiệp Vụ
            </span>
            <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
              {currentUser.role}
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <div className="truncate">
                      <div className="truncate">{item.label}</div>
                      <div className={`text-[10px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {item.alertBadge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 animate-pulse">
                        {item.alertBadge}
                      </span>
                    )}
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Role Info Box */}
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quyền hạn tài khoản</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {isAdmin && 'Toàn quyền duyệt cọc, xem giá thu xe, quản lý tài khoản và gán lead.'}
            {isManager && 'Quản lý kho xe, xem giá thu, phê duyệt báo giá và quản lý lead.'}
            {currentUser.role === 'STAFF' && 'Xem và chăm sóc lead được gán, tra cứu kho xe, tạo báo giá lăn bánh.'}
            {currentUser.role === 'VIEWER' && 'Chế độ xem dữ liệu, không thực hiện chỉnh sửa.'}
          </p>
        </div>
      </div>

      {/* Bottom Profile and Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0"
            />
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
