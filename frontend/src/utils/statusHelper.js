// Status Helper - Centralized status management

export const STATUS = {
  WAITING: 'waiting',
  DOCTOR: 'doctor',
  PHARMACY: 'pharmacy',
  CASHIER: 'cashier',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const getStatusLabel = (status) => {
  const labels = {
    waiting: 'Menunggu',
    doctor: 'Sedang diperiksa dokter',
    pharmacy: 'Sedang diproses apotek',
    cashier: 'Menunggu pembayaran',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    waiting: 'bg-blue-100 text-blue-800',
    doctor: 'bg-yellow-100 text-yellow-800',
    pharmacy: 'bg-orange-100 text-orange-800',
    cashier: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusBadge = (status) => {
  return `${getStatusColor(status)} px-3 py-1 rounded-full text-xs font-medium`;
};
