import { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { Users, Activity, Package, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    queueToday: 0,
    completed: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [patientsRes, queueRes] = await Promise.all([
        axios.get('/patients'),
        axios.get('/queue')
      ]);

      const today = new Date().toISOString().split('T')[0];
      const queueToday = queueRes.data.filter(q => 
        q.created_at.startsWith(today)
      );
      const completed = queueToday.filter(q => q.status === 'completed');

      setStats({
        totalPatients: patientsRes.data.length,
        queueToday: queueToday.length,
        completed: completed.length,
        revenue: completed.reduce((sum, q) => sum + (q.total_cost || 0), 0)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Pasien', value: stats.totalPatients, icon: Users, color: 'blue' },
    { label: 'Antrian Hari Ini', value: stats.queueToday, icon: Activity, color: 'green' },
    { label: 'Selesai Hari Ini', value: stats.completed, icon: Package, color: 'purple' },
    { label: 'Pendapatan Hari Ini', value: `Rp ${stats.revenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'yellow' }
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
