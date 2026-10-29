(function(root){
'use strict';
const labels={explain:'말을 쉽게',where:'놓을 곳 보기',check:'맞는지 확인',human:'사람에게 도움'};
const safety=/피가\s*(나|났)|출혈|다쳤|다쳐|화상|불꽃|연기가|타는\s*냄새|탄\s*냄새|감전|약을|약물|칼로|칼을|죽고|자해/;
const outside=/날씨|점심|저녁|메뉴|주식|은행|대출|이자|금리|계좌|비밀번호|암호|관리자|프롬프트|시스템 지시|여행|유튜브|영화|노래|정류장|버스|지하철|이메일|병원|번역|영어|중국어|일본어|수학|코드|로그인|택배/;
let cachedModel=null,cachedLookup=null;
const clue={explain:/뜻|의미|설명|어렵|쉬운|쉽게|낱말|문구/,where:/어디|위치|장소|어느 칸|어느 상자|놓|둘 자리/,check:/맞|확인|제대로|틀|실수|빠진|수량/,human:/사람|담당|선생|동료|도와|도움|혼자|없|모자|쉬고|쉴|멈|중단|힘드/};
function normalize(s){return s.normalize('NFC').toLowerCase().replace(/\s+/g,' ').trim()}
function grams(s){const a=[];for(const n of [2,3])for(let i=0;i<=s.length-n;i++)a.push(s.slice(i,i+n));return a}
function baseline(text){const s=normalize(text);for(const k of ['human','where','check','explain'])if(clue[k].test(s))return k;return 'unknown'}
function precheck(text){
 if(typeof text!=='string'||text.length>120)return {kind:'unknown',reason:'input'};
 const s=normalize(text);
 if(safety.test(s))return {kind:'safety',reason:'safety_rule'};
 if(outside.test(s))return {kind:'unknown',reason:'outside_task'};
 if(/고마|감사/.test(s)&&!/(주세요|줄래|줘|어디|어느|무슨|몰라|모르|어렵|도움|맞나|맞는지)/.test(s))return {kind:'unknown',reason:'no_help_request'};
 if(/취소|철회|요청을\s*거두/.test(s))return {kind:'unknown',reason:'cancelled_request'};
 if(/(?:해\s*달라|부탁|요청).{0,12}(?:아니|않)/.test(s))return {kind:'unknown',reason:'negated_request'};
 if(s.length<3||!/[가-힣]/.test(s))return {kind:'unknown',reason:'input'};
 if(/^(말|글|문장|설명|단어)\s*(어렵|어려워|어려워요|어려움|어려버|어려버요)[.!?]*$/.test(s))return {kind:'explain',reason:'explicit_short_request'};
 const hints=Object.keys(clue).filter(k=>clue[k].test(s));
 if(hints.length>1&&/도.+도|그리고|동시에|이고|어렵고|모르고|둘\s*다|모두|각각/.test(s))return {kind:'ambiguous',reason:'multiple_intents'};
 return null;
}
function guardedBaseline(text){return precheck(text)||{kind:baseline(text),reason:'keyword_baseline'}}
function classify(text, model=root.HELP_MODEL){
 const guarded=precheck(text);if(guarded)return guarded;
 if(!model)return {kind:'unknown',reason:'model_unavailable'};
 const s=normalize(text);
 if(cachedModel!==model){cachedModel=model;cachedLookup=new Map(model.vocab.map((g,i)=>[g,i]));}
 const gs=grams(s),lookup=cachedLookup,x=new Map();let known=0;
 for(const g of gs){const i=lookup.get(g);if(i!==undefined){x.set(i,(x.get(i)||0)+1);known++}}
 if(known/Math.max(gs.length,1)<model.minimum_known_fraction)return {kind:'unknown',reason:'unfamiliar'};
 let norm=0;for(const[i,v]of x){const n=v*model.idf[i];x.set(i,n);norm+=n*n}norm=Math.sqrt(norm)||1;
 const logits=model.bias.slice();for(const[i,v]of x)for(let k=0;k<logits.length;k++)logits[k]+=v/norm*model.weights[i][k];
 const mx=Math.max(...logits),ex=logits.map(v=>Math.exp(v-mx)),sum=ex.reduce((a,b)=>a+b,0),ps=ex.map(v=>v/sum),order=ps.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]);
 const conf=order[0][0],margin=conf-order[1][0],suggested=model.classes[order[0][1]];
 if(conf<model.threshold||margin<model.margin)return{kind:'unknown',reason:'low_confidence',suggested,confidence:conf,margin};
 return {kind:suggested,reason:'learned_model',confidence:conf,margin};
}
function nextState(state,event){
 const n={...state};
 if(event==='confirm')n.checked=true;
 if(event==='unconfirm')n.checked=false;
 if(event==='next'&&n.checked&&!n.paused&&n.step<5){n.step++;n.checked=false;n.help=null}
 if(event==='previous'&&n.step>0){n.step--;n.checked=false;n.help=null}
 if(event==='pause')n.paused=true;
 if(event==='resume')n.paused=false;
 if(event==='restart')return{step:0,checked:false,paused:false,help:null};
 return n;
}
root.OneStep={classify,baseline,guardedBaseline,precheck,labels,nextState,normalize};
if(typeof module!=='undefined')module.exports=root.OneStep;
})(globalThis);
