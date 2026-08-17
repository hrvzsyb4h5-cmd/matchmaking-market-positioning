(function () {
  'use strict';

  /* ============================================================
     评分模型 —— 专家经验型权重 + 性别差异化曲线
     ============================================================ */
  var DIM_WEIGHTS = {
    male:   { hardware: 0.42, soft: 0.22, family: 0.16, market: 0.20 },
    female: { hardware: 0.40, soft: 0.25, family: 0.15, market: 0.20 }
  };
  var HW_WEIGHTS = {
    male:   { age: 0.15, height: 0.15, looks: 0.13, education: 0.14, income: 0.15, asset: 0.10, bodyType: 0.09, grooming: 0.09 },
    female: { age: 0.19, height: 0.11, looks: 0.19, education: 0.14, income: 0.08, asset: 0.11, bodyType: 0.09, grooming: 0.09 }
  };
  var SOFT_WEIGHTS = { eq: 0.20, emotional: 0.20, hobby: 0.12, lifestyle: 0.15, values: 0.11, humor: 0.10, ambition: 0.12 };
  var FAM_WEIGHTS = { familyWealth: 0.25, parents: 0.18, hukouCity: 0.24, socialNet: 0.12, onlyChild: 0.08, parentsMarriage: 0.13 };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function sliderScore(v) { return clamp(Math.round(v * 8 + 12), 20, 92); }

  function ageScore(gender, age) {
    if (gender === 'male') {
      if (age < 22) return 70; if (age < 25) return 82; if (age < 28) return 90;
      if (age < 32) return 96; if (age < 35) return 90; if (age < 38) return 78;
      if (age < 42) return 64; if (age < 45) return 50; return 38;
    } else {
      if (age < 22) return 78; if (age < 24) return 90; if (age < 27) return 97;
      if (age < 30) return 88; if (age < 33) return 72; if (age < 36) return 56;
      if (age < 40) return 42; return 32;
    }
  }
  function heightScore(gender, h) {
    if (gender === 'male') {
      if (h < 165) return 35; if (h < 170) return 52; if (h < 173) return 68;
      if (h < 176) return 80; if (h < 180) return 90; if (h < 183) return 95;
      if (h < 186) return 92; if (h < 190) return 85; return 80;
    } else {
      if (h < 155) return 48; if (h < 158) return 62; if (h < 160) return 75;
      if (h < 163) return 85; if (h < 166) return 92; if (h < 168) return 95;
      if (h < 170) return 90; if (h < 173) return 82; return 72;
    }
  }
  var CITY_SCARCITY = { '一线(北上广深)': 68, '新一线': 74, '二线': 82, '三四线及以下': 88 };

  // ============================================================
  // 维度定义(含口语化文案 + 过渡幕文案)
  // ============================================================
  var DIMENSIONS = [
    {
      id: 'hardware', name: '个人硬件', roman: 'I',
      essay: '硬件是相亲市场的入场券。它最直观,也最容易被量化——但记住,峰值不在最年轻最富有的那一端。',
      questions: [
        { id: 'age', type: 'range', title: '你今年多大啦？', hint: '年龄在市场里是条曲线,不是越小越好哦',
          min: 18, max: 50, step: 1, unit: '岁', def: 25, defFemale: 24 },
        { id: 'height', type: 'range', title: '身高报一下？', hint: '放心,这关有偏好区间,不是越高越好',
          min: 155, max: 200, step: 1, unit: 'cm', def: 175, minF: 145, maxF: 185, defF: 162 },
        { id: 'looks', type: 'range', title: '给自己长相打个分？', hint: '结合别人夸你的频率,客观点~系统会做校正',
          min: 1, max: 10, step: 1, unit: '分', def: 6,
          scaleLabels: ['1', '4 中下', '6 还行', '8 出众', '10 极品'] },
        { id: 'bodyType', type: 'single', title: '身材体型怎么样？', hint: '',
          options: [
            { t: '匀称标准', s: 82 }, { t: '健身有型/有线条', s: 90 },
            { t: '偏瘦', s: 64 }, { t: '微胖圆润', s: 58 },
            { t: '偏壮/结实', sm: 66, sf: 52 }
          ] },
        { id: 'education', type: 'single', title: '书读到哪一步了？', hint: '',
          options: [
            { t: '高中及以下', s: 32 }, { t: '大专', s: 44 }, { t: '普通本科', s: 58 },
            { t: '重点本科(一本/211)', s: 74 }, { t: '985/双一流本科', s: 86 },
            { t: '普通院校硕士', s: 70 }, { t: '985/名校硕士', s: 84 }, { t: '博士', s: 82 }
          ] },
        { id: 'income', type: 'single', title: '每个月到手大概多少？', hint: '',
          options: [
            { t: '5千以下', sm: 30, sf: 42 }, { t: '5千 - 8千', sm: 42, sf: 54 },
            { t: '8千 - 1.2万', sm: 54, sf: 64 }, { t: '1.2万 - 1.8万', sm: 66, sf: 74 },
            { t: '1.8万 - 2.5万', sm: 76, sf: 82 }, { t: '2.5万 - 4万', sm: 86, sf: 88 },
            { t: '4万 - 6万', sm: 92, sf: 92 }, { t: '6万以上', sm: 96, sf: 95 }
          ] },
        { id: 'asset', type: 'single', title: '房和车,现在什么情况？', hint: '',
          options: [
            { t: '一线城市有房(无贷)', s: 95 }, { t: '一线城市有房(有贷)', s: 80 },
            { t: '二线城市有房(无贷)', s: 88 }, { t: '二线城市有房(有贷)', s: 74 },
            { t: '有车且有可观存款', s: 64 }, { t: '只有车', s: 52 },
            { t: '没房没车但有存款', s: 46 }, { t: '暂无房车存款', s: 32 }
          ] },
        { id: 'grooming', type: 'range', title: '平时的穿搭打扮用心吗？', hint: '外在打理程度,发型/穿搭/干净整洁',
          min: 1, max: 10, step: 1, unit: '分', def: 5,
          scaleLabels: ['1 邋遢随意', '4 基本整洁', '6 还行', '8 会穿搭', '10 精致达人'] }
      ]
    },
    {
      id: 'soft', name: '软实力', roman: 'II',
      essay: '硬件决定你能不能被看见,软实力决定你能不能被留下。这一part,请你对自己诚实一点。',
      questions: [
        { id: 'eq', type: 'range', title: '聊天时你算接梗王吗？', hint: '读懂空气、接住情绪的能力',
          min: 1, max: 10, step: 1, unit: '分', def: 6, scaleLabels: ['1 话题终结者', '4 偶尔接得上', '6 还行', '8 接梗王', '10 高情商'] },
        { id: 'emotional', type: 'range', title: '遇到破事你能稳住吗？', hint: '情绪稳定性,越不容易炸分越高',
          min: 1, max: 10, step: 1, unit: '分', def: 6, scaleLabels: ['1 一点就着', '4 有点容易崩', '6 一般', '8 很稳', '10 佛系本佛'] },
        { id: 'hobby', type: 'range', title: '下班后的生活有料吗？', hint: '兴趣爱好的丰富度',
          min: 1, max: 10, step: 1, unit: '分', def: 5, scaleLabels: ['1 只会刷手机', '4 偶尔有活动', '6 还行', '8 挺丰富', '10 生活家'] },
        { id: 'lifestyle', type: 'range', title: '你的生活有质感吗？', hint: '审美、自律、讲究程度',
          min: 1, max: 10, step: 1, unit: '分', def: 5, scaleLabels: ['1 凑合过', '4 略讲究', '6 还行', '8 有品味', '10 质感拉满'] },
        { id: 'values', type: 'range', title: '你能接受和你很不一样的人吗？', hint: '包容度,不偏执、能求同存异',
          min: 1, max: 10, step: 1, unit: '分', def: 6, scaleLabels: ['1 必须同频', '4 有点挑', '6 一般', '8 挺开放', '10 海纳百川'] },
        { id: 'humor', type: 'range', title: '你算有趣的人吗？', hint: '幽默感,能不能逗人开心、制造氛围',
          min: 1, max: 10, step: 1, unit: '分', def: 5, scaleLabels: ['1 无趣无聊', '4 偶尔有趣', '6 还行', '8 挺好玩', '10 开心果'] },
        { id: 'ambition', type: 'range', title: '你对未来有冲劲吗？', hint: '上进心和事业野心',
          min: 1, max: 10, step: 1, unit: '分', def: 6, scaleLabels: ['1 躺平了', '4 随缘', '6 还行', '8 有目标', '10 卷王之王'] }
      ]
    },
    {
      id: 'family', name: '家庭背景', roman: 'III',
      essay: '相亲市场的隐形筹码。它不写在自我介绍里,但对方一定会打听——因为它关乎未来生活的底色。',
      questions: [
        { id: 'familyWealth', type: 'single', title: '家里经济条件怎么样？', hint: '',
          options: [
            { t: '富裕(家里有矿那种)', s: 92 }, { t: '小康(中产,没压力)', s: 78 },
            { t: '普通(够用,精打细算)', s: 60 }, { t: '拘谨(略有点紧)', s: 44 },
            { t: '困难(需要反哺家里)', s: 30 }
          ] },
        { id: 'parents', type: 'single', title: '父母那边需要你操心吗？', hint: '',
          options: [
            { t: '退休有保障,不用操心', s: 90 }, { t: '还在上班,未来有保障', s: 82 },
            { t: '需要赡养但压力可控', s: 66 }, { t: '健康需要长期照护', s: 48 },
            { t: '单亲/家庭负担比较重', s: 40 }
          ] },
        { id: 'hukouCity', type: 'single', title: '你户口在哪种地方？', hint: '',
          options: [
            { t: '一线(北上广深)', s: 88 }, { t: '新一线(杭蓉汉宁等)', s: 80 },
            { t: '二线', s: 70 }, { t: '三四线', s: 58 }, { t: '县城/农村', s: 46 }
          ] },
        { id: 'socialNet', type: 'range', title: '你的朋友圈子广吗？', hint: '人脉的广度和质量',
          min: 1, max: 10, step: 1, unit: '分', def: 5, scaleLabels: ['1 社恐本恐', '4 几个好友', '6 还行', '8 交友广泛', '10 社交达人'] },
        { id: 'onlyChild', type: 'single', title: '你是独生子女吗？', hint: '',
          options: [
            { t: '独生子女', s: 78 }, { t: '有一个兄弟姐妹', s: 80 },
            { t: '两个以上兄弟姐妹', s: 70 }, { t: '老大(有弟妹)', s: 74 },
            { t: '老幺(有兄姐)', s: 76 }
          ] },
        { id: 'parentsMarriage', type: 'single', title: '父母婚姻状况怎么样？', hint: '',
          options: [
            { t: '原配,感情很好', s: 90 }, { t: '原配,凑合过', s: 74 },
            { t: '离异,各自安好', s: 62 }, { t: '离异,有矛盾', s: 44 },
            { t: '一方已故', s: 58 }
          ] }
      ]
    },
    {
      id: 'market', name: '市场供需', roman: 'IV',
      essay: '最后这一关最扎心。定位不只看你有多好,更看你在所处的池子里稀缺不稀缺,以及——你的眼光够不够现实。',
      questions: [
        { id: 'liveCity', type: 'single', title: '你长住在哪种城市？', hint: '',
          options: [
            { t: '一线(北上广深)' }, { t: '新一线' }, { t: '二线' }, { t: '三四线及以下' }
          ] },
        { id: 'expectations', type: 'multi', title: '找对象你最看重啥？', hint: '最多选3个,选得越多匹配池越小',
          max: 3,
          options: [
            { t: '长相身材出众', base: 10 }, { t: '高收入/有钱', base: 10 },
            { t: '高学历', base: 7 }, { t: '身高要够', base: 7 },
            { t: '家庭条件相当', base: 7 }, { t: '情绪稳定性格好', base: 4 },
            { t: '三观合得来', base: 4 }, { t: '有上进心', base: 4 },
            { t: '会照顾人/顾家', base: 4 }
          ] },
        { id: 'competition', type: 'range', title: '身边同龄人卷得厉害吗？', hint: '竞争压力越大,你的相对空间越小',
          min: 1, max: 10, step: 1, unit: '分', def: 6,
          scaleLabels: ['1 很佛', '4 还好', '6 一般卷', '8 挺卷', '10 卷王之王'] },
        { id: 'marriagePlan', type: 'single', title: '你打算什么时候结婚？', hint: '时间紧迫度影响市场议价权',
          options: [
            { t: '越快越好,急着结', s: 58 }, { t: '1-2年内', s: 78 },
            { t: '2-3年内,顺其自然', s: 84 }, { t: '3-5年内', s: 76 },
            { t: '没想好,看缘分', s: 64 }
          ] }
      ]
    }
  ];

  // 扁平化题目流 + 标记维度边界
  var quizFlow = [];
  DIMENSIONS.forEach(function (dim) {
    dim.questions.forEach(function (q, qi) {
      quizFlow.push({ dimId: dim.id, dimName: dim.name, dimRoman: dim.roman, dimEssay: dim.essay, q: q, qi: qi, isFirstOfDim: qi === 0 });
    });
  });
  var TOTAL_Q = quizFlow.length;

  // ============================================================
  // 状态
  // ============================================================
  var state = { gender: null, flowIdx: 0, answers: {}, inTransition: false };
  var seenTransitions = {};

  // ============================================================
  // DOM
  // ============================================================
  var $ = function (id) { return document.getElementById(id); };
  var screens = { intro: $('screen-intro'), quiz: $('screen-quiz'), result: $('screen-result') };

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('active', k === name); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // 开场
  // ============================================================
  var genderCards = document.querySelectorAll('.gender-card');
  genderCards.forEach(function (card) {
    card.addEventListener('click', function () {
      genderCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.gender = card.getAttribute('data-gender');
      $('btn-start').disabled = false;
    });
  });

  $('btn-start').addEventListener('click', function () {
    if (!state.gender) return;
    // 初始化滑块默认值(按性别)
    DIMENSIONS.forEach(function (dim) {
      dim.questions.forEach(function (q) {
        if (q.type === 'range' && state.answers[q.id] === undefined) {
          var def = q.def;
          if (state.gender === 'female' && q.defFemale !== undefined) def = q.defFemale;
          state.answers[q.id] = def;
        }
      });
    });
    state.flowIdx = 0;
    state.inTransition = false;
    seenTransitions = {};
    renderCurrent();
    showScreen('quiz');
  });

  // ============================================================
  // 渲染当前题(或维度过渡幕)
  // ============================================================
  function renderCurrent() {
    var item = quizFlow[state.flowIdx];
    var pct = Math.round((state.flowIdx / TOTAL_Q) * 100);

    $('progress-fill').style.width = Math.max(pct, 4) + '%';
    $('dim-tag').textContent = item.dimName;
    $('q-count').textContent = pad(state.flowIdx + 1) + ' / ' + pad(TOTAL_Q);
    renderDimDots(item);

    var stage = $('q-stage');

    // 维度过渡幕(每个维度第一题之前,且非第一题,且未看过)
    if (item.isFirstOfDim && state.flowIdx !== 0 && !seenTransitions[state.flowIdx]) {
      seenTransitions[state.flowIdx] = true;
      state.inTransition = true;
      renderTransition(item, stage);
      $('btn-next').textContent = '进入';
      $('btn-next').disabled = false;
      $('btn-prev').style.visibility = state.flowIdx === 0 ? 'hidden' : 'visible';
      $('quiz-tip').textContent = '准备好了就进入下一维度';
      return;
    }

    state.inTransition = false;
    // 正常题目
    renderQuestion(item, stage);
    $('btn-next').textContent = state.flowIdx === TOTAL_Q - 1 ? '生成报告' : '下一题';
    $('btn-prev').style.visibility = state.flowIdx === 0 ? 'hidden' : 'visible';
    // 根据题型更新底部提示
    var tipEl = $('quiz-tip');
    if (item.q.type === 'range') tipEl.textContent = '拖动滑块到最贴近你的位置';
    else if (item.q.type === 'multi') tipEl.textContent = '可多选,但选越多匹配池越小';
    else tipEl.textContent = '选一个最贴近你的选项';
    updateNextState();
  }

  function renderDimDots(item) {
    var dims = ['hardware', 'soft', 'family', 'market'];
    var colors = ['var(--accent)', 'var(--mint)', 'var(--lilac)', 'var(--gold)'];
    var html = '';
    dims.forEach(function (d, i) {
      var cls = 'dd';
      if (d === item.dimId) cls += ' active';
      else if (dims.indexOf(item.dimId) > i) cls += ' done';
      html += '<span class="' + cls + '" style="' + (d === item.dimId ? 'background:' + colors[i] : '') + '"></span>';
    });
    $('dim-dots').innerHTML = html;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function renderTransition(item, stage) {
    stage.innerHTML =
      '<div class="dim-transition q-anim">' +
      '<div class="dt-roman">' + item.dimRoman + '</div>' +
      '<div class="dt-name">' + item.dimName + '</div>' +
      '<div class="ornament"><span class="dot"></span></div>' +
      '<p class="dt-essay">' + item.dimEssay + '</p>' +
      '</div>';
  }

  function renderQuestion(item, stage) {
    var q = item.q;
    var html = '<div class="q-anim">';
    html += '<div class="q-prompt">' + item.dimName + ' · ' + (item.qi + 1) + '</div>';
    html += '<div class="q-title">' + q.title + '</div>';
    if (q.hint) html += '<div class="q-hint">' + q.hint + '</div>';

    if (q.type === 'range') {
      var min = q.min, max = q.max, def = state.answers[q.id] !== undefined ? state.answers[q.id] : q.def;
      if (state.gender === 'female' && q.minF !== undefined) { min = q.minF; max = q.maxF; }
      var desc = rangeDesc(q.id, def);
      html += '<div class="range-display">';
      html += '<div class="range-val" id="rv-' + q.id + '">' + def + '<span class="unit">' + q.unit + '</span></div>';
      html += '<div class="range-desc" id="rdesc-' + q.id + '">' + desc + '</div>';
      html += '</div>';
      html += '<input type="range" id="rg-' + q.id + '" min="' + min + '" max="' + max + '" step="' + q.step + '" value="' + def + '">';
      if (q.scaleLabels) {
        html += '<div class="range-scale">' + q.scaleLabels.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div>';
      } else {
        html += '<div class="range-scale"><span>' + min + '</span><span>' + max + '</span></div>';
      }
    } else if (q.type === 'single') {
      var cols = q.options.length <= 5 ? ' cols2' : '';
      html += '<div class="opt-list' + cols + '">';
      q.options.forEach(function (opt, i) {
        var sel = state.answers[q.id] === i ? ' selected' : '';
        html += '<div class="opt' + sel + '" data-q="' + q.id + '" data-i="' + i + '"><span class="marker"></span><span>' + opt.t + '</span></div>';
      });
      html += '</div>';
    } else if (q.type === 'multi') {
      var chosen = state.answers[q.id] || [];
      var maxed = chosen.length >= q.max;
      html += '<div class="opt-list">';
      q.options.forEach(function (opt, i) {
        var sel = chosen.indexOf(i) > -1 ? ' selected' : '';
        var dis = (!sel && maxed) ? ' disabled' : '';
        html += '<div class="opt multi' + sel + dis + '" data-q="' + q.id + '" data-i="' + i + '"><span class="marker"></span><span>' + opt.t + '</span></div>';
      });
      html += '</div>';
      html += '<div class="multi-counter">已选 ' + chosen.length + ' / ' + q.max + '</div>';
    }
    html += '</div>';
    stage.innerHTML = html;
    bindQuestion(q);
  }

  // 滑块实时描述(钓性文案)
  function rangeDesc(id, v) {
    var map = {
      age: v < 24 ? '鲜肉年纪' : v < 28 ? '黄金期' : v < 33 ? '正当年' : v < 38 ? '成熟魅力' : v < 45 ? '阅历丰富' : '岁月沉淀',
      height: v < 162 ? '娇小可人' : v < 170 ? '刚刚好' : v < 180 ? '高挑有型' : v < 185 ? '气场十足' : '高个子',
      looks: v <= 3 ? '朴素低调' : v <= 5 ? '清秀耐看' : v <= 7 ? '挺招人喜欢' : v <= 9 ? '回头率很高' : '天花板级别',
      grooming: v <= 3 ? '邋遢随意' : v <= 5 ? '基本整洁' : v <= 7 ? '还挺会穿' : v <= 9 ? '穿搭达人' : '精致天花板',
      eq: v <= 3 ? '话题终结者' : v <= 5 ? '偶尔接得上' : v <= 7 ? '聊得来' : v <= 9 ? '接梗王' : '高情商选手',
      emotional: v <= 3 ? '一点就着' : v <= 5 ? '有点容易崩' : v <= 7 ? '基本能稳住' : v <= 9 ? '很稳' : '佛系本佛',
      hobby: v <= 3 ? '手机党' : v <= 5 ? '偶尔有活动' : v <= 7 ? '生活挺充实' : v <= 9 ? '玩法很多' : '生活家本家',
      lifestyle: v <= 3 ? '凑合过' : v <= 5 ? '略讲究' : v <= 7 ? '有质感' : v <= 9 ? '很有品味' : '质感拉满',
      values: v <= 3 ? '必须同频' : v <= 5 ? '有点挑' : v <= 7 ? '挺开放' : v <= 9 ? '很包容' : '海纳百川',
      humor: v <= 3 ? '有点无聊' : v <= 5 ? '偶尔有趣' : v <= 7 ? '还挺好玩' : v <= 9 ? '很有趣' : '开心果本果',
      ambition: v <= 3 ? '躺平了' : v <= 5 ? '随缘' : v <= 7 ? '有干劲' : v <= 9 ? '很有野心' : '卷王本王',
      socialNet: v <= 3 ? '社恐本恐' : v <= 5 ? '几个好友' : v <= 7 ? '圈子还行' : v <= 9 ? '交友广泛' : '社交达人',
      competition: v <= 3 ? '很佛系' : v <= 5 ? '还好' : v <= 7 ? '有点卷' : v <= 9 ? '挺卷' : '卷王之王'
    };
    return map[id] || '';
  }

  function bindQuestion(q) {
    if (q.type === 'range') {
      var rg = $('rg-' + q.id);
      var rv = $('rv-' + q.id);
      var rdesc = $('rdesc-' + q.id);
      rg.addEventListener('input', function () {
        state.answers[q.id] = Number(rg.value);
        rv.innerHTML = rg.value + '<span class="unit">' + q.unit + '</span>';
        rdesc.textContent = rangeDesc(q.id, Number(rg.value));
        updateNextState();
      });
    } else {
      var opts = document.querySelectorAll('.opt[data-q="' + q.id + '"]');
      opts.forEach(function (el) {
        el.addEventListener('click', function () {
          if (el.classList.contains('disabled')) return;
          var i = Number(el.getAttribute('data-i'));
          if (q.type === 'single') {
            state.answers[q.id] = i;
            opts.forEach(function (o) { o.classList.remove('selected'); });
            el.classList.add('selected');
          } else {
            var chosen = state.answers[q.id] || [];
            var pos = chosen.indexOf(i);
            if (pos > -1) { chosen.splice(pos, 1); el.classList.remove('selected'); }
            else { if (chosen.length >= q.max) return; chosen.push(i); el.classList.add('selected'); }
            state.answers[q.id] = chosen;
            // 刷新计数和disabled
            var counter = document.querySelector('.multi-counter');
            if (counter) counter.textContent = '已选 ' + chosen.length + ' / ' + q.max;
            var maxed = chosen.length >= q.max;
            document.querySelectorAll('.opt[data-q="' + q.id + '"]').forEach(function (o) {
              if (!o.classList.contains('selected')) o.classList.toggle('disabled', maxed);
            });
          }
          updateNextState();
        });
      });
    }
  }

  function updateNextState() {
    var item = quizFlow[state.flowIdx];
    if (state.inTransition) { $('btn-next').disabled = false; return; }
    var q = item.q;
    var done = false;
    if (q.type === 'range') done = state.answers[q.id] !== undefined;
    else if (q.type === 'single') done = state.answers[q.id] !== undefined;
    else if (q.type === 'multi') done = Array.isArray(state.answers[q.id]) && state.answers[q.id].length > 0;
    $('btn-next').disabled = !done;
  }

  $('btn-prev').addEventListener('click', function () {
    if (state.inTransition) {
      // 过渡幕时点"上一题"→回到上一题
      state.inTransition = false;
      state.flowIdx--;
      renderCurrent();
      return;
    }
    if (state.flowIdx > 0) {
      state.flowIdx--;
      renderCurrent();
    }
  });

  $('btn-next').addEventListener('click', function () {
    if ($('btn-next').disabled) return;
    if (state.inTransition) {
      // 过渡幕"进入"→显示当前维度第一题(flowIdx 不变)
      renderCurrent();
      return;
    }
    if (state.flowIdx < TOTAL_Q - 1) {
      state.flowIdx++;
      renderCurrent();
    } else {
      $('progress-fill').style.width = '100%';
      showScreen('result');
      computeAndRenderResult();
    }
  });

  $('btn-restart').addEventListener('click', function () {
    state.gender = null; state.flowIdx = 0; state.answers = {}; state.inTransition = false;
    seenTransitions = {};
    genderCards.forEach(function (c) { c.classList.remove('selected'); });
    $('btn-start').disabled = true;
    showScreen('intro');
  });

  // ============================================================
  // 评分计算
  // ============================================================
  function findQ(qid) {
    for (var d = 0; d < DIMENSIONS.length; d++) {
      for (var i = 0; i < DIMENSIONS[d].questions.length; i++) {
        if (DIMENSIONS[d].questions[i].id === qid) return DIMENSIONS[d].questions[i];
      }
    }
    return null;
  }
  function optScore(q, i) {
    var opt = q.options[i];
    if (opt.sm !== undefined) return state.gender === 'male' ? opt.sm : opt.sf;
    return opt.s;
  }

  function compute() {
    var g = state.gender, a = state.answers, dw = DIM_WEIGHTS[g];

    var hwScores = {
      age: ageScore(g, a.age), height: heightScore(g, a.height), looks: sliderScore(a.looks),
      education: optScore(findQ('education'), a.education),
      income: optScore(findQ('income'), a.income),
      asset: optScore(findQ('asset'), a.asset),
      bodyType: optScore(findQ('bodyType'), a.bodyType),
      grooming: sliderScore(a.grooming)
    };
    var hwW = HW_WEIGHTS[g], hardware = 0;
    Object.keys(hwW).forEach(function (k) { hardware += hwScores[k] * hwW[k]; });

    var softScores = {
      eq: sliderScore(a.eq), emotional: sliderScore(a.emotional), hobby: sliderScore(a.hobby),
      lifestyle: sliderScore(a.lifestyle), values: sliderScore(a.values),
      humor: sliderScore(a.humor), ambition: sliderScore(a.ambition)
    };
    var soft = 0;
    Object.keys(SOFT_WEIGHTS).forEach(function (k) { soft += softScores[k] * SOFT_WEIGHTS[k]; });

    var famScores = {
      familyWealth: optScore(findQ('familyWealth'), a.familyWealth),
      parents: optScore(findQ('parents'), a.parents),
      hukouCity: optScore(findQ('hukouCity'), a.hukouCity),
      socialNet: sliderScore(a.socialNet),
      onlyChild: optScore(findQ('onlyChild'), a.onlyChild),
      parentsMarriage: optScore(findQ('parentsMarriage'), a.parentsMarriage)
    };
    var family = 0;
    Object.keys(FAM_WEIGHTS).forEach(function (k) { family += famScores[k] * FAM_WEIGHTS[k]; });

    // 市场供需
    var liveCityOpt = findQ('liveCity').options[a.liveCity].t;
    var cityScarcity = CITY_SCARCITY[liveCityOpt];
    var threeW = dw.hardware + dw.soft + dw.family;
    var competitiveness = (hardware * dw.hardware + soft * dw.soft + family * dw.family) / threeW;
    var competitivenessAdj = competitiveness * 0.95 + 3;

    var expQ = findQ('expectations');
    var chosenExp = a.expectations || [];
    var expectPenalty = chosenExp.reduce(function (sum, i) { return sum + expQ.options[i].base; }, 0);
    var supportBonus = competitivenessAdj > 78 ? 12 : competitivenessAdj > 68 ? 6 : competitivenessAdj >= 55 ? 0 : -8;
    var matchRaw = 100 - expectPenalty + supportBonus;
    var matchCoef = clamp(competitivenessAdj / 75, 0.4, 1.1);
    var matchPossibility = clamp(matchRaw * matchCoef, 20, 96);

    var compScore = clamp((11 - a.competition) * 8 + 12, 25, 90);
    var market = competitivenessAdj * 0.45 + matchPossibility * 0.30 + cityScarcity * 0.15 + compScore * 0.10;

    var total = hardware * dw.hardware + soft * dw.soft + family * dw.family + market * dw.market;
    var percentile = clamp(Math.round(100 / (1 + Math.exp(-(total - 58) / 7))), 1, 99);

    var allItems = [
      { name: '年龄', score: hwScores.age, dim: '硬件' }, { name: '身高', score: hwScores.height, dim: '硬件' },
      { name: '外貌', score: hwScores.looks, dim: '硬件' }, { name: '体型', score: hwScores.bodyType, dim: '硬件' },
      { name: '学历', score: hwScores.education, dim: '硬件' }, { name: '收入', score: hwScores.income, dim: '硬件' },
      { name: '资产', score: hwScores.asset, dim: '硬件' }, { name: '穿搭打扮', score: hwScores.grooming, dim: '硬件' },
      { name: '情商沟通', score: softScores.eq, dim: '软实力' }, { name: '情绪稳定', score: softScores.emotional, dim: '软实力' },
      { name: '兴趣丰富', score: softScores.hobby, dim: '软实力' }, { name: '生活品味', score: softScores.lifestyle, dim: '软实力' },
      { name: '价值观包容', score: softScores.values, dim: '软实力' }, { name: '幽默感', score: softScores.humor, dim: '软实力' },
      { name: '上进心', score: softScores.ambition, dim: '软实力' },
      { name: '家庭经济', score: famScores.familyWealth, dim: '家庭' }, { name: '父母状况', score: famScores.parents, dim: '家庭' },
      { name: '户籍地域', score: famScores.hukouCity, dim: '家庭' }, { name: '社会关系', score: famScores.socialNet, dim: '家庭' },
      { name: '独生子女', score: famScores.onlyChild, dim: '家庭' }, { name: '父母婚姻', score: famScores.parentsMarriage, dim: '家庭' },
      { name: '市场供需', score: market, dim: '市场' }
    ];

    return {
      gender: g, dims: { hardware: hardware, soft: soft, family: family, market: market },
      dimWeights: dw, total: total, percentile: percentile, items: allItems,
      market: { competitiveness: competitivenessAdj, matchPossibility: matchPossibility, cityScarcity: cityScarcity, compScore: compScore, expectPenalty: expectPenalty },
      expectations: chosenExp.map(function (i) { return expQ.options[i].t; })
    };
  }

  function gradeInfo(total) {
    if (total >= 88) return { grade: 'S 级', label: '头部稀缺资源', color: 'var(--gold)',
      desc: '你处在相亲市场的顶端。综合条件稀缺,选择权在你手里,是各路相亲资源争相推荐的对象。' };
    if (total >= 78) return { grade: 'A 级', label: '优质热门选手', color: 'var(--accent)',
      desc: '你有明显的市场竞争力,大多数相亲场合都属于被优先考虑的人选,主动权较强。' };
    if (total >= 68) return { grade: 'B+ 级', label: '中上稳健型', color: 'var(--accent)',
      desc: '你的综合条件高于平均,有稳定的吸引力。精准定位与策略优化能让你进入更优质的圈层。' };
    if (total >= 58) return { grade: 'B 级', label: '中等市场主力', color: 'var(--berry)',
      desc: '你处在相亲市场的主力区间。条件均衡但缺乏显著差异化优势,需要靠亮点突破或调整预期提升匹配效率。' };
    if (total >= 48) return { grade: 'C 级', label: '中下待提升', color: 'var(--berry)',
      desc: '你的竞争力暂时偏弱。建议聚焦核心短板的提升,或调整择偶预期扩大匹配池,避免长期消耗。' };
    return { grade: 'D 级', label: '需重点突围', color: 'var(--muted)',
      desc: '当前市场定位面临较大挑战。建议系统性地提升硬件或软实力,同时重新评估市场策略与预期。' };
  }

  // ============================================================
  // 渲染结果
  // ============================================================
  function computeAndRenderResult() {
    try {
      var r = compute(), g = gradeInfo(r.total), scoreRound = Math.round(r.total);
      var dimNames = { hardware: '个人硬件', soft: '软实力', family: '家庭背景', market: '市场供需' };

      var html = '<div class="result-cover">';
      html += '<span class="result-grade" style="color:' + g.color + '">' + g.grade + ' · 前 ' + r.percentile + '%</span>';
      html += '<div class="result-score">' + scoreRound + '<span class="max"> / 100</span></div>';
      html += '<div class="result-label">' + g.label + '</div>';
      html += '<div class="result-pct">在同龄同性市场池中,综合竞争力约领先 <strong>' + r.percentile + '%</strong> 的人</div>';
      html += '</div>';

      html += '<figure class="chart-figure"><figcaption>四维竞争力雷达</figcaption><div id="chart-radar"></div></figure>';

      html += '<div class="dim-cards">';
      ['hardware', 'soft', 'family', 'market'].forEach(function (k) {
        var s = r.dims[k], sr = Math.round(s), w = Math.round(r.dimWeights[k] * 100);
        html += '<div class="dim-card"><div class="dc-head"><span class="dc-name">' + dimNames[k] + '</span><span class="dc-w">权重 ' + w + '%</span></div>';
        html += '<div class="dc-score">' + sr + '</div><div class="dc-bar"><div class="dc-bar-fill" style="width:' + sr + '%"></div></div>';
        html += '<div class="dc-note">' + dimNote(k, s) + '</div></div>';
      });
      html += '</div>';

      var sorted = r.items.slice().sort(function (a, b) { return b.score - a.score; });
      var top3 = sorted.slice(0, 3), bottom3 = sorted.slice(-3).reverse();

      html += '<div class="result-section"><h3>你的杀手锏 <span class="pill pill-up">TOP 3</span></h3><div class="insight-list">';
      top3.forEach(function (it, i) { html += insightItem(it, i + 1, true); });
      html += '</div></div>';

      html += '<div class="result-section"><h3>拖后腿的 <span class="pill pill-down">需关注</span></h3><div class="insight-list">';
      bottom3.forEach(function (it, i) { html += insightItem(it, i + 1, false); });
      html += '</div></div>';

      html += '<div class="result-section"><h3>市场定位分析</h3><div class="analysis-block">' + buildAnalysis(r, g) + '</div></div>';

      // 市场指标仪表盘
      html += '<div class="result-section"><h3>市场关键指标</h3><div class="market-gauge">';
      html += buildGaugeRow('同池竞争力', r.market.competitiveness, 'var(--accent)');
      html += buildGaugeRow('匹配可能性', r.market.matchPossibility, 'var(--mint)');
      html += buildGaugeRow('城市稀缺度', r.market.cityScarcity, 'var(--lilac)');
      html += buildGaugeRow('竞争缓冲', r.market.compScore, 'var(--gold)');
      html += '</div></div>';

      // 全项明细表
      html += '<div class="result-section"><h3>全项得分明细 <span class="pill" style="color:var(--muted);border-color:var(--rule);">22项</span></h3>';
      html += '<table class="breakdown-table"><thead><tr><th>指标</th><th>维度</th><th class="bd-bar">水平</th><th style="text-align:right">得分</th></tr></thead><tbody>';
      sorted.forEach(function (it) {
        var sr = Math.round(it.score);
        html += '<tr><td class="bd-name">' + it.name + '</td><td style="color:var(--muted);font-size:0.76rem">' + it.dim + '</td>';
        html += '<td class="bd-bar"><div class="bd-mini-bar"><div class="bd-mini-bar-fill" style="width:' + sr + '%"></div></div></td>';
        html += '<td class="bd-score" style="color:' + (sr >= 75 ? 'var(--accent)' : sr >= 55 ? 'var(--ink)' : 'var(--berry)') + '">' + sr + '</td></tr>';
      });
      html += '</tbody></table></div>';

      html += '<div class="result-section"><h3>匹配与策略建议</h3><div class="match-card">' + buildMatchAdvice(r, g) + '</div></div>';

      // 理想型匹配模拟器
      html += '<div class="result-section"><h3>理想型匹配模拟器 <span class="pill" style="color:var(--mint);border-color:var(--mint);">互动</span></h3>';
      html += '<div class="ideal-box">';
      html += '<p class="ideal-intro">输入你心目中理想型的条件,看看你和TA的匹配度有多高,以及现实中遇到的概率。</p>';
      html += '<div class="ideal-fields" id="ideal-fields"></div>';
      html += '<button class="btn btn-primary ideal-btn" id="btn-ideal-calc">算算匹配度</button>';
      html += '<div class="ideal-result" id="ideal-result"></div>';
      html += '</div></div>';

      $('result-container').innerHTML = html;

      // 渲染理想型输入控件
      renderIdealFields(r);

      // 延迟渲染图表,确保 DOM 已可见
      setTimeout(function () {
        try {
          if (window.MatchChart) {
            window.MatchChart.render({ hardware: r.dims.hardware, soft: r.dims.soft, family: r.dims.family, market: r.dims.market });
          }
        } catch (e) {
          console.error('图表渲染失败:', e);
        }
      }, 100);
    } catch (e) {
      console.error('结果渲染失败:', e);
      $('result-container').innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--muted);"><p>结果渲染出了点问题</p><p style="font-size:0.8rem;margin-top:0.5rem;">' + e.message + '</p><p style="margin-top:1rem;">请重新测试试试</p></div>';
    }
  }

  function insightItem(it, rank, isUp) {
    return '<div class="insight-item"><span class="ii-rank">' + rank + '</span>' +
      '<div class="ii-body"><div class="ii-t">' + it.name + '</div><div class="ii-d">' + it.dim + '维度</div></div>' +
      '<span class="ii-sc" style="' + (isUp ? '' : 'color:var(--berry)') + '">' + Math.round(it.score) + '</span></div>';
  }

  function buildGaugeRow(label, val, color) {
    var v = Math.round(val);
    return '<div class="gauge-row"><span class="gr-label">' + label + '</span>' +
      '<div class="gr-track"><div class="gr-fill" style="width:' + v + '%;background:' + color + '"></div></div>' +
      '<span class="gr-val" style="color:' + color + '">' + v + '</span></div>';
  }

  function dimNote(k, s) {
    if (k === 'hardware') return s >= 85 ? '硬件突出,市场筛选中的硬通货。' : s >= 70 ? '硬件扎实,有稳定可见竞争力。' : s >= 55 ? '硬件中等,需靠亮点突破。' : '硬件偏弱,主要提升方向。';
    if (k === 'soft') return s >= 80 ? '软实力出众,能放大硬件价值。' : s >= 65 ? '软实力良好,关系经营有基础。' : '软实力待提升,建议加强情绪与沟通。';
    if (k === 'family') return s >= 80 ? '家庭背景优越,提供长期安全感。' : s >= 60 ? '家庭背景平稳,负担可控。' : '家庭背景存在负担,需管理预期。';
    return s >= 80 ? '市场稀缺度高,议价空间大。' : s >= 65 ? '市场位置健康,匹配效率良好。' : '市场供需承压,建议调整预期或地域。';
  }

  function buildAnalysis(r, g) {
    var gw = r.gender === 'male' ? '男生' : '女生';
    var p1 = '作为相亲市场的' + gw + '参与者,你的综合定位是 <mark class="key">' + g.grade + ' · ' + g.label + '</mark>,总分 ' + Math.round(r.total) + ',处于同龄同性池约前 ' + (100 - r.percentile) + '% 的位置。' + g.desc;
    var dims = [['hardware', '个人硬件'], ['soft', '软实力'], ['family', '家庭背景'], ['market', '市场供需']];
    var hi = dims[0], lo = dims[0];
    dims.forEach(function (d) { if (r.dims[d[0]] > r.dims[hi[0]]) hi = d; if (r.dims[d[0]] < r.dims[lo[0]]) lo = d; });
    var p2 = '你的<strong style="color:var(--accent)">最强维度是' + hi[1] + '</strong>,这是你在市场里的核心筹码;而<strong style="color:var(--berry)">' + lo[1] + '</strong>是当前的拉分项,也是性价比最高的提升方向。';
    var m = r.market;
    var p3 = '市场供需层面:同池竞争力指数 <mark class="key">' + Math.round(m.competitiveness) + '</mark>,匹配可能性约 <mark class="key">' + Math.round(m.matchPossibility) + '%</mark>。' +
      (m.expectPenalty >= 24 ? '你设的择偶要求偏严苛,匹配池偏小,建议核心项保留、非核心项放宽。' :
       m.expectPenalty >= 15 ? '你的择偶要求适中,匹配池健康,保持当前策略即可。' :
       '你的择偶要求偏宽松,匹配池较大,可适当提高标准筛选更优质对象。');
    return '<p>' + p1 + '</p><p>' + p2 + '</p><p>' + p3 + '</p>';
  }

  function buildMatchAdvice(r, g) {
    var sorted = r.items.slice().sort(function (a, b) { return b.score - a.score; });
    var strengths = sorted.slice(0, 3).map(function (it) { return it.name; });
    var html = '<div class="mc-title">适合你重点接触的对象</div><div class="match-tags">';
    if (r.total >= 75) html += '<span class="match-tag">条件相当或略高</span><span class="match-tag">能欣赏你的优势</span><span class="match-tag">同城优质圈层</span>';
    else if (r.total >= 60) html += '<span class="match-tag">条件互补型</span><span class="match-tag">三观契合优先</span><span class="match-tag">扩大社交半径</span>';
    else html += '<span class="match-tag">务实匹配型</span><span class="match-tag">看重你的成长性</span><span class="match-tag">优先扩大接触面</span>';
    html += '</div>';
    html += '<div class="mc-title" style="margin-top:1rem;">基于你的优势 ' + strengths.join(' · ') + '</div><div class="match-tags">';
    strengths.forEach(function (s) { html += '<span class="match-tag">' + s + '突出</span>'; });
    html += '<span class="match-tag">可主动释放信号</span></div>';
    html += '<div class="mc-title" style="margin-top:1rem;">提升建议</div>';
    sorted.slice(-2).forEach(function (it) { html += '<div class="mc-tip">· ' + adviceFor(it.name) + '</div>'; });
    return html;
  }

  function adviceFor(name) {
    var map = {
      '年龄': '年龄不可逆,但可通过状态管理与形象管理保持红利。', '身高': '身高难改,建议在穿搭比例、体态与自信气场上下功夫。',
      '外貌': '外貌提升空间大:形象管理、健身、皮肤与发型是性价比最高的三项投入。', '体型': '体型是最值得投入的提升项,规律健身3个月可见明显变化。',
      '学历': '学历可通过在职提升补充,更建议用专业能力与谈吐展现智力魅力。', '收入': '收入是男生核心筹码,聚焦主业成长;女生可适度降低对方收入硬指标扩大池子。',
      '资产': '制定清晰的资产积累计划,一线城市可考虑先上车再置换。', '穿搭打扮': '穿搭是投入产出比最高的外在提升,找对风格比花钱更重要。',
      '情商沟通': '沟通是可习得技能,建议刻意练习倾听、共情与表达。', '情绪稳定': '情绪稳定性是长期关系的基石,可通过冥想、运动与认知重构改善。',
      '兴趣丰富': '培养 1-2 个能社交的兴趣,既提升生活质感也扩大接触面。', '生活品味': '从穿搭、居住空间、饮食细节入手,审美是可积累的软资产。',
      '价值观包容': '多接触不同圈层与观点,练习"先理解再回应",减少评判。', '幽默感': '幽默感可练习:多积累段子、学会自嘲,轻松氛围比搞笑更重要。',
      '上进心': '上进心是吸引力放大器,有清晰目标并付诸行动的人自带光芒。', '家庭经济': '家庭经济短期难改,建议通过自身收入提升对冲,并管理对方预期。',
      '父母状况': '提前规划父母养老与保障,降低未来关系中的不确定性。', '户籍地域': '地域可通过职业迁移优化,新一线是性价比最高的折中。',
      '社会关系': '主动经营高质量社交圈,相亲中"被介绍"的转化率远高于陌生接触。', '独生子女': '独生子女是中性标签,展现独立与责任感即可转化为优势。',
      '父母婚姻': '父母婚姻不可选,但可通过自身情绪成熟度打消对方顾虑。', '市场供需': '调整择偶预期与目标地域,在竞争较小的池子里你的相对价值更高。'
    };
    return map[name] || '建议针对性提升此项以增强整体竞争力。';
  }

  // ============================================================
  // 理想型匹配模拟器
  // ============================================================
  var IDEAL_FIELDS = [
    { id: 'i_age', label: '年龄', type: 'range', min: 20, max: 50, step: 1, unit: '岁', def: 28, required: true },
    { id: 'i_height', label: '身高', type: 'range', min: 150, max: 200, step: 1, unit: 'cm', def: 175, required: true },
    { id: 'i_looks', label: '外貌水平', type: 'range', min: 1, max: 10, step: 1, unit: '分', def: 7, required: false },
    { id: 'i_education', label: '学历', type: 'chips', required: false,
      options: ['不限', '本科即可', '重点本科', '985/名校', '硕士及以上'] },
    { id: 'i_income', label: '收入水平', type: 'chips', required: false,
      options: ['不限', '8千+', '1.5万+', '2.5万+', '4万+'] },
    { id: 'i_personality', label: '性格特质', type: 'chips', required: false, multi: true, max: 3,
      options: ['情绪稳定', '幽默有趣', '温柔体贴', '独立自主', '有上进心', '顾家型', '社交达人', '文艺范'] },
    { id: 'i_family', label: '家庭条件', type: 'chips', required: false,
      options: ['不限', '小康以上', '中产以上', '无负担', '本地有房'] }
  ];

  var idealState = {};

  function renderIdealFields(result) {
    idealState = {};
    IDEAL_FIELDS.forEach(function (f) {
      idealState[f.id] = f.type === 'chips' ? (f.multi ? [] : 0) : f.def;
    });

    var container = $('ideal-fields');
    var html = '';
    IDEAL_FIELDS.forEach(function (f) {
      html += '<div class="ideal-field">';
      html += '<div class="if-label">' + f.label + ' <span class="if-tag' + (f.required ? '' : ' flex') + '">' + (f.required ? '必选' : '可选') + '</span></div>';
      if (f.type === 'range') {
        html += '<div class="ideal-range">';
        html += '<input type="range" id="' + f.id + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + f.def + '">';
        html += '<span class="ir-val" id="rv-' + f.id + '">' + f.def + f.unit + '</span>';
        html += '</div>';
      } else if (f.type === 'chips') {
        html += '<div class="ideal-pick">';
        f.options.forEach(function (opt, i) {
          html += '<span class="ideal-chip" data-field="' + f.id + '" data-i="' + i + '">' + opt + '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;

    // 绑定滑块
    IDEAL_FIELDS.forEach(function (f) {
      if (f.type === 'range') {
        var el = $(f.id), rv = $('rv-' + f.id);
        el.addEventListener('input', function () {
          idealState[f.id] = Number(el.value);
          rv.textContent = el.value + f.unit;
        });
      }
    });
    // 绑定 chips
    document.querySelectorAll('.ideal-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var fid = chip.getAttribute('data-field');
        var fi = Number(chip.getAttribute('data-i'));
        var field = IDEAL_FIELDS.find(function (x) { return x.id === fid; });
        if (field.multi) {
          var arr = idealState[fid];
          var pos = arr.indexOf(fi);
          if (pos > -1) { arr.splice(pos, 1); chip.classList.remove('on'); }
          else { if (arr.length >= field.max) return; arr.push(fi); chip.classList.add('on'); }
        } else {
          idealState[fid] = fi;
          document.querySelectorAll('.ideal-chip[data-field="' + fid + '"]').forEach(function (c) { c.classList.remove('on'); });
          chip.classList.add('on');
        }
      });
    });

    $('btn-ideal-calc').addEventListener('click', function () {
      var res = computeIdealMatch(result);
      renderIdealResult(res, result);
    });
  }

  function computeIdealMatch(result) {
    var g = state.gender;
    var myAge = state.answers.age;
    var myScore = result.total;
    var myDims = result.dims;

    // 理想型的"市场分数"(根据设定的条件估算)
    var iAge = idealState.i_age;
    var iHeight = idealState.i_height;
    var iLooks = idealState.i_looks;
    var iEdu = idealState.i_education;
    var iInc = idealState.i_income;
    var iFam = idealState.i_family;

    var targetGender = g === 'male' ? 'female' : 'male';
    var iAgeScore = ageScore(targetGender, iAge);
    var iHeightScore = heightScore(targetGender, iHeight);
    var iLooksScore = sliderScore(iLooks);

    var eduScores = [70, 65, 74, 86, 84];
    var iEduScore = eduScores[iEdu] || 70;

    var incScores = [70, 64, 74, 86, 92];
    var iIncScore = incScores[iInc] || 70;

    var famScores = [70, 78, 85, 80, 82];
    var iFamScore = famScores[iFam] || 70;

    // 理想型总分(用目标性别的权重)
    var tDW = DIM_WEIGHTS[targetGender];
    var tHW = HW_WEIGHTS[targetGender];
    var iHardware = iAgeScore * tHW.age + iHeightScore * tHW.height + iLooksScore * tHW.looks + iEduScore * tHW.education + iIncScore * tHW.income + 80 * tHW.asset + 80 * tHW.bodyType + 75 * tHW.grooming;
    var iSoft = 72;
    var iFamily = iFamScore;
    var iMarket = 70;
    var iTotal = iHardware * tDW.hardware + iSoft * tDW.soft + iFamily * tDW.family + iMarket * tDW.market;

    // 匹配度 = 双向吸引 + 条件互补 + 现实概率
    // 1. 你配得上TA吗(你的分 vs TA的分)
    var gap = Math.abs(myScore - iTotal);
    var scoreMatch = clamp(100 - gap * 1.2, 20, 98);

    // 2. 年龄差匹配
    var ageDiff = Math.abs(myAge - iAge);
    var ageMatch = ageDiff <= 3 ? 95 : ageDiff <= 5 ? 85 : ageDiff <= 8 ? 70 : ageDiff <= 12 ? 50 : 30;

    // 3. 现实稀缺度(条件越高越难遇到)
    var rarity = 100;
    if (iLooks >= 8) rarity -= 15;
    if (iEdu >= 3) rarity -= 8;
    if (iInc >= 3) rarity -= 12;
    if (iFam >= 2) rarity -= 10;
    if (iHeight >= (targetGender === 'male' ? 180 : 168)) rarity -= 8;
    var encounterRate = clamp(rarity, 15, 90);

    // 4. 性格匹配(选了几个性格特质)
    var iPers = idealState.i_personality || [];
    var personalityBonus = iPers.length > 0 ? Math.min(iPers.length * 4, 10) : 5;

    // 综合匹配度
    var matchScore = Math.round(scoreMatch * 0.45 + ageMatch * 0.25 + encounterRate * 0.20 + personalityBonus * 0.10);
    matchScore = clamp(matchScore, 15, 97);

    // 维度分解
    var breakdown = [
      { name: '综合分差', val: Math.round(scoreMatch), color: 'var(--accent)' },
      { name: '年龄匹配', val: Math.round(ageMatch), color: 'var(--mint)' },
      { name: '遇到概率', val: Math.round(encounterRate), color: 'var(--lilac)' },
      { name: '性格加分', val: Math.round(personalityBonus * 10), color: 'var(--gold)' }
    ];

    var verdict, detail;
    if (matchScore >= 80) {
      verdict = '天作之合';
      detail = '你设定的理想型条件和你的市场定位非常匹配,年龄差也在理想范围内。这类人在你的圈层中虽然有一定稀缺度,但并非遥不可及。保持当前策略,主动接触就好。';
    } else if (matchScore >= 65) {
      verdict = '很有希望';
      detail = '整体匹配度不错,但存在一定落差。建议在核心条件上保留,次要条件适当放宽,能显著提升遇到合适人选的概率。';
    } else if (matchScore >= 45) {
      verdict = '需要将就';
      detail = '你设定的理想型条件明显高于你的市场定位,或这类人比较稀缺。要么提升自身竞争力,要么调整预期,在"理想"和"现实"之间找到平衡点。';
    } else {
      verdict = '差距较大';
      detail = '理想型与你的市场定位差距明显,现实中遇到的概率也偏低。建议重新审视择偶标准,聚焦2-3个最核心的条件,其余适当放宽。';
    }

    return {
      matchScore: matchScore, verdict: verdict, detail: detail, breakdown: breakdown,
      iTotal: Math.round(iTotal), encounterRate: Math.round(encounterRate)
    };
  }

  function renderIdealResult(res, result) {
    var el = $('ideal-result');
    var circumference = 2 * Math.PI * 54;
    var offset = circumference * (1 - res.matchScore / 100);

    var html = '<div class="ideal-score-wrap">';
    html += '<div class="ideal-score-ring">';
    html += '<svg viewBox="0 0 120 120"><circle class="isr-bg" cx="60" cy="60" r="54"/><circle class="isr-fg" cx="60" cy="60" r="54" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '"/></svg>';
    html += '<div class="ideal-score-num"><span class="n" id="ideal-num">0</span><span class="u">匹配度</span></div>';
    html += '</div>';
    html += '<div class="ideal-verdict">' + res.verdict + '</div>';
    html += '<div class="ideal-detail">' + res.detail + '</div>';
    html += '<div class="ideal-breakdown">';
    res.breakdown.forEach(function (b) {
      html += '<div class="ideal-bd-row"><span class="ibd-name">' + b.name + '</span>';
      html += '<div class="ibd-track"><div class="ibd-fill" style="width:' + b.val + '%;background:' + b.color + '"></div></div>';
      html += '<span class="ibd-val" style="color:' + b.color + '">' + b.val + '</span></div>';
    });
    html += '</div>';
    html += '<div class="ideal-detail" style="margin-top:0.8rem;">理想型市场分约 <strong style="color:var(--accent);font-family:var(--font-mono)">' + res.iTotal + '</strong> · 你的市场分 <strong style="color:var(--accent);font-family:var(--font-mono)">' + Math.round(result.total) + '</strong> · 现实中遇到的概率约 <strong style="color:var(--lilac);font-family:var(--font-mono)">' + res.encounterRate + '%</strong></div>';
    html += '</div>';

    el.innerHTML = html;
    el.classList.add('show');

    // 动画数字 + 环形进度
    var numEl = $('ideal-num');
    var fg = el.querySelector('.isr-fg');
    var cur = 0, target = res.matchScore;
    var step = Math.max(1, Math.ceil(target / 30));
    var timer = setInterval(function () {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(timer); }
      numEl.textContent = cur;
      fg.style.strokeDashoffset = circumference * (1 - cur / 100);
    }, 30);

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

})();
