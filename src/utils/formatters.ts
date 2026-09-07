// Utility and formatting functions for TNT CAR CRM

export const VN_PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;

export function validateVNPhone(phone: string): boolean {
  return VN_PHONE_REGEX.test(phone.trim().replace(/\s+/g, ''));
}

export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

export function formatShortVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 đ';
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    return Number.isInteger(ty) ? `${ty} tỷ` : `${ty.toFixed(2).replace(/\.?0+$/, '')} tỷ`;
  }
  if (amount >= 1_000_000) {
    const tr = amount / 1_000_000;
    return Number.isInteger(tr) ? `${tr} triệu` : `${tr.toFixed(1).replace(/\.?0+$/, '')} triệu`;
  }
  return formatVND(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getDaysInStock(importDate: string): number {
  try {
    const imported = new Date(importDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - imported.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
}

export function isOver45Days(importDate: string): boolean {
  return getDaysInStock(importDate) > 45;
}

/**
 * Standard PMT formula:
 * P: Principal (Loan Amount)
 * annualRatePct: Annual interest rate in percent (e.g. 8.5)
 * tenureMonths: Tenure in months (e.g. 60)
 */
export function calculatePMT(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = (annualRatePct / 100) / 12;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const pmt = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(pmt);
}

/**
 * Rolling price calculation according to specs:
 * - Registration tax: 10%
 * - Plate fee: 20,000,000 VNĐ
 * - Physical Insurance: 1.5%
 * - Road fee / inspection: 3,800,000 VNĐ
 */
export function calculateRollingPriceDetails(carPrice: number, discount = 0) {
  const registrationTax = Math.round(carPrice * 0.10);
  const plateFee = 20_000_000;
  const insuranceFee = Math.round(carPrice * 0.015);
  const otherFees = 3_800_000;
  const totalRollingPrice = Math.max(0, carPrice + registrationTax + plateFee + insuranceFee + otherFees - discount);

  return {
    carPrice,
    registrationTax,
    plateFee,
    insuranceFee,
    otherFees,
    discount,
    totalRollingPrice,
  };
}

export function getBrandGradient(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes('toyota')) return 'from-red-600 via-rose-700 to-slate-900';
  if (b.includes('mazda')) return 'from-rose-700 via-red-900 to-slate-900';
  if (b.includes('bmw')) return 'from-blue-600 via-sky-700 to-slate-900';
  if (b.includes('mercedes')) return 'from-slate-700 via-zinc-800 to-black';
  if (b.includes('ford')) return 'from-blue-700 via-indigo-900 to-slate-900';
  if (b.includes('hyundai')) return 'from-cyan-700 via-blue-800 to-slate-900';
  if (b.includes('kia')) return 'from-red-700 via-zinc-800 to-slate-900';
  if (b.includes('honda')) return 'from-emerald-700 via-teal-900 to-slate-900';
  if (b.includes('mitsubishi')) return 'from-red-600 via-zinc-800 to-slate-900';
  if (b.includes('nissan')) return 'from-stone-700 via-red-900 to-slate-900';
  if (b.includes('volkswagen') || b.includes('vw')) return 'from-indigo-600 via-blue-900 to-slate-900';
  return 'from-slate-700 via-slate-800 to-slate-900';
}

export function getBodyTypeEmoji(bodyType: string): string {
  switch (bodyType) {
    case 'Sedan':
      return '🚗';
    case 'SUV':
      return '🚙';
    case 'Bán tải':
      return '🛻';
    case 'MPV':
      return '🚐';
    case 'Hatchback':
      return '🚗';
    default:
      return '🚘';
  }
}
