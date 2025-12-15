
import { getEto, getLuckyDays } from './src/lib/JapaneseCalendar.js';
import * as fs from 'fs';

const dates = [];
// Generate all December 2025 dates
for (let d = 1; d <= 31; d++) {
    dates.push(`2025-12-${String(d).padStart(2, '0')}`);
}

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
