import { useState, useEffect } from 'react';
import { Clock, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../lib/axios';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    try {
      // Get my profile using new patient API
      const profileRes = await axios.get('/patients/me');
      if (profileRes.data) {
        setPatient(profileRes.data);
        
        // Get my history
        const historyRes = await axios.get('/patients/me/history');
        setHistory(historyRes.data || []);
        
        // Get my active queue
        const queueRes = await axios.get('/patients/me/queue');
        setActiveQueue(queueRes.data || null);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'doctor': return 'bg-yellow-100 text-yellow-800';
      case 'pharmacy': return 'bg-orange-100 text-orange-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      waiting: 'Menunggu Pemeriksaan',
      doctor: 'Sedang Diperiksa Dokter',
      pharmacy: 'Diproses di Apotek',
      cashier: 'Menunggu Pembayaran'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Data pasien tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Pasien</h1>
        <p className="text-gray-600 mt-1">Selamat datang, {patient.name}</p>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Data Diri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">No. RM</p>
            <p className="font-medium">{patient.no_rm}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nama</p>
            <p className="font-medium">{patient.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Umur</p>
            <p className="font-medium">{calculateAge(patient.dob)} tahun</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telepon</p>
            <p className="font-medium">{patient.phone}</p>
          </div>
        </div>
      </div>

      {/* Active Queue */}
      {activeQueue && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-blue-900 mb-2">Antrian Aktif Hari Ini</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-blue-600">
                    #{String(activeQueue.queue_number).padStart(3, '0')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeQueue.status)}`}>
                    {getStatusLabel(activeQueue.status)}
                  </span>
                </div>
                {activeQueue.complaint && (
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Keluhan:</span> {activeQueue.complaint}
                  </p>
                )}
              </div>
            </div>
            <Clock className="w-12 h-12 text-blue-400" />
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Riwayat Kunjungan
          </h2>
        </div>
        
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Belum ada riwayat kunjungan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {history.map((record) => (
              <div key={record.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="font-medium text-gray-900 mt-1">Antrian #{String(record.queue_number).padStart(3, '0')}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Selesai
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {record.diagnosis && (
                    <div>
                      <span className="font-medium text-gray-700">Diagnosis:</span>
                      <p className="text-gray-600">{record.diagnosis}</p>
                    </div>
                  )}
                  
                  {record.doctor_notes && (
                    <div>
                      <span className="font-medium text-gray-700">Catatan Dokter:</span>
                      <p className="text-gray-600">{record.doctor_notes}</p>
                    </div>
                  )}
                  
                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Resep Obat:</span>
                      <ul className="text-gray-600 list-disc list-inside">
                        {record.prescriptions.map((p, idx) => (
                          <li key={idx}>{p.medicine_name} - {p.quantity} {p.unit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
