
const cfg=window.COG_CONFIG;let positions=[],subs=[],built=false;const gears=document.getElementById('gears'),count=document.getElementById('count');
async function init(){positions=await(await fetch('positions.json')).json();await load()}
async function load(){if(cfg.DEMO_MODE){subs=JSON.parse(localStorage.getItem('cog_demo_submissions')||'[]').slice(0,75)}
else{const c=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY),q=await c.from('submissions').select('id,participant_name,image_path,created_at').order('created_at',{ascending:true}).limit(75);if(q.error)throw q.error;subs=[];for(const s of q.data){const u=c.storage.from('cogs').getPublicUrl(s.image_path);subs.push({...s,image_data:u.data.publicUrl})}}
count.textContent=subs.length}
function gear(s,p){const e=document.createElement('div');e.className=`gear ${p.direction}`;e.style.left=p.x+'%';e.style.top=p.y+'%';e.style.setProperty('--size',p.size+'vw');e.style.setProperty('--duration',p.duration+'s');e.style.backgroundImage=`url("${s.image_data}")`;gears.appendChild(e);return e}
function build(){if(built)return;built=true;gears.innerHTML='';const ord=positions.slice().sort((a,b)=>a.ring-b.ring||a.id-b.id),els=subs.slice(0,75).map((s,i)=>gear(s,ord[i]));els.forEach((e,i)=>setTimeout(()=>{e.classList.add('ready');setTimeout(()=>e.classList.add('spinning'),330)},i*135))}
function reset(){built=false;gears.innerHTML='';document.getElementById('reveal').classList.remove('show')}
function demo(){const colors=['#d8a441','#2d6f8e','#7c9b62','#a85d4d','#6c5b8d','#d6c06c','#4e7b77','#b8783d'],words=['LISTEN','CONNECT','FOLLOW UP','WELCOME','CLARIFY','SUPPORT','RESPOND','CARE'];subs=[];
for(let i=0;i<75;i++){const c=document.createElement('canvas');c.width=300;c.height=300;const x=c.getContext('2d');x.fillStyle=colors[i%colors.length];x.fillRect(0,0,300,300);x.fillStyle='rgba(255,255,255,.9)';x.font='bold 22px Arial';x.textAlign='center';x.fillText(words[i%words.length],150,155);subs.push({image_data:c.toDataURL('image/jpeg',.8)})}count.textContent=75;reset()}
document.getElementById('refresh').onclick=load;document.getElementById('demo').onclick=demo;document.getElementById('build').onclick=build;document.getElementById('reset').onclick=reset;document.getElementById('message').onclick=()=>document.getElementById('reveal').classList.add('show');init();
