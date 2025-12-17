import { getEto, getLuckyDays } from '../lib/JapaneseCalendar.js';
import { getMoonPhase } from '../lib/MoonData.js';

/**
 * Generate HTML for moon phase visualization
 * Uses 28-phase CSS rendering with overlapping ellipse technique for realistic crescents
 * @param {number} degrees - Moon phase in degrees (0=new, 180=full)
 * @param {number} illumination - Illumination percentage
 * @param {number} size - Size in pixels
 * @returns {string} HTML for moon visualization
 */
function getMoonPhaseHTML(degrees, illumination, size = 14) {
    const deg = degrees % 360;
    const radius = size / 2;

    // Colors
    const moonLight = '#e8e8e8'; // Light gray-white for lit portion
    const moonDark = '#1a1a2e';  // Dark blue-black for shadow
    const moonGlow = 'rgba(255, 255, 255, 0.15)'; // Subtle glow

    // Determine phase position (0-27 for 28 phases)
    // Each phase covers ~12.86 degrees (360/28)
    const phaseIndex = Math.floor(deg / 12.857) % 28;

    // Calculate illumination fraction for smooth transitions
    // 0 = new moon, 0.5 = quarter, 1 = full moon
    let illuminationFraction;
    if (deg <= 180) {
        illuminationFraction = deg / 180; // 0 to 1 (new to full, waxing)
    } else {
        illuminationFraction = (360 - deg) / 180; // 1 to 0 (full to new, waning)
    }

    const isWaxing = deg <= 180;

    // Special cases: New Moon and Full Moon
    if (phaseIndex === 0 || phaseIndex === 27) {
        // New Moon - dark with subtle ring
        return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${moonDark};border:1px solid rgba(255,255,255,0.15);box-sizing:border-box;"></div>`;
    }

    if (phaseIndex === 14) {
        // Full Moon - fully lit with glow
        return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 40% 40%, #fff 0%, ${moonLight} 50%, #c0c0c0 100%);box-shadow:0 0 ${size / 3}px ${moonGlow};"></div>`;
    }

    // For crescent and gibbous phases, use overlapping ellipse technique
    // The "terminator" (shadow edge) is curved, not straight

    // Calculate the ellipse width for the shadow overlay
    // At quarters (phaseIndex 7 or 21), it's a straight line (ellipse width = 0)
    // At crescents, the ellipse is wide and overlaps significantly
    // At gibbous, the ellipse is on the opposite side

    let overlayWidth, overlayPosition, baseColor, overlayColor;

    if (phaseIndex >= 1 && phaseIndex <= 7) {
        // Waxing Crescent to First Quarter (right side lit)
        const progress = phaseIndex / 7; // 0 to 1
        overlayWidth = size * (1 - progress * 0.8);
        baseColor = moonLight;
        overlayColor = moonDark;
        overlayPosition = `right:${size * progress * 0.3}px;`;
    } else if (phaseIndex >= 8 && phaseIndex <= 14) {
        // First Quarter to Full Moon (waxing gibbous)
        const progress = (phaseIndex - 7) / 7; // 0 to 1
        overlayWidth = size * (1 - progress);
        baseColor = moonLight;
        overlayColor = moonDark;
        overlayPosition = `left:-${size * 0.2 + (size * 0.8 * progress)}px;`;
    } else if (phaseIndex >= 15 && phaseIndex <= 21) {
        // Full Moon to Last Quarter (waning gibbous)
        const progress = (phaseIndex - 14) / 7; // 0 to 1
        overlayWidth = size * progress;
        baseColor = moonLight;
        overlayColor = moonDark;
        overlayPosition = `right:-${size * (1 - progress * 0.8)}px;`;
    } else {
        // Last Quarter to New Moon (waning crescent, left side lit)
        const progress = (phaseIndex - 21) / 6; // 0 to 1
        overlayWidth = size * (0.2 + progress * 0.8);
        baseColor = moonLight;
        overlayColor = moonDark;
        overlayPosition = `left:${size * (1 - progress) * 0.3}px;`;
    }

    // Add subtle gradient to lit portion for realism
    const gradientBase = phaseIndex <= 14
        ? `radial-gradient(circle at 30% 30%, #fff 0%, ${moonLight} 40%, #b0b0b0 100%)`
        : `radial-gradient(circle at 70% 30%, #fff 0%, ${moonLight} 40%, #b0b0b0 100%)`;

    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${gradientBase};position:relative;overflow:hidden;">
        <div style="position:absolute;width:${overlayWidth}px;height:${size}px;border-radius:50%;background:${overlayColor};${overlayPosition}top:0;"></div>
    </div>`;
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
                    <div class="w-16 h-16 rounded-full bg-slate-800 relative shadow-2xl">
                         <div class="absolute inset-0 rounded-full bg-yellow-100 opacity-${moon.illumination} blur-sm"></div>
                    </div>
                    <div>
                        <div class="text-xl font-medium">${moon.phaseName}</div>
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
