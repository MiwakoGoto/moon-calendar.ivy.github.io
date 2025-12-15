
import { getEto, getLuckyDays } from './src/lib/JapaneseCalendar.js';
import * as fs from 'fs';

const dates = [
    '2024-01-01', // Anchor (Should be 甲子)
    '2024-01-02',
    '2025-12-15', // Current date (User context)
    '2025-01-01',
    '2025-12-21', // Tensha?
    '2025-12-31'  // Tensha?
];

// Clear log file
try { fs.unlinkSync('repro_log.txt'); } catch (e) { }

dates.forEach(d => {
    // Fix timezone to local 00:00
    const [y, m, day] = d.split('-').map(Number);
    const localDate = new Date(y, m - 1, day);

    const eto = getEto(localDate);
    const lucks = getLuckyDays(localDate);

    const log = [];
    log.push(`Date: ${d}`);
    log.push(`  Eto: ${eto.etoString} (Stem: ${eto.stemIndex}, Branch: ${eto.branchIndex})`);
    log.push(`  Lucky: ${lucks.map(l => l.label).join(', ') || 'None'}`);
    log.push('---');
    fs.appendFileSync('repro_log.txt', log.join('\n') + '\n');
});
