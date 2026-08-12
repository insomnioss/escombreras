const users = [
  { id: 1, name: 'Sofía Rojas', email: 'admin@escombreras.cl', company: 'Escombreras', role: 'admin', active: true, initials: 'SR', last: 'Hoy, 09:12' },
  { id: 2, name: 'Camila Morales', email: 'camila@maipo.cl', company: 'Constructora Maipo', role: 'constructor', active: true, initials: 'CM', last: 'Hoy, 08:40' },
  { id: 3, name: 'Rodrigo Silva', email: 'operaciones@ecocentro.cl', company: 'EcoCentro San Bernardo', role: 'site', active: true, initials: 'RS', last: 'Ayer, 18:22' },
  { id: 4, name: 'Andrea Pérez', email: 'andrea@andina.cl', company: 'Constructora Andina', role: 'constructor', active: false, initials: 'AP', last: '05 ago. 2026' }
];
const supabaseClient = window.supabase?.createClient(window.ESCOMBRERAS_SUPABASE_URL, window.ESCOMBRERAS_SUPABASE_ANON_KEY);
const sites = [
  {id:1,name:'EcoCentro San Bernardo',region:'Metropolitana',commune:'San Bernardo',status:'open',statusText:'Abierta',distance:'4,2 km',capacity:17500,occupation:65,materials:['Tierra','Escombros','Hormigón'],hours:'Lun–Vie 08:00–18:00'},
  {id:2,name:'Áridos del Maipo',region:'Metropolitana',commune:'Maipú',status:'limited',statusText:'Capacidad limitada',distance:'7,8 km',capacity:6200,occupation:84,materials:['Tierra','Rocas','Material vegetal'],hours:'Lun–Sáb 07:30–17:30'},
  {id:3,name:'Planta Norte Circular',region:'Metropolitana',commune:'Quilicura',status:'open',statusText:'Abierta',distance:'11,4 km',capacity:28100,occupation:42,materials:['Escombros','Hormigón','Asfalto'],hours:'Lun–Vie 08:00–19:00'},
  {id:4,name:'Recupera Pudahuel',region:'Metropolitana',commune:'Pudahuel',status:'open',statusText:'Abierta',distance:'14,6 km',capacity:9100,occupation:72,materials:['Tierra','Escombros','Asfalto'],hours:'Lun–Vie 08:00–18:00'}
];
const works=[{name:'Edificio Vértice',code:'OB-2026-014',place:'Las Condes, Metropolitana',status:'En ejecución',date:'Inicio: 10 jun. 2026'},{name:'Condominio Alto Maipo',code:'OB-2026-011',place:'Puente Alto, Metropolitana',status:'En ejecución',date:'Inicio: 03 abr. 2026'},{name:'Remodelación Parque Sur',code:'OB-2026-008',place:'San Bernardo, Metropolitana',status:'En ejecución',date:'Inicio: 17 mar. 2026'},{name:'Centro Logístico Norte',code:'OB-2025-097',place:'Quilicura, Metropolitana',status:'En cierre',date:'Inicio: 02 dic. 2025'}];
let requests=[{site:'EcoCentro San Bernardo',work:'Edificio Vértice',material:'Escombros',amount:180,date:'15 ago. 2026',status:'Pendiente',cls:'pending'},{site:'Áridos del Maipo',work:'Condominio Alto Maipo',material:'Tierra',amount:350,date:'14 ago. 2026',status:'Aceptada',cls:'accepted'},{site:'Planta Norte Circular',work:'Centro Logístico Norte',material:'Hormigón',amount:90,date:'08 ago. 2026',status:'Completada',cls:'open'}];
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const roleLabel = {admin:'Administrador',constructor:'Constructora',site:'Escombrera'};
let session = null;
function tag(status, cls){ return `<span class="tag ${cls}">${status}</span>`; }
function toast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }
function renderRequests(){
  $('#recentRequests').innerHTML=requests.slice(0,3).map(r=>`<div class="request-row"><div class="site-icon">▣</div><div><strong>${r.site}</strong><p>${r.work} · ${r.material} · ${r.amount} m³</p></div>${tag(r.status,r.cls)}</div>`).join('');
  $('#requestTable').innerHTML=requests.map(r=>`<tr><td><strong>${r.site}</strong></td><td>${r.work}</td><td>${r.material}</td><td>${r.amount} m³</td><td>${r.date}</td><td>${tag(r.status,r.cls)}</td><td>⋮</td></tr>`).join('');
  const n=requests.filter(r=>r.cls==='pending').length; const badge=$('#pendingBadge'), metric=$('#pendingMetric'); if(badge) badge.textContent=n; if(metric) metric.textContent=n;
}
function renderNearby(){ $('#nearbyList').innerHTML=sites.slice(0,3).map(s=>`<div class="nearby"><div class="site-icon">▣</div><div><strong>${s.name}</strong><p>${tag(s.statusText,s.status)} · ${s.capacity.toLocaleString('es-CL')} m³ disponibles</p></div><span class="distance">${s.distance}</span></div>`).join(''); }
function renderWorks(){ $('#worksGrid').innerHTML=works.map(w=>`<article class="panel work-card">${tag(w.status,'open')}<h3>${w.name}</h3><p>${w.code}</p><div class="work-foot"><span>⌖ ${w.place}</span><span>${w.date}</span></div></article>`).join(''); }
function renderSites(){
  const region=$('#regionFilter').value, commune=$('#communeFilter').value, material=$('#materialFilter').value, status=$('#statusFilter').value, min=+$('#capacityFilter').value;
  const filtered=sites.filter(s=>(!region||s.region===region)&&(!commune||s.commune===commune)&&(!material||s.materials.includes(material))&&(!status||s.status===status)&&s.capacity>=min);
  $('#resultsCount').textContent=filtered.length;
  $('#searchResults').innerHTML=filtered.length?filtered.map(s=>`<article class="result-card" data-site="${s.id}"><div><div class="site-name"><h3>${s.name}</h3>${tag(s.statusText,s.status)}</div><p class="site-meta">⌖ ${s.commune}, ${s.region} · ${s.distance} desde tu obra</p><div class="materials">${s.materials.map(x=>`<span class="material">${x}</span>`).join('')}</div></div><div class="capacity"><strong>${s.capacity.toLocaleString('es-CL')} m³</strong><small>capacidad disponible · ${s.hours}</small><div class="progress"><i style="width:${s.occupation}%"></i></div></div></article>`).join(''):'<section class="empty-state panel"><div>⌕</div><h2>No encontramos resultados</h2><p>Prueba ajustando los filtros de búsqueda.</p></section>';
}
function renderUsers(){
  $('#usersTable').innerHTML=users.map(u=>`<tr><td><strong>${u.name}</strong><br><small>${u.email}</small></td><td>${u.company}</td><td><select class="user-role-select" data-user-role="${u.id}"><option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option><option value="constructor" ${u.role==='constructor'?'selected':''}>Constructora</option><option value="site" ${u.role==='site'?'selected':''}>Escombrera</option></select></td><td>${tag(u.active?'Activa':'Suspendida',u.active?'open':'rejected')}</td><td>${u.last}</td><td><button class="admin-action ${u.active?'suspend':''}" data-user-toggle="${u.id}">${u.active?'Suspender':'Activar'}</button></td></tr>`).join('');
}
async function loadAdminUsers(){
  const {data, error} = await supabaseClient.from('profiles').select('id, full_name, email, company_name, role, active, created_at').order('created_at', {ascending:false});
  if(error){ toast('No fue posible cargar usuarios: '+error.message); return; }
  users.splice(0,users.length,...data.map(u=>({id:u.id,name:u.full_name,email:u.email,company:u.company_name||'Sin empresa',role:u.role,active:u.active,initials:u.full_name.split(' ').map(x=>x[0]).join('').slice(0,2),last:new Date(u.created_at).toLocaleDateString('es-CL')})));
  renderUsers();
}
function renderSiteRequests(){
  $('#siteRequestTable').innerHTML=requests.map((r,i)=>`<tr><td><strong>Constructora Maipo</strong></td><td>${r.work}</td><td>${r.material}</td><td>${r.amount} m³</td><td>${r.date}</td><td>${tag(r.status,r.cls)}</td><td>${r.cls==='pending'?`<button class="admin-action" data-decision="${i}:accepted">Aceptar</button> <button class="admin-action suspend" data-decision="${i}:rejected">Rechazar</button>`:'—'}</td></tr>`).join('');
}
function makeNav(role){
  const nav=$('#mainNav');
  const menus={
    constructor:[['dashboard','◫','Resumen'],['works','⌑','Mis obras'],['search','⌕','Buscar escombreras'],['requests','↗','Solicitudes'],['history','◷','Historial']],
    site:[['dashboard','◫','Resumen'],['siteRequests','↗','Solicitudes recibidas'],['history','◷','Historial']],
    admin:[['dashboard','◫','Resumen general'],['adminUsers','♙','Usuarios y roles'],['works','⌑','Obras'],['requests','↗','Solicitudes'],['history','◷','Actividad']]
  };
  nav.innerHTML=menus[role].map((m,i)=>`<button class="nav-item ${i===0?'active':''}" data-view="${m[0]}"><span>${m[1]}</span> ${m[2]}</button>`).join('');
  $$('.nav-item[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
}
function roleDashboard(){
  const dashboard=$('#dashboard');
  if(session.role==='constructor') { dashboard.innerHTML=`<div class="page-heading"><div><p class="eyebrow">MIÉRCOLES, 12 DE AGOSTO</p><h1>Buenos días, Camila.</h1><p class="intro">Aquí tienes el estado de tus operaciones hoy.</p></div><button class="primary" data-action="newRequest">+ Nueva solicitud</button></div><div class="metric-grid"><article class="metric"><div class="metric-icon blue">⌑</div><span>Obras activas</span><strong>4</strong><small class="up">↑ 1 este mes</small></article><article class="metric"><div class="metric-icon amber">↗</div><span>Solicitudes pendientes</span><strong id="pendingMetric">2</strong><small>Requieren seguimiento</small></article><article class="metric"><div class="metric-icon green">◉</div><span>Escombreras disponibles</span><strong>12</strong><small class="up">↑ 3 cercanas a tus obras</small></article><article class="metric"><div class="metric-icon purple">▥</div><span>Disposición este mes</span><strong>1.240 <small>m³</small></strong><small>En 38 viajes registrados</small></article></div><div class="content-grid"><section class="panel"><div class="panel-title"><div><h2>Solicitudes recientes</h2><p>Revisa el avance de tus disposiciones.</p></div><button class="link-button" data-view-link="requests">Ver todas →</button></div><div id="recentRequests"></div></section><section class="panel"><div class="panel-title"><div><h2>Disponibilidad cerca de ti</h2><p>Escombreras a menos de 15 km.</p></div><button class="link-button" data-view-link="search">Explorar →</button></div><div id="nearbyList"></div></section></div>`; renderRequests(); renderNearby(); }
  if(session.role==='site') dashboard.innerHTML=`<div class="page-heading"><div><p class="eyebrow">ECOCENTRO SAN BERNARDO</p><h1>Operación de hoy</h1><p class="intro">Mantén actualizada tu disponibilidad para las constructoras.</p></div><button class="primary" id="siteStatus">● Abierta</button></div><div class="metric-grid"><article class="metric"><div class="metric-icon green">◉</div><span>Estado actual</span><strong>Abierta</strong><small>Visible para constructoras</small></article><article class="metric"><div class="metric-icon blue">▥</div><span>Capacidad disponible</span><strong>17.500 <small>m³</small></strong><small>65% de ocupación</small></article><article class="metric"><div class="metric-icon amber">↗</div><span>Solicitudes pendientes</span><strong>1</strong><small>Requieren decisión</small></article><article class="metric"><div class="metric-icon purple">▣</div><span>Recepciones este mes</span><strong>38</strong><small>1.240 m³ recibidos</small></article></div><section class="panel"><div class="panel-title"><div><h2>Próximas solicitudes</h2><p>Gestiona la recepción de residuos.</p></div><button class="link-button" data-view-link="siteRequests">Ver solicitudes →</button></div><div id="recentRequests"></div></section>`; renderRequests(); }
  if(session.role==='admin') dashboard.innerHTML=`<div class="page-heading"><div><p class="eyebrow">ADMINISTRACIÓN DE PLATAFORMA</p><h1>Visión general</h1><p class="intro">Supervisa usuarios, empresas y la actividad de Escombreras.</p></div><button class="primary" data-view-link="adminUsers">Gestionar usuarios</button></div><div class="metric-grid"><article class="metric"><div class="metric-icon blue">♙</div><span>Usuarios registrados</span><strong>${users.length}</strong><small>3 cuentas activas</small></article><article class="metric"><div class="metric-icon green">▣</div><span>Constructoras</span><strong>2</strong><small>1 en revisión</small></article><article class="metric"><div class="metric-icon purple">⌖</div><span>Escombreras</span><strong>4</strong><small>3 disponibles ahora</small></article><article class="metric"><div class="metric-icon amber">↗</div><span>Solicitudes activas</span><strong>${requests.length}</strong><small>1 requiere atención</small></article></div><section class="panel"><div class="panel-title"><div><h2>Acciones de administración</h2><p>Controla el acceso y los permisos de cada organización.</p></div></div><div class="request-row"><div class="site-icon">♙</div><div><strong>Gestión de usuarios</strong><p>Asigna roles, activa o suspende cuentas y revisa empresas.</p></div><button class="primary" data-view-link="adminUsers">Abrir</button></div></section>`;
  $$('[data-view-link]').forEach(b=>b.onclick=()=>showView(b.dataset.viewLink));
}
function openModal(siteId){ $('#requestSite').innerHTML=sites.map(s=>`<option value="${s.id}" ${+siteId===s.id?'selected':''}>${s.name}</option>`).join(''); $('#requestWork').innerHTML=works.map(w=>`<option>${w.name}</option>`).join(''); $('#modal').classList.add('show'); }
function showView(id){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id)); $$('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  $('#pageLabel').textContent={dashboard:'Resumen',works:'Obras',search:'Buscar escombreras',requests:'Solicitudes',history:'Historial',adminUsers:'Usuarios y roles',siteRequests:'Solicitudes recibidas'}[id];
  if(id==='adminUsers')loadAdminUsers(); if(id==='siteRequests')renderSiteRequests(); window.scrollTo(0,0); $('.sidebar').classList.remove('open');
}
function boot(user){
  session=user; $('#authScreen').hidden=true; $('#appShell').hidden=false;
  $('#roleName').textContent=`PANEL ${roleLabel[user.role].toUpperCase()}`; $('#sidebarInitials').textContent=user.initials; $('#topInitials').textContent=user.initials; $('#sidebarUser').textContent=user.company; $('#sidebarDetail').textContent=`${roleLabel[user.role]} · Cuenta ${user.active?'activa':'suspendida'}`; $('#breadcrumb').innerHTML=`${user.company} <span>/</span> <strong id="pageLabel">Resumen</strong>`;
  makeNav(user.role); roleDashboard(); renderWorks(); renderSites(); showView('dashboard');
  $$('[data-action="newRequest"]').forEach(b=>b.onclick=()=>openModal()); $$('[data-view-link]').forEach(b=>b.onclick=()=>showView(b.dataset.viewLink));
}
async function startFromAuth(){
  const {data:{user}}=await supabaseClient.auth.getUser(); if(!user) return;
  const {data:profile,error}=await supabaseClient.from('profiles').select('*').eq('id',user.id).single();
  if(error){ $('#loginError').textContent='No se pudo leer tu perfil: '+error.message; return; }
  if(!profile.active){ await supabaseClient.auth.signOut(); $('#loginError').textContent='Tu cuenta está pendiente de activación por un administrador.'; return; }
  boot({id:profile.id,name:profile.full_name,email:profile.email,company:profile.company_name||profile.full_name,role:profile.role,active:profile.active,initials:profile.full_name.split(' ').map(x=>x[0]).join('').slice(0,2)});
}
$('#loginForm').onsubmit=async e=>{ e.preventDefault(); $('#loginError').textContent=''; const {error}=await supabaseClient.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value}); if(error){$('#loginError').textContent=error.message;return;} await startFromAuth(); };
$('#showRegister').onclick=()=>{ $('#loginForm').hidden=true; $('#registerForm').hidden=false; };
$('#showLogin').onclick=()=>{ $('#registerForm').hidden=true; $('#loginForm').hidden=false; };
$('#registerForm').onsubmit=async e=>{ e.preventDefault(); $('#registerError').textContent=''; const {error}=await supabaseClient.auth.signUp({email:$('#registerEmail').value.trim(),password:$('#registerPassword').value,options:{data:{full_name:$('#registerName').value.trim(),company_name:$('#registerCompany').value.trim()}}}); if(error){$('#registerError').textContent=error.message;return;} $('#registerForm').hidden=true;$('#loginForm').hidden=false;$('#loginError').textContent='Cuenta creada. Revisa tu correo para confirmar y espera activación del administrador.'; };
$('#logoutButton').onclick=async()=>{ await supabaseClient.auth.signOut(); session=null; $('#appShell').hidden=true; $('#authScreen').hidden=false; $('#loginPassword').value=''; $('#loginError').textContent=''; };
$('#closeModal').onclick=()=>$('#modal').classList.remove('show'); $('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').classList.remove('show');};
$('#requestForm').onsubmit=e=>{ e.preventDefault(); const s=sites.find(x=>x.id===+$('#requestSite').value); requests.unshift({site:s.name,work:$('#requestWork').value,material:$('#requestMaterial').value,amount:$('#requestAmount').value,date:'12 ago. 2026',status:'Pendiente',cls:'pending'}); $('#modal').classList.remove('show'); toast('Solicitud enviada correctamente'); roleDashboard(); showView('requests'); };
['regionFilter','communeFilter','materialFilter','statusFilter','capacityFilter'].forEach(id=>$('#'+id).oninput=()=>{const n=+$('#capacityFilter').value; $('#capacityOutput').textContent=n?`${n.toLocaleString('es-CL')} m³`:'Sin mínimo'; renderSites();});
$('#clearFilters').onclick=()=>{ $$('#search select').forEach(x=>x.value=''); $('#capacityFilter').value=0; $('#capacityOutput').textContent='Sin mínimo'; renderSites(); };
$('#searchResults').onclick=e=>{ const card=e.target.closest('.result-card'); if(card)openModal(card.dataset.site); };
$('#addWork').onclick=()=>toast('Registro de obras: próximo módulo del MVP'); $('.mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
document.addEventListener('change',async e=>{ if(e.target.matches('[data-user-role]')) { const u=users.find(x=>x.id===e.target.dataset.userRole); const {error}=await supabaseClient.rpc('admin_update_user',{target_id:u.id,new_role:e.target.value,is_active:u.active}); if(error){toast(error.message);loadAdminUsers();return;} toast(`Rol de ${u.name} actualizado a ${roleLabel[e.target.value]}`); loadAdminUsers(); } });
document.addEventListener('click',async e=>{ const toggle=e.target.closest('[data-user-toggle]'), decision=e.target.closest('[data-decision]'); if(toggle){ const u=users.find(x=>x.id===toggle.dataset.userToggle); const {error}=await supabaseClient.rpc('admin_update_user',{target_id:u.id,new_role:u.role,is_active:!u.active}); if(error){toast(error.message);return;} toast(`Cuenta de ${u.name} ${!u.active?'activada':'suspendida'}`); loadAdminUsers(); } if(decision){ const [index,state]=decision.dataset.decision.split(':'); requests[index].status=state==='accepted'?'Aceptada':'Rechazada'; requests[index].cls=state; renderSiteRequests(); toast(`Solicitud ${state==='accepted'?'aceptada':'rechazada'}`); } });
supabaseClient.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT'){session=null;$('#appShell').hidden=true;$('#authScreen').hidden=false;} });
startFromAuth();
