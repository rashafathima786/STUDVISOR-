import{c as o,u as v,j as s}from"./index-Fz5GWQEC.js";import{T as m}from"./trending-up-BkbqSpcB.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=o("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);function g({title:r,value:l,subtitle:e,trend:n,trendValue:i,icon:d,href:a,accentColor:t}){const c=v(),x={up:s.jsx(m,{size:14}),down:s.jsx(y,{size:14}),neutral:s.jsx(j,{size:14})},u={up:"var(--success-text)",down:"var(--danger-text)",neutral:"var(--text-muted)"};return s.jsxs("div",{className:`card stat-card ${a?"stat-card-clickable":""}`,onClick:a?()=>c(a):void 0,role:a?"link":void 0,tabIndex:a?0:void 0,onKeyDown:a?p=>p.key==="Enter"&&c(a):void 0,children:[s.jsxs("div",{className:"stat-card-top",children:[s.jsx("span",{className:"stat-card-label",children:r}),d&&s.jsx("div",{className:"stat-card-icon",style:t?{background:t+"14",color:t}:void 0,children:d})]}),s.jsx("div",{className:"stat-card-value",style:t?{color:t}:void 0,children:l}),s.jsxs("div",{className:"stat-card-bottom",children:[n&&s.jsxs("span",{className:"stat-card-trend",style:{color:u[n]},children:[x[n],i&&s.jsx("span",{children:i})]}),e&&s.jsx("span",{className:"stat-card-subtitle",children:e})]})]})}export{g as S};
