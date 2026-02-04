
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
const codes = ['1380500000', '0403428000', '0330100000', '1030500000'];

async function check() {
    for (const code of codes) {
        console.log(`Checking ${code}...`);
        try {
            let res = await fetch(`https://psgc.gitlab.io/api/cities/${code}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`[CITY] ${code} -> ${data.name}`);
                continue;
            }
            res = await fetch(`https://psgc.gitlab.io/api/municipalities/${code}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`[MUNI] ${code} -> ${data.name}`);
                continue;
            }
            console.log(`[FAIL] ${code} not found.`);
        } catch (e) {
            console.log(`[ERR] ${code}: ${(e as any).message}`);
        }
    }
}

check();
