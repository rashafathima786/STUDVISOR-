import{c as t,a5 as E,r as a,u as L,a as p,a6 as O,j as e,a7 as b}from"./index-Fz5GWQEC.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=t("Bell",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=t("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=t("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=t("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=t("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=t("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=t("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]),D=E(n=>({sidebarOpen:!1,sidebarCollapsed:!1,toggleSidebar:()=>n(i=>({sidebarOpen:!i.sidebarOpen})),openSidebar:()=>n({sidebarOpen:!0}),closeSidebar:()=>n({sidebarOpen:!1}),toggleCollapsed:()=>n(i=>({sidebarCollapsed:!i.sidebarCollapsed}))}));function P({title:n,subtitle:i}){const[d,N]=a.useState([]),[x,m]=a.useState(!1),[c,g]=a.useState(!1),[l,k]=a.useState(localStorage.getItem("theme")||"dark"),h=a.useRef(null),u=a.useRef(null),S=L(),r=p(s=>s.user),j=p(s=>s.role),w=p(s=>s.logout),z=D(s=>s.toggleSidebar);a.useEffect(()=>{O().then(s=>N((s==null?void 0:s.notifications)||[])).catch(()=>{})},[]),a.useEffect(()=>{document.documentElement.setAttribute("data-theme",l),localStorage.setItem("theme",l)},[l]),a.useEffect(()=>{const s=v=>{h.current&&!h.current.contains(v.target)&&g(!1),u.current&&!u.current.contains(v.target)&&m(!1)};return document.addEventListener("mousedown",s),()=>document.removeEventListener("mousedown",s)},[]);const C=()=>k(l==="dark"?"light":"dark"),o=d.filter(s=>!s.is_read).length,M=()=>{w(),S("/login")},f=(r==null?void 0:r.full_name)||(r==null?void 0:r.username)||"User",y=(j||"student").charAt(0).toUpperCase()+(j||"student").slice(1);return e.jsxs("div",{className:"dashboard-header",children:[e.jsxs("div",{className:"header-left",children:[e.jsx("button",{className:"hamburger-btn",onClick:z,"aria-label":"Toggle sidebar menu",children:e.jsx(R,{size:22})}),e.jsxs("div",{children:[e.jsx("h1",{children:n}),i&&e.jsx("p",{children:i})]})]}),e.jsxs("div",{className:"header-actions",children:[e.jsxs("div",{className:"input-with-icon header-search",style:{marginBottom:0,padding:"0 12px"},children:[e.jsx(q,{size:16}),e.jsx("input",{type:"text",placeholder:"Search across ERP...",style:{padding:"8px 0",fontSize:"0.88rem"}})]}),e.jsx("button",{className:"notif-bell",onClick:C,title:"Toggle Theme","aria-label":"Toggle theme",children:l==="dark"?e.jsx(B,{size:20}):e.jsx(I,{size:20})}),e.jsxs("div",{style:{position:"relative"},ref:u,children:[e.jsxs("button",{className:"notif-bell",onClick:()=>m(!x),"aria-label":"Notifications",children:[e.jsx(T,{size:20}),o>0&&e.jsx("span",{className:"notif-count",children:o})]}),x&&e.jsxs("div",{className:"notif-panel",style:{position:"absolute",top:"100%",right:0,width:"380px",zIndex:100,marginTop:"8px"},children:[e.jsxs("div",{className:"notif-panel-header",children:[e.jsx("strong",{children:"Notification Center"}),o>0&&e.jsxs("span",{className:"pill-badge",children:[o," New"]})]}),d.length===0?e.jsx("p",{style:{color:"var(--text-muted)",fontSize:"0.9rem",textAlign:"center",padding:"20px 0"},children:"No notifications"}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:d.map(s=>e.jsxs("div",{className:`notif-item notif-${s.type}`,children:[e.jsx("div",{className:"notif-icon",children:s.type==="critical"?"🚨":s.type==="warning"?"⚠️":s.type==="success"?"✅":"ℹ️"}),e.jsxs("div",{children:[e.jsx("strong",{children:s.title}),e.jsx("p",{children:s.message})]})]},s.id))})]})]}),e.jsxs("div",{className:"header-user-menu",ref:h,children:[e.jsxs("button",{className:"header-user-trigger",onClick:()=>g(!c),"aria-label":"User menu",children:[e.jsx("div",{className:"header-avatar",children:e.jsx(b,{size:16})}),e.jsxs("div",{className:"header-user-info",children:[e.jsx("span",{className:"header-user-name",children:f}),e.jsx("span",{className:"header-user-role",children:y})]}),e.jsx(U,{size:14,className:`header-chevron ${c?"rotated":""}`})]}),c&&e.jsxs("div",{className:"header-dropdown",children:[e.jsxs("div",{className:"header-dropdown-header",children:[e.jsx("div",{className:"header-avatar lg",children:e.jsx(b,{size:20})}),e.jsxs("div",{children:[e.jsx("strong",{children:f}),e.jsx("span",{children:y})]})]}),e.jsx("div",{className:"header-dropdown-divider"}),e.jsxs("button",{className:"header-dropdown-item danger",onClick:M,children:[e.jsx(A,{size:16}),e.jsx("span",{children:"Sign Out"})]})]})]})]})]})}export{U as C,P as H,A as L,q as S,D as u};
