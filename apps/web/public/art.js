// Original reusable cartoon artwork; no remote assets, image requests or copyrighted board pixels.
export const FLAGS={us:'🇺🇸',eu:'🇪🇺',china:'🇨🇳',russia:'🇷🇺'};
export const flag=country=>FLAGS[country]??'⚑';
export const SPRITES={
 infantry:'<ellipse cx="0" cy="12" rx="10" ry="3" fill="#263c3670"/><path d="M-4 2-6 11M3 2 5 11" stroke="#263d34" stroke-width="4"/><path d="M-6-9H5L7 2H-7Z" fill="#718249" stroke="#253931"/><circle cy="-14" r="5" fill="#e8c395"/><path d="M-6-15Q0-24 6-15V-12H-6Z" fill="#486348" stroke="#253931"/><path d="M5-7 10 2M-5-7-9-2" stroke="#dfb68c" stroke-width="3"/><path d="M7-11 10 8" stroke="#2b3531" stroke-width="3"/>',
 tanks:'<rect x="-16" y="2" width="32" height="11" rx="5" fill="#263c34"/><path d="M-13 8H13" stroke="#a4ad82" stroke-width="3" stroke-dasharray="4 2"/><path d="M-14 3-9-5H9L15 3Z" fill="#839757" stroke="#344a37"/><path d="M-6-6-3-12H7L10-6Z" fill="#637e48" stroke="#344a37"/><path d="M7-10H26" stroke="#344a37" stroke-width="4"/>',
 fighters:'<path d="M0-23 4-5 21 6 20 10 4 5 3 17 9 22H-9L-3 17-4 5-20 10-21 6-4-5Z" fill="#c0d5dc" stroke="#344d59" stroke-width="1.8"/><path d="M0-14V-4" stroke="#3a7894" stroke-width="3"/><path d="M-14 5H-7M7 5H14" stroke="#d29a53" stroke-width="2"/>',
 bombers:'<path d="M0-18 5-5 25 12 23 17 6 10 3 18H-3L-6 10-23 17-25 12-5-5Z" fill="#526979" stroke="#253b49" stroke-width="1.8"/><path d="M-10 3-10 11M10 3V11" stroke="#c0ccd0" stroke-width="4"/><path d="M-2-9H2" stroke="#b8e1df" stroke-width="3"/>',
 navy:'<path d="M-25 7H25L16 18H-17Z" fill="#6a8490" stroke="#294652" stroke-width="2"/><path d="M-14 6V-2H13V6" fill="#becac4" stroke="#294652"/><path d="M-4-2V-11H6V-2M0-10V-20" fill="#647e88" stroke="#294652" stroke-width="2"/><path d="M-18 2H-8M12 3H22" stroke="#294652" stroke-width="3"/><path d="M-23 22Q-14 25-5 22T13 22T29 22" fill="none" stroke="#84bec3" stroke-width="2"/>',
 submarine:'<path d="M-26 8Q-23-1-14-1H17Q28 2 27 8T17 16H-14Q-25 16-26 8Z" fill="#425f6a" stroke="#203a48" stroke-width="2"/><path d="M-3-1V-10H7V-1M2-10V-17H9" fill="#617f85" stroke="#203a48" stroke-width="2"/><path d="M-26 4-32 0V16L-26 12" fill="#425f6a"/><circle cx="17" cy="7" r="2" fill="#a6d4d5"/>',
 special:'<path d="M-5 3-7 13M3 3 6 13" stroke="#253944" stroke-width="4"/><path d="M-7-8H6V4H-7Z" fill="#3f5960" stroke="#233a42"/><circle cy="-14" r="5" fill="#cba47b"/><path d="M-6-16Q0-23 6-16V-12H-6Z" fill="#293e46"/><path d="M-5-12H5" stroke="#1c282b" stroke-width="3"/><path d="M6-8 12 4" stroke="#27363b" stroke-width="3"/>',
 base:'<path d="M-18 15V-7L0-19 18-7V15Z" fill="#c6ad7c" stroke="#63583e" stroke-width="2"/><path d="M-8 15V-3H8V15" fill="#596f67"/><path d="M-21-7 0-22 21-7" fill="none" stroke="#775b3f" stroke-width="4"/><path d="M0-22V-35H14L10-28H0" fill="#ce6a4d" stroke="#63583e"/>',
 fortification:'<path d="M-23 15V-10H-14V-3H-6V-10H5V-3H13V-10H23V15Z" fill="#c1b18d" stroke="#625e4a" stroke-width="2"/><path d="M-23 6H23M-16-3V6M0 6V15M16-3V6" stroke="#8d866d" stroke-width="2"/>',
};
export const sprite=(type,scale=1)=>`<g transform="scale(${scale})">${SPRITES[type]??SPRITES.base}</g>`;
export function newsArt(kind='political'){
 const type=/battle|war|military/.test(kind)?'tanks':/trade|diplomacy|cooper/.test(kind)?'navy':/research|scien/.test(kind)?'fighters':'base';
 return `<svg viewBox="0 0 400 170" class="news-illustration" aria-hidden="true"><rect width="400" height="170" fill="#e7d7af"/><circle cx="315" cy="45" r="29" fill="#e1b26a"/><path d="M0 125 80 82 148 122 250 68 400 118V170H0Z" fill="#9ba988"/><path d="M0 147 105 127 200 144 300 113 400 144V170H0Z" fill="#738c75"/><g transform="translate(200 98) scale(2.7)">${SPRITES[type]}</g><path d="M35 29H112M35 38H87" stroke="#9b8c6a" stroke-width="3"/></svg>`;
}
