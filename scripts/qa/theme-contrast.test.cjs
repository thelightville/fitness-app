const assert = require('node:assert/strict');
const fs = require('node:fs');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const loadConfig = require('tailwindcss/loadConfig');
function luminance(rgb) { return rgb.map(v => {v /= 255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4}).reduce((s,v,i) => s+v*[.2126,.7152,.0722][i],0); }
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async () => {
 const config=loadConfig(process.cwd()+'/tailwind.config.ts');
 const css=(await postcss([tailwind({...config,content:[{raw:'<input class="input"><label class="label">Label</label>',extension:'html'}]})]).process(fs.readFileSync('src/app/globals.css','utf8'),{from:undefined})).css;
 const ast=postcss.parse(css);const results=[];
 for(const osDark of [false,true])for(const selectedDark of [false,true]){
  let foreground;let background;
  ast.walkRules(rule=>{
   // Actual compiled input color rules, excluding interaction/placeholder variants.
   if(!rule.selector.includes('.input')||/placeholder|:focus|:hover/.test(rule.selector))return;
   let parent=rule.parent;
   while(parent){if(parent.type==='atrule'&&parent.name==='media'&&parent.params.includes('prefers-color-scheme: dark')&&!osDark)return;parent=parent.parent;}
   if(/\.dark(?:\s|\b)/.test(rule.selector)&&!selectedDark)return;
   rule.walkDecls('color',d=>{const m=d.value.match(/^rgb\((\d+) (\d+) (\d+)/);if(m)foreground=m.slice(1).map(Number)});
  });
  ast.walkRules(rule=>{if(rule.selector===':root'||(rule.selector==='.dark'&&selectedDark))rule.walkDecls('--brand-card',d=>background=d.value.split(' ').map(Number));});
  assert(foreground&&background,'Compiled input foreground and card background must resolve');
  const ratio=contrast(foreground,background);results.push({osDark,selectedDark,foreground,background,contrast:Number(ratio.toFixed(2)),pass:ratio>=4.5});
 }
 console.log(JSON.stringify({cases:results,passed:results.filter(r=>r.pass).length,total:results.length}));
 if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
