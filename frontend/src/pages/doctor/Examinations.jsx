import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Plus, X, FileText, History } from 'lucide-react';
import axios from '../../lib/axios';

export default function Examinations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get('queueId');

  const [queue, setQueue] = useState(null);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    diagnosis: '',
    doctor_notes: '',
    prescriptions: []
  });
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (queueId) {
      loadData();
    }
  }, [queueId]);

  const loadData = async () => {
    try {
      const [queueRes, medicinesRes] = await Promise.all([
        axios.get(`/queue/${queueId}`),
        axios.get('/medicines')
      ]);

      setQueue(queueRes.data);
      setPatient(queueRes.data);
      setMedicines(medicinesRes.data || []);

      // Load patient history
      if (queueRes.data.patient_id) {
        const historyRes = await axios.get(`/patients/${queueRes.data.patient_id}/history`);
        setHistory(historyRes.data.history || []);
      }

      // If queue already has data (editing), populate form
      if (queueRes.data.diagnosis) {
        setFormData({
          diagnosis: queueRes.data.diagnosis || '',
          doctor_notes: queueRes.data.doctor_notes || '',
          prescriptions: queueRes.data.prescriptions || []
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Gagal memuat data');
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

  const handleAddPrescription = () => {
    if (!selectedMedicine || quantity < 1) return;

    const medicine = medicines.find(m => m.id === parseInt(selectedMedicine));
    if (!medicine) return;

    // Check if already added
    if (formData.prescriptions.some(p => p.medicine_id === medicine.id)) {
      alert('Obat sudah ditambahkan');
      return;
    }

    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, {
        medicine_id: medicine.id,
        medicine: medicine,
        quantity: quantity
      }]
    }));

    setSelectedMedicine('');
    setQuantity(1);
  };

  const handleRemovePrescription = (medicineId) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.medicine_id !== medicineId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.diagnosis.trim()) {
      alert('Diagnosis harus diisi');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        diagnosis: formData.diagnosis,
        doctor_notes: formData.doctor_notes,
        prescriptions: formData.prescriptions.map(p => ({
          medicine_id: p.medicine_id,
          quantity: p.quantity
        }))
      };

      await axios.put(`/queue/${queueId}/examine`, payload);

      alert('Pemeriksaan berhasil disimpan!');
      navigate('/doctor/dashboard');
    } catch (error) {
      alert(error.message || 'Gagal menyimpan pemeriksaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!queue) {
    return <div className="text-center py-12"><p className="text-gray-500">Data antrian tidak ditemukan</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pemeriksaan Pasien</h1>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Kembali
        </button>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {queue.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{queue.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-500">No. RM</p>
                <p className="font-medium">{queue.no_rm}</p>
              </div>
              <div>
                <p className="text-gray-500">Umur</p>
                <p className="font-medium">{calculateAge(queue.dob)} tahun</p>
              </div>
              <div>
                <p className="text-gray-500">Telepon</p>
                <p className="font-medium">{queue.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">No. Antrian</p>
                <p className="font-bold text-blue-600">#{String(queue.queue_number).padStart(3, '0')}</p>
              </div>
            </div>
            {queue.complaint && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs font-medium text-yellow-900">Keluhan Pasien:</p>
                <p className="text-sm text-yellow-800 mt-1">{queue.complaint}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Examination Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Form Pemeriksaan</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                rows={4}
                required
                placeholder="Tulis diagnosis pasien..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Dokter</label>
              <textarea
                value={formData.doctor_notes}
                onChange={(e) => setFormData({...formData, doctor_notes: e.target.value})}
                rows={3}
                placeholder="Catatan tambahan (optional)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Resep Obat</h4>
              
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedMedicine}
                  onChange={(e) => setSelectedMedicine(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Obat</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Stok: {m.stock})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Jumlah"
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>

              {formData.prescriptions.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.prescriptions.map(p => (
                        <tr key={p.medicine_id}>
                          <td className="px-4 py-3 text-sm font-medium">{p.medicine.name}</td>
                          <td className="px-4 py-3 text-sm">{p.quantity} {p.medicine.unit}</td>
                          <td className="px-4 py-3 text-sm">{p.medicine.stock}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleRemovePrescription(p.medicine_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/doctor/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Menyimpan...' : 'Simpan & Kirim ke Apotek'}
              </button>
            </div>
          </form>
        </div>

        {/* Patient History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Pemeriksaan
          </h3>
          
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat</p>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 5).map((record) => (
                <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-xs text-gray-500">{new Date(record.created_at).toLocaleDateString('id-ID')}</p>
                  <p className="font-medium text-sm text-gray-900">{record.diagnosis || '-'}</p>
                  {record.doctor_notes && (
                    <p className="text-xs text-gray-600 mt-1">{record.doctor_notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
