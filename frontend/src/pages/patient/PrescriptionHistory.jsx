import { useState, useEffect } from 'react';
import { Pill, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../lib/axios';

export default function PrescriptionHistory() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptionHistory();
  }, [user]);

  const fetchPrescriptionHistory = async () => {
    try {
      // Get my profile
      const profileRes = await axios.get('/patients/me');
      if (profileRes.data) {
        setPatient(profileRes.data);
      }
      
      // Get my prescriptions
      const prescriptionsRes = await axios.get('/patients/me/prescriptions');
      const prescriptions = prescriptionsRes.data || [];
      
      // Group by queue/visit
      const groupedByVisit = {};
      prescriptions.forEach(p => {
        const key = p.queue_number;
        if (!groupedByVisit[key]) {
          groupedByVisit[key] = {
            queue_number: p.queue_number,
            created_at: p.created_at,
            diagnosis: p.diagnosis,
            prescriptions: []
          };
        }
        groupedByVisit[key].prescriptions.push({
          medicine_name: p.medicine_name,
          quantity: p.quantity,
          unit: p.unit,
          price: p.price
        });
      });
      
      setHistory(Object.values(groupedByVisit));
    } catch (error) {
      console.error('Error fetching prescription history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
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
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Resep</h1>
        <p className="text-gray-600 mt-1">Daftar resep obat dari pemeriksaan sebelumnya</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Pill className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Resep</h3>
          <p className="text-gray-500">Anda belum memiliki riwayat resep obat</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">{formatDate(record.created_at)}</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    Kunjungan #{String(record.queue_number).padStart(3, '0')}
                  </p>
                  {record.diagnosis && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    {record.prescriptions.length} Obat
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {record.prescriptions.map((prescription, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                        <Pill className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{prescription.medicine_name}</p>
                        <p className="text-sm text-gray-600">
                          {prescription.quantity} {prescription.unit}
                        </p>
                      </div>
                    </div>
                    {prescription.price && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Harga</p>
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(prescription.price * prescription.quantity)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {record.doctor_notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">Catatan Dokter</p>
                  <p className="text-sm text-gray-600">{record.doctor_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
