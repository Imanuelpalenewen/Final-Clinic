import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Clock, AlertCircle } from 'lucide-react';
import axios from '../../lib/axios';

export default function DoctorDashboard() {
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
      const response = await axios.get('/queue?status=waiting');
      setQueue(response.data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleStartExam = (queueId) => {
    navigate(`/doctor/examinations?queueId=${queueId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Dokter</h1>
        <p className="text-gray-600 mt-1">Daftar pasien menunggu pemeriksaan</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pasien menunggu</h3>
          <p className="text-gray-500">Antrian kosong saat ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600">
                      #{String(item.queue_number).padStart(3, '0')}
                    </span>
                  </div>
                  {item.is_emergency === 1 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                      🚨 DARURAT
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Umur:</span> {calculateAge(item.dob)} tahun</p>
                  <p><span className="font-medium">No. RM:</span> {item.no_rm}</p>
                  <p><span className="font-medium">Telepon:</span> {item.phone || '-'}</p>
                </div>

                {item.complaint && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-900 mb-1">Keluhan:</p>
                    <p className="text-sm text-yellow-800">{item.complaint}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleStartExam(item.id)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
              >
                <Stethoscope className="w-5 h-5" />
                Mulai Pemeriksaan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
