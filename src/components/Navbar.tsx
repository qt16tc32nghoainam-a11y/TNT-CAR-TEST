import React from 'react';
import { User, AppView } from '../types';
import { 
  Car, 
  LogOut, 
  Shield, 
  Globe, 
  Briefcase, 
  RefreshCw, 
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onSwitchUser,
  allUsers,
  onResetData,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Admin Quản Trị</span>;
      case 'MANAGER':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Quản Lý Kinh Doanh</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Chuyên Viên Sales</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">Viewer</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white select-none">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left: Brand / View Title */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onNavigate('WEBSITE')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">TNT CAR</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-blue-500 text-white rounded">CRM</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hệ thống Quản lý Kinh doanh Xe Ô tô</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-700/60 text-xs text-slate-400">
            <span>Trạng thái:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Trực tuyến
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Quick toggle to Website / CRM */}
          {currentView === 'WEBSITE' ? (
            <button
              onClick={() => onNavigate('DASHBOARD')}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Vào CRM Nội Bộ
            </button>
          ) : (
            <button
              onClick={() => onNavigate('WEBSITE')}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Xem Website Khách Hàng
            </button>
          )}

          {/* User Profile & Role Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500/50"
                />
                <div className="hidden lg:block">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{currentUser.department}</div>
                </div>
                <div className="hidden sm:block">
                  {getRoleBadge(currentUser.role)}
                </div>
              </button>

              {/* Dropdown for Switching Demo Users & Logout */}
              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200"
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700/70">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tài khoản hiện tại</p>
                    <p className="text-sm font-bold text-white mt-0.5">{currentUser.name}</p>
                    <p className="text-xs text-slate-300">{currentUser.email}</p>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Chuyển tài khoản demo:
                    </p>
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        disabled={u.status === 'INACTIVE'}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                          u.id === currentUser.id ? 'bg-blue-600/20 text-blue-300 font-semibold' : ''
                        } ${u.status === 'INACTIVE' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{u.role}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-700/70 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (confirm('Bạn có chắc muốn khôi phục dữ liệu mẫu gốc ban đầu không?')) {
                          onResetData();
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-slate-700/60 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Khôi phục dữ liệu mẫu (Seed Data)
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-700/60 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
