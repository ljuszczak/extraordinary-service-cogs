
const cfg=window.COG_CONFIG;
let positions=[], submissions=[], built=false;
const gears=document.getElementById('gears');
const count=document.getElementById('count');

async function init(){
  positions=await (await fetch('positions.json')).json();
  await loadSubmissions();
}
async function loadSubmissions(){
  try{
    if(cfg.DEMO_MODE){
      submissions=JSON.parse(localStorage.getItem('cog_demo_submissions')||'[]').slice(0,cfg.MAX_COGS);
    }else{
      const client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const {data,error}=await client.from('submissions').select('id,participant_name,image_path,created_at').order('created_at',{ascending:true}).limit(cfg.MAX_COGS);
      if(error) throw error;
      submissions=[];
      for(const s of data){
        const {data:urlData}=client.storage.from('cogs').getPublicUrl(s.image_path);
        submissions.push({...s,image_data:urlData.publicUrl});
      }
    }
    count.textContent=submissions.length;
  }catch(e){console.error(e); count.textContent='?';}
}
function makeGear(sub,p,i){
  const el=document.createElement('div');
  el.className=`gear ${p.direction}`;
  el.style.left=p.x+'%'; el.style.top=p.y+'%';
  el.style.setProperty('--size',p.size+'vw');
  el.style.setProperty('--duration',p.duration+'s');
  el.style.setProperty('--art',`url("${sub.image_data}")`);
  gears.appendChild(el); return el;
}
async function build(){
  if(built) return;
  built=true; document.getElementById('reveal').classList.remove('show');
  gears.innerHTML='';
  const els=submissions.slice(0,positions.length).map((s,i)=>makeGear(s,positions[i],i));
  // staged but fast: max about 9 seconds for 75
  els.forEach((el,i)=>setTimeout(()=>{
    el.classList.add('ready');
    setTimeout(()=>el.classList.add('spinning'),420);
  }, i*110));
}
function resetScreen(){built=false;gears.innerHTML='';document.getElementById('reveal').classList.remove('show');}
function loadDemo(){
  const samples=[];
  const palette=['#d8a441','#2d6f8e','#7c9b62','#a85d4d','#6c5b8d','#d6c06c'];
  for(let i=0;i<Math.min(75,cfg.MAX_COGS);i++){
    const c=document.createElement('canvas');c.width=300;c.height=300;const x=c.getContext('2d');
    x.fillStyle=palette[i%palette.length];x.fillRect(0,0,300,300);
    x.fillStyle='rgba(255,255,255,.55)';x.font='bold 24px Arial';x.textAlign='center';
    x.fillText(['LISTEN','CONNECT','FOLLOW UP','WELCOME','CLARIFY','SUPPORT'][i%6],150,155);
    samples.push({id:String(i),participant_name:'',image_data:c.toDataURL('image/jpeg',.8)});
  }
  submissions=samples;count.textContent=submissions.length;resetScreen();
}
document.getElementById('refresh').onclick=loadSubmissions;
document.getElementById('build').onclick=build;
document.getElementById('reset').onclick=resetScreen;
document.getElementById('demo').onclick=loadDemo;
document.getElementById('message').onclick=()=>document.getElementById('reveal').classList.add('show');
init();
