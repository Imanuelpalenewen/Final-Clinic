import { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../lib/axios';

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's report (includes patients count and revenue)
      const todayReportRes = await axios.get(`/reports/daily?date=${today}`);
      
      // Get this month's report
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const monthReportRes = await axios.get(`/reports/monthly?year=${year}&month=${month}`);

      setStats({
        totalPatients: todayReportRes.data?.total_patients || 0,
        todayRevenue: todayReportRes.data?.total_revenue || 0,
        monthRevenue: monthReportRes.data?.total_revenue || 0,
        todayTransactions: todayReportRes.data?.total_transactions || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Owner</h1>
        <p className="text-gray-600 mt-1">Ringkasan bisnis dan pendapatan klinik</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Pasien</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPatients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Transaksi Hari Ini</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.todayTransactions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pendapatan Hari Ini</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(stats.todayRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pendapatan Bulan Ini</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(stats.monthRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/owner/reports?type=daily" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="font-semibold text-gray-900 mb-2">Laporan Harian</h3>
          <p className="text-sm text-gray-600">Lihat detail transaksi dan pendapatan per hari</p>
        </Link>
        
        <Link to="/owner/reports?type=monthly" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="font-semibold text-gray-900 mb-2">Laporan Bulanan</h3>
          <p className="text-sm text-gray-600">Ringkasan keuangan dan trend bulanan</p>
        </Link>
      </div>
    </div>
  );
}
