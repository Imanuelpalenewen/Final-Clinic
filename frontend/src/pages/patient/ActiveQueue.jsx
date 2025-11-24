import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../lib/axios';
import { getStatusLabel, getStatusColor } from '../../utils/statusHelper';

export default function ActiveQueue() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [activeQueue, setActiveQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveQueue();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchActiveQueue, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchActiveQueue = async () => {
    try {
      // Get my profile
      const profileRes = await axios.get('/patients/me');
      if (profileRes.data) {
        setPatient(profileRes.data);
      }
      
      // Get my active queue
      const queueRes = await axios.get('/patients/me/queue');
      setActiveQueue(queueRes.data || null);
    } catch (error) {
      console.error('Error fetching active queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Data pasien tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Antrian Aktif</h1>
        <p className="text-gray-600 mt-1">Status antrian Anda saat ini</p>
      </div>

      {activeQueue ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Nomor Antrian Anda</h2>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              #{String(activeQueue.queue_number).padStart(3, '0')}
            </div>
            {activeQueue.is_emergency === 1 && (
              <span className="inline-block px-4 py-2 bg-red-100 text-red-800 font-medium rounded-lg">
                🚨 DARURAT
              </span>
            )}
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Status</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(activeQueue.status)}`}>
                {getStatusLabel(activeQueue.status)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Waktu Pendaftaran</span>
              <span className="font-medium">
                {new Date(activeQueue.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {activeQueue.updated_at && activeQueue.updated_at !== activeQueue.created_at && (
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Terakhir Diupdate</span>
                <span className="font-medium text-blue-600">
                  {new Date(activeQueue.updated_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {activeQueue.complaint && (
              <div className="py-3">
                <p className="text-gray-600 mb-2">Keluhan</p>
                <p className="text-gray-900">{activeQueue.complaint}</p>
              </div>
            )}

            {activeQueue.diagnosis && (
              <div className="py-3 bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2 font-medium">Diagnosis</p>
                <p className="text-gray-900">{activeQueue.diagnosis}</p>
              </div>
            )}

            {activeQueue.doctor_notes && (
              <div className="py-3">
                <p className="text-gray-600 mb-2">Catatan Dokter</p>
                <p className="text-gray-900">{activeQueue.doctor_notes}</p>
              </div>
            )}

            {activeQueue.total_cost > 0 && (
              <div className="py-3 bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-2">Total Biaya</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(activeQueue.total_cost)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ℹ️ Status akan diperbarui otomatis setiap 10 detik. Mohon tunggu giliran Anda.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Antrian Aktif</h3>
          <p className="text-gray-500">Anda tidak memiliki antrian yang sedang berjalan saat ini</p>
        </div>
      )}
    </div>
  );
}
