import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Calendar } from 'lucide-react';
import axios from '../../lib/axios';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportType, setReportType] = useState(searchParams.get('type') || 'daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, date, month, year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let response;
      
      if (reportType === 'daily') {
        response = await axios.get(`/reports/daily?date=${date}`);
      } else {
        response = await axios.get(`/reports/monthly?year=${year}&month=${month}`);
      }
      
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExportCSV = () => {
    if (!report || !report.transactions) return;

    const headers = ['Tanggal', 'No. Antrian', 'No. RM', 'Nama Pasien', 'Diagnosis', 'Total Biaya', 'Metode Pembayaran'];
    const rows = report.transactions.map(t => [
      new Date(t.created_at).toLocaleDateString('id-ID'),
      `#${String(t.queue_number).padStart(3, '0')}`,
      t.no_rm,
      t.patient_name,
      t.diagnosis || '-',
      t.total_amount,
      t.payment_method
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-${reportType}-${reportType === 'daily' ? date : `${year}-${month}`}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <button
          onClick={handleExportCSV}
          disabled={!report || !report.transactions?.length}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Laporan</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setSearchParams({ type: e.target.value });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>

          {reportType === 'daily' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min="2020"
                  max="2099"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm font-medium">Total Transaksi</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{report.total_transactions || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm font-medium">Total Pendapatan</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(report.total_revenue)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm font-medium">Rata-rata per Transaksi</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrency(report.total_transactions > 0 ? report.total_revenue / report.total_transactions : 0)}
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          {report.transactions && report.transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Detail Transaksi</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Antrian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasien</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.transactions.map((transaction, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm">
                          {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 font-medium">#{String(transaction.queue_number).padStart(3, '0')}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{transaction.patient_name}</p>
                            <p className="text-sm text-gray-500">{transaction.no_rm}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{transaction.diagnosis || '-'}</td>
                        <td className="px-6 py-4 font-medium text-green-600">{formatCurrency(transaction.total_amount)}</td>
                        <td className="px-6 py-4 text-sm capitalize">{transaction.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Tidak ada data untuk periode ini</p>
        </div>
      )}
    </div>
  );
}
