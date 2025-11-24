import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';

// Pages
import Login from './pages/Login';
import Layout from './components/Layout';

// Admin Pages (will create these next)
import AdminDashboard from './pages/admin/Dashboard';
import AdminPatientRegistration from './pages/admin/PatientRegistration';
import AdminPatientManagement from './pages/admin/PatientManagement';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorExaminations from './pages/doctor/Examinations';
import DoctorPrescriptions from './pages/doctor/Prescriptions';

// Pharmacist Pages
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import PharmacistPrescriptions from './pages/pharmacist/Prescriptions';
import PharmacistStock from './pages/pharmacist/Stock';

// Cashier Pages
import CashierDashboard from './pages/cashier/Dashboard';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerReports from './pages/owner/Reports';
import OwnerAccounts from './pages/owner/Accounts';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} 
      />
      
      {/* Redirect root to login or dashboard */}
      <Route 
        path="/" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/login" replace />} 
      />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/patient-registration" element={<ProtectedRoute allowedRoles={['admin']}><AdminPatientRegistration /></ProtectedRoute>} />
      <Route path="/admin/patient-management" element={<ProtectedRoute allowedRoles={['admin']}><AdminPatientManagement /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/examinations" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorExaminations /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />

      {/* Pharmacist Routes */}
      <Route path="/pharmacist/dashboard" element={<ProtectedRoute allowedRoles={['pharmacist']}><PharmacistDashboard /></ProtectedRoute>} />
      <Route path="/pharmacist/prescriptions" element={<ProtectedRoute allowedRoles={['pharmacist']}><PharmacistPrescriptions /></ProtectedRoute>} />
      <Route path="/pharmacist/stock" element={<ProtectedRoute allowedRoles={['pharmacist']}><PharmacistStock /></ProtectedRoute>} />

      {/* Cashier Routes */}
      <Route path="/cashier/dashboard" element={<ProtectedRoute allowedRoles={['cashier']}><CashierDashboard /></ProtectedRoute>} />

      {/* Owner Routes */}
      <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/owner/reports" element={<ProtectedRoute allowedRoles={['owner']}><OwnerReports /></ProtectedRoute>} />
      <Route path="/owner/accounts" element={<ProtectedRoute allowedRoles={['owner']}><OwnerAccounts /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1>404 - Page Not Found</h1></div>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
