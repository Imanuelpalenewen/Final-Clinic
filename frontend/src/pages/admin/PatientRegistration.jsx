import { useState } from 'react';
import { Search, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from '../../lib/axios';

export default function PatientRegistration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    address: '',
    phone: '',
    complaint: '',
    is_emergency: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Search existing patient
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get(`/patients/search?q=${searchQuery}`);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Select existing patient
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender || '',
      address: patient.address || '',
      phone: patient.phone || '',
      complaint: '',
      is_emergency: false
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Validation
    if (!formData.name || !formData.dob || !formData.gender || !formData.address || !formData.phone) {
      setError('Semua field dengan tanda * harus diisi');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/patients', formData);
      
      setSuccess({
        patient: response.patient,
        queue: response.queue
      });

      // Reset form
      setFormData({
        name: '',
        dob: '',
        gender: '',
        address: '',
        phone: '',
        complaint: '',
        is_emergency: false
      });
      setSelectedPatient(null);
    } catch (error) {
      setError(error.message || 'Gagal mendaftarkan pasien');
    } finally {
      setLoading(false);
    }
  };

  // Reset and register another
  const handleRegisterAnother = () => {
    setSuccess(null);
    setError('');
    setFormData({
      name: '',
      dob: '',
      gender: '',
      address: '',
      phone: '',
      complaint: '',
      is_emergency: false
    });
    setSelectedPatient(null);
  };

  // Success Modal
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registrasi Berhasil!
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 my-6">
            <p className="text-sm text-gray-600 mb-2">Nomor Antrian</p>
            <p className="text-5xl font-bold text-blue-600">
              #{String(success.queue.queue_number).padStart(3, '0')}
            </p>
          </div>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Nama Pasien</p>
            <p className="font-semibold text-gray-900">{success.patient.name}</p>
            
            <p className="text-sm text-gray-600 mt-3">No. RM</p>
            <p className="font-semibold text-gray-900">{success.patient.no_rm}</p>
            
            <p className="text-sm text-gray-600 mt-3">Status</p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Menunggu Pemeriksaan
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cetak Kartu Antrian
            </button>
            <button
              onClick={handleRegisterAnother}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Daftar Pasien Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrasi Pasien</h1>
        <p className="text-gray-600 mt-1">Daftarkan pasien baru atau pasien lama untuk masuk antrian</p>
      </div>

      {/* Search Existing Patient */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cari Pasien Terdaftar</h2>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari pasien: nama, no. RM, atau telepon"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cari
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-lg divide-y">
            {searchResults.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.no_rm} • {patient.phone}</p>
                </div>
                <UserPlus className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {selectedPatient && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Pasien terpilih: {selectedPatient.name} ({selectedPatient.no_rm})
            </p>
          </div>
        )}
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedPatient ? 'Data Pasien & Keluhan' : 'Data Pasien Baru'}
        </h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!!selectedPatient}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              disabled={!!selectedPatient}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={!!selectedPatient}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!!selectedPatient}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!!selectedPatient}
              required
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keluhan
            </label>
            <input
              type="text"
              name="complaint"
              value={formData.complaint}
              onChange={handleChange}
              placeholder="Optional - keluhan pasien hari ini"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Emergency Checkbox */}
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <input
            type="checkbox"
            id="is_emergency"
            name="is_emergency"
            checked={formData.is_emergency}
            onChange={handleChange}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="is_emergency" className="text-sm font-medium text-red-900 cursor-pointer">
            ☑ Pasien Darurat (Emergency)
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleRegisterAnother}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              'Memproses...'
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {selectedPatient ? 'Daftarkan ke Antrian' : 'Registrasi & Masuk Antrian'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
