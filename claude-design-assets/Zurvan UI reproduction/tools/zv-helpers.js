(() => {
const C = { g: '#0C3B2E', gold: '#C8A85A', goldD: '#B98F3E', ink: '#22352B', mute: '#8D897B', line: '#EBE5D6', soft: '#F1EDE2', bg: '#FBFAF6', cream: '#FBF6E9', creamB: '#F0E4C6' };
const svg = (inner, s = 20, color = 'currentColor', sw = 1.7) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${inner}</svg>`;
const I = {
  back: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  chevL: '<path d="m15 18-6-6 6-6"></path>', chevD: '<path d="m6 9 6 6 6-6"></path>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
  share: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"></path>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle>',
  van: '<path d="M4 17V9l3-4h9l3 4v8"></path><path d="M2 17h20"></path><circle cx="7" cy="18" r="1.8"></circle><circle cx="17" cy="18" r="1.8"></circle><path d="M7 9h10"></path>',
  steth: '<path d="M11 2v2M5 2v2"></path><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path><path d="M8 15a6 6 0 0 0 12 0v-3"></path><circle cx="20" cy="10" r="2"></circle>',
  medal: '<circle cx="12" cy="8" r="6"></circle><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"></path>',
  walker: '<circle cx="9" cy="4.5" r="1.9"></circle><path d="M9 7v6"></path><path d="m9 13-2.2 6.5"></path><path d="m9 13 2.2 6.5"></path><path d="M9 8.5h3.8"></path><path d="m12.8 8.5 3.4 5"></path><path d="M15 17v-2.7h4.3l1.4-1.6.9 2.1-.7 2.2"></path>',
  paw: '<circle cx="8" cy="6.5" r="1.8"></circle><circle cx="16" cy="6.5" r="1.8"></circle><circle cx="4.5" cy="11" r="1.8"></circle><circle cx="19.5" cy="11" r="1.8"></circle><path d="M12 10.5c-2.8 0-5 2.4-5 4.8 0 1.9 1.4 2.9 2.8 2.9.9 0 1.5-.5 2.2-.5s1.3.5 2.2.5c1.4 0 2.8-1 2.8-2.9 0-2.4-2.2-4.8-5-4.8z"></path>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
  clock: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"></path>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path>',
  headset: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>',
  cam: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M8 13h8M8 17h6"></path>',
  pill: '<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z"></path><path d="m8.5 8.5 7 7"></path>',
  syringe: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3"></path>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"></rect><path d="m16 10 6-4v12l-6-4"></path>',
  house: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path>',
  target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
  route: '<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5M12 15V3"></path>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>',
  leash: '<circle cx="18" cy="6" r="3"></circle><path d="M15.9 8.1 4 20"></path><path d="M4 16v4h4"></path>',
  note: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
  gauge: '<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>'
};
const checkF = (s = 15, c = C.g) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" style="flex:none"><circle cx="12" cy="12" r="10"></circle><path d="m8.5 12 2.5 2.5 4.5-5" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const star = (s = 12, c = C.gold) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" style="flex:none"><path d="M11.5 3.1a.55.55 0 0 1 1 0l2.2 4.5 5 .7c.5.1.7.7.3 1l-3.6 3.5.9 4.9c.1.5-.4.9-.9.6L12 16l-4.4 2.3c-.5.3-1-.1-.9-.6l.9-4.9L4 9.3c-.4-.3-.2-.9.3-1l5-.7z"></path></svg>`;
const radioOn = `<div style="width:18px;height:18px;border-radius:50%;border:5px solid ${C.g};background:#FFFFFF;flex:none"></div>`;
const radioOff = `<div style="width:18px;height:18px;border-radius:50%;border:1.5px solid #C9C4B4;background:#FFFFFF;flex:none"></div>`;
const SB = (dark) => { const c = dark ? '#F7F4EC' : '#1A1A18'; return `<div dir="ltr" style="height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:6px 28px 0${dark ? ';background:' + C.g : ''}"><div style="font-weight:700;font-size:15px;color:${c}">9:41</div><div style="display:flex;align-items:center;gap:5px;color:${c}"><svg width="17" height="12" viewBox="0 0 17 12"><rect y="7" width="3" height="5" rx="1" fill="currentColor"></rect><rect x="4.5" y="5" width="3" height="7" rx="1" fill="currentColor"></rect><rect x="9" y="2.5" width="3" height="9.5" rx="1" fill="currentColor"></rect><rect x="13.5" width="3" height="12" rx="1" fill="currentColor"></rect></svg><svg width="24" height="11" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.4"></rect><rect x="2" y="2" width="18" height="8" rx="1.8" fill="currentColor"></rect></svg></div></div>`; };
const HB = `<div style="align-self:center;width:135px;height:5px;border-radius:3px;background:#1A1A18;flex:none"></div>`;
const header = (t, left = '') => `<div style="display:flex;align-items:center;flex:none"><div style="width:34px;color:${C.ink}">${svg(I.back, 22, 'currentColor', 1.8)}</div><div style="flex:1;text-align:center;font-size:17px;font-weight:800;color:${C.ink}">${t}</div><div style="width:34px;display:flex;justify-content:flex-end;color:${C.ink}">${left}</div></div>`;
const title = (t, extra = '') => `<div style="display:flex;align-items:center;justify-content:space-between;flex:none"><div style="font-size:13.5px;font-weight:800;color:${C.ink}">${t}</div>${extra}</div>`;
const card = (inner, extra = '') => `<div style="background:#FFFFFF;border:1px solid ${C.line};border-radius:16px;${extra}">${inner}</div>`;
const cta = (t, style = 'primary') => style === 'primary'
  ? `<div style="height:54px;flex:none;background:${C.g};border-radius:15px;display:flex;align-items:center;justify-content:center;color:#F7F4EC;font-size:15px;font-weight:700">${t}</div>`
  : `<div style="height:54px;flex:none;background:#FFFFFF;border:1.5px solid ${C.g};border-radius:15px;display:flex;align-items:center;justify-content:center;gap:8px;color:${C.g};font-size:15px;font-weight:700">${t}</div>`;
const iconBox = (inner, s = 40, bg = C.cream, col = C.goldD, r = 12) => `<div style="width:${s}px;height:${s}px;border-radius:${r}px;background:${bg};display:flex;align-items:center;justify-content:center;color:${col};flex:none">${svg(inner, Math.round(s * 0.5))}</div>`;
const avatar = (src, s = 44) => `<img src="${src}" alt="" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;flex:none">`;
const initials = (t, s = 44, bg = '#DCE6DF', col = C.g) => `<div style="width:${s}px;height:${s}px;border-radius:50%;background:${bg};color:${col};display:flex;align-items:center;justify-content:center;font-size:${Math.round(s * 0.34)}px;font-weight:800;flex:none">${t}</div>`;
const petRow = () => card(`<div style="display:flex;align-items:center;gap:12px;padding:10px 12px">${avatar('assets/leo.png', 44)}<div style="flex:1"><div style="display:flex;align-items:center;gap:4px"><div style="font-size:14px;font-weight:800;color:${C.ink}">لئو</div>${checkF(13)}</div><div style="font-size:10.5px;color:${C.mute};margin-top:1px">گلدن رتریور • ۳ ساله • ۳۰ کیلوگرم</div></div><div style="color:#4A5347">${svg(I.chevD, 18, 'currentColor', 2)}</div></div>`);
const note = (text, ico = I.shield, tone = 'cream') => { const bg = tone === 'green' ? '#EEF4F0' : C.cream, bd = tone === 'green' ? '#D5E3DA' : C.creamB, ic = tone === 'green' ? C.g : C.goldD, tc = tone === 'green' ? '#2F4A3D' : '#4A4636'; return `<div style="display:flex;align-items:flex-start;gap:10px;background:${bg};border:1px solid ${bd};border-radius:14px;padding:11px 12px;flex:none"><div style="color:${ic}">${svg(ico, 19)}</div><div style="flex:1;font-size:11.5px;color:${tc};line-height:1.7">${text}</div></div>`; };
const map = (h, route, extra = '') => `<div style="height:${h}px;flex:none;border-radius:20px;background:#E9EBE3;position:relative;overflow:hidden;border:1px solid #DDE0D5"><div style="position:absolute;inset:0;background-image:linear-gradient(#DDE0D5 1px,transparent 1px),linear-gradient(90deg,#DDE0D5 1px,transparent 1px);background-size:22px 22px"></div><svg viewBox="0 0 350 ${h}" style="position:absolute;inset:0;width:100%;height:100%" fill="none"><path d="${route}" stroke="${C.g}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg>${extra}</div>`;
const frame = (label, caption, body, opts = {}) => `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div data-screen-label="00 ${label}" style="width:390px;height:844px;background:${C.bg};border-radius:44px;border:1px solid #E3DFD2;box-shadow:0 18px 44px rgba(20,30,20,0.14);overflow:hidden;display:flex;flex-direction:column">
          ${SB(opts.dark)}
          ${opts.top || ''}
          <div style="flex:1;padding:${opts.pad || '4px 20px 12px'};display:flex;flex-direction:column;gap:${opts.gap || 12}px;min-height:0">
            ${body}
            ${HB}
          </div>
        </div>
        <div style="font-size:12.5px;font-weight:700;color:#6E6A5E;text-align:center">۰۰ — ${caption}</div>
      </div>`;
const flow = (n, t, screens) => `
  <!-- ===== FLOW ${n} ===== -->
  <div style="display:flex;flex-direction:column;gap:20px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:8px;height:8px;border-radius:50%;background:${C.gold}"></div>
      <div style="font-size:17px;font-weight:800;color:${C.ink}">${t}</div>
      <div style="flex:1;height:1px;background:#D6D1C2"></div>
    </div>
    <div style="display:flex;gap:28px;flex-wrap:wrap">${screens}
    </div>
  </div>
`;
const spacer = `<div style="flex:1"></div>`;
// Service detail page (shared template)
const detail = ({ label, caption, name, icon, desc, stats, listTitle, items, steps, noteText, ctaText }) => frame(label, caption, [
  header(name, svg(I.heart, 21)),
  `<div style="background:${C.g};border-radius:22px;padding:14px 16px;color:#F7F4EC;flex:none"><div style="display:flex;align-items:center;gap:14px">${iconBox(icon, 58, 'rgba(228,195,118,0.16)', '#E4C376', 18)}<div style="flex:1"><div style="font-size:18px;font-weight:800">${name}</div><div style="font-size:11.5px;color:#C9CDBF;line-height:1.8;margin-top:3px">${desc}</div></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.14)">${stats.map((s, i) => `<div style="text-align:center;${i ? 'border-right:1px solid rgba(255,255,255,0.14)' : ''}"><div style="font-size:15px;font-weight:800;color:#E4C376">${s[0]}</div><div style="font-size:10px;color:#C9CDBF;margin-top:2px">${s[1]}</div></div>`).join('')}</div></div>`,
  title(listTitle),
  `<div style="display:flex;flex-direction:column;gap:8px;flex:none">${items.map(it => card(`<div style="display:flex;align-items:center;gap:11px;padding:7px 12px">${iconBox(it[0], 38)}<div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:700;color:${C.ink}">${it[1]}</div><div style="font-size:10.5px;color:${C.mute};margin-top:2px">${it[2]}</div></div><div style="text-align:left;flex:none"><div style="font-size:9.5px;color:${C.mute}">از</div><div style="font-size:12px;font-weight:800;color:${C.ink};white-space:nowrap">${it[3]}</div></div></div>`)).join('')}</div>`,
  title('چطور کار می‌کند؟'),
  `<div style="display:grid;grid-template-columns:repeat(${steps.length},1fr);gap:8px;flex:none">${steps.map((s, i) => `<div style="background:#FFFFFF;border:1px solid ${C.line};border-radius:14px;padding:10px 6px;text-align:center"><div style="width:24px;height:24px;border-radius:50%;background:${C.cream};border:1px solid ${C.creamB};color:${C.goldD};font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto">${'۱۲۳۴'[i]}</div><div style="font-size:10.5px;font-weight:600;color:${C.ink};margin-top:6px;line-height:1.6">${s}</div></div>`).join('')}</div>`,
  note(noteText, I.shield, 'green'),
  spacer,
  cta(ctaText)
].join('\n'));
return { C, svg, I, checkF, star, radioOn, radioOff, SB, HB, header, title, card, cta, iconBox, avatar, initials, petRow, note, map, frame, flow, spacer, detail };
})()
