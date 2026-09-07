import React, { useState, useMemo } from 'react';
import { User, Car, CarStatus, BodyType, FuelType, Transmission } from '../types';
import { 
  Car as CarIcon, 
  Search, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Eye, 
  FileText, 
  Edit, 
  Trash2, 
  X, 
  TrendingUp, 
  Sparkles, 
  Lock, 
  Unlock,
  SlidersHorizontal,
  Calendar,
  Gauge
} from 'lucide-react';
import { 
  formatVND, 
  formatShortVND, 
  formatDate, 
  getDaysInStock, 
  isOver45Days, 
  getBodyTypeEmoji,
  getBrandGradient 
} from '../utils/formatters';

interface InventoryPageProps {
  currentUser: User;
  cars: Car[];
  onAddCar: (car: Car) => void;
  onUpdateCar: (car: Car) => void;
  onDeleteCar: (carId: string) => void;
  onHoldCar: (carId: string, durationMinutes: number, customerName: string) => void;
  onReleaseHold: (carId: string) => void;
  onCreateQuotationForCar: (car: Car) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  currentUser,
  cars,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onHoldCar,
  onReleaseHold,
  onCreateQuotationForCar,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const canViewFinancials = isAdmin || isManager;
  const canEditCar = isAdmin || isManager;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedBodyType, setSelectedBodyType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [onlyOver45Days, setOnlyOver45Days] = useState(false);

  // Modal states
  const [selectedCarForDetail, setSelectedCarForDetail] = useState<Car | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Hold 2h modal
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [carToHold, setCarToHold] = useState<Car | null>(null);
  const [holdCustomerName, setHoldCustomerName] = useState('');

  // Extract unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(cars.map((c) => c.brand)));
    return list.sort();
  }, [cars]);

  // Filtered cars
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (selectedBrand !== 'ALL' && car.brand !== selectedBrand) return false;
      if (selectedBodyType !== 'ALL' && car.bodyType !== selectedBodyType) return false;
      if (selectedStatus !== 'ALL' && car.status !== selectedStatus) return false;
      if (onlyOver45Days && !isOver45Days(car.importDate)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBrand = car.brand.toLowerCase().includes(q);
        const matchModel = car.model.toLowerCase().includes(q);
        const matchVin = car.vin.toLowerCase().includes(q);
        const matchPlate = car.plateNumber.toLowerCase().includes(q);
        if (!matchBrand && !matchModel && !matchVin && !matchPlate) return false;
      }

      return true;
    });
  }, [cars, selectedBrand, selectedBodyType, selectedStatus, onlyOver45Days, searchQuery]);

  // Mini KPI Calculations
  const totalStockCount = cars.length;
  const availableCount = cars.filter((c) => c.status === 'AVAILABLE').length;
  const holdCount = cars.filter((c) => c.status === 'HOLD').length;
  const depositedCount = cars.filter((c) => c.status === 'DEPOSITED').length;
  const over45DaysCount = cars.filter((c) => isOver45Days(c.importDate)).length;

  const totalStockValue = cars.reduce((sum, c) => sum + (c.sellingPrice || 0), 0);
  const totalPurchaseValue = cars.reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
  const totalEstimatedProfit = cars.reduce(
    (sum, c) => sum + (c.sellingPrice - c.purchasePrice - c.repairCost),
    0
  );

  // Status badge
  const getCarStatusBadge = (status: CarStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Sẵn Sàng Bán</span>;
      case 'HOLD':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Đang Giữ Chỗ (2h)</span>;
      case 'DEPOSITED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Đã Nhận Cọc</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">Đang Dọn & Bảo Dưỡng</span>;
      case 'SOLD':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Đã Bàn Giao</span>;
    }
  };

  // Handle Hold 2h
  const handleConfirmHold = () => {
    if (!carToHold || !holdCustomerName.trim()) return;
    onHoldCar(carToHold.id, 120, holdCustomerName.trim());
    setIsHoldModalOpen(false);
    setCarToHold(null);
    setHoldCustomerName('');
  };

  // Form State for Add / Edit Car
  const [formVin, setFormVin] = useState('');
  const [formBrand, setFormBrand] = useState('Toyota');
  const [formModel, setFormModel] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formYear, setFormYear] = useState<number>(2022);
  const [formMileage, setFormMileage] = useState<number>(30000);
  const [formTransmission, setFormTransmission] = useState<Transmission>('Tự động');
  const [formFuel, setFormFuel] = useState<FuelType>('Xăng');
  const [formBodyType, setFormBodyType] = useState<BodyType>('Sedan');
  const [formColor, setFormColor] = useState('Trắng');
  const [formSeats, setFormSeats] = useState<number>(5);
  const [formPlate, setFormPlate] = useState('');
  const [formLocation, setFormLocation] = useState('Showroom 1 - Mỹ Đình');
  const [formImportDate, setFormImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(600_000_000);
  const [formRepairCost, setFormRepairCost] = useState<number>(10_000_000);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(680_000_000);
  const [formStatus, setFormStatus] = useState<CarStatus>('AVAILABLE');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const openAddCarModal = () => {
    setEditingCar(null);
    setFormVin(`VIN${Math.floor(10000000 + Math.random() * 90000000)}`);
    setFormBrand('Toyota');
    setFormModel('Corolla Altis');
    setFormVersion('1.8G CVT');
    setFormYear(2022);
    setFormMileage(28000);
    setFormTransmission('Tự động');
    setFormFuel('Xăng');
    setFormBodyType('Sedan');
    setFormColor('Trắng Ngọc Trai');
    setFormSeats(5);
    setFormPlate('30H-123.45');
    setFormLocation('Showroom 1 - Mỹ Đình');
    setFormImportDate(new Date().toISOString().split('T')[0]);
    setFormPurchasePrice(580_000_000);
    setFormRepairCost(8_000_000);
    setFormSellingPrice(650_000_000);
    setFormStatus('AVAILABLE');
    setFormImageUrl('https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80');
    setFormDescription('Xe đẹp một chủ từ đầu, bảo dưỡng hãng đầy đủ.');
    setIsAddEditModalOpen(true);
  };

  const openEditCarModal = (car: Car) => {
    setEditingCar(car);
    setFormVin(car.vin);
    setFormBrand(car.brand);
    setFormModel(car.model);
    setFormVersion(car.version);
    setFormYear(car.year);
    setFormMileage(car.mileage);
    setFormTransmission(car.transmission);
    setFormFuel(car.fuel);
    setFormBodyType(car.bodyType);
    setFormColor(car.color);
    setFormSeats(car.seats);
    setFormPlate(car.plateNumber);
    setFormLocation(car.location);
    setFormImportDate(car.importDate);
    setFormPurchasePrice(car.purchasePrice);
    setFormRepairCost(car.repairCost);
    setFormSellingPrice(car.sellingPrice);
    setFormStatus(car.status);
    setFormImageUrl(car.images[0] || '');
    setFormDescription(car.description);
    setIsAddEditModalOpen(true);
  };

  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCar) {
      const updated: Car = {
        ...editingCar,
        vin: formVin.trim(),
        brand: formBrand.trim(),
        model: formModel.trim(),
        version: formVersion.trim(),
        year: Number(formYear),
        mileage: Number(formMileage),
        transmission: formTransmission,
        fuel: formFuel,
        bodyType: formBodyType,
        color: formColor.trim(),
        seats: Number(formSeats),
        plateNumber: formPlate.trim(),
        location: formLocation,
        importDate: formImportDate,
        purchasePrice: Number(formPurchasePrice),
        repairCost: Number(formRepairCost),
        sellingPrice: Number(formSellingPrice),
        status: formStatus,
        images: formImageUrl ? [formImageUrl, ...(editingCar.images.slice(1))] : editingCar.images,
        description: formDescription.trim(),
      };
      onUpdateCar(updated);
    } else {
      const newCar: Car = {
        id: 'car-' + Date.now(),
        vin: formVin.trim(),
        brand: formBrand.trim(),
        model: formModel.trim(),
        version: formVersion.trim(),
        year: Number(formYear),
        mileage: Number(formMileage),
        transmission: formTransmission,
        fuel: formFuel,
        bodyType: formBodyType,
        color: formColor.trim(),
        seats: Number(formSeats),
        plateNumber: formPlate.trim(),
        location: formLocation,
        importDate: formImportDate,
        purchasePrice: Number(formPurchasePrice),
        repairCost: Number(formRepairCost),
        sellingPrice: Number(formSellingPrice),
        status: formStatus,
        inspected: true,
        inspectionReport: {
          engineTransmission: true,
          chassisBody: true,
          noFloodWater: true,
          electricalSystems: true,
          legalClearance: true,
          passedCount: 160,
        },
        images: [formImageUrl || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80'],
        description: formDescription.trim(),
        features: ['Cảm biến lùi', 'Màn hình giải trí', 'Phanh ABS', 'Túi khí an toàn'],
      };
      onAddCar(newCar);
    }

    setIsAddEditModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CarIcon className="w-6 h-6 text-blue-600" />
              Quản Trị Kho Xe TNT CAR
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              {filteredCars.length} xe
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canViewFinancials
              ? 'Theo dõi chi tiết giá thu, chi phí sửa chữa, lợi nhuận gộp và xe tồn kho cảnh báo 🚩.'
              : 'Tra cứu thông số kỹ thuật, tình trạng xe, giữ chỗ 2h và lập báo giá bán xe.'}
          </p>
        </div>

        {canEditCar && (
          <button
            onClick={openAddCarModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập Xe Mới Vào Kho</span>
          </button>
        )}
      </div>

      {/* Mini KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* KPI 1: Total Stock */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Xe Trong Kho</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{totalStockCount} xe</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{brands.length} thương hiệu</div>
        </div>

        {/* KPI 2: Available */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Sẵn Sàng Bán</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{availableCount} xe</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sẵn giao dịch</div>
        </div>

        {/* KPI 3: Hold / Deposited */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500">Giữ Chỗ & Đã Cọc</div>
          <div className="text-xl font-extrabold text-blue-600 mt-1">
            {holdCount} giữ / {depositedCount} cọc
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đang chờ giao</div>
        </div>

        {/* KPI 4: Over 45 Days 🚩 */}
        <div 
          onClick={() => setOnlyOver45Days(!onlyOver45Days)}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            onlyOver45Days
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700">Tồn Kho &gt; 45 Ngày 🚩</span>
            {onlyOver45Days && <span className="text-[10px] text-rose-600 font-bold">Đang lọc</span>}
          </div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{over45DaysCount} xe</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Click để {onlyOver45Days ? 'bỏ lọc' : 'lọc cờ đỏ'}</div>
        </div>

        {/* KPI 5: Inventory Valuation (Financial) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500">
            {canViewFinancials ? 'Lợi Nhuận Gộp Dự Kiến' : 'Tổng Giá Trị Kho'}
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1 truncate">
            {canViewFinancials ? formatShortVND(totalEstimatedProfit) : formatShortVND(totalStockValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {canViewFinancials
              ? `Giá trị niêm yết: ${formatShortVND(totalStockValue)}`
              : 'Định giá niêm yết'}
          </div>
        </div>
      </div>

      {/* Multi Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Model, VIN, Biển số..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tất cả hãng xe ({brands.length})</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Body Type */}
        <select
          value={selectedBodyType}
          onChange={(e) => setSelectedBodyType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tất cả phân khúc</option>
          <option value="Sedan">🚗 Sedan</option>
          <option value="SUV">🚙 SUV</option>
          <option value="Bán tải">🛻 Bán tải</option>
          <option value="MPV">🚐 MPV (7 chỗ)</option>
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Sẵn sàng bán</option>
          <option value="HOLD">Đang giữ chỗ</option>
          <option value="DEPOSITED">Đã nhận cọc</option>
          <option value="MAINTENANCE">Đang bảo dưỡng</option>
        </select>

        {/* Over 45 days checkbox toggle */}
        <button
          onClick={() => setOnlyOver45Days(!onlyOver45Days)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
            onlyOver45Days
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🚩 Tồn &gt;45 ngày</span>
          {onlyOver45Days && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Xe & Hình Ảnh</th>
                <th className="py-3.5 px-4">VIN / Biển Số</th>
                <th className="py-3.5 px-4">Năm & ODO</th>
                <th className="py-3.5 px-4">Giá Bán Niêm Yết</th>
                {canViewFinancials && (
                  <>
                    <th className="py-3.5 px-4 text-slate-600">Giá Thu</th>
                    <th className="py-3.5 px-4 text-slate-600">Chi Phí Dọn</th>
                    <th className="py-3.5 px-4 text-emerald-700 font-bold">Lợi Nhuận Gộp</th>
                  </>
                )}
                <th className="py-3.5 px-4">Ngày Nhập / Tồn Kho</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={canViewFinancials ? 10 : 7} className="py-12 text-center text-slate-400">
                    <CarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">Không tìm thấy xe nào trong kho</p>
                    <p className="text-xs">Thử nới lỏng bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => {
                  const daysInStock = getDaysInStock(car.importDate);
                  const isOldStock = daysInStock > 45;
                  const grossProfit = car.sellingPrice - car.purchasePrice - car.repairCost;

                  return (
                    <tr 
                      key={car.id} 
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCarForDetail(car)}
                    >
                      {/* Car Brand, Model, Version & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={car.images[0]}
                            alt={car.model}
                            className="w-14 h-10 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{getBodyTypeEmoji(car.bodyType)}</span>
                              <span>{car.brand} {car.model}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                              {car.version}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VIN & Plate */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{car.plateNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{car.vin}</div>
                      </td>

                      {/* Year & ODO */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">Đời {car.year}</div>
                        <div className="text-[11px] text-slate-500">
                          {car.mileage.toLocaleString()} km
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-blue-700 text-sm">
                          {formatVND(car.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({formatShortVND(car.sellingPrice)})
                        </div>
                      </td>

                      {/* Financial columns for Admin & Manager */}
                      {canViewFinancials && (
                        <>
                          <td className="py-3 px-4 text-slate-700">
                            {formatShortVND(car.purchasePrice)}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {formatShortVND(car.repairCost)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              +{formatShortVND(grossProfit)}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Stock Days / Red Flag 🚩 */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600">{formatDate(car.importDate)}</div>
                        {isOldStock ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300 animate-pulse">
                            🚩 {daysInStock} ngày tồn
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">{daysInStock} ngày trong kho</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getCarStatusBadge(car.status)}
                        {car.status === 'HOLD' && car.holdBy && (
                          <div className="text-[10px] text-amber-700 mt-0.5">
                            Bởi: {car.holdBy}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hold 2h button */}
                          {car.status === 'AVAILABLE' && (
                            <button
                              onClick={() => {
                                setCarToHold(car);
                                setHoldCustomerName('');
                                setIsHoldModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1"
                              title="Giữ chỗ 2 giờ cho khách"
                            >
                              <Clock className="w-3 h-3" />
                              Giữ 2h
                            </button>
                          )}

                          {car.status === 'HOLD' && (
                            <button
                              onClick={() => onReleaseHold(car.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Hủy giữ chỗ, mở bán lại"
                            >
                              <Unlock className="w-3 h-3" />
                              Nhả giữ
                            </button>
                          )}

                          {/* Quick Create Quotation */}
                          <button
                            onClick={() => onCreateQuotationForCar(car)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Lập báo giá cho xe này"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit Car (Admin / Manager) */}
                          {canEditCar && (
                            <button
                              onClick={() => openEditCarModal(car)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="Chỉnh sửa thông tin xe"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Modal 1: Car Detail Modal (160 Criteria Inspection, Specs) */}
      {selectedCarForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedCarForDetail.brand} {selectedCarForDetail.model} {selectedCarForDetail.version}
                  </h3>
                  {getCarStatusBadge(selectedCarForDetail.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  VIN: <span className="font-mono">{selectedCarForDetail.vin}</span> • Biển số: <strong>{selectedCarForDetail.plateNumber}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedCarForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCarForDetail.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={selectedCarForDetail.model}
                  className="w-full h-48 rounded-xl object-cover ring-1 ring-slate-200"
                />
              ))}
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Năm sản xuất:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.year}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Số ODO:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Hộp số:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.transmission}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Nhiên liệu:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.fuel}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Phân khúc:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.bodyType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Màu sắc:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.color}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Số chỗ ngồi:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.seats} chỗ</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Vị trí xe:</span>
                <p className="font-bold text-slate-800 text-sm">{selectedCarForDetail.location}</p>
              </div>
            </div>

            {/* 160 Inspection Criteria Checklist */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Chứng Nhận Kiểm Định 160 Tiêu Chí TNT CAR
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                  160/160 ĐẠT CHUẨN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-900 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Động cơ & Hộp số nguyên bản 100%, chưa từng đại tu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Keo chỉ, khung gầm nguyên vẹn, không tai nạn đâm đụng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Cam kết không thủy kích, ngập nước (hoàn tiền nếu sai)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Pháp lý minh bạch, không tranh chấp, sang tên ngay</span>
                </div>
              </div>
            </div>

            {/* Financial Details for Admin / Manager */}
            {canViewFinancials && (
              <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-3">
                <div className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Báo Cáo Tài Chính Xe Này (Nội bộ Giám đốc & Quản lý)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px]">Giá thu ban đầu:</span>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      {formatVND(selectedCarForDetail.purchasePrice)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Chi phí sửa & làm đẹp:</span>
                    <p className="text-base font-extrabold text-amber-300 mt-0.5">
                      {formatVND(selectedCarForDetail.repairCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Lợi nhuận gộp dự kiến:</span>
                    <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                      +{formatVND(selectedCarForDetail.sellingPrice - selectedCarForDetail.purchasePrice - selectedCarForDetail.repairCost)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bottom */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCarForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  onCreateQuotationForCar(selectedCarForDetail);
                  setSelectedCarForDetail(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Lập Báo Giá Lăn Bánh Cho Xe Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Hold 2h Modal */}
      {isHoldModalOpen && carToHold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Giữ Chỗ Xe Trong 2 Giờ
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang thực hiện giữ chỗ xe <strong>{carToHold.brand} {carToHold.model}</strong> (VIN: {carToHold.vin}). Trong 2 giờ, xe sẽ chuyển sang trạng thái <strong>HOLD</strong> để khách hàng tới showroom xem xe.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên khách hàng yêu cầu giữ chỗ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={holdCustomerName}
                onChange={(e) => setHoldCustomerName(e.target.value)}
                placeholder="VD: Anh Trần Quốc Bảo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                disabled={!holdCustomerName.trim()}
                onClick={handleConfirmHold}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white shadow-md shadow-amber-600/30"
              >
                Xác Nhận Giữ Chỗ (2 Tiếng)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Car Modal (Admin / Manager) */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-blue-600" />
                {editingCar ? 'Chỉnh Sửa Thông Tin Xe' : 'Nhập Xe Mới Vào Kho'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hãng xe</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dòng xe (Model)</label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phiên bản</label>
                  <input
                    type="text"
                    required
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số khung (VIN)</label>
                  <input
                    type="text"
                    required
                    value={formVin}
                    onChange={(e) => setFormVin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biển số xe</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Năm sản xuất</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số ODO (km)</label>
                  <input
                    type="number"
                    required
                    value={formMileage}
                    onChange={(e) => setFormMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân khúc</label>
                  <select
                    value={formBodyType}
                    onChange={(e) => setFormBodyType(e.target.value as BodyType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Bán tải">Bán tải</option>
                    <option value="MPV">MPV</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hộp số</label>
                  <select
                    value={formTransmission}
                    onChange={(e) => setFormTransmission(e.target.value as Transmission)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Tự động">Tự động</option>
                    <option value="Số sàn">Số sàn</option>
                  </select>
                </div>
              </div>

              {/* Pricing row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <div>
                  <label className="block font-semibold text-blue-900 mb-1">Giá thu vào (VNĐ)</label>
                  <input
                    type="number"
                    step={10_000_000}
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold"
                  />
                  <span className="text-[10px] text-blue-700">{formatShortVND(formPurchasePrice)}</span>
                </div>
                <div>
                  <label className="block font-semibold text-blue-900 mb-1">Chi phí sửa / dọn (VNĐ)</label>
                  <input
                    type="number"
                    step={1_000_000}
                    required
                    value={formRepairCost}
                    onChange={(e) => setFormRepairCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold"
                  />
                  <span className="text-[10px] text-blue-700">{formatShortVND(formRepairCost)}</span>
                </div>
                <div>
                  <label className="block font-semibold text-blue-900 mb-1">Giá bán niêm yết (VNĐ)</label>
                  <input
                    type="number"
                    step={10_000_000}
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-800"
                  />
                  <span className="text-[10px] text-blue-700 font-bold">
                    = {formatShortVND(formSellingPrice)} (Lợi nhuận: +{formatShortVND(formSellingPrice - formPurchasePrice - formRepairCost)})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày nhập kho</label>
                  <input
                    type="date"
                    required
                    value={formImportDate}
                    onChange={(e) => setFormImportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái kho</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as CarStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="AVAILABLE">Sẵn sàng bán</option>
                    <option value="HOLD">Đang giữ chỗ</option>
                    <option value="DEPOSITED">Đã nhận cọc</option>
                    <option value="MAINTENANCE">Đang dọn bảo dưỡng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL hình ảnh đại diện</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả tình trạng xe</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả phụ kiện kèm theo, lịch sử bảo dưỡng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                >
                  {editingCar ? 'Cập Nhật Xe' : 'Lưu Xe Vào Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
