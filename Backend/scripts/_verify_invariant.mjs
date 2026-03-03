import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);

const VM = (await import('../models/masters/VariantMaster.enterprise.js')).default;
const IM = (await import('../models/inventory/InventoryMaster.model.js')).default;

const [variants, inventory] = await Promise.all([
    VM.countDocuments({ status: { $ne: 'ARCHIVED' } }),
    IM.countDocuments({ isDeleted: false })
]);

console.log('');
console.log('══════════════════════════════════════════');
console.log('  INVENTORY INVARIANT VERIFICATION');
console.log('══════════════════════════════════════════');
console.log(`  Active Variants:    ${variants}`);
console.log(`  Inventory Records:  ${inventory}`);
console.log(`  Drift:              ${variants - inventory}`);
console.log('──────────────────────────────────────────');
if (variants === inventory) {
    console.log('  ✅ INVARIANT OK — all variants have inventory!');
} else {
    console.log(`  ❌ STILL DRIFTED — run repairInventoryMaster.js again`);
}
console.log('══════════════════════════════════════════');
console.log('');

await mongoose.disconnect();
