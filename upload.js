
const cfg=window.COG_CONFIG;
const photo=document.getElementById('photo'),preview=document.getElementById('preview'),placeholder=document.getElementById('placeholder'),submit=document.getElementById('submit'),statusEl=document.getElementById('status');
let processedBlob=null,processedDataUrl=null;
function stat(t,ok=true){statusEl.textContent=t;statusEl.classList.remove('hidden');statusEl.style.background=ok?'#eef5ee':'#fff0f0'}
function blobToDataURL(b){return new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}
async function processImage(file){
  const bitmap=await createImageBitmap(file);
  const side=Math.min(bitmap.width,bitmap.height);
  // Use center square, then trim 6% from each edge. The sheet's square frame is designed for this.
  const inner=Math.round(side*.88);
  const sx=Math.round((bitmap.width-inner)/2);
  const sy=Math.round((bitmap.height-inner)/2);
  const target=900;
  const c=document.createElement('canvas');c.width=target;c.height=target;
  const x=c.getContext('2d');x.imageSmoothingQuality='high';
  x.drawImage(bitmap,sx,sy,inner,inner,0,0,target,target);
  return await new Promise(r=>c.toBlob(r,'image/jpeg',.82));
}
photo.onchange=async()=>{if(!photo.files[0])return;try{processedBlob=await processImage(photo.files[0]);processedDataUrl=await blobToDataURL(processedBlob);preview.style.backgroundImage=`url("${processedDataUrl}")`;preview.classList.remove('hidden');placeholder.classList.add('hidden');submit.disabled=false}catch(e){console.error(e);stat('Please retake that photo.',false)}}
document.getElementById('clear').onclick=()=>{photo.value='';processedBlob=null;processedDataUrl=null;submit.disabled=true;preview.classList.add('hidden');placeholder.classList.remove('hidden');statusEl.classList.add('hidden')}
submit.onclick=async()=>{if(!processedBlob)return;submit.disabled=true;stat('Submitting...');
const name=document.getElementById('name').value.trim();
try{const client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY),id=crypto.randomUUID(),path=`event/${id}.jpg`;
const up=await client.storage.from('cogs').upload(path,processedBlob,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
const ins=await client.from('submissions').insert({id,participant_name:name,image_path:path});if(ins.error)throw ins.error;
stat('Your cog has been submitted!');photo.value='';processedBlob=null;submit.disabled=true}
catch(e){console.error(e);stat('The upload did not complete. Please try again.',false);submit.disabled=false}}
