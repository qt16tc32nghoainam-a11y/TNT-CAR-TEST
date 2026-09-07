import React, { useState } from 'react';
import { User, AppView } from '../types';
import { 
  Car, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertTriangle, 
  ShieldCheck, 
  Globe, 
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginPageProps {
  allUsers: User[];
  onLoginSuccess: (user: User) => void;
  onGoToWebsite: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  allUsers,
  onLoginSuccess,
  onGoToWebsite,
}) => {
  const [email, setEmail] = useState('admin@tntcar.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const foundUser = allUsers.find(
      (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (!foundUser) {
      setErrorMessage('Tài khoản email không tồn tại trong hệ thống TNT CAR!');
      return;
    }

    if (foundUser.status === 'INACTIVE') {
      setErrorMessage(
        'Tài khoản này đã bị KHÓA (INACTIVE) bởi Quản trị viên! Vui lòng liên hệ Admin để mở khóa.'
      );
      return;
    }

    // Default demo password is accepted
    onLoginSuccess(foundUser);
  };

  const handleQuickLogin = (user: User) => {
    setErrorMessage('');
    if (user.status === 'INACTIVE') {
      setEmail(user.email);
      setErrorMessage(
        `Tài khoản "${user.name}" đang ở trạng thái KHÓA (INACTIVE). Không thể đăng nhập vào hệ thống!`
      );
      return;
    }
    setEmail(user.email);
    setPassword('123456');
    onLoginSuccess(user);
  };

  const activeDemoUsers = allUsers.filter((u) => u.status === 'ACTIVE').slice(0, 5);
  const inactiveUser = allUsers.find((u) => u.status === 'INACTIVE');

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top right, #1e3a8a 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand presentation */}
        <div className="lg:col-span-6 space-y-6 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Hệ thống CRM TNT CAR v3.0
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Car className="w-8 h-8 text-white" />
              </span>
              TNT CAR AUTO
            </h1>
            <p className="text-base text-slate-300 font-medium">
              Nền tảng Quản trị Kinh doanh Xe Ô tô Đã Qua Sử Dụng
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-300 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Sales App toàn diện:</strong> Quản lý phễu lead, tra cứu xe tức thì, tính chi phí lăn bánh & bảng tính trả góp.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Admin & Kho xe thông minh:</strong> Quản trị giá thu, chi phí dọn, lợi nhuận gộp, cảnh báo tồn kho &gt;45 ngày.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Website Public & Thu cũ đổi mới:</strong> Đăng ký lái thử, kiểm định 160 tiêu chí và định giá xe tự động.
              </p>
            </div>
          </div>

          {/* Quick link to public website */}
          <div className="pt-2">
            <button
              onClick={onGoToWebsite}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-semibold shadow-lg transition-all"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              Xem Website Showroom Khách Hàng (Không cần đăng nhập)
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Side: Login Card & Quick Logins */}
        <div className="lg:col-span-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs text-slate-400">Chọn tài khoản demo bên dưới hoặc nhập thông tin email</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email nhân viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tntcar.vn"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mật khẩu (Demo: 123456)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Vào Hệ Thống</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                5 Tài khoản Demo (Click vào để đăng nhập ngay)
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Sẵn sàng</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeDemoUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-750 border border-slate-700/80 text-left transition-all hover:border-blue-500/60 hover:scale-[1.01] flex items-center gap-2.5 group"
                >
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/40 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-blue-300">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="font-medium text-blue-400">{user.role}</span>
                      <span>•</span>
                      <span className="truncate">{user.department}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Test Inactive Account */}
            {inactiveUser && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleQuickLogin(inactiveUser)}
                  className="w-full p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-left transition-colors flex items-center justify-between text-xs text-rose-300"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Thử nghiệm tài khoản bị khóa: {inactiveUser.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200">
                    INACTIVE
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
