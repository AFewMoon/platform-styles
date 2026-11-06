const VIEW = [0, 0, 960, 440];
const DURATION = 14000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const switchNode = (x, y, labelText, options = {}) => ({ type: 'switch', x, y, label: labelText, ...options });
const label = (x, y, text, options = {}) => ({ type: 'text', x, y, text, ...options });
const arrow = (d, tone = 'neutral', labelText, labelX, labelY) => ({ type: 'arrow', d, tone, label: labelText, labelX, labelY });
const flow = (d, visible, tone = 'cyan') => ({ d, visible, tone });

function callout(id, title, subtext, visible, tone = 'cyan', w = 260, leaderD) {
  return { id, x: 620, y: 344, w, h: 54, title, subtext, visible, tone, leaderD };
}

function train(id, path, labelText, tone, keyframes, extra = {}) {
  return { id, path, label: labelText, tone, keyframes, ...extra };
}

function zoneStates(id, labelText, events = []) {
  return { id, states: [{ time: 0, state: 'clear', text: `${labelText} · 空闲` }, ...events] };
}

function signalStates(id, events = []) {
  return { id, states: [{ time: 0, state: 'clear', text: `${id.toUpperCase()} 开放` }, ...events] };
}

function legends(items = []) {
  return [
    { label: '到达 / 折返列车', tone: 'cyan', shape: 'line' },
    { label: '进路占用', tone: 'rose', shape: 'block' },
    { label: '渡线 / 折返线', tone: 'amber', shape: 'dash' },
    ...items,
  ];
}

function turnbackSpec({ elements, routes, trains, flows, callouts, zones = [], signals = [], dynamicText }) {
  return {
    viewBox: VIEW,
    elements,
    routes,
    trains,
    flows,
    callouts,
    zones,
    signals,
    texts: [{ x: 480, y: 70, class: 'dynamic-text', align: 'middle', tone: 'cyan', states: dynamicText }],
  };
}

const frontTurnback = {
  id: 'front-turnback',
  short: '站前折返',
  title: '站前折返：借站台前方渡线换向',
  summary: '渡线设在列车到达一侧。列车在站台完成上下客并换端后，先沿原股道退回，再经站前渡线转入相反方向的股道。',
  duration: DURATION,
  phases: [
    phase(0, '列车到达', '列车沿上行股道进入终点站，站前渡线暂时未被折返进路占用。'),
    phase(2800, '站台停妥', '列车在站台停稳，乘客上下车；司机准备换到另一端驾驶室。'),
    phase(5000, '换端完成', '列车改变运行端，但尚未移动；出站进路需要等咽喉区空闲。'),
    phase(6500, '反向退出站台', '列车沿原股道向站前方向退出，占用站台前方咽喉。'),
    phase(8500, '经渡线转入下行', '道岔转换，列车通过交叉渡线进入相反方向的股道。'),
    phase(11000, '折返发车', '列车以相反方向发车；此时渡线区才逐渐解锁。'),
  ],
  legends: legends([{ label: '司机换端', tone: 'mint', shape: 'dot' }]),
  notes: [
    '站前折返不必建设很长的站后折返线，土建相对紧凑。',
    '折返列车占用站台前方咽喉，容易与同时进站或出站的列车产生进路交叉。',
    '“站前 / 站后”以列车到达方向为参照；不同线路资料可能采用相反视角的称呼。',
  ],
  spec: turnbackSpec({
    elements: [
      zone('ft-throat', 600, 125, 180, 190, '站前咽喉 / 渡线区'),
      zone('ft-platform-zone', 330, 150, 260, 140, '终点站站台'),
      track('M40 170H920'),
      track('M40 270H920'),
      track('M650 170C690 170 680 270 720 270', 'amber'),
      { type: 'platform', x: 350, y: 200, w: 220, h: 40, label: '终点站岛式站台', tone: 'amber' },
      switchNode(650, 170, 'W1'),
      switchNode(720, 270, 'W2'),
      signal('ft-s1', 790, 170, 'S1'),
      signal('ft-s2', 790, 270, 'S2'),
      arrow('M850 145H740', 'cyan', '到达方向', 795, 135),
      arrow('M740 295H850', 'mint', '发车方向', 795, 310),
      label(360, 405, '渡线位于站台到达端 · 折返占用咽喉区', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'ft-route', d: 'M1060 170H500H650C690 170 680 270 720 270H1060' }],
    trains: [
      train('ft-train', 'ft-route', 'T 8101', 'cyan', [[0, 0], [2800, 0.44], [3400, 0.46], [6500, 0.46], [8500, 0.6], [11000, 0.78], [DURATION, 1]]),
    ],
    flows: [
      flow('M850 145H700', [[0, 2800]], 'cyan'),
      flow('M520 145H640', [[6500, 8500]], 'rose'),
      flow('M650 170C690 170 680 270 720 270', [[8500, 11000]], 'amber'),
      flow('M740 295H880', [[11000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('ft-c1', '列车沿上行股道到达', 'ARRIVAL ON PLATFORM TRACK', [[0, 2800]], 'cyan', 290, 'M620 344L600 170'),
      callout('ft-c2', '停站上下客 · 司机换端', 'CHANGE DRIVING END', [[2800, 6500]], 'mint', 275, 'M620 344L480 220'),
      callout('ft-c3', '沿原股道反向退出', 'REVERSE TO THROAT', [[6500, 8500]], 'rose', 260, 'M620 344L600 170'),
      callout('ft-c4', '站前渡线切换方向', 'CROSSOVER ROUTE', [[8500, 11000]], 'amber', 260, 'M620 344L690 220'),
      callout('ft-c5', '相反方向发车', 'DEPARTURE COMPLETE', [[11000, DURATION]], 'mint', 255, 'M620 344L800 270'),
    ],
    zones: [
      zoneStates('ft-platform-zone', '终点站站台', [
        { time: 2800, state: 'occupied', text: '终点站站台 · 停站换端' },
        { time: 6500, state: 'clear', text: '终点站站台 · 空闲' },
      ]),
      zoneStates('ft-throat', '站前咽喉', [
        { time: 6500, state: 'occupied', text: '站前咽喉 · 折返占用' },
        { time: 11000, state: 'protected', text: '站前咽喉 · 进路解锁' },
        { time: 12500, state: 'clear', text: '站前咽喉 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('ft-s1', [
        { time: 2800, state: 'stop', text: 'S1 站台占用' },
        { time: 8500, state: 'caution', text: 'S1 折返进路' },
      ]),
      signalStates('ft-s2', [
        { time: 8500, state: 'caution', text: 'S2 渡线限速' },
        { time: 11000, state: 'clear', text: 'S2 发车开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车驶入终点站站台' },
      { time: 2800, text: '02 / 停站上下客，司机换端' },
      { time: 5000, text: '03 / 换端完成，等待折返进路' },
      { time: 6500, text: '04 / 列车沿原股道反向退出' },
      { time: 8500, text: '05 / 经站前渡线转入下行股道' },
      { time: 11000, text: '06 / 反向发车，咽喉区解锁' },
    ],
  }),
};

const rearTurnback = {
  id: 'rear-turnback',
  short: '站后折返',
  title: '站后折返：驶过站台，换端后经渡线回到另一侧',
  summary: '列车先驶过站台，整列进入站后尽头折返线；司机换端后反向运行，经站后渡线转到另一股道，再回到站台另一侧载客。',
  duration: DURATION,
  phases: [
    phase(0, '到达站台', '列车沿上行股道驶入终点站站台，完成到达侧乘降。'),
    phase(2800, '驶过站台', '列车继续向前，越过站台进入站后尽头折返线。'),
    phase(4800, '折返线停稳', '整列车停在尽头线内，列车不转身，只改变驾驶端。'),
    phase(6800, '换端后反向运行', '司机换端，列车反向驶出尽头线，前往站后渡线。'),
    phase(8800, '经渡线转入另一侧', '列车通过站后渡线，从到达股道转入出发股道。'),
    phase(11000, '另一侧载客发车', '列车回到站台另一侧，重新载客后沿相反方向离开。'),
  ],
  legends: legends([
    { label: '站后尽头折返线', tone: 'mint', shape: 'dash' },
    { label: '站后渡线 / 换端', tone: 'amber', shape: 'line' },
  ]),
  notes: [
    '列车先驶过站台并完全进入尽头折返线，再停车换端；车体不转身，视觉上也不是环形掉头。',
    '换端后列车反向运行，经站后渡线从到达股道转入出发股道，再回到站台另一侧。',
    '折返能力取决于尽头线长度、渡线位置以及站后咽喉的占用时间。',
  ],
  spec: turnbackSpec({
    elements: [
      zone('rt-platform-zone', 240, 140, 380, 170, '到达 / 出发站台'),
      zone('rt-tail-zone', 790, 135, 100, 65, '站后尽头折返线'),
      zone('rt-throat-zone', 675, 145, 145, 145, '站后渡线 / 换端区'),
      track('M40 170H860'),
      track('M40 270H700'),
      track('M780 170C740 170 740 270 700 270', 'amber'),
      { type: 'platform', x: 300, y: 200, w: 220, h: 40, label: '终点站岛式站台', tone: 'amber' },
      switchNode(780, 170, 'W1', {
        tone: 'amber',
        highlight: true,
        linkD: 'M780 170C766 170 756 178 750 188',
      }),
      switchNode(700, 270, 'W2', {
        tone: 'amber',
        highlight: true,
        linkD: 'M700 270C716 270 726 262 732 252',
      }),
      signal('rt-s1', 210, 170, 'S1'),
      signal('rt-s2', 210, 270, 'S2'),
      arrow('M70 145H220', 'cyan', '到达方向', 145, 135),
      arrow('M220 295H70', 'mint', '发车方向', 145, 310),
      label(360, 405, '驶过站台 → 尽头线换端 → 经渡线进入另一侧', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'rt-route', d: 'M-100 170H500H840H780C740 170 740 270 700 270H500H-100' },
    ],
    trains: [
      train('rt-train', 'rt-route', 'T 8201', 'cyan', [
        [0, 0],
        [2500, 0.29],
        [3200, 0.312],
        [4800, 0.312],
        [6800, 0.489],
        [7600, 0.489],
        [8200, 0.52],
        [9000, 0.584],
        [10800, 0.688],
        [11400, 0.688],
        [DURATION, 1],
      ]),
    ],
    flows: [
      flow('M70 145H240', [[0, 2800]], 'cyan'),
      flow('M540 145H760', [[2800, 4800]], 'amber'),
      flow('M780 170H840', [[4800, 6800]], 'mint'),
      flow('M780 170C740 170 740 270 700 270', [[6800, 9000]], 'amber'),
      flow('M240 295H70', [[11000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('rt-c1', '列车进站并驶过站台', 'PASS PLATFORM FIRST', [[0, 2800]], 'cyan', 270, 'M620 344L470 170'),
      callout('rt-c2', '站台乘降完成', 'ARRIVAL DWELL', [[2800, 4800]], 'mint', 245, 'M620 344L430 220'),
      callout('rt-c3', '进入站后尽头折返线', 'TAIL TRACK BEHIND PLATFORM', [[4800, 6800]], 'amber', 295, 'M620 344L800 170'),
      callout('rt-c4', '停车换端 · 不是掉头', 'CHANGE CAB, NOT TURN BODY', [[6800, 8800]], 'rose', 295, 'M620 344L810 180'),
      callout('rt-c5', '经站后渡线进入另一侧', 'REVERSE THROUGH CROSSOVER', [[8800, 11000]], 'amber', 285, 'M620 344L740 220'),
      callout('rt-c6', '另一侧载客后发车', 'DEPART FROM OPPOSITE SIDE', [[11000, DURATION]], 'mint', 285, 'M620 344L430 270'),
    ],
    zones: [
      zoneStates('rt-platform-zone', '到达 / 出发站台', [
        { time: 0, state: 'occupied', text: '到达侧站台 · 列车乘降' },
        { time: 4800, state: 'clear', text: '站台 · 列车已驶过' },
        { time: 10800, state: 'active', text: '出发侧站台 · 重新载客' },
        { time: 11400, state: 'clear', text: '站台 · 列车离站' },
      ]),
      zoneStates('rt-tail-zone', '站后尽头折返线', [
        { time: 4800, state: 'occupied', text: '尽头线 · 列车进入' },
        { time: 6800, state: 'active', text: '尽头线 · 换端作业' },
        { time: 8200, state: 'clear', text: '尽头线 · 列车退出' },
      ]),
      zoneStates('rt-throat-zone', '站后渡线', [
        { time: 8200, state: 'protected', text: '渡线 · 反向进路' },
        { time: 10800, state: 'clear', text: '渡线 · 进路解锁' },
      ]),
    ],
    signals: [
      signalStates('rt-s1', [
        { time: 0, state: 'clear', text: 'S1 到达进路开放' },
        { time: 3200, state: 'stop', text: 'S1 站台占用' },
        { time: 4800, state: 'caution', text: 'S1 列车驶向尽头线' },
        { time: 10800, state: 'clear', text: 'S1 可接后续列车' },
      ]),
      signalStates('rt-s2', [
        { time: 0, state: 'stop', text: 'S2 等待折返进路' },
        { time: 9000, state: 'caution', text: 'S2 列车经渡线进入' },
        { time: 11400, state: 'clear', text: 'S2 发车开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车进入终点站站台' },
      { time: 2800, text: '02 / 列车驶过站台，前往尽头折返线' },
      { time: 4800, text: '03 / 整列车停稳，司机换端而非掉头' },
      { time: 6800, text: '04 / 反向驶出尽头线，接近站后渡线' },
      { time: 8800, text: '05 / 经渡线从到达股道转入出发股道' },
      { time: 11000, text: '06 / 回到站台另一侧，载客后反向发车' },
    ],
  }),
};

const balloonLoop = {
  id: 'balloon-loop',
  short: '灯泡线',
  title: '灯泡线：列车沿环形线路连续掉头',
  summary: '列车驶入一个大半径环形线路，沿同一运行方向绕回车站另一侧，不必停车换端即可完成方向转换。',
  duration: DURATION,
  phases: [
    phase(0, '到达站台', '列车沿到达线驶入终点站，环形折返线位于站台远端。'),
    phase(2500, '站台乘降', '列车短暂停站，乘客上下车；司机无需在站台换端。'),
    phase(4500, '驶入灯泡线', '列车继续向前，进入连续向右转弯的环形线路。'),
    phase(7000, '环线连续运行', '列车沿曲线完成约 180° 方向变化，车头始终朝运行方向。'),
    phase(10000, '回到车站另一侧', '列车从环线回到出发站台，方向已与到达时相反。'),
    phase(12000, '载客离站', '列车在出发侧完成乘降后直接驶离，不占用交叉渡线。'),
  ],
  legends: legends([{ label: '环形折返线', tone: 'mint', shape: 'dash' }]),
  notes: [
    '灯泡线的核心优势是连续运行、无需换端，适合有可用土地且曲线半径满足要求的地点。',
    '代价是占地较大、空走距离更长，曲线限速也会影响周转时间。',
    '部分系统把用于掉头的单环状线路称为气球线 / 灯泡线；名称因地区而异。',
  ],
  spec: turnbackSpec({
    elements: [
      zone('bl-loop-zone', 600, 95, 310, 250, '灯泡线 / 连续折返'),
      zone('bl-platform-zone', 230, 140, 330, 160, '终点站双站台'),
      track('M40 170H700C820 170 890 190 890 220C890 250 820 270 700 270H40'),
      track('M40 170H700C820 170 890 190 890 220C890 250 820 270 700 270H40', 'mint', { thin: true, siding: true }),
      { type: 'platform', x: 280, y: 125, w: 220, h: 28, label: '到达站台', tone: 'amber' },
      { type: 'platform', x: 280, y: 287, w: 220, h: 28, label: '出发站台', tone: 'mint' },
      signal('bl-s1', 180, 170, 'S1'),
      signal('bl-s2', 180, 270, 'S2'),
      arrow('M60 145H210', 'cyan', '到达方向', 135, 135),
      arrow('M210 295H60', 'mint', '离站方向', 135, 310),
      label(360, 405, '无需换端 · 以空间换取连续运行', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'bl-route', d: 'M-100 170H700C820 170 890 190 890 220C890 250 820 270 700 270H-100' }],
    trains: [
      train('bl-train', 'bl-route', 'T 8301', 'cyan', [[0, 0], [2500, 0.28], [3500, 0.32], [4500, 0.36], [7000, 0.58], [10000, 0.76], [12000, 0.84], [DURATION, 1]]),
    ],
    flows: [
      flow('M60 145H220', [[0, 2500]], 'cyan'),
      flow('M540 145H700C780 145 850 170 880 200', [[4500, 10000]], 'mint'),
      flow('M880 240C850 270 780 295 700 295H540', [[7000, 12000]], 'mint'),
      flow('M220 295H60', [[12000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('bl-c1', '列车到达终点站', 'ARRIVAL SIDE', [[0, 2500]], 'cyan', 245, 'M620 344L390 170'),
      callout('bl-c2', '短暂停站 · 不换端', 'NO CAB CHANGE', [[2500, 4500]], 'mint', 245, 'M620 344L390 220'),
      callout('bl-c3', '列车驶入环形线路', 'ENTER BALLOON LOOP', [[4500, 7000]], 'amber', 270, 'M620 344L760 170'),
      callout('bl-c4', '沿线连续完成掉头', 'CONTINUOUS 180° TURN', [[7000, 10000]], 'cyan', 280, 'M620 344L880 220'),
      callout('bl-c5', '回到另一侧站台并发车', 'DEPARTURE SIDE', [[10000, DURATION]], 'mint', 275, 'M620 344L390 270'),
    ],
    zones: [
      zoneStates('bl-platform-zone', '终点站双站台', [
        { time: 2500, state: 'occupied', text: '到达站台 · 乘降' },
        { time: 4500, state: 'clear', text: '站台 · 列车进入环线' },
        { time: 10000, state: 'active', text: '出发站台 · 重新载客' },
        { time: 12000, state: 'clear', text: '双站台 · 空闲' },
      ]),
      zoneStates('bl-loop-zone', '灯泡线', [
        { time: 4500, state: 'occupied', text: '灯泡线 · 列车占用' },
        { time: 10000, state: 'clear', text: '灯泡线 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('bl-s1', [
        { time: 2500, state: 'stop', text: 'S1 站台占用' },
        { time: 4500, state: 'clear', text: 'S1 环线开放' },
      ]),
      signalStates('bl-s2', [
        { time: 10000, state: 'caution', text: 'S2 环线出清' },
        { time: 12000, state: 'clear', text: 'S2 离站开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车到达终点站' },
      { time: 2500, text: '02 / 停站乘降，司机不换端' },
      { time: 4500, text: '03 / 列车驶入灯泡线' },
      { time: 7000, text: '04 / 沿曲线连续改变方向' },
      { time: 10000, text: '05 / 回到车站另一侧站台' },
      { time: 12000, text: '06 / 完成乘降后直接离站' },
    ],
  }),
};

export const turnbackScenarios = [frontTurnback, rearTurnback, balloonLoop];
