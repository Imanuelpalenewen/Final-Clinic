import { useEffect, useState } from 'react';
import axios from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';

export default function CashierDashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await axios.get('/queue?status=cashier');
      setQueue(response.data);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (queueItem) => {
    const paymentMethod = prompt('Metode pembayaran (cash/debit/credit):');
    if (!paymentMethod) return;

    try {
      await axios.post('/transactions', {
        queue_id: queueItem.id,
        amount: queueItem.total_cost,
        payment_method: paymentMethod
      });
      alert('Pembayaran berhasil!');
      loadQueue();
    } catch (error) {
      alert(error.message || 'Gagal memproses pembayaran');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Kasir - Pembayaran</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Antrian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasien</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {queue.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{item.queue_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.diagnosis}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(item.total_cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handlePayment(item)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Terima Pembayaran
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
