// Applies this branch's hero changes to the compiled site (the source project is not in
// this repo, so they go onto Luka's build output):
//
//   - the stack: the next films wait just behind the current one and peek out under it,
//     smaller and fainter each place back, instead of on the stepper;
//   - the tilt: the film in the window turns toward the pointer on its clip;
//   - the light: the pointer is a small light everywhere, and over the hero it lights
//     the films, the racks, the rig and the floor around it;
//   - the type: Martian Grotesk in place of Inter, a little wider for the name and
//     headings (the files come from scripts/build-fonts.py).
//
//   node scripts/patch-app.mjs <original app.js> <original site.css>
//
// writes assets/app.js and assets/site.css, and points the pages' font preloads at the new
// files. The build's minifier names things afresh on every build, so the patch first finds
// the names it needs by what the code around them does. Each change is then pinned to text
// that must occur exactly once (or as many times as said), and every name the patch adds
// must be unused, so a new build either takes the patch whole or says where it no longer
// fits.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [jsIn, cssIn] = process.argv.slice(2);
if (!jsIn || !cssIn) {
  console.error('usage: node scripts/patch-app.mjs <original app.js> <original site.css>');
  process.exit(1);
}
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
let src = readFileSync(jsIn, 'utf8');

const ADDED = ['eS', 'eD', 'sA', 'sE', 'sCl', 'sMx', 'sSm', 'Sg', 'Sp', 'Sk', 'Sd', 'hv', 'hS', 'Hy', 'Hp', 'Lq', 'Lz', 'lgt', 'lcv', 'lcs'];
for (const name of ADDED) {
  if (new RegExp(`(^|[^\\w$.])${name}(?![\\w$])`).test(src)) throw new Error(`name already used: ${name}`);
}

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A pattern written as a template: the text is the regular expression, each ${…} a name
// matched exactly as it is.
const R = (s, ...v) => new RegExp(s.raw.reduce((a, part, i) => a + esc(v[i - 1]) + part));
function grab(re, what) {
  const all = [...src.matchAll(new RegExp(re.source, 'g'))];
  if (all.length !== 1) throw new Error(`${what}: expected 1 match, found ${all.length}`);
  return all[0];
}
// Replaces the one match of a pattern with what fn makes of it.
function edit(re, fn, what) {
  const m = grab(re, what);
  src = src.slice(0, m.index) + fn(...m) + src.slice(m.index + m[0].length);
}
function swap(from, to, times = 1) {
  const n = src.split(from).length - 1;
  if (n !== times) throw new Error(`expected ${times} matches, found ${n}: ${from}`);
  src = src.split(from).join(to);
}

// --- The build's names ------------------------------------------------------------------
const N = {};
[, N.w, N.d, N.Pt] = grab(/([\w$]+)\.house\+=\(\(([\w$]+)\.done\|\|\2\.docked\?1:0\)-\1\.house\)\*\(([\w$]+)\?1:1-Math\.exp\(-[\w$]+\/\.9\)\);/, 'the hero state');
[, N.tnow, N.dt] = grab(R`function [\w$]+\(([\w$]+),([\w$]+)\)\{if\(${N.w}\.last=\1,${N.w}\.prev=${N.w}\.cur`, 'the hero step');
const EO_END = grab(/return\[0,([\w$]+)\.eye-\1\.gh\/2-\1\.Lw-[\w$]+\*([\w$]+)\.lift\*\1\.gh,[\w$]+\]\}/, 'the track');
[N.u, N.v] = [EO_END[1], EO_END[2]];
[, N.eo] = grab(/function ([\w$]+)\(([\w$]+)\)\{let [\w$]+=[\w$]+\(-\.35,\.35,\2\)/, 'the track');
[, , N.zf, N.Je, N.A] = grab(R`([\w$]+)=([\w$]+)\.p\|\|${N.eo}\(([\w$]+)\(([\w$]+)\.d\)\)`, "a film's place");
[, N.Bt, , N.b] = grab(/([\w$]+)=([\w$]+)>0&&([\w$]+)\.P\?\2\*\(/, 'the focus blend');
[, N.en] = grab(/([\w$]+)=new Map;function [\w$]+\(([\w$]+)\)\{let ([\w$]+)=\1\.get\(\2\);return \3\|\|\(\3=\{k:\2,th:0/, 'the films');
[, N.mt] = grab(/([\w$]+)\.k<\.001&&\(\1\.k=0\)/, 'the ride past films');
[, N.Pe] = grab(/\(1-[\w$]+\(0,\.12,([\w$]+)\.a\)\)\*\(1\+\.9\*/, 'the way out');
[, , N.lo] = grab(/hold\(([\w$]+)\)\{if\(([\w$]+)=!!\1,\2\)/, 'the hold');
[, N.io] = grab(/([\w$]+)=Math\.max\(1,[\w$]+\.querySelectorAll\("\.gate__v"\)\.length\)/, 'the films in the window');
[, N.Bn] = grab(/([\w$]+)=matchMedia\("\(hover: hover\) and \(pointer: fine\)"\)\.matches/, 'the fine pointer');
[, N.Ne] = grab(/([\w$]+)=\{x:-1e4,y:-1e4,in:!1,over:null,at:null\}/, 'the pointer');
[, N.root] = grab(/let ([\w$]+)=document\.documentElement;if\(\1\.classList\.add\("is-vault"\)/, 'the page root');
[, N.gl, N.cu] = grab(/([\w$]+)\.uniform1f\(([\w$]+)\.u_chrome,1\)/, 'the graphics context');
[, , N.orect] = grab(R`(${N.u})\.left=([\w$]+)\.left,\1\.top=\2\.top,\1\.F=`, "the canvas's place");
// The names the patch's own functions use for their arguments and locals must not hide
// any build name those functions reach for.
for (const key of ['w', 'd', 'u', 'b', 'eo', 'io', 'Bn', 'Pt', 'Ne', 'Pe', 'lo', 'mt', 'root']) {
  if (['o', 'r', 'k', 'x', 'y', 'q', 'on', 'li', 'A'].includes(N[key])) throw new Error(`a build name clashes with the patch's own: ${N[key]}`);
}
const { w, d, u, b, eo, Je, A, zf, Bt, en, gl } = N;

// --- Settings -------------------------------------------------------------------------
// Sg: depth between stacked films (in focal lengths), Sp: how far each peeks out (in
// window heights), Sk: opacity one and two places back, Sd: how much darker they get.
// Hy, Hp: the tilt's largest turn and nod (radians). Lq: the pointer light's strength,
// Lz: its reach (in screen heights).
const SETTINGS = 'var Sg=.11,Sp=.07,Sk=[.8,.42],Sd=.12,Hy=.12,Hp=.08,Lq=1.15,Lz=.2;';

// --- Helpers, next to the track's own placement ---------------------------------------
// sCl, sMx, sSm: clamp, mix and smoothstep.
// sE: how far the stack's entrance has run for the film o places back, as 0..1: once the
// arrival is done, the films behind slide down from behind the one in the window and fade
// in, the next one first and the one after it a beat later.
// eS: a film's place on the track: during the arrival the track as it was (only the
// first film shows), after it close behind the current one.
// eD: how far a film hangs below its usual height (in window widths): its bottom edge
// shows one step further down for each place back.
// sA: a film's opacity: whole in front, and solid again early as it comes forward;
// fainter each place back, gone by the third and for anything past the hero's last film;
// during the arrival only the film arriving shows.
// hS: how much of the hover belongs to a film: all of it in the window, none once it
// has moved off. hv: each frame, turns the film in the window toward the pointer while
// the pointer is over it (a spring, so it settles like the hanging card it is) and moves
// the pointer light after the pointer.
edit(
  R`${EO_END[0]}`,
  (all) =>
    all +
    SETTINGS +
    'function sCl(x,a,b){return Math.min(b,Math.max(a,x))}function sMx(a,b,t){return a+(b-a)*t}' +
    'function sSm(a,b,x){let t=sCl((x-a)/(b-a),0,1);return t*t*(3-2*t)}' +
    `function sE(o){if(${w}.stk0==null)return 0;let r=sCl((${w}.last-${w}.stk0-150-90*sCl(o-1,0,2))/650,0,1);return 1-(1-r)*(1-r)*(1-r)}` +
    `function eS(o){let r=${eo}(o);return o>0&&${w}.stk0!=null&&(r[2]=o*Sg*${u}.F),r}` +
    `function eD(o){if(!(o>0)||${w}.stk0==null)return 0;let r=1+Sg*o;return((r-1)*(${u}.eye+${u}.gh/2)+sE(o)*r*o*Sp*${u}.gh)/${u}.gw}` +
    `function sA(o,k){if(!(o>0))return 1;if(!${d}.done)return k===${d}.k0?1:0;let r=k>=${N.io}||o>=3?0:o<=1?sMx(1,Sk[0],o*o*o):o<=2?sMx(Sk[0],Sk[1],o-1):sMx(Sk[1],0,o-2);return r*sE(o)}` +
    `function hS(A){return ${d}.done?1-sSm(.15,.5,Math.abs(A.d)):0}` +
    `function hv(r){let on=0,x=0,y=0;` +
    `if(${N.Bn}&&!${N.Pt}&&${d}.done&&${N.Ne}.in&&!${b}.on&&${b}.a<=0&&${N.Pe}.a<=.02&&!${N.lo}&&!${N.mt}.on&&Math.abs(${w}.v)<.8&&${u}.gW){` +
    `x=(${N.Ne}.x-${u}.left-${u}.gx)/${u}.gW*2-1,y=(${N.Ne}.y-${u}.top-${u}.gy)/${u}.gH*2-1;let q=${w}.hk>.5?1.08:1;Math.abs(x)<q&&Math.abs(y)<q&&(on=1)}` +
    'x=sCl(x,-1,1)*on,y=sCl(y,-1,1)*on;' +
    `${w}.hyV+=(110*(-Hy*x-${w}.hy)-15*${w}.hyV)*r,${w}.hy+=${w}.hyV*r,${w}.hpV+=(110*(Hp*y-${w}.hp)-15*${w}.hpV)*r,${w}.hp+=${w}.hpV*r,` +
    `${w}.hk+=(on-${w}.hk)*(1-Math.exp(-r/.18));` +
    `let li=${N.Bn}&&${d}.done&&${N.Ne}.in&&${b}.a<=0&&!${N.root}.classList.contains("is-menu")&&!${N.root}.classList.contains("is-full")?1:0;` +
    `${w}.li<.01&&li&&(${w}.lx=${N.Ne}.x,${w}.ly=${N.Ne}.y),${w}.li+=(li-${w}.li)*(1-Math.exp(-r/.3));` +
    `let k=${N.Pt}?1:1-Math.exp(-r/.07);${w}.lx+=(${N.Ne}.x-${w}.lx)*k,${w}.ly+=(${N.Ne}.y-${w}.ly)*k}`,
  'the track',
);

// --- State and the per-frame step ------------------------------------------------------
// The entrance clock starts when the arrival is done and resets if it plays again. The
// films behind jump to their places in the stack while still unseen, so their swing is
// started afresh there rather than kicked by the jump.
swap(`house:${N.Pt}?1:0}`, `house:${N.Pt}?1:0,stk0:${N.Pt}?-1e9:null,hy:0,hyV:0,hp:0,hpV:0,hk:0,li:0,lx:-1e4,ly:-1e4}`);
swap(`${w}.house=1,`, `${w}.house=1,${w}.stk0=-1e9,`);
{
  const reset = `${en}.forEach(J=>{J.p=J.pv=null})`;
  edit(
    R`${w}\.house\+=\(\(${d}\.done\|\|${d}\.docked\?1:0\)-${w}\.house\)\*\(${N.Pt}\?1:1-Math\.exp\(-[\w$]+\/\.9\)\);`,
    (all) => all + `${d}.done?${w}.stk0==null&&(${w}.stk0=${N.tnow},${reset}):${w}.stk0!=null&&(${w}.stk0=null,${reset});hv(${N.dt});`,
    'the hero step',
  );
}
// Where the window sits in the canvas, to tell when the pointer is over it.
edit(
  R`let ([\w$]+)=([\w$]+)\.getBoundingClientRect\(\);${u}\.gw=Math\.max\(60,\1\.width\)`,
  (all, m) => all.replace(`${u}.gw=`, `${u}.gx=${m}.left-${N.orect}.left,${u}.gy=${m}.top-${N.orect}.top,${u}.gW=${m}.width,${u}.gH=${m}.height,${u}.gw=`),
  "the window's place",
);

// --- Placing each film -----------------------------------------------------------------
edit(R`([\w$]+)=${Je}\(([\w$]+)\),([\w$]+)=${eo}\(\1\)`, (all, q, at, p) => `${q}=${Je}(${at}),${p}=eS(${q})`, "a film's place, each frame");
edit(R`([\w$]+)=${zf}\.p\|\|${eo}\(${Je}\(${A}\.d\)\)`, (all, p) => `${p}=${zf}.p||eS(${Je}(${A}.d))`, "a film's place, drawn");
// The tilt turns the card and its clip about the clip (the card's top centre).
edit(
  R`([\w$]+)=\[0,${zf}\.th\+${zf}\.th2,([\w$]+)\]`,
  (all, rot, wob) => `${rot}=[${w}.hy*hS(${A}),${zf}.th+${zf}.th2+${w}.hp*hS(${A}),${wob}]`,
  "the card's turn",
);
edit(R`[\w$]+=-\(1-[\w$]+\)\*\([\w$]+\+[\w$]+\)\+${zf}\.sy-\.007\*${Bt}`, (all) => `${all}+eD(${Je}(${A}.d))`, "the card's drop");
edit(R`([\w$]+)=\.032,([\w$]+)=0,([\w$]+)=1;if\(`, (all, r, dim, k) => `${r}=.032,${dim}=Sd*sCl(${Je}(${A}.d),0,2),${k}=1;if(`, "the card's shade");
edit(R`isStation:([\w$]+)\}\)`, (all, st) => `isStation:${st},alpha:sMx(sA(${Je}(${A}.d),${A}.k),1,${Bt}),hov:hS(${A})*${w}.hk})`, "the card's opacity");
// The window's glow grows a little while it is hovered.
edit(R`(\(1-[\w$]+\(0,\.12,${N.Pe}\.a\)\)\*\(1\+\.9\*)([\w$]+)\)`, (all, head, dock) => `${head}${dock}+.5*${w}.hk)`, "the window's glow");

// --- Drawing films: opacity and hover -------------------------------------------------
swap('uniform float u_chrome;\n', 'uniform float u_chrome;\nuniform float u_alpha;\nuniform float u_hov;\n');
swap(
  'if (u_mirror > 0.5) col *= 0.85;\no = u_a2c > 0.5 ? vec4(col, a) : vec4(col * a, a);',
  'if (u_mirror > 0.5) col *= 0.85;\na *= u_alpha;\no = u_a2c > 0.5 ? vec4(col, a) : vec4(col * a, a);',
);
swap(`${gl}.uniform1f(${N.cu}.u_chrome,1)`, `${gl}.uniform1f(${N.cu}.u_chrome,1),${gl}.uniform1f(${N.cu}.u_alpha,1),${gl}.uniform1f(${N.cu}.u_hov,0)`);
edit(
  R`${gl}\.uniform1f\(${N.cu}\.u_chrome,([\w$]+)\.chrome==null\?1:\1\.chrome\)`,
  (all, f) => `${all},${gl}.uniform1f(${N.cu}.u_alpha,${f}.alpha==null?1:${f}.alpha),${gl}.uniform1f(${N.cu}.u_hov,${f}.hov||0)`,
  "a card's shading",
);
// A film faded out is not drawn, hung or picked. Only the film in the window (or the one
// taking its place) shows its clip and rod: the stack behind hangs out of sight.
edit(/if\(!\(([\w$]+)\.H>0\)\)return;/, (all, f) => `if(!(${f}.H>0)||${f}.alpha<.003)return;`, 'drawing a card');
edit(/for\(let ([\w$]+) of ([\w$]+)\)\{if\(!\1\.R\)continue;/, (all, f, list) => `for(let ${f} of ${list}){if(!${f}.R||${f}.alpha<.003||${d}.done&&${f}.d>.5)continue;`, 'drawing the rigs');
edit(R`!([\w$]+)\.P\|\|\1\.H<${u}\.gh\*\.5\|\|`, (all, f) => `${all}${f}.alpha<.3||`, 'picking a card');
// The glass sheen that slides with the card's nod shows more while it is hovered.
swap('col += vec3(0.05) * sh * (1.0 - u_hush);', 'col += vec3(0.05 + 0.1 * u_hov) * sh * (1.0 - u_hush);');

// --- The pointer light ------------------------------------------------------------------
// A light carried at the eye and pointed at the pointer: a soft pool around it on every
// surface, weaker with depth. u_cur is its place in canvas pixels and its strength.
swap(
  'float fogAt(float z) { return 1.0 - exp(-max(z - u_F * 0.15, 0.0) / u_fogD); }',
  'uniform vec3 u_cur;\nuniform float u_curR;\nuniform vec3 u_curC;\n' +
    'float curAt(vec2 sp, float z) { vec2 d = (sp - u_cur.xy) / u_curR; return u_cur.z * exp(-dot(d, d)) / (1.0 + max(z, 0.0) / (u_F * 2.0)); }\n' +
    'float fogAt(float z) { return 1.0 - exp(-max(z - u_F * 0.15, 0.0) / u_fogD); }',
);
edit(
  R`([\w$]+)\.u_house&&${gl}\.uniform1f\(\1\.u_house,${w}\.house\)`,
  (all, s) =>
    `${all},${s}.u_cur&&${gl}.uniform3f(${s}.u_cur,(${w}.lx-${u}.left)*${u}.dpr,(${w}.ly-${u}.top)*${u}.dpr,${w}.li*Lq),` +
    `${s}.u_curR&&${gl}.uniform1f(${s}.u_curR,${u}.H*Lz),${s}.u_curC&&${gl}.uniform3f(${s}.u_curC,1,.84,.7)`,
  'the light settings',
);
// Films and racks: the light shows the picture under it, on the faces turned to the eye
// (never in the floor's reflection).
swap('vec3 fl = vec3(0.0), rl = vec3(0.0);\nfloat a = 1.0;', 'vec3 fl = vec3(0.0), rl = vec3(0.0);\nfloat a = 1.0;\nvec3 alb = vec3(0.0);');
swap(
  'if (v_i3.y > 0.001) col = mix(col, texture(u_vid, f).rgb, v_i3.y * (1.0 - keep * u_chrome));',
  'if (v_i3.y > 0.001) col = mix(col, texture(u_vid, f).rgb, v_i3.y * (1.0 - keep * u_chrome));\nalb = col;',
);
const FACING = 'max(dot(normalize(v_n), -normalize(vec3(v_pos.xy - u_cam, depth))), 0.0) * (1.0 - u_mirror)';
swap(
  'col = mix(darkAt(sp, z), col, sh) + (fl + rl * 0.55 * u_dark * (1.0 - sh)) * (1.0 - fg) * sk;',
  'col = mix(darkAt(sp, z), col, sh) + (fl + rl * 0.55 * u_dark * (1.0 - sh)) * (1.0 - fg) * sk;\n' +
    `col += (alb * 0.6 + u_curC * 0.05) * curAt(sp, z) * ${FACING} * (1.0 - fg) * sh;`,
);
swap(
  'col = mix(darkAt(sp, z), col, max(shownAt(z), u_solo));',
  'col = mix(darkAt(sp, z), col, max(shownAt(z), u_solo));\n' +
    `{ float cl = curAt(sp, z) * ${FACING}; col += (alb * 0.16 + u_curC * (0.05 + 0.28 * u_hov * cl)) * cl; }`,
);
// The rig: glints on the metal that faces the eye.
swap(
  'col = mix(darkAt(sp, z), col, shown) + colF * (1.0 - fg) * (1.0 - 0.45 * u_hush) * (1.0 - shown) * 0.6;',
  'col = mix(darkAt(sp, z), col, shown) + colF * (1.0 - fg) * (1.0 - 0.45 * u_hush) * (1.0 - shown) * 0.6;\n' +
    'col += u_curC * curAt(sp, z) * (0.08 * max(nv, 0.0) + 0.6 * pow(max(nv, 0.0), 24.0)) * (1.0 - fg) * shown;',
);
// The floor: its chevrons catch the light.
swap(
  '+ dith * step(0.002, on), 0.0), 1.0);',
  '+ dith * step(0.002, on), 0.0), 1.0);\no.rgb += (u_ink * 0.5 * m + u_curC * 0.01) * curAt(sp, v_xz.y) * fade * on;',
);

// --- The site's pointer: a light everywhere, the hero included --------------------------
// Over the hero (and the bar, dock and buttons above it) the pointer is the light, or
// the ring over anything that takes a click. The light's glow is its own element, so it
// can blend with the page under it.
const [, curEl, , curRoot] = grab(/let ([\w$]+)=document\.querySelector\("\.cur"\);if\(!([\w$]+)\|\|!\1\)return null;let ([\w$]+)=document\.documentElement;\3\.classList\.add\("has-cur"\);/, 'the pointer');
const [, hero, below] = grab(/let ([\w$]+)=document\.querySelector\("\.hero"\),([\w$]+)=\1&&\1\.nextElementSibling/, "the pointer's hero");
const [, bars] = grab(/([\w$]+)="\.bar, \.dock, \.view, \.fab"/, "the pointer's bars");
const [, links] = grab(/([\w$]+)='a\[href\], button, summary, label\[for\], \[role="button"\]'/, "the pointer's links");
edit(
  R`${curRoot}\.classList\.add\("has-cur"\);`,
  (all) => `${all}let lgt=document.createElement("div"),lcv=document.querySelector(".hero .strip"),lcs="";lgt.className="cur-light",lgt.setAttribute("aria-hidden","true"),document.body.appendChild(lgt);`,
  'the pointer light',
);
const [, kinds] = grab(/function ([\w$]+)\(([\w$]+),([\w$]+)\)\{if\(!\2\|\|!\2\.closest\|\|/, "the pointer's kinds");
edit(
  /function ([\w$]+)\(([\w$]+),([\w$]+)\)\{if\(!\2\|\|!\2\.closest\|\|/,
  (all, fn, el, y) =>
    `function ${fn}(${el},${y}){if(${el}&&${el}.closest&&!["is-full","is-focus","is-gate","is-menu"].some(k=>${curRoot}.classList.contains(k))&&!document.querySelector("dialog[open]")` +
    `&&!${el}.closest(".full, .focus, .viewer, .menu, .enter")&&(${el}.closest(".hero")||${el}.closest(${bars})&&${hero}&&Math.min(${hero}.getBoundingClientRect().bottom,${below}?${below}.getBoundingClientRect().top:1/0)>${y}))` +
    `return ${el}.closest(${links})||${el}.style&&${el}.style.cursor==="pointer"?"link":"dot";if(!${el}||!${el}.closest||`,
  "the pointer's kinds",
);
edit(R`${curEl}\.dataset\.mode=([\w$]+)\|\|""`, (all, m) => `${curEl}.dataset.mode=lgt.dataset.mode=${m}||""`, "the pointer's kind");
edit(
  R`([\w$]+)=([\w$]+)=>\{([\w$]+)\(${kinds}\(\2,([\w$]+)\)\);`,
  (all, fn, el) => all.replace('{', `{lgt.classList.toggle("in-hero",!!(${el}&&${el}.closest&&${el}.closest(".hero")));`),
  'the pointer over the page',
);
edit(R`${curEl}\.classList\.toggle\("is-inv",([\w$]+)\)\)`, (all, on) => `${curEl}.classList.toggle("is-inv",${on}),lgt.classList.toggle("is-inv",${on}))`, "the pointer's light ground");
edit(R`if\(${curEl}\.classList\.toggle\("is-on",([\w$]+)\),!\1\)return;`, (all, on) => `if(${curEl}.classList.toggle("is-on",${on}),lgt.classList.toggle("is-on",${on}),!${on})return;`, 'the pointer shown');
edit(R`([\w$]+)!==([\w$]+)&&\(\2=\1,${curEl}\.style\.transform=\1\)`, (all, t, last) => `${t}!==${last}&&(${last}=${t},${curEl}.style.transform=lgt.style.transform=${t})`, 'the pointer moved');
edit(R`([\w$]+)\(null\),${curEl}\.classList\.remove\("is-on"\)`, (all) => `${all},lgt.classList.remove("is-on")`, 'the pointer on touch');
// The hero's canvas says by its own cursor when a film is under the pointer, a frame
// after the pointer moves; look again whenever that changes.
{
  const [loop, , , y, lastY, docName, cls] = grab(R`([\w$]+)&&\(([\w$]+)>=8\|\|\2>0&&([\w$]+)===([\w$]+)\|\|(${curRoot})\.className!==([\w$]+)\|\|`, "the pointer's looks");
  swap(loop, `${loop}(lcv&&lcv.style.cursor)!==lcs||`);
  swap(`${lastY}=${y},${cls}=${docName}.className;`, `${lastY}=${y},${cls}=${docName}.className,lcs=lcv&&lcv.style.cursor;`);
}

// --- Type in the script: the name drawn on canvases and the fonts it waits for ---------
swap('"Inter Display", Inter, sans-serif', '"Martian Display", "Martian Grotesk", sans-serif', 3);
swap('"Inter Display"\'', '"Martian Display"\'', 3);
swap('font: 500 13px/1 Inter, sans-serif', 'font: 500 13px/1 Martian Grotesk, sans-serif');
if (/"Inter Display"|[\s,/]Inter[\s,]/.test(src)) throw new Error('Inter is still named in app.js');

writeFileSync(join(root, 'assets/app.js'), src);
execFileSync(process.execPath, ['--check', join(root, 'assets/app.js')], { stdio: 'inherit' });

// --- Type in the stylesheet ------------------------------------------------------------
// Martian Grotesk for text and Martian Display (the wider cut) where Inter Display was,
// each variable from 300 to 700 and split by script. Scaled to 91% so its capitals and
// x-height stand exactly as tall as Inter's did, keeping every size the layout was tuned
// to; it sets a little wider.
const LAT = 'U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212';
const CYR = 'U+0400-045F,U+0490-0491,U+2116';
const face = (family, file, range) =>
  `@font-face{font-family:${family};font-style:normal;font-weight:300 700;font-display:swap;size-adjust:91%;src:url(../fonts/${file}.woff2) format("woff2");unicode-range:${range}}`;
const FACES =
  face('Martian Display', 'martian-display-lat', LAT) +
  face('Martian Display', 'martian-display-cyr', CYR) +
  face('Martian Grotesk', 'martian-grotesk-lat', LAT) +
  face('Martian Grotesk', 'martian-grotesk-cyr', CYR);
let base = readFileSync(cssIn, 'utf8');
const INTER_FACE = /@font-face\{font-family:Inter( Display)?;[^}]*\}/g;
const interFaces = (base.match(INTER_FACE) || []).length;
if (interFaces !== 10) throw new Error(`expected 10 Inter faces in site.css, found ${interFaces}`);
base = FACES + base.replace(INTER_FACE, '').replace(/Inter Display/g, 'Martian Display').replace(/\bInter\b/g, 'Martian Grotesk');

// --- Styles ---------------------------------------------------------------------------
const css =
  base.replace(/\n*$/, '') +
  // No stepper under the 3D hero: the stack shows what comes next.
  '\n.is-vault .dots{display:none}' +
  // The pointer over the hero's canvas is the site's own, not the system's.
  '\nhtml.cur-on .strip{cursor:none!important}' +
  // The light: a warm core in the orange point's place and a soft glow around it that
  // lightens what is under it; smaller over the hero, where the scene itself is lit.
  '\n.cur[data-mode=dot] .cur__p{background:radial-gradient(circle,#fff 0 24%,#ffd6bf 44%,var(--accent) 76%);box-shadow:0 0 8px 1px #fb5e28aa,0 0 22px 5px #fb5e2840,0 0 0 1.5px #090c1240}' +
  '\n.cur.is-inv[data-mode=dot] .cur__p{background:var(--accent);box-shadow:0 0 0 1.5px #090c128c}' +
  '\n.cur-light{position:fixed;z-index:89;left:0;top:0;width:0;height:0;pointer-events:none;opacity:0;transition:opacity .3s ease;mix-blend-mode:screen;will-change:transform}' +
  '\n.cur-light:before{content:"";position:absolute;left:-140px;top:-140px;width:280px;height:280px;border-radius:50%;background:radial-gradient(closest-side,#ffd9bf30,#fb5e2812 45%,#fb5e2800);transition:transform .45s var(--ease-out),opacity .3s ease}' +
  '\n.cur-light.is-on{opacity:1}' +
  '\n.cur-light.in-hero:before{transform:scale(.45);opacity:.7}' +
  '\n.cur-light[data-mode=link]:before{transform:scale(.55)}' +
  '\n.cur-light.is-inv,.cur-light:not([data-mode=dot]):not([data-mode=link]){opacity:0}' +
  '\n';
writeFileSync(join(root, 'assets/site.css'), css);

// --- Font preloads in the pages ---------------------------------------------------------
// Each page preloads the Latin files, and the Russian pages the Cyrillic ones too, in
// place of Inter's; a page already changed is left as it is.
for (const page of ['index.html', 'ru/index.html', 'work/index.html', 'work/ru/index.html']) {
  const file = join(root, page);
  const html = readFileSync(file, 'utf8');
  const links = html.match(/<link rel="preload" href="[^"]*fonts\/inter-[^"]*\.woff2"[^>]*>\n?/g);
  if (!links) continue;
  const dir = links[0].match(/href="([^"]*)fonts\//)[1];
  const scripts = links.some((l) => l.includes('-cyr.')) ? ['lat', 'cyr'] : ['lat'];
  const preloads = scripts
    .flatMap((s) => ['display', 'grotesk'].map((c) => `<link rel="preload" href="${dir}fonts/martian-${c}-${s}.woff2" as="font" type="font/woff2" crossorigin>\n`))
    .join('');
  let out = html.replace(links[0], () => preloads);
  for (const l of links.slice(1)) out = out.replace(l, '');
  writeFileSync(file, out);
}
console.log('patched assets/app.js, assets/site.css and the font preloads');
