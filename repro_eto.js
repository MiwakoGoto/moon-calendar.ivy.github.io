
import { getEto } from './src/lib/JapaneseCalendar.js';

const dates = [
    '2024-01-01', // Anchor (Should be 甲寅)
    '2024-01-02', // Should be 乙卯
    '2025-12-15', // Current date (User context)
    '2025-01-01',
];

dates.forEach(d => {
    const date = new Date(d);
    // Fix timezone to local 00:00 if string parses to UTC
    // new Date('YYYY-MM-DD') is usually UTC. new Date(Y, M, D) is local.
    // Let's use explicit local construction to match app behavior.
    const [y, m, day] = d.split('-').map(Number);
    const localDate = new Date(y, m - 1, day);

    const eto = getEto(localDate);
    // process.stdout.write to ensure flushing? console.log is usually fine but let's be simple.
    console.log(`Date: ${d}`);
    console.log(`  Eto: ${eto.etoString}`);
    console.log(`  Stem: ${eto.stemIndex} (${eto.stem})`);
    console.log(`  Branch: ${eto.branchIndex} (${eto.branch})`);
    console.log('---');
});
