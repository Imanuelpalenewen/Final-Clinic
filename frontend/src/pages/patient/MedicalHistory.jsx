import { useState, useEffect } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../lib/axios';

export default function MedicalHistory() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicalHistory();
  }, [user]);

  const fetchMedicalHistory = async () => {
    try {
      // Get my profile
      const profileRes = await axios.get('/patients/me');
      if (profileRes.data) {
        setPatient(profileRes.data);
      }
      
      // Get my medical history
      const historyRes = await axios.get('/patients/me/history');
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!patient) {
    return <div className="text-center py-12"><p className="text-gray-500">Data pasien tidak ditemukan</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Pemeriksaan</h1>
        <p className="text-gray-600 mt-1">Riwayat lengkap pemeriksaan medis Anda</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Riwayat</h3>
          <p className="text-gray-500">Anda belum memiliki riwayat pemeriksaan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">{formatDate(record.created_at)}</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    Kunjungan #{String(record.queue_number).padStart(3, '0')}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Selesai
                </span>
              </div>

              <div className="space-y-3">
                {record.diagnosis && (
                  <div className="pb-3 border-b">
                    <p className="text-sm font-medium text-gray-700 mb-1">Diagnosis</p>
                    <p className="text-gray-900">{record.diagnosis}</p>
                  </div>
                )}

                {record.doctor_notes && (
                  <div className="pb-3 border-b">
                    <p className="text-sm font-medium text-gray-700 mb-1">Catatan Dokter</p>
                    <p className="text-gray-600">{record.doctor_notes}</p>
                  </div>
                )}

                {record.prescriptions && record.prescriptions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Resep Obat</p>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {record.prescriptions.map((p, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-900">{p.medicine_name}</span>
                            <span className="text-gray-600">{p.quantity} {p.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {record.total_cost > 0 && (
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Biaya</span>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(record.total_cost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
