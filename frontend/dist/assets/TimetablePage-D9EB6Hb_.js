import{r as u,j as t}from"./index-Fz5GWQEC.js";import{E as W}from"./ErpLayout-CpDKEn6s.js";import"./Header-35qE35Uk.js";import"./shield-alert-BuXqhv4E.js";import"./book-open-DQtk7TCg.js";import"./info-Bkn9I5DW.js";import"./circle-check-big-Bge0yaEc.js";const $=e=>{const o=new Date(e);o.setHours(0,0,0,0);const n=o.getDay(),d=n===0?-6:1-n;return o.setDate(o.getDate()+d),o},C=(e,o)=>{const n=new Date(e);return n.setDate(n.getDate()+o),n},L=(e,o)=>C(e,o*7),O=e=>e.toLocaleDateString("en-US",{month:"long"}).toUpperCase(),_=e=>e.toLocaleDateString("en-US",{month:"long",year:"numeric"}),F=e=>`${e.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}, ${e.getDate()}`,z=[["#d4c5a9","#1a1a18"],["#c5b8a9","#1a1a18"],["#a9b8c5","#1a1a18"],["#b8a9c5","#1a1a18"],["#a9c5b8","#1a1a18"],["#c5a9b8","#1a1a18"]],G=[{id:1,title:"DATA STRUCTURES & ALGO",dayIndex:0,startHour:10,duration:2,avatarLetters:["H","R","A"],avatarColors:["0","1","2"]},{id:2,title:"DESIGN TEAM SYNC",dayIndex:2,startHour:12,duration:2,avatarLetters:["K","M","S"],avatarColors:["3","4","5"]},{id:3,title:"OPERATING SYSTEMS",dayIndex:1,startHour:9,duration:1.5,avatarLetters:["P"],avatarColors:["2"]},{id:4,title:"PROJECT MENTORING",dayIndex:3,startHour:13,duration:1.5,avatarLetters:["T","V"],avatarColors:["1","4"]},{id:5,title:"AI WORKSHOP",dayIndex:4,startHour:10,duration:1.5,avatarLetters:["N","L"],avatarColors:["0","5"]}],P=["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM"],m=8,N=16;function Y({letter:e,colorIdx:o}){const[n,d]=z[parseInt(o)%z.length];return t.jsx("div",{style:{width:28,height:28,borderRadius:"50%",background:n,color:d,border:"2.5px solid #1a1a18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,marginLeft:-8,flexShrink:0,fontFamily:"inherit"},children:e})}function B({ev:e,topPx:o,heightPx:n,onClick:d}){return t.jsxs("div",{onClick:d,style:{position:"absolute",top:o+3,left:6,right:6,height:Math.max(n-6,36),background:"#1a1a18",borderRadius:40,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px 0 20px",cursor:"pointer",zIndex:10,userSelect:"none",transition:"opacity 0.15s"},onMouseEnter:l=>l.currentTarget.style.opacity="0.85",onMouseLeave:l=>l.currentTarget.style.opacity="1",children:[t.jsx("span",{style:{color:"#f0ede4",fontSize:11,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"DM Sans, sans-serif",flex:1},children:e.title}),e.avatarLetters.length>0&&t.jsx("div",{style:{display:"flex",marginLeft:12,paddingLeft:8,flexShrink:0},children:e.avatarLetters.map((l,i)=>t.jsx(Y,{letter:l,colorIdx:e.avatarColors[i]||"0"},i))})]})}function V({event:e,onSave:o,onDelete:n,onClose:d}){const l=!(e!=null&&e.id),[i,H]=u.useState((e==null?void 0:e.title)||""),[T,v]=u.useState((e==null?void 0:e.dayIndex)??0),[g,M]=u.useState((e==null?void 0:e.startHour)??9),[S,k]=u.useState((e==null?void 0:e.duration)??1),x=["MON","TUE","WED","THU","FRI","SAT","SUN"],E=Array.from({length:(N-m)*2},(a,r)=>{const h=m+r*.5,p=Math.floor(h),b=h%1===.5?"30":"00",R=p<12?"AM":"PM",I=p>12?p-12:p;return{value:h,label:`${I}:${b} ${R}`}}),j=[.5,1,1.5,2,2.5,3,3.5,4].map(a=>({value:a,label:`${a}h`})),A=()=>{i.trim()&&o({id:(e==null?void 0:e.id)||Date.now(),title:i.trim().toUpperCase(),dayIndex:T,startHour:g,duration:S,avatarLetters:(e==null?void 0:e.avatarLetters)||["H"],avatarColors:(e==null?void 0:e.avatarColors)||["0"]})},D={width:"100%",padding:"8px 12px",background:"#f0ede4",border:"1px solid #d8d4c8",borderRadius:8,fontSize:12,color:"#1a1a18",fontFamily:"DM Sans, sans-serif",outline:"none",boxSizing:"border-box"},y={...D,appearance:"none",cursor:"pointer"},f={fontSize:10,color:"#8b8b82",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5,display:"block"},s={marginBottom:14};return t.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(26,26,24,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100},onClick:d,children:t.jsxs("div",{style:{background:"#f8f5ee",borderRadius:18,padding:28,width:360,border:"1px solid #e0dcd2",fontFamily:"DM Sans, sans-serif"},onClick:a=>a.stopPropagation(),children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20},children:[t.jsx("h3",{style:{fontSize:16,fontWeight:700,color:"#1a1a18",margin:0,fontFamily:"DM Serif Display, serif"},children:l?"New Class":"Edit Class"}),t.jsx("button",{onClick:d,style:{background:"none",border:"none",fontSize:18,color:"#8b8b82",cursor:"pointer"},children:"✕"})]}),t.jsxs("div",{style:s,children:[t.jsx("label",{style:f,children:"Subject Name"}),t.jsx("input",{style:D,value:i,onChange:a=>H(a.target.value),placeholder:"e.g. Machine Learning",autoFocus:!0})]}),t.jsxs("div",{style:s,children:[t.jsx("label",{style:f,children:"Day"}),t.jsx("select",{style:y,value:T,onChange:a=>v(Number(a.target.value)),children:x.map((a,r)=>t.jsx("option",{value:r,children:a},r))})]}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14},children:[t.jsxs("div",{children:[t.jsx("label",{style:f,children:"Start Time"}),t.jsx("select",{style:y,value:g,onChange:a=>M(Number(a.target.value)),children:E.map(a=>t.jsx("option",{value:a.value,children:a.label},a.value))})]}),t.jsxs("div",{children:[t.jsx("label",{style:f,children:"Duration"}),t.jsx("select",{style:y,value:S,onChange:a=>k(Number(a.target.value)),children:j.map(a=>t.jsx("option",{value:a.value,children:a.label},a.value))})]})]}),t.jsxs("div",{style:{display:"flex",gap:8,marginTop:8},children:[t.jsx("button",{onClick:A,style:{flex:1,padding:"10px 0",background:"#1a1a18",color:"#f0ede4",border:"none",borderRadius:10,fontSize:11,fontWeight:700,letterSpacing:"0.08em",cursor:"pointer",textTransform:"uppercase"},children:l?"Add Class":"Save Changes"}),!l&&t.jsx("button",{onClick:()=>n(e.id),style:{padding:"10px 16px",background:"#f5e8e8",color:"#c0392b",border:"1px solid #f0d0d0",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer"},children:"Delete"})]})]})})}function K(){const[e,o]=u.useState(new Date),[n,d]=u.useState(G),[l,i]=u.useState(null),[H,T]=u.useState(null),v=u.useRef(null),g=$(e),M=Array.from({length:7},(s,a)=>C(g,a)),S=O(C(g,-7)),k=O(C(g,7)),x=52,E=82,j=s=>(s-m)*x,A=(s,a)=>{if(a.target.closest(".ev-pill"))return;const r=a.currentTarget.getBoundingClientRect(),h=a.clientY-r.top,p=Math.round((h/x+m)*2)/2;i({event:{dayIndex:s,startHour:Math.min(p,N-1)}})},D=s=>{d(a=>a.some(r=>r.id===s.id)?a.map(r=>r.id===s.id?s:r):[...a,s]),i(null)},y=s=>{d(a=>a.filter(r=>r.id!==s)),i(null)},f=(N-m)*x;return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e8e5de; }
        .tt-root {
          font-family: 'DM Sans', sans-serif;
          background: #e8e5de;
          border-radius: 20px;
          padding: 24px 24px 20px;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
        /* HEADER */
        .tt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .tt-nav {
          background: #fff;
          border: none;
          border-radius: 40px;
          padding: 12px 22px;
          font-size: 12px;
          font-weight: 700;
          color: #1a1a18;
          cursor: pointer;
          letter-spacing: 0.06em;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .tt-nav:hover { background: #f0ede4; }
        .tt-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          color: #1a1a18;
          font-weight: 400;
          text-align: center;
          flex: 1;
          letter-spacing: -0.01em;
        }
        /* GRID WRAPPER */
        .tt-grid-outer {
          display: flex;
          gap: 0;
        }
        /* TIME COLUMN */
        .tt-times {
          width: ${E}px;
          flex-shrink: 0;
          padding-top: 32px; /* offset for day headers */
        }
        .tt-time-cell {
          height: ${x}px;
          display: flex;
          align-items: flex-start;
          padding-top: 2px;
          font-size: 11px;
          color: #8b8b82;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        /* DAYS GRID */
        .tt-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          flex: 1;
          gap: 0;
        }
        /* DAY COLUMN */
        .tt-day-col {
          display: flex;
          flex-direction: column;
          border-left: 1px dashed rgba(26,26,24,0.15);
        }
        .tt-day-col:first-child { border-left: none; }
        /* DAY HEADER */
        .tt-day-head {
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #8b8b82;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .tt-day-head.today {
          color: #1a1a18;
        }
        /* EVENTS AREA */
        .tt-events-area {
          position: relative;
          height: ${f}px;
          cursor: pointer;
        }
        /* HOUR LINES */
        .tt-hour-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: rgba(26,26,24,0.08);
        }
        /* TODAY HIGHLIGHT */
        .tt-today-col .tt-events-area {
          background: rgba(255,255,255,0.18);
          border-radius: 4px;
        }
        /* ADD BTN */
        .tt-add-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #1a1a18;
          color: #f0ede4;
          border: none;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          transition: transform 0.15s;
        }
        .tt-add-btn:hover { transform: scale(1.08); }
        /* NOW LINE */
        .tt-now-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: #e8948a;
          z-index: 5;
        }
        .tt-now-dot {
          position: absolute;
          left: -4px;
          top: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e8948a;
        }
      `}),t.jsxs("div",{className:"tt-root",children:[t.jsxs("div",{className:"tt-header",children:[t.jsxs("button",{className:"tt-nav",onClick:()=>o(L(e,-1)),children:["< ",S]}),t.jsx("h2",{className:"tt-title",children:_(g)}),t.jsxs("button",{className:"tt-nav",onClick:()=>o(L(e,1)),children:[k," >"]})]}),t.jsxs("div",{className:"tt-grid-outer",ref:v,children:[t.jsx("div",{className:"tt-times",children:P.map(s=>t.jsx("div",{className:"tt-time-cell",children:s},s))}),t.jsx("div",{className:"tt-days-grid",children:M.map((s,a)=>{const r=s.toDateString()===new Date().toDateString(),h=n.filter(c=>c.dayIndex===a),p=new Date,b=p.getHours()+p.getMinutes()/60,R=r&&b>=m&&b<=N,I=j(b);return t.jsxs("div",{className:`tt-day-col${r?" tt-today-col":""}`,children:[t.jsx("div",{className:`tt-day-head${r?" today":""}`,children:F(s)}),t.jsxs("div",{className:"tt-events-area",onClick:c=>A(a,c),children:[P.map((c,w)=>t.jsx("div",{className:"tt-hour-line",style:{top:w*x}},w)),R&&t.jsx("div",{className:"tt-now-line",style:{top:I},children:t.jsx("div",{className:"tt-now-dot"})}),h.map(c=>{const w=j(c.startHour),U=c.duration*x;return t.jsx("div",{className:"ev-pill",children:t.jsx(B,{ev:c,topPx:w,heightPx:U,onClick:()=>i({event:c})})},c.id)})]})]},a)})})]}),t.jsx("button",{className:"tt-add-btn",onClick:()=>i({event:{}}),children:"+"})]}),l&&t.jsx(V,{event:l.event,onSave:D,onDelete:y,onClose:()=>i(null)})]})}function at(){return t.jsx(W,{title:"Timetable",subtitle:"Your weekly class schedule",children:t.jsx("div",{style:{maxWidth:"1200px",width:"100%"},children:t.jsx(K,{})})})}export{at as default};
