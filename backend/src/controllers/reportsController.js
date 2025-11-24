import db from '../models/db.js';

// Get daily report
export const getDailyReport = (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get ALL patients registered today (not cancelled)
    const allPatients = db.prepare(`
      SELECT COUNT(*) as count
      FROM queue
      WHERE DATE(created_at) = ? AND status != 'cancelled'
    `).get(targetDate);

    // Get completed transactions for revenue
    const completedTransactions = db.prepare(`
      SELECT 
        t.id,
        t.total_amount,
        t.payment_method,
        t.created_at,
        q.queue_number,
        q.diagnosis,
        p.name as patient_name,
        p.no_rm
      FROM transactions t
      JOIN queue q ON t.queue_id = q.id
      JOIN patients p ON q.patient_id = p.id
      WHERE DATE(t.created_at) = ?
      ORDER BY t.created_at DESC
    `).all(targetDate);

    // Calculate totals
    const totalPatients = allPatients.count || 0;
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalTransactions = completedTransactions.length;

    res.json({
      success: true,
      data: {
        date: targetDate,
        total_patients: totalPatients,
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        transactions: completedTransactions
      }
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan harian',
      error: error.message
    });
  }
};

// Get monthly report
export const getMonthlyReport = (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || String(new Date().getMonth() + 1).padStart(2, '0');
    const targetYear = year || String(new Date().getFullYear());
    const monthYear = `${targetYear}-${targetMonth}`;

    // Get daily breakdown for the month
    const dailyBreakdown = db.prepare(`
      SELECT 
        DATE(q.created_at) as date,
        COUNT(*) as patients,
        SUM(q.total_cost) as revenue
      FROM queue q
      WHERE strftime('%Y-%m', q.created_at) = ? AND q.status = 'completed'
      GROUP BY DATE(q.created_at)
      ORDER BY date ASC
    `).all(monthYear);

    // Calculate totals
    const totalPatients = dailyBreakdown.reduce((sum, day) => sum + day.patients, 0);
    const totalRevenue = dailyBreakdown.reduce((sum, day) => sum + (day.revenue || 0), 0);
    const averagePerDay = dailyBreakdown.length > 0 ? totalRevenue / dailyBreakdown.length : 0;

    res.json({
      success: true,
      data: {
        month: `${getMonthName(parseInt(targetMonth))} ${targetYear}`,
        total_patients: totalPatients,
        total_revenue: totalRevenue,
        average_per_day: Math.round(averagePerDay),
        daily_breakdown: dailyBreakdown
      }
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil laporan bulanan',
      error: error.message
    });
  }
};

// Helper function to get month name
function getMonthName(month) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month - 1];
}
