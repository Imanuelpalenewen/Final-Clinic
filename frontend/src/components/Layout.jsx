import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  DollarSign, 
  Stethoscope, 
  FileText,
  Pill,
  Package,
  TrendingUp,
  BarChart3,
  LogOut,
  Heart,
  Clock,
  History
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = {
    admin: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/patient-registration', icon: UserPlus, label: 'Registrasi Pasien' },
      { path: '/admin/payments', icon: DollarSign, label: 'Pembayaran' },
      { path: '/admin/patient-management', icon: Users, label: 'Kelola Pasien' },
    ],
    doctor: [
      { path: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/doctor/examinations', icon: Stethoscope, label: 'Pemeriksaan' },
    ],
    pharmacist: [
      { path: '/pharmacist/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pharmacist/process', icon: Pill, label: 'Proses Resep' },
      { path: '/pharmacist/stock', icon: Package, label: 'Manajemen Stok' },
    ],
    owner: [
      { path: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/owner/reports', icon: BarChart3, label: 'Laporan' },
    ],
    patient: [
      { path: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/patient/active-queue', icon: Clock, label: 'Antrian Aktif' },
      { path: '/patient/medical-history', icon: FileText, label: 'Riwayat Pemeriksaan' },
      { path: '/patient/prescription-history', icon: Pill, label: 'Riwayat Resep' },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  const isActive = (path) => {
    if (path === location.pathname) return true;
    // For examinations and process pages that use query params
    if (path.includes('/examinations') && location.pathname.includes('/examinations')) return true;
    if (path.includes('/process') && location.pathname.includes('/process')) return true;
    return false;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-800',
      doctor: 'bg-green-100 text-green-800',
      pharmacist: 'bg-orange-100 text-orange-800',
      owner: 'bg-purple-100 text-purple-800',
      patient: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      doctor: 'Dokter',
      pharmacist: 'Apoteker',
      owner: 'Owner',
      patient: 'Pasien'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Klinik Sentosa</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{user?.name}</p>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
