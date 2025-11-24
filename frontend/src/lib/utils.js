import { clsx } from 'clsx';

// Utility untuk menggabungkan className
export function cn(...inputs) {
  return clsx(inputs);
}

// Format currency IDR
export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date
export function formatDate(date) {
  return new Intl.DateFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
}

// Format datetime
export function formatDateTime(date) {
  return new Intl.DateFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// Calculate age from date of birth
export function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Get status badge color
export function getStatusColor(status) {
  const colors = {
    waiting: 'bg-yellow-100 text-yellow-800',
    doctor: 'bg-blue-100 text-blue-800',
    pharmacy: 'bg-purple-100 text-purple-800',
    cashier: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Get status label
export function getStatusLabel(status) {
  const labels = {
    waiting: 'Menunggu',
    doctor: 'Pemeriksaan Dokter',
    pharmacy: 'Proses Apotek',
    cashier: 'Pembayaran',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };
  
  return labels[status] || status;
}
