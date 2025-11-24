import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../database/klinik_sentosa.db');

console.log('🧹 AGGRESSIVE DUPLICATE CLEANUP\n');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ========== CLEANUP ALL DUPLICATE MEDICINES ==========
console.log('💊 Finding ALL duplicate medicines...\n');

// Get all medicines with their IDs
const allMedicines = db.prepare('SELECT id, name FROM medicines ORDER BY id ASC').all();

// Find duplicates by name
const nameMap = new Map();
allMedicines.forEach(med => {
  const normalized = med.name.toLowerCase().trim();
  if (!nameMap.has(normalized)) {
    nameMap.set(normalized, []);
  }
  nameMap.get(normalized).push(med.id);
});

// Find medicines used in prescriptions
const usedInPrescriptions = db.prepare(
  'SELECT DISTINCT medicine_id FROM prescriptions'
).all().map(r => r.medicine_id);

console.log('Used in prescriptions:', usedInPrescriptions);

let totalDeleted = 0;
let totalKept = 0;

nameMap.forEach((ids, name) => {
  if (ids.length > 1) {
    console.log(`\n🔍 Duplicate: "${name}" → ${ids.length} copies (IDs: ${ids.join(', ')})`);
    
    // Find one to keep (prefer one used in prescriptions, or the first one)
    let keepId = ids[0];
    for (const id of ids) {
      if (usedInPrescriptions.includes(id)) {
        keepId = id;
        break;
      }
    }
    
    console.log(`  ✅ Keep ID: ${keepId}`);
    
    // Delete all others
    const toDelete = ids.filter(id => id !== keepId);
    toDelete.forEach(id => {
      try {
        db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
        console.log(`    ❌ Deleted ID: ${id}`);
        totalDeleted++;
      } catch (error) {
        console.log(`    ⚠️  Cannot delete ID ${id}: ${error.message}`);
      }
    });
    
    totalKept++;
  } else {
    totalKept++;
  }
});

console.log(`\n📊 Cleanup Summary:`);
console.log(`  ✅ Unique medicines kept: ${totalKept}`);
console.log(`  ❌ Duplicates deleted: ${totalDeleted}`);

// Final count
const finalCount = db.prepare('SELECT COUNT(*) as count FROM medicines').get();
console.log(`  📦 Total medicines in DB: ${finalCount.count}`);

// Show all remaining medicines
console.log(`\n📋 Remaining medicines:\n`);
const remaining = db.prepare('SELECT id, name, stock, price FROM medicines ORDER BY name ASC').all();
remaining.forEach((med, idx) => {
  console.log(`  ${idx + 1}. ${med.name} (ID: ${med.id}, Stock: ${med.stock}, Price: Rp${med.price})`);
});

console.log('\n✅ Cleanup completed!\n');

db.close();
