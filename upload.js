
const cfg = window.COG_CONFIG;
const photo = document.getElementById('photo');
const preview = document.getElementById('preview');
const placeholder = document.getElementById('placeholder');
const submit = document.getElementById('submit');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');
let processedBlob = null;
let processedDataUrl = null;

function status(msg, good=true){
  statusEl.textContent = msg;
  statusEl.classList.remove('hidden');
  statusEl.style.background = good ? '#eef5ee' : '#fff0f0';
}
async function resizeImage(file){
  const bitmap = await createImageBitmap(file);
  const max = 900;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(bitmap,0,0,w,h);
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.78));
}
function blobToDataURL(blob){
  return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob);});
}
photo.addEventListener('change', async ()=>{
  if(!photo.files[0]) return;
  statusEl.classList.add('hidden');
  try{
    processedBlob = await resizeImage(photo.files[0]);
    processedDataUrl = await blobToDataURL(processedBlob);
    preview.style.setProperty('--art',`url("${processedDataUrl}")`);
    preview.classList.remove('hidden'); placeholder.classList.add('hidden');
    submit.disabled=false;
  }catch(e){status('Could not process that photo. Please try again.',false);}
});
clearBtn.addEventListener('click',()=>{
  photo.value=''; processedBlob=null; processedDataUrl=null; submit.disabled=true;
  preview.classList.add('hidden'); placeholder.classList.remove('hidden'); statusEl.classList.add('hidden');
});
submit.addEventListener('click', async ()=>{
  if(!processedBlob) return;
  submit.disabled=true; status('Submitting…');
  const participant_name=document.getElementById('name').value.trim();
  try{
    if(cfg.DEMO_MODE){
      const entries=JSON.parse(localStorage.getItem('cog_demo_submissions')||'[]');
      entries.push({id:crypto.randomUUID(),participant_name,image_data:processedDataUrl,created_at:new Date().toISOString()});
      localStorage.setItem('cog_demo_submissions',JSON.stringify(entries.slice(-cfg.MAX_COGS)));
      status('Your cog was added to this browser’s demo collection!');
    }else{
      const client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const id=crypto.randomUUID();
      const path=`event/${id}.jpg`;
      const {error:uploadError}=await client.storage.from('cogs').upload(path,processedBlob,{contentType:'image/jpeg',upsert:false});
      if(uploadError) throw uploadError;
      const {error:insertError}=await client.from('submissions').insert({id,participant_name,image_path:path});
      if(insertError) throw insertError;
      status('Your cog has been submitted! Watch for the final reveal.');
    }
    photo.value=''; processedBlob=null; submit.disabled=true;
  }catch(e){
    console.error(e); status('The upload did not complete. Please try again.',false); submit.disabled=false;
  }
});
