
const BOOT_ASCII = String.raw`
...............                                                      
.................... .                                                
........................                                              
.......................... .                                          
...............................      .                                
............................  ..    .. .                              
...................................... .                              
................................++:.....                              
...............................+@@@@:...                              
................................*@@@@:.... ..                         
.....................+%:.........#@@@*.......                         
................:+@@@@@%:.......-@@@%:.......                         
...............:@@@@@@@@-.......%@@@@:........                        
....................:@@@@:.....:@@@@#.............                    
....................:%@@@@:....#@@@@+...............                  
...................:::@@@@%:..+@@@@@:.................                
.....................:*@@@@=::+@@@@%:....................             
.....................::@@@@@%:+@@@@@=....................             
:...................:::=@@@@@@@@@@@@*........................         
::::::::::..:::.:::::::::%@@@@@@@@@@@%#=:.....................        
::::::::::::::::::::::::::+@@@@@@@@@@@@@@......................       
::::::::::::::::::::+@@@@@%#@@@@@@@@@@@@@%:..................         
:::::::::::::::::::::+@@@@@@@@@@@@@@@@@@@@*..................         
::::::::::::::::::::::::::=#@@@@@@@@@@@@@@@-..................        
-:---------------------------@@@@@@@@@@@@@@@%+-...............        
------------------------------*@@@@@@@@@@@@@@@@@@*:..........         
--------------------------------+@@@@@@@@@*##@@@@@@@*.......          
-------------=====--------------------:#@*::::.:#@@@@@%:...           
==========================---------*+-=%*:::::....:+@@@@@...          
============================-----------:::::::......+-#@%...          
=============+++++++++========--------::::::::...............         
++++++++++++++++++++++++++++=====-----::::::...................       
++++++********************++++====----:::::::...................      
****************************++++===----::::::::..................     
%%@%%%%@@@@@@@@@@@@@@@@@%%#***++===-----::::::::::.................   
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%##*++=------::::::::::...............  
@@@@@@@@@@@@@@@@@@@@@@@@@%%##%%@%%%%%%#*+=---:::::::::::..............
@@@@@@@@@@@%%%%%#####****++++++++*##%%%%#%##*+=--:::::::::............       

   _____  ______ ___     __     ______   _____  ____   ___    ______ ______
  / ___/ / ____//   |   / /    / ____/  / ___/ / __ \ /   |  / ____// ____/
  \__ \ / /    / /| |  / /    / __/     \__ \ / /_/ // /| | / /    / __/   
 ___/ // /___ / ___ | / /___ / /___    ___/ // ____// ___ |/ /___ / /___   
/____/_\____//_/  |_|/_____//_____/ __/____//_/_  _/_/ _|_|\____//_____/   
  / ___/\ \/ // | / //_  __// / / // ____// ___/ /  _// ___//_  __/        
  \__ \  \  //  |/ /  / /  / /_/ // __/   \__ \  / /  \__ \  / /           
 ___/ /  / // /|  /  / /  / __  // /___  ___/ /_/ /  ___/ / / /            
/____/  /_//_/ |_/  /_/  /_/ /_//_____/ /____//___/ /____/ /_/             
                                                                           
`;

// ─── Scale Space Synthesist ───────────────────────────────────────── by setz
//
// Join the subreddit: https://reddit.com/r/ScaleSpace
//
// Get Scale Space on itch: https://setzstone.itch.io/scale-space
// (Includes all prior versions + all future updates)
//
// Picking up the itch version directly funds development of this repo.
//
// Sections (in order):
//
//   1. APP_TEXT        — all UI labels and copy
//   2. AudioManager    — Tone.js ambient soundscape (disabled this release)
//   3. Atlas           — waypoint capture / restore / tour
//   4. Engine          — WebGPU renderer, TSL compute kernels, the simulation
//   5. RadialUI        — radial menu
//   6. UI              — panels, sliders, toggles, layout
//   7. Bootstrap       — state defaults, key handlers, render loop, init()
//   8. User			- profile, save File, theme, modulation
//
// ──────────────────────────────────────────────────────────────────────────── 

import * as THREE from 'three/webgpu';
import {
    pass, color, mix, positionLocal, attribute, pointWidth,
    float, vec2, vec3, vec4, instanceIndex, uniform,
    dot, length, normalize, sub, add, mul, sin, cos, fract, floor,
    compute, storage, Fn, time, max, min, div, mx_noise_float, step,
    atomicAdd, atomicStore, uint, int, mod, If, bitAnd, Loop, select, clamp, abs,
    instancedBufferAttribute, modelViewMatrix, cameraProjectionMatrix, vertexIndex, billboarding, uv, cross
} from 'three/tsl';

// ────────────────────────────────────────────────────────────────────────────
//   1. APP_TEXT
// ────────────────────────────────────────────────────────────────────────────

export const APP_TEXT = {
    "hud": {
        "title": "CORE DECK // SYNTHESIST"
    },
    "panels": {
        "params": "Parameters",
        "visuals": "Visuals",
        "atlas": "Atlas",
        "controls": "Controls",
        "config": "Config",
        "offsets": "Offset Calibration (Debug)",
        "debug": "Debug Tools"
    },
    "controls": {
        "freeEnergy": { "label": "Free Energy", "sub": "particle count", "ll": "sparse", "lr": "dense" },
        "resolution": { "label": "Resolution", "sub": "particle size", "ll": "-rez", "lr": "+rez" },
        "inversion": { "label": "Inversion", "sub": "compression", "ll": "contract", "lr": "expand" },
        "halfLife": { "label": "Half-Life", "sub": "particle lifespan", "ll": "mortal", "lr": "immortal" },
        "scaleDepth": { "label": "Scale Depth", "sub": "attraction force", "ll": "micro", "lr": "macro" },
        "coherence": { "label": "Coherence", "sub": "attraction radius", "ll": "vague", "lr": "binary" },
        "equilibrium": { "label": "Equilibrium", "sub": "noise speed", "ll": "tranquil", "lr": "random" },
        "temperature": { "label": "Temperature", "sub": "noise intensity", "ll": "glacial", "lr": "firey" },
        "viscosity": { "label": "Viscosity", "sub": "sluggishness", "ll": "fluid", "lr": "thick" },
        "mass": { "label": "Mass", "sub": "inertia", "ll": "light", "lr": "heavy" },
        "tempo": { "label": "Tempo", "sub": "speed", "ll": "pause", "lr": "2x" },
        "colorRange": { "label": "Color Range", "sub": "spectrum width", "ll": "tight", "lr": "wide" },
        "saturation": { "label": "Saturation", "sub": "gray vs color", "ll": "muted", "lr": "vivid" },
        "variance": { "label": "Variance", "sub": "noise gradient", "ll": "uniform", "lr": "spectral" },
        "opacity": { "label": "Opacity", "sub": "", "ll": "ghost", "lr": "solid" },
        "trailLength": { "label": "Trail Length", "sub": "", "ll": "short", "lr": "long" },
        "backdropOpacity": { "label": "Backdrop Opacity", "sub": "", "ll": "off", "lr": "bright" },
        "backdropBlur": { "label": "Backdrop Blur", "sub": "", "ll": "crisp", "lr": "soft" },
        "panelOpacity": { "label": "Panel Opacity", "sub": "", "ll": "clear", "lr": "solid" },
        "volume": { "label": "Volume", "sub": "", "ll": "quiet", "lr": "loud" }
    },
    "quanta": {
        "label": "Quanta",
        "items": ["Circle", "Square", "Diamond"]
    },
    "strings": {
        "label": "Strings",
        "items": ["Curved", "Lattice"]
    },
    "colorMode": {
        "label": "Color Mode",
        "items": ["White", "Size", "Velocity", "Density"]
    },
    "moveMode": {
        "label": "Move Mode",
        "items": ["Orbit", "Fly"]
    },
    "instructions": {
        "global": {
            "title": "Global Controls",
            "keys": [
                "Tab: Hide UI",
                "Home: Reset Camera",
                "Ctrl+S: Capture Waypoint",
                "Pause: Toggle Pause",
                "PgUp/PgDn: Adjust Tempo"
            ]
        },
        "orbit": {
            "title": "Orbit Mode",
            "keys": [
                "Drag to rotate",
                "Scroll to zoom"
            ]
        },
        "fly": {
            "title": "Fly Mode",
            "keys": [
                "W/A/S/D: Move horizontal",
                "Mouse: Look around",
                "Space/Shift: Move up/down"
            ]
        }
    }
};

// ────────────────────────────────────────────────────────────────────────────
//   2. AudioManager - STUB — audio is disabled in this build.
// ────────────────────────────────────────────────────────────────────────────

export class AudioManager {
    constructor()      { this.nodes = null; }
    async toggle(_s)   { }
    async start(_s)    { }
    stop()             { }
    updateVolume(_v)   { }
}

// ────────────────────────────────────────────────────────────────────────────
//   3. Atlas
// ────────────────────────────────────────────────────────────────────────────

const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
@keyframes pulseGreen {
    0% { transform: scale(1); text-shadow: 0 0 5px rgba(136, 255, 136, 0.2); color: rgba(136, 255, 136, 0.8); }
    50% { transform: scale(1.1); text-shadow: 0 0 15px rgba(136, 255, 136, 1); color: #88ff88; }
    100% { transform: scale(1); text-shadow: 0 0 5px rgba(136, 255, 136, 0.2); color: rgba(136, 255, 136, 0.8); }
}`;
document.head.appendChild(pulseStyle);

const PARAM_KEYS = [
    'freeEnergy', 'resolution', 'inversion', 'halfLife', 'scaleDepth',
    'coherence', 'equilibrium', 'temperature', 'viscosity', 'mass',
    'tempo', 'hue', 'sat', 'lightness', 'opacity', 'trailLen',
    'bgGlow', 'bgBlur', 'offsetX', 'offsetY', 'offsetZ', 'billboardOffset'
];

const MODULATABLE_KEYS = [
    'freeEnergy', 'resolution', 'inversion', 'halfLife', 'scaleDepth',
    'coherence', 'equilibrium', 'temperature', 'viscosity', 'mass',
    'tempo', 'opacity', 'hue', 'sat', 'lightness', 'trailLen', 'bgGlow', 'bgBlur'
];

// ─── Modulation keys ────────────────────────────────────────────────────────
// Each modulated parameter has a corresponding _mod.

const MOD_KEYS = MODULATABLE_KEYS.map(k => k + '_mod');

// Layer-crossfade alpha map. Discrete-toggle keys whose visibility we want
// to animate as a proper material-opacity fade rather than a hard snap.
// Earlier comment claimed Strings/Lattice "couldn't produce sensible geometry
// from a half-faded state" — that turned out to be wrong: the compute kernels
// are gated on the BOOLEAN flag (only run when on), so they never see a
// fractional state. The fade lives purely at material.opacity, which is
// trivially animatable. Adding them back so user toggles fade smoothly.
const VISIBILITY_XFADE_KEYS = {
    showParticles: 'particles',
    showRibbons:   'ribbons',
    tessRibbons:   'lattice'
};

// Keys whose changes are "the user has taken over the simulation" and should
// stop an active tour. These are the keys the tour itself interpolates plus
// the discrete flags it sets at transition end. Anything outside this set —
// theme, button shape, screenshot toggles, scanline overlays, UI opacity,
// audio toggles — is cosmetic chrome that has nothing to do with the
// parameter trajectory the tour is following, so changing them mid-tour
// should NOT cancel the tour. Without this distinction, toggling theme
// mid-tour was killing the tour, which felt buggy.
const TOUR_STOPPING_KEYS = new Set([
    ...PARAM_KEYS,
    ...MOD_KEYS,
    'showParticles', 'showRibbons', 'tessRibbons',
    'shape', 'colorMode',
    'moveMode' // active driving cancels the tour by intent
]);

export const tour = { active: false, rotSpeed: 0.0005, wpIdx: 0, mode: 'sequential' };

function coordHash(p) {
    let h = '';
    PARAM_KEYS.forEach(k => {
        const v = p[k];
        if (v === undefined) return;
        h += v < 1 ? v.toFixed(2) : v < 100 ? Math.round(v * 10) / 10 : Math.round(v);
    });
    let n = 0;
    for (let i = 0; i < h.length; i++) n = ((n << 5) - n) + h.charCodeAt(i) | 0;
    return 'SS-' + Math.abs(n).toString(36).toUpperCase().slice(0, 8);
}

function clamp01(v) {
    return Math.max(0, Math.min(1, Number(v) || 0));
}

function visibilityAlphaForKey(key) {
    const xfadeKey = VISIBILITY_XFADE_KEYS[key];
    const xf = window.S && window.S._xfade;
    if (xfadeKey && xf && xf[xfadeKey] !== undefined) return clamp01(xf[xfadeKey]);
    return window.S && window.S[key] ? 1 : 0;
}

function formatToggleState(key) {
    const alpha = visibilityAlphaForKey(key);
    if (alpha > 0.001 && alpha < 0.999) return Math.round(alpha * 100) + '%';
    return alpha >= 0.5 ? 'ON' : 'OFF';
}

function clearVisibilityXfadeForKey(key) {
    const xfadeKey = VISIBILITY_XFADE_KEYS[key];
    if (!xfadeKey || !window.S || !window.S._xfade) return;
    delete window.S._xfade[xfadeKey];
    if (!Object.keys(window.S._xfade).some(k => window.S._xfade[k] !== undefined)) {
        delete window.S._xfade;
    }
}

// Animate a visibility toggle (showParticles / showRibbons / tessRibbons)
// between its current rendered alpha and a target alpha, instead of hard-
// snapping mesh visibility. Used by the layer toggles (Quanta / Strings /
// Lattice) so turning them on or off feels like a fade rather than a pop.
//
// Implementation: writes window.S._xfade[<xfadeKey>] each frame, which the
// engine reads as the authoritative material opacity. When the fade reaches
// the target it clears the xfade entry, restoring the cheap hard-state read
// path (the engine falls back to window.S[stateKey] when no xfade is set).
//
// Self-cancelling: each call cancels any in-flight fade for the same key
// and resumes from the current alpha — rapid toggling can't desync the
// animation against the underlying boolean state.
function fadeVisibilityKey(stateKey, fromAlpha, toAlpha, duration = 300) {
    const xfadeKey = VISIBILITY_XFADE_KEYS[stateKey];
    if (!xfadeKey) return;

    window._xfadeTimers = window._xfadeTimers || {};
    if (window._xfadeTimers[xfadeKey]) {
        cancelAnimationFrame(window._xfadeTimers[xfadeKey]);
        window._xfadeTimers[xfadeKey] = null;
    }

    // If the current xfade has a value, pick up from there instead of the
    // caller-provided fromAlpha. This makes rapid mid-fade reversals smooth.
    const xfNow = window.S && window.S._xfade && window.S._xfade[xfadeKey];
    const actualFrom = (xfNow !== undefined) ? xfNow : fromAlpha;

    if (!window.S._xfade) window.S._xfade = {};
    window.S._xfade[xfadeKey] = actualFrom;

    const start = performance.now();
    const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t); // smoothstep
        if (!window.S._xfade) window.S._xfade = {}; // restore if something cleared it mid-fade
        window.S._xfade[xfadeKey] = actualFrom + (toAlpha - actualFrom) * eased;
        if (t < 1) {
            window._xfadeTimers[xfadeKey] = requestAnimationFrame(tick);
        } else {
            window._xfadeTimers[xfadeKey] = null;
            // Land on the exact target, then clear so engine reverts to
            // reading the boolean state directly (avoids stale xfade values
            // pinning visibility — the original Quanta bug class).
            window.S._xfade[xfadeKey] = toAlpha;
            clearVisibilityXfadeForKey(stateKey);
        }
    };
    window._xfadeTimers[xfadeKey] = requestAnimationFrame(tick);
}

// Animate a color-mode change with a V-envelope opacity dip. Unlike layer
// toggles (Quanta/Strings/Lattice) which fade between alpha 0↔1, colorMode
// is a discrete mode flip — there's no "fractional mode" the shader can
// render. The trick (lifted from the tour-transition machinery) is to fade
// EVERYTHING visible to ~0, swap the discrete mode at the trough, and fade
// back to full. Visually it reads as a smooth crossfade.
//
// Implementation deliberately uses a SEPARATE channel (window.S._xfadeEnv)
// rather than mutating _xfade.{particles,ribbons,lattice} directly. Reasons:
//   1. If a user toggled a layer off just before changing colorMode, that
//      layer fade is in-flight via _xfade. Clobbering _xfade would kill it.
//      The envelope multiplies onto whatever the layer fade is doing.
//   2. At fade completion we clear ONLY _xfadeEnv, never touching _xfade —
//      so the layer fades' own cleanup paths stay authoritative.
//   3. Engine read becomes: alpha = (xfade_layer ?? bool) * (xfadeEnv ?? 1).
//
// Self-cancelling: a second colorMode change mid-envelope cancels the prior
// timer. If the new target equals the prior target, we exit immediately
// (covers double-clicks on the same mode button). Otherwise we restart the
// envelope from the current envelope value, so the dip is continuous.
function fadeColorModeChange(toMode, duration = 600) {
    if (window.S.colorMode === toMode) return; // already there
    if (window._xfadeColorModeTarget === toMode && window._xfadeColorModeTimer) {
        return; // same fade already running
    }

    if (window._xfadeColorModeTimer) {
        cancelAnimationFrame(window._xfadeColorModeTimer);
        window._xfadeColorModeTimer = null;
    }
    window._xfadeColorModeTarget = toMode;

    // Same-target guard at function entry already prevents re-running an
    // identical fade. For DIFFERENT-target rapid clicks the prior timer is
    // cancelled and a fresh V-envelope runs from t=0 — there can be a small
    // visual hitch as opacity jumps from the dipped value back to 1, but
    // since the user is actively re-choosing a mode that hitch reads as
    // responsiveness rather than a bug.
    const start = performance.now();
    let flipped = false;

    const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        // V-envelope: ^0.7 widens the dip so it reads as a smooth dip rather
        // than a knife-edge cut. Same shape used by tour transitions for
        // colorMode flips, so user toggles feel consistent with tour visuals.
        const env = Math.pow(Math.abs(2 * t - 1), 0.7);
        window.S._xfadeEnv = env;

        // Discrete mode flip at the trough. Idempotent — guard prevents
        // re-flipping if the envelope re-crosses 0.5 due to numerical jitter.
        if (!flipped && t >= 0.5) {
            window.S.colorMode = toMode;
            if (window.engine) window.engine.updateUniforms();
            if (window.refreshRadialUI) window.refreshRadialUI();
            flipped = true;
        }

        if (t < 1) {
            window._xfadeColorModeTimer = requestAnimationFrame(tick);
        } else {
            window._xfadeColorModeTimer = null;
            window._xfadeColorModeTarget = null;
            delete window.S._xfadeEnv;
            // Safety net: if for any reason we never crossed the midpoint
            // (e.g. duration was very short and rAF resolution missed t=0.5),
            // ensure the mode actually got set.
            if (!flipped) {
                window.S.colorMode = toMode;
                if (window.engine) window.engine.updateUniforms();
                if (window.refreshRadialUI) window.refreshRadialUI();
            }
            try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}
        }
    };
    window._xfadeColorModeTimer = requestAnimationFrame(tick);
}

function captureParamState() {
    const params = {};
    PARAM_KEYS.forEach(k => {
        if (window.S[k] !== undefined) params[k] = window.S[k];
    });
    return params;
}

function captureModState() {
    const mods = {};
    MOD_KEYS.forEach(k => {
        if (window.S[k] !== undefined) mods[k] = window.S[k];
    });
    return mods;
}

function buildTargetParams(toP = {}, toV = {}) {
    const params = {};
    PARAM_KEYS.forEach(k => {
        if (toP && toP[k] !== undefined) params[k] = toP[k];
        else if (toV && toV[k] !== undefined) params[k] = toV[k];
    });
    return params;
}

function buildTargetMods(toV = {}) {
    const mods = {};
    const savedMods = toV && toV.mods ? toV.mods : {};
    MOD_KEYS.forEach(k => {
        mods[k] = savedMods[k] !== undefined ? savedMods[k] : 0;
    });
    return mods;
}

function syncTransitionUI(keys = []) {
    keys.forEach(k => {
        if (window.sliderSync && window.sliderSync[k]) window.sliderSync[k](window.S[k]);
    });
    if (window.syncTogglesFromState) window.syncTogglesFromState();
    if (window.refreshRadialUI) window.refreshRadialUI();
}

function applyTransitionSideEffects(keys = []) {
    if (keys.includes('bgBlur')) {
        const bgCanvas = document.getElementById('bgGlow');
        if (bgCanvas) bgCanvas.style.filter = 'blur(' + (window.S.bgBlur ?? 40) + 'px)';
    }
}

export function saveWP() {
    try {
        localStorage.setItem('ss_waypoints', JSON.stringify({ waypoints: window.waypoints }));
    } catch (e) { console.error('Failed to save waypoints', e); }
}

// Paint the app's background onto an arbitrary 2D canvas context, sized to
// fill the rectangle (0,0)..(w,h). Used by both the full-res screenshot
// path and the thumbnail capture paths so all three produce visually
// consistent results when "Include Background" is on.
//
// The background the user sees on-screen is two layers:
//   1. A solid void color (#040410) — body background
//   2. A CSS radial gradient on the #bgGlow DIV
//
// The bgGlow DIV is NOT a canvas — drawImage(bgGlowDiv, ...) is a silent
// no-op which is the bug we used to ship. We reconstruct the CSS gradient
// here using the same colorMode/hue/sat math the engine uses in
// updateUniforms() to set the DIV's background-image.
function paintBackgroundLayer(ctx, w, h) {
    ctx.fillStyle = '#040410';
    ctx.fillRect(0, 0, w, h);

    const S = window.S;
    const bgGlowAmt = S.bgGlow ?? 0.3;
    if (bgGlowAmt <= 0.001) return;

    const mode = S.colorMode || 0;
    const hRaw = S.hue ?? 0.5;
    const sVal = Math.round((S.sat ?? 0.8) * 100);
    const h360 = Math.round(hRaw * 360);
    const hsl = (hh, ll) => `hsl(${hh}, ${sVal}%, ${ll}%)`;

    // Radial gradient anchored at center, extending to the canvas diagonal
    // so the glow reaches all corners (matches the CSS "ellipse at center
    // / sized to viewport" geometry).
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.sqrt(cx * cx + cy * cy);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

    if (mode === 0) {
        const h2 = (h360 + 20) % 360;
        grad.addColorStop(0,    hsl(h360, 16));
        grad.addColorStop(0.5,  hsl(h2, 8));
        grad.addColorStop(0.8,  'rgba(0,0,0,0)');
    } else if (mode === 1) {
        const h2 = (h360 + 15) % 360;
        const h3 = (h360 + 30) % 360;
        grad.addColorStop(0,    hsl(h2, 18));
        grad.addColorStop(0.45, hsl(h3, 10));
        grad.addColorStop(0.7,  hsl(h360, 5));
        grad.addColorStop(0.9,  'rgba(0,0,0,0)');
    } else if (mode === 2) {
        const hLow  = (h360 - 20 + 360) % 360;
        const hHigh = (h360 + 20) % 360;
        grad.addColorStop(0,    hsl(hHigh, 18));
        grad.addColorStop(0.35, hsl(h360, 9));
        grad.addColorStop(0.75, hsl(hLow, 4));
        grad.addColorStop(0.9,  'rgba(0,0,0,0)');
    } else {
        const hCore = (h360 + 30) % 360;
        grad.addColorStop(0,    hsl(hCore, 22));
        grad.addColorStop(0.3,  hsl(h360, 12));
        grad.addColorStop(0.6,  hsl(h360, 5));
        grad.addColorStop(0.85, 'rgba(0,0,0,0)');
    }
    // CSS opacity comes from `Math.min(1, bgGlow * 1.5)` per the engine's
    // updateUniforms; mirror that here so the gradient strength in
    // captured images matches what the user sees.
    ctx.globalAlpha = Math.min(1, bgGlowAmt * 1.5);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
}

// Save a high-resolution PNG screenshot of the current canvas state to the
// user's download folder. Filename includes a coordinate hash + local-time
// stamp so collisions are essentially impossible and users can sort by date.
// Honors window.S.includeScreenshotBg for whether to fill the void color.
// Used by both captureWaypoint (new) and captureThumbnailFor (recapture) so
// "save screenshot on capture" applies consistently to both actions —
// recapturing a thumbnail also doubles as a screenshot when that toggle is
// on, matching user expectation that any "shutter press" produces a file.
function downloadFullResScreenshot(engine) {
    try {
        const canvas = engine.canvas;
        const full = document.createElement('canvas');
        full.width = canvas.width;
        full.height = canvas.height;
        const fctx = full.getContext('2d');
        if (window.S.includeScreenshotBg) {
            paintBackgroundLayer(fctx, full.width, full.height);
        }
        fctx.drawImage(canvas, 0, 0, full.width, full.height);
        // Bake the CRT scanline overlay into the screenshot if the user opted
        // in. Mirrors the body::after CSS pseudo-element: 2px-tall repeating
        // pattern where every other row is filled with the theme-appropriate
        // tint, alpha = screenScanlines (0..0.5). Without this, screenshots
        // would look "cleaner" than the live view and lose the CRT character
        // that's a signature of the visual identity.
        if (window.S.includeScreenshotScanlines) {
            const alpha = Math.max(0, Math.min(0.5, window.S.screenScanlines ?? 0));
            if (alpha > 0.001) {
                const isSynth = (window.S.theme || 'synthesist') === 'synthesist';
                const tint = isSynth ? '255,200,130' : '220,230,255';
                fctx.save();
                fctx.globalAlpha = alpha;
                fctx.fillStyle = `rgb(${tint})`;
                for (let y = 0; y < full.height; y += 2) {
                    fctx.fillRect(0, y, full.width, 1);
                }
                fctx.restore();
            }
        }
        const url = full.toDataURL('image/png');
        const cid_preview = coordHash({ ...PARAM_KEYS.reduce((acc, k) => { acc[k] = window.S[k]; return acc; }, {}) });
        const dt = new Date();
        // Local-time stamp so filenames match the user's actual clock
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()) +
                      'T' + pad(dt.getHours()) + '-' + pad(dt.getMinutes()) + '-' + pad(dt.getSeconds());
        const a = document.createElement('a');
        a.href = url;
        a.download = `scalespace_${cid_preview}_${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        console.warn('[capture] screenshot save failed:', err);
    }
}

export async function captureWaypoint() {
    const engine = window.engine;
    if (!engine) { console.error('[ATLAS] No engine found'); return; }

    const canvas = engine.canvas;
    // bgCanvas is no longer touched here — the background, if requested,
    // is reconstructed via paintBackgroundLayer below since the bgGlow DIV
    // can't be drawImage'd.

    if (engine.render) await engine.render();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    
    const aspect = canvas.width / canvas.height;
    const tw = 240, th = Math.round(tw / aspect);
    const tc = document.createElement('canvas');
    tc.width = tw; tc.height = th;
    const ctx = tc.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Honor the Include → Background toggle on the initial capture, same
    // as the recapture path does. Previously this used drawImage(bgCanvas)
    // unconditionally, which was a silent no-op because bgCanvas is a DIV
    // with a CSS gradient, not an actual canvas. Result: the background
    // never made it into the thumbnail regardless of the toggle. Fixed by
    // routing through paintBackgroundLayer when the toggle is on.
    if (window.S.includeScreenshotBg) {
        paintBackgroundLayer(ctx, tw, th);
    }
    ctx.drawImage(canvas, 0, 0, tw, th);

    const thumb = tc.toDataURL('image/png');

    if (window.S.saveOnNewWaypoint) downloadFullResScreenshot(engine);

    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    const params = captureParamState();
    const mods = captureModState();
    
    const visuals = {
        colorMode: window.S.colorMode,
        hue: window.S.hue,
        sat: window.S.sat,
        lightness: window.S.lightness,
        opacity: window.S.opacity,
        tempo: window.S.tempo,
        trailLen: window.S.trailLen,
        bgGlow: window.S.bgGlow,
        bgBlur: window.S.bgBlur,
        offsetX: window.S.offsetX,
        offsetY: window.S.offsetY,
        offsetZ: window.S.offsetZ,
        billboardOffset: window.S.billboardOffset,
        showParticles: window.S.showParticles !== false,
        showRibbons:   !!window.S.showRibbons,
        tessRibbons:   !!window.S.tessRibbons,
        shape:         window.S.shape || 'circle',
        mods: mods
    };

    const cid = coordHash(params);
    const d = new Date();
    const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    const wp = {
        id: 'wp_' + Date.now(),
        coordId: cid,
        name: cid + ' — ' + dStr,
        notes: '',
        category: window.S.lastWpCat || 'Waypoints',
        params,
        visuals,
        camDist: engine.cam.dist,
        camQuatArr: engine.cam.quat.toArray(),
        camPosArr: engine.cam.pos.toArray(),
        timestamp: Date.now(),
        thumbnail: thumb,
        thumbAspect: aspect
    };

    window.waypoints.unshift(wp);
    saveWP();
    window.atlasView = wp.id;
    if (window.buildAtlasUI) window.buildAtlasUI(engine);
}

// Capture only a thumbnail for an EXISTING waypoint. Used when the user
// imports a waypoint via share-string (no thumbnail) then navigates and
// hits "Capture Thumbnail" — gives them the chance to frame the shot
// themselves rather than us auto-traveling and snapping a generic view.
//
// Guard: only captures if current parameters match the waypoint's stored
// params. This prevents the user from accidentally pinning a thumbnail of
// some unrelated simulation state onto a waypoint, which would silently
// corrupt the atlas. Camera position is NOT checked — the user might be
// circling the location to set up a tour-stop framing angle.
export function isAtWaypointParams(wp, tolerance = 0.001) {
    if (!wp || !wp.params) return false;
    for (const k of PARAM_KEYS) {
        if (wp.params[k] === undefined) continue;
        const cur = window.S[k];
        const tgt = wp.params[k];
        if (typeof cur !== 'number' || typeof tgt !== 'number') {
            if (cur !== tgt) return false;
            continue;
        }
        // Relative tolerance — handles float-precision roundtripping through
        // JSON/localStorage. Absolute fallback for values near zero.
        const diff = Math.abs(cur - tgt);
        const scale = Math.max(Math.abs(cur), Math.abs(tgt), 1);
        if (diff / scale > tolerance) return false;
    }
    return true;
}
window.isAtWaypointParams = isAtWaypointParams;

// Returns the id of the waypoint whose stored params match the current
// state, or null if the user isn't "at" any saved location. Used to:
//   • highlight the current row in the atlas list
//   • start sequential tours from the user's current location
//   • show a "you are here" indicator
// First match wins — if multiple waypoints share the same coordinates,
// we pick the topmost in the list (the user's drag-reorder preference).
export function getCurrentWaypointId() {
    const wps = window.waypoints;
    if (!wps || !wps.length) return null;
    for (const wp of wps) {
        if (isAtWaypointParams(wp)) return wp.id;
    }
    return null;
}
window.getCurrentWaypointId = getCurrentWaypointId;

export async function captureThumbnailFor(wpId) {
    const wp = window.waypoints && window.waypoints.find(w => w.id === wpId);
    if (!wp) return;
    // Hard guard: refuse to capture if we're not actually at this waypoint's
    // parameter coordinates. Without this check, the captured thumbnail would
    // misrepresent what's stored in the waypoint — a UX disaster because the
    // atlas would lie about its own contents.
    if (!isAtWaypointParams(wp)) {
        if (window.showToast) window.showToast('Travel to this waypoint first', { color: '#ff9a40' });
        return;
    }
    const engine = window.engine;
    if (!engine) return;

    const canvas = engine.canvas;
    // bgCanvas removed — see captureWaypoint above for rationale.
    if (engine.render) await engine.render();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const aspect = canvas.width / canvas.height;
    const tw = 240, th = Math.round(tw / aspect);
    const tc = document.createElement('canvas');
    tc.width = tw; tc.height = th;
    const ctx = tc.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Background: only paint when the user opted in. Previously both
    // branches of an if/else here called drawImage(bgCanvas) which was a
    // silent no-op (bgCanvas is the bgGlow DIV, not a canvas) — meaning
    // the toggle had no effect on recaptures either. Route through the
    // shared helper so this path stays consistent with the initial-capture
    // and full-res screenshot paths.
    if (window.S.includeScreenshotBg) {
        paintBackgroundLayer(ctx, tw, th);
    }
    ctx.drawImage(canvas, 0, 0, tw, th);
    wp.thumbnail = tc.toDataURL('image/png');
    wp.thumbAspect = aspect;
    saveWP();

    // Mirror captureWaypoint but on the thumbnail-specific toggle: the user
    // gets a screenshot for recaptures only if "Save On New Thumbnail" is on.
    // Lets people opt into one-or-both flows without conflating them.
    if (window.S.saveOnNewThumbnail) downloadFullResScreenshot(engine);

    // Reuse the same flash effect as a full waypoint capture, since the
    // user pressed the same conceptual "snapshot" button.
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    if (window.buildAtlasUI) window.buildAtlasUI(engine);
}
window.captureThumbnailFor = captureThumbnailFor;

export function travelTo(wp) {
    if (!wp) return;
    const dur = window.tour && window.tour.active ? 5000 + Math.random() * 3000 : 5000;
    startTransition(wp.params, wp.camDist, wp.camQuatArr, wp.visuals, wp.camPosArr, dur);
    // Tag the in-flight transition with the destination waypoint id so the
    // atlas can highlight "we're going here" immediately, rather than waiting
    // for params to match (which only happens after the transition completes
    // and would leave the highlight stuck on the source waypoint or nothing).
    // This mirrors how tour mode uses tour.wpIdx for live highlight tracking.
    if (window.transition) window.transition.targetWpId = wp.id;
    if (window.buildAtlasUI && window.engine) window.buildAtlasUI(window.engine);
}

// Homepoint: a single "favorite spot" saved in window.S.homepoint. Functions
// like a sticky waypoint without taking up space in the atlas list. The
// Home key and the bottom-of-Params "Homepoint" button both travel back to
// it; the green +Homepoint button in the Params panel head saves the
// current state as the new homepoint. Stored in window.S so it persists
// across sessions via the ss_state localStorage flow.
export function captureHomepoint() {
    const engine = window.engine;
    if (!engine) return;
    window.S.homepoint = {
        // Tag with synthetic id so travelTo's atlas-highlight pathway treats
        // it like any other destination (no-op for the atlas list, but
        // matches the contract travelTo expects).
        id: 'homepoint',
        params: captureParamState(),
        visuals: {
            colorMode: window.S.colorMode,
            hue: window.S.hue, sat: window.S.sat, lightness: window.S.lightness,
            opacity: window.S.opacity, tempo: window.S.tempo,
            trailLen: window.S.trailLen, bgGlow: window.S.bgGlow, bgBlur: window.S.bgBlur,
            offsetX: window.S.offsetX, offsetY: window.S.offsetY, offsetZ: window.S.offsetZ,
            billboardOffset: window.S.billboardOffset,
            showParticles: window.S.showParticles !== false,
            showRibbons:   !!window.S.showRibbons,
            tessRibbons:   !!window.S.tessRibbons,
            shape:         window.S.shape || 'circle',
            mods: captureModState()
        },
        camDist:    engine.cam.dist,
        camQuatArr: engine.cam.quat.toArray(),
        camPosArr:  engine.cam.pos.toArray(),
        timestamp:  Date.now()
    };
    try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}

    // Clear the "needs homepoint" hint flag and rebuild Params so the +Homepoint
    // and Homepoint glow animations stop. Build is cheap (panel rebuild is fast).
    window._needsHomepointHint = false;
    if (window.buildUI && window.engine) window.buildUI(window.engine);

    // Same shutter flash as waypoint capture so users feel the action took.
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    if (window.showToast) window.showToast('Homepoint updated', { color: '#6aaa7a' });
}
window.captureHomepoint = captureHomepoint;

export function travelToHomepoint() {
    const hp = window.S.homepoint;
    if (!hp) {
        if (window.showToast) window.showToast('No homepoint set — press +Homepoint to save one', { color: '#ff9a40' });
        return;
    }
    if (window.tour && window.tour.active) stopTour();
    travelTo(hp);
}
window.travelToHomepoint = travelToHomepoint;

export function startTour() {
    if (!window.waypoints || window.waypoints.length === 0) return;
    tour.active = true;
    tour.rotSpeed = 0.0005;
    // In sequential mode, if the user's live params match a saved waypoint,
    // start the tour from there (the next stop is the one after current).
    // Random mode picks any-but-current, so this hint isn't useful there.
    tour.wpIdx = -1;
    if (tour.mode === 'sequential' || tour.mode === undefined) {
        const curId = (typeof getCurrentWaypointId === 'function') ? getCurrentWaypointId() : null;
        if (curId) {
            const curIdx = window.waypoints.findIndex(w => w.id === curId);
            if (curIdx >= 0) tour.wpIdx = curIdx;
        }
    }
    if (window.refreshRadialUI) window.refreshRadialUI();
    nextTourStop();
}

export function stopTour() {
    if (!tour.active) return;
    tour.active = false;
    window.transition = null;
    // Clear any in-flight visibility crossfade. Without this, _xfade
    // outlives window.transition and gets read as authoritative by the
    // engine on subsequent frames — pinning particles visible regardless
    // of the Quanta toggle. _xfade and window.transition are coupled
    // state and should always be torn down together.
    delete window.S._xfade;
    // Same reasoning for the color-mode envelope channel — cancel any
    // in-flight envelope timer and clear the multiplier so layers don't
    // get pinned at reduced opacity by a stale envelope value.
    if (window._xfadeColorModeTimer) {
        cancelAnimationFrame(window._xfadeColorModeTimer);
        window._xfadeColorModeTimer = null;
        window._xfadeColorModeTarget = null;
    }
    delete window.S._xfadeEnv;
    if (window._nextTourTimeout) clearTimeout(window._nextTourTimeout);
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(10,10,24,0.8);border:1px solid #dd9933;color:#dd9933;padding:8px 16px;border-radius:4px;font-size:12px;font-weight:bold;z-index:100;pointer-events:none;animation:fadeN 2s forwards';
    d.textContent = 'TOUR PAUSED';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2000);
    if (window.buildAtlasUI) window.buildAtlasUI(window.engine);
    syncTransitionUI(['showParticles', 'showRibbons', 'tessRibbons']);
}

export function nextTourStop() {
    if (!tour.active || !window.waypoints || window.waypoints.length === 0) return;
    if (tour.mode === 'random' && window.waypoints.length > 1) {
        let nextIdx = tour.wpIdx;
        while (nextIdx === tour.wpIdx) {
            nextIdx = Math.floor(Math.random() * window.waypoints.length);
        }
        tour.wpIdx = nextIdx;
    } else {
        tour.wpIdx = (tour.wpIdx + 1) % window.waypoints.length;
    }
    if (window.buildAtlasUI) window.buildAtlasUI(window.engine);
    // Follow the active waypoint in the atlas list. Without this, random-mode
    // tours feel disorienting because the highlighted row can be off-screen
    // entirely; sequential tours also benefit when the list is long enough
    // to scroll. We scroll AFTER buildAtlasUI repaints (next frame) so the
    // .is-tour-active class is on the new row before we measure it. Uses
    // 'nearest' block alignment so we only scroll when actually necessary —
    // if the row is already visible, no jitter.
    requestAnimationFrame(() => {
        const activeRow = document.querySelector('#atlasBody .wp-row-card.is-tour-active');
        if (activeRow && typeof activeRow.scrollIntoView === 'function') {
            try {
                activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            } catch (e) {
                // Some browsers reject options object; fall back to boolean form.
                activeRow.scrollIntoView(false);
            }
        }
    });
    travelTo(window.waypoints[tour.wpIdx]);
}

export function deleteWP(id) {
    if (!window.waypoints) return;
    window.waypoints = window.waypoints.filter(w => w.id !== id);
    saveWP();
    window.atlasView = 'list';
    if (window.buildAtlasUI) window.buildAtlasUI(window.engine);
}

export function showDelModal(id, name) {
    // Build via DOM construction rather than innerHTML so the waypoint name
    // can't break out of its container. Names can come from imported save
    // files / share strings, so they're untrusted at this layer.
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const p = document.createElement('p');
    p.appendChild(document.createTextNode('Delete waypoint'));
    p.appendChild(document.createElement('br'));
    const nameSpan = document.createElement('span');
    nameSpan.style.color = '#8ab8e8';
    nameSpan.textContent = '"' + sanitizeName(name, { maxLen: 200 }) + '"';
    p.appendChild(nameSpan);
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createTextNode('This cannot be undone.'));
    box.appendChild(p);

    const btnRow = document.createElement('div');
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn';
    cancelBtn.style.cssText = 'border-color:#6a7a8a;color:#99aabb';
    cancelBtn.textContent = 'Cancel';
    btnRow.appendChild(cancelBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'modal-btn';
    delBtn.style.cssText = 'border-color:#cc6666;color:#cc6666;background:rgba(30,10,10,0.5)';
    delBtn.textContent = 'Delete';
    btnRow.appendChild(delBtn);

    box.appendChild(btnRow);
    ov.appendChild(box);
    document.body.appendChild(ov);

    cancelBtn.addEventListener('click', () => ov.remove());
    delBtn.addEventListener('click', () => { ov.remove(); deleteWP(id); });
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

function startTransition(toP, toD, toQArr, toV, toPArr, dur = 5000) {
    const engine = window.engine;
    if (!engine) return;

    const targetParams = buildTargetParams(toP, toV);
    const targetMods = buildTargetMods(toV);

    const from = {
        params: {},
        mods: {},
        camDist: engine.cam.dist,
        camQuat: engine.cam.quat.clone(),
        camPos: engine.cam.pos.clone(),
        visuals: {
            opacity: window.S.opacity,
            tempo: window.S.tempo,
            offsetX: window.S.offsetX || 0,
            offsetY: window.S.offsetY || 0,
            offsetZ: window.S.offsetZ || 0,
            billboardOffset: window.S.billboardOffset || 0,
            hue: window.S.hue || 0.5,
            sat: window.S.sat ?? 0.8,
            lightness: window.S.lightness ?? 0.9,
            trailLen: window.S.trailLen ?? 10,
            bgGlow: window.S.bgGlow ?? 0.3,
            bgBlur: window.S.bgBlur ?? 40,
            showParticles: window.S.showParticles !== false,
            showRibbons:   !!window.S.showRibbons,
            tessRibbons:   !!window.S.tessRibbons,
            shape:         window.S.shape || 'circle',
            colorMode:     window.S.colorMode ?? 0
        }
    };
    PARAM_KEYS.forEach(k => from.params[k] = window.S[k]);
    MOD_KEYS.forEach(k => from.mods[k] = window.S[k] || 0);

    const toQ = new THREE.Quaternion();
    if (Array.isArray(toQArr) && toQArr.length === 4) toQ.fromArray(toQArr);
    else toQ.copy(engine.cam.quat);
    if (from.camQuat.dot(toQ) < 0) toQ.set(-toQ.x, -toQ.y, -toQ.z, -toQ.w);
    const toPos = new THREE.Vector3();
    if (Array.isArray(toPArr) && toPArr.length === 3) toPos.fromArray(toPArr);
    else toPos.copy(engine.cam.pos);

    const fromFlags = {
        showParticles: window.S.showParticles !== false,
        showRibbons:   !!window.S.showRibbons,
        tessRibbons:   !!window.S.tessRibbons,
        shape:         window.S.shape || 'circle',
        colorMode:     window.S.colorMode ?? 0
    };
    const toFlags = (toV) ? {
        showParticles: toV.showParticles !== undefined ? toV.showParticles : fromFlags.showParticles,
        showRibbons:   toV.showRibbons   !== undefined ? toV.showRibbons   : fromFlags.showRibbons,
        tessRibbons:   toV.tessRibbons   !== undefined ? toV.tessRibbons   : fromFlags.tessRibbons,
        shape:         toV.shape         !== undefined ? toV.shape         : fromFlags.shape,
        colorMode:     toV.colorMode     !== undefined ? toV.colorMode     : fromFlags.colorMode
    } : { ...fromFlags };

    const fromVisibility = {
        particles: visibilityAlphaForKey('showParticles'),
        ribbons: visibilityAlphaForKey('showRibbons'),
        lattice: visibilityAlphaForKey('tessRibbons')
    };
    const toVisibility = {
        particles: toFlags.showParticles ? 1 : 0,
        ribbons: toFlags.showRibbons ? 1 : 0,
        lattice: toFlags.tessRibbons ? 1 : 0
    };

    // All three layers participate in the cross-fade. We keep meshes alive
    // through the transition by setting showXxx true if EITHER end wants
    // visibility — _xfade is read as authoritative material.opacity by the
    // engine, so the boolean just needs to be "render this mesh at all" for
    // the duration. At transition end, the toFlags values are restored (see
    // updateTransition's t>=1 branch). Previously only particles xfaded;
    // strings/lattice hard-snapped at midpoint, which felt jarring when
    // toggling between waypoints with different layer compositions.
    window.S.showParticles = fromVisibility.particles > 0.001 || toVisibility.particles > 0.001;
    window.S.showRibbons   = fromVisibility.ribbons   > 0.001 || toVisibility.ribbons   > 0.001;
    window.S.tessRibbons   = fromVisibility.lattice   > 0.001 || toVisibility.lattice   > 0.001;
    window.S._xfade = {
        particles: fromVisibility.particles,
        ribbons:   fromVisibility.ribbons,
        lattice:   fromVisibility.lattice
    };
    window.S._shapeFlipped = false;

    syncTransitionUI(['showParticles', 'showRibbons', 'tessRibbons']);

    window.transition = {
        from,
        fromFlags,
        fromVisibility,
        toFlags,
        toVisibility,
        to: {
            params: targetParams,
            mods: targetMods,
            camDist: toD !== undefined ? toD : engine.cam.dist,
            camQuat: toQ,
            camPos: toPos,
            visuals: toV
        },
        startTime: performance.now(),
        duration: dur
    };
}

export function updateTransition() {
    if (!window.transition) return;
    const t = Math.min(1, (performance.now() - window.transition.startTime) / window.transition.duration);
    const ease = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const from = window.transition.from, to = window.transition.to;

    PARAM_KEYS.forEach(k => {
        if (to.params[k] !== undefined) {
          window.S[k] = from.params[k] + (to.params[k] - from.params[k]) * ease;
          if (window.sliderSync && window.sliderSync[k]) window.sliderSync[k](window.S[k]);
        }
    });
    applyTransitionSideEffects(PARAM_KEYS);

	// ─── Modulation values ──────────────────────────────────────────────────
    MOD_KEYS.forEach(k => {
        if (to.mods[k] !== undefined) {
            const fromVal = from.mods[k] || 0;
            const toVal = to.mods[k] || 0;
            window.S[k] = fromVal + (toVal - fromVal) * ease;
        }
    });

	// ─── Camera ─────────────────────────────────────────────────────────────
    const engine = window.engine;
    if (engine) {
        engine.cam.dist = from.camDist + (to.camDist - from.camDist) * ease;
        engine.cam.distTarget = engine.cam.dist;
        engine.cam.quat.copy(from.camQuat).slerp(to.camQuat, ease);
        engine.cam.pos.lerpVectors(from.camPos, to.camPos, ease);
        const euler = new THREE.Euler().setFromQuaternion(engine.cam.quat, 'YXZ');
        engine.cam.pitch = euler.x;
        engine.cam.yaw = euler.y;
    }

	// ─── Layer Crossfade ────────────────────────────────────────────────────
    const fromFlags = window.transition.fromFlags || {};
    const toFlags   = window.transition.toFlags   || {};
    const fromVisibility = window.transition.fromVisibility || {
        particles: fromFlags.showParticles ? 1 : 0
    };
    const toVisibility = window.transition.toVisibility || {
        particles: toFlags.showParticles ? 1 : 0
    };
    const xfade = (fromVal, toVal) => fromVal + (toVal - fromVal) * ease;
    let particleOpacity = clamp01(xfade(fromVisibility.particles, toVisibility.particles));
    let ribbonsOpacity  = clamp01(xfade(fromVisibility.ribbons,   toVisibility.ribbons));
    let latticeOpacity  = clamp01(xfade(fromVisibility.lattice,   toVisibility.lattice));

    // Color-mode opacity-illusion crossfade. The discrete colorMode flip at
    // t=0.5 looks jarring when modes differ wildly (Spectral neon vs. Velocity
    // muted, etc.). Multiply the existing crossfade by a V-shaped envelope so
    // particles dip to ~0 right at the flip, then return — the user perceives
    // a clean crossfade rather than a hard cut. Linear color-space interpolation
    // would be cleaner in theory but is too complex for the discrete-mode
    // shader pipeline; this opacity trick achieves the same UX outcome.
    // Applied to ribbons/lattice too since they also re-color by mode.
    const fromCM = (fromFlags && fromFlags.colorMode);
    const toCM   = (toFlags   && toFlags.colorMode);
    if (fromCM !== undefined && toCM !== undefined && fromCM !== toCM) {
        // Pow < 1 widens the dip; ^0.7 gives a perceptually balanced V with
        // ~30% width at half-opacity. Pure |2t-1| would be too sharp.
        const env = Math.pow(Math.abs(2 * t - 1), 0.7);
        particleOpacity *= env;
        ribbonsOpacity  *= env;
        latticeOpacity  *= env;
    }

    window.S._xfade = {
        particles: particleOpacity,
        ribbons:   ribbonsOpacity,
        lattice:   latticeOpacity
    };
    // Keep meshes "logically on" while their alpha is fading; toFlags values
    // get restored at t>=1. Falling to false mid-fade would cull the mesh
    // and break the visual transition.
    window.S.showParticles = particleOpacity > 0.001 || !!toFlags.showParticles;
    window.S.showRibbons   = ribbonsOpacity  > 0.001 || !!toFlags.showRibbons;
    window.S.tessRibbons   = latticeOpacity  > 0.001 || !!toFlags.tessRibbons;
    syncTransitionUI(['showParticles', 'showRibbons', 'tessRibbons']);

    // Discrete visuals switch at midpoint.
    if (!window.transition._discreteFlipped && t >= 0.5) {
        if (toFlags.shape && toFlags.shape !== window.S.shape) {
            window.S.shape = toFlags.shape;
            if (window.sliderSync && window.sliderSync.shape) window.sliderSync.shape(window.S.shape);
        }
        if (toFlags.colorMode !== undefined && toFlags.colorMode !== window.S.colorMode) {
            window.S.colorMode = toFlags.colorMode;
        }
        window.transition._discreteFlipped = true;
        syncTransitionUI(['shape', 'colorMode']);
    }

    if (t >= 1) {
        PARAM_KEYS.forEach(k => {
            if (to.params[k] !== undefined) {
                window.S[k] = to.params[k];
                if (window.sliderSync && window.sliderSync[k]) window.sliderSync[k](window.S[k]);
            }
        });
        MOD_KEYS.forEach(k => {
            if (to.mods[k] !== undefined) window.S[k] = to.mods[k];
        });
        if (toFlags) {
            window.S.showParticles = toFlags.showParticles;
            window.S.showRibbons   = toFlags.showRibbons;
            window.S.tessRibbons   = toFlags.tessRibbons;
            if (toFlags.shape !== undefined) window.S.shape = toFlags.shape;
            if (toFlags.colorMode !== undefined) window.S.colorMode = toFlags.colorMode;
        }
        delete window.S._xfade;
        window.transition = null;
        syncTransitionUI([...PARAM_KEYS, 'showParticles', 'showRibbons', 'tessRibbons', 'shape', 'colorMode']);
        applyTransitionSideEffects(PARAM_KEYS);
        // Atlas highlight resolution: during the transition the targetWpId
        // drove the highlight; now that transition is null, the atlas needs
        // to re-evaluate against isAtWaypointParams. Rebuild so the row
        // settles on the destination waypoint (which it now matches).
        if (window.buildAtlasUI && window.engine) window.buildAtlasUI(window.engine);
        try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}
        if (tour.active) {
            if (window._nextTourTimeout) clearTimeout(window._nextTourTimeout);
            window._nextTourTimeout = setTimeout(nextTourStop, 500);
        }
    }
}

function getCategories() {
    const c = new Set(['Waypoints']);
    window.waypoints.forEach(w => { if (w.category) c.add(w.category); });
    return [...c].sort();
}

export function buildAtlasUI(engine) {
    const panel = document.getElementById('panelAtlas');
    if (!panel) return;
    const body = document.getElementById('atlasBody');
    if (!body) return;

    const h = panel.querySelector('.panel-head');
    if (h) {
        const hText = h.querySelector('span');
        if (hText) {
            let add = hText.querySelector('.add-wp-btn');
            if (!add) {
                add = document.createElement('span');
                add.className = 'add-wp-btn';
                add.title = 'Capture Waypoint (Ctrl+S)';
                add.textContent = '+waypoint';
                add.style.cssText = 'color:#6aaa7a;font-weight:bold;margin-left:6px;font-size:10px;text-transform:uppercase;cursor:pointer;';
                add.addEventListener('mousedown', e => e.stopPropagation());
                add.addEventListener('click', captureWaypoint);
                hText.appendChild(add);
            }
            if (window.waypoints && window.waypoints.length === 0) {
                add.style.animation = 'pulseGreen 1.5s infinite';
                add.style.color = '#88ff88';
            } else {
                add.style.animation = 'none';
                add.style.color = '#6aaa7a';
            }
        }
    }

    // Capture scroll position from the prior render so the list doesn't jump
    // to top every time we rebuild (which happens on every tour step, drag-
    // drop, capture, and many other UI events). Atlas previously used an
    // inner listContainer with its own overflow, which made the scrollbar
    // appear inset from the panel edge and crowded the Import row visually.
    // Now `body` (the .panel-body itself) is the scroll container, matching
    // every other panel — so the scrollbar sits cleanly at the panel edge.
    const prevScroll = body.scrollTop;

    body.innerHTML = '';
    // Reset any flex layout set by a previous build. We want body to behave
    // like a normal scrollable column: default block flow + native overflow.
    body.style.display = '';
    body.style.flexDirection = '';

    // listContainer is now just a logical alias for body — all subsequent
    // append calls flow into the panel-body directly. Keeping the name
    // avoids a sweeping rename of every appendChild target below.
    const listContainer = body;

    // Restore scroll position after children are populated. The actual append
    // happens below this function's flow; setting scrollTop now is fine
    // because browsers clamp to content size — if content is shorter than
    // the saved position, scrollTop just lands at max scroll.
    requestAnimationFrame(() => { body.scrollTop = prevScroll; });

    if (typeof window.atlasView === 'string' && window.atlasView !== 'list') {
        const wp = window.waypoints.find(w => w.id === window.atlasView);
        if (!wp) { window.atlasView = 'list'; buildAtlasUI(engine); return; }

        const bk = document.createElement('div');
        bk.style.cssText = 'font-size:9px;color:#8ab8e8;cursor:pointer;margin-bottom:8px;display:inline-block';
        bk.textContent = '\u25c2 Back to List';
        bk.addEventListener('click', () => { window.atlasView = 'list'; buildAtlasUI(engine); });
        listContainer.appendChild(bk);

        // Thumbnail frame — handles both states (has thumb / no thumb yet)
        // and exposes a hover-revealed Capture button so users can replace
        // imported placeholders or refresh existing thumbnails.
        const tf = document.createElement('div');
        tf.className = 'thumb-frame' + (wp.thumbnail ? '' : ' is-empty');
        tf.style.cssText = 'position:relative;width:100%;border-radius:4px;margin-bottom:8px;border:1px solid rgba(40,40,70,0.5);overflow:hidden;aspect-ratio:16/9;background:rgba(8,8,16,0.5);';

        if (wp.thumbnail) {
            const im = document.createElement('img');
            im.src = wp.thumbnail;
            im.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;';
            tf.appendChild(im);
        } else {
            const ph = document.createElement('div');
            ph.className = 'thumb-placeholder';
            ph.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(138,184,232,0.35);font-size:48px;font-weight:300;font-family:inherit;';
            ph.textContent = '?';
            tf.appendChild(ph);
        }

        const capBtn = document.createElement('div');
        capBtn.className = 'thumb-capture-btn';
        capBtn.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,8,20,0.65);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;opacity:0;transition:opacity 200ms ease;padding:0 12px;text-align:center;line-height:1.4;';
        tf.appendChild(capBtn);
        
        // Button state depends on whether the user is actually at this
        // waypoint's parameter coordinates. If they are, capture is enabled.
        // If not, the button explains why and prompts them to travel first.
        // Refresh runs on hover so the state stays accurate as params change.
        function refreshCapBtnState() {
            const atLocation = isAtWaypointParams(wp);
            if (atLocation) {
                capBtn.style.color = '#cce6ff';
                capBtn.style.cursor = 'pointer';
                capBtn.textContent = wp.thumbnail ? 'Recapture Thumbnail' : 'Capture Thumbnail';
                capBtn.dataset.enabled = '1';
            } else {
                capBtn.style.color = '#7a8a99';
                capBtn.style.cursor = 'not-allowed';
                capBtn.textContent = 'Travel here first to capture';
                capBtn.dataset.enabled = '0';
            }
        }
        refreshCapBtnState();
        
        capBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (capBtn.dataset.enabled !== '1') return;
            await captureThumbnailFor(wp.id);
        });
        // Empty thumbnails: button visible from the start so the user
        // sees there's a way to populate it. Filled thumbnails: hover only.
        if (!wp.thumbnail) {
            capBtn.style.opacity = '1';
            capBtn.style.background = 'rgba(8,8,20,0.45)';
        }
        tf.addEventListener('mouseenter', () => {
            refreshCapBtnState();
            capBtn.style.opacity = '1';
        });
        tf.addEventListener('mouseleave', () => {
            if (wp.thumbnail) capBtn.style.opacity = '0';
        });

        listContainer.appendChild(tf);

        const rw = document.createElement('div');
        rw.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
        const cn = document.createElement('input');
        cn.className = 'wp-edit';
        cn.style.fontSize = '12px'; cn.style.fontWeight = 'bold'; cn.style.color = '#8ab8e8'; cn.style.background = 'transparent'; cn.style.border = 'none'; cn.style.width = '100%';
        cn.value = wp.name;
        cn.addEventListener('change', e => { wp.name = e.target.value; saveWP(); });
        rw.appendChild(cn);
        listContainer.appendChild(rw);

        const desc = document.createElement('textarea');
        desc.className = 'wp-edit';
        desc.style.fontSize = '10px'; desc.style.color = '#bbccdd'; desc.style.background = 'rgba(20,20,40,0.5)'; desc.style.border = '1px solid rgba(40,40,70,0.5)'; desc.style.width = '100%'; desc.style.height = '60px'; desc.style.padding = '6px'; desc.style.marginTop = '4px'; desc.style.borderRadius = '4px';
        desc.placeholder = 'Add a cosmic description...';
        desc.value = wp.notes || '';
        desc.addEventListener('change', e => { wp.notes = e.target.value; saveWP(); });
        listContainer.appendChild(desc);

        const ac = document.createElement('div');
        ac.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:16px';
        const goBtn = document.createElement('div');
        goBtn.className = 'btn';
        goBtn.style.color = '#6aaa7a';
        goBtn.textContent = 'Travel to this Location \u2708';
        goBtn.addEventListener('click', () => { if (tour.active) stopTour(); travelTo(wp); });
        ac.appendChild(goBtn);

        const shareSect = document.createElement('div');
        shareSect.style.cssText = 'width:100%;margin-top:6px;display:flex;flex-direction:column;gap:6px;';
        const shareLbl = document.createElement('div');
        shareLbl.style.cssText = 'font-size:8px;letter-spacing:0.18em;color:#8899aa;text-transform:uppercase;';
        shareLbl.textContent = 'Share Coordinates';
        shareSect.appendChild(shareLbl);
        
        const shareStr = (typeof encodeShareString === 'function') ? encodeShareString(wp) : '';
        const shareRow = document.createElement('div');
        shareRow.style.cssText = 'display:flex;gap:4px;';
        const shareInput = document.createElement('input');
        shareInput.type = 'text';
        shareInput.readOnly = true;
        shareInput.value = shareStr || '';
        shareInput.style.cssText = 'flex:1;font-size:9px;background:rgba(8,8,16,0.7);border:1px solid rgba(40,40,70,0.6);color:#cce6ff;padding:5px 7px;border-radius:3px;font-family:inherit;outline:none;';
        shareInput.addEventListener('focus', () => shareInput.select());
        shareRow.appendChild(shareInput);
        
        const copyBtn = document.createElement('div');
        copyBtn.className = 'btn';
        copyBtn.style.cssText = 'cursor:pointer;color:#cce6ff;padding:5px 10px;font-size:8px;';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', async () => {
            const ok = await copyToClipboard(shareStr);
            copyBtn.textContent = ok ? 'Copied!' : 'Failed';
            setTimeout(() => copyBtn.textContent = 'Copy', 1500);
        });
        shareRow.appendChild(copyBtn);
        shareSect.appendChild(shareRow);
        
        const shareHelp = document.createElement('div');
        shareHelp.style.cssText = 'font-size:8px;color:#5a6a7a;line-height:1.4;';
        shareHelp.textContent = 'Paste this string anywhere. Recipients import via the Atlas list.';
        shareSect.appendChild(shareHelp);
        
        listContainer.appendChild(shareSect);
        
        const delLk = document.createElement('div');
        delLk.style.cssText = 'color:#bb6666;font-size:8px;cursor:pointer;text-decoration:underline;margin-top:12px;';
        delLk.textContent = 'delete waypoint';
        delLk.addEventListener('click', () => showDelModal(wp.id, wp.name));
        ac.appendChild(delLk);

        listContainer.appendChild(ac);
    } else {
        const importSect = document.createElement('div');
        importSect.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;';
        const importInput = document.createElement('input');
        importInput.type = 'text';
        importInput.placeholder = 'Paste SS1:... share string';
        importInput.style.cssText = 'flex:1;font-size:9px;background:rgba(8,8,16,0.7);border:1px solid rgba(40,40,70,0.6);color:#cce6ff;padding:5px 7px;border-radius:3px;font-family:inherit;outline:none;';
        const importBtn = document.createElement('div');
        importBtn.className = 'btn';
        importBtn.style.cssText = 'cursor:pointer;color:#cce6ff;padding:5px 10px;font-size:8px;';
        importBtn.textContent = 'Import';
        const doImport = () => {
            const v = importInput.value.trim();
            if (!v) return;
            if (typeof importShareString === 'function') importShareString(v);
            importInput.value = '';
        };
        importBtn.addEventListener('click', doImport);
        importInput.addEventListener('keydown', e => { if (e.key === 'Enter') doImport(); });
        importSect.appendChild(importInput);
        importSect.appendChild(importBtn);
        listContainer.appendChild(importSect);

        const cats = getCategories();
        let _atlasFirstSection = true;
        cats.forEach(cat => {
            const wps = window.waypoints.filter(w => (w.category || 'Waypoints') === cat);
            if (wps.length === 0 && cat !== 'Waypoints') return;
            // Same .section class used everywhere else for consistency.
            // Count appears in parens, lighter, after the label.
            const ch = document.createElement('div');
            ch.className = 'section';
            // DOM construction rather than innerHTML — cat can come from
            // imported waypoints (untrusted). The validator strips control
            // chars and length-caps but doesn't escape HTML; using
            // textContent makes that escaping unnecessary by construction.
            ch.appendChild(document.createTextNode(cat + ' '));
            const cnt = document.createElement('span');
            cnt.style.cssText = 'opacity:0.5;font-weight:normal;letter-spacing:0.05em;';
            cnt.textContent = '(' + wps.length + ')';
            ch.appendChild(cnt);
            // The first category header sits directly below the Import row,
            // which already provides visual separation. Stripping the top
            // border here avoids a stacked-divider look. Subsequent category
            // headers keep their borders to delimit groups.
            if (_atlasFirstSection) {
                ch.style.borderTop = 'none';
                ch.style.paddingTop = '0';
                ch.style.marginTop = '4px';
                _atlasFirstSection = false;
            }
            listContainer.appendChild(ch);
            
            wps.forEach(wp => {
                const cd = document.createElement('div');
                cd.className = 'wp-row-card';
                cd.draggable = true;
                cd.dataset.wpid = wp.id;
                
                const isTourTarget = tour.active &&
                    window.waypoints[tour.wpIdx] &&
                    window.waypoints[tour.wpIdx].id === wp.id;
                if (isTourTarget) cd.classList.add('is-tour-active');
                // "You are here" — non-tour highlight when the user is at or
                // traveling to this waypoint. During an in-flight direct
                // travel, transition.targetWpId tells us the user's intent
                // before params have finished interpolating; falling back to
                // parameter match handles the steady state after travel ends
                // and the no-transition case (user manually adjusted params
                // to match a saved location).
                const inFlightTargetId = window.transition && window.transition.targetWpId;
                const isCurrent = inFlightTargetId
                    ? (inFlightTargetId === wp.id)
                    : isAtWaypointParams(wp);
                if (!isTourTarget && isCurrent) cd.classList.add('is-current');
                
                cd.style.cssText = 'display:flex;padding:6px;margin-bottom:2px;border-bottom:1px solid rgba(40,40,70,0.3);cursor:grab;border-radius:3px;transition:background 0.2s, box-shadow 0.2s, border-color 0.2s;';
                
                cd.addEventListener('dragstart', e => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', wp.id);
                    cd.style.opacity = '0.4';
                });
                cd.addEventListener('dragend', () => {
                    cd.style.opacity = '1';
                    listContainer.querySelectorAll('.wp-row-card').forEach(el => {
                        el.style.borderTop = '';
                        el.style.borderBottom = '1px solid rgba(40,40,70,0.3)';
                    });
                });
                cd.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    listContainer.querySelectorAll('.wp-row-card').forEach(el => {
                        el.style.borderTop = '';
                    });
                    cd.style.borderTop = '2px solid #6dffb0';
                });
                cd.addEventListener('drop', e => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (!sourceId || sourceId === wp.id) return;
                    const fromIdx = window.waypoints.findIndex(w => w.id === sourceId);
                    const toIdx   = window.waypoints.findIndex(w => w.id === wp.id);
                    if (fromIdx < 0 || toIdx < 0) return;
                    const [moved] = window.waypoints.splice(fromIdx, 1);
                    const newToIdx = window.waypoints.findIndex(w => w.id === wp.id);
                    window.waypoints.splice(newToIdx, 0, moved);
                    saveWP();
                    if (tour.active && window.waypoints[tour.wpIdx]) {
                        const curId = window.waypoints[tour.wpIdx].id;
                        tour.wpIdx = window.waypoints.findIndex(w => w.id === curId);
                    }
                    buildAtlasUI(engine);
                });
                
                if (wp.thumbnail) {
                    const ig = document.createElement('img');
                    ig.src = wp.thumbnail;
                    // Pointer cursor here = "click to open detail"; the card
                    // body keeps its grab cursor for the drag-reorder action.
                    ig.style.cssText = 'width:60px;height:40px;object-fit:cover;border-radius:2px;margin-right:8px;border:1px solid rgba(40,40,70,0.4);background:transparent;cursor:pointer';
                    ig.addEventListener('click', e => { e.stopPropagation(); window.atlasView = wp.id; buildAtlasUI(engine); });
                    cd.appendChild(ig);
                } else {
                    const ph = document.createElement('div');
                    ph.style.cssText = 'width:60px;height:40px;border-radius:2px;margin-right:8px;border:1px dashed rgba(80,120,160,0.4);background:rgba(8,8,16,0.5);display:flex;align-items:center;justify-content:center;color:rgba(138,184,232,0.5);font-size:18px;font-weight:300;cursor:pointer';
                    ph.textContent = '?';
                    ph.addEventListener('click', e => { e.stopPropagation(); window.atlasView = wp.id; buildAtlasUI(engine); });
                    cd.appendChild(ph);
                }

                const inf = document.createElement('div');
                inf.style.cssText = 'flex:1;min-width:0';
                const nm = document.createElement('div');
                nm.style.cssText = 'font-size:10px;color:#bbccdd;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer';
                nm.textContent = wp.name;
                nm.addEventListener('click', e => { e.stopPropagation(); window.atlasView = wp.id; buildAtlasUI(engine); });
                inf.appendChild(nm);
                if (wp.isImported) {
                    const sub = document.createElement('div');
                    sub.style.cssText = 'font-size:8px;color:#7a9acc;letter-spacing:0.08em;text-transform:uppercase;margin-top:1px;';
                    sub.textContent = 'imported';
                    inf.appendChild(sub);
                }
                cd.appendChild(inf);

                const goBtn = document.createElement('div');
                goBtn.style.cssText = 'color:#6aaa7a;font-size:12px;margin-left:4px;width:22px;text-align:center;cursor:pointer;';
                goBtn.textContent = '\u2708';
                goBtn.addEventListener('click', e => { e.stopPropagation(); if (tour.active) stopTour(); travelTo(wp); });
                cd.appendChild(goBtn);

                const delBtn = document.createElement('div');
                delBtn.style.cssText = 'color:#cc6666;font-size:14px;margin-left:4px;width:22px;text-align:center;cursor:pointer;font-weight:bold;';
                delBtn.textContent = '\u00d7';
                delBtn.addEventListener('click', e => { e.stopPropagation(); showDelModal(wp.id, wp.name); });
                cd.appendChild(delBtn);

                // No card-wide click handler — the name and thumbnail are the
                // explicit click-through affordances (each has its own listener).
                // The card body keeps the grab cursor for drag-to-reorder.
                listContainer.appendChild(cd);
            });
        });

        if (window.waypoints.length === 0) {
            const em = document.createElement('div');
            em.style.cssText = 'font-size:9px;color:#6a7a8a;padding:12px 0;text-align:center';
            em.textContent = 'Press Ctrl+S to capture a waypoint';
            listContainer.appendChild(em);
        }
    }

    if (window.waypoints && window.waypoints.length > 0) {
        const ftr = document.createElement('div');
        // Footer holds the Sequence/Random mode toggles and the Start/Pause
        // Tour button. Sticky-bottom inside the now-flattened scroll body
        // (panel-body itself scrolls), so as the user scrolls the list the
        // footer stays pinned. Negative horizontal/bottom margins extend
        // through panel-body's padding so the footer fills the panel edge-
        // to-edge, masking content scrolling beneath. Background + backdrop
        // blur give visual separation from the list above. Without the
        // opaque background, the transparent panel let scrolled rows show
        // through behind the controls — looked broken.
        ftr.style.cssText = 'margin:14px -12px -10px;position:sticky;bottom:-10px;padding:10px 12px 12px;border-top:1px solid rgba(120,120,180,0.18);text-align:center;background:rgba(8,8,22,0.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';;

        const modeRow = document.createElement('div');
        ftr.appendChild(modeRow);
        makeGroupToggles(modeRow, [
            { label: 'Sequence', key: 'tourMode', matchVal: 'sequential', cb: () => { tour.mode = 'sequential'; } },
            { label: 'Random',   key: 'tourMode', matchVal: 'random',     cb: () => { tour.mode = 'random'; } }
        ]);

        const tbtn = document.createElement('div');
        tbtn.className = 'tour-go-btn' + (tour.active ? ' active' : '');
        tbtn.style.cssText = 'font-weight:600;font-size:10px;padding:9px;border-radius:3px;cursor:pointer;text-transform:uppercase;letter-spacing:2px;transition:all 200ms ease;text-align:center;';
        tbtn.textContent = tour.active ? 'Pause Tour' : 'Start Tour';
        tbtn.addEventListener('click', () => { if (tour.active) stopTour(); else startTour(); });
        ftr.appendChild(tbtn);

        body.appendChild(ftr);
    }
}

// ────────────────────────────────────────────────────────────────────────────
//   4. Engine
// ────────────────────────────────────────────────────────────────────────────

const noise3d = Fn(([p]) => mx_noise_float(p));

const curlNoise = Fn(([p, freq, str]) => {
    const e = float(0.01);
    const px = mul(p.x, freq);
    const py = mul(p.y, freq);
    const pz = mul(p.z, freq);

    const p0 = vec3(px, py, pz);
    const p1 = vec3(add(px, 13.5), add(py, 92.1), add(pz, 45.3));
    const p2 = vec3(add(px, 83.1), add(py, 12.3), add(pz, 95.8));

    // curl.x = d(Psi_z)/dy - d(Psi_y)/dz
    const dz_dy = sub(noise3d(vec3(p2.x, add(p2.y, e), p2.z)), noise3d(vec3(p2.x, sub(p2.y, e), p2.z)));
    const dy_dz = sub(noise3d(vec3(p1.x, p1.y, add(p1.z, e))), noise3d(vec3(p1.x, p1.y, sub(p1.z, e))));
    const x = mul(div(sub(dz_dy, dy_dz), mul(2.0, e)), str);

    // curl.y = d(Psi_x)/dz - d(Psi_z)/dx
    const dx_dz = sub(noise3d(vec3(p0.x, p0.y, add(p0.z, e))), noise3d(vec3(p0.x, p0.y, sub(p0.z, e))));
    const dz_dx = sub(noise3d(vec3(add(p2.x, e), p2.y, p2.z)), noise3d(vec3(sub(p2.x, e), p2.y, p2.z)));
    const y = mul(div(sub(dx_dz, dz_dx), mul(2.0, e)), str);

    // curl.z = d(Psi_y)/dx - d(Psi_x)/dy
    const dy_dx = sub(noise3d(vec3(add(p1.x, e), p1.y, p1.z)), noise3d(vec3(sub(p1.x, e), p1.y, p1.z)));
    const dx_dy = sub(noise3d(vec3(p0.x, add(p0.y, e), p0.z)), noise3d(vec3(p0.x, sub(p0.y, e), p0.z)));
    const z = mul(div(sub(dy_dx, dx_dy), mul(2.0, e)), str);

    return vec3(x, y, z);
});

const spectralColor = Fn(([t]) => {
    const tmod = clamp(t, 0.0, 1.0);
    const r = abs(sub(mul(tmod, 6.0), 3.0)).sub(1.0).clamp(0.0, 1.0);
    const g = sub(2.0, abs(sub(mul(tmod, 6.0), 2.0))).clamp(0.0, 1.0);
    const b = sub(2.0, abs(sub(mul(tmod, 6.0), 4.0))).clamp(0.0, 1.0);
    return vec3(r, g, b);
});

// Spectral palette — shared between particle material and ribbon compute
const specCore = Fn(([eBase]) => {
    const e = eBase.mod(1.0);
    const r = min(float(1.0), max(float(0.0), select(e.lessThan(0.5), mul(e, 0.4), add(0.2, mul(sub(e, 0.5), 1.6)))));
    const g = min(float(1.0), max(float(0.0), select(e.lessThan(0.3), float(0.1), select(e.lessThan(0.7), mul(sub(e, 0.3), 1.5), sub(0.6, mul(sub(e, 0.7), 1.5))))));
    const b = min(float(1.0), max(float(0.0), select(e.lessThan(0.5), sub(0.9, mul(e, 0.8)), sub(0.5, mul(sub(e, 0.5), 1.0)))));
    return vec3(r, g, b);
});

// Catmull-Rom spline position: p0=prev, p1=curr, p2=next, p3=next+1, t in [0,1]
const catmullRomPos = Fn(([p0, p1, p2, p3, t]) => {
    const t2 = mul(t, t);
    const t3 = mul(t2, t);
    const c0 = mul(p1, float(2.0));
    const c1 = mul(add(mul(p0, float(-1.0)), p2), t);
    const c2 = mul(add(add(mul(p0, float(2.0)), mul(p1, float(-5.0))), add(mul(p2, float(4.0)), mul(p3, float(-1.0)))), t2);
    const c3 = mul(add(add(mul(p0, float(-1.0)), mul(p1, float(3.0))), add(mul(p2, float(-3.0)), p3)), t3);
    return mul(add(add(add(c0, c1), c2), c3), float(0.5));
});

// Catmull-Rom tangent (derivative of above)
const catmullRomTan = Fn(([p0, p1, p2, p3, t]) => {
    const t2 = mul(t, t);
    const d0 = add(mul(p0, float(-1.0)), p2);
    const d1 = mul(add(add(mul(p0, float(4.0)), mul(p1, float(-10.0))), add(mul(p2, float(8.0)), mul(p3, float(-2.0)))), t);
    const d2 = mul(add(add(mul(p0, float(-3.0)), mul(p1, float(9.0))), add(mul(p2, float(-9.0)), mul(p3, float(3.0)))), t2);
    return mul(add(add(d0, d1), d2), float(0.5));
});

export class Engine {
    constructor(canvas, bgCanvas) {
        this.canvas = canvas;
        this.bgCanvas = bgCanvas;
        this.MAX_PARTICLES = 1000000;
        this.particleCount = this.MAX_PARTICLES;

        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupBuffers();
        this.setupCompute();
        this.setupMaterial();
        this.setupMesh();
        this.setupRibbon();
        this.setupLattice();
        this.setupNavigationArrow();
    }

    setupNavigationArrow() {
        this.navArrow = document.createElement('div');
        this.navArrow.id = 'nav-arrow';
        this.navArrow.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: rgba(255, 0, 0, 0.8);
            clip-path: polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%);
            z-index: 1000;
            pointer-events: none;
            display: none;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        `;
        document.body.appendChild(this.navArrow);
    }

    updateNavigationArrow() {
        if (!this.camera) return;
        const origin = new THREE.Vector3(0, 0, 0);
        const projected = origin.clone().project(this.camera);
        
        const isOffScreen = Math.abs(projected.x) > 0.95 || Math.abs(projected.y) > 0.95 || projected.z > 1;
        
        if (isOffScreen) {
            this.navArrow.style.display = 'block';
            const dx = projected.x;
            const dy = projected.y;
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            this.navArrow.style.transform = `translateX(-50%) rotate(${angle}rad)`;
            const opacity = projected.z > 1 ? 1.0 : 0.6;
            this.navArrow.style.background = `rgba(255, 0, 0, ${opacity})`;
        } else {
            this.navArrow.style.display = 'none';
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGPURenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x040410, 0.001);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 0, 300);

        this.cam = {
            quat: new THREE.Quaternion(),
            dist: 300,
            distTarget: 300,
            target: new THREE.Vector3(),
            pos: new THREE.Vector3(0, 0, 300),
            yaw: 0,
            pitch: 0,
            down: false,
            mx: 0,
            my: 0,
            flyMoveSpeed: 1.0,
            orbitZoomSpeed: 1.0
        };

        try {
            const savedCam = localStorage.getItem('ss_cam');
            if (savedCam) {
                const c = JSON.parse(savedCam);
                if (c.pos) this.cam.pos.fromArray(c.pos);
                if (c.quat) this.cam.quat.fromArray(c.quat);
                if (c.dist !== undefined) { this.cam.dist = c.dist; this.cam.distTarget = c.dist; }
                if (c.yaw !== undefined) this.cam.yaw = c.yaw;
                if (c.pitch !== undefined) this.cam.pitch = c.pitch;
                if (c.flyMoveSpeed !== undefined) this.cam.flyMoveSpeed = c.flyMoveSpeed;
                if (c.orbitZoomSpeed !== undefined) this.cam.orbitZoomSpeed = c.orbitZoomSpeed;
                this.camera.position.copy(this.cam.pos);
                this.camera.rotation.set(this.cam.pitch, this.cam.yaw, 0, 'YXZ');
            }
        } catch(e) {}
    }

    setupBuffers() {
        const posArray = new Float32Array(this.particleCount * 4);
        const velArray = new Float32Array(this.particleCount * 4);
        const colArray = new Float32Array(this.particleCount * 4);

        const spec = (e) => ({
            r: Math.min(1, Math.max(0, e < .5 ? e * .4 : .2 + (e - .5) * 1.6)),
            g: Math.min(1, Math.max(0, e < .3 ? .1 : e < .7 ? (e - .3) * 1.5 : .6 - (e - .7) * 1.5)),
            b: Math.min(1, Math.max(0, e < .5 ? .9 - e * .8 : .5 - (e - .5) * 1))
        });

        const hue = window.S.hue ?? 0.5;
        const sat = window.S.sat ?? 0.8;
        const lightness = window.S.lightness ?? 0.2;
        const sR = window.S.inversion;

        for (let i = 0; i < this.particleCount; i++) {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const r = Math.cbrt(Math.random()) * sR * 0.8;

            posArray[i * 4 + 0] = r * Math.sin(ph) * Math.cos(th);
            posArray[i * 4 + 1] = r * Math.sin(ph) * Math.sin(th);
            posArray[i * 4 + 2] = r * Math.cos(ph);
            posArray[i * 4 + 3] = 0.5 + Math.random() * 1.5;

            velArray[i * 4 + 0] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 1] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 2] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 3] = Math.random();

            const e = (hue + Math.random() * lightness) % 1.0;
            const c = spec(e);
            colArray[i * 4 + 0] = c.r * sat + (1 - sat);
            colArray[i * 4 + 1] = c.g * sat + (1 - sat);
            colArray[i * 4 + 2] = c.b * sat + (1 - sat);
            colArray[i * 4 + 3] = Math.random();
        }

        this.posStorage = new THREE.StorageBufferAttribute(posArray, 4);
        this.velStorage = new THREE.StorageBufferAttribute(velArray, 4);
        this.colStorage = new THREE.StorageBufferAttribute(colArray, 4);

        this.geometry = new THREE.PlaneGeometry(1, 1);

        this.GRID_X = 64; this.GRID_Y = 64; this.GRID_Z = 64;
        this.GRID_TOTAL_CELLS = this.GRID_X * this.GRID_Y * this.GRID_Z;
        this.MAX_PER_CELL = 32;
        this.gridCountStorage = new THREE.StorageBufferAttribute(new Uint32Array(this.GRID_TOTAL_CELLS), 1);
        this.gridMemberStorage = new THREE.StorageBufferAttribute(new Uint32Array(this.GRID_TOTAL_CELLS * this.MAX_PER_CELL), 1);
    }

    resizeParticles(newCount) {
        const activeCount = Math.round(newCount);
        if (this.mesh) this.mesh.count = activeCount;
        if (this.uniforms && this.uniforms.activeParticleCount) {
            this.uniforms.activeParticleCount.value = activeCount;
        }
        // DO NOT resize ribbon/lattice buffers – keep stable
    }

    // Re-scramble all particle positions and velocities back to the original
    // spawn distribution. The simulation continues with the SAME parameter
    // coordinates, but particles start fresh — useful for seeing the true
    // attractor shape without stigmergic momentum from previous states.
    reinitializeParticles() {
        if (!this.posStorage || !this.velStorage) return;
        const posArray = this.posStorage.array;
        const velArray = this.velStorage.array;
        const sR = window.S.inversion;
        for (let i = 0; i < this.particleCount; i++) {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const r = Math.cbrt(Math.random()) * sR * 0.8;
            posArray[i * 4 + 0] = r * Math.sin(ph) * Math.cos(th);
            posArray[i * 4 + 1] = r * Math.sin(ph) * Math.sin(th);
            posArray[i * 4 + 2] = r * Math.cos(ph);
            posArray[i * 4 + 3] = 0.5 + Math.random() * 1.5;
            velArray[i * 4 + 0] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 1] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 2] = (Math.random() - 0.5) * 0.5;
            velArray[i * 4 + 3] = Math.random();
        }
        // Mark CPU-side arrays as dirty so the renderer re-uploads them.
        // For WebGPU StorageBufferAttribute, the renderer checks .version
        // to decide whether to re-upload. Bumping it explicitly belt-and-
        // suspenders our trigger so the GPU sees the new data.
        this.posStorage.needsUpdate = true;
        this.velStorage.needsUpdate = true;
        if (typeof this.posStorage.version === 'number') this.posStorage.version++;
        if (typeof this.velStorage.version === 'number') this.velStorage.version++;
    }

    setupCompute() {
        this.uniforms = {
            activeParticleCount: uniform(uint(Math.round(window.S.freeEnergy))),
            dt: uniform(0.016),
            time: time,
            mass: uniform(window.S.mass),
            viscosity: uniform(window.S.viscosity),
            tempo: uniform(window.S.tempo),
            inversion: uniform(window.S.inversion),
            maxV: uniform(8.0),
            coherence: uniform(window.S.coherence),
            temperature: uniform(window.S.temperature),
            equilibrium: uniform(window.S.equilibrium),
            scaleDepth: uniform(window.S.scaleDepth),
            halfLife: uniform(window.S.halfLife ?? 15.0),
            camPos: uniform(new THREE.Vector3(0, 0, 300)),
            offsetX: uniform(window.S.offsetX),
            offsetY: uniform(window.S.offsetY),
            offsetZ: uniform(window.S.offsetZ),
            billboardOffset: uniform(window.S.billboardOffset),
            colorMode: uniform(window.S.colorMode || 0),
            colorRange: uniform(window.S.hue || 0.5),
            sat: uniform(window.S.sat ?? 0.8),
            lightness: uniform(window.S.lightness ?? 0.2),
            trailLen: uniform(window.S.trailLen ?? 5.0),
            shape: uniform(window.S.shape === 'square' ? 1 : (window.S.shape === 'diamond' ? 2 : 0))
        };

        const getCellIndex = Fn(([p]) => {
            const cx = int(floor(div(p.x, this.uniforms.coherence)));
            const cy = int(floor(div(p.y, this.uniforms.coherence)));
            const cz = int(floor(div(p.z, this.uniforms.coherence)));
            const wx = uint(bitAnd(add(cx, int(10240)), int(63)));
            const wy = uint(bitAnd(add(cy, int(10240)), int(63)));
            const wz = uint(bitAnd(add(cz, int(10240)), int(63)));
            return add(wx, add(mul(wy, uint(64)), mul(wz, uint(4096))));
        });

        const computeClearGrid = Fn(() => {
            const countBuf = storage(this.gridCountStorage, 'uint', this.GRID_TOTAL_CELLS).toAtomic();
            atomicStore(countBuf.element(instanceIndex), uint(0));
        });

        const computeAssignGrid = Fn(() => {
            If(instanceIndex.lessThan(this.uniforms.activeParticleCount), () => {
                const pBuf = storage(this.posStorage, 'vec4', this.particleCount);
                const countBuf = storage(this.gridCountStorage, 'uint', this.GRID_TOTAL_CELLS).toAtomic();
                const memberBuf = storage(this.gridMemberStorage, 'uint', this.GRID_TOTAL_CELLS * this.MAX_PER_CELL);

                const pNode = pBuf.element(instanceIndex).xyz;
                const cellIdx = getCellIndex(pNode);
                const offset = atomicAdd(countBuf.element(cellIdx), uint(1));

                If(offset.lessThan(uint(this.MAX_PER_CELL)), () => {
                    const memberIdx = add(mul(cellIdx, uint(this.MAX_PER_CELL)), offset);
                    memberBuf.element(memberIdx).assign(uint(instanceIndex));
                });
            });
        });

        const computePhysics = Fn(() => {
            If(instanceIndex.lessThan(this.uniforms.activeParticleCount), () => {
                const pBuf = storage(this.posStorage, 'vec4', this.particleCount);
                const vBuf = storage(this.velStorage, 'vec4', this.particleCount);
                const countBuf = storage(this.gridCountStorage, 'uint', this.GRID_TOTAL_CELLS);
                const memberBuf = storage(this.gridMemberStorage, 'uint', this.GRID_TOTAL_CELLS * this.MAX_PER_CELL);

                const pNode = pBuf.element(instanceIndex);
                const vNode = vBuf.element(instanceIndex);

                let p = pNode.xyz;
                let v = vNode.xyz;

                const cellIdx = getCellIndex(p);
                const r = this.uniforms.inversion;
                const tScale = this.uniforms.tempo;
                let fx = float(0.0).toVar();
                let fy = float(0.0).toVar();
                let fz = float(0.0).toVar();

                const cx = int(floor(div(p.x, this.uniforms.coherence)));
                const cy = int(floor(div(p.y, this.uniforms.coherence)));
                const cz = int(floor(div(p.z, this.uniforms.coherence)));

                const ax = float(0).toVar();
                const ay = float(0).toVar();
                const az = float(0).toVar();

                Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: dx }) => {
                    Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: dy }) => {
                        Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: dz }) => {
                            const nx = add(cx, dx);
                            const ny = add(cy, dy);
                            const nz = add(cz, dz);

                            const wx = uint(bitAnd(add(nx, int(10240)), int(63)));
                            const wy = uint(bitAnd(add(ny, int(10240)), int(63)));
                            const wz = uint(bitAnd(add(nz, int(10240)), int(63)));
                            const neighborCellIdx = add(wx, add(mul(wy, uint(this.GRID_X)), mul(wz, uint(this.GRID_X * this.GRID_Y))));

                            const cellCount = min(countBuf.element(neighborCellIdx), uint(this.MAX_PER_CELL));

                            Loop({ start: uint(0), end: cellCount, type: 'uint', condition: '<' }, ({ i: j }) => {
                                const memberIdx = add(mul(neighborCellIdx, uint(this.MAX_PER_CELL)), j);
                                const neighborId = memberBuf.element(memberIdx);

                                If(neighborId.notEqual(uint(instanceIndex)), () => {
                                    const nPos = pBuf.element(neighborId).xyz;
                                    const dx_p = sub(nPos.x, p.x);
                                    const dy_p = sub(nPos.y, p.y);
                                    const dz_p = sub(nPos.z, p.z);
                                    const dSq = add(mul(dx_p, dx_p), add(mul(dy_p, dy_p), mul(dz_p, dz_p)));
                                    const radSq = mul(this.uniforms.coherence, this.uniforms.coherence);

                                    If(dSq.lessThan(radSq).and(dSq.greaterThan(1.0)), () => {
                                        const d = length(vec3(dx_p, dy_p, dz_p));
                                        const ratio = div(d, this.uniforms.coherence);
                                        const forceStr = float(0).toVar();
                                        If(ratio.greaterThan(0.15), () => {
                                            forceStr.assign( mul(this.uniforms.scaleDepth, mul(25.0, sub(1.0, ratio))) );
                                        }).Else(() => {
                                            forceStr.assign( mul(this.uniforms.scaleDepth, mul(-150.0, sub(0.15, ratio))) );
                                        });

                                        ax.addAssign(mul(div(dx_p, d), forceStr));
                                        ay.addAssign(mul(div(dy_p, d), forceStr));
                                        az.addAssign(mul(div(dz_p, d), forceStr));
                                    });
                                });
                            });
                        });
                    });
                });

                const maxR = mul(r, 0.9);
                const eq = this.uniforms.equilibrium;
                const temp = this.uniforms.temperature;

                const curlPos = vec3(
                    add(mul(p.x, 0.5), mul(time, 0.05)),
                    add(mul(p.y, 0.5), mul(time, 0.02)),
                    mul(p.z, 0.5)
                );

                const turb = curlNoise(curlPos, mul(eq, 10.0), mul(temp, 2.0));

                fx.addAssign(turb.x);
                fy.addAssign(turb.y);
                fz.addAssign(turb.z);

                If(this.uniforms.scaleDepth.greaterThan(0.001), () => {
                    If(this.uniforms.coherence.greaterThan(0.1), () => {
                        fx.addAssign(ax);
                        fy.addAssign(ay);
                        fz.addAssign(az);
                    });
                });

                const distFromOrigin = length(p);
                If(distFromOrigin.greaterThan(5.0), () => {
                    const pullStrength = min(mul(sub(distFromOrigin, 5.0), 0.05), float(1.5));
                    const dirToOrigin = normalize(p);
                    fx.subAssign(mul(dirToOrigin.x, pullStrength));
                    fy.subAssign(mul(dirToOrigin.y, pullStrength));
                    fz.subAssign(mul(dirToOrigin.z, pullStrength));
                });

                const softLimit = mul(maxR, 0.8);
                If(distFromOrigin.greaterThan(softLimit), () => {
                    const push = mul(sub(distFromOrigin, softLimit), 0.5);
                    const dirToOrigin = normalize(p);
                    fx.subAssign(mul(dirToOrigin.x, push));
                    fy.subAssign(mul(dirToOrigin.y, push));
                    fz.subAssign(mul(dirToOrigin.z, push));
                });

                const force = vec3(fx, fy, fz);
                const drag = sub(float(1.0), mul(this.uniforms.viscosity, mul(0.005, tScale)));
                const newV = add(mul(v, drag), mul(force, mul(this.uniforms.dt, div(8.0, this.uniforms.mass)))).toVar();
                const vMag = length(newV);
                const clampScale = min(float(1.0), div(this.uniforms.maxV, vMag));
                newV.assign(mul(newV, clampScale));
                const newP = add(p, mul(newV, tScale)).toVar();

                const decayNoise = add(float(1.0), mul(fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))).mul(43758.5453)), float(0.5)));
                const decayRate = max(float(0.0), mul(sub(float(30.0), this.uniforms.halfLife), mul(float(0.05), mul(tScale, mul(this.uniforms.dt, decayNoise)))));
                const life = sub(vNode.w, decayRate).toVar();
                
                const hashVec = vec3(p.x, p.y, add(p.z, float(instanceIndex)));
                const randAngle1 = mul(fract(sin(dot(hashVec, vec3(12.9898, 78.233, 45.164))).mul(43758.5453)), mul(Math.PI, 2.0));
                const randAngle2 = mul(fract(sin(dot(hashVec, vec3(45.164, 12.9898, 78.233))).mul(43758.5453)), mul(Math.PI, 2.0));
                const blastSpeed = add(mul(fract(sin(dot(hashVec, vec3(78.233, 45.164, 12.9898))).mul(43758.5453)), 20.0), 5.0);
                const blastV = vec3(
                    mul(sin(randAngle1), cos(randAngle2)),
                    mul(sin(randAngle1), sin(randAngle2)),
                    cos(randAngle1)
                ).mul(blastSpeed);

                If(life.lessThan(0.0), () => {
                    newP.assign(vec3(0.0, 0.0, 0.0));
                    newV.assign(blastV);
                    life.assign(float(1.0));
                });

                vNode.assign(vec4(newV, life));
                pNode.assign(vec4(newP, float(1.0)));
            });
        });

        this.computeClearNode = computeClearGrid().compute(this.GRID_TOTAL_CELLS);
        this.computeAssignNode = computeAssignGrid().compute(this.particleCount);
        this.computeNode = computePhysics().compute(this.particleCount);
    }

    makeTex(t) {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const x = c.getContext('2d');

        if (t === 'circle') {
            const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(.4, 'rgba(255,255,255,.8)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            x.fillStyle = g;
            x.fillRect(0, 0, 64, 64);
        } else if (t === 'square') {
            x.fillStyle = '#fff';
            x.fillRect(4, 4, 56, 56);
        } else {
            x.fillStyle = '#fff';
            x.beginPath();
            x.moveTo(32, 2);
            x.lineTo(62, 32);
            x.lineTo(32, 62);
            x.lineTo(2, 32);
            x.closePath();
            x.fill();
        }
        return new THREE.CanvasTexture(c);
    }

    setupMaterial() {
        this.uniforms.pointSize = uniform(window.S.resolution);
        this.uniforms.pointOpacity = uniform(window.S.opacity);

        const posFromBuf = storage(this.posStorage, 'vec4', this.particleCount).element(instanceIndex);
        const colFromBuf = storage(this.colStorage, 'vec4', this.particleCount).element(instanceIndex);

        this.material = new THREE.MeshBasicNodeMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const worldOffset = vec3(this.uniforms.offsetX, this.uniforms.offsetY, this.uniforms.offsetZ);
        const worldPos = add(posFromBuf.xyz, worldOffset);
        const viewPos = modelViewMatrix.mul(vec4(worldPos, 1.0)).xyz;

        const colorMode = this.uniforms.colorMode;
        const colorRange = this.uniforms.colorRange;
        const velFromBuf = storage(this.velStorage, 'vec4', this.particleCount).element(instanceIndex);

        const getCellIndex = Fn(([cx, cy, cz]) => {
            const wx = uint(bitAnd(add(cx, int(10000)), int(63)));
            const wy = uint(bitAnd(add(cy, int(10000)), int(63)));
            const wz = uint(bitAnd(add(cz, int(10000)), int(63)));
            return add(wx, add(mul(wy, uint(this.GRID_X)), mul(wz, uint(this.GRID_X * this.GRID_Y))));
        });

        const getSmoothDensity = Fn(([p]) => {
            const fPos = div(p, this.uniforms.coherence).sub(0.5);
            const base = floor(fPos);
            const f = fract(fPos);
            
            const bx = int(base.x); const by = int(base.y); const bz = int(base.z);
            const bx1 = bx.add(1);  const by1 = by.add(1);  const bz1 = bz.add(1);
            
            const sBuf = storage(this.gridCountStorage, 'uint', this.GRID_TOTAL_CELLS);
            
            const c000 = float(sBuf.element(getCellIndex(bx, by, bz)));
            const c100 = float(sBuf.element(getCellIndex(bx1, by, bz)));
            const c010 = float(sBuf.element(getCellIndex(bx, by1, bz)));
            const c110 = float(sBuf.element(getCellIndex(bx1, by1, bz)));
            
            const c001 = float(sBuf.element(getCellIndex(bx, by, bz1)));
            const c101 = float(sBuf.element(getCellIndex(bx1, by, bz1)));
            const c011 = float(sBuf.element(getCellIndex(bx, by1, bz1)));
            const c111 = float(sBuf.element(getCellIndex(bx1, by1, bz1)));
            
            const mx00 = mix(c000, c100, f.x);
            const mx10 = mix(c010, c110, f.x);
            const mx01 = mix(c001, c101, f.x);
            const mx11 = mix(c011, c111, f.x);
            
            const mx0 = mix(mx00, mx10, f.y);
            const mx1 = mix(mx01, mx11, f.y);
            
            return mix(mx0, mx1, f.z);
        });

        const density = getSmoothDensity(posFromBuf.xyz);
        const speed = length(velFromBuf.xyz);

        const pSize = mul(posFromBuf.w, this.uniforms.pointSize, float(0.4));
        const finalSize = max(pSize, float(0.1));
        const lQuadPos = positionLocal.mul(finalSize);
        const fViewPos = add(viewPos, vec3(lQuadPos.x, lQuadPos.y, this.uniforms.billboardOffset));
        this.material.vertexNode = cameraProjectionMatrix.mul(vec4(fViewPos, 1.0));

        const spectrumWidth = add(mul(colorRange, float(1.2)), float(0.05));
        
        const sizeVal = clamp(div(finalSize, mul(spectrumWidth, float(5.0))), 0.0, 1.0);
        const velVal = clamp(div(speed, mul(spectrumWidth, float(15.0))), 0.0, 1.0);
        const dynamicMax = max(float(this.MAX_PER_CELL), mul(float(this.uniforms.activeParticleCount), float(0.0005)));
        const densityVal = clamp(mul(div(float(density), dynamicMax), spectrumWidth), 0.0, 1.0);
        
        const sizeColor = spectralColor(sizeVal);
        const velColor = spectralColor(velVal);
        const densityColor = spectralColor(densityVal);
        const baseColor = specCore(colorRange);
        
        const baseModeColor = select(colorMode.equal(1), sizeColor, 
                            select(colorMode.equal(2), velColor,
                                select(colorMode.equal(3), densityColor, baseColor)));

        const finalColor = mix(vec3(1.0), baseModeColor, this.uniforms.sat);

        const uPos = uv().sub(0.5);
        const distCirc = length(uPos);
        const distSquare = max(abs(uPos.x), abs(uPos.y));
        const distDiamond = add(abs(uPos.x), abs(uPos.y));
        
        const dist = select(this.uniforms.shape.equal(1), distSquare,
                       select(this.uniforms.shape.equal(2), distDiamond, distCirc));
                       
        const mask = step(dist, float(0.5));
        
        const life = velFromBuf.w;
        const fadeMod = select(this.uniforms.halfLife.lessThan(29.5), clamp(mul(life, 3.0), 0.0, 1.0), float(1.0));
        
        this.material.colorNode = vec4(finalColor, mul(this.uniforms.pointOpacity, mul(mask, fadeMod)));
    }

    setupRibbon() {
        if (this.ribbonMesh) {
            this.scene.remove(this.ribbonMesh);
        }
        const N = Math.min(Math.round(window.S.freeEnergy), 100000);
        this._ribbonN = N;
        const S = 24;
        this._ribbonS = S;
        
        const totalPoints = N * S;
        const totalVerts = totalPoints * 2;
        const maxInstances = (N - 1) * S;

        this.ribbonPosStorage = new THREE.StorageBufferAttribute(new Float32Array(totalVerts * 4), 4);
        this.ribbonColStorage = new THREE.StorageBufferAttribute(new Float32Array(totalVerts * 4), 4);

        this.ribbonMesh = this._makeSegmentMesh(
            this.ribbonPosStorage, this.ribbonColStorage, totalVerts, maxInstances, 2
        );
        this.scene.add(this.ribbonMesh);

        const pBuf = storage(this.posStorage, 'vec4', this.particleCount);
        const vBuf = storage(this.velStorage, 'vec4', this.particleCount);
        const outPos = storage(this.ribbonPosStorage, 'vec4', totalVerts);
        const outCol = storage(this.ribbonColStorage, 'vec4', totalVerts);
        const U = this.uniforms;
        
        const hermitePos = Fn(([p1, p2, m1, m2, t]) => {
            const t2 = mul(t, t);
            const t3 = mul(t2, t);
            const h00 = add(sub(mul(2.0, t3), mul(3.0, t2)), 1.0);
            const h10 = add(sub(t3, mul(2.0, t2)), t);
            const h01 = sub(mul(3.0, t2), mul(2.0, t3));
            const h11 = sub(t3, t2);
            return add(add(mul(p1, h00), mul(m1, h10)), add(mul(p2, h01), mul(m2, h11)));
        });

        const hermiteTan = Fn(([p1, p2, m1, m2, t]) => {
            const t2 = mul(t, t);
            const dh00 = sub(mul(6.0, t2), mul(6.0, t));
            const dh10 = add(sub(mul(3.0, t2), mul(4.0, t)), 1.0);
            const dh01 = sub(mul(6.0, t), mul(6.0, t2));
            const dh11 = sub(mul(3.0, t2), mul(2.0, t));
            return add(add(mul(p1, dh00), mul(m1, dh10)), add(mul(p2, dh01), mul(m2, dh11)));
        });

        const computeRibbon = Fn(() => {
            const tId = instanceIndex;
            If(tId.lessThan(uint(totalPoints)), () => {
                const SUint = uint(S);
                const pIdx = div(tId, SUint);
                const subIdx = sub(tId, mul(pIdx, SUint));
                const u = div(float(subIdx), float(S));

                const Nm1 = uint(N - 1);
                const Nm2 = uint(Math.max(0, N - 2));

                const i0 = select(pIdx.greaterThan(uint(0)), sub(pIdx, uint(1)), uint(0));
                const i1 = pIdx;
                const i2 = select(pIdx.lessThan(Nm1), add(pIdx, uint(1)), Nm1);
                const i3 = select(pIdx.lessThan(Nm2), add(pIdx, uint(2)), Nm1);

                const p0 = pBuf.element(i0).xyz;
                const p1 = pBuf.element(i1).xyz;
                const p2 = pBuf.element(i2).xyz;
                const p3 = pBuf.element(i3).xyz;

                const tension = mul(U.trailLen, 0.1);
                const m1 = mul(sub(p2, p0), tension);
                const m2 = mul(sub(p3, p1), tension);

                const pos = hermitePos(p1, p2, m1, m2, u);
                const rawTan = hermiteTan(p1, p2, m1, m2, u);
                const validTan = select(length(rawTan).greaterThan(0.0001), normalize(rawTan), vec3(0,1,0));

                const toCam = normalize(sub(U.camPos, pos));
                const norm = normalize(cross(validTan, toCam));
                const hw = mul(U.pointSize, 0.5);

                const outIdx = mul(tId, uint(2));
                outPos.element(outIdx).assign(vec4(add(pos, mul(norm, hw)), 1.0));
                outPos.element(add(outIdx, uint(1))).assign(vec4(sub(pos, mul(norm, hw)), 1.0));

                const life1 = vBuf.element(i1).w;
                const life2 = vBuf.element(i2).w;
                const life = mix(life1, life2, u);
                
                const dist = length(sub(p2, p1));
                const distFade = clamp(sub(1.0, div(sub(dist, 60.0), 40.0)), 0.0, 1.0);
                const baseFade = select(U.halfLife.lessThan(29.5), clamp(mul(life, 4.0), 0.0, 1.0), 1.0);
                const fadeAlpha = mul(baseFade, distFade);

                const speed1 = length(vBuf.element(i1).xyz);
                const speed2 = length(vBuf.element(i2).xyz);
                const speed = mix(speed1, speed2, u);
                
                const sw = add(mul(U.colorRange, 1.2), 0.05);
                const velVal = clamp(div(speed, mul(sw, 15.0)), 0.0, 1.0);
                const baseColor = specCore(U.colorRange);
                const modeColor = select(U.colorMode.equal(2), spectralColor(velVal),
                    select(U.colorMode.equal(1), spectralColor(0.5), baseColor));
                const fc = vec4(mix(vec3(1.0), modeColor, U.sat), fadeAlpha);

                outCol.element(outIdx).assign(fc);
                outCol.element(add(outIdx, uint(1))).assign(fc);
            });
        });
        this.computeRibbonNode = computeRibbon().compute(totalPoints);
    }

    setupLattice() {
        if (this.latticeMesh) {
            this.scene.remove(this.latticeMesh);
        }
        const N = Math.round(window.S.freeEnergy);
        this._latticeN = N;
        const segCount = N - 1;
        const totalVerts = N * 2;
        this.latticePosStorage = new THREE.StorageBufferAttribute(new Float32Array(totalVerts * 4), 4);
        this.latticeColStorage = new THREE.StorageBufferAttribute(new Float32Array(totalVerts * 4), 4);

        this.latticeMesh = this._makeSegmentMesh(
            this.latticePosStorage, this.latticeColStorage, totalVerts, segCount, 2
        );
        this.scene.add(this.latticeMesh);

        const pBuf = storage(this.posStorage, 'vec4', this.particleCount);
        const vBuf = storage(this.velStorage, 'vec4', this.particleCount);
        const outPos = storage(this.latticePosStorage, 'vec4', totalVerts);
        const outCol = storage(this.latticeColStorage, 'vec4', totalVerts);
        const U = this.uniforms;
        const Nm1 = uint(N - 1);

        const computeLattice = Fn(() => {
            const i = instanceIndex;
            If(i.lessThan(uint(N)), () => {
                const i0 = select(i.greaterThan(uint(0)), sub(i, uint(1)), uint(0));
                const i2 = select(i.lessThan(Nm1), add(i, uint(1)), Nm1);
                const pos = pBuf.element(i).xyz;
                const tangent = normalize(sub(pBuf.element(i2).xyz, pBuf.element(i0).xyz));
                const norm = normalize(cross(tangent, normalize(sub(U.camPos, pos))));
                const hw = mul(U.pointSize, 0.5);
                // Per-cell "trail length" — extends the segment along its
                // tangent direction. Same `U.trailLen * 0.1` scalar that
                // computeRibbon uses for Hermite tension, applied here to
                // segment length so the trail-length slider has a visible
                // effect on the lattice too. Without this, the lattice was
                // unresponsive to the slider (slider only touched ribbon
                // tension), which the user perceived as a bug.
                const segScale = mul(U.trailLen, 0.1);
                const aOffset = mul(tangent, mul(hw, segScale));
                outPos.element(mul(i, uint(2))).assign(vec4(add(add(pos, mul(norm, hw)), aOffset), 1.0));
                outPos.element(add(mul(i, uint(2)), uint(1))).assign(vec4(sub(add(pos, aOffset), mul(norm, hw)), 1.0));

                const life = vBuf.element(i).w;
                const dist = length(sub(pBuf.element(i2).xyz, pos));
                const distFade = clamp(sub(1.0, div(sub(dist, 60.0), 40.0)), 0.0, 1.0);
                const baseFade = select(U.halfLife.lessThan(29.5), clamp(mul(life, 4.0), 0.0, 1.0), 1.0);
                const fadeAlpha = mul(baseFade, distFade);

                const vel = vBuf.element(i).xyz;
                const speed = length(vel);
                const sw = add(mul(U.colorRange, 1.2), 0.05);
                const velVal = clamp(div(speed, mul(sw, 15.0)), 0.0, 1.0);
                const baseColor = specCore(U.colorRange);
                const modeColor = select(U.colorMode.equal(2), spectralColor(velVal),
                    select(U.colorMode.equal(1), spectralColor(0.5), baseColor));
                const fc = vec4(mix(vec3(1.0), modeColor, U.sat), fadeAlpha);
                outCol.element(mul(i, uint(2))).assign(fc);
                outCol.element(add(mul(i, uint(2)), uint(1))).assign(fc);
            });
        });
        this.computeLatticeNode = computeLattice().compute(N);
    }

    _makeSegmentMesh(posStorage, colStorage, totalStorageVerts, instanceCount, cornerStride) {
        const quadGeo = new THREE.BufferGeometry();
        const quadPos = new Float32Array([0,0,0, 1,0,0, 0,1,0, 1,1,0]);
        quadGeo.setAttribute('position', new THREE.BufferAttribute(quadPos, 3));
        quadGeo.setIndex([0,1,2, 1,3,2]);

        const mat = new THREE.MeshBasicNodeMaterial();
        mat.transparent = true;
        mat.blending = THREE.AdditiveBlending;
        mat.depthWrite = false;
        mat.depthTest = true;
        mat.side = THREE.DoubleSide;

        const rPosBuf = storage(posStorage, 'vec4', totalStorageVerts);
        const rColBuf = storage(colStorage, 'vec4', totalStorageVerts);
        const stride = uint(cornerStride);
        const storageIdx = add(mul(instanceIndex, stride), uint(vertexIndex));
        const wPos = rPosBuf.element(storageIdx);
        const rViewPos = modelViewMatrix.mul(vec4(wPos.xyz, 1.0));
        mat.vertexNode = cameraProjectionMatrix.mul(vec4(rViewPos.xyz, 1.0));
        const rCol = rColBuf.element(storageIdx);
        mat.colorNode = vec4(rCol.xyz, mul(rCol.w, this.uniforms.pointOpacity));

        const mesh = new THREE.InstancedMesh(quadGeo, mat, instanceCount);
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        mesh.matrixWorld.identity();
        mesh.visible = false;
        mesh.count = 0;
        return mesh;
    }

    setupMesh() {
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.particleCount);
        this.mesh.count = Math.round(window.S.freeEnergy);
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    setupControls(canvas) {
        const cam = this.cam;
        const keys = {};

        canvas.addEventListener('mousedown', e => { 
            if (e.button === 1) return;
            cam.down = true; cam.mx = e.clientX; cam.my = e.clientY; 
        });
        window.addEventListener('mouseup', () => cam.down = false);
        window.addEventListener('mousemove', e => {
            if (!cam.down) return;
            const dx = e.clientX - cam.mx;
            const dy = e.clientY - cam.my;
            cam.mx = e.clientX;
            cam.my = e.clientY;
            
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                if (window.sysRadial) window.sysRadial.close(true);
                if (window.envRadial) window.envRadial.close(true);
                if (window.cfgRadial) window.cfgRadial.close(true);
            }

            if (window.S.moveMode === 'orbit') {
                const angle = Math.sqrt(dx * dx + dy * dy) * 0.006;
                if (angle > 0.0001) {
                    const axis = new THREE.Vector3(dy, dx, 0).normalize();
                    const qOff = new THREE.Quaternion().setFromAxisAngle(axis, angle);
                    cam.quat.multiply(qOff).normalize();
                }
            } else {
                cam.yaw -= dx * 0.003;
                cam.pitch -= dy * 0.003;
                cam.pitch = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, cam.pitch));
            }
        });

        canvas.addEventListener('wheel', e => {
            if (window.S.moveMode === 'orbit') {
                const wOrS = (this._keys && (this._keys['KeyW'] || this._keys['KeyS']));
                if (wOrS) {
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    cam.orbitZoomSpeed = Math.max(0.1, Math.min(10, cam.orbitZoomSpeed + delta));
                } else {
                    const zoomFactor = 1.0 + (e.deltaY > 0 ? 0.08 : -0.08);
                    cam.distTarget = Math.max(5, Math.min(5000, cam.distTarget * zoomFactor));
                }
            } else {
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                cam.flyMoveSpeed = Math.max(0.05, Math.min(20, cam.flyMoveSpeed + delta));
            }
        }, { passive: true });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });

        window.addEventListener('keydown', e => {
            // Skip keys destined for any text-input surface. Three categories:
            //   1. <input> / <textarea>  — native form fields
            //   2. contenteditable="true" — our editable .val spans on
            //      every slider (added in the click-to-edit feature). If
            //      we don't guard against these, arrow keys both move the
            //      caret AND rotate the camera, which is jarring.
            //   3. isContentEditable also catches inheritance cases (e.g.
            //      a contenteditable ancestor) which a plain attribute
            //      check would miss.
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            keys[e.code] = true;

            if (e.code === 'Tab') {
                e.preventDefault();
                window.setUIVisibility(!window.uiVisible);
            }
            if (e.code === 'Home') {
                e.preventDefault();
                // Travel to user-saved homepoint if one exists; the helper
                // toasts a hint if not. Old behavior (hard camera reset) is
                // gone — users who relied on that can save a homepoint at
                // {0,0,300} once and the same key will do the same thing.
                if (window.travelToHomepoint) window.travelToHomepoint();
            }
        });
        window.addEventListener('keyup', e => { keys[e.code] = false; });

        const clearAllInputState = () => {
            for (const k in keys) keys[k] = false;
            cam.down = false;
        };
        window.addEventListener('blur', clearAllInputState);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearAllInputState();
            } else {
                clearAllInputState();
                window._fpsLastTime = performance.now();
                if (window.transition) {
                    window.transition.startTime = performance.now() - window.transition.duration;
                }
            }
        });

        this._keys = keys;
    }

    _updateCamera() {
        const cam = this.cam;
        const keys = this._keys || {};
        if (keys['ControlLeft'] || keys['ControlRight'] || keys['MetaLeft'] || keys['MetaRight']) return;

        if (window.S.moveMode === 'orbit') {
            if (keys['KeyW']) {
                cam.distTarget = Math.max(5, cam.distTarget - cam.distTarget * 0.01 * cam.orbitZoomSpeed);
            }
            if (keys['KeyS']) {
                cam.distTarget = Math.min(5000, cam.distTarget + cam.distTarget * 0.01 * cam.orbitZoomSpeed);
            }
            
            let oDx = 0, oDy = 0;
            if (keys['ArrowLeft']) oDx = -2;
            if (keys['ArrowRight']) oDx = 2;
            if (keys['ArrowUp']) oDy = -2;
            if (keys['ArrowDown']) oDy = 2;
            if (oDx !== 0 || oDy !== 0) {
                const angle = Math.sqrt(oDx * oDx + oDy * oDy) * 0.015;
                const axis = new THREE.Vector3(oDy, oDx, 0).normalize();
                const qOff = new THREE.Quaternion().setFromAxisAngle(axis, angle);
                cam.quat.multiply(qOff).normalize();
            }

            cam.dist += (cam.distTarget - cam.dist) * 0.12;

            const forward = new THREE.Vector3(0, 0, cam.dist);
            forward.applyQuaternion(cam.quat);
            this.camera.position.copy(forward);
            this.camera.lookAt(cam.target);
        } else if (window.S.moveMode === 'hybrid') {
            const speed = cam.dist * 0.01 * cam.flyMoveSpeed;
            if (keys['KeyW']) cam.distTarget = Math.max(5, cam.distTarget - speed);
            if (keys['KeyS']) cam.distTarget = Math.min(5000, cam.distTarget + speed);
            if (keys['KeyA']) cam.yaw -= 0.02 * cam.flyMoveSpeed;
            if (keys['KeyD']) cam.yaw += 0.02 * cam.flyMoveSpeed;
            if (keys['ArrowLeft']) cam.yaw += 0.02;
            if (keys['ArrowRight']) cam.yaw -= 0.02;
            if (keys['ArrowUp']) cam.pitch += 0.02;
            if (keys['ArrowDown']) cam.pitch -= 0.02;
            
            cam.dist += (cam.distTarget - cam.dist) * 0.12;
            cam.quat.setFromEuler(new THREE.Euler(cam.pitch, cam.yaw, 0, 'YXZ'));
            const fwdH = new THREE.Vector3(0, 0, cam.dist);
            fwdH.applyQuaternion(cam.quat);
            this.camera.position.copy(fwdH);
            this.camera.lookAt(cam.target);
        } else {
            const baseSpeed = Math.max(1, cam.pos.length() * 0.005);
            const speed = baseSpeed * cam.flyMoveSpeed;
            const fwd = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(cam.pitch, cam.yaw, 0, 'YXZ'));
            const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, cam.yaw, 0, 'YXZ'));
            const up = new THREE.Vector3(0, 1, 0);

            if (keys['KeyW']) cam.pos.addScaledVector(fwd, speed);
            if (keys['KeyS']) cam.pos.addScaledVector(fwd, -speed);
            if (keys['KeyA']) cam.pos.addScaledVector(right, -speed);
            if (keys['KeyD']) cam.pos.addScaledVector(right, speed);
            if (keys['Space']) cam.pos.addScaledVector(up, speed);
            if (keys['ShiftLeft']) cam.pos.addScaledVector(up, -speed);
            
            if (keys['ArrowLeft']) cam.yaw += 0.02;
            if (keys['ArrowRight']) cam.yaw -= 0.02;
            if (keys['ArrowUp']) cam.pitch += 0.02;
            if (keys['ArrowDown']) cam.pitch -= 0.02;

            this.camera.position.copy(cam.pos);
            this.camera.rotation.set(cam.pitch, cam.yaw, 0, 'YXZ');
        }
    }

    updateUniforms() {
        const S = window.S;
        const Eff = window.S_effective || {};
        const v = (k) => (Eff[k] !== undefined) ? Eff[k] : S[k];
        const U = this.uniforms;
        U.mass.value = v('mass');
        U.viscosity.value = v('viscosity');
        U.tempo.value = v('tempo');
        U.inversion.value = v('inversion');
        U.temperature.value = v('temperature');
        U.equilibrium.value = v('equilibrium');
        U.coherence.value = v('coherence');
        U.scaleDepth.value = v('scaleDepth');
        U.pointSize.value = v('resolution');
        U.pointOpacity.value = v('opacity');
        if (U.halfLife) U.halfLife.value = v('halfLife') ?? 15.0;
        if (U.camPos) U.camPos.value.copy(this.camera.position);
        if (U.trailLen) U.trailLen.value = v('trailLen') ?? 5.0;
        if (U.offsetX) U.offsetX.value = S.offsetX;
        if (U.offsetY) U.offsetY.value = S.offsetY;
        if (U.offsetZ) U.offsetZ.value = S.offsetZ;
        if (U.billboardOffset) U.billboardOffset.value = S.billboardOffset;
        if (U.colorMode) U.colorMode.value = S.colorMode || 0;
        if (U.colorRange) U.colorRange.value = v('hue');
        if (U.sat) U.sat.value = v('sat') ?? 0.8;
        if (U.activeParticleCount) U.activeParticleCount.value = Math.round(v('freeEnergy'));
        if (U.shape) U.shape.value = S.shape === 'square' ? 1 : (S.shape === 'diamond' ? 2 : 0);

        if (this.bgCanvas && v('bgGlow') > 0) {
            const mode = S.colorMode || 0;
            const hRaw = v('hue') || 0.5;
            const sVal = Math.round((v('sat') ?? 0.8) * 100);
            const h = Math.round(hRaw * 360);
            // Backdrop colors are anchored NEAR the particles' base hue with
            // small ±30° offsets per mode. Previous logic computed `spread`
            // from hRaw itself, which meant blue hues produced 260° spreads
            // and put RED on the screen even when particles were blue. The
            // backdrop should sample from the particle palette, not invent
            // its own wide gradient.
            let gradientStr = '';
            if (mode === 0) {
                const h2 = (h + 20) % 360;
                gradientStr = `radial-gradient(ellipse at center, hsl(${h},${sVal}%,16%) 0%, hsl(${h2},${sVal}%,8%) 50%, transparent 80%)`;
            } else if (mode === 1) {
                // Rainbow particles — keep the backdrop in a tight band
                // around the base hue instead of fanning across the wheel
                const h2 = (h + 15) % 360;
                const h3 = (h + 30) % 360;
                gradientStr = `radial-gradient(ellipse at center, hsl(${h2},${sVal}%,18%) 0%, hsl(${h3},${sVal}%,10%) 45%, hsl(${h},${sVal}%,5%) 70%, transparent 90%)`;
            } else if (mode === 2) {
                // Gradient particles — small symmetric offset, not spread
                const hLow  = (h - 20 + 360) % 360;
                const hHigh = (h + 20) % 360;
                gradientStr = `radial-gradient(ellipse at center, hsl(${hHigh},${sVal}%,18%) 0%, hsl(${h},${sVal}%,9%) 35%, hsl(${hLow},${sVal}%,4%) 75%, transparent 90%)`;
            } else if (mode === 3) {
                // Solid-mode core gets a complementary tint, but keep the
                // outer falloff at the base hue so the eye stays grounded.
                const hCore = (h + 30) % 360;
                gradientStr = `radial-gradient(ellipse at center, hsl(${hCore},${sVal}%,22%) 0%, hsl(${h},${sVal}%,12%) 30%, hsl(${h},${sVal}%,5%) 60%, transparent 85%)`;
            }
            this.bgCanvas.style.background = gradientStr;
            this.bgCanvas.style.opacity = Math.min(1, v('bgGlow') * 1.5).toFixed(2);
        } else if (this.bgCanvas) {
            this.bgCanvas.style.opacity = '0';
        }
    }

    saveCameraState() {
        if (!this.cam) return;
        const now = performance.now();
        if (!this._lastCamSave || now - this._lastCamSave > 500) {
            this._lastCamSave = now;
            const state = {
                pos: this.cam.pos.toArray(),
                quat: this.cam.quat.toArray(),
                dist: this.cam.dist,
                distTarget: this.cam.distTarget,
                yaw: this.cam.yaw,
                pitch: this.cam.pitch,
                flyMoveSpeed: this.cam.flyMoveSpeed,
                orbitZoomSpeed: this.cam.orbitZoomSpeed
            };
            try { localStorage.setItem('ss_cam', JSON.stringify(state)); } catch(e){}
        }
    }

    async render() {
        this.updateUniforms();
        this.updateNavigationArrow();

        if (window.S.tempo > 0.0) {
            try {
                await this.renderer.computeAsync(this.computeClearNode);
                await this.renderer.computeAsync(this.computeAssignNode);
                await this.renderer.computeAsync(this.computeNode);
            } catch (e) {
                console.error("Compute Error:", e);
            }
        }

        const xf = window.S._xfade;
        // _xfade values are authoritative whenever present. Their lifecycle:
        //   • set by tour transitions (multi-key, runs during window.transition)
        //   • set by fadeVisibilityKey on user toggles (per-key, short fade)
        //   • cleared on stopTour, fade completion, and transition end
        // The previous `transitioning` gate is gone — those cleanup paths are
        // now the single source of truth that prevents stale xfade values
        // from pinning visibility (the original Quanta bug class). With this
        // change, user toggles of Quanta/Strings/Lattice get the same smooth
        // fade that tour transitions do.
        //
        // _xfadeEnv is a SEPARATE channel for the color-mode V-envelope dip.
        // It's multiplied onto each layer's alpha so a color-mode change
        // dips everything visible to ~0 at midpoint without disturbing any
        // in-flight per-layer fades. Defaults to 1 when no envelope is
        // active. See fadeColorModeChange() for the writer side.
        const envMul = (window.S._xfadeEnv !== undefined) ? window.S._xfadeEnv : 1;

        if (this.mesh) {
            const showP = (window.S.showParticles !== false);
            const xfP = (xf && xf.particles !== undefined) ? xf.particles : null;
            const baseAlpha = (xfP !== null) ? xfP : (showP ? 1 : 0);
            const alpha = baseAlpha * envMul;
            const shouldRender = alpha > 0.001;
            this.mesh.visible = shouldRender;
            if (shouldRender) {
                this.mesh.count = Math.min(Math.max(0, Math.round(window.S.freeEnergy)), this.particleCount);
            } else {
                // Belt-and-suspenders: even with mesh.visible=false, zero out
                // the instance count so no draw call can sneak through if a
                // future renderer path bypasses the visibility flag.
                this.mesh.count = 0;
            }
            if (this.mesh.material) {
                this.mesh.material.opacity = alpha;
                this.mesh.material.transparent = true;
            }
        }

        if (this.ribbonMesh) {
            // Strings: read xfade if present, else hard state. Compute is
            // gated on the boolean (still runs/doesn't run as before), so
            // we only fade the material.opacity here — geometry generation
            // never sees a half-faded state. Same lifecycle for tessRibbons
            // below. Color-mode envelope multiplies onto this alpha too.
            const showR = !!window.S.showRibbons;
            const xfR = (xf && xf.ribbons !== undefined) ? xf.ribbons : null;
            const baseAlpha = (xfR !== null) ? xfR : (showR ? 1 : 0);
            const alpha = baseAlpha * envMul;
            const shouldRender = alpha > 0.001;
            // Compute decision uses the BASE alpha (pre-envelope) so the
            // envelope dip doesn't pause geometry updates mid-flip. If
            // ribbons are "logically on", compute runs through the dip and
            // we just fade the material.
            const baseOn = baseAlpha > 0.001;
            this.ribbonMesh.visible = shouldRender;
            if (baseOn && this.computeRibbonNode) {
                try {
                    await this.renderer.computeAsync(this.computeRibbonNode);
                    const activeN = Math.min(Math.round(window.S.freeEnergy), this._ribbonN);
                    this.ribbonMesh.count = Math.max(0, activeN - 1) * this._ribbonS;
                } catch(e) { console.error('Ribbon error:', e); }
            }
            if (this.ribbonMesh.material) {
                this.ribbonMesh.material.opacity = alpha;
                this.ribbonMesh.material.transparent = true;
            }
        }

        if (this.latticeMesh) {
            // Lattice: same fade pattern as ribbons above.
            const showL = !!window.S.tessRibbons;
            const xfL = (xf && xf.lattice !== undefined) ? xf.lattice : null;
            const baseAlpha = (xfL !== null) ? xfL : (showL ? 1 : 0);
            const alpha = baseAlpha * envMul;
            const shouldRender = alpha > 0.001;
            const baseOn = baseAlpha > 0.001;
            this.latticeMesh.visible = shouldRender;
            if (baseOn && this.computeLatticeNode) {
                try {
                    await this.renderer.computeAsync(this.computeLatticeNode);
                    const activeN = Math.min(Math.round(window.S.freeEnergy), this._latticeN);
                    this.latticeMesh.count = Math.max(0, activeN - 1);
                } catch(e) { console.error('Lattice error:', e); }
            }
            if (this.latticeMesh.material) {
                this.latticeMesh.material.opacity = alpha;
                this.latticeMesh.material.transparent = true;
            }
        }

        this._updateCamera();
        this.saveCameraState();

        try {
            await this.renderer.render(this.scene, this.camera);
        } catch (e) {
            console.error("Render Error:", e);
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────
//   5. RadialUI
// ───────────────────────────────────────────────────────────────────────────

export function initRadialUI() {

    console.log(
        '%c Scale Space Synthesist %c v' + (window.SS_VERSION || '0.1') + ' \n' +
        '%c r/ScaleSpace: %chttps://reddit.com/r/ScaleSpace\n' +
        '%c itch.io:      %chttps://setzstone.itch.io/scale-space',
        'background:#ffaa55;color:#0c0c1f;font-weight:bold;padding:3px 6px;border-radius:2px 0 0 2px;',
        'background:#2a1f15;color:#ffaa55;padding:3px 6px;border-radius:0 2px 2px 0;',
        'color:#7a9acc;',  'color:#cce6ff;text-decoration:underline;',
        'color:#7a9acc;',  'color:#cce6ff;text-decoration:underline;'
    );
    const systemControls = [
      { key: 'freeEnergy', label: 'Free Energy', min: 500, max: 1000000, step: 100, sensitivity: 950, format: value => Math.round(value).toLocaleString() },
      { key: 'resolution', label: 'Resolution', min: 0.1, max: 20, step: 0.1, sensitivity: 0.035, format: value => value.toFixed(1) },
      { key: 'scaleDepth', label: 'Scale Depth', min: 0, max: 5, step: 0.01, sensitivity: 0.018, format: value => value.toFixed(2) },
      { key: 'equilibrium', label: 'Equilibrium', min: 0.001, max: 0.2, step: 0.001, sensitivity: 0.001, format: value => value.toFixed(3) },
      { key: 'mass', label: 'Mass', min: 0.1, max: 5, step: 0.05, sensitivity: 0.02, format: value => value.toFixed(2) }, null,
      { key: 'viscosity', label: 'Viscosity', min: 0, max: 1, step: 0.01, sensitivity: 0.006, format: value => value.toFixed(2) },
      { key: 'temperature', label: 'Temperature', min: 0, max: 3, step: 0.01, sensitivity: 0.015, format: value => value.toFixed(2) },
      { key: 'coherence', label: 'Coherence', min: 1, max: 200, step: 1, sensitivity: 0.75, format: value => Math.round(value).toString() },
      { key: 'halfLife', label: 'Half-Life', min: 0, max: 30, step: 0.1, sensitivity: 0.12, format: value => value.toFixed(1) },
      { key: 'inversion', label: 'Inversion', min: 30, max: 500, step: 1, sensitivity: 1.8, format: value => Math.round(value).toString() },
      { key: 'tempo', label: 'Tempo', min: 0, max: 2, step: 0.01, sensitivity: 0.012, format: value => value.toFixed(2) }
    ];

    const environmentControls = [
      { key: 'showRibbons', label: 'Strings', type: 'toggle' },
      { key: 'tessRibbons', label: 'Lattice', type: 'toggle' }, null,
      { key: 'trailLen', label: 'Trail Length', min: 3, max: 30, step: 1, sensitivity: 0.15, format: value => Math.round(value).toString() }, null, 
      { key: 'sat', label: 'Saturation', min: 0, max: 1, step: 0.01, sensitivity: 0.005, format: value => value.toFixed(2) },
      { key: 'colorMode', label: 'Color Mode', type: 'enum', options: [0, 1, 2, 3], labels: ['Base', 'Size', 'Velocity', 'Density'], sensitivity: 0.02 },
      { key: 'hue', label: 'Color Range', min: 0, max: 1, step: 0.01, sensitivity: 0.005, format: value => value.toFixed(2) },
      { key: 'newWaypoint', label: 'New Waypoint', type: 'trigger', action: () => window.captureWaypoint() },
      { key: 'startTour', label: 'Start Tour', type: 'trigger', action: () => { 
          if(window.tour && window.tour.active) { if(window.stopTour) window.stopTour(); }
          else { if(window.startTour) window.startTour(); }
      } },
      { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01, sensitivity: 0.005, format: value => value.toFixed(2) },
      { key: 'showParticles', label: 'Quanta', type: 'toggle' }
    ];

    const configControls = [
      { key: 'theme', label: 'Theme', type: 'enum', options: ['classic', 'synthesist'], labels: ['Classic', 'Synth'], sensitivity: 0.02 },
      { key: 'buttonShape', label: 'Button Shape', type: 'enum', options: ['hex', 'circle'], labels: ['Hex', 'Circle'], sensitivity: 0.02 },
      { key: 'uiScanlines', label: 'UI Scanlines', min: 0, max: 0.5, step: 0.01, sensitivity: 0.003, format: value => value.toFixed(2) },
      { key: 'bgGlow', label: 'Backdrop', min: 0, max: 0.8, step: 0.02, sensitivity: 0.005, format: value => value.toFixed(2) },
      { key: 'bgBlur', label: 'Backdrop Blur', min: 0, max: 100, step: 1, sensitivity: 0.4, format: value => Math.round(value).toString() }, null, 
      { key: 'uiZoom', label: 'UI Zoom', min: 0.5, max: 1.5, step: 0.05, sensitivity: 0.006, format: value => value.toFixed(2) },
      { key: 'screenScanlines', label: 'Screen Scan', min: 0, max: 0.5, step: 0.01, sensitivity: 0.003, format: value => value.toFixed(2) },
      { key: 'resetLayout', label: 'Reset Layout', type: 'trigger', action: function() { 
          localStorage.removeItem(`ss_radial_state_${this.id}`);
          const defaults = { 'radial-system': systemControls, 'radial-environment': environmentControls, 'radial-config': configControls };
          if (defaults[this.id]) {
             this.controls = [...defaults[this.id]];
             this.nodes.forEach((n, i) => this.updateNodeContent(i));
          }
          this.saveState();
          this.flashLock();
      }}, 
      { key: 'panelOpacity', label: 'Panel Opacity', min: 0, max: 1, step: 0.05, sensitivity: 0.006, format: value => value.toFixed(2) }, 
      { key: 'buttonOpacity', label: 'Button Opacity', min: 0, max: 1, step: 0.05, sensitivity: 0.006, format: value => value.toFixed(2) }, 
      { key: 'moveMode', label: 'Movement Type', type: 'enum', options: ['orbit', 'fly'], labels: ['Orbit', 'Fly'], sensitivity: 0.02 } 
    ];

    const nodeSize = 64;
    
    class RadialInstance {
        constructor(id, controls, reverseAngle) {
            this.id = id;
            this.controls = controls;
            this.reverseAngle = reverseAngle;
            RadialInstance.instances = RadialInstance.instances || [];
            RadialInstance.instances.push(this);
            this.container = document.createElement('div');
            this.container.className = 'radial';
            this.container.id = id;
            this.container.setAttribute('aria-hidden', 'true');
            this.container.innerHTML = `<div class="radial-bg" id="${id}-bg"></div><div class="band" id="${id}-band"></div>
            <div class="radial-lock" id="${id}-lock" title="Lock Menu Open">
                <svg viewBox="0 0 24 24" fill="currentColor"><path class="lock-path" d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>
            </div>
            <div class="readout" id="${id}-readout">
                <div class="readout-content">
                    <strong class="title"></strong>
                    <div class="value"></div>
                    <div class="meta"></div>
                    <div class="scope">
                        <svg viewBox="0 0 180 34" preserveAspectRatio="none" aria-hidden="true" style="opacity: 0.82 !important;">
                            <path fill="none" stroke="#ffffff" stroke-width="2" d="M0,17 L180,17"></path>
                        </svg>
                    </div>
                    <div class="toggle-ui" style="display:none;pointer-events:auto;">
                        <div class="opt on" data-val="true" style="cursor:pointer;">ON</div>
                        <div class="opt off" data-val="false" style="cursor:pointer;">OFF</div>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(this.container);

            this.bgGradient = document.getElementById(`${id}-bg`);
            this.band = document.getElementById(`${id}-band`);
            this.readout = document.getElementById(`${id}-readout`);
            
            this.readoutTitle = this.readout.querySelector('.title');
            this.readoutValue = this.readout.querySelector('.value');
            this.readoutMeta = this.readout.querySelector('.meta');
            this.readoutScope = this.readout.querySelector('.scope');
            this.readoutToggleUI = this.readout.querySelector('.toggle-ui');
            this.wavePath = this.readout.querySelector('path');
            
            const onBtn = this.readoutToggleUI.querySelector('[data-val="true"]');
            const offBtn = this.readoutToggleUI.querySelector('[data-val="false"]');
            
            const handleToggleClick = (state) => {
                if (this.active && this.active.control && this.active.control.type === 'toggle') {
                    this.active.toggleState = state;
                    this.setValue(this.active.control, state);
                    this.updateReadout(this.active.control, 0, 0, state);
                }
            };
            
            onBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); handleToggleClick(true); });
            offBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); handleToggleClick(false); });
            
            this.lockIcon = document.getElementById(`${id}-lock`);
            this.lockPath = this.lockIcon.querySelector('.lock-path');
            this.isLocked = false;
            this.hasFlashed = false;
            
            const closedPath = "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z";
            const openPath = "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z";

            this.lockIcon.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.isLocked = !this.isLocked;
                this.hasFlashed = false; // Reset flash state on toggle
                this.lockPath.setAttribute('d', this.isLocked ? "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" : "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z");
                this.lockIcon.classList.toggle('locked', this.isLocked);
                this.flashLock(); // Immediate white flash feedback
                this.saveState();
            });
            
            this.animateWave = this.animateWave.bind(this);
            
            this.active = null;
            this.closeTimer = 0;
            this.closeAnimationTimer = 0;
            this.waveAnimId = null;
            this.openTime = 0;
            this.originPoint = { x: 0, y: 0 };
            this.radialRadius = 140; 
            this.isPinned = false;
            
            // ─── Interaction tracking ──────────────────────────────────────
            this.lastMouseX = 0;
            this.lastMouseY = 0;
            
            this.onPointerMove = this.onPointerMove.bind(this);
            document.addEventListener('pointermove', this.onPointerMove);

            this.loadState();
        }

        saveState() {
            const data = {
                isLocked: this.isLocked,
                originX: this.originPoint.x,
                originY: this.originPoint.y,
                isOpen: this.isOpen
            };
            localStorage.setItem(`ss_radial_state_${this.id}`, JSON.stringify(data));
        }

        loadState() {
            try {
                const saved = localStorage.getItem(`ss_radial_state_${this.id}`);
                if (saved) {
                    const data = JSON.parse(saved);
                    this.isLocked = data.isLocked || false;
                    this.originPoint = { x: data.originX || 0, y: data.originY || 0 };
                    
                    if (this.isLocked) {
                        this.updateLockVisuals();
                    }
                    
                    if (data.isOpen) {
                        setTimeout(() => {
                            // Use a special flag to preserve lock on restore
                            this.isRestoring = true;
                            this.open(this.originPoint.x, this.originPoint.y);
                            this.isRestoring = false;
                        }, 100);
                    }
                }
            } catch (e) { console.error("Radial load error", e); }
        }

        updateLockVisuals() {
            const closedPath = "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z";
            const openPath = "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z";
            this.lockPath.setAttribute('d', this.isLocked ? closedPath : openPath);
            this.lockIcon.classList.toggle('locked', this.isLocked);
        }

        get isOpen() { return this.container.classList.contains('open'); }

        clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
        quantize(value, step) { return Number((Math.round(value / step) * step).toFixed(6)); }
        percent(control) { 
            if (control.type === 'toggle') return visibilityAlphaForKey(control.key) * 100;
            if (control.type === 'trigger') return 0;
            if (control.type === 'enum') return (window.S[control.key] / (control.options.length - 1)) * 100;
            return ((window.S[control.key] - control.min) / (control.max - control.min)) * 100; 
        }


        setValue(control, value) { 
            if (control.type === 'toggle') {
                const wasOn = !!window.S[control.key];
                const newOn = !!value;
                if (wasOn === newOn) return; // no-op; don't clear in-flight fade
                window.S[control.key] = newOn;
                // Fade visibility for the layer toggles (Quanta/Strings/
                // Lattice) so radial toggles match the panel-toggle behavior.
                if (VISIBILITY_XFADE_KEYS[control.key]) {
                    fadeVisibilityKey(control.key, wasOn ? 1 : 0, newOn ? 1 : 0);
                }
                // Notify cross-group listeners (e.g. Include sub-group enables
                // when a Save toggle flips). Same pattern as makeGroupToggles.
                const updaters = window._toggleUpdaters && window._toggleUpdaters[control.key];
                if (updaters) updaters.forEach(fn => { try { fn(); } catch (e) {} });
            } else if (control.type === 'enum') {
                // Resolve the requested option, then either fade (colorMode)
                // or assign immediately (other enums).
                let resolved;
                if (control.options.includes(value)) {
                    resolved = value;
                } else {
                    const idx = Math.max(0, Math.min(control.options.length - 1, Math.round(value)));
                    resolved = control.options[idx];
                }
                if (control.key === 'colorMode' && window.S.colorMode !== resolved) {
                    // V-envelope fade. The helper handles the discrete flip
                    // at the trough and persists state at completion.
                    fadeColorModeChange(resolved);
                } else {
                    window.S[control.key] = resolved;
                }
            } else {
                window.S[control.key] = this.clamp(this.quantize(value, control.step), control.min, control.max); 
                
                if (control.key === 'uiZoom') {
                    document.documentElement.style.setProperty('--ui-zoom', window.S[control.key]);
                }
                
                if (window.sliderSync && window.sliderSync[control.key]) {
                    window.sliderSync[control.key](window.S[control.key]);
                }
            }
            
            if (window.engine) window.engine.updateUniforms();
            this.updateActiveNode(control); 

            // Side-effect hooks for keys that need follow-up beyond just updating window.S. Theme/shape changes need apply functions.
            try {
                if (control.key === 'theme' || control.key === 'uiScanlines' || control.key === 'screenScanlines') {
                    applyTheme();
                } else if (control.key === 'buttonShape') {
                    applyButtonShape();
                }
            } catch (e) { /* side-effect must never break setValue */ }
        }

        setModulation(control, value) {
            const key = control.key + '_mod';
            window.S[key] = this.clamp(value, 0, 1);
            // Persistent storage
            try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) { }
            if (window.engine) window.engine.updateUniforms();
            this.updateActiveNode(control);
        }

        colorForPercent(value, alpha = 'var(--btn-alpha, 0.8)') {
            const pct = this.clamp(value, 0, 100) / 100;
            const hue = 208 - pct * 122;
            const light = 26 + pct * 12;
            return `hsl(${hue} 46% ${light}% / ${alpha})`;
        }

        layoutSlots() {
            // Circle layout: 12 nodes evenly distributed around a ring. Active when body[data-button-shape="circle"].
            if ((window.S?.buttonShape || 'hex') === 'circle') {
                const slots = [];
                const radius = 145;
                for (let i = 0; i < 12; i++) {
                    // Start from top (12 o'clock) going clockwise
                    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
                    slots.push({
                        dx: Math.cos(angle) * radius,
                        dy: Math.sin(angle) * radius
                    });
                }
                return slots;
            }

            // Hex layout: Honeycomb arrangement using axial hex coords.
            const r2Hexes = [
                {q: 0, r: -2},  // 0: Top
                {q: 1, r: -2},  // 1: Top-Right
                {q: 2, r: -2},  // 2: Top-Right-Right
                {q: 2, r: -1},  // 3: Right
                {q: 2, r: 0},   // 4: Bottom-Right-Right
                {q: 1, r: 1},   // 5: Bottom-Right
                {q: 0, r: 2},   // 6: Bottom
                {q: -1, r: 2},  // 7: Bottom-Left
                {q: -2, r: 2},  // 8: Bottom-Left-Left
                {q: -2, r: 1},  // 9: Left
                {q: -2, r: 0},  // 10: Top-Left-Left
                {q: -1, r: -1}  // 11: Top-Left
            ];
            
            const slots = [];
            for (let i = 0; i < 12; i++) {
                let q = r2Hexes[i].q;
                let r = r2Hexes[i].r;
                let dx = q * 58.5 * 1.04;
                let dy = (q * 34 + r * 68) * 1.04;
                slots.push({ dx, dy });
            }
            return slots;
        }

        // Recompute and apply slot positions to existing nodes. Called when the button shape changes (hex ↔ circle) so layout switches live.
        relayoutNodes() {
            const slots = this.layoutSlots();
            this.nodes.forEach((node, index) => {
                const slot = slots[index];
                if (!slot) return;
                const homeX = this.originPoint.x + slot.dx;
                const homeY = this.originPoint.y + slot.dy;
                node.dataset.homeX = homeX.toString();
                node.dataset.homeY = homeY.toString();
                node.style.left = `${homeX}px`;
                node.style.top  = `${homeY}px`;
            });
        }

        updateActiveNode(control) {
            const node = this.container.querySelector(`[data-key="${control.key}"]`);
            if (node) {
                let valStr = '';
                if (control.type === 'toggle') valStr = formatToggleState(control.key);
                else if (control.type === 'enum') valStr = control.labels[control.options.indexOf(window.S[control.key])];
                else if (control.type === 'trigger') valStr = 'ACTIVATE';
                else valStr = (window.S[control.key] !== undefined) ? control.format(window.S[control.key]) : '0.00';
                
                const em = node.querySelector('em');
                if (em) em.textContent = valStr;
                node.setAttribute('aria-label', `${control.label}: ${valStr}`);
                node.style.setProperty('--value-color', this.colorForPercent(this.percent(control)));
            }
            if (this.active && this.active.control === control) {
                this.updateReadout(control, this.active.delta, this.active.modulation, this.active.toggleState);
            }
        }

        updateNodeContent(idx) {
            const node = this.nodes[idx];
            const control = this.controls[idx];
            if (!node) return;

            if (control === null) {
                node.classList.add('empty-slot');
                node.dataset.key = '';
                node.innerHTML = `<div class="hex-stroke-wrap"><svg viewBox="0 0 78 68"><polygon points="20.5,1 57.5,1 77,34 57.5,67 20.5,67 1,34"/></svg></div>`;
                return;
            }

            node.classList.remove('empty-slot');
            node.dataset.key = control.key;
            
            let valStr = '';
            try {
                if (control.type === 'toggle') valStr = formatToggleState(control.key);
                else if (control.type === 'enum') valStr = control.labels[control.options.indexOf(window.S[control.key])];
                else if (control.type === 'trigger') valStr = 'ACTIVATE';
                else valStr = (window.S[control.key] !== undefined) ? control.format(window.S[control.key]) : '0.00';
            } catch (e) { valStr = '---'; }

            let label = control.label;
            if (control.key === 'startTour' && window.tour && window.tour.active) {
                label = 'Pause Tour';
                valStr = '';
            }

            node.style.setProperty('--value-color', this.colorForPercent(this.percent(control)));
            node.innerHTML = `
                <div class="hex-stroke-wrap"><svg viewBox="0 0 78 68"><polygon points="20.5,1 57.5,1 77,34 57.5,67 20.5,67 1,34"/></svg></div>
                <span><strong>${label}</strong><em>${valStr}</em></span>`;
        }

        open(x, y) {
            // If already locked and open, do nothing
			// (prevents accidental unlocking/moving)
            if (this.isLocked && this.isOpen) return; 
            
            // Only reset lock if it was CLOSED (fresh manual open)
            if (!this.isOpen && !this.isRestoring) {
                this.isLocked = false;
                this.updateLockVisuals();
            }
            
            clearTimeout(this.closeTimer);
            
            // If restoring from saved state, x/y are already layout pixels.
			// If from a mouse click, they are screen pixels and need division.
            const zoom = window.S.uiZoom || 1.0;
            const layoutX = x / zoom;
            const layoutY = y / zoom;
            
            this.build(layoutX, layoutY);
            
            this.container.classList.add('opening');
            this.saveState();
            setTimeout(() => this.container.classList.remove('opening'), 300);
        }

        build(x, y) {
            clearTimeout(this.closeAnimationTimer);
            this.container.classList.remove('open', 'closing', 'dragging', 'clicked');
            this.container.querySelectorAll('.radial-node').forEach(node => node.remove());
            this.isPinned = false;
            this.openTime = performance.now();
            
            const slots = this.layoutSlots(this.controls.length);
            this.radialRadius = 140; // Fixed radius to account for inner hole
            
            this.originPoint.x = this.clamp(x, this.radialRadius + nodeSize / 2 + 14, window.innerWidth - this.radialRadius - nodeSize / 2 - 14);
            this.originPoint.y = this.clamp(y, this.radialRadius + nodeSize / 2 + 14, window.innerHeight - this.radialRadius - nodeSize / 2 - 14);
            
            this.container.style.setProperty('--origin-x', `${this.originPoint.x}px`);
            this.container.style.setProperty('--origin-y', `${this.originPoint.y}px`);
            this.band.style.left = `${this.originPoint.x}px`;
            this.band.style.top = `${this.originPoint.y}px`;
            this.band.style.opacity = '0';
            this.readout.style.left = `${this.originPoint.x}px`;
            this.readout.style.top = `${this.originPoint.y}px`;
            
            this.lockIcon.style.left = `${this.originPoint.x}px`;
            this.lockIcon.style.top = `${this.originPoint.y + 72}px`;
            this.lockIcon.style.display = 'grid';
            
			// ─── Set Default Menu Title when opening ───────────────────────
            const titleMap = { 'radial-system': 'PARAMETERS', 'radial-environment': 'VISUALS', 'radial-config': 'CONFIG' };
            this.readoutTitle.textContent = titleMap[this.id] || '';
            this.readoutTitle.style.display = 'block'; // ensure visible
            this.readoutValue.style.display = 'none';
            this.readoutMeta.style.display = 'none';
            this.readoutScope.style.display = 'none';
            this.readoutToggleUI.style.display = 'none';
            this.readout.classList.add('visible');
            this.bgGradient.classList.add('visible');
            
            this.nodes = []; // Track DOM nodes perfectly 1:1 with controls
            
            this.controls.forEach((control, index) => {
                const slot = slots[index];
                const dx = slot.dx;
                const dy = slot.dy;
                const homeX = this.originPoint.x + dx;
                const homeY = this.originPoint.y + dy;
                
                const node = document.createElement('button');
                node.addEventListener('mousedown', e => { if(e.button === 1) e.preventDefault(); });
                node.type = 'button';
                node.className = 'radial-node';
                node.dataset.homeX = homeX.toString();
                node.dataset.homeY = homeY.toString();
                node.style.left = `${homeX}px`;
                node.style.top = `${homeY}px`;
                node.style.setProperty('--delay', `${index * 15}ms`);
                
                this.nodes.push(node);
                this.container.appendChild(node);
                this.updateNodeContent(index);
                
                node.addEventListener('pointerdown', event => this.startDrag(event, control, node));
                
                node.getBoundingClientRect(); 
                
                requestAnimationFrame(() => {
                    this.container.classList.add('open');
                });
            });
            this.container.setAttribute('aria-hidden', 'false');
        }

        startDrag(event, control, node) {
            if (event.button > 2) return;
            // Only enforce open-cooldown on the very first grab after menu open (no active drag yet)
            if (!this.active && performance.now() - this.openTime < 280) return;
            
            event.preventDefault();
            event.stopPropagation();
            clearTimeout(this.closeTimer);
            const originX = parseFloat(this.container.style.getPropertyValue('--origin-x'));
            const originY = parseFloat(this.container.style.getPropertyValue('--origin-y'));
            
            // Center is already in layout pixels
            const centerX = originX;
            const centerY = originY;
            
            let baseValue = window.S[control.key];
            if (control.type === 'enum') {
                baseValue = control.options.indexOf(baseValue);
                if (baseValue === -1) baseValue = 0; 
            } else if (control.type === 'toggle') {
                baseValue = baseValue ? 0 : 1; 
            }

            if (this.active && this.active.node !== node) {
                this.active.node.classList.remove('active');
                this.active.node.style.pointerEvents = 'auto';
            }

                const zoom = window.S.uiZoom || 1.0;
                this.active = { 
                    control, 
                    node, 
                    grabX: event.clientX / zoom, 
                    grabY: event.clientY / zoom, 
                    grabOffsetX: parseFloat(node.dataset.homeX) - (event.clientX / zoom), 
                    grabOffsetY: parseFloat(node.dataset.homeY) - (event.clientY / zoom), 
                startZoom: zoom,
                baseValue: baseValue, 
                delta: 0, 
                modulation: 0,
                buttonPressed: event.button, 
                toggleState: window.S[control.key],
                isDrag: false,
                baseModulation: window.S[control.key + '_mod'] || 0
            };
            
            node.classList.add('active');
            node.style.transition = 'none';
            this.container.classList.remove('clicked');
            
            node.setPointerCapture(event.pointerId);
            
            this.dragMoveHandler = e => this.onDrag(e);
            this.dragStopHandler = e => this.stopDrag(e);
            node.addEventListener('pointermove', this.dragMoveHandler);
            node.addEventListener('pointerup', this.dragStopHandler, { once: true });
            node.addEventListener('pointercancel', this.dragStopHandler, { once: true });
            
            this.band.style.opacity = '0';
            this.lastSwapTime = 0; // Reset cooldown
            this.updateReadout(control, 0, 0, this.active.toggleState);
        }

        onDrag(event) {
            if (!this.active) return;
            const control = this.active.control;
            const zoom = this.active.startZoom || 1.0;
            const dx = (event.clientX / zoom) - this.active.grabX;
            const dy = (event.clientY / zoom) - this.active.grabY;
            
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                if (!this.active.isDrag) {
                    this.active.isDrag = true;
                    if (this.active.buttonPressed === 1) {
						
						// ─── Reorder mode ──────────────────────────────────
                        this.container.classList.add('dragging-reorder');
                        this.active.reorderFromIdx = this.nodes.indexOf(this.active.node);
                        this.active.reorderHoverIdx = undefined;
                        this.active.node.classList.add('reorder-active');
                        this.active.node.classList.remove('active');
                        // Create ghost placeholder at home position
                        const ghost = document.createElement('div');
                        ghost.className = 'radial-node reorder-ghost';
                        ghost.innerHTML = `<div class="hex-stroke-wrap"><svg viewBox="0 0 78 68"><polygon points="20.5,1 57.5,1 77,34 57.5,67 20.5,67 1,34"/></svg></div>`;
                        ghost.style.left = this.active.node.dataset.homeX + 'px';
                        ghost.style.top  = this.active.node.dataset.homeY + 'px';
                        ghost.style.position = 'absolute';
                        ghost.style.transform = 'translate(-50%,-50%)';
                        ghost.style.width = '78px';
                        ghost.style.height = '68px';
                        ghost.style.opacity = '1';
                        ghost.style.zIndex = '108';
                        ghost.style.pointerEvents = 'none';
                        this.container.appendChild(ghost);
                        this.active.ghost = ghost;
                    } else if (control.key !== 'buttonOpacity') {
                        this.container.classList.add('dragging');
                    }
                }
            }
            
            if (!this.active.isDrag) return;
            
            const originX = parseFloat(this.container.style.getPropertyValue('--origin-x'));
            const originY = parseFloat(this.container.style.getPropertyValue('--origin-y'));
            
            // New origin point in layout pixels
            let nodeX = (event.clientX / zoom) + this.active.grabOffsetX;
            let nodeY = (event.clientY / zoom) + this.active.grabOffsetY;
            
            // Middle mouse = reorder only — skip ALL value-change logic
            if (this.active.buttonPressed === 1) {
                // fall through to reorder block below
            }
            // Left (0) and Right (2) clicks only — middle mouse is reorder-only, never changes value
            else if (control.type === 'toggle' || control.type === 'enum') {
                const options = (control.type === 'enum') ? control.options : [true, false]; // ON is index 0
                const steps = options.length;
                const stepSize = 40; // Pixels per discrete step
                
                const currentDy = (event.clientY / this.active.startZoom) - this.active.grabY;
                const index = this.clamp(this.active.baseValue + Math.round(currentDy / stepSize), 0, steps - 1);
                
                if (control.type === 'enum') {
                    this.setValue(control, options[index]);
                } else {
                    this.setValue(control, options[index]); // true for 0, false for 1
                }
                
                const hx = parseFloat(this.active.node.dataset.homeX);
                const hy = parseFloat(this.active.node.dataset.homeY);
                
                // Snap node position relative to its HOME position
                nodeY = hy + (index - this.active.baseValue) * stepSize;
                nodeX = hx; 
                this.active.toggleState = options[index];
            } else if (control.type === 'trigger') {
                // Triggers do NOT move or update in onDrag
                return;
            } else {
                let dragAmount = 0;
                const isXY = (event.buttons === 3); // Both left and right buttons held
                
                if (isXY) {
                    // Unified 2D: Y=Value, X=Modulation
                    dragAmount = -dy; 
                    this.active.modulation = this.clamp(this.active.baseModulation + dx / 400, 0, 1);
                } else if (this.active.buttonPressed === 0) {
                    // Left click ONLY: Y axis (Vertical) for Parameter Value
                    dragAmount = -dy;
                    nodeX = this.active.grabX + this.active.grabOffsetX; // Lock Horizontal
                    this.active.modulation = this.active.baseModulation;
                } else if (this.active.buttonPressed === 2) {
                    // Right click ONLY: X axis (Horizontal) for Oscillation Wave (Modulation)
                    dragAmount = 0; 
                    nodeY = this.active.grabY + this.active.grabOffsetY; // Lock Vertical
                    this.active.modulation = this.clamp(this.active.baseModulation + dx / 400, 0, 1);
                }
                
                this.active.delta = dragAmount * control.sensitivity;
                this.setValue(control, this.active.baseValue + this.active.delta);
                if (this.active.modulation !== this.active.baseModulation) {
                    this.setModulation(control, this.active.modulation);
                }
            }
            
            // ─── Reorder (middle-click) ────────────────────────────────────
            if (this.active.buttonPressed === 1) {
                // Node follows mouse freely
                this.active.node.style.left = `${nodeX}px`;
                this.active.node.style.top  = `${nodeY}px`;
                
                // Find closest slot
                let closestIdx = -1;
                let closestDist = Infinity;
                this.nodes.forEach((n, i) => {
                    if (i === this.active.reorderFromIdx) return;
                    const hx = parseFloat(n.dataset.homeX);
                    const hy = parseFloat(n.dataset.homeY);
                    const d = Math.hypot(nodeX - hx, nodeY - hy);
                    if (d < closestDist) { closestDist = d; closestIdx = i; }
                });
                
                // Highlight closest target, clear others
                this.nodes.forEach((n, i) => {
                    if (i === this.active.reorderFromIdx) return;
                    if (i === closestIdx && closestDist < 90) {
                        n.classList.add('drop-target');
                        this.active.reorderHoverIdx = closestIdx;
                    } else {
                        n.classList.remove('drop-target');
                    }
                });
                if (closestDist >= 90) this.active.reorderHoverIdx = undefined;
                
                this.updateReadout(control, 0, 0, false);
                return;
            }
            
            // Visual feedback: Move the node and update the rubber band
            this.active.node.style.left = `${nodeX}px`;
            this.active.node.style.top = `${nodeY}px`;
            this.updateBand(nodeX, nodeY);
            
            this.updateReadout(control, this.active.delta, this.active.modulation, this.active.toggleState);
        }

        stopDrag(event) {
            if (event) event.stopPropagation();
            if (!this.active) return;
            const node = this.active.node;
            node.removeEventListener('pointermove', this.dragMoveHandler);
            node.removeEventListener('pointerup', this.dragStopHandler);
            node.removeEventListener('pointercancel', this.dragStopHandler);
            
            node.style.transition = 'transform 190ms ease, border-color 160ms ease, filter 160ms ease, background 160ms ease, left 280ms cubic-bezier(.4,.0,.2,1), top 280ms cubic-bezier(.4,.0,.2,1)';
            node.style.left = `${node.dataset.homeX}px`;
            node.style.top = `${node.dataset.homeY}px`;
            
            if (this.active.buttonPressed === 1 && this.active.isDrag) {
                // Commit reorder
                const dragIdx = this.active.reorderFromIdx;
                const dropIdx = this.active.reorderHoverIdx;
                // Remove ghost
                if (this.active.ghost) { this.active.ghost.remove(); this.active.ghost = null; }
                // Restore node class
                node.classList.remove('reorder-active');
                node.classList.add('active');
                if (dragIdx !== undefined && dropIdx !== undefined && dragIdx !== dropIdx) {
                    const tmp = this.controls[dragIdx];
                    this.controls[dragIdx] = this.controls[dropIdx];
                    this.controls[dropIdx] = tmp;
                    try { localStorage.setItem(this.id + '_order', JSON.stringify(this.controls.map(c => c ? c.key : null))); } catch(e) {}
                }
                // Clean up all drag state FIRST
                this.active = null;
                this.container.classList.remove('dragging', 'dragging-reorder', 'clicked');
                this.band.style.opacity = '0';
                // Rebuild in-place
                const ox = this.originPoint.x;
                const oy = this.originPoint.y;
                this.container.querySelectorAll('.radial-node').forEach(n => n.remove());
                this.nodes = [];
                this.build(ox, oy);
                this.container.classList.add('open');
                return;
            }
            
            window.setTimeout(() => {
                if(node) node.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1), opacity 340ms ease, border-color 160ms ease, filter 160ms ease, background 160ms ease, left 280ms cubic-bezier(.4,.0,.2,1), top 280ms cubic-bezier(.4,.0,.2,1)';
            }, 220);
            
            this.container.classList.remove('dragging');
            this.container.classList.remove('dragging-reorder');
            this.band.style.opacity = '0';
            
            if (!this.active.isDrag && this.active.buttonPressed !== 1) {
                // Successful click (Not a drag)
                if (this.active.control.type === 'trigger') {
                    // Fire only if still hovering over the button on release
                    const elUnder = document.elementFromPoint(this.lastMouseX, this.lastMouseY);
                    const isOver = elUnder && (elUnder === node || node.contains(elUnder));
                    
                    if (isOver) {
                        if (this.active.control.action) this.active.control.action.call(this);
                        this.flashLock();
                        // Immediate label and readout update
                        const idx = this.nodes.indexOf(node);
                        if (idx !== -1) this.updateNodeContent(idx);
                        this.updateReadout(this.active.control, 0, 0, false);
                    }
                    this.active = null;
                    return;
                }

                // Pin state for other types
                this.isPinned = true;
                this.container.classList.add('clicked');
            } else {
                // Drag ended
                node.classList.remove('active');
                node.style.pointerEvents = 'auto';
                this.active = null;
                this.container.classList.remove('clicked');
                this.saveState();
                this.readoutMeta.style.display = 'none';
                this.readoutScope.style.display = 'none';
                this.readoutToggleUI.style.display = 'none';
            }
            
            try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
        }

        updateBand(x, y) {
            if (!this.active) return;
            const hx = parseFloat(this.active.node.dataset.homeX);
            const hy = parseFloat(this.active.node.dataset.homeY);
            const dx = x - hx;
            const dy = y - hy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.band.style.left = `${hx}px`;
            this.band.style.top = `${hy}px`;
            this.band.style.width = `${distance}px`;
            this.band.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
            // Tighter opacity fade for shorter rubber bands
            this.band.style.opacity = `${this.clamp(distance / 120, 0, 0.72)}`;
        }

        updateReadout(control, delta, modulation, toggleState) {
            this.readoutControl = control;
            this.readout.classList.add('visible');
            this.bgGradient.classList.add('visible');
            
            this.readoutTitle.textContent = control.label;
            
            if (this.active && this.active.buttonPressed === 1) {
                this.readoutValue.style.display = 'block';
                this.readoutMeta.style.display = 'block';
                this.readoutScope.style.display = 'none';
                this.readoutToggleUI.style.display = 'none';
                
                this.readoutValue.textContent = 'REORDER';
                this.readoutMeta.innerHTML = 'DRAG TO SWAP POSITIONS';
                return;
            }
            
            if (control.type === 'trigger') {
                this.readoutValue.style.display = 'block';
                this.readoutMeta.style.display = 'block';
                this.readoutScope.style.display = 'none';
                this.readoutToggleUI.style.display = 'none';
                
                if (control.key === 'startTour') {
                    const active = window.tour && window.tour.active;
                    this.readoutTitle.textContent = active ? 'Now Touring' : 'Tour Paused';
                    this.readoutValue.textContent = '';
                    this.readoutMeta.textContent = '';
                } else {
                    this.readoutValue.textContent = 'ACTIVATE';
                    this.readoutMeta.textContent = '';
                }
                return;
            }

            if (control.type === 'toggle') {
                this.readoutValue.style.display = 'none';
                this.readoutMeta.style.display = 'none';
                this.readoutScope.style.display = 'none';
                this.readoutToggleUI.style.display = 'flex';
                this.readoutToggleUI.innerHTML = `<span class="opt" data-val="true">ON</span><span class="opt" data-val="false">OFF</span>`;
                
                const onEl = this.readoutToggleUI.querySelector('[data-val="true"]');
                const offEl = this.readoutToggleUI.querySelector('[data-val="false"]');
                const liveToggleState = (this.active && this.active.control === control)
                    ? toggleState
                    : visibilityAlphaForKey(control.key) > 0.001;
					
                // Use the drag state when active, otherwise reflect live tour visibility.
                if (liveToggleState) { onEl.className = 'opt on'; offEl.className = 'opt'; }
                else { onEl.className = 'opt'; offEl.className = 'opt off'; }

                // Restore clickable options
                this.readoutToggleUI.querySelectorAll('.opt').forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newVal = opt.dataset.val === 'true';
                        this.setValue(control, newVal);
                        this.active.toggleState = newVal;
                        this.updateActiveNode(control);
                    });
                });
            } else if (control.type === 'enum') {
                this.readoutValue.style.display = 'none';
                this.readoutMeta.style.display = 'none';
                this.readoutScope.style.display = 'none';
                this.readoutToggleUI.style.display = 'flex';
                
                // Use the passed toggleState for immediate visual feedback during snap-drags
                const currentIdx = control.options.indexOf(toggleState);
                let html = '';
                control.labels.forEach((label, idx) => {
                    const isOn = idx === currentIdx;
                    html += `<span class="opt ${isOn ? 'on' : 'off'}">${label}</span>`;
                });
                this.readoutToggleUI.innerHTML = html;

                // Restore clickable options
                this.readoutToggleUI.querySelectorAll('.opt').forEach((opt, idx) => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newVal = control.options[idx];
                        this.setValue(control, newVal);
                        this.active.toggleState = newVal;
                        this.updateActiveNode(control);
                    });
                });
            } else {
                this.readoutValue.style.display = 'block';
                this.readoutMeta.style.display = 'block';
                this.readoutScope.style.display = 'block';
                this.readoutToggleUI.style.display = 'none';
                
                this.readoutValue.textContent = control.format(window.S[control.key]);
                const sign = delta >= 0 ? '+' : '-';
                const deltaText = `${sign}${control.format(Math.abs(delta))}`;
                const deltaClass = delta >= 0 ? 'delta-positive' : 'delta-negative';
                this.readoutMeta.innerHTML = `Δ <span class="${deltaClass}">${deltaText}</span> <span style="opacity:0.3;margin:0 4px">·</span> MOD ${Math.round(modulation * 100)}%`;
                
                if (!this.waveAnimId) {
                    this.waveAnimId = requestAnimationFrame(this.animateWave);
                }
            }
        }
        
        animateWave(time) {
            if (!this.readout.classList.contains('visible') && !this.container.classList.contains('dragging')) {
                this.waveAnimId = null;
                return; // Stop animating when hidden
            }
            
            const control = this.active ? this.active.control : null;
            if (!control) {
                this.waveAnimId = requestAnimationFrame(this.animateWave);
                return;
            }
            
            // Accurately reflect the actual parameter value
            const valPct = this.percent(control) / 100;
            
            const amp = 3 + valPct * 11;
            const freq = 1 + valPct * 5;
            
            // Time-based phase for continuous oscillation
            const phase = time * 0.005;
            
            const points = [];
            for (let x = 0; x <= 180; x += 6) {
                const y = 17 + Math.sin((x / 180) * Math.PI * 2 * freq + phase) * amp;
                points.push(`${x === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
            }
            this.wavePath.setAttribute('d', points.join(' '));
            
            // Optionally set color based on value. Wave line uses solid opacity to prevent vanishing when buttons are clear
            this.wavePath.style.stroke = this.colorForPercent(valPct * 100, 1.0);
            
            this.waveAnimId = requestAnimationFrame(this.animateWave);
        }

        flashLock() {
            this.lockIcon.style.color = '#fff';
            this.lockIcon.style.opacity = '1';
            setTimeout(() => {
                this.lockIcon.style.color = '';
                this.lockIcon.style.opacity = '';
            }, 250);
        }

        scheduleClose(delay = 1200) { 
            if (this.isLocked) return;
            clearTimeout(this.closeTimer); 
            this.closeTimer = window.setTimeout(() => this.close(true), delay); 
        }

        close(animate = true, afterClose) {
            if (this.isLocked && animate) return;
            clearTimeout(this.closeTimer);
            clearTimeout(this.closeAnimationTimer);
            if (!this.container.classList.contains('open')) {
                this.container.classList.remove('closing', 'dragging');
                this.active = null;
                if (afterClose) afterClose();
                return;
            }
            
            this.active = null;
            this.isPinned = false;
            this.container.classList.remove('dragging', 'open', 'clicked'); // Removes open, triggers main opacity fade to 0
            this.readout.classList.remove('visible');
            this.bgGradient.classList.remove('visible');
            this.band.style.opacity = '0';
            this.saveState();
            
            if (!animate) {
                this.container.classList.remove('closing');
                this.container.setAttribute('aria-hidden', 'true');
                if (afterClose) afterClose();
                return;
            }
            
            this.container.classList.add('closing');
            this.container.querySelectorAll('.radial-node').forEach((node, i) => {
                node.style.setProperty('--delay', `${i * 15}ms`);
                node.style.setProperty('--hscale', '1');
            });
            
            this.closeAnimationTimer = window.setTimeout(() => {
                this.container.classList.remove('closing');
                this.container.setAttribute('aria-hidden', 'true');
                this.container.querySelectorAll('.radial-node').forEach(node => node.remove());
                if (afterClose) afterClose();
            }, 300);
        }

        onPointerMove(event) {
            const zoom = window.S.uiZoom || 1.0;
            const mouseX = event.clientX / zoom;
            const mouseY = event.clientY / zoom;
            
            this.lastMouseX = event.clientX; // Screen space for elementFromPoint
            this.lastMouseY = event.clientY;
            
            if (!this.container.classList.contains('open')) return;
            
            // Check idle distance for Sticky Hover (using layout pixels)
            if (!this.active && !this.isPinned) {
                const dx = mouseX - this.originPoint.x;
                const dy = mouseY - this.originPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Sticky Hover: Only schedule close if the mouse moves far enough away.
                if (dist > this.radialRadius + 120) {
                    this.scheduleClose(950);
                } else {
                    clearTimeout(this.closeTimer); // Keep open
                }
            }

            // Visual Feedback: Glow on proximity (using layout pixels)
            if (!this.container.classList.contains('dragging') && !this.container.classList.contains('dragging-reorder')) {
                this.container.querySelectorAll('.radial-node:not(.empty-slot)').forEach(node => {
                    const nx = parseFloat(node.dataset.homeX);
                    const ny = parseFloat(node.dataset.homeY);
                    const dx = mouseX - nx;
                    const dy = mouseY - ny;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    let hglow = 0;
                    if (dist < 100) {
                        hglow = Math.max(0, 1 - dist / 60);
                    }
                    node.style.setProperty('--hglow', hglow);
                });
            }
        }
    }

    const sysRadial = new RadialInstance('radial-system', systemControls, false);
    const envRadial = new RadialInstance('radial-environment', environmentControls, true);
    const cfgRadial = new RadialInstance('radial-config', configControls, true); // Middle click

    window.sysRadial = sysRadial;
    window.envRadial = envRadial;
    window.cfgRadial = cfgRadial;
    window.RadialInstance = RadialInstance;

    RadialInstance.refreshAll = function() {
        RadialInstance.instances.forEach(m => {
            if (m.isOpen) {
                m.nodes.forEach((n, i) => m.updateNodeContent(i));
                // Update readout if we have a focused control
                if (m.readoutControl) {
                    m.updateReadout(m.readoutControl, 0, 0, false);
                }
            }
        });
    };
    window.refreshRadialUI = RadialInstance.refreshAll;

	// ─── Global Quick-Click Event Listeners ────────────────────────────────
    let clickStartX = 0;
    let clickStartY = 0;
    let clickStartTime = 0;

    const canvas = document.getElementById('cv') || document.body;
    
    canvas.addEventListener('pointerdown', e => { 
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        clickStartTime = performance.now();
        
        // HARD RULE: Radial can ONLY open if clicking the Play Space (canvas). Never on panels or buttons. Check if target is specifically the canvas or something with no ID inside it? No, just the canvas.
        if (e.target.id !== 'cv') return;
    });

    canvas.addEventListener('pointerup', e => {
        const dx = e.clientX - clickStartX;
        const dy = e.clientY - clickStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const time = performance.now() - clickStartTime;
        
        // Handle rapid clicks (swapping, closing, opening) BEFORE node blocking. Now safely reject normal UI interactions, including radial node drags (but NOT if we're swapping)
        if (e.target.id !== 'cv') return;

        // For a click in dead space, handle toggle/move behavior
        if (dist < 10 && time < 400) {
            const clickMap = { 0: sysRadial, 2: envRadial, 1: cfgRadial };
            const targetMenu = clickMap[e.button];
            
            if (targetMenu) {
                if (targetMenu.isOpen) {
                    const zoom = window.S.uiZoom || 1.0;
                    const distToCenter = Math.sqrt((e.clientX / zoom - targetMenu.originPoint.x)**2 + (e.clientY / zoom - targetMenu.originPoint.y)**2);
                    if (distToCenter < 100) {
                        if (targetMenu.isLocked) {
                            if (!targetMenu.hasFlashed) {
                                targetMenu.flashLock();
                                targetMenu.hasFlashed = true;
                            }
                        } else {
                            targetMenu.close(true);
                        }
                    } else {
                        // Move: Close other unlocked menus and re-open this one at new spot
                        [sysRadial, envRadial, cfgRadial].forEach(m => {
                            if (m !== targetMenu && !m.isLocked) m.close(true);
                        });
                        targetMenu.open(e.clientX, e.clientY);
                    }
                } else {
                    // Open: Close other unlocked menus and open this one
                    [sysRadial, envRadial, cfgRadial].forEach(m => {
                        if (!m.isLocked) m.close(true);
                    });
                    targetMenu.open(e.clientX, e.clientY);
                }
            } else {
                // Click with unmapped button or in dead space -> close any unlocked
                [sysRadial, envRadial, cfgRadial].forEach(m => {
                    if (!m.isLocked) m.close(true);
                });
            }
        } else {
            // Drag or slow click -> close radials (unless locked OR currently dragging a node)
            if (!sysRadial.isLocked && !sysRadial.active) sysRadial.close(true);
            if (!envRadial.isLocked && !envRadial.active) envRadial.close(true);
            if (!cfgRadial.isLocked && !cfgRadial.active) cfgRadial.close(true);
        }
    });

    // Suppress context menu globally so right-click drag works everywhere
    document.addEventListener('contextmenu', e => { 
        e.preventDefault(); 
    });
    
    document.addEventListener('mousedown', e => {
        if (e.button === 1) e.preventDefault();
    });

    window.addEventListener('keydown', e => {
        // Same skip-text-input rule as the camera handler above — typing
        // into a slider's editable .val span shouldn't dismiss an open
        // radial menu just because you pressed a letter key.
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.ctrlKey || e.metaKey) return; // Prevent movement when using shortcuts (like Ctrl+S)
        // NOTE: the keys[] state for camera movement is owned by engine.setupControls
        // and updated there. This listener only handles UI side-effects (radial close)
        // and shouldn't touch the camera key map.
        sysRadial.close(true);
        envRadial.close(true);
        cfgRadial.close(true);
    });
}

// ───────────────────────────────────────────────────────────────────────────
//   6. UI
// ───────────────────────────────────────────────────────────────────────────


export const sliderSync = {};
window.sliderSync = sliderSync;

	// ─── UI overlay functionality ──────────────────────────────────────────

export function setupUI(engine) {
    window.togglePanel = function (id) {
        const p = document.getElementById(id);
        if (!p) return;
        const b = p.querySelector('.panel-body'), t = p.querySelector('.toggle');
        if (b && t) {
            // Toggle visibility of the entire panel instead of just the body
            p.classList.toggle('hidden');
            if (!p.classList.contains('hidden')) {
                // When showing the panel, ensure the body is also visible
                b.classList.remove('hidden');
                t.textContent = '−';
            }
            savePanelPos();
            if (window.renderDock) window.renderDock();
        }
    };

    function clampPanels() {
        const zoom = window.S?.uiZoom || 1.0;
        // Layout space viewport size (panels live in this space)
        const vw = window.innerWidth / zoom;
        const vh = window.innerHeight / zoom;
        document.querySelectorAll('.panel').forEach(p => {
            let left = parseFloat(p.style.left) || 0;
            let top  = parseFloat(p.style.top)  || 0;
            const pw = p.offsetWidth;
            const ph = p.offsetHeight;
            // Keep at least the panel header (28px) on screen
            const minVisible = 28;
            if (left < 0) left = 0;
            if (top  < 0) top  = 0;
            if (left + minVisible > vw) left = vw - minVisible;
            if (top  + minVisible > vh) top  = vh - minVisible;
            p.style.left = left + 'px';
            p.style.top  = top  + 'px';
        });
        // Clamp HUD elements (dock, hud-title, hud) — but only AFTER they've been dragged at least once (i.e. they have inline left/top set). Otherwise leave their default CSS positioning intact.
        document.querySelectorAll('.hud-element').forEach(p => {
            if (!p.style.left || !p.style.top) return;
            let left = parseFloat(p.style.left) || 0;
            let top  = parseFloat(p.style.top)  || 0;
            const pw = p.offsetWidth;
            const ph = p.offsetHeight;
            if (left < 0) left = 0;
            if (top  < 0) top  = 0;
            if (left + pw > vw) left = vw - pw;
            if (top  + ph > vh) top  = vh - ph;
            p.style.left = left + 'px';
            p.style.top  = top  + 'px';
        });
    }
    window.clampPanels = clampPanels;

    function savePanelPos() {
        const pos = {};
        document.querySelectorAll('.panel, .hud-element').forEach(p => {
            if (!p.id) return; // skip un-IDed elements like the dock-handle
            pos[p.id] = {
                left: p.style.left,
                top: p.style.top,
                right: p.style.right,
                display: p.classList.contains('hidden') ? 'none' : 'block',
                bodyHidden: p.classList.contains('panel') && p.querySelector('.panel-body') ? p.querySelector('.panel-body').classList.contains('hidden') : false
            };
        });
        try { localStorage.setItem('ss6_panels', JSON.stringify(pos)); } catch (e) { }
        clampPanels();
    }

    // Conservative validator for CSS length values pulled from localStorage.
    // Accepts plain numbers (with optional sign and decimals) plus px/% units;
    // rejects anything else — including url(), expression(), JS-pseudo-protocol
    // bombs, and stray semicolons that could close out the attribute.
    const _CSS_LEN_RE = /^-?\d+(?:\.\d+)?(?:px|%)?$/;
    function _safeCssLen(v) {
        return (typeof v === 'string' && _CSS_LEN_RE.test(v)) ? v : '';
    }

    function loadPanelPos() {
        try {
            const d = localStorage.getItem('ss6_panels');
            if (d) {
                const pos = JSON.parse(d);
                if (!pos || typeof pos !== 'object') return;
                for (const id in pos) {
                    const p = document.getElementById(id);
                    if (p && pos[id] && typeof pos[id] === 'object') {
                        p.style.left   = _safeCssLen(pos[id].left);
                        p.style.top    = _safeCssLen(pos[id].top);
                        p.style.right  = _safeCssLen(pos[id].right);
                        p.style.bottom = _safeCssLen(pos[id].bottom);
                        if (p.classList.contains('panel')) {
                            if (pos[id].display === 'none' || pos[id].hidden) {
                                p.classList.add('hidden');
                            } else {
                                p.classList.remove('hidden');
                            }
                            const b = p.querySelector('.panel-body'), t = p.querySelector('.toggle');
                            if (b && t) {
                                if (pos[id].bodyHidden) {
                                    b.classList.add('hidden');
                                    t.textContent = '+';
                                } else {
                                    b.classList.remove('hidden');
                                    t.textContent = '−';
                                }
                            }
                        }
                    }
                }
            } else {
                // First run — no saved positions. Place each panel just above
                // the dock so users see a clear cause/effect when they click
                // a dock button (panels rise from where they pressed). Each
                // panel gets a horizontal offset so they don't fully overlap.
                // After the user drags a panel, the new position is saved
                // and this branch never runs again.
                positionPanelsAboveDock();
                // Default to ALL panels closed on first load — clean canvas,
                // just dock + logo visible. User explicitly opens what they
                // want. Mirrors the docked-UI feel of a DAW where panels are
                // hidden until you call them up. Persisted state from later
                // sessions overrides this branch entirely.
                document.querySelectorAll('.panel').forEach(p => {
                    p.classList.add('hidden');
                });
            }
        } catch (e) { }
    }

    function positionPanelsAboveDock() {
        const dock = document.getElementById('dock');
        if (!dock) return;
        const dockRect = dock.getBoundingClientRect();
        // Compute a target Y just above the dock, taking each panel's own
        // height into account so they don't overshoot the screen.
        // panelIds is ordered to match the dock left-to-right.
        const panelIds = ['panelParams', 'panelSettings', 'panelAtlas', 'panelControls', 'panelConfig'];
        // Horizontal spread: stagger them across the lower-third of the
        // viewport so they're individually accessible.
        const vw = window.innerWidth;
        const stride = Math.min(280, (vw - 80) / panelIds.length);
        const startX = Math.max(20, (vw - stride * panelIds.length) / 2);
        panelIds.forEach((id, idx) => {
            const p = document.getElementById(id);
            if (!p) return;
            // Need the panel rendered to measure height. It's already in DOM
            // but might be hidden by default. Briefly un-hide for measurement.
            const wasHidden = p.classList.contains('hidden');
            if (wasHidden) {
                p.style.visibility = 'hidden';
                p.classList.remove('hidden');
            }
            const h = p.offsetHeight || 200;
            if (wasHidden) {
                p.classList.add('hidden');
                p.style.visibility = '';
            }
            // Y: sit so the panel's bottom edge is 16px above the dock top.
            // Clamp to a sensible minimum so very tall panels don't clip off top.
            const y = Math.max(20, dockRect.top - h - 16);
            const x = Math.round(startX + idx * stride);
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.right = 'auto';
            p.style.bottom = 'auto';
        });
    }

    function initDrag() {
        let dr = false, ox = 0, oy = 0, p = null;

        // Per-element setup, extracted so we can also call it for dynamically
        // created panels (currently: the entropy panel built on first open).
        function attachDragToHead(h) {
            if (!h || h.dataset.dragWired === '1') return;
            h.dataset.dragWired = '1';
            h.addEventListener('mousedown', e => {
                if (e.target.closest('.toggle')) return;
                p = h; dr = true;
                const isHud = h.classList.contains('hud-element');
                // Allow a hud-element to designate a different element as the actual drag target (e.g. dock-handle drags the dock).
                let targetEl;
                if (isHud) {
                    const sel = h.dataset.dragTarget;
                    targetEl = (sel && document.querySelector(sel)) || h;
                } else {
                    targetEl = h.parentElement;
                }
                
                // Z-layering: bring the just-grabbed panel above all others. Increment a shared counter so each new grab beats the last.
                window._panelZTop = (window._panelZTop || 20) + 1;
                targetEl.style.zIndex = window._panelZTop;
                
                // Native zoom compensation: clientX/Y are screen pixels.
                ox = e.clientX;
                oy = e.clientY;
                
                const zoom = window.S?.uiZoom || 1.0;
                const rect = targetEl.getBoundingClientRect();
                
                const isPixelValue = (v) => typeof v === 'string' && /^-?\d+(\.\d+)?px$/.test(v.trim());
                const hasPixelLeft = isPixelValue(targetEl.style.left);
                const hasPixelTop  = isPixelValue(targetEl.style.top);
                
                if (!hasPixelLeft) {
                    targetEl.style.left = (rect.left / zoom) + 'px';
                    targetEl.style.right = 'auto';
                    targetEl.style.transform = 'none';
                    targetEl.style.margin = '0';
                }
                if (!hasPixelTop) {
                    targetEl.style.top = (rect.top / zoom) + 'px';
                    targetEl.style.bottom = 'auto';
                }
                
                targetEl.dataset.startLeft  = parseFloat(targetEl.style.left)  || 0;
                targetEl.dataset.startTop   = parseFloat(targetEl.style.top)   || 0;
                targetEl.dataset.startRight = parseFloat(targetEl.style.right) || 0;
            });
            window.addEventListener('mousemove', e => {
                if (!dr || p !== h) return;
                const isHud = h.classList.contains('hud-element');
                let targetEl;
                if (isHud) {
                    const sel = h.dataset.dragTarget;
                    targetEl = (sel && document.querySelector(sel)) || h;
                } else {
                    targetEl = h.parentElement;
                }
                
                const zoom = window.S.uiZoom || 1.0;
                const dx = (e.clientX - ox) / zoom;
                const dy = (e.clientY - oy) / zoom;
                
                const sl = parseFloat(targetEl.dataset.startLeft);
                const st = parseFloat(targetEl.dataset.startTop);
                const sr = parseFloat(targetEl.dataset.startRight);

                targetEl.style.top = (st + dy) + 'px';
                
                // If it was right-anchored, keep it right-anchored
                if (targetEl.style.left === 'auto' || (!targetEl.style.left && targetEl.style.right)) {
                    targetEl.style.right = (sr - dx) + 'px';
                } else {
                    targetEl.style.left = (sl + dx) + 'px';
                }

                if (targetEl.id === 'dock') {
                    targetEl.style.margin = '0';
                }
                
                // Live bounds clamping. HUD elements (dock, hud-title) get clamped so their full body stays visible. Panels keep at least a corner.
                const zoomNow = window.S?.uiZoom || 1.0;
                const vw = window.innerWidth / zoomNow;
                const vh = window.innerHeight / zoomNow;
                const pw = targetEl.offsetWidth;
                const ph = targetEl.offsetHeight;
                let lpx = parseFloat(targetEl.style.left) || 0;
                let tpx = parseFloat(targetEl.style.top) || 0;
                if (isHud) {
                    if (lpx < 0) lpx = 0;
                    if (tpx < 0) tpx = 0;
                    if (lpx + pw > vw) lpx = vw - pw;
                    if (tpx + ph > vh) tpx = vh - ph;
                } else {
                    const minVisible = 28;
                    if (lpx < 0) lpx = 0;
                    if (tpx < 0) tpx = 0;
                    if (lpx + minVisible > vw) lpx = vw - minVisible;
                    if (tpx + minVisible > vh) tpx = vh - minVisible;
                }
                targetEl.style.left = lpx + 'px';
                targetEl.style.top = tpx + 'px';
            });
            window.addEventListener('mouseup', () => {
                if (dr) { savePanelPos() }
                dr = false;
            });
        } // end attachDragToHead

        // Wire all currently-present heads, and expose the helper so newly
        // created panels (entropy panel, future dynamic UIs) can wire themselves.
        document.querySelectorAll('.panel-head, .hud-element').forEach(attachDragToHead);
        window.attachDragToHead = attachDragToHead;
    }

    // Initialize Dock BEFORE initDrag so it receives the drag listeners
    initDock();
    
    // Initialize defaults before building UI
    if (typeof window.S.panelOpacity !== 'number') window.S.panelOpacity = 0.55;
    if (typeof window.S.buttonOpacity !== 'number') window.S.buttonOpacity = 0.8;

    // UI BUILDER
    buildUI(engine);
    
    // ui-ready is NOT added here. It's added by splash dismiss (or by
    // setUIVisibility(true) later). This way the UI stays invisible behind
    // the splash regardless of how long the engine init takes.
    loadPanelPos();
    if (window.renderDock) window.renderDock(); // Sync dock buttons with loaded panel states
    initDrag();
    window.addEventListener('resize', clampPanels);
    
    // Initialize Radial Menu Paradigm
    initRadialUI();
}

function initDock() {
    const dock = document.createElement('nav');

    // Dock itself is NOT .hud-element — that class enables drag,
	// but we want only the handle (a child) to be draggable. Otherwise buttons drag.
    dock.className = 'dock';
    dock.id = 'dock';
    dock.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;height:32px;gap:8px;z-index:500;padding:0 0 0 6px;background:transparent;border:none;';
    const uiRoot = document.getElementById('ui-root') || document.body;
    uiRoot.appendChild(dock);

    // Drag handle on the left edge. Three rows of two dots — small,
	// gives the user a clear "grab here" affordance without crowding the buttons.
	// This is the ONLY part of the dock that initiates a drag.
    const handle = document.createElement('div');
    handle.className = 'hud-element dock-handle';
    handle.title = 'Drag to move';
    handle.setAttribute('data-drag-target', '#dock');
    handle.innerHTML = '<span></span><span></span><span></span><span></span><span></span><span></span>';
    dock.appendChild(handle);

    // ─── Navigation toggle (Orbit / Fly) ─────────────────────────────────
    // Lives on the far-left of the dock so the camera-mode switch is one
    // click away regardless of which panels are open. Distinct visual from
    // panel-open dock buttons: it's a segmented control, not an on/off.
    const navMov = (window.APP_TEXT && window.APP_TEXT.moveMode) || { items: ['Orbit', 'Fly'] };
    const navToggle = document.createElement('div');
    navToggle.className = 'dock-nav-toggle';
    navToggle.title = 'Camera navigation mode';
    const navOrbit = document.createElement('button');
    navOrbit.className = 'dock-nav-seg';
    navOrbit.dataset.mode = 'orbit';
    navOrbit.textContent = navMov.items[0] || 'Orbit';
    const navFly = document.createElement('button');
    navFly.className = 'dock-nav-seg';
    navFly.dataset.mode = 'fly';
    navFly.textContent = navMov.items[1] || 'Fly';
    navToggle.appendChild(navOrbit);
    navToggle.appendChild(navFly);
    dock.appendChild(navToggle);

    const syncNavToggle = () => {
        const mode = window.S.moveMode || 'orbit';
        navOrbit.dataset.active = (mode === 'orbit') ? 'true' : 'false';
        navFly.dataset.active   = (mode === 'fly')   ? 'true' : 'false';
    };
    const setNavMode = (mode) => {
        if (window.S.moveMode === mode) return;
        window.S.moveMode = mode;
        syncNavToggle();
        // Match makeGroupToggles semantics: any explicit mode change cancels
        // an active tour (the user is now driving), refreshes radial UI, and
        // persists state. Also notify any other toggle observers tracking
        // moveMode (none currently, but the registry is the right place).
        if (window.tour && window.tour.active && window.stopTour) window.stopTour();
        if (window.refreshRadialUI) window.refreshRadialUI();
        if (window._toggleUpdaters && window._toggleUpdaters.moveMode) {
            window._toggleUpdaters.moveMode.forEach(fn => fn());
        }
        try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}
    };
    navOrbit.addEventListener('click', () => setNavMode('orbit'));
    navFly.addEventListener('click', () => setNavMode('fly'));
    syncNavToggle();
    // Register in the toggle-updater registry so anyone who changes moveMode
    // through other paths (modulation, share-string load, keyboard shortcut)
    // can keep this segmented toggle in sync.
    window._toggleUpdaters = window._toggleUpdaters || {};
    if (!window._toggleUpdaters.moveMode) window._toggleUpdaters.moveMode = new Set();
    window._toggleUpdaters.moveMode.add(syncNavToggle);
    // Convenience export for callers that just want to refresh the visual.
    window.syncDockNavToggle = syncNavToggle;

    const dockDefs = [
        { id: 'panelParams', label: 'Params' },
        { id: 'panelSettings', label: 'Visuals' },
        { id: 'panelAtlas', label: 'Atlas' },
        { id: 'panelControls', label: 'Info' },
        { id: 'panelConfig', label: 'Config' },
        { id: 'panelEntropy', label: 'Entropy', isFps: true }
    ];

    dockDefs.forEach(def => {
        const btn = document.createElement('button');
        btn.id = 'dock-btn-' + def.id;
        btn.className = 'dock-btn';
        // Entropy button gets an inline FPS readout next to its label
        btn.innerHTML = def.isFps
            ? `<span class="dock-label">${def.label}</span><span class="dock-fps" id="dock-fps">--</span>`
            : def.label;
        // All visual states driven by .dock-btn[data-closed] attribute (managed by renderDock()) and theme CSS.
        
        let downX, downY, downTime;
        btn.addEventListener('pointerdown', (e) => {
            downX = e.clientX;
            downY = e.clientY;
            downTime = Date.now();
        });
        
        btn.addEventListener('pointerup', (e) => {
            const dist = Math.sqrt((e.clientX - downX)**2 + (e.clientY - downY)**2);
            const time = Date.now() - downTime;
            if (dist < 10 && time < 400) {
                if (def.isFps) {
                    // Entropy button opens the small entropy panel
                    if (window.toggleEntropyPanel) window.toggleEntropyPanel();
                    return;
                }
                window.togglePanel(def.id);
            }
        });
        dock.appendChild(btn);
    });

    window.renderDock = function() {
        dockDefs.forEach(def => {
            const panel = document.getElementById(def.id);
            const btn = document.getElementById('dock-btn-' + def.id);
            if (!btn) return;
            // Entropy (or any def lacking a panel) defaults to button-closed.
            // Once the panel is lazily created on first open, this falls
            // through to the same panel-state logic as the others.
            if (!panel) {
                btn.dataset.closed = 'true';
                return;
            }
            const body = panel.querySelector('.panel-body');
            const isClosed = panel.classList.contains('hidden') || (body && body.classList.contains('hidden'));
            btn.dataset.closed = isClosed ? 'true' : 'false';
        });
    };

    window.renderDock();
}

function makeSlider(p, label, subhead, ll, lr, key, min, max, step, cb) {
    // Cache range so the modulation pipeline can compute proper amplitude and clamp values back into bounds.
    window._paramRanges = window._paramRanges || {};
    window._paramRanges[key] = { min, max, step };

    // Force-cast min/max/step/value through Number() before interpolation.
    // window.S[key] could be tampered (via an imported save or localStorage
    // mutation) to be a non-numeric string that would break out of the
    // value="..." attribute and inject HTML. Casting to Number first means
    // either a finite number (safe in any HTML context) or NaN (which we
    // catch and fall back to min).
    const _min = Number(min);
    const _max = Number(max);
    const _step = Number(step);
    const _raw = Number(window.S[key]);
    const _val = Number.isFinite(_raw) ? _raw : _min;
    const pct = ((_val - _min) / (_max - _min)) * 100;
    const d = document.createElement('div');
    d.className = 'row';
    d.dataset.paramKey = key;  // used by the modulation indicator (CSS pulse)
    if ((window.S[key + '_mod'] || 0) > 0.001) d.dataset.modulating = 'true';
    const fmtVal = (v) => v < 1 && v > 0 ? v.toFixed(3) : v < 100 ? Number(v).toFixed(1) : Math.round(v);

    d.innerHTML = `
        <div class="label">
            <span>${label}</span>
            ${subhead ? `<span class="subhead">${subhead}</span>` : ''}
        </div>
        <span class="val" data-editable="1" tabindex="0">${fmtVal(_val)}</span>
        <div class="bar">
            <i style="--v:${Math.max(0, Math.min(100, pct))}%"></i>
        </div>
        <input type="range" min="${_min}" max="${_max}" step="${_step}" value="${_val}">
    `;

    const inp = d.querySelector('input');
    const valSpan = d.querySelector('.val');
    sliderSync[key] = (val) => {
        inp.value = val;
        // Bar visualization clamped to 0..100%. Values can legally exceed
        // the slider range (typed entry and drag-scrub both allow this),
        // but the bar is a fixed-width display so we pin it at the edges
        // rather than rendering negative widths or overflowing past the
        // container.
        const rawPct = ((val - min) / (max - min) * 100);
        d.querySelector('i').style.setProperty('--v', Math.max(0, Math.min(100, rawPct)) + '%');
        // Only update the span text when the span doesn't currently have
        // focus (i.e. the user isn't actively typing into it). Otherwise
        // a stray sliderSync from modulation or programmatic update would
        // overwrite their in-progress edit.
        if (document.activeElement !== valSpan) {
            valSpan.textContent = fmtVal(val);
        }
        if (cb) cb(val);
    };

    const updateVal = (val, isProgrammatic = false) => {
        window.S[key] = parseFloat(val);
        sliderSync[key](window.S[key]);
        // Only cancel an active tour if the user is changing something the
        // tour is actually animating. Cosmetic sliders (panel opacity,
        // scanlines, UI zoom, button opacity) should leave the tour alone.
        if (!isProgrammatic && window.tour && window.tour.active && TOUR_STOPPING_KEYS.has(key)) window.stopTour();
        if (window.refreshRadialUI) window.refreshRadialUI();
        try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
    };

    inp.addEventListener('input', e => { if (e.isTrusted) updateVal(e.target.value, false) });
    d.addEventListener('wheel', e => {
        // Wheel-scrub respects the slider's min/max because the wheel is a
        // bounded gesture (no clear visual signal you've gone "past" the
        // range). Typed entry and drag-scrub both allow out-of-range values
        // since both have stronger user intent signals — see below.
        e.preventDefault();
        const stepDist = (step || (max - min) / 100) * 5;
        const newVal = Math.max(min, Math.min(max, window.S[key] - Math.sign(e.deltaY) * stepDist));
        inp.value = newVal;
        updateVal(newVal, false);
    }, { passive: false });

    // ─── Editable / scrubbable value field ─────────────────────────────────
    // The .val span supports two interactions: click-to-edit (focus, type,
    // Enter/blur to commit) and drag-to-scrub (Unreal-style horizontal
    // drag changes the value continuously). Discrimination is via a 4px
    // movement threshold during pointerdown — small movements are clicks,
    // larger ones are drags. Both interactions allow values outside the
    // slider's min/max; the bar pins at 0%/100% as a visual cue without
    // blocking the underlying value from being stored. freeEnergy is
    // clamped on reload via _STATE_CLAMPS (the only param where an absurd
    // value has real-world cost — it sizes a GPU buffer), so even an
    // out-of-range typed value gets sane'd on next session.
    const DRAG_THRESHOLD = 4;       // px before pointerdown is considered a drag
    const DRAG_PER_PX = step * 0.5; // value-per-pixel of horizontal drag
    let _ptrStart = null;

    valSpan.addEventListener('pointerdown', (e) => {
        if (valSpan.contentEditable === 'true') return; // already editing; let it select text
        _ptrStart = {
            x: e.clientX,
            y: e.clientY,
            startVal: Number(window.S[key]) || 0,
            dragging: false,
            captured: false,
            pointerId: e.pointerId
        };
        // Attach the document listeners NOW so we don't leak them across
        // buildUI rebuilds (which would otherwise stack 20+ idle listeners
        // every time the panel re-renders). They detach themselves in
        // onPointerUp / onPointerCancel.
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
        e.preventDefault();
    });

    // pointermove handler — installed only during active drag (see above).
    // continues even if the user's pointer leaves the span — matches the
    // expectation set by every other scrubber in every other tool.
    const onPointerMove = (e) => {
        if (!_ptrStart) return;
        const dx = e.clientX - _ptrStart.x;
        const dy = e.clientY - _ptrStart.y;
        if (!_ptrStart.dragging) {
            // Cross the threshold in any direction → enter drag mode.
            if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
            _ptrStart.dragging = true;
            valSpan.classList.add('scrubbing');
            document.body.style.cursor = 'ew-resize';
            // Block text selection during drag.
            document.body.style.userSelect = 'none';
            // Capture so we get the pointerup even if the pointer ends
            // over a different element.
            try { valSpan.setPointerCapture(_ptrStart.pointerId); _ptrStart.captured = true; } catch (err) {}
        }
        const newVal = _ptrStart.startVal + dx * DRAG_PER_PX;
        // Drag is uncapped — no Math.min/max against the slider range.
        // The bar pins visually via the clamp in sliderSync.
        updateVal(newVal, false);
    };

    const onPointerUp = (e) => {
        if (!_ptrStart) return;
        const wasDragging = _ptrStart.dragging;
        if (_ptrStart.captured) {
            try { valSpan.releasePointerCapture(_ptrStart.pointerId); } catch (err) {}
        }
        _ptrStart = null;
        // Detach the document-scoped listeners that pointerdown installed.
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        valSpan.classList.remove('scrubbing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // If the pointer never crossed the threshold, treat it as a click
        // → enter edit mode (focus the span as contenteditable, select all
        // for easy replacement).
        if (!wasDragging) {
            valSpan.contentEditable = 'true';
            valSpan.focus();
            // Select all text so typing replaces the value rather than
            // appending to it. Standard scrubber numeric field pattern.
            const range = document.createRange();
            range.selectNodeContents(valSpan);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    // Commit on blur or Enter; revert on Escape. The span's textContent
    // is the source of truth during editing; we parse via Number() (which
    // tolerates whitespace, scientific notation, etc.) and reject NaN by
    // restoring the displayed value. Out-of-range values are accepted
    // verbatim — the user typed them intentionally.
    let _editStartVal = null;
    valSpan.addEventListener('focus', () => {
        _editStartVal = Number(window.S[key]);
    });
    const commit = () => {
        if (valSpan.contentEditable !== 'true') return;
        valSpan.contentEditable = 'false';
        const raw = valSpan.textContent.trim();
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
            updateVal(parsed, false);
        } else {
            // Unparseable → restore the pre-edit displayed value without
            // changing state.
            valSpan.textContent = fmtVal(Number(window.S[key]));
        }
        _editStartVal = null;
    };
    const revert = () => {
        if (valSpan.contentEditable !== 'true') return;
        valSpan.contentEditable = 'false';
        if (_editStartVal != null) {
            valSpan.textContent = fmtVal(_editStartVal);
        }
        _editStartVal = null;
    };
    valSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            valSpan.blur(); // triggers commit via blur handler below
        } else if (e.key === 'Escape') {
            e.preventDefault();
            revert();
            valSpan.blur();
        }
    });
    valSpan.addEventListener('blur', commit);

    p.appendChild(d);
    return d;
}

function makeGroupToggles(p, items) {
    const tb = document.createElement('div');
    tb.className = 'group-toggles';

    items.forEach((itm, i) => {
        const btn = document.createElement('div');
        btn.className = 'group-toggle-btn';

        itm.update = () => {
            // Read the BOOLEAN (user intent), not the in-flight fade alpha.
            // The fade is purely visual on the canvas; the button must
            // reflect what the user just asked for, immediately.
            //
            // ColorMode special case: fadeColorModeChange defers the actual
            // window.S.colorMode assignment until the V-envelope trough.
            // If we read window.S.colorMode immediately on click, the button
            // shows the OLD mode highlighted until midpoint — which the user
            // perceives as "tab 1 click does nothing, tab 2 click activates
            // tab 1, etc." (off-by-one). Reading the pending target during
            // the fade resolves the click-to-highlight to instant feedback.
            let currentVal = window.S[itm.key];
            if (itm.key === 'colorMode' && window._xfadeColorModeTarget != null) {
                currentVal = window._xfadeColorModeTarget;
            }
            // Paired-visibility group (Quanta shape tabs): the button is
            // "active" only when BOTH the section visibility (e.g.
            // showParticles) is true AND this tab's matchVal is the
            // currently-selected value. When visibilityKey is off, no tab
            // in the group is highlighted — this is the "section off" state.
            let active;
            if (itm.visibilityKey) {
                active = !!window.S[itm.visibilityKey] && currentVal === itm.matchVal;
            } else {
                active = (itm.matchVal !== undefined)
                    ? currentVal === itm.matchVal
                    : !!currentVal;
            }
            btn.dataset.active = active ? '1' : '0';
        };
        itm.update();

        window._toggleUpdaters = window._toggleUpdaters || {};
        if (!window._toggleUpdaters[itm.key]) window._toggleUpdaters[itm.key] = new Set();
        window._toggleUpdaters[itm.key].add(itm.update);
        // Also register under visibilityKey so the tab re-renders when the
        // section is turned on/off externally (e.g. via the radial menu's
        // showParticles toggle, or a waypoint load).
        if (itm.visibilityKey) {
            if (!window._toggleUpdaters[itm.visibilityKey]) window._toggleUpdaters[itm.visibilityKey] = new Set();
            window._toggleUpdaters[itm.visibilityKey].add(itm.update);
        }

        btn.textContent = itm.label;
        btn.addEventListener('click', () => {
            // Paired-visibility group (Quanta shape tabs): clicking an
            // active tab turns the whole section OFF; clicking an inactive
            // tab switches to that matchVal and turns the section ON if
            // needed. "No tab active" is a valid section-off state. Shape
            // is preserved when the section is turned off so re-enabling
            // restores the last-selected tab.
            if (itm.visibilityKey) {
                const wasVisible = !!window.S[itm.visibilityKey];
                const wasMatching = window.S[itm.key] === itm.matchVal;
                const wasActive = wasVisible && wasMatching;

                // Stop tour if either key is in its watchlist. Done before
                // any fade kick-off so stopTour's cleanup doesn't wipe it.
                if (tour && tour.active && (
                    TOUR_STOPPING_KEYS.has(itm.key) ||
                    TOUR_STOPPING_KEYS.has(itm.visibilityKey)
                )) stopTour();

                if (wasActive) {
                    // Active → deselect = section off. Leave shape as-is.
                    window.S[itm.visibilityKey] = false;
                    if (VISIBILITY_XFADE_KEYS[itm.visibilityKey]) {
                        fadeVisibilityKey(itm.visibilityKey, 1, 0);
                    }
                } else {
                    // Switch matchVal; if section was off, fade it on.
                    window.S[itm.key] = itm.matchVal;
                    if (!wasVisible) {
                        window.S[itm.visibilityKey] = true;
                        if (VISIBILITY_XFADE_KEYS[itm.visibilityKey]) {
                            fadeVisibilityKey(itm.visibilityKey, 0, 1);
                        }
                    }
                }

                if (itm.cb) itm.cb();
                // Fire updaters for BOTH the discrete key and the
                // visibility key — covers the radial menu's listener for
                // showParticles AND this group's sibling tabs.
                [itm.key, itm.visibilityKey].forEach(k => {
                    const u = window._toggleUpdaters && window._toggleUpdaters[k];
                    if (u) u.forEach(fn => { try { fn(); } catch (e) {} });
                });
                if (window.refreshRadialUI) window.refreshRadialUI();
                try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
                return;
            }

            const wasOn = !!window.S[itm.key]; // boolean snapshot before flip
            // colorMode gets a V-envelope fade rather than an immediate
            // assignment. The mode flip itself happens inside the helper at
            // the envelope trough, so visually the layers dip to ~0, swap
            // mode, and rise back — masking the discrete shader-mode flip
            // the same way tour transitions already do. Don't assign here
            // or we'd flash the new mode at full opacity before the dip.
            const isColorModeFade = (itm.key === 'colorMode' && itm.matchVal !== undefined);
            if (isColorModeFade) {
                // Tour-stop check first, same ordering rule as below.
                if (tour && tour.active && TOUR_STOPPING_KEYS.has(itm.key)) stopTour();
                fadeColorModeChange(itm.matchVal);
                if (itm.cb) itm.cb();
                const updaters = window._toggleUpdaters && window._toggleUpdaters[itm.key];
                if (updaters) updaters.forEach(fn => { try { fn(); } catch (e) {} });
                if (window.refreshRadialUI) window.refreshRadialUI();
                // No localStorage write here — fadeColorModeChange persists
                // at completion so the saved mode matches what's rendered.
                return;
            }

            if (itm.matchVal !== undefined) window.S[itm.key] = itm.matchVal;
            else {
                window.S[itm.key] = !wasOn;
            }

            // Only cancel an active tour if this toggle actually affects what
            // the tour is animating. Theme switches, button-shape changes,
            // screenshot toggles, scanline overlays — none of those touch
            // simulation state, so killing the tour for them feels buggy.
            // TOUR_STOPPING_KEYS is the authoritative gate; see definition
            // for the inclusion rules. We stop BEFORE starting any new
            // visibility fade so stopTour's _xfade cleanup doesn't wipe it.
            if (tour && tour.active && TOUR_STOPPING_KEYS.has(itm.key)) stopTour();

            // For boolean visibility keys (Curved / Lattice — the string
            // toggles), animate the alpha rather than hard-snapping the
            // mesh. Quanta runs through the visibilityKey branch above and
            // doesn't reach here. matchVal toggles (tourMode, theme, etc.)
            // skip the fade — they're not visibility flips.
            if (itm.matchVal === undefined && VISIBILITY_XFADE_KEYS[itm.key]) {
                fadeVisibilityKey(itm.key, wasOn ? 1 : 0, wasOn ? 0 : 1);
            } else if (itm.matchVal === undefined) {
                clearVisibilityXfadeForKey(itm.key);
            }

            if (itm.cb) itm.cb();
            // Run ALL registered updaters for this key — not just this
            // group's siblings. Other UI elements may listen to the same
            // key (e.g. Include sub-group disables itself when both Save
            // toggles are off). This was previously a no-op for cross-
            // group listeners because we only iterated the local items.
            const updaters = window._toggleUpdaters && window._toggleUpdaters[itm.key];
            if (updaters) updaters.forEach(fn => { try { fn(); } catch (e) {} });
            if (window.refreshRadialUI) window.refreshRadialUI();
            try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
        });
        tb.appendChild(btn);
    });
    p.appendChild(tb);
    return tb;
}

// Synchronize all UI toggles whose state may have changed externally (e.g. after a tour transition writes new values to window.S directly). Cheap — just calls registered update closures.
function syncTogglesFromState() {
    const updaters = window._toggleUpdaters || {};
    for (const key in updaters) {
        updaters[key].forEach(fn => { try { fn(); } catch (e) {} });
    }
}
window.syncTogglesFromState = syncTogglesFromState;

function makeToggle(p, label, key, color, cb) {
    const d = document.createElement('span');
    d.className = 'tog';
    d.style.background = window.S[key] ? color + '22' : 'rgba(10,10,24,0.8)';
    d.style.border = '1px solid ' + (window.S[key] ? color : 'rgba(40,40,70,0.6)');
    d.style.color = window.S[key] ? color : '#8899aa';
    d.innerHTML = '<span class="dot" style="background:' + (window.S[key] ? color : '#556') + '"></span>' + label;

    d.addEventListener('click', () => {
        const wasOn = !!window.S[key];
        window.S[key] = !wasOn;
        d.style.background = window.S[key] ? color + '22' : 'rgba(10,10,24,0.8)';
        d.style.border = '1px solid ' + (window.S[key] ? color : 'rgba(40,40,70,0.6)');
        d.style.color = window.S[key] ? color : '#8899aa';
        d.innerHTML = '<span class="dot" style="background:' + (window.S[key] ? color : '#556') + '"></span>' + label;
        
        // Only cancel an active tour if this toggle key actually affects
        // what the tour is animating. See TOUR_STOPPING_KEYS definition.
        // Order matters — stop the tour BEFORE starting any new fade so
        // stopTour's _xfade cleanup doesn't wipe it.
        if (tour && tour.active && TOUR_STOPPING_KEYS.has(key)) stopTour();

        // Visibility fade for boolean layer toggles; other keys hard-snap.
        if (VISIBILITY_XFADE_KEYS[key]) {
            fadeVisibilityKey(key, wasOn ? 1 : 0, wasOn ? 0 : 1);
        }
        
        if (cb) cb();
        if (window.refreshRadialUI) window.refreshRadialUI();
        try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
    });
    p.appendChild(d);
}

function makeBtn(p, label, color, cb) {
    const d = document.createElement('span');
    d.className = 'btn';
    d.style.color = color;
    d.textContent = label;
    d.addEventListener('click', cb);
    p.appendChild(d);
    return d; // for callers that need to attach extra behavior (e.g. glow)
}
// Alias used in places where the return value is semantically important to
// the call site (vs. fire-and-forget makeBtn calls). Identical implementation.
const makeBtnReturn = makeBtn;

function makeSection(p, labelKey) {
    const d = document.createElement('div');
    d.className = 'section';
    let text = labelKey;
    if (window.APP_TEXT && window.APP_TEXT[labelKey]) {
        const val = window.APP_TEXT[labelKey];
        text = (typeof val === 'object' && val.label) ? val.label : val;
    }
    d.textContent = text;
    p.appendChild(d);
}

export function buildUI(engine) {
    const pb = document.getElementById('paramsBody');
    if (!pb) return;

    // Update Panel Titles from Config
    const T = window.APP_TEXT || { controls: {}, panels: {}, instructions: {}, quanta: {}, strings: {}, colorMode: {}, moveMode: {} };
    if (T.panels) {
        for (const [id, title] of Object.entries(T.panels)) {
            const panel = document.getElementById('panel' + id.charAt(0).toUpperCase() + id.slice(1));
            if (panel) {
                const head = panel.querySelector('.panel-head .title');
                if (head) head.textContent = title;
            }
        }
    }

    pb.innerHTML = '';

    // ─── +Homepoint button in Params panel head ───────────────────────────
    // Mirrors the +Waypoint affordance in the Atlas panel head: green text-
    // button that captures current params + cam state as the homepoint.
    // Idempotent — only attaches once per panel (checks for existing node).
    const paramsPanel = document.getElementById('panelParams');
    if (paramsPanel) {
        const h = paramsPanel.querySelector('.panel-head');
        const hText = h && h.querySelector('span');
        if (hText && !hText.querySelector('.add-hp-btn')) {
            const add = document.createElement('span');
            add.className = 'add-hp-btn';
            add.title = 'Save current state as homepoint';
            add.textContent = '+homepoint';
            add.style.cssText = 'color:#6aaa7a;font-weight:bold;margin-left:6px;font-size:10px;text-transform:uppercase;cursor:pointer;';
            // stopPropagation on mousedown so clicking this button doesn't
            // trigger the panel-head drag handler (same pattern as +waypoint).
            add.addEventListener('mousedown', e => e.stopPropagation());
            add.addEventListener('click', () => { if (window.captureHomepoint) window.captureHomepoint(); });
            hText.appendChild(add);
        }
        // Pulse the +homepoint button when no homepoint exists or when the
        // user has been prompted to set one (by clicking Homepoint at the
        // bottom without one set). Stored as window._needsHomepointHint so
        // it survives panel rebuilds. The pulse stops as soon as a homepoint
        // is saved (captureHomepoint clears the hint flag).
        const hpBtn = hText && hText.querySelector('.add-hp-btn');
        if (hpBtn) {
            const shouldGlow = !window.S.homepoint || window._needsHomepointHint;
            hpBtn.style.animation = shouldGlow ? 'pulseGreen 1.5s infinite' : 'none';
        }
    }

    // ─── Core Parameters ───────────────────────────────────────────────────
    const c = T.controls || {};
	
    // Tempo lives at the top of Parameters because it's the master control — 0 = pause, 1 = normal, 2 = double speed. Affects everything downstream.
    makeSlider(pb, c.tempo?.label || 'Tempo', c.tempo?.sub ||'speed', c.tempo?.ll ||'pause', c.tempo?.lr ||'2x', 'tempo', 0, 2, .01);
    makeSlider(pb, c.freeEnergy?.label || 'Free Energy', c.freeEnergy?.sub ||'particle count', c.freeEnergy?.ll ||'sparse', c.freeEnergy?.lr ||'dense', 'freeEnergy', 500, 1000000, 100, (val) => {
        if (window.engine) window.engine.resizeParticles(Math.round(val));
    });
    makeSlider(pb, c.resolution?.label || 'Resolution', c.resolution?.sub ||'particle size', c.resolution?.ll ||'-rez', c.resolution?.lr ||'+rez', 'resolution', .1, 20, .1);
    makeSlider(pb, c.inversion?.label || 'Inversion', c.inversion?.sub ||'compression', c.inversion?.ll ||'contract', c.inversion?.lr ||'expand', 'inversion', 30, 500, 1);
    makeSlider(pb, c.halfLife?.label || 'Half-Life', c.halfLife?.sub ||'particle lifespan', c.halfLife?.ll ||'mortal', c.halfLife?.lr ||'immortal', 'halfLife', 0, 30, .1);
    makeSlider(pb, c.scaleDepth?.label || 'Scale Depth', c.scaleDepth?.sub ||'attraction force', c.scaleDepth?.ll ||'micro', c.scaleDepth?.lr ||'macro', 'scaleDepth', 0, 5, .01);
    makeSlider(pb, c.coherence?.label || 'Coherence', c.coherence?.sub ||'attraction radius', c.coherence?.ll ||'vague', c.coherence?.lr ||'binary', 'coherence', 1, 200, 1);
    makeSlider(pb, c.equilibrium?.label || 'Equilibrium', c.equilibrium?.sub ||'noise speed', c.equilibrium?.ll ||'tranquil', c.equilibrium?.lr ||'random', 'equilibrium', .001, .2, .001);
    makeSlider(pb, c.temperature?.label || 'Temperature', c.temperature?.sub ||'noise intensity', c.temperature?.ll ||'glacial', c.temperature?.lr ||'firey', 'temperature', 0, 3, .01);
    makeSlider(pb, c.viscosity?.label || 'Viscosity', c.viscosity?.sub ||'sluggishness', c.viscosity?.ll ||'fluid', c.viscosity?.lr ||'thick', 'viscosity', 0, 1, .01);
    makeSlider(pb, c.mass?.label || 'Mass', c.mass?.sub ||'inertia', c.mass?.ll ||'light', c.mass?.lr ||'heavy', 'mass', 0.1, 5, .05);

    const rd = document.createElement('div');
    // Flex row whose children equally share the available width. Without
    // flex:1 on the buttons their auto-width plus margin-right caused the
    // bar to wrap to two lines for any non-trivial label pair.
    rd.style.cssText = 'margin-top:12px;display:flex;gap:6px;';
    pb.appendChild(rd);
    const styleBottomBtn = (btn) => {
        btn.style.flex = '1';
        btn.style.margin = '0';
        btn.style.justifyContent = 'center';
        btn.style.whiteSpace = 'nowrap';
    };
    // Homepoint: travel back to user's saved "home" state (params + cam).
    // Replaces the old "Reset Params" button — homepoint IS the user's
    // chosen reset state, set via the green +Homepoint button in the panel
    // head. Pulses when no homepoint exists to invite first-time setup;
    // clicking with no homepoint set toasts a hint and triggers the
    // +Homepoint glow so users see exactly where to go next.
    const homepointBtn = makeBtnReturn(rd, 'Homepoint', '#6aaa7a', () => {
        if (!window.S.homepoint) {
            // First-touch hint flow: toast + trigger +Homepoint glow so the
            // user has a clear path to setting one. Flag persists until they
            // actually save a homepoint (captureHomepoint clears it).
            window._needsHomepointHint = true;
            if (window.travelToHomepoint) window.travelToHomepoint(); // toasts
            // Rebuild Params panel to refresh +Homepoint glow state.
            if (window.buildUI && window.engine) buildUI(window.engine);
        } else {
            if (window.travelToHomepoint) window.travelToHomepoint();
        }
    });
    if (!window.S.homepoint) {
        homepointBtn.style.animation = 'pulseGreen 1.5s infinite';
    }
    // Re-initialize: blows away current particle positions/velocities and
    // restarts the system at the same parameter coordinates. Useful for
    // seeing the "true" attractor shape without stigmergic momentum from
    // the previous state.
    makeBtn(rd, 'Re-initialize', '#5fa8c8', () => {
        if (window.engine && typeof window.engine.reinitializeParticles === 'function') {
            window.engine.reinitializeParticles();
        }
    });
    // Apply equal-share + no-margin to both buttons just created
    Array.from(rd.children).forEach(styleBottomBtn);

    // ─── Visuals ───────────────────────────────────────────────────────────
    const sb = document.getElementById('settingsBody'); sb.innerHTML = '';

    // Visuals panel structure:
    //   Quanta   — three mutually-exclusive shape tabs that also serve as
    //              the on/off for the particle layer. Clicking the active
    //              tab turns the section off ("no tab selected" is a valid
    //              state). Shape is preserved across off/on cycles via
    //              window.S.shape, so re-enabling restores the last tab.
    //   Strings  — two independent toggles (Curved, Lattice). Either,
    //              both, or neither can be on.
    //   Trail Length — slider; disabled when both string types are off.
    //   Color Mode + color sliders below (unchanged).
    //
    // No buildUI rebuilds on toggle — dependent controls (Trail Length)
    // live-update via _toggleUpdaters so the panel stays structurally
    // stable. Avoiding rebuilds also avoids the in-flight-fade / stale-
    // button-state class of bugs.

    const quantaT = T.quanta || { label: 'Quanta', items: ['Circle', 'Square', 'Diamond'] };
    makeSection(sb, 'quanta');
    makeGroupToggles(sb, [
        { label: quantaT.items[0], key: 'shape', matchVal: 'circle',  visibilityKey: 'showParticles' },
        { label: quantaT.items[1], key: 'shape', matchVal: 'square',  visibilityKey: 'showParticles' },
        { label: quantaT.items[2], key: 'shape', matchVal: 'diamond', visibilityKey: 'showParticles' }
    ]);

    const stringsT = T.strings || { label: 'Strings', items: ['Curved', 'Lattice'] };
    makeSection(sb, 'strings');
    makeGroupToggles(sb, [
        { label: stringsT.items[0], key: 'showRibbons' },
        { label: stringsT.items[1], key: 'tessRibbons' }
    ]);

    // Trail Length: dedicated section header + slider wrapper so the disabled
    // state applies uniformly to header + control. Wrapper carries the
    // .disabled class which the existing CSS rule fades + locks pointer
    // events on. Trail Length applies only when at least one string type is
    // on, otherwise it has nothing to draw against.
    const trailHdr = document.createElement('div');
    trailHdr.className = 'section';
    trailHdr.textContent = (T.controls?.trailLength?.label || 'Trail Length');
    sb.appendChild(trailHdr);
    const trailWrap = document.createElement('div');
    sb.appendChild(trailWrap);
    makeSlider(trailWrap, '', c.trailLength?.sub || '', c.trailLength?.ll || 'short', c.trailLength?.lr || 'long', 'trailLen', 3, 30, 1);

    const updateTrailEnabled = () => {
        const on = !!(window.S.showRibbons || window.S.tessRibbons);
        trailWrap.classList.toggle('disabled', !on);
        trailHdr.style.opacity = on ? '' : '0.35';
    };
    window._toggleUpdaters = window._toggleUpdaters || {};
    ['showRibbons', 'tessRibbons'].forEach(k => {
        if (!window._toggleUpdaters[k]) window._toggleUpdaters[k] = new Set();
        window._toggleUpdaters[k].add(updateTrailEnabled);
    });
    updateTrailEnabled();

    const cmm = T.colorMode || { label: 'Color Mode', items: ['White', 'Size', 'Velocity', 'Density'] };
    makeSection(sb, 'colorMode');
    makeGroupToggles(sb, [
        { label: cmm.items[0], key: 'colorMode', matchVal: 0 },
        { label: cmm.items[1], key: 'colorMode', matchVal: 1 },
        { label: cmm.items[2], key: 'colorMode', matchVal: 2 },
        { label: cmm.items[3], key: 'colorMode', matchVal: 3 }
    ]);

    // ─── Color Controls ────────────────────────────────────────────────────
    makeSlider(sb, c.colorRange?.label || 'Color Range', c.colorRange?.sub ||'spectrum width', c.colorRange?.ll ||'tight', c.colorRange?.lr ||'wide', 'hue', 0.01, 1, 0.01, () => {
        if (window.engine) window.engine.updateUniforms();
    });
    makeSlider(sb, c.saturation?.label || 'Saturation', c.saturation?.sub ||'gray vs color', c.saturation?.ll ||'muted', c.saturation?.lr ||'vivid', 'sat', 0, 1.0, 0.01, () => {
        if (window.engine) window.engine.updateUniforms();
    });

    makeSlider(sb, c.opacity?.label || 'Opacity', c.opacity?.sub ||'', c.opacity?.ll ||'ghost', c.opacity?.lr ||'solid', 'opacity', 0, 1, .05);

    const bgCanvas = document.getElementById('bgGlow');
    const bD = makeSlider(sb, c.backdropOpacity?.label || 'Backdrop Opacity', c.backdropOpacity?.sub ||'', c.backdropOpacity?.ll ||'off', c.backdropOpacity?.lr ||'bright', 'bgGlow', 0, .8, .02);
    if (bgCanvas) {
        bD.querySelector('input').addEventListener('input', () => { bgCanvas.style.opacity = window.S.bgGlow });
        const blD = makeSlider(sb, c.backdropBlur?.label || 'Backdrop Blur', c.backdropBlur?.sub ||'', c.backdropBlur?.ll ||'crisp', c.backdropBlur?.lr ||'soft', 'bgBlur', 0, 100, 1);
        blD.querySelector('input').addEventListener('input', () => { bgCanvas.style.filter = 'blur(' + window.S.bgBlur + 'px)' });
    }

    const ob = document.getElementById('offsetsBody');
    if (ob) {
        ob.innerHTML = '';
        makeSlider(ob, 'World X Offset', 'px', 'left', 'right', 'offsetX', -500, 500, 1, () => { if (window.engine) window.engine.updateUniforms(); });
        makeSlider(ob, 'World Y Offset', 'py', 'down', 'up', 'offsetY', -500, 500, 1, () => { if (window.engine) window.engine.updateUniforms(); });
        makeSlider(ob, 'World Z Offset', 'pz', 'back', 'fore', 'offsetZ', -500, 500, 1, () => { if (window.engine) window.engine.updateUniforms(); });
        makeSlider(ob, 'Billboard Offset', 'math', 'min', 'max', 'billboardOffset', -100, 100, 1, () => { if (window.engine) window.engine.updateUniforms(); });
        
        const rb = document.createElement('div');
        rb.className = 'btn';
        rb.style.cssText = 'margin-top:10px;text-align:center;color:#ff8888;border-color:#ff4444';
        rb.textContent = 'RESET OFFSETS';
        rb.onclick = () => {
            window.S.offsetX = 0; window.S.offsetY = 0; window.S.offsetZ = 0; window.S.billboardOffset = 0;
            if (sliderSync.offsetX) {
                sliderSync.offsetX(0); sliderSync.offsetY(0); sliderSync.offsetZ(0); sliderSync.billboardOffset(0);
            }
            if (window.engine) window.engine.updateUniforms();
            try { localStorage.setItem('ss_state', JSON.stringify(window.S)) } catch (e) { }
        };
        ob.appendChild(rb);
    }

    // ─── Config & Controls ─────────────────────────────────────────────────
    const cbConfig = document.getElementById('configBody');
    if (cbConfig) {
        cbConfig.innerHTML = '';

        // Navigation toggle is in the dock bar now (far-left segmented button)
        // — see buildDock() / dock-nav-toggle. This panel no longer hosts it.

        // ─── Tab Bar (UI / System / Profile) ───────────────────────────────
        // Three-tab structure. UI is the most-touched section so it sits
        // leftmost and is the boot default. System narrows to "what gets
        // captured/saved" — fewer controls, clearer scope. Profile holds
        // identity and save-file management.
        //
        // Active tab is persisted so reopening Config remembers your last
        // view. Legacy 'system' values from the old two-tab layout are
        // accepted as-is.
        const tabBar = document.createElement('div');
        tabBar.className = 'cfg-tab-bar';
        const tabUI = document.createElement('button');
        tabUI.className = 'cfg-tab';
        tabUI.dataset.tab = 'ui';
        tabUI.textContent = 'UI';
        const tabSystem = document.createElement('button');
        tabSystem.className = 'cfg-tab';
        tabSystem.dataset.tab = 'system';
        tabSystem.textContent = 'System';
        const tabProfile = document.createElement('button');
        tabProfile.className = 'cfg-tab';
        tabProfile.dataset.tab = 'profile';
        tabProfile.textContent = 'Profile';
        tabBar.appendChild(tabUI);
        tabBar.appendChild(tabSystem);
        tabBar.appendChild(tabProfile);
        cbConfig.appendChild(tabBar);

        const uiPane = document.createElement('div');
        uiPane.className = 'cfg-pane';
        uiPane.dataset.tab = 'ui';
        cbConfig.appendChild(uiPane);

        const systemPane = document.createElement('div');
        systemPane.className = 'cfg-pane';
        systemPane.dataset.tab = 'system';
        cbConfig.appendChild(systemPane);

        const profilePane = document.createElement('div');
        profilePane.className = 'cfg-pane';
        profilePane.dataset.tab = 'profile';
        cbConfig.appendChild(profilePane);

        const showCfgTab = (t) => {
            [tabUI, tabSystem, tabProfile].forEach(b => { b.dataset.active = (b.dataset.tab === t) ? 'true' : 'false'; });
            uiPane.style.display      = (t === 'ui')      ? '' : 'none';
            systemPane.style.display  = (t === 'system')  ? '' : 'none';
            profilePane.style.display = (t === 'profile') ? '' : 'none';
            try { localStorage.setItem('ss_cfg_tab', t); } catch (e) {}
        };
        tabUI.addEventListener('click',      () => showCfgTab('ui'));
        tabSystem.addEventListener('click',  () => showCfgTab('system'));
        tabProfile.addEventListener('click', () => showCfgTab('profile'));
        let lastCfgTab = 'ui';
        try {
            const saved = localStorage.getItem('ss_cfg_tab');
            if (saved === 'ui' || saved === 'system' || saved === 'profile') lastCfgTab = saved;
        } catch (e) {}
        showCfgTab(lastCfgTab);

        // ─── PROFILE PANE ──────────────────────────────────────────────────
        makeSection(profilePane, 'Profile');
        const profileSection = document.createElement('div');
        // DOM construction so the persisted profile id (which a determined
        // attacker could have edited in localStorage) can't inject HTML.
        // The username comes through an <input>.value which is already
        // text-only, but we sanitize on the way out (saveProfile callsite)
        // and on the way in (loadOrCreateProfile) too.
        const _profRow = document.createElement('div');
        _profRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;';
        const _profInput = document.createElement('input');
        _profInput.type = 'text';
        _profInput.id = 'cfgUsername';
        _profInput.placeholder = 'username';
        _profInput.value = sanitizeName(window.profile?.username, { maxLen: 32 });
        _profInput.style.cssText = 'flex:1;background:rgba(8,8,16,0.7);border:1px solid rgba(40,40,70,0.6);color:#cce6ff;padding:5px 7px;border-radius:3px;font-family:inherit;font-size:10px;outline:none;';
        _profRow.appendChild(_profInput);
        profileSection.appendChild(_profRow);
        const _profIdRow = document.createElement('div');
        _profIdRow.style.cssText = 'font-size:8px;color:#5a6a7a;letter-spacing:.04em;margin-bottom:10px;';
        // id is a Date.now()+random base36 string in normal use; defensively
        // sanitize in case localStorage was tampered with.
        const _safeId = sanitizeName(window.profile?.id, { maxLen: 100 }) || '(none)';
        _profIdRow.textContent = 'id: ' + _safeId;
        profileSection.appendChild(_profIdRow);
        profilePane.appendChild(profileSection);
        const usernameInput = _profInput;
        usernameInput.addEventListener('change', () => {
            window.profile.username = sanitizeName(usernameInput.value, { maxLen: 32 });
            saveProfile();
        });

        // ─── Save Progress ─────────────────────────────────────────────────
        // Placed under Profile (beneath the user's ID) because save files
        // are an extension of "who you are" in the app — your captures,
        // your settings, your identity travel together. Sits at the bottom
        // of the profile pane so the section header order reads as a
        // natural progression: Profile → Save Progress.
        //
        // Four toggles control what the file contains: Settings (looks &
        // simulation defaults), Profile (username/id), Waypoints
        // (collection), Thumbnails (the heavy embedded images on each
        // waypoint). Thumbnails depends on Waypoints — selecting it
        // without Waypoints would orphan the image data — and the
        // dependency is enforced visually by greying out Thumbnails when
        // Waypoints is off. If all four toggles are off the Save button
        // disables; the user discovers the relationship by trying and
        // seeing the button go inert. The toggle state persists across
        // sessions (window.S.exportInclude* fields) so a user who always
        // exports aesthetic-only doesn't re-tick boxes every time.
        makeSection(profilePane, 'Save Progress');

        const _saveInclHdr = document.createElement('div');
        _saveInclHdr.className = 'subsection';
        _saveInclHdr.textContent = 'Include in save file';
        profilePane.appendChild(_saveInclHdr);

        // Row 1: Settings + Profile — the impersonal/personal split.
        const exportRow1 = makeGroupToggles(profilePane, [
            { label: 'Settings', key: 'exportIncludeSettings' },
            { label: 'Profile',  key: 'exportIncludeProfile'  }
        ]);
        // Row 2: Waypoints + Thumbnails — collection-related pair with
        // dependency (Thumbnails requires Waypoints).
        const exportRow2 = makeGroupToggles(profilePane, [
            { label: 'Waypoints',  key: 'exportIncludeWaypoints'  },
            { label: 'Thumbnails', key: 'exportIncludeThumbnails' }
        ]);

        const saveSection = document.createElement('div');
        saveSection.style.cssText = 'margin-top:8px;margin-bottom:8px;display:flex;gap:6px;';
        const exportBtn = document.createElement('div');
        exportBtn.className = 'btn';
        exportBtn.style.cssText = 'flex:1;text-align:center;cursor:pointer;color:#cce6ff;justify-content:center;';
        exportBtn.textContent = 'Save';
        exportBtn.addEventListener('click', () => {
            // Defense-in-depth: even though the button is disabled when no
            // toggles are on, double-check before triggering an export.
            // Belt-and-suspenders against any future code path that bypasses
            // the click handler (keyboard shortcuts, etc.).
            const anyOn = !!(window.S.exportIncludeSettings || window.S.exportIncludeProfile
                          || window.S.exportIncludeWaypoints || window.S.exportIncludeThumbnails);
            if (!anyOn) return;
            exportSaveFile();
        });
        saveSection.appendChild(exportBtn);
        const importBtn = document.createElement('div');
        importBtn.className = 'btn';
        importBtn.style.cssText = 'flex:1;text-align:center;cursor:pointer;color:#cce6ff;justify-content:center;';
        importBtn.textContent = 'Load';
        importBtn.addEventListener('click', () => {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.json,.scalespace.json,application/json';
            inp.style.display = 'none';
            inp.addEventListener('change', () => importSaveFile(inp.files[0]));
            document.body.appendChild(inp);
            inp.click();
            setTimeout(() => inp.remove(), 5000);
        });
        saveSection.appendChild(importBtn);
        profilePane.appendChild(saveSection);

        // Wire the dependency + Save-button-disable logic. Two coupled
        // behaviors:
        //
        //   1. Thumbnails-requires-Waypoints. When Waypoints turns off, we
        //      visually grey out Thumbnails AND force its state to off so
        //      the user can't be silently in a state where they've ticked
        //      Thumbnails-only and assume they'll get thumbnails on import.
        //      When Waypoints comes back on, Thumbnails restores to its
        //      pre-disable state (we remember the user's last intent via
        //      _thumbWasOnBeforeDisable so toggling Waypoints off/on
        //      doesn't lose their choice).
        //
        //   2. Save-button enabled iff at least one toggle is on. Empty
        //      export files are silly but harmless — disabling the button
        //      teaches the user the toggles → action relationship without
        //      a confirmation dialog or error message. Discovery via
        //      tactile feedback.
        let _thumbWasOnBeforeDisable = window.S.exportIncludeThumbnails !== false;
        const updateExportUI = () => {
            const wpOn = !!window.S.exportIncludeWaypoints;
            // Thumbnails dependency on Waypoints.
            if (!wpOn && window.S.exportIncludeThumbnails) {
                // User just turned Waypoints off while Thumbnails was on.
                // Remember that for restore-on-reenable, then force-clear.
                _thumbWasOnBeforeDisable = true;
                window.S.exportIncludeThumbnails = false;
                try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}
                // The Thumbnails tab in exportRow2 has an updater registered
                // under its own key; fire it so the button visually deselects.
                const upd = window._toggleUpdaters && window._toggleUpdaters['exportIncludeThumbnails'];
                if (upd) upd.forEach(fn => { try { fn(); } catch (e) {} });
            } else if (wpOn && _thumbWasOnBeforeDisable && !window.S.exportIncludeThumbnails) {
                // Restore on re-enable, but only if the user hasn't already
                // re-clicked Thumbnails themselves (which would have flipped
                // the flag back on without our help). Safe because we only
                // reach this branch when Thumbnails is off AND was-on-before.
                window.S.exportIncludeThumbnails = true;
                try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (e) {}
                const upd = window._toggleUpdaters && window._toggleUpdaters['exportIncludeThumbnails'];
                if (upd) upd.forEach(fn => { try { fn(); } catch (e) {} });
            }
            exportRow2.classList.toggle('thumb-disabled', !wpOn);
            // CSS targets the Thumbnails button specifically — see app.css.
            // The whole row isn't disabled because Waypoints itself still
            // needs to be clickable.

            // Save button enable: at least one toggle on.
            const anyOn = !!(window.S.exportIncludeSettings || window.S.exportIncludeProfile
                          || window.S.exportIncludeWaypoints || window.S.exportIncludeThumbnails);
            exportBtn.classList.toggle('disabled', !anyOn);
        };
        // If the user clicks the Thumbnails tab directly, remember that as
        // their explicit intent (resets the auto-restore behavior).
        const _captureThumbIntent = () => {
            // Read after the click handler in makeGroupToggles has flipped
            // window.S.exportIncludeThumbnails. If Waypoints is on (the
            // only state in which this click is meaningful), record the new
            // value as the user's most recent explicit intent.
            if (window.S.exportIncludeWaypoints) {
                _thumbWasOnBeforeDisable = !!window.S.exportIncludeThumbnails;
            }
        };
        window._toggleUpdaters = window._toggleUpdaters || {};
        ['exportIncludeSettings', 'exportIncludeProfile', 'exportIncludeWaypoints'].forEach(k => {
            if (!window._toggleUpdaters[k]) window._toggleUpdaters[k] = new Set();
            window._toggleUpdaters[k].add(updateExportUI);
        });
        if (!window._toggleUpdaters['exportIncludeThumbnails']) window._toggleUpdaters['exportIncludeThumbnails'] = new Set();
        window._toggleUpdaters['exportIncludeThumbnails'].add(_captureThumbIntent);
        window._toggleUpdaters['exportIncludeThumbnails'].add(updateExportUI);
        updateExportUI();

        // ─── UI PANE ───────────────────────────────────────────────────────
        // Order per spec: Panel Opacity → Button Opacity → UI Zoom → UI
        // Scanlines → Screen Scanlines → Radial Button Shape → Theme.
        // Reads top-to-bottom from "how transparent" to "how it looks" to
        // "what flavor" — coarse-to-fine adjustment.
        makeSection(uiPane, 'Interface');
        makeSlider(uiPane, c.panelOpacity?.label || 'Panel Opacity', c.panelOpacity?.sub ||'', c.panelOpacity?.ll ||'clear', c.panelOpacity?.lr ||'solid', 'panelOpacity', 0, 1, .05, () => {
            updatePO();
        });
        makeSlider(uiPane, 'Button Opacity', '', 'clear', 'solid', 'buttonOpacity', 0, 1, .05, () => {
            updatePO();
        });
        makeSlider(uiPane, 'UI Zoom', '', '50%', '150%', 'uiZoom', 0.5, 1.5, .05, (val) => {
            updateUIZoom(val);
        });

        makeSection(uiPane, 'Scanlines');
        makeSlider(uiPane, 'UI Scanlines', 'panel overlay', 'off', 'strong', 'uiScanlines', 0, 0.5, 0.01, () => { applyTheme(); });
        makeSlider(uiPane, 'Screen Scanlines', 'canvas overlay', 'off', 'strong', 'screenScanlines', 0, 0.5, 0.01, () => { applyTheme(); });

        makeSection(uiPane, 'Radial Button Shape');
        makeGroupToggles(uiPane, [
            { label: 'Hex',    key: 'buttonShape', matchVal: 'hex',    cb: () => { applyButtonShape(); } },
            { label: 'Circle', key: 'buttonShape', matchVal: 'circle', cb: () => { applyButtonShape(); } }
        ]);

        makeSection(uiPane, 'Theme');
        makeGroupToggles(uiPane, [
            { label: 'Synthesist', key: 'theme', matchVal: 'synthesist', cb: () => { applyTheme(); } },
            { label: 'Classic',    key: 'theme', matchVal: 'classic',    cb: () => { applyTheme(); } }
        ]);

        // ─── SYSTEM PANE ───────────────────────────────────────────────────
        // System holds capture/save behavior — narrower scope than the old
        // version. Interface customization moved to the UI tab for cleaner
        // information architecture.
        //
        // ─── Save Screenshot on new ────────────────────────────────────────
        // Single section header with two buttons: Waypoint / Thumbnail.
        // Either being on enables the Include sub-controls; both off
        // disables them visually and functionally, since there's no save
        // happening to include anything in.
        makeSection(systemPane, 'Save Screenshot on new');

        const saveGroup = makeGroupToggles(systemPane, [
            { label: 'Waypoint',  key: 'saveOnNewWaypoint' },
            { label: 'Thumbnail', key: 'saveOnNewThumbnail' }
        ]);

        const inclHdr = document.createElement('div');
        inclHdr.className = 'subsection';
        inclHdr.textContent = 'Include';
        systemPane.appendChild(inclHdr);
        const inclGroup = makeGroupToggles(systemPane, [
            { label: 'Background', key: 'includeScreenshotBg' },
            { label: 'Scanlines',  key: 'includeScreenshotScanlines' }
        ]);

        // Live coupling: Include group enabled iff at least one Save toggle
        // is on. Registered in _toggleUpdaters under both Save keys so the
        // central updater dispatch (in makeGroupToggles click) fires this
        // when either toggle changes. Runs once on build for initial state.
        const updateInclEnabled = () => {
            const anySave = !!window.S.saveOnNewWaypoint || !!window.S.saveOnNewThumbnail;
            inclGroup.classList.toggle('disabled', !anySave);
        };
        window._toggleUpdaters = window._toggleUpdaters || {};
        ['saveOnNewWaypoint', 'saveOnNewThumbnail'].forEach(k => {
            if (!window._toggleUpdaters[k]) window._toggleUpdaters[k] = new Set();
            window._toggleUpdaters[k].add(updateInclEnabled);
        });
        updateInclEnabled();

        const inclSpacer = document.createElement('div');
        inclSpacer.style.cssText = 'margin-bottom:14px;';
        systemPane.appendChild(inclSpacer);

    }

    const cb = document.getElementById('controlsBody'); cb.innerHTML = '';
    const info = document.createElement('div'); info.style.cssText = 'padding:6px 8px;font-size:9px;color:#8ab8e8;letter-spacing:.04em;line-height:1.7';
    
    const inst = (T.instructions && T.instructions.global) ? T.instructions : { 
        global: { title: 'Global Controls', keys: [] }, 
        orbit: { title: 'Orbit Mode', keys: [] }, 
        fly: { title: 'Fly Mode', keys: [] } 
    };
    
    let html = `<strong style="color:#7a9acc;font-size:10px">${inst.global.title}</strong><br>${inst.global.keys.join('<br>')}`;
    html += `<br><br><strong style="color:#7a9acc;font-size:10px">${inst.orbit.title}</strong><br>${inst.orbit.keys.join('<br>')}`;
    html += `<br><br><strong style="color:#7a9acc;font-size:10px">${inst.fly.title}</strong><br>${inst.fly.keys.join('<br>')}`;
    
    info.innerHTML = html;
    cb.appendChild(info);

    // Build Atlas UI
    buildAtlasUI(engine);
    
    // Finalize Opacity
    updatePO();
}

export function updatePO() {
    const defaultA = 0.55;
    const a = typeof window.S.panelOpacity === 'number' ? window.S.panelOpacity : defaultA;
    window.S.panelOpacity = a; // Ensure state holds a safe value
    
    const btnA = typeof window.S.buttonOpacity === 'number' ? window.S.buttonOpacity : 0.8;
    window.S.buttonOpacity = btnA;
    document.documentElement.style.setProperty('--btn-alpha', btnA);
    
    const btnBgAlpha = Math.max(0, (btnA - 0.1) * 0.5);
    document.documentElement.style.setProperty('--btn-bg-top', btnBgAlpha);
    document.documentElement.style.setProperty('--btn-bg-bot', btnBgAlpha * 0.9);
    
    const btnBlurVal = Math.max(0, (btnA - 0.05) * 12.63);
    document.documentElement.style.setProperty('--btn-blur', btnA < 0.05 ? '0px' : btnBlurVal.toFixed(1) + 'px');
    document.documentElement.style.setProperty('--btn-border', btnA * 0.8);
    
    const bgCanvas = document.getElementById('bgGlow');
    if (bgCanvas) bgCanvas.style.filter = 'blur(' + (window.S.bgBlur ?? 40) + 'px)';
    
    ['panelParams', 'panelSettings', 'panelAtlas', 'panelControls', 'panelConfig', 'panelEntropy'].forEach(id => {
        const p = document.getElementById(id);
        if (!p) return;
        if (a < 0.01) {
            p.style.background = 'transparent';
            p.style.border = 'none';
            p.style.boxShadow = 'none';
            p.style.backdropFilter = 'none';
            const h = p.querySelector('.panel-head'); if (h) h.style.borderBottom = 'none';
        } else {
            const blurVal = Math.max(0, (a - 0.05) * 12.63);
            const bgAlpha = Math.max(0, (a - 0.1) * 0.5);
            p.style.background = 'linear-gradient(180deg,rgba(12,12,31,' + bgAlpha + '),rgba(8,8,26,' + (bgAlpha * 0.9) + '))';
            p.style.border = '1px solid rgba(40, 40, 80, ' + Math.min(0.6, a * 6) + ')';
            p.style.boxShadow = '0 8px 32px rgba(0, 0, 0, ' + Math.min(0.5, a * 5) + ')';
            p.style.backdropFilter = a < 0.05 ? 'none' : 'blur(' + blurVal.toFixed(1) + 'px)';
            const h = p.querySelector('.panel-head'); if (h) h.style.borderBottom = '1px solid rgba(30, 30, 60, ' + Math.min(0.5, a * 5) + ')';
        }
    });
}

export function updateUIZoom(val) {
    const v = typeof val === 'number' ? val : (window.S.uiZoom || 1.0);
    window.S.uiZoom = v;
    document.documentElement.style.setProperty('--ui-zoom', v);
    // Re-clamp panels so they can't be zoomed off-screen
    if (window.clampPanels) window.clampPanels();
}
window.updateUIZoom = updateUIZoom;

// ───────────────────────────────────────────────────────────────────────────
//   7. Bootstrap
// ───────────────────────────────────────────────────────────────────────────

window.buildAtlasUI = buildAtlasUI;
window.buildUI = buildUI;
window.captureWaypoint = captureWaypoint;
window.startTour = startTour;
window.stopTour = stopTour;
window.tour = tour;
window.APP_TEXT = APP_TEXT;

const SS_VERSION = '0.1';
window.SS_VERSION = SS_VERSION;

// ─── Global State ──────────────────────────────────────────────────────────
window.S = {
	
    // ─── Simulation ────────────────────────────────────────────────────────
    freeEnergy: 100000,
    resolution: 0.100,
    inversion: 500,
    halfLife: 15.0,
    scaleDepth: 0.0,
    coherence: 1.0,
    equilibrium: 0.001,
    temperature: 0.0,
    viscosity: 1.0,
    mass: 5.0,
    
    // Visuals
    tempo: 0.020,
    showParticles: true,
    showRibbons: false,
    tessRibbons: false,
    shape: "circle",
    colorMode: 2,
    hue: 0.3,
    sat: 0.8,
    lightness: 0.9,
    opacity: 0.75,
    trailLen: 10,
    bgGlow: 0.3,
    bgBlur: 40,
    
    // ─── Navigation ────────────────────────────────────────────────────────
    moveMode: "orbit",
    
    // ─── UI ────────────────────────────────────────────────────────────────
    uiZoom: 1.0,
    panelOpacity: 0.9,
    buttonOpacity: 0.8,
    uiVisible: true,
    theme: 'synthesist',     // 'classic' | 'synthesist'  (default: synthesist for the new build identity)
    uiScanlines: 0,          // 0..0.5 opacity of CRT scanlines over panels
    screenScanlines: 0.18,   // 0..0.5 opacity of CRT scanlines over the simulation canvas
    buttonShape: 'hex',      // 'hex' | 'circle'  (radial menu button shape)
    // Screenshot save triggers, split per gesture so users can opt into one
    // or both flows. Old saveScreenshots key is migrated at load time.
    saveOnNewWaypoint: false,
    saveOnNewThumbnail: false,
    includeScreenshotBg: false, // when true, screenshot includes the dark backdrop; when false, transparent
    includeScreenshotScanlines: false, // when true, screenshot bakes in the CRT scanline overlay
    
    // ─── Audio ─────────────────────────────────────────────────────────────
    audioOn: false,
    volume: 0.5,
    
    // Base attributes manually mapped outside APP_CONFIG
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    billboardOffset: 0,
    lastWpCat: 'Waypoints',
    tourMode: 'sequential',   // 'sequential' | 'random'

    // Export-toggle state. Persists across sessions so users who always
    // export aesthetic-only (settings off, waypoints off, etc.) don't have
    // to re-tick the same boxes every time.
    exportIncludeSettings:   true,
    exportIncludeProfile:    true,
    exportIncludeWaypoints:  true,
    exportIncludeThumbnails: true
};
window.DEFAULTS = { ...window.S };
window.PARAM_KEYS = PARAM_KEYS;

// Temporary globals for UI.js until fully modularized
window.uiVisible = true;
window.waypoints = [];
window.atlasView = 'list';
window.collapsedCats = {};

// ───────────────────────────────────────────────────────────────────────────
//   8. Profile, Save File, Theme, Modulation
// ───────────────────────────────────────────────────────────────────────────

// ─── Input sanitization & validation ───────────────────────────────────────
// Defense-in-depth for the trust boundaries where untrusted data enters the
// app: imported save files, share strings, and localStorage (which an
// attacker with prior DOM access could have tampered with).
//
// Three helpers, used at every boundary:
//   sanitizeName(s, opts)  — coerce-to-string, strip control chars, length-cap.
//                            Use on every user-facing string before it lands
//                            in state or is interpolated anywhere.
//   validateWaypoint(w)    — return a fresh waypoint object built field-by-
//                            field with allowlisted keys and type-checked
//                            values. Returns null on malformed input.
//   hydrateState(raw)      — merge a raw state object into window.S using
//                            window.DEFAULTS as the key allowlist, with
//                            per-type coercion (numbers / bools / enums).
//                            Unknown keys are dropped; tampered types are
//                            ignored. Used at boot hydration AND import.
//
// The "real" defenses against XSS are at the DOM sinks (we use textContent
// and DOM construction rather than innerHTML for any user-controlled data).
// These helpers add a second layer: even if a future change re-introduces an
// innerHTML interpolation by accident, the strings flowing through it have
// already been control-char-stripped and length-capped.
function sanitizeName(s, opts) {
    const maxLen = (opts && opts.maxLen) || 200;
    const allowNewlines = !!(opts && opts.allowNewlines);
    if (typeof s !== 'string') return '';
    // C0/C1 control char strip. When allowNewlines is set, preserve \n and
    // \r so multi-line notes survive; tab (\t) is always stripped to avoid
    // layout surprises in single-line UI elements.
    const re = allowNewlines
        ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/g
        : /[\u0000-\u001F\u007F-\u009F]/g;
    let out = s.replace(re, '').trim();
    if (out.length > maxLen) out = out.slice(0, maxLen);
    return out;
}

const _VALID_SHAPES = new Set(['circle', 'square', 'diamond']);
function _isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function _isFiniteIntInRange(v, lo, hi) { return typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi; }
function _isFiniteNumberArray(v, len) {
    if (!Array.isArray(v) || v.length !== len) return false;
    for (let i = 0; i < len; i++) if (!_isFiniteNumber(v[i])) return false;
    return true;
}

function validateWaypoint(w) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) return null;

    const out = {
        id: typeof w.id === 'string' ? w.id.slice(0, 100) : ('wp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
        coordId: typeof w.coordId === 'string' ? w.coordId.slice(0, 50) : '',
        name: sanitizeName(w.name, { maxLen: 200 }) || 'Untitled',
        notes: sanitizeName(w.notes, { maxLen: 2000, allowNewlines: true }),
        category: sanitizeName(w.category, { maxLen: 100 }) || 'Waypoints',
        timestamp: _isFiniteNumber(w.timestamp) ? w.timestamp : Date.now(),
        isImported: !!w.isImported,
        thumbAspect: (_isFiniteNumber(w.thumbAspect) && w.thumbAspect > 0 && w.thumbAspect < 100) ? w.thumbAspect : (16 / 9),
        params: {},
        visuals: {},
        camDist: (_isFiniteNumber(w.camDist) && w.camDist > 0 && w.camDist < 1e6) ? w.camDist : 300,
        camPosArr: _isFiniteNumberArray(w.camPosArr, 3) ? w.camPosArr.slice(0, 3) : [0, 0, 300],
        camQuatArr: _isFiniteNumberArray(w.camQuatArr, 4) ? w.camQuatArr.slice(0, 4) : [0, 0, 0, 1]
    };

    // Thumbnail: data URLs only, length-capped to ~2MB (toDataURL output
    // for our thumbnails sits well under this). Reject any other shape
    // — including http: URLs which could exfiltrate referer or trigger
    // mixed-content fetches.
    if (typeof w.thumbnail === 'string'
        && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(w.thumbnail)
        && w.thumbnail.length < 2_000_000) {
        out.thumbnail = w.thumbnail;
    } else {
        out.thumbnail = null;
    }

    // Params — PARAM_KEYS allowlist, finite-number values only.
    const inParams = (w.params && typeof w.params === 'object' && !Array.isArray(w.params)) ? w.params : {};
    PARAM_KEYS.forEach(k => {
        if (_isFiniteNumber(inParams[k])) out.params[k] = inParams[k];
    });

    // Visuals — explicit allowlist + per-key type rules.
    const inV = (w.visuals && typeof w.visuals === 'object' && !Array.isArray(w.visuals)) ? w.visuals : {};
    const visNumKeys = ['hue', 'sat', 'lightness', 'opacity', 'tempo', 'trailLen',
                        'bgGlow', 'bgBlur', 'offsetX', 'offsetY', 'offsetZ', 'billboardOffset'];
    visNumKeys.forEach(k => { if (_isFiniteNumber(inV[k])) out.visuals[k] = inV[k]; });
    if (_isFiniteIntInRange(inV.colorMode, 0, 3)) out.visuals.colorMode = inV.colorMode;
    if (typeof inV.showParticles === 'boolean') out.visuals.showParticles = inV.showParticles;
    if (typeof inV.showRibbons === 'boolean')   out.visuals.showRibbons   = inV.showRibbons;
    if (typeof inV.tessRibbons === 'boolean')   out.visuals.tessRibbons   = inV.tessRibbons;
    if (typeof inV.shape === 'string' && _VALID_SHAPES.has(inV.shape)) out.visuals.shape = inV.shape;

    // Mods — MOD_KEYS allowlist, finite-number values only.
    const inMods = (inV.mods && typeof inV.mods === 'object' && !Array.isArray(inV.mods)) ? inV.mods : null;
    if (inMods) {
        out.visuals.mods = {};
        MOD_KEYS.forEach(k => { if (_isFiniteNumber(inMods[k])) out.visuals.mods[k] = inMods[k]; });
    }

    // Future-multiplayer fields — pass through with sanitization. authorId
    // and remoteId are opaque tokens (not displayed), so just length-cap.
    // authorName and tags will be displayed, so they go through sanitizeName.
    if (typeof w.authorId === 'string')   out.authorId = w.authorId.slice(0, 50);
    if (typeof w.authorName === 'string') out.authorName = sanitizeName(w.authorName, { maxLen: 64 });
    if (Array.isArray(w.tags)) {
        out.tags = w.tags
            .filter(t => typeof t === 'string')
            .map(t => sanitizeName(t, { maxLen: 30 }))
            .filter(Boolean)
            .slice(0, 20);
    }
    if (typeof w.isShared === 'boolean') out.isShared = w.isShared;
    if (typeof w.remoteId === 'string')  out.remoteId = w.remoteId.slice(0, 50);

    return out;
}

// Allowlist of enum-valued state keys. The hydration step rejects any value
// not in the listed set, so a tampered save with `theme: '<script>...'` just
// gets the default theme instead.
const _STATE_ENUMS = {
    shape:       ['circle', 'square', 'diamond'],
    theme:       ['classic', 'synthesist'],
    buttonShape: ['hex', 'circle'],
    moveMode:    ['orbit', 'fly'],
    tourMode:    ['sequential', 'random']
};

// Numeric clamps for keys where an unbounded value would actually hurt.
// freeEnergy drives a buffer allocation; everything else either flows into a
// shader uniform (which clamps in-shader) or a UI slider (clamped by the
// slider's min/max). If you add a new key whose magnitude has real-world
// cost, add it here.
const _STATE_CLAMPS = {
    freeEnergy: [0, 1_000_000]
};

function hydrateState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const defaults = window.DEFAULTS;
    if (!defaults) return;

    for (const k of Object.keys(defaults)) {
        if (!(k in raw)) continue;
        const v = raw[k];
        const d = defaults[k];

        // colorMode is the only int-valued numeric enum. typeof its default
        // is 'number' so it'd otherwise flow through the generic number
        // branch and accept e.g. 2.7. Special-case integer-and-range.
        if (k === 'colorMode') {
            if (_isFiniteIntInRange(Number(v), 0, 3)) window.S[k] = Number(v);
            continue;
        }

        if (typeof d === 'number') {
            const n = Number(v);
            if (!Number.isFinite(n)) continue;
            const clamp = _STATE_CLAMPS[k];
            window.S[k] = clamp ? Math.max(clamp[0], Math.min(clamp[1], n)) : n;
        } else if (typeof d === 'boolean') {
            if (typeof v === 'boolean') window.S[k] = v;
        } else if (typeof d === 'string') {
            const enums = _STATE_ENUMS[k];
            if (enums) {
                if (typeof v === 'string' && enums.includes(v)) window.S[k] = v;
            } else if (typeof v === 'string') {
                window.S[k] = sanitizeName(v, { maxLen: 100 });
            }
        }
        // typeof d === 'object' branch intentionally absent — the only
        // object-valued default key is homepoint, handled below via
        // validateWaypoint. Default null/undefined values fall through.
    }

    // Modulation keys (_mod suffix on each modulatable param). Not present
    // in DEFAULTS so handled separately. Bounded 0..1 in normal use; allow
    // a small headroom for legacy saves before rejecting.
    for (const k of MOD_KEYS) {
        if (!(k in raw)) continue;
        const n = Number(raw[k]);
        if (Number.isFinite(n) && n >= 0 && n <= 2) window.S[k] = n;
    }

    // Homepoint: shaped like a waypoint, so the same validator applies.
    if (raw.homepoint && typeof raw.homepoint === 'object') {
        const hp = validateWaypoint(raw.homepoint);
        if (hp) {
            hp.id = 'homepoint'; // synthetic id is the contract travelTo expects
            window.S.homepoint = hp;
        }
    }

    // In-flight runtime values must never survive a session. Strip on every
    // hydrate so a half-faded snapshot can't pin visibility next boot.
    delete window.S._xfade;
    delete window.S._xfadeEnv;
}

// ─── Profile ───────────────────────────────────────────────────────────────
// User-facing identity: a username + a server-clock-based ID generated on first run. Stamped onto every waypoint captured going forward, ready for multiplayer when it ships. Username is freely editable; ID is immutable.

function loadOrCreateProfile() {
    let profile = null;
    try {
        const saved = localStorage.getItem('ss_profile');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                // Reconstruct field-by-field with sanitization rather than
                // trusting whatever shape was on disk. id and buildVersion
                // are opaque tokens (length-cap only); username is displayed
                // so it goes through sanitizeName.
                const id = typeof parsed.id === 'string' ? parsed.id.slice(0, 100) : '';
                if (id) {
                    profile = {
                        id,
                        username: sanitizeName(parsed.username, { maxLen: 32 }),
                        createdAt: _isFiniteNumber(parsed.createdAt) ? parsed.createdAt : Date.now(),
                        buildVersion: typeof parsed.buildVersion === 'string'
                            ? parsed.buildVersion.slice(0, 20)
                            : SS_VERSION
                    };
                }
            }
        }
    } catch (e) { /* fall through */ }

    if (!profile) {
        profile = {
            id: Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
            username: '',
            createdAt: Date.now(),
            buildVersion: SS_VERSION
        };
        try { localStorage.setItem('ss_profile', JSON.stringify(profile)); } catch (e) {}
    }
    return profile;
}

function saveProfile() {
    if (!window.profile) return;
    try { localStorage.setItem('ss_profile', JSON.stringify(window.profile)); } catch (e) {}
}

// ─── Save File ─────────────────────────────────────────────────────────────
// Export all data as a single .scalespace.json file
// Schema designed to be forward-compatible with the eventual multiplayer server. Adding new fields to waypoints (tags, isShared, remoteId) costs nothing now and saves a migration headache later.

function buildExportPayload(opts) {
    // opts: { includeSettings, includeProfile, includeWaypoints, includeThumbnails }
    // Each toggle independently omits a section. Thumbnails-without-waypoints
    // is meaningless (orphan data); the UI prevents that combination but we
    // also defensively force-clear it here.
    const o = opts || {};
    const inclSettings   = o.includeSettings   !== false;
    const inclProfile    = o.includeProfile    !== false;
    const inclWaypoints  = o.includeWaypoints  !== false;
    const inclThumbnails = inclWaypoints && (o.includeThumbnails !== false);

    // Round numeric values to remove float noise. Different parameters have very different sane precisions, so we use a small lookup.
    const PRECISION = {
        opacity: 2, panelOpacity: 2, buttonOpacity: 2, volume: 2,
        sat: 2, lightness: 2, hue: 3,
        equilibrium: 3, temperature: 2, viscosity: 2,
        mass: 2, scaleDepth: 2, coherence: 0, halfLife: 1,
        bgGlow: 2, bgBlur: 1, tempo: 2, trailLen: 0,
        resolution: 2, inversion: 0, freeEnergy: 0,
        offsetX: 0, offsetY: 0, offsetZ: 0, billboardOffset: 0,
        uiZoom: 2,
    };

    const payload = {
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        exportedFrom: 'scale-space-synth',
        buildVersion: SS_VERSION
    };

    if (inclSettings) {
        const settings = { ...window.S };
        // Don't export transient/sensitive fields
        delete settings.audioOn; // always restored to false on load anyway
        // Fade-animation state — runtime only, never part of a save's identity.
        // If included, a save mid-fade would teach the importer a "pinned dip"
        // alpha with no timer to recover from it.
        delete settings._xfade;
        delete settings._xfadeEnv;
        // Don't export the export-toggle preferences themselves. They're a
        // per-user UI state, not a portable setting. Including them would
        // mean importing someone else's save overwrites your toggle choices.
        delete settings.exportIncludeSettings;
        delete settings.exportIncludeProfile;
        delete settings.exportIncludeWaypoints;
        delete settings.exportIncludeThumbnails;

        for (const [k, p] of Object.entries(PRECISION)) {
            if (typeof settings[k] === 'number') {
                const factor = Math.pow(10, p);
                settings[k] = Math.round(settings[k] * factor) / factor;
            }
            const modKey = k + '_mod';
            if (typeof settings[modKey] === 'number') {
                settings[modKey] = Math.round(settings[modKey] * 1000) / 1000;
            }
        }
        payload.settings = settings;
    }

    if (inclProfile) {
        payload.profile = { ...window.profile };
    }

    if (inclWaypoints) {
        // Same precision cleanup for waypoint params (lots of these
        // accumulate over time)
        const cleanParams = (params) => {
            if (!params || typeof params !== 'object') return params;
            const out = {};
            for (const [k, v] of Object.entries(params)) {
                if (typeof v === 'number' && PRECISION[k] !== undefined) {
                    const factor = Math.pow(10, PRECISION[k]);
                    out[k] = Math.round(v * factor) / factor;
                } else {
                    out[k] = v;
                }
            }
            return out;
        };

        payload.waypoints = (window.waypoints || []).map(wp => {
            const out = {
                ...wp,
                params: cleanParams(wp.params),
                // Stamp future-multiplayer fields if missing
                authorId:    wp.authorId   || window.profile.id,
                authorName:  wp.authorName || window.profile.username || '',
                tags:        wp.tags       || [],
                isShared:    wp.isShared   || false,
                remoteId:    wp.remoteId   || null
            };
            // Strip thumbnail data when the user opted out. Recipients will
            // see a placeholder and a "Capture Thumbnail" button — the
            // existing UI path handles this naturally (see is-empty class
            // in the waypoint card render).
            if (!inclThumbnails) out.thumbnail = null;
            return out;
        });
    }

    return payload;
}

function exportSaveFile() {
    const payload = buildExportPayload({
        includeSettings:   window.S.exportIncludeSettings   !== false,
        includeProfile:    window.S.exportIncludeProfile    !== false,
        includeWaypoints:  window.S.exportIncludeWaypoints  !== false,
        includeThumbnails: window.S.exportIncludeThumbnails !== false
    });
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    // Filename: username (sanitized) + ISO date, no duplicate "scalespace"
    const name = (window.profile.username || 'save').replace(/[^a-zA-Z0-9_-]/g, '_');
    // Local-time date components rather than toISOString() which is UTC.
    // CST evenings would otherwise stamp tomorrow's date on save files.
    const _d = new Date();
    const ymd = _d.getFullYear() + '-' + String(_d.getMonth() + 1).padStart(2, '0') + '-' + String(_d.getDate()).padStart(2, '0');
    a.href = url;
    a.download = `${name}_${ymd}.scalespace.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importSaveFile(file) {
    if (!file) return;
    // Defensive cap on file size — the on-disk format is JSON with embedded
    // base64 thumbnails. 200MB is well above any legitimate save (typical
    // ~5MB) and rejects DoS-by-huge-file before we spend cycles parsing.
    if (typeof file.size === 'number' && file.size > 200_000_000) {
        alert('Import failed. File too large.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object') throw new Error('not an object');
            if (data.exportedFrom && data.exportedFrom !== 'scale-space-synth' && data.exportedFrom !== 'scale-space-bioclast') {
                // Sanitize before display — alert/confirm are text-only so
                // there's no HTML injection here, but a maliciously long or
                // control-char-laden exportedFrom could ruin the dialog.
                const _from = sanitizeName(String(data.exportedFrom), { maxLen: 60 });
                if (!confirm(`This file says it's from "${_from}". Import anyway?`)) return;
            }

            // Detect what's actually present in this file. Each section is
            // optional now — exports can be partial — so the confirm dialog
            // shows the user exactly what they're about to apply and what
            // will be left untouched.
            const hasSettings   = !!(data.settings  && typeof data.settings  === 'object');
            const hasProfile    = !!(data.profile   && typeof data.profile   === 'object');
            const hasWaypoints  = Array.isArray(data.waypoints);
            // "hasThumbnails" only means at least one waypoint has a real
            // thumbnail string. A waypoint with thumbnail:null counts as
            // not-having-a-thumbnail. This drives the dialog's "(no
            // thumbnails)" suffix below.
            const thumbCount = hasWaypoints
                ? data.waypoints.reduce((n, w) => n + ((w && typeof w.thumbnail === 'string') ? 1 : 0), 0)
                : 0;

            const _previewUsername = sanitizeName(hasProfile && data.profile.username, { maxLen: 32 });
            const _previewExportedAt = (typeof data.exportedAt === 'string')
                ? sanitizeName(data.exportedAt, { maxLen: 50 })
                : 'unknown';

            // Build the contents preview. Each line only appears if that
            // section is actually present in the file. Order matches the
            // export-toggle order: Settings → Profile → Waypoints.
            const contentsLines = [];
            if (hasSettings)  contentsLines.push('  Settings + simulation defaults');
            if (hasProfile)   contentsLines.push(`  Profile (username: ${_previewUsername || '(none)'})`);
            if (hasWaypoints) {
                const thumbSuffix = data.waypoints.length === 0
                    ? ''
                    : (thumbCount === 0
                        ? ' (no thumbnails)'
                        : (thumbCount < data.waypoints.length
                            ? ` (${thumbCount} with thumbnails)`
                            : ''));
                contentsLines.push(`  Waypoints: ${data.waypoints.length}${thumbSuffix}`);
            }
            if (contentsLines.length === 0) contentsLines.push('  (file appears empty)');

            // The "this REPLACES" warning is now conditional on what's
            // actually being applied. If a file has only settings, we
            // shouldn't scare the user about their waypoints being touched
            // when they won't be.
            const replaceParts = [];
            if (hasSettings)  replaceParts.push('settings');
            if (hasWaypoints) replaceParts.push('waypoints');
            if (hasProfile)   replaceParts.push('profile');
            const replaceWarning = replaceParts.length
                ? `This REPLACES your current ${replaceParts.join(', ')}.`
                : 'This file contains no data to import.';

            const ok = confirm(
                `Import this save file?\n\n` +
                `Contents:\n${contentsLines.join('\n')}\n\n` +
                `Exported: ${_previewExportedAt}\n\n` +
                `${replaceWarning}\n` +
                `Click Cancel to abort. (Tip: export your current data first as a backup.)`
            );
            if (!ok) return;

            // Apply settings via allowlist hydration. Unknown keys are
            // dropped; tampered types fall back to defaults. The unbounded
            // Object.assign that used to live here is what made every
            // downstream interpolation an XSS target.
            if (hasSettings) {
                hydrateState(data.settings);
                window.S.audioOn = false;
                try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (err) {}
            }
            // Apply profile. We keep our local ID — imported profile should
            // not overwrite a returning user's identity unless they're
            // starting fresh on this machine — and take their username
            // through sanitizeName.
            if (hasProfile) {
                window.profile.username = sanitizeName(data.profile.username, { maxLen: 32 });
                saveProfile();
            }
            // Apply waypoints — each must pass validateWaypoint or it's
            // dropped. This is what neutralizes <script>-laden names,
            // out-of-range params, and shape-confused objects.
            if (hasWaypoints) {
                window.waypoints = data.waypoints
                    .map(w => validateWaypoint(w))
                    .filter(Boolean);
                if (window.saveWP) window.saveWP();
            }

            applyTheme(); applyButtonShape();
            if (window.engine) window.engine.updateUniforms();
            buildUI(window.engine);
            alert('Imported successfully.');
        } catch (err) {
            // Don't include err.message — even though alert() is text-only,
            // a parse error from a malformed file can surface attacker-
            // controlled JSON fragments and there's no diagnostic value
            // beyond "the file was bad" for end users.
            alert('Import failed. The file may be corrupt or in the wrong format.');
        }
    };
    reader.readAsText(file);
}

// ─── Theme ─────────────────────────────────────────────────────────────────
// Applies window.S.theme + window.S.scanlines as data attributes on <body>. CSS does the rest — see the [data-theme="..."] rules in app.css.

function applyTheme() {
    const t = window.S.theme || 'synthesist';
    document.body.setAttribute('data-theme', t);
    // Scanline opacities flow into CSS via vars; values stored in state
    const ui     = Math.max(0, Math.min(0.5, window.S.uiScanlines     ?? 0));
    const screen = Math.max(0, Math.min(0.5, window.S.screenScanlines ?? 0));
    document.body.style.setProperty('--ui-scan',     ui.toString());
    document.body.style.setProperty('--screen-scan', screen.toString());
}

function applyButtonShape() {
    const s = window.S.buttonShape || 'hex';
    const prev = document.body.getAttribute('data-button-shape');
    document.body.setAttribute('data-button-shape', s);
    // Relayout existing radial nodes so positions match the new shape. Guarded against being called before RadialInstance is constructed (happens during early init / theme apply on boot).
    try {
        const RI = window.RadialInstance;
        if (RI && RI.instances && typeof RI.instances.forEach === 'function') {
            RI.instances.forEach(m => {
                if (m && typeof m.relayoutNodes === 'function') m.relayoutNodes();
            });
        }
    } catch (e) { /* ignore — apply is best-effort */ }
    // Show a brief toast so users know the change took effect even when no radial menu is currently open.
    if (prev && prev !== s) {
        showToast(`Radial shape: ${s === 'circle' ? 'Circle' : 'Hex'}`);
    }
}

// ─── Tiny toast helper ─────────────────────────────────────────────────────
// Feedback on changes that happen "off-screen" (such as config changes that affect things the user can't currently see).
function showToast(msg, opts = {}) {
    const d = document.createElement('div');
    const accent = opts.color || (window.S.theme === 'synthesist' ? '#ffaa55' : '#50dcff');
    // Anchored at ~1/3 from the bottom — toasts at the top were getting lost
    // against the dock UI and hud text. This position floats over the open
    // canvas area so the message is in the user's natural focal zone.
    d.style.cssText = 'position:fixed;bottom:33vh;left:50%;transform:translateX(-50%);background:rgba(10,10,24,0.88);border:1px solid ' + accent + ';color:' + accent + ';padding:7px 14px;border-radius:4px;font-size:11px;font-weight:bold;z-index:1000;pointer-events:none;animation:fadeN 2s forwards;letter-spacing:0.06em;text-transform:uppercase;';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2000);
}
window.showToast = showToast;

// ─── ASCII Boot Splash ─────────────────────────────────────────────────────

function showBootSplash() {
    // The boot splash is a fullscreen click-catcher overlay. The ASCII art
    // lives in a centered child element; the overlay itself covers the
    // viewport so a click anywhere dismisses the splash without the click
    // also firing on whatever UI element happens to be under the cursor
    // (dock button, radial trigger, etc).
    const overlay = document.createElement('div');
    overlay.id = 'boot-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0',
        'pointer-events:auto', 'z-index:200',
        'cursor:pointer',
        'display:flex', 'align-items:center', 'justify-content:center',
        'flex-direction:column'
    ].join(';');
    document.body.appendChild(overlay);

    const el = document.createElement('pre');
    el.id = 'boot-splash';
    // Normalize: replace tabs with 4 spaces, trim trailing spaces on each line
    let art = BOOT_ASCII;
    art = art.replace(/\t/g, '    ');
    art = art.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');

    el.style.cssText = [
        'color:#fff', 'font-family:monospace, "Courier New", "JetBrains Mono"',
        'font-size:11px', 'line-height:1.15', 'white-space:pre',
        'text-align:left', 'opacity:1', 'transition:opacity 1.5s ease',
        'text-shadow:0 0 8px rgba(255,255,255,0.4)', 'margin:0', 'padding:0',
        'display:inline-block',
        'pointer-events:none' // clicks pass through to the overlay
    ].join(';');
    el.textContent = art;
    overlay.appendChild(el);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.textContent = '';

    // "Press any key" prompt appears below the art, after typing completes.
    const prompt = document.createElement('div');
    prompt.id = 'boot-prompt';
    prompt.style.cssText = [
        'margin-top:16px',
        'pointer-events:none',
        'color:rgba(255,255,255,0.7)',
        'font-family:monospace, "Courier New", "JetBrains Mono"',
        'font-size:10px', 'letter-spacing:0.25em', 'text-transform:uppercase',
        'opacity:0', 'transition:opacity 800ms ease',
        'text-shadow:0 0 8px rgba(255,255,255,0.3)'
    ].join(';');
    prompt.textContent = '▸ press any key to begin';
    overlay.appendChild(prompt);

    const lines = art.split('\n');
    let i = 0;
    const cadence = 70;
    // Track the pending typer setTimeout so dismiss can cancel it. Without
    // this, clicking during type-in left the typer running concurrently
    // with the eraser — the two would fight, producing a visible flicker
    // as one wrote lines while the other erased them.
    let typerHandle = null;
    const typer = () => {
        el.textContent = lines.slice(0, i + 1).join('\n');
        i++;
        if (i < lines.length) typerHandle = setTimeout(typer, cadence);
        else {
            typerHandle = null;
            // Typing done — fade in the "press any key" prompt and start
            // a gentle pulse so it reads as interactive. Stash the animation
            // handle on the outer scope so dismiss() can cancel it.
            requestAnimationFrame(() => { prompt.style.opacity = '1'; });
            pulseAnim = prompt.animate(
                [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
                { duration: 1800, iterations: Infinity, easing: 'ease-in-out' }
            );
        }
    };
    // NOTE: typer() is NOT called here. Caller invokes the returned
    // `startTyping` function once heavy init (setupUI, Engine) is complete,
    // so the typer's setTimeouts don't sit blocked in the queue while the
    // main thread is busy — which produced the line-batching stutter.

    let pulseAnim = null;
    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        // Cancel the typer FIRST so it doesn't race with the eraser. Without
        // this, mid-type clicks produced a visible flicker as the typer
        // continued to add lines that the eraser was simultaneously stripping.
        if (typerHandle) { clearTimeout(typerHandle); typerHandle = null; }
        // Fade the rest of the UI in parallel with the splash erase. By the
        // time the splash is gone, panels are fully visible (0.4s transition),
        // so the handoff is seamless.
        if (window.setUIVisibility) window.setUIVisibility(true);
        if (pulseAnim) { try { pulseAnim.cancel(); } catch (e) {} }
        prompt.style.opacity = '0';
        // Reveal art line-by-line from the top — opposite of how it typed in.
        // Faster cadence (20ms) — user wants to get to the playspace quickly
        // and the slower 40ms felt like waiting twice.
        const dismissCadence = 20;
        const totalLines = lines.length;
        let removed = 0;
        // Keep the rendered line COUNT constant by substituting empty strings
        // for removed lines. The element's rendered height stays locked, so
        // its centered position stays locked, so the remaining ASCII rows
        // sit at the exact pixel position they were typed into.
        const eraser = () => {
            removed++;
            if (removed < totalLines) {
                const remaining = lines.slice(removed);
                const padding = new Array(removed).fill('');
                el.textContent = padding.concat(remaining).join('\n');
                setTimeout(eraser, dismissCadence);
            } else {
                el.style.opacity = '0';
                overlay.style.pointerEvents = 'none'; // release click capture immediately
                setTimeout(() => { overlay.remove(); }, 600);
            }
        };
        eraser();
    };
    // Click on the overlay dismisses; keyboard dismiss stays on window so
    // any key works. Both use { once: true } as belt-and-suspenders against
    // double-firing — dismissed flag is the real guard.
    overlay.addEventListener('mousedown', dismiss, { once: true });
    window.addEventListener('keydown', dismiss, { once: true });

    // Return a startTyping function so the caller can defer the type-in
    // animation until heavy synchronous init has settled. See init() flow
    // for why this matters (stutter / line-batching).
    return () => {
        if (i === 0) typer();
    };
}

// ─── Modulation Pipeline ───────────────────────────────────────────────────
// Each parameter has a "_mod" sibling in window.S in the range [0, 1] that represents how strongly the parameter oscillates. The right-click drag UI already writes these values; this section is what makes them DO something.
// Architecture: every frame, before the engine reads window.S, we compute "effective" values into window.S_effective for any parameter with a non-zero _mod. The engine reads from window.S_effective when present, otherwise window.S. Slider UIs always read from window.S (the user's set value, not the modulated value) so dragging the slider stays predictable.
// Range cache; populated by makeSlider when each control is built. Used to compute amplitude as a percentage of the parameter's full range.
window._paramRanges = window._paramRanges || {};

window.S_effective = {};

function updateModulation() {
    const t = performance.now() / 1000;
    for (const key of MODULATABLE_KEYS) {
        const mod = window.S[key + '_mod'] || 0;
        const row = document.querySelector(`.row[data-param-key="${key}"]`);
        if (mod <= 0.001) {
            if (window.S_effective[key] !== undefined) delete window.S_effective[key];
            if (row && row.dataset.modulating) delete row.dataset.modulating;
            continue;
        }
        const range = window._paramRanges[key];
        if (!range) continue;

        // Parameter oscillates between (base * 0.5) and (base * 1.0) so it dips down from the slider value to half of it, then back up.
        //	mod = 0   → no oscillation (handled above)
        // 	mod = 0.5 → slow oscillation at ~0.25 Hz (one cycle every 4s)
        // 	mod = 1.0 → fast oscillation at ~1.0 Hz (one cycle per second)
        // Frequency curve is linear from 0.1 Hz (at mod≈0.05) up to 1.0 Hz. Amplitude is fixed by the 50%-100%-of-base rule; mod only changes SPEED. This matches "expected" synthesizer modulation behavior.
        const base = window.S[key];
        const freq = 0.1 + mod * 0.9; // 0.1 Hz at very low mod, 1.0 Hz at max

        const phase = Math.sin(2 * Math.PI * freq * t);
        const norm = (phase + 1) * 0.5;             // 0..1
        const factor = 0.5 + norm * 0.5;            // 0.5..1.0
        let v = base * factor;
        // Clamp into the parameter's legal range
        if (v < range.min) v = range.min;
        if (v > range.max) v = range.max;
        window.S_effective[key] = v;
        if (row && row.dataset.modulating !== 'true') row.dataset.modulating = 'true';
    }
}

// ─── FPS / Entropy Monitor ─────────────────────────────────────────────────
// Entropy is the FPS reading INVERTED onto a 0–100 scale.
//   60+ fps  →   0  (all systems normal)
//   30  fps  →  50
//    1  fps  → 100  (full chaos)
// The dock button shows the entropy number prominently (smoothed). Clicking opens a small panel with a circular gauge plus a subtle FPS readout for users who want the raw number.

let _fpsLastTime = performance.now();
let _fpsSmoothed = 60;
let _entropySmoothed = 0;
let _fpsLastDomUpdate = 0;

function fpsToEntropy(fps) {
    // Linear ramp 60 → 0  and  1 → 100. Clamped.
    if (fps >= 60) return 0;
    if (fps <= 1)  return 100;
    return Math.round(((60 - fps) / 59) * 100);
}

function updateFpsMonitor() {
    const now = performance.now();
    const dt = now - _fpsLastTime;
    _fpsLastTime = now;
    if (dt <= 0 || dt > 500) return; // skip first frame, tab-switch gaps
    const instant = 1000 / dt;
    _fpsSmoothed = _fpsSmoothed * 0.92 + instant * 0.08;
    _entropySmoothed = fpsToEntropy(_fpsSmoothed);
    if (now - _fpsLastDomUpdate < 250) return;
    _fpsLastDomUpdate = now;
    
    const fps = Math.round(_fpsSmoothed);
    let tier;
    if      (fps >= 60) tier = 'green';
    else if (fps >= 30) tier = 'yellow';
    else if (fps >= 20) tier = 'orange';
    else                tier = 'red';

    // Update the dock button readout (the entropy number)
    const btnReadout = document.getElementById('dock-fps');
    if (btnReadout) {
        btnReadout.textContent = _entropySmoothed.toString();
        if (btnReadout.dataset.tier !== tier) btnReadout.dataset.tier = tier;
    }
    
    // Update the entropy panel (if open)
    const panelFps = document.getElementById('entropy-panel-fps');
    if (panelFps) panelFps.textContent = fps.toString();
    const panelEntropy = document.getElementById('entropy-panel-value');
    if (panelEntropy) {
        panelEntropy.textContent = _entropySmoothed.toString();
        panelEntropy.dataset.tier = tier;
    }
    const panelGauge = document.getElementById('entropy-panel-gauge-fill');
    if (panelGauge) {
        // SVG circle: stroke-dasharray controls the visible arc. Circumference of r=42 circle = 2πr ≈ 263.89
        const C = 263.89;
        panelGauge.style.strokeDasharray = `${(_entropySmoothed / 100) * C} ${C}`;
        panelGauge.dataset.tier = tier;
    }
}

// ─── Show / hide entropy panel ────────────────────────────────────────────
// Lazily constructed on first open. Uses the standard .panel / .panel-head /
// .panel-body structure so it gets all the same behaviors as other panels:
//   • drag via panel-head (handled by the global hud-element handler)
//   • minimize via the − toggle
//   • CRT scanlines from active theme
//   • panel opacity / button opacity / z-layering on grab
function toggleEntropyPanel() {
    let panel = document.getElementById('panelEntropy');
    const dockBtn = document.getElementById('dock-btn-panelEntropy');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'panelEntropy';
        panel.className = 'panel';
        // Default position near the dock — user can drag it anywhere.
        panel.style.cssText = 'left:50%;top:auto;bottom:80px;width:200px;transform:translateX(-50%);';
        panel.innerHTML = `
            <div class="panel-head">
                <span>Entropy</span>
                <span class="toggle" onclick="togglePanel('panelEntropy')">−</span>
            </div>
            <div class="panel-body" id="entropyBody">
                <div class="entropy-gauge-wrap">
                    <svg viewBox="0 0 100 100" class="entropy-gauge">
                        <circle cx="50" cy="50" r="42" class="entropy-gauge-track" />
                        <circle cx="50" cy="50" r="42" class="entropy-gauge-fill"
                                id="entropy-panel-gauge-fill"
                                transform="rotate(-90 50 50)" />
                    </svg>
                    <div class="entropy-panel-value" id="entropy-panel-value">0</div>
                </div>
                <div class="entropy-panel-fps-row">
                    <span class="entropy-panel-fps-label">fps</span>
                    <span class="entropy-panel-fps" id="entropy-panel-fps">60</span>
                </div>
            </div>
        `;
        const uiRoot = document.getElementById('ui-root') || document.body;
        uiRoot.appendChild(panel);
        // Wire dragging via the new head element
        if (window.attachDragToHead) window.attachDragToHead(panel.querySelector('.panel-head'));
        // Apply current panel opacity / scanlines / theme so the entropy
        // panel matches the rest of the UI on first open. Without this it
        // renders fully opaque even when other panels are translucent.
        if (typeof updatePO === 'function') updatePO();
        if (window.renderDock) window.renderDock();
    } else {
        // Toggle visibility (matches other dock buttons' behavior)
        if (window.togglePanel) window.togglePanel('panelEntropy');
    }
}
window.toggleEntropyPanel = toggleEntropyPanel;

// ─── Sharable Coordinate Strings ───────────────────────────────────────────
// Pack a waypoint into a short string anyone can paste into Reddit/Discord // or scan as a QR. Multiplayer-stopgap so users can transport "places" they // found without needing a backend.
// Wire format: "SS1:<base64url(payload)>"
// Payload = JSON object with the same fields a waypoint carries, but rounded aggressively to keep the string short. The full waypoint format (with thumbnail, profile, etc.) lives in JSON exports; this is purely "where am I + what does the system look like".

const SHARE_PARAM_KEYS = PARAM_KEYS;
const SHARE_VISUAL_KEYS = [
    'opacity', 'tempo', 'showParticles', 'showRibbons',
    'tessRibbons', 'shape', 'colorMode'
];

function _b64urlEncode(bytes) {
    // bytes can be Uint8Array; produce URL-safe base64 (no =, no +/)
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function _b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function encodeShareString(wp) {
    if (!wp) return null;
    // Compact representation. Round each value to its sane precision.
    const PREC = {
        opacity: 2, hue: 3, sat: 2, lightness: 2,
        equilibrium: 3, temperature: 2, viscosity: 2, mass: 2,
        scaleDepth: 2, coherence: 0, halfLife: 1, tempo: 2,
        trailLen: 0, bgGlow: 2, bgBlur: 1,
        resolution: 2, inversion: 0, freeEnergy: 0,
        offsetX: 0, offsetY: 0, offsetZ: 0, billboardOffset: 0
    };
    const round = (k, v) => {
        if (typeof v !== 'number') return v;
        const p = PREC[k] !== undefined ? PREC[k] : 2;
        const f = Math.pow(10, p);
        return Math.round(v * f) / f;
    };
    
    const payload = { p: {}, v: {}, m: {}, c: {} };
    SHARE_PARAM_KEYS.forEach(k => {
        if (wp.params && wp.params[k] !== undefined) payload.p[k] = round(k, wp.params[k]);
    });
    SHARE_VISUAL_KEYS.forEach(k => {
        if (wp.visuals && wp.visuals[k] !== undefined) payload.v[k] = wp.visuals[k];
    });
    const savedMods = wp.visuals && wp.visuals.mods ? wp.visuals.mods : {};
    MOD_KEYS.forEach(k => {
        if (savedMods[k] !== undefined) payload.m[k] = round(k, savedMods[k]);
    });
    if (Object.keys(payload.m).length === 0) delete payload.m;
    // Camera: round positions to whole numbers, quat to 4 decimal places
    if (wp.camDist !== undefined)    payload.c.d  = Math.round(wp.camDist);
    if (wp.camPosArr) payload.c.p = wp.camPosArr.map(x => Math.round(x));
    if (wp.camQuatArr) payload.c.q = wp.camQuatArr.map(x => Math.round(x * 10000) / 10000);
    if (wp.name) payload.n = wp.name;
    
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    return 'SS1:' + _b64urlEncode(bytes);
}

function decodeShareString(str) {
    if (typeof str !== 'string') return null;
    str = str.trim();
    if (!str.startsWith('SS1:')) return null;
    try {
        const bytes = _b64urlDecode(str.slice(4));
        const json = new TextDecoder().decode(bytes);
        const payload = JSON.parse(json);
        if (!payload || typeof payload !== 'object') return null;
        return payload;
    } catch (e) {
        return null;
    }
}

// Apply a decoded share payload by creating a new waypoint from it. The new waypoint gets the importer's profile attached as authorId (NOT the original author's — that data isn't in the share string, by design).
function importShareString(str) {
    const payload = decodeShareString(str);
    if (!payload) {
        showToast('Invalid share string', { color: '#ff6d6d' });
        return null;
    }

    // Build a waypoint-shaped candidate from the payload, then run it
    // through the same validator we use for save-file imports. payload.p
    // (params), payload.v (visuals), and payload.m (mods) only get fields
    // that pass type + range checks; everything else is dropped. payload.n
    // (name) is sanitized; we synthesize a fallback if it's missing.
    const _camD = payload.c && payload.c.d;
    const _camQ = payload.c && payload.c.q;
    const _camP = payload.c && payload.c.p;
    const candidate = {
        id: 'wp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        coordId: '',
        name: typeof payload.n === 'string' ? payload.n : '',
        notes: 'Imported from shared coordinates',
        category: window.S.lastWpCat || 'Waypoints',
        isImported: true,
        params: payload.p,
        visuals: Object.assign({}, payload.v || {}, payload.m ? { mods: payload.m } : {}),
        camDist:    _camD,
        camQuatArr: _camQ,
        camPosArr:  _camP,
        timestamp: Date.now(),
        thumbnail: null,
        thumbAspect: 16 / 9,
        authorId: window.profile?.id,
        authorName: window.profile?.username || ''
    };

    const wp = validateWaypoint(candidate);
    if (!wp) {
        showToast('Invalid share string', { color: '#ff6d6d' });
        return null;
    }

    // Compute coordId from the validated params (the share string doesn't
    // carry coordId — it's derived).
    if (typeof coordHash === 'function') {
        wp.coordId = coordHash(wp.params);
    }

    // If the share string had no name, synthesize one from coordId + date.
    // (validateWaypoint defaults to 'Untitled' when name is missing.)
    if (!payload.n) {
        const d = new Date();
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        wp.name = wp.coordId + ' — ' + dStr;
    }

    window.waypoints = window.waypoints || [];
    window.waypoints.unshift(wp);
    if (window.saveWP) window.saveWP();
    if (window.buildAtlasUI) window.buildAtlasUI(window.engine);
    showToast('Coordinates imported');
    return wp;
}

window.encodeShareString = encodeShareString;
window.decodeShareString = decodeShareString;
window.importShareString = importShareString;

async function copyToClipboard(str) {
    try {
        await navigator.clipboard.writeText(str);
        return true;
    } catch (e) {
        // Fallback for older browsers / non-secure contexts
        try {
            const ta = document.createElement('textarea');
            ta.value = str;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        } catch (e2) { return false; }
    }
}
window.copyToClipboard = copyToClipboard;

function init() {
  // ─── UI visibility helper ────────────────────────────────────────────────
  // Single source of truth for show/hide-all-UI. Used by:
  //   • Tab keypress (user explicitly toggles)
  //   • Boot flow (start hidden, fade in on splash dismiss)
  //
  // Implementation: toggles body.ui-ready. CSS rules tied to that class
  // handle fade. Per-element .hidden classes remain untouched — panel
  // open/closed state set by loadPanelPos persists across hide/reveal.
  //
  // Locked radials are deliberately NOT closed when hiding. A locked radial
  // is the user's explicit "I want this menu pinned" gesture; Tab should
  // tuck UI away around the lock, not destroy it. Unlocked radials get
  // closed because they have no user-affirmed reason to persist.
  window.setUIVisibility = function(visible, opts = {}) {
    window.uiVisible = !!visible;
    document.body.classList.toggle('ui-ready', window.uiVisible);
    if (!window.uiVisible) {
      const closeIfUnlocked = (r) => {
        if (!r || r.isLocked) return;
        if (r.close) r.close(true);
      };
      closeIfUnlocked(window.sysRadial);
      closeIfUnlocked(window.envRadial);
      closeIfUnlocked(window.cfgRadial);
    }
  };

  // Clear old state if version mismatch
  const savedVersion = localStorage.getItem('ss_version');
  let isFirstLoad = false;
  if (savedVersion !== SS_VERSION) {
    localStorage.removeItem('ss_state');
    localStorage.setItem('ss_version', SS_VERSION);
    isFirstLoad = true;
  }

  // ─── Load saved states ───────────────────────────────────────────────────
  try {
    const saved = localStorage.getItem('ss_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Allowlist hydration — drops unknown keys, type-coerces values,
        // and strips _xfade/_xfadeEnv internally. This is the same path
        // imported save files take, so the threat model is unified.
        hydrateState(parsed);
    } else {
        isFirstLoad = true;
    }
  } catch (e) { isFirstLoad = true; }
  // Note: hydrateState already strips _xfade and _xfadeEnv. The two deletes
  // below are kept as belt-and-suspenders for the (impossible at this point)
  // case where hydrateState wasn't reached and stale alphas are in window.S.
  delete window.S._xfade;
  delete window.S._xfadeEnv;
  // Migrate legacy `saveScreenshots` (single toggle) → two granular keys.
  // Users who had it on get both new flags on (closest to prior behavior).
  if (typeof window.S.saveScreenshots === 'boolean') {
    if (window.S.saveScreenshots) {
      window.S.saveOnNewWaypoint = true;
      window.S.saveOnNewThumbnail = true;
    }
    delete window.S.saveScreenshots;
  }
  // Always start with audio off (browser policy)
  window.S.audioOn = false;
  // Restore tour mode if saved (sequential is the default)
  if (window.S.tourMode === 'random' || window.S.tourMode === 'sequential') {
    tour.mode = window.S.tourMode;
  }

  // ─── Initialize Waypoints ────────────────────────────────────────────────
  try {
    const savedWp = localStorage.getItem('ss_waypoints') || localStorage.getItem('ss6_standalone_wp');
    if (savedWp) {
      const parsed = JSON.parse(savedWp);
      const raw = (parsed && parsed.waypoints) || parsed || [];
      // Validate each waypoint individually. Drops items with malformed
      // shape (validateWaypoint returns null), neutralizes <script>-laden
      // names from any prior tampered import.
      window.waypoints = Array.isArray(raw)
        ? raw.map(validateWaypoint).filter(Boolean)
        : [];
    } else {
      window.waypoints = [];
    }
  } catch (e) {
    window.waypoints = [];
  }

  // Build assumes self-containment; parameters natively driven by window.S

  // Initialize AudioManager
  const audio = new AudioManager();
  window.audio = audio;

  // Initialize Profile (server-clock-based ID, persisted across sessions)
  window.profile = loadOrCreateProfile();

  // Apply theme + button shape from saved state BEFORE setupUI so the UI
  // is built against the correct CSS variables / data attributes.
  applyTheme();
  applyButtonShape();

  // UI is invisible by default (CSS gates opacity on body.ui-ready).
  // Splash dismiss adds ui-ready to fade everything in. Tab toggles same
  // class. window.uiVisible tracks the gate state for keyboard logic.
  window.uiVisible = false;

  // Boot splash — fades in, holds, fades out. Visible during engine init.
  // Returns a startTyping callback we invoke AFTER engine init, so the
  // heavy synchronous block (setupUI, new Engine) doesn't stutter the
  // type-in animation. Typer's setTimeouts queue up but can't fire while
  // the main thread is busy, producing the line-batching effect.
  const startSplashTyping = showBootSplash();

  // Initialize UI
  setupUI();
  
  // Apply initial zoom
  updateUIZoom();

  // ─── Initialize WebGPU Engine ────────────────────────────────────────────
  const cv = document.getElementById('cv');
  const bgGlow = document.getElementById('bgGlow');
  let engine;
  try {
    engine = new Engine(cv, bgGlow);
    window.engine = engine;
    engine.setupControls(cv);

    engine.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', () => {
      engine.resize(window.innerWidth, window.innerHeight);
    });
  } catch(e) {
    console.error("FATAL ERROR IN ENGINE CONSTRUCTOR:", e);
    return;
  }

  // Engine is up — kick off the splash typing now. Defer one rAF so the
  // engine's first frame schedules before the typer starts taking time
  // slices, which makes the visual start of typing feel synchronized with
  // "everything is ready behind the scenes."
  requestAnimationFrame(() => {
    if (startSplashTyping) startSplashTyping();
  });

  // Key handlers for global actions (Ctrl+S for waypoints)
  let lastTempo = null;
  
  const kMap = {
      'KeyQ': { k: 'freeEnergy', d: -2000, min: 500, max: 1000000 },
      'KeyE': { k: 'freeEnergy', d: 2000, min: 500, max: 1000000 },
      'KeyZ': { k: 'resolution', d: -0.2, min: 0.1, max: 20 },
      'KeyX': { k: 'resolution', d: 0.2, min: 0.1, max: 20 },
      'KeyR': { k: 'equilibrium', d: -0.005, min: 0.001, max: 0.2 },
      'KeyT': { k: 'equilibrium', d: 0.005, min: 0.001, max: 0.2 },
      // Temperature: F = firey (up), G = glacial (down). Matches slider
      // labels and mnemonic so users don't second-guess the keybinds.
      'KeyF': { k: 'temperature', d: 0.05, min: 0, max: 3 },
      'KeyG': { k: 'temperature', d: -0.05, min: 0, max: 3 },
      'KeyV': { k: 'coherence', d: -2, min: 1, max: 200 },
      'KeyB': { k: 'coherence', d: 2, min: 1, max: 200 },
      'KeyI': { k: 'inversion', d: -5, min: 30, max: 500 },
      'KeyO': { k: 'inversion', d: 5, min: 30, max: 500 },
      'KeyN': { k: 'scaleDepth', d: -0.05, min: 0, max: 5 },
      'KeyM': { k: 'scaleDepth', d: 0.05, min: 0, max: 5 },
      'KeyK': { k: 'halfLife', d: -0.5, min: 0, max: 30 },
      'KeyL': { k: 'halfLife', d: 0.5, min: 0, max: 30 },
      'PageDown': { k: 'tempo', d: -0.05, min: 0, max: 2 },
      'PageUp': { k: 'tempo', d: 0.05, min: 0, max: 2 },
  };

  window.addEventListener('keydown', e => {
      // Skip all kMap shortcuts when a text-input surface has focus —
      // includes the .val editable spans on every slider. Without this,
      // typing into a slider's value field would trigger waypoint capture
      // (Ctrl+S), audio toggle (P), tempo pause, etc.
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
          e.preventDefault();
          captureWaypoint();
      }
      
      if (e.code === 'KeyP') {
          e.preventDefault();
          window.S.audioOn = !window.S.audioOn;
          if (window.audio) window.audio.toggle(window.S);
          const toggles = document.querySelectorAll('.tog');
          toggles.forEach(t => {
              if (t.textContent.includes('Ambient Audio') || t.textContent.includes(window.APP_TEXT?.toggleAudio)) {
                  t.click(); 
                  window.S.audioOn = !window.S.audioOn; // prevent double toggle
              }
          });
      }

      if (e.code === 'Pause') {
          e.preventDefault();
          if (window.S.tempo === 0) {
              window.S.tempo = lastTempo !== null ? lastTempo : 0.02;
              lastTempo = null;
          } else {
              lastTempo = window.S.tempo;
              window.S.tempo = 0;
          }
          if (window.sliderSync && window.sliderSync.tempo) {
              window.sliderSync.tempo(window.S.tempo);
          }
          if (window.engine) window.engine.updateUniforms();
      }
      
      if (kMap[e.code]) {
          e.preventDefault();
          const p = kMap[e.code];
          window.S[p.k] = Math.max(p.min, Math.min(p.max, window.S[p.k] + p.d));
          if (window.sliderSync && window.sliderSync[p.k]) {
              window.sliderSync[p.k](window.S[p.k]);
          }
          if (p.k === 'freeEnergy' && window.engine) {
              window.engine.resizeParticles(Math.round(window.S[p.k]));
          }
          if (window.engine) window.engine.updateUniforms();
          try { localStorage.setItem('ss_state', JSON.stringify(window.S)); } catch (err) {}
      }
  });

  // ─── Animation loop ──────────────────────────────────────────────────────
  async function startEngine() {
    try {
      await engine.renderer.init();
    } catch(e) {
      console.error("Renderer Init Error:", e);
    }

    let _firstFrameDrawn = false;
    function animate() {
      requestAnimationFrame(animate);
      try {
          updateTransition();
      } catch(e) { console.error("Transition Error:", e); }
      try {
          updateModulation();
      } catch(e) { console.error("Modulation Error:", e); }
      try {
          updateFpsMonitor();
      } catch(e) { /* silent — FPS monitor must never break the loop */ }
      engine.render();
      // Mark the body engine-ready after the first frame is actually drawn,
      // so the canvas opacity transition matches when the engine starts
      // producing content rather than just when setupUI finishes. Without
      // this, the canvas fades from blank-to-blank then pops in.
      if (!_firstFrameDrawn) {
          _firstFrameDrawn = true;
          requestAnimationFrame(() => document.body.classList.add('engine-ready'));
      }
    }

    animate();
  }

  startEngine();
}

init();