
const cfg=window.COG_CONFIG;
let positions=[],subs=[],built=false,client=null,subscription=null,usedIds=new Set();
const gears=document.getElementById('gears'),
      count=document.getElementById('count'),
      toolbar=document.getElementById('toolbar'),
      badge=document.getElementById('readyBadge');
const key='extraordinary_cogs_event_start';

async function init(){
  positions=await(await fetch('positions.json')).json();
  if(!localStorage.getItem(key)) localStorage.setItem(key,'1970-01-01T00:00:00.000Z');
  client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  await load();
  startRealtime();
}

async function load(){
  const cutoff=localStorage.getItem(key);
  const q=await client.from('submissions')
    .select('id,participant_name,image_path,created_at')
    .gte('created_at',cutoff)
    .order('created_at',{ascending:true})
    .limit(75);

  if(q.error){
    console.error(q.error);
    count.textContent='?';
    return;
  }

  subs=[];
  for(const s of q.data){
    const u=client.storage.from('cogs').getPublicUrl(s.image_path);
    subs.push({...s,image_data:u.data.publicUrl});
  }
  count.textContent=subs.length;

  // If the machine is already built, add any newly discovered submissions.
  if(built){
    for(const s of subs){
      if(!usedIds.has(s.id)) addSubmissionToMachine(s);
    }
  }
}

function make(s,p){
  const e=document.createElement('div');
  e.className=`gear ${p.direction}`;
  e.dataset.id=s.id;
  e.style.left=p.x+'%';
  e.style.top=p.y+'%';
  e.style.setProperty('--size',p.size+'vw');
  e.style.setProperty('--duration',p.duration+'s');
  e.style.backgroundImage=`url("${s.image_data}")`;
  gears.appendChild(e);
  return e;
}

function getOrderedPositions(){
  return positions.slice().sort((a,b)=>a.ring-b.ring||a.id-b.id);
}

function addSubmissionToMachine(s){
  if(usedIds.has(s.id)) return;
  const ord=getOrderedPositions();
  const index=usedIds.size;
  if(index>=ord.length) return;

  const p=ord[index];
  const e=make(s,p);
  usedIds.add(s.id);

  // Entrance animation
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      e.classList.add('ready');
      setTimeout(()=>e.classList.add('spinning'),280);
    },80);
  });
}

function build(){
  if(built) return;
  built=true;
  gears.innerHTML='';
  usedIds.clear();

  const current=subs.slice(0,75);
  current.forEach((s,i)=>{
    setTimeout(()=>addSubmissionToMachine(s),i*115);
  });
}

function reset(){
  built=false;
  gears.innerHTML='';
  usedIds.clear();
  document.getElementById('reveal').classList.remove('show');
}

function fresh(){
  if(!confirm('Start fresh now? Earlier test cogs will be hidden from this event.')) return;
  localStorage.setItem(key,new Date().toISOString());
  subs=[];
  count.textContent=0;
  reset();
}

function toggle(hide){
  toolbar.classList.toggle('hide-ui',hide);
  badge.classList.toggle('hide-ui',hide);
}

function startRealtime(){
  if(subscription){
    client.removeChannel(subscription);
  }

  const cutoff=localStorage.getItem(key);

  subscription = client
    .channel('cog-submissions-live')
    .on(
      'postgres_changes',
      {
        event:'INSERT',
        schema:'public',
        table:'submissions'
      },
      async(payload)=>{
        const s=payload.new;

        // Ignore submissions from before this event's cutoff.
        if(s.created_at && s.created_at < cutoff) return;

        // Avoid duplicates.
        if(subs.some(x=>x.id===s.id)) return;

        const u=client.storage.from('cogs').getPublicUrl(s.image_path);
        const enriched={...s,image_data:u.data.publicUrl};

        subs.push(enriched);
        subs.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
        if(subs.length>75) subs=subs.slice(0,75);

        count.textContent=subs.length;

        // If reveal is already underway, immediately add the new cog.
        if(built){
          addSubmissionToMachine(enriched);
        }
      }
    )
    .subscribe();
}

document.getElementById('fresh').onclick=()=>{
  fresh();
  startRealtime();
};
document.getElementById('refresh').onclick=load;
document.getElementById('build').onclick=build;
document.getElementById('message').onclick=()=>document.getElementById('reveal').classList.add('show');
document.getElementById('reset').onclick=reset;
document.getElementById('hide').onclick=()=>toggle(true);
document.addEventListener('keydown',e=>{
  if(e.key.toLowerCase()==='h') toggle(!toolbar.classList.contains('hide-ui'));
});

init();
