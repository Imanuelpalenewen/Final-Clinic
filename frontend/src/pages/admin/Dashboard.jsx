import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from '../../lib/axios';
import { getStatusLabel, getStatusColor } from '../../utils/statusHelper';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeQueues: 0,
    completedToday: 0
  });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/queue');
      const queueData = response.data || [];
      
      setQueue(queueData);
      
      // Calculate stats (only today's data)
      const today = new Date().toISOString().split('T')[0];
      const todayQueue = queueData.filter(q => 
        q.created_at.startsWith(today)
      );
      
      setStats({
        totalPatients: todayQueue.length,
        activeQueues: queueData.filter(q => 
          !['completed', 'cancelled'].includes(q.status)
        ).length,
        completedToday: todayQueue.filter(q => q.status === 'completed').length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleCancelQueue = async (id, queueNumber) => {
    if (!confirm(`Batalkan antrian #${String(queueNumber).padStart(3, '0')}?`)) {
      return;
    }

    try {
      await axios.put(`/queue/${id}/cancel`);
      alert('Antrian berhasil dibatalkan');
      fetchDashboardData();
    } catch (error) {
      alert(error.message || 'Gagal membatalkan antrian');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <Link
          to="/admin/patient-registration"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Registrasi Pasien Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Pasien Hari Ini</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPatients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Antrian Aktif</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeQueues}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Selesai Hari Ini</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedToday}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Antrian Hari Ini</h2>
          <span className="text-sm text-gray-500">Auto-refresh setiap 30 detik</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Antrian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Pasien</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. RM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-12 h-12 text-gray-300" />
                      <p>Tidak ada antrian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          #{String(item.queue_number).padStart(3, '0')}
                        </span>
                        {item.is_emergency === 1 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            🚨 DARURAT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{item.no_rm}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!['completed', 'cancelled'].includes(item.status) && (
                        <button
                          onClick={() => handleCancelQueue(item.id, item.queue_number)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
