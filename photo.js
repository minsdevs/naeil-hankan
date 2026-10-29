'use strict';
(function(root){
function parseDate(text,confidence=100){
 if(typeof text!=='string'||text.length>5000||confidence<60)return {kind:'abstain',reason:'unclear'};
 const matches=[...text.matchAll(/(20\d{2})\s*(?:년|[./-])\s*(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})\s*일?/g)];
 if(matches.length!==1)return {kind:'abstain',reason:matches.length?'multiple_dates':'no_date'};
 const[,y,m,d]=matches[0].map(Number);const date=new Date(Date.UTC(y,m-1,d));
 if(date.getUTCFullYear()!==y||date.getUTCMonth()+1!==m||date.getUTCDate()!==d)return {kind:'abstain',reason:'invalid_date'};
 return {kind:'candidate',year:y,month:m,day:d,bin:m===10?'이번 달':'다른 달'};
}
root.OneStepPhoto={parseDate};if(typeof module!=='undefined')module.exports=root.OneStepPhoto;
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id),input=$('photo-input'),status=$('photo-status');let job=0,worker=null,candidate=null;
async function dispose(){const w=worker;worker=null;if(w)try{await w.terminate()}catch{}}
function clear(){job++;dispose();candidate=null;input.value='';$('photo-preview').removeAttribute('src');$('photo-preview').hidden=true;$('photo-confirm').hidden=true;$('photo-clear').hidden=true;$('photo-result').textContent='';status.textContent='사진은 이 기기 안에서만 읽어요. JPG·PNG, 최대 3MB.';input.disabled=false}
async function recognize(file){clear();const id=job;let timer;
 if(location.protocol==='file:'){status.textContent='사진 기능은 시작.command로 연 화면에서 쓸 수 있어요. 날짜를 직접 봐도 괜찮아요.';return}
 if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>3*1024*1024){status.textContent='3MB 이하 JPG·PNG 사진 한 장을 골라 주세요.';return}
 try{
  input.disabled=true;status.textContent='이 기기에서 사진을 읽고 있어요. 잠시 기다려 주세요.';$('photo-clear').hidden=false;
  const bitmap=await createImageBitmap(file);
  if(bitmap.width*bitmap.height>12000000){bitmap.close();throw Error('large')}
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const url=canvas.toDataURL('image/png');$('photo-preview').src=url;$('photo-preview').hidden=false;
  let expire;const timeout=new Promise((_,reject)=>{expire=()=>reject(Error('timeout'));timer=setTimeout(expire,30000)});
  const process=(async()=>{const w=await Tesseract.createWorker(['kor','eng'],1,{workerPath:new URL('vendor/worker.min.js',location.href).href,corePath:new URL('vendor/',location.href).href,langPath:new URL('vendor/lang',location.href).href,workerBlobURL:false,cacheMethod:'none',errorHandler:()=>{}});if(id!==job){await w.terminate();throw Error('cancelled')}worker=w;await w.setParameters({tessedit_pageseg_mode:'6'});return w.recognize(url)})();
  const result=await Promise.race([process,timeout]);if(id!==job)return;const parsed=parseDate(result.data.text,result.data.confidence);candidate=parsed.kind==='candidate'?parsed:null;
  if(candidate){status.textContent='AI가 읽은 월을 종이와 다시 비교해요.';$('photo-question').textContent=`AI가 ${candidate.month}월로 읽었어요. 종이에도 ${candidate.month}월이라고 적혀 있나요?`;$('photo-confirm').hidden=false;$('photo-yes').focus()}
  else{status.textContent=parsed.reason==='multiple_dates'?'날짜가 여러 개 보여요. 종이 한 장만 다시 골라 주세요.':'날짜를 확실히 읽지 못했어요. 직접 보거나 사람에게 물어봐 주세요.';$('photo-confirm').hidden=true}
 }catch(error){if(id===job){status.textContent='사진을 읽지 못했어요. 다시 골라도 되고, 직접 보거나 사람에게 물어봐도 괜찮아요.';candidate=null;job++;input.disabled=false}}
 finally{clearTimeout(timer);await dispose();if(id===job){input.disabled=false;input.value=''}}
}
input.onchange=()=>{const f=input.files[0];if(f)recognize(f)};
$('photo-yes').onclick=()=>{if(!candidate)return;$('photo-result').textContent=`직접 확인한 ${candidate.month}월 종이는 “${candidate.bin}” 칸에 넣어요. 놓은 뒤 현재 단계의 확인 버튼을 눌러요.`;$('photo-confirm').hidden=true;candidate=null};
$('photo-no').onclick=()=>{candidate=null;$('photo-confirm').hidden=true;$('photo-result').textContent='괜찮아요. 종이의 월을 직접 보고, 헷갈리면 사람에게 물어봐요. AI는 틀릴 수 있어요.'};
$('photo-clear').onclick=clear;document.addEventListener('one-step-change',clear);
})(globalThis);
