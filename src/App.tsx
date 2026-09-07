import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  AppView, 
  Lead, 
  Car, 
  Quotation, 
  CareActivity, 
  QuotationStatus 
} from './types';
import { 
  initializeStorage, 
  getStoredAuthUser, 
  saveStoredAuthUser,
  getStoredUsers, 
  getStoredLeads, 
  saveStoredLeads, 
  getStoredCars, 
  saveStoredCars, 
  getStoredQuotations, 
  saveStoredQuotations, 
  getStoredActivities, 
  saveStoredActivities,
  logAuditActivity,
  checkHoldExpiration
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { LeadManagement } from './components/LeadManagement';
import { InventoryPage } from './components/InventoryPage';
import { QuotationPage } from './components/QuotationPage';
import { WebsiteListing } from './components/WebsiteListing';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  // Initialize storage with seed data on first mount
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    initializeStorage();
    return getStoredAuthUser();
  });

  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core collections in local state
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activities, setActivities] = useState<CareActivity[]>([]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Preselected lead or car to forward to Quotation Page
  const [preSelectedLead, setPreSelectedLead] = useState<Lead | null>(null);
  const [preSelectedCar, setPreSelectedCar] = useState<Car | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Load all data from storage
  const reloadDataFromStorage = useCallback(() => {
    // Run hold expiration check
    const refreshedCars = checkHoldExpiration();
    setCars(refreshedCars);

    setUsers(getStoredUsers());
    setLeads(getStoredLeads());
    setQuotations(getStoredQuotations());
    setActivities(getStoredActivities());
  }, []);

  useEffect(() => {
    reloadDataFromStorage();

    // Check hold expiration every 60s
    const timer = setInterval(() => {
      const refreshedCars = checkHoldExpiration();
      setCars(refreshedCars);
    }, 60000);

    return () => clearInterval(timer);
  }, [reloadDataFromStorage]);

  // Handle Login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);
    setCurrentView('DASHBOARD');
    showToast(`Đăng nhập thành công! Chào mừng ${user.name} (${user.role}).`);
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    saveStoredAuthUser(null);
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  // Handle Demo User Switch
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);
    showToast(`Đã chuyển phiên làm việc sang: ${user.name} [${user.role}].`);
  };

  // ------------------ LEAD OPERATIONS ------------------
  const handleAddLead = (newLead: Lead) => {
    const updated = [newLead, ...leads];
    setLeads(updated);
    saveStoredLeads(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'TẠO_LEAD',
        `Tạo khách hàng tiềm năng mới: ${newLead.customerName} (${newLead.phone}), ngân sách ${newLead.budget.toLocaleString()} đ`,
        newLead.id
      );
    }
    reloadDataFromStorage();
    showToast(`Đã thêm khách hàng ${newLead.customerName} vào hệ thống!`);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const updated = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    setLeads(updated);
    saveStoredLeads(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'CẬP_NHẬT_LEAD',
        `Cập nhật trạng thái lead ${updatedLead.customerName} thành "${updatedLead.status}"`,
        updatedLead.id
      );
    }
    reloadDataFromStorage();
    showToast(`Cập nhật trạng thái khách hàng ${updatedLead.customerName} thành công.`);
  };

  const handleAssignLead = (leadId: string, newUser: User) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const updated = leads.map((l) => {
      if (l.id === leadId) {
        return {
          ...l,
          assignedToUserId: newUser.id,
          assignedToName: newUser.name,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return l;
    });

    setLeads(updated);
    saveStoredLeads(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'GÁN_LEAD',
        `Chuyển khách hàng ${targetLead.customerName} từ ${targetLead.assignedToName} cho ${newUser.name}`,
        leadId
      );
    }
    reloadDataFromStorage();
    showToast(`Đã chuyển lead cho chuyên viên ${newUser.name}.`);
  };

  const handleAddCareActivity = (activity: CareActivity) => {
    const updated = [activity, ...activities];
    setActivities(updated);
    saveStoredActivities(updated);
    showToast('Đã lưu ghi chú chăm sóc khách hàng.');
  };

  // ------------------ CAR / INVENTORY OPERATIONS ------------------
  const handleAddCar = (newCar: Car) => {
    const updated = [newCar, ...cars];
    setCars(updated);
    saveStoredCars(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'NHẬP_KHO_XE',
        `Nhập kho xe ${newCar.brand} ${newCar.model} ${newCar.year}, giá thu ${newCar.purchasePrice.toLocaleString()} đ`,
        newCar.id
      );
    }
    reloadDataFromStorage();
    showToast(`Đã nhập xe ${newCar.brand} ${newCar.model} vào kho!`);
  };

  const handleUpdateCar = (updatedCar: Car) => {
    const updated = cars.map((c) => (c.id === updatedCar.id ? updatedCar : c));
    setCars(updated);
    saveStoredCars(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'SỬA_XE',
        `Cập nhật thông tin xe ${updatedCar.brand} ${updatedCar.model} (${updatedCar.plateNumber})`,
        updatedCar.id
      );
    }
    reloadDataFromStorage();
    showToast(`Đã cập nhật xe ${updatedCar.brand} ${updatedCar.model}.`);
  };

  const handleDeleteCar = (carId: string) => {
    const target = cars.find((c) => c.id === carId);
    const updated = cars.filter((c) => c.id !== carId);
    setCars(updated);
    saveStoredCars(updated);

    if (currentUser && target) {
      logAuditActivity(
        currentUser,
        'XÓA_XE',
        `Xóa xe ${target.brand} ${target.model} khỏi kho`,
        carId
      );
    }
    reloadDataFromStorage();
    showToast('Đã xóa xe khỏi kho.', 'info');
  };

  const handleHoldCar = (carId: string, durationMinutes: number, customerName: string) => {
    const expireTime = Date.now() + durationMinutes * 60 * 1000;
    const target = cars.find((c) => c.id === carId);

    const updated = cars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'HOLD' as const,
          holdBy: customerName,
          holdUntil: expireTime,
        };
      }
      return c;
    });

    setCars(updated);
    saveStoredCars(updated);

    if (currentUser && target) {
      logAuditActivity(
        currentUser,
        'GIỮ_CHỖ_XE',
        `Giữ chỗ xe ${target.brand} ${target.model} trong 2 giờ cho khách ${customerName}`,
        carId
      );
    }
    reloadDataFromStorage();
    showToast(`Đã giữ chỗ xe trong 2 giờ cho khách ${customerName}!`);
  };

  const handleReleaseHold = (carId: string) => {
    const target = cars.find((c) => c.id === carId);
    const updated = cars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'AVAILABLE' as const,
          holdBy: undefined,
          holdUntil: undefined,
        };
      }
      return c;
    });

    setCars(updated);
    saveStoredCars(updated);

    if (currentUser && target) {
      logAuditActivity(
        currentUser,
        'NHẢ_GIỮ_CHỖ',
        `Hủy giữ chỗ xe ${target.brand} ${target.model}, mở bán lại cho khách khác`,
        carId
      );
    }
    reloadDataFromStorage();
    showToast(`Đã hủy giữ chỗ xe ${target?.model || ''}, xe đã sẵn sàng bán lại.`);
  };

  // ------------------ QUOTATION OPERATIONS ------------------
  const handleAddQuotation = (quotation: Quotation) => {
    const updated = [quotation, ...quotations];
    setQuotations(updated);
    saveStoredQuotations(updated);

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'TẠO_BÁO_GIÁ',
        `Lập báo giá ${quotation.code} cho khách ${quotation.leadName} (${quotation.carName}) - Tổng lăn bánh: ${quotation.totalRollingPrice.toLocaleString()} đ`,
        quotation.id
      );
    }
    reloadDataFromStorage();
    showToast(`Đã lập báo giá ${quotation.code} thành công!`);
  };

  const handleUpdateQuotationStatus = (
    quotationId: string,
    status: QuotationStatus,
    approver: User,
    rejectionReason?: string
  ) => {
    const target = quotations.find((q) => q.id === quotationId);
    if (!target) return;

    const updated = quotations.map((q) => {
      if (q.id === quotationId) {
        return {
          ...q,
          status,
          approvedByUserId: status === 'DEPOSIT_CONFIRMED' ? approver.id : q.approvedByUserId,
          approvedByName: status === 'DEPOSIT_CONFIRMED' ? approver.name : q.approvedByName,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return q;
    });

    setQuotations(updated);
    saveStoredQuotations(updated);

    // If deposit confirmed, also update car status to DEPOSITED and lead to WON
    if (status === 'DEPOSIT_CONFIRMED') {
      const updatedCars = cars.map((c) => {
        if (c.id === target.carId) {
          return { ...c, status: 'DEPOSITED' as const };
        }
        return c;
      });
      setCars(updatedCars);
      saveStoredCars(updatedCars);

      const updatedLeads = leads.map((l) => {
        if (l.id === target.leadId) {
          return { ...l, status: 'Won' as const };
        }
        return l;
      });
      setLeads(updatedLeads);
      saveStoredLeads(updatedLeads);
    }

    if (currentUser) {
      logAuditActivity(
        currentUser,
        'DUYỆT_BÁO_GIÁ',
        `Ban Giám Đốc (${approver.name}) cập nhật trạng thái báo giá ${target.code} thành "${status}"`,
        quotationId
      );
    }

    reloadDataFromStorage();
    showToast(
      status === 'DEPOSIT_CONFIRMED'
        ? `Đã phê duyệt cọc thành công cho báo giá ${target.code}! Xe chuyển trạng thái 'Đã nhận cọc'.`
        : `Đã từ chối báo giá ${target.code}.`
    );
  };

  // Cross-module actions
  const handleCreateQuotationForLead = (lead: Lead, car?: Car) => {
    setPreSelectedLead(lead);
    setPreSelectedCar(car || null);
    setCurrentView('QUOTATIONS');
  };

  const handleCreateQuotationForCar = (car: Car) => {
    setPreSelectedCar(car);
    setPreSelectedLead(null);
    setCurrentView('QUOTATIONS');
  };

  // Public customer leads from Website
  const handleRegisterCustomerLeadFromWeb = (lead: Lead) => {
    const updated = [lead, ...leads];
    setLeads(updated);
    saveStoredLeads(updated);
    reloadDataFromStorage();
    showToast(`Lead mới từ website: Khách ${lead.customerName} (${lead.phone})!`);
  };

  // ------------------ RENDER VIEW ------------------
  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        allUsers={users.length > 0 ? users : getStoredUsers()}
      />
    );
  }

  // If user navigated to Public Website Listing
  if (currentView === 'WEBSITE') {
    return (
      <div className="relative">
        <WebsiteListing
          cars={cars}
          onRegisterCustomerLead={handleRegisterCustomerLeadFromWeb}
          onBackToCRM={() => setCurrentView('DASHBOARD')}
        />

        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-slide-up">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // CRM Portal Layout (Navbar + Sidebar + View)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenWebsite={() => setCurrentView('WEBSITE')}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          leadsCount={leads.filter((l) => l.status === 'New').length}
          carsCount={cars.filter((c) => c.status === 'AVAILABLE').length}
          quotationsCount={quotations.filter((q) => q.status === 'PENDING_APPROVAL').length}
        />

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-100/60 pb-16">
          {currentView === 'DASHBOARD' && (
            <Dashboard
              currentUser={currentUser}
              leads={leads}
              cars={cars}
              quotations={quotations}
              activities={activities}
              allUsers={users}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'LEADS' && (
            <LeadManagement
              currentUser={currentUser}
              leads={leads}
              cars={cars}
              allUsers={users}
              activities={activities}
              onAddLead={handleAddLead}
              onUpdateLead={handleUpdateLead}
              onAssignLead={handleAssignLead}
              onAddActivity={handleAddCareActivity}
              onCreateQuotationForLead={handleCreateQuotationForLead}
            />
          )}

          {currentView === 'INVENTORY' && (
            <InventoryPage
              currentUser={currentUser}
              cars={cars}
              onAddCar={handleAddCar}
              onUpdateCar={handleUpdateCar}
              onDeleteCar={handleDeleteCar}
              onHoldCar={handleHoldCar}
              onReleaseHold={handleReleaseHold}
              onCreateQuotationForCar={handleCreateQuotationForCar}
            />
          )}

          {currentView === 'QUOTATIONS' && (
            <QuotationPage
              currentUser={currentUser}
              quotations={quotations}
              leads={leads}
              cars={cars}
              onAddQuotation={handleAddQuotation}
              onUpdateQuotationStatus={handleUpdateQuotationStatus}
              preSelectedLead={preSelectedLead}
              preSelectedCar={preSelectedCar}
              onClearPreSelections={() => {
                setPreSelectedLead(null);
                setPreSelectedCar(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-slide-up">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
