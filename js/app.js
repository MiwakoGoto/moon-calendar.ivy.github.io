import { getEto, getLuckyDays } from '../lib/JapaneseCalendar.js';
import { getMoonPhase } from '../lib/MoonData.js';

/**
 * Generate SVG for moon phase visualization
 * Uses proper arc paths for accurate crescent and gibbous shapes
 * 
 * Phase progression:
 * 0° = New Moon (dark)
 * 0-90° = Waxing Crescent (right side lit, crescent grows)
 * 90° = First Quarter (right half lit)
 * 90-180° = Waxing Gibbous (right side mostly lit)
 * 180° = Full Moon (fully lit)
 * 180-270° = Waning Gibbous (left side mostly lit, shadow on right)
 * 270° = Last Quarter (left half lit)
 * 270-360° = Waning Crescent (left side lit, thin crescent)
 * 
 * @param {number} degrees - Moon phase in degrees (0=new, 180=full)
 * @param {number} illumination - Illumination percentage
 * @param {number} size - Size in pixels
 * @returns {string} SVG HTML for moon visualization
 */
function getMoonPhaseHTML(degrees, illumination, size = 14) {
    const deg = degrees % 360;
    const r = size / 2;
    const cx = r;
    const cy = r;

    // Colors
    const lightColor = '#e8e8e0'; // Lit portion
    const darkColor = '#1a1a2e';  // Shadow portion

    // Special case: New Moon (within 6 degrees)
    if (deg < 6 || deg > 354) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${darkColor}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        </svg>`;
    }

    // Special case: Full Moon (within 6 degrees of 180)
    if (deg > 174 && deg < 186) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="${lightColor}"/>
        </svg>`;
    }

    // Calculate terminator curve factor
    // At quarters (90°, 270°), terminator is straight (factor=0)
    // At crescent/gibbous, terminator is curved (factor>0)
    let curveFactor;
    if (deg <= 90) {
        curveFactor = (90 - deg) / 90; // 1→0 as we approach first quarter
    } else if (deg <= 180) {
        curveFactor = (deg - 90) / 90; // 0→1 as we approach full moon
    } else if (deg <= 270) {
        curveFactor = (270 - deg) / 90; // 1→0 as we approach last quarter
    } else {
        curveFactor = (deg - 270) / 90; // 0→1 as we approach new moon
    }

    const innerRx = r * curveFactor;
    let path;

    if (deg <= 90) {
        // Waxing Crescent: thin crescent on RIGHT side
        // Right semicircle lit, curved terminator pushes into it from left? NO.
        // Terminator must curve to the RIGHT (Sweep 0) to make a thin crescent.
        path = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${innerRx} ${r} 0 0 0 ${cx} ${cy - r}`;
    } else if (deg <= 180) {
        // Waxing Gibbous: mostly lit, small shadow on LEFT
        // Right semicircle lit + bulge to the left (Sweep 1)
        path = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${innerRx} ${r} 0 0 1 ${cx} ${cy - r}`;
    } else if (deg <= 270) {
        // Waning Gibbous: mostly lit, shadow growing on RIGHT
        // Left semicircle lit + bulge to the right (Sweep 0)
        path = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${innerRx} ${r} 0 0 0 ${cx} ${cy - r}`;
    } else {
        // Waning Crescent: thin crescent on LEFT side
        // Left semicircle lit, curved terminator pushes into it from right (Sweep 1)
        path = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${innerRx} ${r} 0 0 1 ${cx} ${cy - r}`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${darkColor}"/>
        <path d="${path}" fill="${lightColor}"/>
    </svg>`;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

let currentDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCurrentStatus();
    renderCalendar(currentDate);
    setupEventListeners();
    updateHeader();
    lucide.createIcons();
});

/**
 * Render today's status panel
 */
function renderCurrentStatus() {
    const panel = document.getElementById('current-status');
    const today = new Date();

    const moon = getMoonPhase(today);
    const eto = getEto(today);
    const luckyDays = getLuckyDays(today);

    const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 (${WEEKDAYS[today.getDay()]})`;

    // Lucky badges HTML
    const luckyBadges = luckyDays.length > 0
        ? luckyDays.map(l => {
            const colorClass = l.type === 'tensha' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900'
                : l.type === 'ichiryumanbai' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30';
            return `<span class="inline-block px-2 py-1 rounded text-xs font-bold ${colorClass}">${l.label}</span>`;
        }).join(' ')
        : '<span class="text-slate-500 text-sm">特筆すべき吉日はありません</span>';

    panel.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Today's Date -->
            <div class="flex flex-col justify-center">
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">TODAY</p>
                <h3 class="text-xl font-bold text-white">${dateStr}</h3>
                <p class="text-sm text-slate-400 mt-1">${eto.etoString}の日</p>
            </div>
            
            <!-- Moon Phase -->
            <div class="flex items-center gap-4">
                <div class="flex items-center justify-center" style="width:56px;height:56px;">
                    ${getMoonPhaseHTML(moon.degrees, parseFloat(moon.illumination), 48)}
                </div>
                <div>
                    <p class="text-xs text-indigo-300 uppercase tracking-wider mb-1">MOON</p>
                    <div class="text-lg font-medium text-white">${moon.phaseName}</div>
                    <div class="text-xs text-slate-400">月齢 ${moon.age} / 輝度 ${moon.illumination}%</div>
                </div>
            </div>
            
            <!-- Lucky Days -->
            <div>
                <p class="text-xs text-amber-300 uppercase tracking-wider mb-2">FORTUNE</p>
                <div class="flex flex-wrap gap-2">
                    ${luckyBadges}
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
        updateHeader();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
        updateHeader();
    });
}

function updateHeader() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    document.getElementById('current-month-label').textContent = `${year}年 ${month}月`;
}

function renderCalendar(date) {
    const grid = document.getElementById('calendar-grid');
    // Clear days (keep headers? headers are static 7 divs)
    // Actually grid has headers inside? 
    // HTML structure: headers are first 7 children.
    // Remove all children after first 7 (headers).
    const cells = Array.from(grid.children);
    for (let i = 7; i < cells.length; i++) {
        cells[i].remove(); // Remove old days
    }
    // Alternatively, just clear all and rebuild headers if needed, but keeping headers is cleaner.
    // Let's implement robust clear.
    while (grid.children.length > 7) {
        grid.removeChild(grid.lastChild);
    }

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = lastDay.getDate();

    // Empty cells for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
        const empty = document.createElement('div');
        empty.className = 'p-2 opacity-50'; // Placeholder
        grid.appendChild(empty);
    }

    // Days
    const today = new Date();

    for (let d = 1; d <= daysInMonth; d++) {
        const currentLoopDate = new Date(year, month, d);
        const cell = document.createElement('div');
        cell.className = 'day-cell group relative overflow-hidden';

        // Is Today?
        if (today.toDateString() === currentLoopDate.toDateString()) {
            cell.classList.add('today');
        }

        // Data
        const luckyDays = getLuckyDays(currentLoopDate); // [{type, label}]
        const moon = getMoonPhase(currentLoopDate);
        const eto = getEto(currentLoopDate);

        // Content
        let badgesHtml = luckyDays.map(l => {
            const extraClass = l.type === 'tensha' ? 'badge-tensha' : 'bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500';
            return `<span class="text-[10px] block ${extraClass}">${l.label}</span>`;
        }).join('');

        cell.innerHTML = `
            <div class="flex justify-between items-start z-10">
                <span class="font-medium ${currentLoopDate.getDay() === 0 ? 'text-red-400' : currentLoopDate.getDay() === 6 ? 'text-blue-400' : 'text-slate-300'}">${d}</span>
                <span class="text-[10px] text-slate-500">${eto.etoString}</span>
            </div>
            
            <div class="flex flex-col gap-1 mt-1 z-10">
                ${badgesHtml}
            </div>
            
            <div class="mt-auto flex items-center justify-end gap-1 z-10">
                 <span class="text-[10px] text-slate-400 mr-1">${moon.phaseName}</span>
                 <!-- Moon Icon -->
                 ${getMoonPhaseHTML(moon.degrees, parseFloat(moon.illumination), 16)}
            </div>

            <!-- Hover Effect Background -->
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none"></div>
        `;

        // Click event
        cell.addEventListener('click', () => openModal(currentLoopDate, moon, luckyDays, eto));

        grid.appendChild(cell);
    }
}

function openModal(date, moon, luckyDays, eto) {
    const modal = document.getElementById('day-modal');
    const content = document.getElementById('modal-content');

    // Format Date
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${WEEKDAYS[date.getDay()]})`;

    content.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <h3 class="text-2xl font-bold text-white">${dateStr}</h3>
                <p class="text-slate-400">${eto.etoString}の日</p>
            </div>
            <button id="close-modal" class="p-2 hover:bg-white/10 rounded-full transition-colors">
                <i data-lucide="x"></i>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Moon Section -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                <h4 class="text-sm text-indigo-300 font-semibold mb-3 flex items-center gap-2">
                    <i data-lucide="moon"></i> MOON PHASE
                </h4>
                <div class="flex items-center gap-4">
                    ${getMoonPhaseHTML(moon.degrees, parseFloat(moon.illumination), 64)}
                    <div>
                        ${moon.phaseName ? `<div class="text-xl font-medium">${moon.phaseName}</div>` : ''}
                        <div class="text-sm text-slate-400">月齢: ${moon.age}</div>
                        <div class="text-sm text-slate-500">輝度: ${moon.illumination}%</div>
                    </div>
                </div>
            </div>

            <!-- Lucky Section -->
            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                <h4 class="text-sm text-amber-300 font-semibold mb-3 flex items-center gap-2">
                    <i data-lucide="sparkles"></i> DAILY FORTUNE
                </h4>
                ${luckyDays.length > 0 ?
            luckyDays.map(l => `
                        <div class="mb-2 last:mb-0">
                            <span class="inline-block px-2 py-1 rounded bg-amber-500/20 text-amber-200 text-xs font-bold mb-1 border border-amber-500/30">${l.label}</span>
                            <p class="text-sm text-slate-300">
                                ${getLuckyDescription(l.type)}
                            </p>
                        </div>
                    `).join('')
            : '<p class="text-slate-500 text-sm italic">特筆すべき吉日はありません。<br>平穏な一日を。</p>'
        }
            </div>
        </div>
    `;

    // Re-initialize icons in modal
    lucide.createIcons();

    // Show Modal
    modal.classList.remove('opacity-0', 'pointer-events-none');

    // Close Logic
    document.getElementById('close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('day-modal');
    modal.classList.add('opacity-0', 'pointer-events-none');
}

function getLuckyDescription(type) {
    const dict = {
        'tensha': '天が万物の罪を赦す日。最上の吉日。新しいことを始めるのに最適。',
        'ichiryumanbai': '一粒の籾が万倍に実る日。種まき、開店、出資に吉。',
        'tora': '「千里行って千里帰る」俊足の虎。旅行や金運に良い日。結婚は「出戻る」ため不向きとも。',
        'mi': '弁財天の使い、蛇の日。金運・芸術運が上昇する日。',
        'super-mi': '60日に一度の最強金運日。弁財天への参拝が特におすすめ。'
    };
    return dict[type] || '良い日です。';
}
