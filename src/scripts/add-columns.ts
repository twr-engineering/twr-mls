import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function addColumns() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })

    try {
        console.log('Adding missing columns to tables...')

        // Add city_id to listings (integer foreign key)
        const checkCityId = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'city_id'
    `)

        if (checkCityId.rows.length === 0) {
            await pool.query('ALTER TABLE listings ADD COLUMN city_id INTEGER')
            console.log('Added city_id column to listings')
        } else {
            console.log('listings.city_id already exists')
        }

        // Add barangay_id to listings (integer foreign key)
        const checkBarangayId = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'barangay_id'
    `)

        if (checkBarangayId.rows.length === 0) {
            await pool.query('ALTER TABLE listings ADD COLUMN barangay_id INTEGER')
            console.log('Added barangay_id column to listings')
        } else {
            console.log('listings.barangay_id already exists')
        }

        // Add development_id to listings (integer foreign key)
        const checkDevId = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'development_id'
    `)

        if (checkDevId.rows.length === 0) {
            await pool.query('ALTER TABLE listings ADD COLUMN development_id INTEGER')
            console.log('Added development_id column to listings')
        } else {
            console.log('listings.development_id already exists')
        }

        // Add township_id to listings (integer foreign key)
        const checkTownshipId = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'township_id'
    `)

        if (checkTownshipId.rows.length === 0) {
            await pool.query('ALTER TABLE listings ADD COLUMN township_id INTEGER')
            console.log('Added township_id column to listings')
        } else {
            console.log('listings.township_id already exists')
        }

        // Add estate_id to listings (integer foreign key)
        const checkEstateId = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'estate_id'
    `)

        if (checkEstateId.rows.length === 0) {
            await pool.query('ALTER TABLE listings ADD COLUMN estate_id INTEGER')
            console.log('Added estate_id column to listings')
        } else {
            console.log('listings.estate_id already exists')
        }

        // Add psgc_code to cities
        const checkCitiesPsgc = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cities' AND column_name = 'psgc_code'
    `)

        if (checkCitiesPsgc.rows.length === 0) {
            await pool.query('ALTER TABLE cities ADD COLUMN psgc_code VARCHAR(255)')
            console.log('Added psgc_code column to cities')
        } else {
            console.log('cities.psgc_code already exists')
        }

        // Add psgc_code to barangays
        const checkBarangaysPsgc = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'barangays' AND column_name = 'psgc_code'
    `)

        if (checkBarangaysPsgc.rows.length === 0) {
            await pool.query('ALTER TABLE barangays ADD COLUMN psgc_code VARCHAR(255)')
            console.log('Added psgc_code column to barangays')
        } else {
            console.log('barangays.psgc_code already exists')
        }

        console.log('Done! All columns added successfully.')

    } catch (err) {
        console.error('Error:', err)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

addColumns()
