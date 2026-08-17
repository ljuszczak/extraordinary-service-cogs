
const cfg=window.COG_CONFIG;
const photo=document.getElementById('photo'),preview=document.getElementById('preview'),placeholder=document.getElementById('placeholder'),submit=document.getElementById('submit'),statusEl=document.getElementById('status');
let processedBlob=null,processedDataUrl=null;

function stat(t,ok=true){
  statusEl.textContent=t;statusEl.classList.remove('hidden');
  statusEl.style.background=ok?'#eef5ee':'#fff0f0';
}
function blobToDataURL(b){return new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}

async function processImage(file){
  const bitmap=await createImageBitmap(file);
  const side=Math.min(bitmap.width,bitmap.height);
  // Center crop to square. The printable sheet is designed to keep artwork centered.
  const sx=Math.round((bitmap.width-side)/2);
  const sy=Math.round((bitmap.height-side)/2);
  const target=900;
  const canvas=document.createElement('canvas');
  canvas.width=target;canvas.height=target;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(bitmap,sx,sy,side,side,0,0,target,target);
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.80));
}

photo.addEventListener('change',async()=>{
  if(!photo.files[0])return;
  statusEl.classList.add('hidden');
  try{
    processedBlob=await processImage(photo.files[0]);
    processedDataUrl=await blobToDataURL(processedBlob);
    preview.style.backgroundImage=`url("${processedDataUrl}")`;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    submit.disabled=false;
  }catch(e){
    console.error(e);stat('We could not process that photo. Please retake it.',false);
  }
});

document.getElementById('clear').onclick=()=>{
  photo.value='';processedBlob=null;processedDataUrl=null;submit.disabled=true;
  preview.classList.add('hidden');placeholder.classList.remove('hidden');statusEl.classList.add('hidden');
};

submit.onclick=async()=>{
  if(!processedBlob)return;
  submit.disabled=true;stat('Submitting...');
  const name=document.getElementById('name').value.trim();
  try{
    if(cfg.DEMO_MODE){
      let a=JSON.parse(localStorage.getItem('cog_demo_submissions')||'[]');
      a.push({id:crypto.randomUUID(),participant_name:name,image_data:processedDataUrl,created_at:new Date().toISOString()});
      localStorage.setItem('cog_demo_submissions',JSON.stringify(a.slice(-cfg.MAX_COGS)));
      stat('Your cog was added to the demo collection!');
    }else{
      const client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const id=crypto.randomUUID(),path=`event/${id}.jpg`;
      const up=await client.storage.from('cogs').upload(path,processedBlob,{contentType:'image/jpeg',upsert:false});
      if(up.error)throw up.error;
      const ins=await client.from('submissions').insert({id,participant_name:name,image_path:path});
      if(ins.error)throw ins.error;
      stat('Your cog has been submitted! Watch for it in the final reveal.');
    }
    photo.value='';processedBlob=null;submit.disabled=true;
  }catch(e){
    console.error(e);stat('The upload did not complete. Please try again.',false);submit.disabled=false;
  }
};
