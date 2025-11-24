import { useEffect, useState } from 'react';
import axios from '../../lib/axios';

export default function PharmacistDashboard() {
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await axios.get('/queue?status=pharmacy');
      setQueueCount(response.data.length);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Apotek</h1>
      
      <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
        <h3 className="text-xl font-bold text-purple-800 mb-2">Halo, Apoteker!</h3>
        <p className="text-purple-700">Saat ini ada <b>{queueCount} resep</b> yang perlu diproses.</p>
        <p className="text-sm text-purple-600 mt-2">Silakan akses menu <b>Resep Masuk</b> di samping.</p>
      </div>
    </div>
  );
}
