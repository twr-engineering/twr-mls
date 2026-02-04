import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Check if listings table exists and what columns it has
    const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'listings' 
    ORDER BY ordinal_position
  `);

    console.log('Listings table columns:');
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // Check if city and barangay columns exist
    const cityCol = res.rows.find(r => r.column_name === 'city');
    const barangayCol = res.rows.find(r => r.column_name === 'barangay');
    const cityIdCol = res.rows.find(r => r.column_name === 'city_id');
    const barangayIdCol = res.rows.find(r => r.column_name === 'barangay_id');

    console.log('\nCity/Barangay column status:');
    console.log(`  city: ${cityCol ? cityCol.data_type : 'NOT FOUND'}`);
    console.log(`  barangay: ${barangayCol ? barangayCol.data_type : 'NOT FOUND'}`);
    console.log(`  city_id: ${cityIdCol ? cityIdCol.data_type : 'NOT FOUND'}`);
    console.log(`  barangay_id: ${barangayIdCol ? barangayIdCol.data_type : 'NOT FOUND'}`);

    await pool.end();
}

main().catch(console.error);
