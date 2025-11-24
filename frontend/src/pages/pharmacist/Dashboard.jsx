import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Clock } from 'lucide-react';
import axios from '../../lib/axios';

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await axios.get('/queue?status=pharmacy');
      setQueue(response.data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (queueId) => {
    navigate(`/pharmacist/process?queueId=${queueId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Apoteker</h1>
        <p className="text-gray-600 mt-1">Daftar resep menunggu diproses</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada resep menunggu</h3>
          <p className="text-gray-500">Antrian resep kosong saat ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-orange-600">
                    #{String(item.queue_number).padStart(3, '0')}
                  </span>
                </div>
                {item.is_emergency === 1 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                    🚨 DARURAT
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">No. RM:</span> {item.no_rm}</p>
                  <p><span className="font-medium">Diagnosis:</span> {item.diagnosis}</p>
                </div>

                {item.prescriptions && item.prescriptions.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs font-medium text-orange-900 mb-1">
                      Resep Obat ({item.prescriptions.length} item):
                    </p>
                    <ul className="text-xs text-orange-800 space-y-1">
                      {item.prescriptions.slice(0, 3).map((p, idx) => (
                        <li key={idx}>• {p.medicine_name} ({p.quantity} {p.unit})</li>
                      ))}
                      {item.prescriptions.length > 3 && (
                        <li className="font-medium">+ {item.prescriptions.length - 3} obat lainnya</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleProcess(item.id)}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 font-medium"
              >
                <Pill className="w-5 h-5" />
                Proses Resep
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
