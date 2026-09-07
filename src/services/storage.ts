import { User, Car, Lead, Quotation, CareActivity, QuotationStatus } from '../types';
import { SEED_USERS, SEED_CARS, SEED_LEADS, SEED_QUOTATIONS, SEED_ACTIVITIES } from '../data/seedData';

const PREFIX = 'tnt3_';
const KEYS = {
  USERS: `${PREFIX}users`,
  CARS: `${PREFIX}cars`,
  LEADS: `${PREFIX}leads`,
  QUOTATIONS: `${PREFIX}quotations`,
  ACTIVITIES: `${PREFIX}activities`,
  AUTH_USER: `${PREFIX}auth_user`,
};

export const StorageService = {
  // Initialize seed data once
  init() {
    try {
      const existingUsers = localStorage.getItem(KEYS.USERS);
      if (!existingUsers) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
        localStorage.setItem(KEYS.CARS, JSON.stringify(SEED_CARS));
        localStorage.setItem(KEYS.LEADS, JSON.stringify(SEED_LEADS));
        localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(SEED_QUOTATIONS));
        localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
        // Default login as Admin
        localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(SEED_USERS[0]));
      } else {
        // Validate if users array is empty
        const parsed = JSON.parse(existingUsers);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
          localStorage.setItem(KEYS.CARS, JSON.stringify(SEED_CARS));
          localStorage.setItem(KEYS.LEADS, JSON.stringify(SEED_LEADS));
          localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(SEED_QUOTATIONS));
          localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
        }
      }
    } catch (e) {
      console.error('Failed to initialize storage', e);
    }
  },

  resetAllData() {
    localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(KEYS.CARS, JSON.stringify(SEED_CARS));
    localStorage.setItem(KEYS.LEADS, JSON.stringify(SEED_LEADS));
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(SEED_QUOTATIONS));
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(SEED_ACTIVITIES));
    localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(SEED_USERS[0]));
  },

  // Auth
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.AUTH_USER);
    }
  },

  // Users
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  updateUser(updated: User) {
    const users = this.getUsers().map((u) => (u.id === updated.id ? updated : u));
    this.saveUsers(users);
    const curr = this.getCurrentUser();
    if (curr && curr.id === updated.id) {
      this.setCurrentUser(updated);
    }
  },

  addUser(user: User) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  // Cars
  getCars(): Car[] {
    try {
      const data = localStorage.getItem(KEYS.CARS);
      return data ? JSON.parse(data) : SEED_CARS;
    } catch {
      return SEED_CARS;
    }
  },

  saveCars(cars: Car[]) {
    localStorage.setItem(KEYS.CARS, JSON.stringify(cars));
  },

  getCarById(id: string): Car | undefined {
    return this.getCars().find((c) => c.id === id);
  },

  addCar(car: Car, author?: User) {
    const cars = this.getCars();
    cars.unshift(car);
    this.saveCars(cars);

    if (author) {
      this.addActivity({
        id: 'act-' + Date.now(),
        leadId: '',
        leadName: 'Hệ thống Kho Xe',
        type: 'NOTE',
        content: `Nhập xe mới vào kho: ${car.brand} ${car.model} ${car.year} (VIN: ${car.vin}) với giá thu ${new Intl.NumberFormat('vi-VN').format(car.purchasePrice)} ₫.`,
        authorName: author.name,
        authorId: author.id,
        createdAt: new Date().toISOString(),
      });
    }
  },

  updateCar(updated: Car) {
    const cars = this.getCars().map((c) => (c.id === updated.id ? updated : c));
    this.saveCars(cars);
  },

  deleteCar(id: string) {
    const cars = this.getCars().filter((c) => c.id !== id);
    this.saveCars(cars);
  },

  holdCar(carId: string, durationMinutes = 120, customerName: string, user: User) {
    const cars = this.getCars();
    const car = cars.find((c) => c.id === carId);
    if (!car) return;

    const holdUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    car.status = 'HOLD';
    car.holdUntil = holdUntil;
    car.holdBy = user.name;
    car.holdCustomerName = customerName;

    this.saveCars(cars);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: '',
      leadName: customerName || 'Khách hàng',
      type: 'NOTE',
      content: `Giữ chỗ xe ${car.brand} ${car.model} (VIN: ${car.vin}) trong ${Math.round(durationMinutes / 60)} giờ cho khách ${customerName}.`,
      authorName: user.name,
      authorId: user.id,
      createdAt: new Date().toISOString(),
    });
  },

  releaseHold(carId: string, user: User) {
    const cars = this.getCars();
    const car = cars.find((c) => c.id === carId);
    if (!car) return;

    car.status = 'AVAILABLE';
    delete car.holdUntil;
    delete car.holdBy;
    delete car.holdCustomerName;

    this.saveCars(cars);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: '',
      leadName: 'Kho xe',
      type: 'NOTE',
      content: `Hủy giữ chỗ, mở bán lại xe ${car.brand} ${car.model} (VIN: ${car.vin}).`,
      authorName: user.name,
      authorId: user.id,
      createdAt: new Date().toISOString(),
    });
  },

  // Leads
  getLeads(): Lead[] {
    try {
      const data = localStorage.getItem(KEYS.LEADS);
      return data ? JSON.parse(data) : SEED_LEADS;
    } catch {
      return SEED_LEADS;
    }
  },

  saveLeads(leads: Lead[]) {
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  },

  getLeadById(id: string): Lead | undefined {
    return this.getLeads().find((l) => l.id === id);
  },

  addLead(lead: Lead, authorName = 'Hệ thống') {
    const leads = this.getLeads();
    leads.unshift(lead);
    this.saveLeads(leads);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: lead.id,
      leadName: lead.customerName,
      type: lead.tradeInInfo ? 'TRADE_IN' : 'NOTE',
      content: lead.tradeInInfo
        ? `Tạo yêu cầu Thu Cũ Đổi Mới: ${lead.tradeInInfo.brand} ${lead.tradeInInfo.model} (${lead.tradeInInfo.year}) định giá sơ bộ ${new Intl.NumberFormat('vi-VN').format(lead.tradeInInfo.estimatedValue)} ₫.`
        : `Tạo Lead mới từ nguồn [${lead.source}]: ${lead.customerName} - SĐT: ${lead.phone}${lead.isVip ? ' [VIP]' : ''}.`,
      authorName,
      authorId: lead.assignedToUserId,
      createdAt: new Date().toISOString(),
    });
  },

  updateLead(updated: Lead, authorName = 'Hệ thống', authorId = '') {
    const leads = this.getLeads();
    const oldLead = leads.find((l) => l.id === updated.id);
    const newLeads = leads.map((l) => (l.id === updated.id ? updated : l));
    this.saveLeads(newLeads);

    if (oldLead && oldLead.status !== updated.status) {
      this.addActivity({
        id: 'act-' + Date.now(),
        leadId: updated.id,
        leadName: updated.customerName,
        type: 'STATUS_CHANGE',
        content: `Chuyển trạng thái từ "${oldLead.status}" sang "${updated.status}".`,
        authorName,
        authorId,
        createdAt: new Date().toISOString(),
      });
    }
  },

  deleteLead(id: string) {
    const leads = this.getLeads().filter((l) => l.id !== id);
    this.saveLeads(leads);
  },

  assignLead(leadId: string, newUser: User, assignedBy: User) {
    const leads = this.getLeads();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const prevOwner = lead.assignedToName;
    lead.assignedToUserId = newUser.id;
    lead.assignedToName = newUser.name;
    lead.updatedAt = new Date().toISOString().split('T')[0];

    this.saveLeads(leads);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: lead.id,
      leadName: lead.customerName,
      type: 'ASSIGN',
      content: `Chuyển quyền quản lý lead từ [${prevOwner}] sang [${newUser.name}].`,
      authorName: assignedBy.name,
      authorId: assignedBy.id,
      createdAt: new Date().toISOString(),
    });
  },

  // Quotations
  getQuotations(): Quotation[] {
    try {
      const data = localStorage.getItem(KEYS.QUOTATIONS);
      return data ? JSON.parse(data) : SEED_QUOTATIONS;
    } catch {
      return SEED_QUOTATIONS;
    }
  },

  saveQuotations(quotations: Quotation[]) {
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
  },

  addQuotation(quotation: Quotation, author: User) {
    const list = this.getQuotations();
    list.unshift(quotation);
    this.saveQuotations(list);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: quotation.leadId,
      leadName: quotation.leadName,
      type: 'QUOTATION',
      content: `Tạo báo giá mới ${quotation.code} cho xe ${quotation.carName} với tổng chi phí lăn bánh ${new Intl.NumberFormat('vi-VN').format(quotation.totalRollingPrice)} ₫. Trạng thái: ${quotation.status}.`,
      authorName: author.name,
      authorId: author.id,
      createdAt: new Date().toISOString(),
    });
  },

  updateQuotationStatus(
    quotationId: string,
    status: QuotationStatus,
    approver: User,
    rejectionReason?: string
  ) {
    const list = this.getQuotations();
    const q = list.find((item) => item.id === quotationId);
    if (!q) return;

    const oldStatus = q.status;
    q.status = status;
    q.updatedAt = new Date().toISOString().split('T')[0];
    if (status === 'DEPOSIT_CONFIRMED' || status === 'REJECTED') {
      q.approvedByUserId = approver.id;
      q.approvedByName = approver.name;
    }
    if (rejectionReason) {
      q.rejectionReason = rejectionReason;
    }

    // If confirmed, update car status to DEPOSITED and lead to WON
    if (status === 'DEPOSIT_CONFIRMED') {
      const cars = this.getCars();
      const car = cars.find((c) => c.id === q.carId);
      if (car) {
        car.status = 'DEPOSITED';
        this.saveCars(cars);
      }

      const leads = this.getLeads();
      const lead = leads.find((l) => l.id === q.leadId);
      if (lead) {
        lead.status = 'Won';
        lead.updatedAt = new Date().toISOString().split('T')[0];
        this.saveLeads(leads);
      }
    }

    this.saveQuotations(list);

    this.addActivity({
      id: 'act-' + Date.now(),
      leadId: q.leadId,
      leadName: q.leadName,
      type: 'QUOTATION',
      content: `Báo giá ${q.code} được ${approver.name} cập nhật trạng thái: "${oldStatus}" ➔ "${status}"${
        rejectionReason ? ` (Lý do: ${rejectionReason})` : ''
      }.`,
      authorName: approver.name,
      authorId: approver.id,
      createdAt: new Date().toISOString(),
    });
  },

  // Activities
  getActivities(): CareActivity[] {
    try {
      const data = localStorage.getItem(KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : SEED_ACTIVITIES;
    } catch {
      return SEED_ACTIVITIES;
    }
  },

  addActivity(activity: CareActivity) {
    const list = this.getActivities();
    list.unshift(activity);
    if (list.length > 100) list.pop(); // keep last 100
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(list));
  },
};

// Standalone function wrappers for named imports
export const initializeStorage = () => StorageService.init();
export const getStoredAuthUser = () => StorageService.getCurrentUser();
export const saveStoredAuthUser = (user: User | null) => StorageService.setCurrentUser(user);
export const getStoredUsers = () => StorageService.getUsers();
export const getStoredLeads = () => StorageService.getLeads();
export const saveStoredLeads = (leads: Lead[]) => StorageService.saveLeads(leads);
export const getStoredCars = () => StorageService.getCars();
export const saveStoredCars = (cars: Car[]) => StorageService.saveCars(cars);
export const getStoredQuotations = () => StorageService.getQuotations();
export const saveStoredQuotations = (quots: Quotation[]) => StorageService.saveQuotations(quots);
export const getStoredActivities = () => StorageService.getActivities();
export const saveStoredActivities = (acts: CareActivity[]) => {
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(acts));
};
export const logAuditActivity = (
  author: User, 
  actionType: string, 
  description: string, 
  refId?: string
) => {
  StorageService.addActivity({
    id: 'audit-' + Date.now(),
    leadId: refId || '',
    leadName: actionType,
    type: 'NOTE',
    content: description,
    authorName: author.name,
    authorId: author.id,
    createdAt: new Date().toISOString(),
  });
};
export const checkHoldExpiration = (): Car[] => {
  const cars = StorageService.getCars();
  let hasChanged = false;
  const now = Date.now();

  const updatedCars = cars.map((car) => {
    if (car.status === 'HOLD' && car.holdUntil) {
      const until = typeof car.holdUntil === 'number' ? car.holdUntil : new Date(car.holdUntil).getTime();
      if (until < now) {
        hasChanged = true;
        const copy = { ...car, status: 'AVAILABLE' as const };
        delete copy.holdUntil;
        delete copy.holdBy;
        delete copy.holdCustomerName;
        return copy;
      }
    }
    return car;
  });

  if (hasChanged) {
    StorageService.saveCars(updatedCars);
  }
  return updatedCars;
};

