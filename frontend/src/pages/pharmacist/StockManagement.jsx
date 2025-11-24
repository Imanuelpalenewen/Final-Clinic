import { useState, useEffect } from 'react';
import { Plus, Edit, Package, AlertTriangle } from 'lucide-react';
import axios from '../../lib/axios';

export default function StockManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price: '',
    stock: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('/medicines');
      setMedicines(response.data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    setFormData({ name: '', unit: '', price: '', stock: '' });
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      unit: medicine.unit,
      price: medicine.price,
      stock: medicine.stock
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Convert to numbers on submit
      const submitData = {
        ...formData,
        stock: Number(formData.stock || 0),
        price: Number(formData.price || 0)
      };

      if (editingMedicine) {
        await axios.put(`/medicines/${editingMedicine.id}`, submitData);
        alert('Data obat berhasil diperbarui');
      } else {
        await axios.post('/medicines', submitData);
        alert('Obat baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchMedicines();
    } catch (error) {
      alert(error.message || 'Gagal menyimpan data obat');
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
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok Obat</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Obat
        </button>
      </div>

      {/* Low Stock Warning */}
      {medicines.some(m => m.stock < 10) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Peringatan Stok Rendah:</p>
              <p className="text-sm text-yellow-800 mt-1">
                Ada {medicines.filter(m => m.stock < 10).length} obat dengan stok di bawah 10
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <tr key={medicine.id} className={medicine.stock < 10 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 font-medium">{medicine.name}</td>
                <td className="px-6 py-4">{medicine.unit}</td>
                <td className="px-6 py-4">{formatCurrency(medicine.price)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    medicine.stock < 10 ? 'bg-red-100 text-red-800' : 
                    medicine.stock < 50 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {medicine.stock}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(medicine)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingMedicine ? 'Edit Obat' : 'Tambah Obat Baru'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Obat</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Satuan</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="tablet, botol, etc"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
                  <input
                    type="text"
                    value={formData.stock}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return setFormData({...formData, stock: ""});
                      if (/^[0-9]+$/.test(v)) setFormData({...formData, stock: v});
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga (Rp)</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setFormData({...formData, price: ""});
                    if (/^[0-9]+$/.test(v)) setFormData({...formData, price: v});
                  }}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
