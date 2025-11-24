import { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { getStatusColor, getStatusLabel } from '../../lib/utils';

export default function DoctorExaminations() {
  const [queue, setQueue] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    diagnosis: '',
    doctor_notes: '',
    prescriptions: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [queueRes, medicinesRes] = await Promise.all([
        axios.get('/queue?status=doctor'),
        axios.get('/medicines')
      ]);
      setQueue(queueRes.data);
      setMedicines(medicinesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamine = (item) => {
    setSelectedQueue(item);
    setFormData({ diagnosis: '', doctor_notes: '', prescriptions: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`/queue/${selectedQueue.id}/doctor`, formData);
      alert('Pemeriksaan berhasil disimpan');
      setSelectedQueue(null);
      loadData();
    } catch (error) {
      alert(error.message || 'Gagal menyimpan pemeriksaan');
    }
  };

  const addPrescription = () => {
    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, { medicine_id: '', quantity: 1 }]
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pemeriksaan Pasien</h1>
      
      {!selectedQueue ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Antrian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasien</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. RM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{item.queue_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.no_rm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleExamine(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Periksa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Pemeriksaan: {selectedQueue.name}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Diagnosis penyakit"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Dokter</label>
              <textarea
                value={formData.doctor_notes}
                onChange={(e) => setFormData({ ...formData, doctor_notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Catatan tambahan..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resep Obat</label>
              <button
                type="button"
                onClick={addPrescription}
                className="mb-2 text-sm text-blue-600 hover:text-blue-800"
              >
                + Tambah Obat
              </button>
              
              {formData.prescriptions.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={item.medicine_id}
                    onChange={(e) => {
                      const newPrescriptions = [...formData.prescriptions];
                      newPrescriptions[index].medicine_id = e.target.value;
                      setFormData({ ...formData, prescriptions: newPrescriptions });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Pilih Obat</option>
                    {medicines.map((med) => (
                      <option key={med.id} value={med.id}>{med.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newPrescriptions = [...formData.prescriptions];
                      newPrescriptions[index].quantity = parseInt(e.target.value);
                      setFormData({ ...formData, prescriptions: newPrescriptions });
                    }}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Simpan Pemeriksaan
              </button>
              <button
                type="button"
                onClick={() => setSelectedQueue(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
