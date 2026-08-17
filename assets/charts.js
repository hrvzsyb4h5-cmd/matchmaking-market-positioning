/* Radar chart rendering for the matchmaking positioning result */
window.MatchChart = (function () {
  var chart = null;

  function render(scores) {
    var el = document.getElementById('chart-radar');
    if (!el || typeof echarts === 'undefined') return;

    var style = getComputedStyle(document.documentElement);
    var accent = style.getPropertyValue('--accent').trim();
    var accent2 = style.getPropertyValue('--accent2').trim();
    var mint = style.getPropertyValue('--mint').trim();
    var lilac = style.getPropertyValue('--lilac').trim();
    var gold = style.getPropertyValue('--gold').trim();
    var ink = style.getPropertyValue('--ink').trim();
    var muted = style.getPropertyValue('--muted').trim();
    var rule = style.getPropertyValue('--rule').trim();

    if (chart) { chart.dispose(); }
    chart = echarts.init(el, null, { renderer: 'canvas' });

    var indicators = [
      { name: '个人硬件', max: 100, color: accent },
      { name: '软实力', max: 100, color: mint },
      { name: '家庭背景', max: 100, color: lilac },
      { name: '市场供需', max: 100, color: gold }
    ];
    var values = [
      Math.round(scores.hardware), Math.round(scores.soft),
      Math.round(scores.family), Math.round(scores.market)
    ];
    var dimColors = [accent, mint, lilac, gold];

    chart.setOption({
      animation: true, animationDuration: 900, animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item', appendToBody: true,
        backgroundColor: 'rgba(61,34,48,0.92)', borderColor: accent, borderWidth: 1,
        textStyle: { color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: 12 }
      },
      radar: {
        indicator: indicators, center: ['50%', '54%'], radius: '64%',
        shape: 'polygon', splitNumber: 4,
        axisName: {
          color: ink,
          fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif', padding: [6, 8]
        },
        axisLine: { lineStyle: { color: rule, width: 1 } },
        splitLine: { lineStyle: { color: rule, width: 1 } },
        splitArea: { areaStyle: { color: ['rgba(232,90,140,0.015)', 'rgba(232,90,140,0.035)', 'rgba(232,90,140,0.015)', 'rgba(232,90,140,0.035)'] } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values, name: '竞争力',
          symbol: 'circle', symbolSize: 8,
          lineStyle: { color: accent, width: 2.5 },
          itemStyle: { color: accent, borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: { type: 'radial', x: 0.5, y: 0.5, r: 0.7,
              colorStops: [ { offset: 0, color: accent + '55' }, { offset: 1, color: accent2 + '22' } ] }
          },
          label: {
            show: true, color: accent,
            fontWeight: 700, fontFamily: 'GeistMono, monospace', fontSize: 13,
            formatter: function (p) { return p.value; },
            backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 4, padding: [2, 5]
          }
        }]
      }]
    });

    window.addEventListener('resize', function () { if (chart) chart.resize(); });
  }

  return { render: render };
})();
