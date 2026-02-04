
async function testPsgc() {
    try {
        console.log('Fetching data...');
        const [provincesRes, citiesRes] = await Promise.all([
            fetch('https://psgc.cloud/api/provinces'),
            fetch('https://psgc.cloud/api/cities-municipalities')
        ]);

        const provinces = await provincesRes.json();
        const cities = await citiesRes.json();

        const targets = cities.filter((c: any) => c.name.includes('Victoria'));

        console.log(`Found ${targets.length} targets.`);

        for (const city of targets) {
            // Try to derive province code
            // Pattern: First 6 digits? Or something else?
            // Try substring matching

            // Code format is typically 10 digits
            // RR PPP MMMM
            // Region: 2
            // Province: 3?
            // Mun: 2?
            // Brgy: 3? (Usually)
            // Or RR PPP MMM BB (2+3+3+2?) No total 10.

            // Let's assume province code preserves the first 5 or 6 digits.
            // Adams: 01 028 01000 -> Prov: 01 028 00000

            // Let's try to find a province that matches the prefix
            const prefix5 = city.code.substring(0, 5);
            // const prefix6 = city.code.substring(0, 6);

            const match = provinces.find((p: any) => p.code.startsWith(prefix5));
            console.log(`City: ${city.name} (${city.code}) -> Prov Match: ${match ? match.name + ' (' + match.code + ')' : 'None'}`);
        }

    } catch (e) {
        console.error(e);
    }
}

testPsgc();
