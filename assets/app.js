'use strict';
(function () {
const QUESTIONS = [
 {id:'age',section:'个人基本情况',title:'你今年多大？',hint:'用于介绍生活阶段，不参与评分。',type:'number',min:18,max:100,unit:'岁'},
 {id:'city',section:'个人基本情况',title:'你目前常住在哪座城市？',hint:'只需填写城市，不要填写具体地址。',type:'text',max:40,placeholder:'例如：杭州，也可以跳过'},
 {id:'work',section:'个人基本情况',title:'你的工作与生活节奏更接近哪一种？',options:['时间相对规律','经常加班或出差','轮班或时间不固定','学习或职业调整阶段']},
 {id:'hobbies',section:'个人基本情况',title:'你愿意分享哪些日常兴趣？',hint:'最多选 3 项；没有贴近的可以跳过。',type:'multi',options:['散步或户外','运动健身','阅读或看电影','做饭与美食','旅行探索','游戏或手作','音乐或艺术']},
 {id:'chat',section:'相处与表达',title:'认识新朋友时，你通常怎样开启聊天？',options:['比较容易主动分享','先倾听，熟悉后再分享','经常不知道怎么接话','看场合，还不确定']},
 {id:'conflict',section:'相处与表达',title:'出现分歧时，你更常怎么处理？',options:['说明感受，一起讨论','先冷静，再约时间沟通','容易着急，事后再解释','倾向回避，不太会开口']},
 {id:'strength',section:'相处与表达',title:'你最想让对方了解自己的哪些特点？',hint:'最多选 3 项。这是自我描述，可以用真实经历来说明。',type:'multi',options:['愿意倾听','做事可靠','喜欢分享生活','尊重独立空间','愿意一起规划','愿意照顾彼此']},
 {id:'lifestyle',section:'相处与表达',title:'你期待怎样的相处频率？',options:['日常多联系，见面频繁','有固定见面时间，也有个人空间','时间灵活，提前协商','还想通过相处慢慢了解']},
 {id:'care',section:'家庭与未来安排',title:'目前是否有需要沟通的家庭照护安排？',hint:'只梳理安排，不评价家庭好坏；无需填写健康细节。',options:['暂无固定照护安排','有定期照护安排，时间可协调','有长期照护安排，需要提前沟通','尚不确定']},
 {id:'housing',section:'家庭与未来安排',title:'对未来居住方式，你更倾向于？',options:['与伴侣独立居住','与家人同住或就近照顾','根据双方工作和情况协商','暂未考虑']},
 {id:'finance',section:'家庭与未来安排',title:'对于共同生活的开支，你希望怎样安排？',hint:'不需要填写收入或资产数额。',options:['各自独立，共同开支协商','共同预算，定期沟通','按收入和承担的责任协商','还没有想清楚']},
 {id:'timeline',section:'关系期待',title:'你目前对关系进度的想法是？',options:['希望 1—2 年内考虑结婚','先认真相处，再讨论结婚','希望慢慢了解，不设时间表','还在探索是否适合进入关系']},
 {id:'children',section:'关系期待',title:'关于生育，你目前的想法是？',hint:'这是需要双方平等沟通的议题，可以跳过。',options:['希望未来有孩子','倾向不生育','还不确定，需要进一步考虑']},
 {id:'location',section:'关系期待',title:'你对未来定居地点的想法是？',options:['希望留在目前城市','可考虑异地，之后协商定居','愿意根据双方规划调整','暂未确定']},
 {id:'values',section:'关系期待',title:'长期相处中，你最看重什么？',hint:'最多选 3 项；这些是你想重点了解的方向。',type:'multi',options:['彼此尊重','沟通坦诚','生活节奏接近','消费观能协商','共同成长','家庭边界清晰','愿意承担责任']},
 {id:'focus',section:'下一步行动',title:'这次你最想解决哪个问题？',options:['理清自己的择偶条件','改善自我介绍','让见面聊天更自然','复盘相亲后的感受']}
];
const PREFS = [
 {id:'age',label:'年龄范围',type:'range',min:18,max:100,unit:'岁'},
 {id:'height',label:'身高范围',type:'range',min:120,max:230,unit:'cm'},
 {id:'education',label:'学历偏好',options:['暂不确定','不限学历','大专及以上','本科及以上','硕士及以上']},
 {id:'school',label:'院校偏好',options:['暂不确定','不限院校','有特定院校偏好，见面时再了解']},
 {id:'income',label:'月收入期待',options:['暂不确定','不设固定数额，重点沟通开支','8千元及以上','1.5万元及以上','2.5万元及以上','4万元及以上']},
 {id:'city',label:'定居安排',options:['暂不确定','希望同城发展','可以异地并协商定居','可共同选择城市']},
 {id:'children',label:'生育意愿',options:['暂不确定','希望未来有孩子','倾向不生育','可以继续讨论']},
 {id:'housing',label:'居住安排',options:['暂不确定','希望独立居住','可以与家人同住','根据照护和工作安排协商']},
 {id:'finance',label:'共同开支',options:['暂不确定','各自独立，共同开支协商','共同预算，定期沟通','按收入和责任协商']},
 {id:'contact',label:'相处频率',options:['暂不确定','希望经常联系和见面','固定见面，也保留个人空间','按双方时间提前协商']}
];
const PRIORITIES = ['暂未分类','必须满足','比较看重','可以商量'];
function escapeHTML(value) {return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function answered(value) {return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';}
function displayAnswer(value) {return answered(value) ? (Array.isArray(value) ? value.join('、') : String(value)) : '未填写';}
function buildReport(a) {
 const count = QUESTIONS.filter(q => answered(a[q.id])).length;
 const insights = [];
 const add = (title,id,meaning,action) => {if(answered(a[id])) insights.push({title,basis:displayAnswer(a[id]),meaning,action});};
 if(answered(a.strength)) add('用经历说明你想展示的特点','strength','这些是你选择的自我描述，不代表他人已经作出相同评价。','从其中选一个特点，补充一件你亲身经历的小事：发生了什么，你做了什么。');
 if(answered(a.hobbies)) add('从真实日常开始介绍','hobbies','你选择了愿意分享的兴趣，可以作为认识彼此的起点。','准备一个最近与这些兴趣有关的小片段，并问问对方平时怎样度过休息日。');
 const chatTips = {
 '比较容易主动分享':['主动分享是你的自述习惯，也可以留意对方是否有表达空间。','分享一小段后停下来，邀请对方讲讲自己的经历。'],
 '先倾听，熟悉后再分享':['你更习惯先观察、慢慢熟悉，可以提前说明自己的交流节奏。','准备两件愿意分享的生活小事，听完对方后也主动说一点自己的感受。'],
 '经常不知道怎么接话':['你提到接话有困难，可以先练习具体追问，不必强迫自己变得幽默。','从对方刚提到的小事追问一次，再分享自己的类似经历。'],
 '看场合，还不确定':['你还没有确定的交流模式，适合先观察具体情境。','见面后记录哪个话题最自然，以及什么时候你觉得轻松。']
 };
 if(chatTips[a.chat]) add('找到舒服的聊天节奏','chat',...chatTips[a.chat]);
 const conflictTips = {
 '说明感受，一起讨论':['你倾向于直接讨论，可以进一步确认双方的理解是否一致。','试着说“我当时的感受是……我希望……你怎么看？”'],
 '先冷静，再约时间沟通':['你需要先整理情绪；让对方知道何时继续沟通会更清楚。','需要暂停时，说明原因，并与对方约定一个双方接受的沟通时间。'],
 '容易着急，事后再解释':['你注意到自己在分歧中容易着急，可以提前准备暂停表达。','在情绪升高时先提出暂停，平静后描述具体事情、感受和需要。'],
 '倾向回避，不太会开口':['你提到不容易开口，可以从小分歧练习表达。','先写下想表达的一句话，再选择双方有时间时讨论一件具体的小事。']
 };
 if(conflictTips[a.conflict]) add('为分歧准备一种表达方式','conflict',...conflictTips[a.conflict]);
 const careTips = {
 '暂无固定照护安排':['你目前没有固定照护安排，未来仍可能变化。','在关系逐步稳定时，互相了解对家庭责任的期待。'],
 '有定期照护安排，时间可协调':['照护是你生活的一部分，需要讨论时间如何安排。','整理自己固定需要的时间，以及可以协商的见面时段。'],
 '有长期照护安排，需要提前沟通':['长期照护涉及共同生活安排，不是对个人或家庭的优劣评价。','整理照护所需时间、可获得的支持和希望对方理解的边界，再选择适当时机说明。'],
 '尚不确定':['这部分安排还不明确，不需要现在作出结论。','先了解自己的责任和支持情况，再决定有哪些内容需要与伴侣沟通。']
 };
 if(careTips[a.care]) add('提前沟通家庭照护安排','care',...careTips[a.care]);
 add('确认居住期待','housing','这是你目前对居住的倾向，实际安排需要双方协商。','聊聊独立空间、通勤与照护需求，分别说出必要条件和可协商部分。');
 add('协调相处频率','lifestyle','你表达了希望联系和见面的节奏，可以和对方确认各自的需要。','分别说出工作日和休息日希望怎样联系，以及需要保留的个人时间。');
 add('安排认识彼此的时间','work','这是你目前的生活节奏，不代表你投入关系的意愿。','找出近期可以安心交流的时段，提前说明加班、轮班或学习安排。');
 add('把开支安排说清楚','finance','共同开支涉及双方的习惯与责任，不能仅凭收入判断。','用房租、日常开支或旅行预算等具体场景，讨论怎样分担更合适。');
 add('讨论关系进度','timeline','这是你自己的时间期待，并不代表对方有相同计划。','在互有继续了解意愿后，问问对方的关系目标，确认节奏是否可以协商。');
 add('确认生育议题','children','生育意愿是需要双方主动表达的议题，未确定时也可以如实说明。','在适当阶段直接交流各自的意愿和顾虑，不预设对方会改变想法。');
 add('对齐定居方向','location','定居选择会影响共同生活，需要结合双方情况讨论。','分别说出目前工作、家庭和城市选择上的约束与可调整空间。');
 add('把价值观放进具体场景','values','这些词代表你想重点了解的方向，实际含义可能因人而异。','从你选的一项出发，举一个日常场景，问问双方会如何处理。');
 const strengths = answered(a.strength) ? a.strength.join('、') : answered(a.hobbies) ? a.hobbies.join('、') : '尚未填写个人特点或兴趣';
 const summary = count ? '你已填写 '+count+' / '+QUESTIONS.length+' 项。'+(answered(a.focus)?'本次重点：'+a.focus+'。':'可以从下面的回答解读和行动清单开始。') : '你暂未填写回答。这里提供空白梳理框架；返回填写后，可以生成对应解读。';
 const introParts = [];
 if(answered(a.age)) introParts.push('我今年'+a.age+'岁。');
 if(answered(a.city)) introParts.push('目前常住在'+a.city+'。');
 if(answered(a.work)) introParts.push('工作与生活节奏是'+a.work+'。');
 if(answered(a.hobbies)) introParts.push('平时喜欢'+a.hobbies.join('、')+'。');
 if(answered(a.strength)) introParts.push('我觉得自己'+a.strength.join('、')+'。');
 if(answered(a.values)) introParts.push('相处中，我比较看重'+a.values.join('、')+'。');
 if(answered(a.timeline)) introParts.push('对关系的期待是：'+a.timeline+'。');
 const actions = [
 {time:'第 1—2 天',text:'整理择偶条件，给每项标注优先级；不确定的先留空。'},
 {time:'第 3—4 天',text:answered(a.strength)?'为“'+a.strength[0]+'”补充一个真实故事，修改自我介绍。':'写下一个真实的生活片段，补充到自我介绍。'},
 {time:'第 5—7 天',text:a.chat==='经常不知道怎么接话'?'练习一次具体追问，再分享一个自己的类似经历。':'准备三个真正好奇的问题，练习倾听和轮流分享。'},
 {time:'第 8—10 天',text:answered(a.care)&&a.care!=='暂无固定照护安排'?'整理家庭照护安排中需要说明的时间、支持与边界。':'整理关于居住、开支和关系进度的期待，区分确定和待讨论部分。'},
 {time:'第 11—14 天',text:'有见面机会时，记录相处是否轻松、是否被尊重、是否想继续；没有机会时，先用这三个问题复盘以往经历。'}
 ];
 const conversations = ['最近有哪些小事让你觉得开心？','你平时怎样安排工作、休息和自己的时间？','如果有意见不同的时候，你希望我们怎么沟通？'];
 if(answered(a.hobbies)) conversations.unshift('你休息时喜欢做什么？我最近对'+a.hobbies[0]+'比较感兴趣。');
 if(answered(a.timeline)) conversations.push('你目前希望以怎样的节奏认识一个人？');
 return {count,summary,strengths,insights,intro:introParts.join('')||'我平时喜欢［补充一个真实兴趣］。相处中，我看重［补充自己的期待］。希望和你从［一种舒服的认识方式］开始了解。',actions,conversations};
}
function classifyPreferences(prefs) {
 const groups = {'必须满足':[],'比较看重':[],'可以商量':[],'暂未分类':[]};
 for(const field of PREFS) {
  const p=prefs[field.id]||{}; let value='';
  if(field.type==='range') {
   const hasMin=answered(p.min),hasMax=answered(p.max);
   if(hasMin||hasMax) {
    const lo=hasMin?Number(p.min):null,hi=hasMax?Number(p.max):null;
    if((hasMin&&(!Number.isFinite(lo)||!Number.isInteger(lo)||lo<field.min||lo>field.max))||(hasMax&&(!Number.isFinite(hi)||!Number.isInteger(hi)||hi<field.min||hi>field.max))) return {error:field.label+'请输入 '+field.min+'—'+field.max+' 之间的整数。'};
    if(hasMin&&hasMax&&lo>hi)return {error:field.label+'的下限不能大于上限。'};
    value=hasMin&&hasMax?lo+'—'+hi+field.unit:hasMin?lo+field.unit+'及以上':hi+field.unit+'及以下';
   }
  } else if(p.value&&p.value!=='暂不确定') value=p.value;
  if(!value) {
   if(p.priority&&p.priority!=='暂未分类')return {error:'请先填写“'+field.label+'”的条件，或将它设为“暂未分类”。'};
   continue;
  }
  const priority=PRIORITIES.includes(p.priority)?p.priority:'暂未分类';
  groups[priority].push(field.label+'：'+value);
 }
 return {groups};
}
const api={QUESTIONS,PREFS,buildReport,classifyPreferences,escapeHTML};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);
let answers={},index=0,isSample=false,report=null,preferences={},checks=[],draft='',draftEdited=false;
function show(name) {
 ['intro','quiz','result'].forEach(id=>$(id).hidden=id!==name);
 window.scrollTo({top:0,behavior:'auto'});
}
function goQuestion() {
 show('quiz');renderQuestion();
}
function renderQuestion() {
 const q=QUESTIONS[index],value=answers[q.id];
 $('section-label').textContent=q.section;$('question-count').textContent=(index+1)+' / '+QUESTIONS.length;
 $('progress').value=index+1;
 let content='<fieldset><legend id="question-title" tabindex="-1">'+escapeHTML(q.title)+'</legend><p class="question-hint">'+escapeHTML(q.hint||'选一个最贴近目前情况的选项，也可以跳过。')+'</p>';
 if(q.type==='number'||q.type==='text') {
  content+='<div class="question-number"><input id="answer-input" aria-labelledby="question-title" type="'+q.type+'" value="'+escapeHTML(value||'')+'" '+(q.type==='number'?'min="'+q.min+'" max="'+q.max+'" step="1" inputmode="numeric"':'maxlength="'+q.max+'" placeholder="'+escapeHTML(q.placeholder)+'"')+'>'+escapeHTML(q.unit||'')+'</div>';
 } else {
  content+='<div class="options">';
  q.options.forEach((opt,i)=>{
   const selected=q.type==='multi'?Array.isArray(value)&&value.includes(opt):value===opt;
   content+='<label class="option"><input type="'+(q.type==='multi'?'checkbox':'radio')+'" name="answer" value="'+i+'" '+(selected?'checked':'')+'><span>'+escapeHTML(opt)+'</span></label>';
  });content+='</div>';
 }
 content+='</fieldset><p id="question-error" class="error" role="alert"></p>';
 $('question').innerHTML=content;
 $('previous').disabled=index===0;$('next').textContent=index===QUESTIONS.length-1?'生成我的报告':'下一题';
 $('question').querySelectorAll('input').forEach(input=>input.addEventListener('input',()=> {
  if(q.type==='multi') {
   const selected=[...$('question').querySelectorAll('input:checked')];
   if(selected.length>3){input.checked=false;$('question-error').textContent='最多选择 3 项。';return;}
  }
  $('question-error').textContent='';
 }));
 $('question-title').focus();
}
function saveAnswer() {
 const q=QUESTIONS[index];let value;
 if(q.type==='text'||q.type==='number') {
  value=$('answer-input').value.trim();
  if(q.type==='number'&&value!=='') {
   const n=Number(value);
   if(!Number.isInteger(n)||n<q.min||n>q.max){$('question-error').textContent='请输入 '+q.min+'—'+q.max+' 之间的整数，或选择暂不填写。';return false;}
   value=n;
  }
 } else {
  const picked=[...$('question').querySelectorAll('input:checked')].map(el=>q.options[Number(el.value)]);
  value=q.type==='multi'?picked:(picked[0]||null);
 }
 answers[q.id]=answered(value)?value:null;return true;
}
function advance() {if(index<QUESTIONS.length-1){index++;renderQuestion();}else renderReport();}
$('start').onclick=()=>{isSample=false;goQuestion();};
$('next').onclick=()=>{if(saveAnswer())advance();};
$('skip').onclick=()=>{answers[QUESTIONS[index].id]=null;advance();};
$('previous').onclick=()=>{if(index>0&&saveAnswer()){index--;renderQuestion();}};
$('sample').onclick=()=>{
 reset();isSample=true;
 answers={age:29,city:'杭州',work:'时间相对规律',hobbies:['散步或户外','做饭与美食'],chat:'经常不知道怎么接话',conflict:'先冷静，再约时间沟通',strength:['做事可靠','尊重独立空间'],lifestyle:'有固定见面时间，也有个人空间',care:'有定期照护安排，时间可协调',housing:'与伴侣独立居住',finance:'共同预算，定期沟通',timeline:'先认真相处，再讨论结婚',children:'还不确定，需要进一步考虑',location:'希望留在目前城市',values:['彼此尊重','沟通坦诚','家庭边界清晰'],focus:'让见面聊天更自然'};
 renderReport();
};
function renderReport() {
 report=buildReport(answers);show('result');$('sample-banner').hidden=!isSample;$('report-summary').textContent=report.summary;
 const topics=report.insights.filter(i=>/安排|居住|开支|进度|生育|定居/.test(i.title)).map(i=>i.title).slice(0,3).join('、')||'可按自己的节奏补充未来安排';
 $('report-highlights').innerHTML=[['01 / 值得表达',report.strengths],['02 / 可以沟通',topics],['03 / 优先行动',answers.focus||'先补充你愿意分享的回答']].map(([h,t])=>'<article class="card"><span class="card-index">'+h+'</span><p>'+escapeHTML(t)+'</p></article>').join('');
 $('insights').innerHTML=report.insights.length?report.insights.map(i=>'<article class="card insight"><h3>'+escapeHTML(i.title)+'</h3><p class="basis">你的回答：'+escapeHTML(i.basis)+'</p><p>'+escapeHTML(i.meaning)+'</p><p class="action"><strong>下一步：</strong>'+escapeHTML(i.action)+'</p></article>').join(''):'<p class="card">暂无可解读的回答。你可以先使用择偶优先级工具，也可以返回补充回答。</p>';
 $('answer-list').innerHTML=QUESTIONS.map(q=>'<dt>'+escapeHTML(q.title)+'</dt><dd>'+escapeHTML(displayAnswer(answers[q.id]))+'</dd>').join('');
 if(!draftEdited)draft=report.intro;$('intro-draft').value=draft;
 $('conversation-list').innerHTML=report.conversations.map(t=>'<p class="conversation-item">'+escapeHTML(t)+'</p>').join('');
 $('action-list').innerHTML=report.actions.map((a,i)=>'<label class="action-item"><input type="checkbox" data-index="'+i+'" '+(checks[i]?'checked':'')+'><span><strong>'+a.time+'</strong><small>'+escapeHTML(a.text)+'</small></span></label>').join('');
 $('action-list').querySelectorAll('input').forEach(el=>el.onchange=()=>checks[Number(el.dataset.index)]=el.checked);
 renderPreferences();updatePreferences(false);$('save-status').textContent='';$('report-title').focus();
}
function renderPreferences() {
 $('preference-fields').innerHTML=PREFS.map(f=>{
  const p=preferences[f.id]||{};
  let html='<div class="preference-field"><label '+(f.type==='range'?'id="label-'+f.id+'"':'for="pref-'+f.id+'"')+'>'+f.label+'</label>';
  if(f.type==='range')html+='<div class="range-pair"><input type="number" id="pref-'+f.id+'-min" aria-label="'+f.label+'下限" min="'+f.min+'" max="'+f.max+'" placeholder="最低" value="'+escapeHTML(p.min||'')+'"><span>至</span><input type="number" id="pref-'+f.id+'-max" aria-label="'+f.label+'上限" min="'+f.min+'" max="'+f.max+'" placeholder="最高" value="'+escapeHTML(p.max||'')+'"><span>'+f.unit+'</span></div>';
  else html+='<select id="pref-'+f.id+'">'+f.options.map(opt=>'<option '+(p.value===opt?'selected':'')+'>'+escapeHTML(opt)+'</option>').join('')+'</select>';
  html+='<label class="priority-label" for="priority-'+f.id+'">对我的重要程度<select id="priority-'+f.id+'">'+PRIORITIES.map(opt=>'<option '+(p.priority===opt?'selected':'')+'>'+opt+'</option>').join('')+'</select></label></div>';
  return html;
 }).join('');
 $('preference-fields').querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{readPreferences();$('preference-result').hidden=true;$('preference-error').textContent='';}));
}
function readPreferences() {
 PREFS.forEach(f=>{preferences[f.id]=f.type==='range'?{min:$('pref-'+f.id+'-min').value,max:$('pref-'+f.id+'-max').value,priority:$('priority-'+f.id).value}:{value:$('pref-'+f.id).value,priority:$('priority-'+f.id).value};});
}
function updatePreferences(visible=true) {
 readPreferences();const result=classifyPreferences(preferences);
 $('preference-error').textContent=result.error||'';
 if(result.error){$('preference-result').hidden=true;return false;}
 const groups=result.groups;let html='<h3>我的择偶优先级</h3>';
 PRIORITIES.forEach(priority=>{html+='<h4>'+priority+'</h4>'+(groups[priority].length?'<ul>'+groups[priority].map(t=>'<li>'+escapeHTML(t)+'</li>').join('')+'</ul>':'<p>尚未设置</p>');});
 html+='<p>这是你的条件整理，不是对某个人的匹配判断。对必须满足的条件，可以写下它为什么重要；是否调整由你决定。性格、尊重与相处感受需要在真实交流中了解。</p>';
 $('preference-result').innerHTML=html;$('preference-result').hidden=!visible;return true;
}
$('preference-form').onsubmit=e=>{e.preventDefault();updatePreferences();};
$('intro-draft').oninput=()=>{draft=$('intro-draft').value;draftEdited=true;};
function reportText() {
 const p=classifyPreferences(preferences);if(p.error)return null;
 const lines=[isSample?'相亲定位与择偶偏好分析 · 虚构样例':'相亲定位与择偶偏好分析',report.summary,'','【回答解读】'];
 report.insights.forEach(i=>lines.push(i.title,'你的回答：'+i.basis,i.meaning,'下一步：'+i.action,''));
 lines.push('【择偶优先级】');PRIORITIES.forEach(k=>lines.push(k,...(p.groups[k].length?p.groups[k]:['尚未设置'])));
 lines.push('','【自我介绍草稿】',$('intro-draft').value,'','【见面沟通清单】',...report.conversations,'','【两周行动清单】');
 report.actions.forEach((a,i)=>lines.push((checks[i]?'[已完成] ':'[待完成] ')+a.time+'：'+a.text));
 lines.push('','【全部回答】');QUESTIONS.forEach(q=>lines.push(q.title+'：'+displayAnswer(answers[q.id])));
 lines.push('','依据：按填写的回答与固定规则整理，不计算人群排名、成功概率或双方匹配度。家庭情况不作优劣评价。');
 return lines.join('\n');
}
$('download').onclick=()=>{
 if(!updatePreferences()){$('preference-error').scrollIntoView({block:'center'});return;}
 const text=reportText(),blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=isSample?'相亲准备报告-虚构样例.txt':'我的相亲准备报告.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('save-status').textContent='已发起下载，请在浏览器下载列表中查看。';
};
function preparePrint() {
 if(!report)return false;
 if(!updatePreferences())return false;
 if(!$('print-intro')){const p=document.createElement('p');p.id='print-intro';p.textContent=$('intro-draft').value;$('intro-draft').after(p);}
 $('intro-draft').hidden=true;return true;
}
function finishPrint(){const p=$('print-intro');if(p)p.remove();$('intro-draft').hidden=false;}
$('print').onclick=()=>{if(preparePrint()){window.print();finishPrint();}else $('preference-error').scrollIntoView({block:'center'});};
window.addEventListener('beforeprint',preparePrint);window.addEventListener('afterprint',finishPrint);
$('edit').onclick=()=>{readPreferences();index=0;goQuestion();};
function reset(){answers={};preferences={};checks=[];draft='';draftEdited=false;index=0;isSample=false;report=null;}
$('restart').onclick=()=>{if(window.confirm('清空当前回答和草稿，重新开始？')){reset();show('intro');$('start').focus();}};
})();

