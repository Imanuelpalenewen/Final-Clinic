import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Printer, CheckCircle } from 'lucide-react';
import axios from '../../lib/axios';

export default function Payments() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentQueue();
  }, []);

  const fetchPaymentQueue = async () => {
    try {
      const response = await axios.get('/queue?status=cashier');
      setQueue(response.data || []);
    } catch (error) {
      console.error('Error fetching payment queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQueue = (queueItem) => {
    setSelectedQueue(queueItem);
    setPaymentMethod('cash');
  };

  const handleProcessPayment = async () => {
    if (!selectedQueue) return;

    try {
      setProcessing(true);
      
      // Create transaction
      await axios.post('/transactions', {
        queue_id: selectedQueue.id,
        total_amount: selectedQueue.total_cost,
        payment_method: paymentMethod
      });

      alert('Pembayaran berhasil diproses!');
      setSelectedQueue(null);
      fetchPaymentQueue();
    } catch (error) {
      alert(error.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pembayaran</h1>
        <p className="text-gray-600 mt-1">Proses pembayaran pasien yang sudah selesai resep</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Antrian Pembayaran ({queue.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {queue.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Tidak ada antrian pembayaran</p>
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectQueue(item)}
                  className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition ${
                    selectedQueue?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        #{String(item.queue_number).padStart(3, '0')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.no_rm}</p>
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Diagnosis:</span> {item.diagnosis || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Biaya</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(item.total_cost)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow">
          {selectedQueue ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pembayaran - Antrian #{String(selectedQueue.queue_number).padStart(3, '0')}
                </h2>
                <button
                  onClick={() => setSelectedQueue(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama</span>
                  <span className="font-medium">{selectedQueue.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. RM</span>
                  <span className="font-medium">{selectedQueue.no_rm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Diagnosis</span>
                  <span className="font-medium">{selectedQueue.diagnosis || '-'}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Detail Pembayaran</h3>
                
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Biaya Obat</span>
                    <span className="font-medium">{formatCurrency(selectedQueue.total_cost)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total Tagihan</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(selectedQueue.total_cost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <label className="block font-semibold text-gray-900">
                  Metode Pembayaran
                </label>
                
                <div className="space-y-2">
                  {['cash', 'debit', 'credit'].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 font-medium text-gray-900">
                        {method === 'cash' && '💵 Tunai'}
                        {method === 'debit' && '💳 Debit'}
                        {method === 'credit' && '💳 Credit'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedQueue(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {processing ? (
                    'Memproses...'
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Konfirmasi Pembayaran
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Pilih antrian untuk memproses pembayaran</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
