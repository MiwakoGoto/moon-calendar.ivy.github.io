/**
 * Moon Data Module
 * Uses Astronomy Engine (loaded via script tag as window.Astronomy)
 */

export function getMoonPhase(date) {
    if (!window.Astronomy) return { phase: 'unknown', age: 0, illumination: 0 };

    // Astronomy Engine date
    const astroDate = date;

    // Phase
    // Astronomy.MoonPhase(date) returns degrees [0, 360).
    const solarElongation = Astronomy.MoonPhase(astroDate); // 0=New, 90=First Quarter, 180=Full

    // Illumination fraction
    const illum = Astronomy.Illumination(Astronomy.Body.Moon, astroDate).mag; // Magnitude? No, phase_fraction.
    // Astronomy.Illumination returns { mag, phase_fraction, ... }
    const illumination = Astronomy.Illumination(Astronomy.Body.Moon, astroDate).phase_fraction * 100;

    // Age (Approx or calculate time since last New Moon)
    // Simply mapping degrees to age (0-29.5)
    // Age = (Degrees / 360) * 29.53
    const age = (solarElongation / 360) * 29.53;

    // Phase Name
    let phaseName = '';
    // Simple 8-state
    // New: 0-2, Waxing Cres: 2-88...
    // 0: New, 90: First Q, 180: Full, 270: Last Q.
    const deg = solarElongation;
    if (deg < 5 || deg > 355) phaseName = '新月';
    else if (deg >= 85 && deg < 95) phaseName = '上弦の月';
    else if (deg >= 175 && deg < 185) phaseName = '満月';
    else if (deg >= 265 && deg < 275) phaseName = '下弦の月';
    else phaseName = '';

    return {
        phaseName,
        age: age.toFixed(1),
        illumination: illumination.toFixed(0),
        degrees: deg
    };
}

export function getVoidTime(date) {
    if (!window.Astronomy) return null;

    // Calculate Void of Course for the given DAY.
    // Void starts: Date of last major aspect before sign ingress.
    // Void ends: Date of sign ingress.

    // Complex logic:
    // 1. Find Moon's current sign.
    // 2. Find time of next sign change (Ingress).
    // 3. Scan backwards from Ingress for last major aspect (Ptolemaic: 0, 60, 90, 120, 180) to Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
    // 4. Return that interval if it overlaps with 'date'.

    // Simplified for MVP:
    // Just find "Next Ingress" and show it. Users often just want to know when it enters the next sign.
    // But specific "Void Time" is requested.
    // Implementing robust Void calc in browser without heavy iteration is hard.
    // 
    // Alternative: Check if there's a Void *start* or *end* on this day.

    return null; // TODO: Implement full Void logic if time permits.
}
