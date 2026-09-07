export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatar: string;
  phone: string;
  department: string;
}

export type CarStatus = 'AVAILABLE' | 'HOLD' | 'DEPOSITED' | 'MAINTENANCE' | 'SOLD';

export type BodyType = 'Sedan' | 'SUV' | 'Bán tải' | 'MPV' | 'Hatchback';

export type Transmission = 'Tự động' | 'Số sàn';

export type FuelType = 'Xăng' | 'Dầu' | 'Hybrid' | 'Điện';

export interface InspectionReport {
  engineTransmission: boolean; // Động cơ & Hộp số nguyên bản
  chassisBody: boolean;        // Khung gầm keo chỉ không đâm đụng
  noFloodWater: boolean;       // Không thủy kích, ngập nước
  electricalSystems: boolean;  // Hệ thống điện & cảm biến hoạt động tốt
  legalClearance: boolean;     // Pháp lý chuẩn, không phạt nguội, sang tên ngay
  passedCount: number;         // 160/160 tiêu chí
}

export interface Car {
  id: string;
  vin: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  mileage: number; // km (ODO)
  transmission: Transmission;
  fuel: FuelType;
  bodyType: BodyType;
  color: string;
  seats: number;
  plateNumber: string;
  location: string;
  importDate: string; // YYYY-MM-DD
  purchasePrice: number; // Giá thu (VNĐ)
  repairCost: number;    // Chi phí sửa chữa, bảo dưỡng (VNĐ)
  sellingPrice: number;  // Giá bán niêm yết (VNĐ)
  status: CarStatus;
  holdUntil?: string;    // ISO date string if HOLD
  holdBy?: string;       // User name who holds
  holdCustomerName?: string;
  inspected: boolean;
  inspectionReport: InspectionReport;
  images: string[];
  description: string;
  features: string[];
}

export type LeadSource = 'Website' | 'Showroom' | 'Hotline' | 'Facebook' | 'Giới thiệu';

export type LeadStatus = 'New' | 'In-progress' | 'Test-drive' | 'Won' | 'Lost';

export interface TradeInDetail {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  condition: string;
  estimatedValue: number;
  targetCarId?: string;
}

export interface Lead {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string;
  budget: number; // VNĐ
  source: LeadSource;
  status: LeadStatus;
  interestedCarId?: string;
  interestedCarName?: string;
  assignedToUserId: string;
  assignedToName: string;
  notes: string;
  isVip: boolean; // budget >= 800 triệu
  tradeInInfo?: TradeInDetail;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'CALL' | 'NOTE' | 'TEST_DRIVE' | 'STATUS_CHANGE' | 'ASSIGN' | 'QUOTATION' | 'TRADE_IN';

export interface CareActivity {
  id: string;
  leadId: string;
  leadName: string;
  type: ActivityType;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'DEPOSIT_CONFIRMED' | 'REJECTED';

export interface LoanCalculation {
  enabled: boolean;
  downPaymentPercent: number; // e.g. 30%
  downPaymentAmount: number;
  loanAmount: number;
  tenureMonths: number;       // e.g. 60
  annualInterestRate: number; // e.g. 8.5%
  monthlyPayment: number;     // PMT
}

export interface Quotation {
  id: string;
  code: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  carId: string;
  carName: string;
  carVin: string;
  carPrice: number;
  registrationTax: number;  // 10%
  plateFee: number;         // 20,000,000 VNĐ
  insuranceFee: number;     // 1.5%
  otherFees: number;        // e.g. 3,800,000 (đăng kiểm, đường bộ)
  discount: number;
  totalRollingPrice: number;
  loan: LoanCalculation;
  depositAmount: number;    // Tiền cọc tối thiểu (ví dụ 30-50tr)
  status: QuotationStatus;
  rejectionReason?: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  approvedByUserId?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppView = 'DASHBOARD' | 'LEADS' | 'INVENTORY' | 'QUOTATIONS' | 'WEBSITE' | 'USERS';
