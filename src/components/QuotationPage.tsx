import React, { useState, useMemo, useEffect } from 'react';
import { User, Quotation, Lead, Car, QuotationStatus } from '../types';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Printer, 
  Check, 
  X, 
  Eye, 
  Calculator,
  Car as CarIcon,
  ShieldAlert,
  Sparkles,
  Send
} from 'lucide-react';
import { 
  formatVND, 
  formatShortVND, 
  formatDate, 
  calculateRollingPriceDetails, 
  calculatePMT 
} from '../utils/formatters';

interface QuotationPageProps {
  currentUser: User;
  quotations: Quotation[];
  leads: Lead[];
  cars: Car[];
  onAddQuotation: (quotation: Quotation) => void;
  onUpdateQuotationStatus: (
    quotationId: string, 
    status: QuotationStatus, 
    approver: User, 
    rejectionReason?: string
  ) => void;
  preSelectedLead?: Lead | null;
  preSelectedCar?: Car | null;
  onClearPreSelections?: () => void;
}

export const QuotationPage: React.FC<QuotationPageProps> = ({
  currentUser,
  quotations,
  leads,
  cars,
  onAddQuotation,
  onUpdateQuotationStatus,
  preSelectedLead,
  preSelectedCar,
  onClearPreSelections,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const canApprove = isAdmin || isManager;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [rejectModalQuot, setRejectModalQuot] = useState<Quotation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form states for creating new quotation
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [formDiscount, setFormDiscount] = useState<number>(10_000_000);
  const [formDepositAmount, setFormDepositAmount] = useState<number>(50_000_000);
  const [formNotes, setFormNotes] = useState('');

  // Loan PMT states
  const [loanEnabled, setLoanEnabled] = useState(true);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30); // 30%
  const [tenureMonths, setTenureMonths] = useState(60); // 5 years
  const [annualInterestRate, setAnnualInterestRate] = useState(8.5); // 8.5%

  // Open create modal with preselected lead/car if passed from other views
  useEffect(() => {
    if (preSelectedLead || preSelectedCar) {
      if (preSelectedLead) setSelectedLeadId(preSelectedLead.id);
      if (preSelectedCar) setSelectedCarId(preSelectedCar.id);
      setIsCreateModalOpen(true);
      if (onClearPreSelections) onClearPreSelections();
    }
  }, [preSelectedLead, preSelectedCar]);

  // Selected lead & car objects
  const activeLead = leads.find((l) => l.id === selectedLeadId);
  const activeCar = cars.find((c) => c.id === selectedCarId);

  // Auto-sync car when lead has interested car
  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    const ld = leads.find((l) => l.id === leadId);
    if (ld?.interestedCarId) {
      const match = cars.find((c) => c.id === ld.interestedCarId);
      if (match) setSelectedCarId(match.id);
    }
  };

  // Rolling price calculations
  const rolling = useMemo(() => {
    const basePrice = activeCar ? activeCar.sellingPrice : 0;
    return calculateRollingPriceDetails(basePrice, formDiscount);
  }, [activeCar, formDiscount]);

  // Loan PMT calculation
  const loanCalculations = useMemo(() => {
    const basePrice = activeCar ? activeCar.sellingPrice : 0;
    if (!loanEnabled || basePrice <= 0) {
      return {
        downPaymentAmount: basePrice,
        loanAmount: 0,
        monthlyPayment: 0,
      };
    }
    const downPaymentAmount = Math.round(basePrice * (downPaymentPercent / 100));
    const loanAmount = Math.max(0, basePrice - downPaymentAmount);
    const monthlyPayment = calculatePMT(loanAmount, annualInterestRate, tenureMonths);

    return {
      downPaymentAmount,
      loanAmount,
      monthlyPayment,
    };
  }, [activeCar, loanEnabled, downPaymentPercent, tenureMonths, annualInterestRate]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = q.code.toLowerCase().includes(query);
        const matchName = q.leadName.toLowerCase().includes(query);
        const matchPhone = q.leadPhone.includes(query);
        const matchCar = q.carName.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchPhone && !matchCar) return false;
      }
      return true;
    });
  }, [quotations, statusFilter, searchQuery]);

  // Mini KPI row
  const totalQuotCount = quotations.length;
  const pendingCount = quotations.filter((q) => q.status === 'PENDING_APPROVAL').length;
  const confirmedCount = quotations.filter((q) => q.status === 'DEPOSIT_CONFIRMED').length;
  const rejectedCount = quotations.filter((q) => q.status === 'REJECTED').length;
  const totalConfirmedDeposits = quotations
    .filter((q) => q.status === 'DEPOSIT_CONFIRMED')
    .reduce((sum, q) => sum + (q.depositAmount || 0), 0);

  // Status badge
  const getQuotationStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Bản Nháp (Draft)</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ Ban GĐ Duyệt</span>;
      case 'DEPOSIT_CONFIRMED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã Chốt Cọc</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1"><XCircle className="w-3 h-3" /> Bị Từ Chối</span>;
    }
  };

  // Submit new quotation
  const handleSaveQuotation = (targetStatus: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (!activeLead || !activeCar) {
      alert('Vui lòng chọn đầy đủ Khách hàng và Xe trong kho!');
      return;
    }

    const newQuot: Quotation = {
      id: 'quot-' + Date.now(),
      code: `BG-2024-${Math.floor(100 + Math.random() * 900)}`,
      leadId: activeLead.id,
      leadName: activeLead.customerName,
      leadPhone: activeLead.phone,
      carId: activeCar.id,
      carName: `${activeCar.brand} ${activeCar.model} ${activeCar.year}`,
      carVin: activeCar.vin,
      carPrice: activeCar.sellingPrice,
      registrationTax: rolling.registrationTax,
      plateFee: rolling.plateFee,
      insuranceFee: rolling.insuranceFee,
      otherFees: rolling.otherFees,
      discount: formDiscount,
      totalRollingPrice: rolling.totalRollingPrice,
      loan: {
        enabled: loanEnabled,
        downPaymentPercent,
        downPaymentAmount: loanCalculations.downPaymentAmount,
        loanAmount: loanCalculations.loanAmount,
        tenureMonths,
        annualInterestRate,
        monthlyPayment: loanCalculations.monthlyPayment,
      },
      depositAmount: formDepositAmount,
      status: targetStatus,
      notes: formNotes.trim(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onAddQuotation(newQuot);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Báo Giá Lăn Bánh & Phê Duyệt Đặt Cọc
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {filteredQuotations.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tính chi phí lăn bánh theo quy chuẩn, máy tính trả góp PMT, phê duyệt chiết khấu và xác nhận cọc xe.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedLeadId(leads[0]?.id || '');
            setSelectedCarId(cars[0]?.id || '');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Báo Giá Mới</span>
        </button>
      </div>

      {/* Mini KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Total */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Báo Giá Đã Lập</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalQuotCount} hồ sơ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trên toàn hệ thống</div>
        </div>

        {/* KPI 2: Pending Approval */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700">Chờ Ban GĐ Phê Duyệt</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{pendingCount} hồ sơ</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Cần phê duyệt sớm</div>
        </div>

        {/* KPI 3: Confirmed Deposits */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700">Đã Chốt & Nhận Cọc</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{confirmedCount} xe</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Giao dịch thành công</div>
        </div>

        {/* KPI 4: Total Deposit Revenue */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Tiền Cọc Thực Thu</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1 truncate">
            {formatShortVND(totalConfirmedDeposits)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã vào tài khoản công ty</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã BG, tên khách, số điện thoại, dòng xe..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_APPROVAL">Chờ duyệt</option>
            <option value="DEPOSIT_CONFIRMED">Đã chốt cọc</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Mã Báo Giá</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Xe Ô Tô</th>
                <th className="py-3.5 px-4">Giá Lăn Bánh</th>
                <th className="py-3.5 px-4">Tiền Cọc Yêu Cầu</th>
                <th className="py-3.5 px-4">Hình Thức Mua</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Người Lập / Duyệt</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">Chưa có bảng báo giá nào phù hợp</p>
                    <p className="text-xs">Tạo báo giá mới để gửi Ban Giám Đốc phê duyệt.</p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  return (
                    <tr 
                      key={q.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => setViewingQuotation(q)}
                    >
                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-blue-600 font-mono group-hover:underline">
                          {q.code}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDate(q.createdAt)}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{q.leadName}</div>
                        <div className="text-[11px] text-slate-500">{q.leadPhone}</div>
                      </td>

                      {/* Car */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {q.carName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">VIN: {q.carVin.slice(-8)}</div>
                      </td>

                      {/* Total Rolling Price */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">
                          {formatVND(q.totalRollingPrice)}
                        </div>
                        {q.discount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Giảm: -{formatShortVND(q.discount)}
                          </div>
                        )}
                      </td>

                      {/* Deposit Amount */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700">
                          {formatVND(q.depositAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">Tiền cọc giữ xe</div>
                      </td>

                      {/* Loan vs Cash */}
                      <td className="py-3 px-4">
                        {q.loan.enabled ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                              Trả góp ({q.loan.tenureMonths} tháng)
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ~{formatShortVND(q.loan.monthlyPayment)}/tháng
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            Thanh toán 100%
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getQuotationStatusBadge(q.status)}
                        {q.rejectionReason && (
                          <div className="text-[10px] text-rose-600 truncate max-w-[120px] mt-0.5" title={q.rejectionReason}>
                            Lý do: {q.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Author / Approver */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[130px]">
                          {q.createdByName}
                        </div>
                        {q.approvedByName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            Duyệt: {q.approvedByName}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin/Manager Approve / Reject buttons */}
                          {canApprove && q.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => onUpdateQuotationStatus(q.id, 'DEPOSIT_CONFIRMED', currentUser)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1"
                                title="Phê duyệt cọc"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Duyệt
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalQuot(q);
                                  setRejectionReason('');
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200"
                                title="Từ chối duyệt"
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {/* Print / View details */}
                          <button
                            onClick={() => setViewingQuotation(q)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Xem chi tiết & In phiếu"
                          >
                            <Printer className="w-4 h-4" />
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

      {/* Modal 1: Create New Quotation */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Lập Báo Giá Lăn Bánh & Dự Tính Trả Góp
                </h3>
                <p className="text-xs text-slate-500">
                  Tự động áp dụng công thức: Thuế trước bạ 10%, Biển số 20tr, Bảo hiểm 1.5%
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Lead & Car */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Khách Hàng Tiềm Năng (Lead) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customerName} - {l.phone} ({formatShortVND(l.budget)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Xe Ô Tô Trong Kho <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn xe --</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} {c.year} - {c.version} ({formatShortVND(c.sellingPrice)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rolling Price Breakdown Box */}
            {activeCar && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Chi Tiết Chi Phí Lăn Bánh (Công thức chuẩn)</span>
                  <span className="text-blue-600 font-bold">{activeCar.brand} {activeCar.model} {activeCar.year}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">1. Giá niêm yết xe:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatVND(activeCar.sellingPrice)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">2. Thuế trước bạ (10%):</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatVND(rolling.registrationTax)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">3. Lệ phí cấp biển số:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatVND(rolling.plateFee)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">4. Bảo hiểm vật chất (1.5%):</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatVND(rolling.insuranceFee)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">5. Đăng kiểm & bảo trì ĐB:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatVND(rolling.otherFees)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">6. Chiết khấu giảm giá:</span>
                    <input
                      type="number"
                      step={1_000_000}
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Number(e.target.value))}
                      className="w-full font-bold text-rose-600 bg-transparent border-b border-rose-300 focus:outline-none mt-0.5"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-600 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">TỔNG CHI PHÍ LĂN BÁNH:</span>
                  <span className="text-lg font-extrabold">{formatVND(rolling.totalRollingPrice)}</span>
                </div>
              </div>
            )}

            {/* Installment Calculator PMT */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="loanToggle"
                    checked={loanEnabled}
                    onChange={(e) => setLoanEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="loanToggle" className="text-xs font-bold text-slate-900 cursor-pointer">
                    Kích hoạt phương án vay ngân hàng trả góp (Công thức PMT)
                  </label>
                </div>
                {loanEnabled && (
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Lãi suất {annualInterestRate}%/năm
                  </span>
                )}
              </div>

              {loanEnabled && activeCar && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Tỷ lệ trả trước: <strong>{downPaymentPercent}%</strong>
                      </label>
                      <input
                        type="range"
                        min={20}
                        max={80}
                        step={5}
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Trả trước: {formatShortVND(loanCalculations.downPaymentAmount)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Thời hạn vay (tháng)
                      </label>
                      <select
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      >
                        <option value={12}>12 tháng (1 năm)</option>
                        <option value={24}>24 tháng (2 năm)</option>
                        <option value={36}>36 tháng (3 năm)</option>
                        <option value={48}>48 tháng (4 năm)</option>
                        <option value={60}>60 tháng (5 năm)</option>
                        <option value={72}>72 tháng (6 năm)</option>
                        <option value={84}>84 tháng (7 năm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Lãi suất vay ưu đãi (%/năm)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        value={annualInterestRate}
                        onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-emerald-700 font-medium">Số tiền ngân hàng giải ngân:</span>
                      <p className="font-bold text-sm text-emerald-950">{formatVND(loanCalculations.loanAmount)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-emerald-700 font-medium">Ước tính trả góp hàng tháng (PMT):</span>
                      <p className="text-base font-extrabold text-emerald-700">{formatVND(loanCalculations.monthlyPayment)}/tháng</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deposit Amount & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số tiền đặt cọc quy định (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step={5_000_000}
                  required
                  value={formDepositAmount}
                  onChange={(e) => setFormDepositAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-0.5">
                  = {formatShortVND(formDepositAmount)} (Đặt cọc giữ xe)
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú điều khoản hợp đồng
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="VD: Hẹn ngày 20 nhận xe, tặng thêm dán kính..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('DRAFT')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Lưu Bản Nháp (Draft)
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuotation('PENDING_APPROVAL')}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi Ban GĐ Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: View Printable Quotation & Contract */}
      {viewingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Header Document */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <CarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">CÔNG TY CỔ PHẦN Ô TÔ TNT CAR</h2>
                  <p className="text-[11px] text-slate-500">Hệ thống showroom ô tô đã qua sử dụng đạt chuẩn 160 tiêu chí</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-sm text-blue-600">{viewingQuotation.code}</span>
                <p className="text-[11px] text-slate-400">{formatDate(viewingQuotation.createdAt)}</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-xl font-extrabold uppercase text-slate-900 tracking-wide">
                BẢNG BÁO GIÁ LĂN BÁNH & THỎA THUẬN ĐẶT CỌC
              </h1>
              <div className="flex items-center justify-center gap-2">
                {getQuotationStatusBadge(viewingQuotation.status)}
              </div>
            </div>

            {/* Customer & Car details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-[13px]">BÊN MUA (KHÁCH HÀNG):</span>
                <p>Họ và tên: <strong>{viewingQuotation.leadName}</strong></p>
                <p>Số điện thoại: <strong>{viewingQuotation.leadPhone}</strong></p>
                <p>Chuyên viên tư vấn: {viewingQuotation.createdByName}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-[13px]">THÔNG TIN XE Ô TÔ:</span>
                <p>Dòng xe: <strong>{viewingQuotation.carName}</strong></p>
                <p>Số khung (VIN): <span className="font-mono">{viewingQuotation.carVin}</span></p>
                <p>Giá niêm yết: <strong>{formatVND(viewingQuotation.carPrice)}</strong></p>
              </div>
            </div>

            {/* Price Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Khoản mục chi phí</th>
                    <th className="py-2.5 px-3 text-right">Số tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3">1. Giá bán niêm yết xe ô tô</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatVND(viewingQuotation.carPrice)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">2. Lệ phí trước bạ (10%)</td>
                    <td className="py-2 px-3 text-right">{formatVND(viewingQuotation.registrationTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">3. Lệ phí cấp biển số xe</td>
                    <td className="py-2 px-3 text-right">{formatVND(viewingQuotation.plateFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">4. Bảo hiểm vật chất xe (1.5%)</td>
                    <td className="py-2 px-3 text-right">{formatVND(viewingQuotation.insuranceFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">5. Phí đăng kiểm & bảo trì đường bộ</td>
                    <td className="py-2 px-3 text-right">{formatVND(viewingQuotation.otherFees)}</td>
                  </tr>
                  {viewingQuotation.discount > 0 && (
                    <tr className="text-emerald-700 font-semibold bg-emerald-50/50">
                      <td className="py-2 px-3">6. Chiết khấu ưu đãi từ Ban Giám Đốc</td>
                      <td className="py-2 px-3 text-right">-{formatVND(viewingQuotation.discount)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-900 text-white font-bold text-sm">
                    <td className="py-3 px-3">TỔNG CỘNG CHI PHÍ LĂN BÁNH</td>
                    <td className="py-3 px-3 text-right">{formatVND(viewingQuotation.totalRollingPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Installment info if enabled */}
            {viewingQuotation.loan.enabled && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Calculator className="w-4 h-4" /> Phương án vay trả góp qua ngân hàng đối tác:
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <p>Trả trước ({viewingQuotation.loan.downPaymentPercent}%): <strong>{formatVND(viewingQuotation.loan.downPaymentAmount)}</strong></p>
                  <p>Số tiền vay: <strong>{formatVND(viewingQuotation.loan.loanAmount)}</strong></p>
                  <p>Thời hạn vay: <strong>{viewingQuotation.loan.tenureMonths} tháng</strong> ({viewingQuotation.loan.annualInterestRate}%/năm)</p>
                  <p>Trả góp hàng tháng (PMT): <strong className="text-blue-900 text-sm">{formatVND(viewingQuotation.loan.monthlyPayment)}</strong></p>
                </div>
              </div>
            )}

            {/* Deposit Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">TIỀN ĐẶT CỌC XÁC NHẬN:</span>
                <span className="text-base font-extrabold text-emerald-800">{formatVND(viewingQuotation.depositAmount)}</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Khi thanh toán đủ tiền cọc, xe sẽ được khóa giữ chỗ độc quyền và chuyển trạng thái "Đã cọc".
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 pt-4 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">ĐẠI DIỆN KHÁCH HÀNG</p>
                <p className="text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-slate-800">ĐẠI DIỆN TNT CAR</p>
                <p className="text-slate-700 font-semibold">{viewingQuotation.approvedByName || 'Ban Giám Đốc Phê Duyệt'}</p>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                In Phiếu Báo Giá
              </button>

              <div className="flex items-center gap-2">
                {canApprove && viewingQuotation.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => {
                        onUpdateQuotationStatus(viewingQuotation.id, 'DEPOSIT_CONFIRMED', currentUser);
                        setViewingQuotation(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Phê Duyệt & Xác Nhận Cọc
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingQuotation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reject Modal */}
      {rejectModalQuot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              Từ Chối Báo Giá {rejectModalQuot.code}
            </h3>

            <p className="text-xs text-slate-600">
              Nhập lý do từ chối để chuyên viên <strong>{rejectModalQuot.createdByName}</strong> điều chỉnh lại chiết khấu hoặc phương án tài chính:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="VD: Chiết khấu vượt quá định mức quy định (tối đa 15tr)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalQuot(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onUpdateQuotationStatus(
                    rejectModalQuot.id, 
                    'REJECTED', 
                    currentUser, 
                    rejectionReason || 'Ban Giám Đốc không duyệt mức chiết khấu này'
                  );
                  setRejectModalQuot(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
