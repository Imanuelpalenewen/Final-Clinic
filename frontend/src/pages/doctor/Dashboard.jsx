import { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function DoctorDashboard() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await axios.get('/queue?status=doctor');
      setQueueCount(response.data.length);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Dokter</h1>
      
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-xl font-bold text-blue-800 mb-2">Halo, Dok!</h3>
        <p className="text-blue-700">Saat ini ada <b>{queueCount} pasien</b> menunggu pemeriksaan.</p>
        <p className="text-sm text-blue-600 mt-2">Silakan akses menu <b>Pemeriksaan</b> di samping.</p>
      </div>
    </div>
  );
}
