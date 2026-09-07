import React from 'react';
import { User, Lead, Car, Quotation, CareActivity, AppView } from '../types';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Car as CarIcon, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Compass, 
  Activity,
  PhoneCall,
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { formatVND, formatShortVND, formatDateTime, isOver45Days } from '../utils/formatters';

interface DashboardProps {
  currentUser: User;
  leads: Lead[];
  cars: Car[];
  quotations: Quotation[];
  activities: CareActivity[];
  allUsers: User[];
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  leads,
  cars,
  quotations,
  activities,
  allUsers,
  onNavigate,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const isStaff = currentUser.role === 'STAFF';

  // Leads scoped for staff or all for admin/manager
  const relevantLeads = isStaff ? leads.filter((l) => l.assignedToUserId === currentUser.id) : leads;

  // 8 KPIs calculation
  const totalLeads = relevantLeads.length;
  const wonLeads = relevantLeads.filter((l) => l.status === 'Won').length;
  const lostLeads = relevantLeads.filter((l) => l.status === 'Lost').length;
  const testDriveLeads = relevantLeads.filter((l) => l.status === 'Test-drive').length;

  const availableCars = cars.filter((c) => c.status === 'AVAILABLE').length;
  const over45DaysCars = cars.filter((c) => isOver45Days(c.importDate)).length;

  // Total deposit revenue from confirmed quotations
  const confirmedQuotations = quotations.filter((q) => q.status === 'DEPOSIT_CONFIRMED');
  const totalDepositRevenue = confirmedQuotations.reduce((sum, q) => sum + (q.depositAmount || 0), 0);

  const pendingQuotations = quotations.filter((q) => q.status === 'PENDING_APPROVAL').length;

  // Pipeline breakdown for the CSS bar chart
  const pipelineStatuses: Array<{ key: Lead['status']; label: string; color: string; bg: string }> = [
    { key: 'New', label: 'Tiếp Nhận Mới', color: 'bg-sky-500', bg: 'text-sky-700 bg-sky-50' },
    { key: 'In-progress', label: 'Đang Tư Vấn', color: 'bg-blue-600', bg: 'text-blue-700 bg-blue-50' },
    { key: 'Test-drive', label: 'Hẹn Lái Thử', color: 'bg-indigo-600', bg: 'text-indigo-700 bg-indigo-50' },
    { key: 'Won', label: 'Chốt Cọc (Won)', color: 'bg-emerald-500', bg: 'text-emerald-700 bg-emerald-50' },
    { key: 'Lost', label: 'Thất Bại (Lost)', color: 'bg-slate-400', bg: 'text-slate-700 bg-slate-100' },
  ];

  const pipelineCounts = pipelineStatuses.map((s) => ({
    ...s,
    count: relevantLeads.filter((l) => l.status === s.key).length,
    pct: totalLeads > 0 ? Math.round((relevantLeads.filter((l) => l.status === s.key).length / totalLeads) * 100) : 0,
  }));

  // Sales Ranking for Admin / Manager
  const staffUsers = allUsers.filter((u) => u.role === 'STAFF' && u.status === 'ACTIVE');
  const salesLeaderboard = staffUsers.map((staff) => {
    const staffLeads = leads.filter((l) => l.assignedToUserId === staff.id);
    const staffWon = staffLeads.filter((l) => l.status === 'Won').length;
    const staffQuotations = quotations.filter((q) => q.createdByUserId === staff.id && q.status === 'DEPOSIT_CONFIRMED');
    const depositTotal = staffQuotations.reduce((acc, q) => acc + (q.depositAmount || 0), 0);
    const conversionRate = staffLeads.length > 0 ? Math.round((staffWon / staffLeads.length) * 100) : 0;

    return {
      staff,
      totalLeads: staffLeads.length,
      wonCount: staffWon,
      depositTotal,
      conversionRate,
    };
  }).sort((a, b) => b.depositTotal - a.depositTotal || b.wonCount - a.wonCount);

  // Source breakdown for Staff view
  const sources: Lead['source'][] = ['Website', 'Showroom', 'Hotline', 'Facebook', 'Giới thiệu'];
  const staffSourceData = sources.map((src) => {
    const count = relevantLeads.filter((l) => l.source === src).length;
    const wonCount = relevantLeads.filter((l) => l.source === src && l.status === 'Won').length;
    return {
      source: src,
      count,
      wonCount,
      pct: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    };
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 rounded-2xl border border-slate-800 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Xin chào, {currentUser.name} 👋
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {currentUser.department}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bảng điều khiển kinh doanh xe ô tô đã qua sử dụng TNT CAR hôm nay.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('LEADS')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quản Lý Leads</span>
          </button>
          <button
            onClick={() => onNavigate('QUOTATIONS')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Duyệt Báo Giá</span>
          </button>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Leads */}
        <div 
          onClick={() => onNavigate('LEADS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Leads {isStaff && '(Của bạn)'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalLeads}</span>
            <span className="text-[11px] text-blue-600 font-medium">Khách hàng</span>
          </div>
        </div>

        {/* KPI 2: Won */}
        <div 
          onClick={() => onNavigate('LEADS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Chốt Cọc (Won)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{wonLeads}</span>
            <span className="text-[11px] text-slate-500">
              ({totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* KPI 3: Lost */}
        <div 
          onClick={() => onNavigate('LEADS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Thất Bại (Lost)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-700">{lostLeads}</span>
            <span className="text-[11px] text-slate-400">leads dừng</span>
          </div>
        </div>

        {/* KPI 4: Test Drive */}
        <div 
          onClick={() => onNavigate('LEADS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Đang Hẹn Lái Thử</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{testDriveLeads}</span>
            <span className="text-[11px] text-indigo-500 font-medium">Khách lái thử</span>
          </div>
        </div>

        {/* KPI 5: Available Cars */}
        <div 
          onClick={() => onNavigate('INVENTORY')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Xe Sẵn Sàng Bán</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <CarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{availableCars}</span>
            <span className="text-[11px] text-slate-500">/ {cars.length} tổng xe</span>
          </div>
        </div>

        {/* KPI 6: Over 45 Days 🚩 */}
        <div 
          onClick={() => onNavigate('INVENTORY')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 font-semibold">Tồn Kho &gt; 45 Ngày 🚩</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600">{over45DaysCars}</span>
            <span className="text-[11px] text-rose-500 font-medium">Cần xả nhanh</span>
          </div>
        </div>

        {/* KPI 7: Deposit Revenue */}
        <div 
          onClick={() => onNavigate('QUOTATIONS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Doanh Thu Cọc</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 truncate">
              {formatShortVND(totalDepositRevenue)}
            </span>
          </div>
        </div>

        {/* KPI 8: Pending Quotations */}
        <div 
          onClick={() => onNavigate('QUOTATIONS')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 font-semibold">Báo Giá Chờ Duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600">{pendingQuotations}</span>
            <span className="text-[11px] text-amber-600 font-medium">Hồ sơ chờ</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Chart + Sales Leaderboard / Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Pipeline Bar Chart (CSS Bars) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Phễu Chuyển Đổi Lead (Lead Pipeline)
              </h2>
              <p className="text-xs text-slate-500">Tiến trình chăm sóc khách hàng qua 5 giai đoạn</p>
            </div>
            <button
              onClick={() => onNavigate('LEADS')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CSS Multi-stage Bar */}
          <div className="space-y-4 pt-1">
            <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
              {pipelineCounts.map((s) => (
                <div
                  key={s.key}
                  style={{ width: `${s.pct || (s.count > 0 ? 5 : 0)}%` }}
                  title={`${s.label}: ${s.count} leads (${s.pct}%)`}
                  className={`${s.color} transition-all duration-500 hover:brightness-110 relative flex items-center justify-center`}
                >
                  {s.pct >= 12 && (
                    <span className="text-[10px] font-bold text-white tracking-tight">
                      {s.count}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Pipeline Stage Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {pipelineCounts.map((s) => (
                <div
                  key={s.key}
                  onClick={() => onNavigate('LEADS')}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                    <span className="text-[11px] font-semibold text-slate-600 truncate">{s.label}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold text-slate-900">{s.count}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Highlights */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Nhận định phễu:</span>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Tỷ lệ chuyển đổi thành công (Won) đạt <strong className="font-bold text-blue-950">{totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0}%</strong>.
                Có {testDriveLeads} khách hàng đang ở giai đoạn lái thử thực tế, đây là nhóm khách tiềm năng cao cần chốt cọc trong 48h tới.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role-Adaptive Section */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {isAdmin || isManager ? (
            /* Admin/Manager: Sales Leaderboard */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Bảng Xếp Hạng Doanh Số Sales
                  </h2>
                  <p className="text-xs text-slate-500">Hiệu suất chốt cọc tháng này</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Top Sales
                </span>
              </div>

              <div className="space-y-2.5">
                {salesLeaderboard.map((item, idx) => (
                  <div
                    key={item.staff.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={item.staff.avatar}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                          idx === 0 ? 'bg-amber-500 shadow-sm' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.staff.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.wonCount} won / {item.totalLeads} leads (CR: {item.conversionRate}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600">
                        {formatShortVND(item.depositTotal)} cọc
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Doanh số cọc</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Staff: Leads by Source breakdown */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    Phân Bổ Leads Theo Nguồn
                  </h2>
                  <p className="text-xs text-slate-500">Nguồn khách hàng cá nhân bạn đang chăm sóc</p>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold">{totalLeads} khách</span>
              </div>

              <div className="space-y-3">
                {staffSourceData.map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{src.source}</span>
                      <span className="text-slate-500 font-medium">
                        {src.count} leads ({src.wonCount} đã cọc)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${src.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feed hoạt động gần đây (Care activities & Audit log) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Nhật Ký Chăm Sóc & Hoạt Động Gần Đây (Activity Feed)
            </h2>
            <p className="text-xs text-slate-500">Mọi tương tác, gọi điện, hẹn lái thử và biến động cọc được ghi nhận tự động</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{activities.length} hoạt động</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {activities.slice(0, 10).map((act) => {
            const getActivityIcon = (type: CareActivity['type']) => {
              switch (type) {
                case 'CALL':
                  return <PhoneCall className="w-3.5 h-3.5 text-blue-600" />;
                case 'TEST_DRIVE':
                  return <Compass className="w-3.5 h-3.5 text-indigo-600" />;
                case 'STATUS_CHANGE':
                  return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
                case 'TRADE_IN':
                  return <CarIcon className="w-3.5 h-3.5 text-amber-600" />;
                case 'QUOTATION':
                  return <FileText className="w-3.5 h-3.5 text-purple-600" />;
                case 'ASSIGN':
                  return <Users className="w-3.5 h-3.5 text-rose-600" />;
                default:
                  return <Activity className="w-3.5 h-3.5 text-slate-600" />;
              }
            };

            const getActivityBadge = (type: CareActivity['type']) => {
              switch (type) {
                case 'CALL':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700">Gọi điện</span>;
                case 'TEST_DRIVE':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700">Lái thử</span>;
                case 'STATUS_CHANGE':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700">Trạng thái</span>;
                case 'TRADE_IN':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700">Thu cũ</span>;
                case 'QUOTATION':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 text-purple-700">Báo giá</span>;
                case 'ASSIGN':
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-50 text-rose-700">Gán lead</span>;
                default:
                  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">Ghi chú</span>;
              }
            };

            return (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActivityBadge(act.type)}
                      {act.leadName && (
                        <span className="text-xs font-bold text-slate-900">
                          Khách: {act.leadName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed break-words">
                      {act.content}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] font-semibold text-slate-600">{act.authorName}</div>
                  <div className="text-[10px] text-slate-400">{formatDateTime(act.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
