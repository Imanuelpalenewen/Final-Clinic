import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { 
  Home, Users, Activity, Package, DollarSign, 
  FileText, LogOut, Menu, X 
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items based on role
  const getMenuItems = () => {
    const role = user?.role;
    
    const menus = {
      admin: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
        { path: '/admin/patient-registration', label: 'Registrasi Pasien', icon: Users },
        { path: '/admin/patient-management', label: 'Data Pasien', icon: Users },
        { path: '/admin/payments', label: 'Pembayaran', icon: DollarSign },
        { path: '/admin/reports', label: 'Laporan', icon: FileText },
      ],
      doctor: [
        { path: '/doctor/dashboard', label: 'Dashboard', icon: Home },
        { path: '/doctor/examinations', label: 'Pemeriksaan', icon: Activity },
        { path: '/doctor/prescriptions', label: 'Riwayat Resep', icon: FileText },
      ],
      pharmacist: [
        { path: '/pharmacist/dashboard', label: 'Dashboard', icon: Home },
        { path: '/pharmacist/prescriptions', label: 'Resep Masuk', icon: FileText },
        { path: '/pharmacist/stock', label: 'Stok Obat', icon: Package },
      ],
      cashier: [
        { path: '/cashier/dashboard', label: 'Dashboard', icon: Home },
        { path: '/cashier/payment', label: 'Pembayaran', icon: DollarSign },
      ],
      owner: [
        { path: '/owner/dashboard', label: 'Dashboard', icon: Home },
        { path: '/owner/reports', label: 'Laporan', icon: FileText },
        { path: '/owner/accounts', label: 'Akun User', icon: Users },
      ]
    };

    return menus[role] || [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Klinik Sentosa</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.full_name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
