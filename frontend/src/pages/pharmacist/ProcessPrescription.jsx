import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import axios from '../../lib/axios';

export default function ProcessPrescription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get('queueId');

  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);

  useEffect(() => {
    if (queueId) {
      loadQueue();
    }
  }, [queueId]);

  const loadQueue = async () => {
    try {
      const response = await axios.get(`/queue/${queueId}`);
      setQueue(response.data);

      // Check stock warnings
      const warnings = [];
      if (response.data.prescriptions) {
        response.data.prescriptions.forEach(p => {
          if (p.quantity > p.stock) {
            warnings.push(`${p.medicine_name}: Stok tidak cukup (butuh ${p.quantity}, tersedia ${p.stock})`);
          }
        });
      }
      setStockWarnings(warnings);
    } catch (error) {
      console.error('Error loading queue:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!queue?.prescriptions) return 0;
    return queue.prescriptions.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleProcess = async () => {
    if (stockWarnings.length > 0) {
      alert('Tidak dapat memproses: Ada obat yang stoknya tidak cukup');
      return;
    }

    try {
      setProcessing(true);
      await axios.put(`/queue/${queueId}/process`);
      alert('Resep berhasil diproses! Pasien dapat melanjutkan ke kasir.');
      navigate('/pharmacist/dashboard');
    } catch (error) {
      alert(error.message || 'Gagal memproses resep');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  if (!queue) {
    return <div className="text-center py-12"><p className="text-gray-500">Data antrian tidak ditemukan</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Proses Resep</h1>
        <button
          onClick={() => navigate('/pharmacist/dashboard')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Kembali
        </button>
      </div>

      {/* Stock Warnings */}
      {stockWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 mb-2">Peringatan Stok:</p>
              <ul className="text-sm text-red-800 space-y-1">
                {stockWarnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Informasi Pasien</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">No. Antrian</p>
            <p className="font-bold text-blue-600">#{String(queue.queue_number).padStart(3, '0')}</p>
          </div>
          <div>
            <p className="text-gray-500">No. RM</p>
            <p className="font-medium">{queue.no_rm}</p>
          </div>
          <div>
            <p className="text-gray-500">Nama</p>
            <p className="font-medium">{queue.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Diagnosis</p>
            <p className="font-medium">{queue.diagnosis}</p>
          </div>
        </div>
      </div>

      {/* Prescription Details */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Detail Resep</h2>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {queue.prescriptions?.map((p, idx) => (
              <tr key={idx} className={p.quantity > p.stock ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 font-medium">{p.medicine_name}</td>
                <td className="px-6 py-4">{p.quantity} {p.unit}</td>
                <td className="px-6 py-4">
                  <span className={p.quantity > p.stock ? 'text-red-600 font-medium' : ''}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-6 py-4">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4 font-medium">{formatCurrency(p.price * p.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-6 py-4 text-right font-semibold">Total:</td>
              <td className="px-6 py-4 font-bold text-lg text-green-600">{formatCurrency(calculateTotal())}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/pharmacist/dashboard')}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          onClick={handleProcess}
          disabled={processing || stockWarnings.length > 0}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {processing ? 'Memproses...' : 'Konfirmasi & Kirim ke Kasir'}
        </button>
      </div>
    </div>
  );
}
