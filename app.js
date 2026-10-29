'use strict';
const STEPS=[
{title:'준비물을 함께 놓아요',instruction:'연습용 서류 6장과 이름표가 붙은 두 칸을 놓아요.',confirm:'서류 6장과 두 칸을 준비했어요',short:'준비물 확인',explain:'서류는 종이예요. 연습용 종이 6장과, 종이를 넣을 두 칸이 필요해요. 준비물이 없으면 사람에게 도움을 요청해요.',where:'책상 위에 두 칸을 나란히 놓아요. 왼쪽에는 “이번 달”, 오른쪽에는 “다른 달” 이름표를 붙여요.',check:'종이를 한 장씩 세어 6장인지 봐요. 두 칸에 이름표가 붙었는지 확인해요.',kind:'prepare'},
{title:'종이 한 장의 날짜를 봐요',instruction:'맨 위 종이 한 장을 집어, “월” 앞의 숫자를 찾아요.',confirm:'월 앞의 숫자를 찾았어요',short:'날짜 찾기',explain:'“10월”에서 10이 월이에요. 이번 연습에서는 10월을 “이번 달”로 정해요. 오늘 실제 날짜와는 관계없어요.',where:'종이 윗부분에 적힌 “2026년 10월 5일” 같은 날짜를 찾아요. 날짜가 없거나 안 보이면 사람에게 물어봐요.',check:'날짜에는 연도, 월, 일이 있어요. 지금은 “월” 바로 앞의 숫자를 보았는지 확인해요.',kind:'date'},
{title:'맞는 이름표의 칸에 넣어요',instruction:'10월이면 “이번 달”, 다른 월이면 “다른 달” 칸에 넣어요.',confirm:'이름표를 보고 한 칸에 넣었어요',short:'한 장 분류',explain:'10월 종이는 “이번 달” 칸이에요. 9월이나 11월 종이는 “다른 달” 칸이에요. 날짜가 애매하면 넣지 말고 물어봐요.',where:'왼쪽 “이번 달” 칸과 오른쪽 “다른 달” 칸을 보세요. 색이 아니라 이름표를 확인하고 넣어요.',check:'방금 넣은 종이를 다시 봐요. 월의 숫자와 칸의 이름표가 맞는지 비교해요.',kind:'sort'},
{title:'남은 종이도 한 장씩 해요',instruction:'남은 종이도 날짜를 보고, 맞는 칸에 한 장씩 넣어요.',confirm:'남은 종이를 모두 나누었어요',short:'남은 종이 분류',explain:'여러 장을 한 번에 하지 않아도 돼요. 한 장의 날짜를 보고 넣어요. 그다음 한 장을 다시 봐요.',where:'아직 나누지 않은 종이는 두 칸 앞에 둬요. 다 나눈 종이와 섞이지 않게 해요.',check:'두 칸 앞에 남은 종이가 있는지 봐요. 남았다면 같은 방법으로 한 장씩 나누어요.',kind:'repeat'},
{title:'6장이 모두 있는지 확인해요',instruction:'두 칸의 종이를 세고, 날짜와 이름표를 다시 비교해요.',confirm:'모두 6장이고 이름표와 맞는지 확인했어요',short:'마지막 확인',explain:'왼쪽 종이 수와 오른쪽 종이 수를 합하면 6장이에요. 수가 다르면 새 종이를 넣거나 버리지 말고 도움을 요청해요.',where:'왼쪽 칸부터 세고, 오른쪽 칸을 세요. 이미 센 종이와 아직 안 센 종이를 구분해 두면 좋아요.',check:'종이는 총 6장인가요? “이번 달”에는 10월 종이만 있나요? 헷갈리면 담당자와 함께 확인해요.',kind:'count'}
];
const $=id=>document.getElementById(id);let state={step:0,checked:false,paused:false,help:null},started=false,pending=null,lastReason='',abstentions=0;
function save(){try{sessionStorage.setItem('one-step-progress',JSON.stringify({step:state.step,started,paused:state.paused}))}catch{}}
try{const s=JSON.parse(sessionStorage.getItem('one-step-progress'));if(s&&Number.isInteger(s.step)&&s.step>=0&&s.step<=5){state.step=s.step;state.paused=!!s.paused;started=!!s.started}}catch{}
function diagram(kind){const color='#216047';const papers=Array.from({length:kind==='prepare'?6:3},(_,i)=>`<rect x="${25+i*15}" y="${30+i*6}" width="62" height="82" rx="5" fill="white" stroke="${color}" stroke-width="2"/>`).join('');return `<svg viewBox="0 0 420 175" xmlns="http://www.w3.org/2000/svg"><g>${papers}</g><path d="M150 80h40m-10-10 10 10-10 10" fill="none" stroke="${color}" stroke-width="4"/><rect x="215" y="45" width="85" height="90" rx="10" fill="#d4e7d4" stroke="${color}" stroke-width="2"/><rect x="315" y="45" width="85" height="90" rx="10" fill="#eee3c5" stroke="${color}" stroke-width="2"/><text x="258" y="94" text-anchor="middle" font-size="17" fill="${color}">이번 달</text><text x="357" y="94" text-anchor="middle" font-size="17" fill="${color}">다른 달</text>${kind==='date'?'<rect x="29" y="33" width="106" height="40" rx="5" fill="#fff7cd" stroke="#9c6d23"/><text x="82" y="60" text-anchor="middle" font-size="23" fill="#493917">10월 5일</text>':''}${kind==='count'?'<text x="150" y="155" text-anchor="middle" font-size="22" fill="#216047">두 칸 합쳐 6장</text>':''}</svg>`}
function render(){
 $('task-navigation').hidden=!started||state.step===5;$('intro').hidden=started;$('workspace').hidden=!started||state.step===5;$('finished').hidden=!started||state.step!==5;
 if(state.step<5){const s=STEPS[state.step];$('progress').textContent=`${state.step+1} / 5 단계`;$('step-title').textContent=s.title;$('instruction').textContent=s.instruction;$('confirm-label').textContent=s.confirm;$('visual').innerHTML=diagram(s.kind);$('meter-fill').style.width=`${(state.step+1)*20}%`;$('confirm').checked=state.checked;$('confirm').disabled=state.paused;$('next').disabled=!state.checked||state.paused;$('previous').disabled=state.step===0||state.paused;$('next').textContent=state.step===4?'모두 확인했어요':'확인하고 다음으로';$('pause-card').hidden=!state.paused;}
 save();
}
function hideHelp(){pending=null;$('help-card').hidden=true;$('human-card').hidden=true;}
function focusHelp(){$('help-card').scrollIntoView({behavior:'smooth',block:'nearest'});$('help-title').focus({preventScroll:true})}
function showHelp(kind,ai=false){
 if(state.step>=5)return;
 if(kind==='human'||kind==='safety'){if(kind==='safety')state=OneStep.nextState(state,'pause');showHuman(kind==='safety'?'위험하거나 몸이 불편한 상황이라 작업을 멈췄어요.':'혼자 이어가기 어려워요.');return}
 $('help-card').hidden=false;$('confirm-ai').hidden=true;$('help-actions').hidden=false;$('help-tag').textContent=ai?'확인한 도움 · 미리 작성한 설명':'필요한 설명만';$('help-title').textContent=OneStep.labels[kind];$('help-text').textContent=STEPS[state.step][kind];lastReason=OneStep.labels[kind];focusHelp();
}
function showHuman(reason=lastReason||'이 단계에서 도움이 필요해요.'){
 state.checked=false;$('human-card').hidden=false;$('help-card').hidden=true;$('handoff').textContent=`연습: 서류 6장 분류 · ${Math.min(state.step+1,5)}단계 “${STEPS[Math.min(state.step,4)].short}”에서 멈췄어요. ${reason} 이 단계부터 함께 봐 주세요.`;$('human-card').scrollIntoView({behavior:'smooth',block:'start'});render();
}
function focusSection(id){const el=$(id);el.style.scrollMarginTop=($('task-navigation').getBoundingClientRect().height+12)+'px';el.scrollIntoView({block:'start'});el.focus({preventScroll:true})}
$('jump-work').onclick=()=>focusSection('step-title');
$('jump-help').onclick=()=>focusSection('support-title');
$('start').onclick=()=>{started=true;render();$('step-title').focus()};
$('confirm').onchange=e=>{state=OneStep.nextState(state,e.target.checked?'confirm':'unconfirm');render()};
$('next').onclick=()=>{document.dispatchEvent(new Event('one-step-change'));lastReason='';abstentions=0;state=OneStep.nextState(state,'next');hideHelp();$('question').value='';$('ai-details').open=false;render();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});(state.step===5?$('finished').querySelector('h1'):$('step-title')).focus()};
$('previous').onclick=()=>{document.dispatchEvent(new Event('one-step-change'));lastReason='';state=OneStep.nextState(state,'previous');hideHelp();render()};
$('pause').onclick=()=>{state=OneStep.nextState(state,'pause');hideHelp();render()};
$('resume').onclick=()=>{state=OneStep.nextState(state,'resume');render()};
document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>showHelp(b.dataset.help));
$('ask-ai').onclick=()=>{
 const input=$('question').value;const r=OneStep.classify(input);$('question').value='';
 if(r.kind==='safety'){showHelp('safety');return}
 if(r.kind==='human'){showHuman('사람의 도움이 필요하다고 적었어요.');return}
 $('help-card').hidden=false;$('help-actions').hidden=true;
 if(['unknown','ambiguous'].includes(r.kind)){abstentions++;$('help-tag').textContent='AI가 확실히 고르지 못했어요';$('help-title').textContent='아래에서 직접 골라도 괜찮아요';$('help-text').textContent='“말을 쉽게”, “놓을 곳 보기”, “맞는지 확인” 중 원하는 버튼을 눌러 주세요. 사람에게 도움을 요청해도 돼요.';$('confirm-ai').hidden=true;pending=null;if(abstentions>=2)$('help-text').textContent='설명을 고르기 어려우면 아래 사람에게 도움받기 버튼을 눌러 주세요. 지금 단계는 그대로예요.'}
 else{pending=r.kind;$('help-tag').textContent='AI가 고른 설명 종류 · 맞는지 먼저 확인해요';$('help-title').textContent=`“${OneStep.labels[r.kind]}” 도움이 필요한가요?`;$('help-text').textContent='AI는 종이나 작업 결과를 직접 보지 못해요. 맞는 도움인지 선택해 주세요.';$('confirm-ai').hidden=false}
 focusHelp();
};
$('accept-ai').onclick=()=>{if(pending){const p=pending;pending=null;showHelp(p,true)}};
$('reject-ai').onclick=()=>{hideHelp();$('ai-details').open=false;document.querySelector('[data-help]').focus()};
$('retry').onclick=()=>{hideHelp();state.checked=false;render();$('step-title').focus()};
for(const id of ['human','help-human','finish-human'])$(id).onclick=()=>showHuman();
$('human-return').onclick=()=>{hideHelp();state.checked=false;render()};
$('human-wait').onclick=()=>{state=OneStep.nextState(state,'pause');$('human-card').hidden=true;render()};
$('restart').onclick=()=>{document.dispatchEvent(new Event('one-step-change'));lastReason='';abstentions=0;state=OneStep.nextState(state,'restart');started=false;hideHelp();render()};
$('list').innerHTML=STEPS.map(s=>`<li>${s.instruction}</li>`).join('');$('checklist').onclick=()=>{$('all-steps').hidden=false;$('all-steps').scrollIntoView({behavior:'smooth'})};$('close-checklist').onclick=()=>$('all-steps').hidden=true;
render();
