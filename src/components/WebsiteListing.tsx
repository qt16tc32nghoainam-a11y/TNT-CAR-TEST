import React, { useState, useMemo } from 'react';
import { Car, Lead, LeadSource, BodyType, FuelType } from '../types';
import { 
  Car as CarIcon, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Calendar, 
  Gauge, 
  SlidersHorizontal, 
  X, 
  Award, 
  Check, 
  Tag, 
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import { 
  formatVND, 
  formatShortVND, 
  getBodyTypeEmoji, 
  validateVNPhone 
} from '../utils/formatters';

interface WebsiteListingProps {
  cars: Car[];
  onRegisterCustomerLead: (lead: Lead) => void;
  onBackToCRM?: () => void;
}

export const WebsiteListing: React.FC<WebsiteListingProps> = ({
  cars,
  onRegisterCustomerLead,
  onBackToCRM,
}) => {
  // Public listing only shows AVAILABLE cars
  const publicCars = useMemo(() => {
    return cars.filter((c) => c.status === 'AVAILABLE');
  }, [cars]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedBodyType, setSelectedBodyType] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');

  // Detail Modal state
  const [selectedCarDetail, setSelectedCarDetail] = useState<Car | null>(null);

  // Test Drive Modal state
  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState(false);
  const [testDriveCar, setTestDriveCar] = useState<Car | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [leadSuccessMessage, setLeadSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Trade-In (Thu cũ đổi mới) Modal state
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);
  const [targetTradeInCar, setTargetTradeInCar] = useState<Car | null>(null);
  const [oldBrand, setOldBrand] = useState('Toyota');
  const [oldModel, setOldModel] = useState('Vios');
  const [oldYear, setOldYear] = useState<number>(2019);
  const [oldMileage, setOldMileage] = useState<number>(45000);
  const [oldCondition, setOldCondition] = useState('Xe gia đình một chủ, không đâm đụng, nội thất còn mới 90%');
  const [tradeInCustomerName, setTradeInCustomerName] = useState('');
  const [tradeInCustomerPhone, setTradeInCustomerPhone] = useState('');
  const [estimatedValuation, setEstimatedValuation] = useState<number | null>(null);
  const [tradeInSuccess, setTradeInSuccess] = useState(false);

  // Available brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(publicCars.map((c) => c.brand)));
    return list.sort();
  }, [publicCars]);

  // Filtered cars
  const filteredCars = useMemo(() => {
    return publicCars.filter((car) => {
      // Brand
      if (selectedBrand !== 'ALL' && car.brand !== selectedBrand) return false;

      // Body Type
      if (selectedBodyType !== 'ALL' && car.bodyType !== selectedBodyType) return false;

      // Price range
      if (selectedPriceRange !== 'ALL') {
        const p = car.sellingPrice;
        if (selectedPriceRange === 'UNDER_600' && p >= 600_000_000) return false;
        if (selectedPriceRange === '600_800' && (p < 600_000_000 || p > 800_000_000)) return false;
        if (selectedPriceRange === '800_1200' && (p < 800_000_000 || p > 1_200_000_000)) return false;
        if (selectedPriceRange === 'OVER_1200' && p <= 1_200_000_000) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBrand = car.brand.toLowerCase().includes(q);
        const matchModel = car.model.toLowerCase().includes(q);
        const matchVersion = car.version.toLowerCase().includes(q);
        if (!matchBrand && !matchModel && !matchVersion) return false;
      }

      return true;
    });
  }, [publicCars, selectedBrand, selectedBodyType, selectedPriceRange, searchQuery]);

  // Handle register test drive / consult
  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Vui lòng điền họ tên quý khách!');
      return;
    }
    if (!validateVNPhone(customerPhone)) {
      setFormError('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số di động VN.');
      return;
    }

    const newLead: Lead = {
      id: 'lead-web-' + Date.now(),
      code: `WEB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      phone: customerPhone.trim(),
      email: `${customerPhone.trim()}@web.tntcar.vn`,
      budget: testDriveCar ? testDriveCar.sellingPrice : 700_000_000,
      source: 'Website',
      status: 'New',
      interestedCarId: testDriveCar?.id,
      interestedCarName: testDriveCar ? `${testDriveCar.brand} ${testDriveCar.model} ${testDriveCar.year}` : undefined,
      assignedToUserId: 'user-sales-1',
      assignedToName: 'Lê Văn Cường',
      notes: customerNotes.trim() ? `[Đăng ký lái thử trên Web]: ${customerNotes.trim()}` : '[Đăng ký xem xe & lái thử trên Website]',
      isVip: (testDriveCar?.sellingPrice || 0) >= 800_000_000,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onRegisterCustomerLead(newLead);
    setLeadSuccessMessage('Đăng ký thành công! Chuyên viên TNT CAR sẽ liên hệ với quý khách trong 15 phút.');

    setTimeout(() => {
      setIsTestDriveModalOpen(false);
      setLeadSuccessMessage('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
    }, 2500);
  };

  // Instant Trade-In Valuation Calculator
  const handleCalculateTradeIn = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateVNPhone(tradeInCustomerPhone)) {
      setFormError('Vui lòng nhập đúng số điện thoại di động (10 số) để nhận báo giá chi tiết!');
      return;
    }

    // Heuristic valuation formula
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - oldYear);
    let baseRef = 550_000_000;
    if (oldBrand.toLowerCase().includes('mercedes') || oldBrand.toLowerCase().includes('bmw') || oldBrand.toLowerCase().includes('audi')) {
      baseRef = 1_100_000_000;
    } else if (oldBrand.toLowerCase().includes('hyundai') || oldBrand.toLowerCase().includes('kia')) {
      baseRef = 480_000_000;
    } else if (oldBrand.toLowerCase().includes('ford')) {
      baseRef = 650_000_000;
    }

    // Depreciation: 6% per year + 1% per 15,000km
    const ageDeprec = age * 0.06;
    const mileageDeprec = (oldMileage / 15000) * 0.015;
    const calculated = Math.round(baseRef * Math.max(0.35, 1 - ageDeprec - mileageDeprec) / 5_000_000) * 5_000_000;

    setEstimatedValuation(calculated);

    // Also register as a Trade-In Lead
    const tradeLead: Lead = {
      id: 'lead-trade-' + Date.now(),
      code: `THU-CU-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: tradeInCustomerName.trim() || 'Khách Định Giá Thu Cũ',
      phone: tradeInCustomerPhone.trim(),
      email: `${tradeInCustomerPhone.trim()}@tradein.tntcar.vn`,
      budget: targetTradeInCar ? targetTradeInCar.sellingPrice : calculated + 200_000_000,
      source: 'Website',
      status: 'New',
      interestedCarId: targetTradeInCar?.id,
      interestedCarName: targetTradeInCar ? `${targetTradeInCar.brand} ${targetTradeInCar.model}` : 'Đổi xe mới',
      assignedToUserId: 'user-sales-2',
      assignedToName: 'Trần Thị Mai',
      notes: `[Thu Cũ Đổi Mới]: Xe cũ ${oldBrand} ${oldModel} ${oldYear}, ODO ${oldMileage.toLocaleString()} km. Định giá ước tính: ${formatVND(calculated)}.`,
      isVip: calculated >= 800_000_000,
      tradeInInfo: {
        brand: oldBrand,
        model: oldModel,
        year: oldYear,
        mileage: oldMileage,
        estimatedValue: calculated,
        condition: oldCondition,
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onRegisterCustomerLead(tradeLead);
    setTradeInSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Public Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>TNT CAR SHOWROOM</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Chuẩn 160 Tiêu Chí
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hệ thống xe ô tô đã qua sử dụng bảo hành chính hãng uy tín
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTargetTradeInCar(null);
                setEstimatedValuation(null);
                setTradeInSuccess(false);
                setIsTradeInModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thu Cũ Đổi Mới</span>
            </button>

            {onBackToCRM && (
              <button
                onClick={onBackToCRM}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
              >
                Về Hệ Thống CRM
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Hơn 16 xe lướt cao cấp đang có sẵn tại showroom
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Mua Bán Xe Ô Tô Lướt Đã Qua Sử Dụng Chuẩn 160 Tiêu Chí Kiểm Định
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Cam kết bằng văn bản: Không đâm đụng, không ngập nước, khung gầm động cơ nguyên bản. Hỗ trợ trả góp ngân hàng 70% với lãi suất ưu đãi.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Multi-Filters Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm xe theo hãng, model (Vios, CX-5, SantaFe, Fortuner, C200...)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả hãng xe</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Body Type */}
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả phân khúc</option>
              <option value="Sedan">🚗 Sedan</option>
              <option value="SUV">🚙 SUV Gầm cao</option>
              <option value="Bán tải">🛻 Xe Bán tải</option>
              <option value="MPV">🚐 MPV Gia đình (7 chỗ)</option>
            </select>

            {/* Price Range Filter */}
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả tầm giá</option>
              <option value="UNDER_600">Dưới 600 triệu</option>
              <option value="600_800">Từ 600 - 800 triệu</option>
              <option value="800_1200">Từ 800 triệu - 1.2 tỷ</option>
              <option value="OVER_1200">Trên 1.2 tỷ</option>
            </select>
          </div>

          {/* Quick Segment Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Gợi ý:
            </span>
            {[
              { label: 'Tất Cả Xe', type: 'ALL' },
              { label: '🚗 Sedan Đô Thị', type: 'Sedan' },
              { label: '🚙 SUV Gầm Cao', type: 'SUV' },
              { label: '🚐 7 Chỗ Gia Đình (MPV)', type: 'MPV' },
              { label: '🛻 Xe Bán Tải Đa Dụng', type: 'Bán tải' },
            ].map((chip) => (
              <button
                key={chip.type}
                onClick={() => setSelectedBodyType(chip.type)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedBodyType === chip.type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Hiển thị <strong>{filteredCars.length}</strong> xe ô tô đạt chuẩn đang có tại showroom
          </p>
        </div>

        {/* Cars Grid Listing */}
        {filteredCars.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <CarIcon className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy xe phù hợp tiêu chí</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Quý khách vui lòng thử tìm kiếm theo từ khóa khác hoặc điều chỉnh lại bộ lọc phân khúc / khoảng giá.
            </p>
            <button
              onClick={() => {
                setSelectedBrand('ALL');
                setSelectedBodyType('ALL');
                setSelectedPriceRange('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
            >
              Xem Tất Cả Xe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => {
              return (
                <div
                  key={car.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={car.images[0]}
                      alt={car.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        160 Tiêu Chí
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-blue-600 text-white shadow-sm">
                        Đời {car.year}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{car.brand} • {car.bodyType}</span>
                        <span>Biển {car.plateNumber}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
                        {car.brand} {car.model} {car.version}
                      </h3>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">ODO</span>
                          <span className="font-bold text-slate-800">{car.mileage.toLocaleString()} km</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Hộp số</span>
                          <span className="font-bold text-slate-800">{car.transmission}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Nhiên liệu</span>
                          <span className="font-bold text-slate-800">{car.fuel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Giá bán niêm yết:</span>
                        <div className="text-base font-extrabold text-blue-600">
                          {formatVND(car.sellingPrice)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedCarDetail(car)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Chi Tiết
                        </button>
                        <button
                          onClick={() => {
                            setTestDriveCar(car);
                            setIsTestDriveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
                        >
                          Lái Thử
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Car Detail (Public Specs & 160 Points Inspection) */}
      {selectedCarDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedCarDetail.brand} {selectedCarDetail.model} {selectedCarDetail.version}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Năm sản xuất: {selectedCarDetail.year} • ODO: {selectedCarDetail.mileage.toLocaleString()} km
                </p>
              </div>
              <button
                onClick={() => setSelectedCarDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCarDetail.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={selectedCarDetail.model}
                  className="w-full h-48 rounded-xl object-cover ring-1 ring-slate-200"
                />
              ))}
            </div>

            {/* Pricing Box */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-blue-900 font-semibold">Giá bán công khai:</span>
                <div className="text-2xl font-extrabold text-blue-700">
                  {formatVND(selectedCarDetail.sellingPrice)}
                </div>
                <span className="text-[11px] text-blue-800">
                  Hỗ trợ trả góp ngân hàng chỉ từ {formatShortVND(Math.round(selectedCarDetail.sellingPrice * 0.3))} (trả trước 30%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTargetTradeInCar(selectedCarDetail);
                    setEstimatedValuation(null);
                    setTradeInSuccess(false);
                    setIsTradeInModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs border border-blue-300"
                >
                  Thu Cũ Đổi Xe Này
                </button>
                <button
                  onClick={() => {
                    setTestDriveCar(selectedCarDetail);
                    setIsTestDriveModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30"
                >
                  Đăng Ký Lái Thử
                </button>
              </div>
            </div>

            {/* 160 Inspection points */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Chứng Nhận 160 Hạng Mục Đạt Tiêu Chuẩn TNT CAR
              </div>
              <p className="text-[11px] text-emerald-800">
                Mỗi chiếc xe bán ra đều trải qua quy trình kiểm tra nghiêm ngặt của đội ngũ kỹ sư chuyên môn. Cam kết hoàn tiền 100% nếu phát hiện xe đâm đụng, thủy kích.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-semibold text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Động cơ nguyên bản, keo chỉ zin</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Không ngập nước, thủy kích</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Hồ sơ pháp lý hợp lệ, sang tên ngay</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Bảo hành 12 tháng hoặc 20.000 km</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900">Mô tả chi tiết:</span>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedCarDetail.description || 'Xe đẹp giữ gìn cẩn thận, nội thất nguyên bản như mới.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Test Drive & Consultation Registration Form */}
      {isTestDriveModalOpen && testDriveCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-blue-600" />
                Đăng Ký Lái Thử & Nhận Tư Vấn
              </h3>
              <button
                onClick={() => setIsTestDriveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Xe quý khách quan tâm:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {testDriveCar.brand} {testDriveCar.model} {testDriveCar.year} ({formatShortVND(testDriveCar.sellingPrice)})
              </p>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            {leadSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-bold text-sm">{leadSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và tên của quý khách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại di động <span className="text-rose-500">* (10 số di động VN)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Yêu cầu hoặc thời gian quý khách muốn lái thử
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="VD: Chiều thứ 7 này mình qua showroom..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTestDriveModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                  >
                    Gửi Yêu Cầu Lái Thử
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Wizard Thu Cũ Đổi Mới (Trade-In Valuation) */}
      {isTradeInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Định Giá & Thu Cũ Đổi Mới
                </h3>
                <p className="text-xs text-slate-500">
                  Đổi xe cũ lấy xe lướt tại TNT CAR với giá thu tốt nhất thị trường
                </p>
              </div>
              <button
                onClick={() => setIsTradeInModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {targetTradeInCar && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-medium">Xe bạn muốn đổi lấy:</span>
                  <p className="font-bold text-blue-900">{targetTradeInCar.brand} {targetTradeInCar.model} ({formatVND(targetTradeInCar.sellingPrice)})</p>
                </div>
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            )}

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Valuation Result Screen */}
            {estimatedValuation ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">
                    Định giá sơ bộ xe cũ {oldBrand} {oldModel} ({oldYear}):
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-700">
                    {formatVND(estimatedValuation)}
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    (Ước tính dựa trên dòng xe, đời {oldYear} và {oldMileage.toLocaleString()} km đã vận hành)
                  </p>
                </div>

                {targetTradeInCar && (
                  <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
                    <span className="text-[11px] text-slate-400">Số tiền bù trừ dự kiến để nhận xe mới:</span>
                    <div className="text-lg font-bold text-amber-400">
                      {formatVND(Math.max(0, targetTradeInCar.sellingPrice - estimatedValuation))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">Hồ sơ đã được lưu vào hệ thống CRM!</p>
                  <p>Chuyên viên thẩm định của TNT CAR sẽ liên hệ tới số <strong>{tradeInCustomerPhone}</strong> để xem xe trực tiếp và chốt giá cuối cùng.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsTradeInModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                  >
                    Hoàn Tất
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCalculateTradeIn} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hãng xe cũ</label>
                    <input
                      type="text"
                      required
                      value={oldBrand}
                      onChange={(e) => setOldBrand(e.target.value)}
                      placeholder="VD: Toyota, Mazda, Honda..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dòng xe (Model)</label>
                    <input
                      type="text"
                      required
                      value={oldModel}
                      onChange={(e) => setOldModel(e.target.value)}
                      placeholder="VD: Vios, Mazda 3, City..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Năm sản xuất</label>
                    <input
                      type="number"
                      required
                      value={oldYear}
                      onChange={(e) => setOldYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số ODO (km đã đi)</label>
                    <input
                      type="number"
                      required
                      value={oldMileage}
                      onChange={(e) => setOldMileage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tình trạng bảo dưỡng & sơn vỏ</label>
                  <input
                    type="text"
                    value={oldCondition}
                    onChange={(e) => setOldCondition(e.target.value)}
                    placeholder="VD: Sơn zin 95%, bảo dưỡng định kỳ tại hãng..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Họ tên quý khách <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tradeInCustomerName}
                      onChange={(e) => setTradeInCustomerName(e.target.value)}
                      placeholder="VD: Anh Tuấn"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số điện thoại <span className="text-rose-500">* (10 số VN)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={tradeInCustomerPhone}
                      onChange={(e) => setTradeInCustomerPhone(e.target.value)}
                      placeholder="VD: 0987654321"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTradeInModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Định Giá Ngay & Nhận Báo Giá Đổi Xe
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 sm:px-6 text-xs mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-sm">CÔNG TY CỔ PHẦN Ô TÔ TNT CAR</div>
            <p className="text-slate-400 mt-1">Showroom 1: Số 68 Lê Đức Thọ, Mỹ Đình, Hà Nội • Hotline: 0988.888.999</p>
          </div>
          <div className="text-slate-500 text-[11px]">
            © 2024 TNT CAR. Nền tảng quản trị kinh doanh ô tô đã qua sử dụng đạt chuẩn 160 tiêu chí kiểm định.
          </div>
        </div>
      </footer>
    </div>
  );
};
