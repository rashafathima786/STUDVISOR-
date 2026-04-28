import{c as n,j as t}from"./index-Fz5GWQEC.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=n("Inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);function m({icon:a,title:l="No data found",description:s="",action:e=null}){return t.jsxs("div",{className:"empty-state-container",children:[t.jsx("div",{className:"empty-state-icon",children:a||t.jsx(c,{size:40})}),t.jsx("h3",{className:"empty-state-title",children:l}),s&&t.jsx("p",{className:"empty-state-desc",children:s}),e&&(typeof e=="object"&&e.label?t.jsx("button",{className:"primary-btn compact-btn",onClick:e.onClick,children:e.label}):e)]})}export{m as E};
