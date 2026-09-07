import React, { useState, useMemo } from 'react';
import { User, Lead, LeadStatus, LeadSource, CareActivity, Car, AppView } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  Car as CarIcon, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  X, 
  MessageSquare, 
  PhoneCall, 
  Compass, 
  FileText,
  AlertTriangle,
  Send
} from 'lucide-react';
import { formatVND, formatShortVND, formatDateTime, formatDate, validateVNPhone } from '../utils/formatters';

interface LeadManagementProps {
  currentUser: User;
  leads: Lead[];
  cars: Car[];
  allUsers: User[];
  activities: CareActivity[];
  onAddLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onAssignLead: (leadId: string, newUser: User) => void;
  onAddActivity: (activity: CareActivity) => void;
  onCreateQuotationForLead: (lead: Lead, car?: Car) => void;
}

export const LeadManagement: React.FC<LeadManagementProps> = ({
  currentUser,
  leads,
  cars,
  allUsers,
  activities,
  onAddLead,
  onUpdateLead,
  onAssignLead,
  onAddActivity,
  onCreateQuotationForLead,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const isStaff = currentUser.role === 'STAFF';

  // Filters state
  const [activeTab, setActiveTab] = useState<'ALL' | LeadStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');

  // Quick activity log inside detail modal
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState<CareActivity['type']>('CALL');

  // Form state for creating new lead
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBudget, setFormBudget] = useState<number>(750_000_000);
  const [formSource, setFormSource] = useState<LeadSource>('Showroom');
  const [formStatus, setFormStatus] = useState<LeadStatus>('New');
  const [formInterestedCarId, setFormInterestedCarId] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<string>(currentUser.id);
  const [formError, setFormError] = useState('');

  // Scoped leads based on role
  const scopedLeads = useMemo(() => {
    if (isStaff) {
      return leads.filter((l) => l.assignedToUserId === currentUser.id);
    }
    return leads;
  }, [leads, isStaff, currentUser.id]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: scopedLeads.length,
      New: scopedLeads.filter((l) => l.status === 'New').length,
      'In-progress': scopedLeads.filter((l) => l.status === 'In-progress').length,
      'Test-drive': scopedLeads.filter((l) => l.status === 'Test-drive').length,
      Won: scopedLeads.filter((l) => l.status === 'Won').length,
      Lost: scopedLeads.filter((l) => l.status === 'Lost').length,
    };
  }, [scopedLeads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return scopedLeads.filter((lead) => {
      // Tab filter
      if (activeTab !== 'ALL' && lead.status !== activeTab) return false;

      // Source filter
      if (selectedSource !== 'ALL' && lead.source !== selectedSource) return false;

      // Staff filter for admin/manager
      if ((isAdmin || isManager) && selectedStaffFilter !== 'ALL' && lead.assignedToUserId !== selectedStaffFilter) {
        return false;
      }

      // Search filter (name or phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.customerName.toLowerCase().includes(q);
        const matchPhone = lead.phone.includes(q);
        const matchCode = lead.code.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode) return false;
      }

      return true;
    });
  }, [scopedLeads, activeTab, selectedSource, selectedStaffFilter, searchQuery, isAdmin, isManager]);

  // Handle submit new lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation 1: Customer Name
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập họ tên khách hàng!');
      return;
    }
    if (trimmedName.length > 100) {
      setFormError('Họ tên khách hàng không được vượt quá 100 ký tự!');
      return;
    }

    // Validation 2: Phone number regex VN
    if (!validateVNPhone(formPhone)) {
      setFormError('Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09).');
      return;
    }

    const assignedUser = allUsers.find((u) => u.id === formAssignedTo) || currentUser;
    const interestedCar = cars.find((c) => c.id === formInterestedCarId);

    const isVip = formBudget >= 800_000_000;

    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      code: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: trimmedName,
      phone: formPhone.trim(),
      email: formEmail.trim() || `${formPhone.trim()}@customer.tntcar.vn`,
      budget: Number(formBudget) || 0,
      source: formSource,
      status: formStatus,
      interestedCarId: interestedCar?.id,
      interestedCarName: interestedCar ? `${interestedCar.brand} ${interestedCar.model} ${interestedCar.year}` : undefined,
      assignedToUserId: assignedUser.id,
      assignedToName: assignedUser.name,
      notes: formNotes.trim(),
      isVip,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onAddLead(newLead);
    setIsAddModalOpen(false);

    // Reset form
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormBudget(750_000_000);
    setFormNotes('');
    setFormInterestedCarId('');
  };

  // Status badge helper
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">Mới Tiếp Nhận</span>;
      case 'In-progress':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Đang Tư Vấn</span>;
      case 'Test-drive':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Hẹn Lái Thử</span>;
      case 'Won':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Chốt Cọc (Won)</span>;
      case 'Lost':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Thất Bại (Lost)</span>;
    }
  };

  // Add Care Activity for selected lead
  const handleAddCareActivity = () => {
    if (!selectedLeadForDetail || !activityNote.trim()) return;

    const newActivity: CareActivity = {
      id: 'act-' + Date.now(),
      leadId: selectedLeadForDetail.id,
      leadName: selectedLeadForDetail.customerName,
      type: activityType,
      content: activityNote.trim(),
      authorName: currentUser.name,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    onAddActivity(newActivity);
    setActivityNote('');
  };

  // Change lead status quickly
  const handleQuickChangeStatus = (lead: Lead, newStatus: LeadStatus) => {
    const updated = {
      ...lead,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
    if (selectedLeadForDetail && selectedLeadForDetail.id === lead.id) {
      setSelectedLeadForDetail(updated);
    }
  };

  // Reassign Lead
  const handleConfirmAssign = () => {
    if (!leadToAssign || !targetUserId) return;
    const targetUser = allUsers.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    onAssignLead(leadToAssign.id, targetUser);
    setIsAssignModalOpen(false);
    setLeadToAssign(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Quản Lý Khách Hàng (Leads)
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {filteredLeads.length} leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isStaff
              ? 'Danh sách khách hàng tiềm năng được phân bổ trực tiếp cho bạn.'
              : 'Quản lý toàn bộ phễu khách hàng, phân bổ lead và theo dõi tiến độ chốt cọc.'}
          </p>
        </div>

        <button
          onClick={() => {
            setFormAssignedTo(currentUser.id);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng Mới</span>
        </button>
      </div>

      {/* Tabs navigation by status with counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'ALL', label: 'Tất Cả', count: tabCounts.ALL },
          { key: 'New', label: 'Tiếp Nhận Mới', count: tabCounts.New },
          { key: 'In-progress', label: 'Đang Tư Vấn', count: tabCounts['In-progress'] },
          { key: 'Test-drive', label: 'Hẹn Lái Thử', count: tabCounts['Test-drive'] },
          { key: 'Won', label: 'Chốt Cọc (Won)', count: tabCounts.Won },
          { key: 'Lost', label: 'Thất Bại (Lost)', count: tabCounts.Lost },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách, số điện thoại, mã lead..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Nguồn:</span>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả nguồn</option>
            <option value="Website">Website Showroom</option>
            <option value="Showroom">Khách tại Showroom</option>
            <option value="Hotline">Hotline</option>
            <option value="Facebook">Facebook / Fanpage</option>
            <option value="Giới thiệu">Người quen giới thiệu</option>
          </select>
        </div>

        {/* Staff Filter (Admin / Manager) */}
        {(isAdmin || isManager) && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Sales:</span>
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả nhân viên</option>
              {allUsers.filter((u) => u.role === 'STAFF').map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Mã & Khách Hàng</th>
                <th className="py-3.5 px-4">Liên Hệ</th>
                <th className="py-3.5 px-4">Ngân Sách / VIP</th>
                <th className="py-3.5 px-4">Xe Quan Tâm</th>
                <th className="py-3.5 px-4">Nguồn</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Chuyên Viên Sales</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">Không tìm thấy khách hàng nào</p>
                    <p className="text-xs">Thử đổi bộ lọc hoặc thêm lead mới.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLeadForDetail(lead)}
                    >
                      {/* Customer Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {lead.customerName}
                          {lead.tradeInInfo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              Thu Cũ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.code}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{lead.email}</div>
                      </td>

                      {/* Budget / VIP Badge */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {formatShortVND(lead.budget)}
                        </div>
                        {lead.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-sm mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> VIP
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Tiêu chuẩn</span>
                        )}
                      </td>

                      {/* Interested Car */}
                      <td className="py-3 px-4">
                        {lead.interestedCarName ? (
                          <div className="font-medium text-slate-800 truncate max-w-[160px]">
                            {lead.interestedCarName}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chọn xe</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {lead.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(lead.status)}
                      </td>

                      {/* Assigned Sales */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span className="truncate max-w-[120px]">{lead.assignedToName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDate(lead.createdAt)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {(isAdmin || isManager) && (
                            <button
                              onClick={() => {
                                setLeadToAssign(lead);
                                setTargetUserId(lead.assignedToUserId);
                                setIsAssignModalOpen(true);
                              }}
                              title="Chuyển lead cho Sales khác"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedLeadForDetail(lead)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New Lead */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Tiếp Nhận Khách Hàng Tiềm Năng Mới
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên khách hàng <span className="text-rose-500">* (tối đa 100 ký tự)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại VN <span className="text-rose-500">* (10 số di động)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="VD: 0988123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="khachhang@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngân sách dự kiến (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={10_000_000}
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <div className="text-[11px] text-blue-600 font-semibold mt-1">
                    = {formatShortVND(formBudget)} {formBudget >= 800_000_000 && '👑 Tự động đạt chuẩn VIP'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nguồn tiếp nhận
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Showroom">Khách vãng lai Showroom</option>
                    <option value="Website">Website Showroom</option>
                    <option value="Hotline">Hotline / Tổng đài</option>
                    <option value="Facebook">Facebook Fanpage</option>
                    <option value="Giới thiệu">Người quen giới thiệu</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái ban đầu
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">Tiếp Nhận Mới</option>
                    <option value="In-progress">Đang Tư Vấn</option>
                    <option value="Test-drive">Hẹn Lái Thử</option>
                  </select>
                </div>
              </div>

              {/* Interested Car */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xe đang quan tâm trong kho
                </label>
                <select
                  value={formInterestedCarId}
                  onChange={(e) => setFormInterestedCarId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Khách chưa xác định xe cụ thể --</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} {c.year} - {c.version} ({formatShortVND(c.sellingPrice)} - {c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign to */}
              {(isAdmin || isManager) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân bổ cho Chuyên viên Sales
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allUsers.filter((u) => u.role === 'STAFF').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú yêu cầu của khách
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="VD: Cần tìm xe màu đen, mua trả góp 4 năm qua ngân hàng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                >
                  Lưu Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Lead Detail & Care Log Modal */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedLeadForDetail.customerName}
                  </h3>
                  {selectedLeadForDetail.isVip && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                  {getStatusBadge(selectedLeadForDetail.status)}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Mã: {selectedLeadForDetail.code} • Ngày tạo: {formatDate(selectedLeadForDetail.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedLeadForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700">Chuyển trạng thái:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['New', 'In-progress', 'Test-drive', 'Won', 'Lost'] as LeadStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleQuickChangeStatus(selectedLeadForDetail, st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedLeadForDetail.status === st
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {st === 'New' && 'Mới'}
                    {st === 'In-progress' && 'Đang tư vấn'}
                    {st === 'Test-drive' && 'Hẹn lái thử'}
                    {st === 'Won' && 'Chốt cọc'}
                    {st === 'Lost' && 'Thất bại'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-800 text-[13px]">Thông tin liên hệ</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">{selectedLeadForDetail.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedLeadForDetail.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ngân sách: <strong>{formatVND(selectedLeadForDetail.budget)}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-slate-400 font-medium">Nguồn tiếp nhận:</span>
                  <span className="font-semibold">{selectedLeadForDetail.source}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="font-bold text-slate-800 text-[13px]">Xe quan tâm & Phụ trách</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CarIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xe: <strong>{selectedLeadForDetail.interestedCarName || 'Chưa chọn'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chuyên viên: <strong>{selectedLeadForDetail.assignedToName}</strong></span>
                </div>
                <div className="text-slate-600 italic mt-1">
                  "{selectedLeadForDetail.notes || 'Không có ghi chú thêm.'}"
                </div>

                {/* Button to quickly create quotation */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const matchedCar = cars.find((c) => c.id === selectedLeadForDetail.interestedCarId);
                      onCreateQuotationForLead(selectedLeadForDetail, matchedCar);
                      setSelectedLeadForDetail(null);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Lập Báo Giá Lăn Bánh Cho Khách Này
                  </button>
                </div>
              </div>
            </div>

            {/* Trade In details if exists */}
            {selectedLeadForDetail.tradeInInfo && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <CarIcon className="w-4 h-4 text-amber-600" />
                  Yêu Cầu Thu Cũ Đổi Mới Của Khách Hàng:
                </div>
                <p>
                  Xe cũ: <strong>{selectedLeadForDetail.tradeInInfo.brand} {selectedLeadForDetail.tradeInInfo.model} ({selectedLeadForDetail.tradeInInfo.year})</strong> - ODO: {selectedLeadForDetail.tradeInInfo.mileage.toLocaleString()} km
                </p>
                <p>
                  Định giá sơ bộ ước tính: <strong className="text-amber-800 text-sm font-extrabold">{formatVND(selectedLeadForDetail.tradeInInfo.estimatedValue)}</strong>
                </p>
                <p className="text-[11px] text-amber-800">
                  Tình trạng tự khai: {selectedLeadForDetail.tradeInInfo.condition}
                </p>
              </div>
            )}

            {/* Care Activity Log (Nhật ký chăm sóc) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Lịch Sử Chăm Sóc & Tương Tác
              </h4>

              {/* Add interaction form */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Loại hoạt động:</span>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <option value="CALL">Cuộc gọi tư vấn</option>
                    <option value="NOTE">Ghi chú yêu cầu</option>
                    <option value="TEST_DRIVE">Hẹn / Thực hiện lái thử</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="Nhập nội dung cuộc gọi hoặc ghi chú tương tác mới..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddCareActivity}
                    disabled={!activityNote.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Lưu
                  </button>
                </div>
              </div>

              {/* List of activities for this lead */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activities
                  .filter((a) => a.leadId === selectedLeadForDetail.id)
                  .map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{act.authorName}</span>
                        <span className="text-slate-400">{formatDateTime(act.createdAt)}</span>
                      </div>
                      <p className="text-slate-700">{act.content}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reassign Lead Modal (Admin / Manager) */}
      {isAssignModalOpen && leadToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Chuyển Quyền Quản Lý Khách Hàng
            </h3>

            <p className="text-xs text-slate-600">
              Chuyển khách hàng <strong>{leadToAssign.customerName}</strong> ({leadToAssign.code}) sang cho chuyên viên Sales khác phụ trách.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Chuyên viên Sales mới:
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allUsers.filter((u) => u.role === 'STAFF' && u.status === 'ACTIVE').map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
              >
                Xác Nhận Chuyển Giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
