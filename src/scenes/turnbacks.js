const VIEW = [0, 0, 960, 440];
const DURATION = 14000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const switchNode = (x, y, labelText) => ({ type: 'switch', x, y, label: labelText });
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
  title: '站后折返：在站台后方专用折返线换向',
  summary: '列车先在站台完成上下客，再空车驶入站台后方的折返线；在那里换端并转入另一站台股道，返回时重新载客。',
  duration: DURATION,
  phases: [
    phase(0, '到达站台', '列车进入终点站到达站台，站台后方折返线空闲。'),
    phase(2500, '上下客完成', '乘客下车与新一批乘客上车结束，列车准备驶离站台。'),
    phase(4500, '驶入站后折返线', '列车空车越过站台，进入专用折返线及道岔区。'),
    phase(7000, '折返线换端', '列车在折返线停稳并改变运行端，站台可继续接发其他列车。'),
    phase(9500, '转入出发站台', '道岔转换，列车驶入另一侧站台股道，准备重新载客。'),
    phase(12000, '载客发车', '列车在出发站台完成乘降后，沿相反方向离开终点站。'),
  ],
  legends: legends([{ label: '站后折返线', tone: 'mint', shape: 'dash' }]),
  notes: [
    '折返作业移到站台后方，到达与出发客流可分布在不同站台。',
    '站台咽喉不再被同一列车的换向过程长时间占用，能力通常高于站前折返。',
    '代价是需要更长的站后配线、额外用地，以及列车空走的折返时间。',
  ],
  spec: turnbackSpec({
    elements: [
      zone('rt-platform-zone', 250, 125, 360, 190, '到达 / 出发站台'),
      zone('rt-tail-zone', 630, 125, 260, 190, '站后折返线'),
      track('M40 170H920'),
      track('M40 270H920'),
      track('M800 170C850 170 850 270 800 270', 'mint'),
      { type: 'platform', x: 320, y: 200, w: 220, h: 40, label: '终点站岛式站台', tone: 'amber' },
      switchNode(800, 170, 'W1'),
      switchNode(800, 270, 'W2'),
      signal('rt-s1', 210, 170, 'S1'),
      signal('rt-s2', 210, 270, 'S2'),
      arrow('M70 145H220', 'cyan', '到达方向', 145, 135),
      arrow('M220 295H70', 'mint', '发车方向', 145, 310),
      label(360, 405, '折返线在站台后方 · 到达站台可较快释放', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'rt-route', d: 'M-100 170H500H800C850 170 850 270 800 270H500H-100' }],
    trains: [
      train('rt-train', 'rt-route', 'T 8201', 'cyan', [[0, 0], [2500, 0.3], [4500, 0.42], [7000, 0.58], [8500, 0.62], [9500, 0.72], [12000, 0.86], [DURATION, 1]]),
    ],
    flows: [
      flow('M70 145H240', [[0, 2500]], 'cyan'),
      flow('M540 145H760', [[4500, 7000]], 'amber'),
      flow('M800 170C850 170 850 270 800 270', [[7000, 9500]], 'mint'),
      flow('M240 295H70', [[12000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('rt-c1', '列车到达上行站台', 'ARRIVAL PLATFORM', [[0, 2500]], 'cyan', 255, 'M620 344L450 170'),
      callout('rt-c2', '站台完成乘降', 'PASSENGER EXCHANGE', [[2500, 4500]], 'mint', 255, 'M620 344L430 220'),
      callout('rt-c3', '空车驶入站后折返线', 'EMPTY TO TAIL TRACK', [[4500, 7000]], 'amber', 275, 'M620 344L760 170'),
      callout('rt-c4', '折返线换端 · 站台释放', 'CHANGE END OFF-PLATFORM', [[7000, 9500]], 'rose', 290, 'M620 344L830 220'),
      callout('rt-c5', '转入出发站台并发车', 'DEPARTURE PLATFORM', [[9500, DURATION]], 'mint', 275, 'M620 344L430 270'),
    ],
    zones: [
      zoneStates('rt-platform-zone', '到达 / 出发站台', [
        { time: 0, state: 'occupied', text: '到达站台 · 列车占用' },
        { time: 4500, state: 'clear', text: '站台 · 已释放' },
        { time: 9500, state: 'active', text: '出发站台 · 重新载客' },
        { time: 12000, state: 'clear', text: '站台 · 空闲' },
      ]),
      zoneStates('rt-tail-zone', '站后折返线', [
        { time: 4500, state: 'occupied', text: '折返线 · 列车占用' },
        { time: 9500, state: 'protected', text: '折返线 · 进路解锁' },
        { time: 11000, state: 'clear', text: '折返线 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('rt-s1', [
        { time: 2500, state: 'stop', text: 'S1 站台占用' },
        { time: 4500, state: 'caution', text: 'S1 驶入折返线' },
        { time: 9500, state: 'clear', text: 'S1 可接后续列车' },
      ]),
      signalStates('rt-s2', [
        { time: 9500, state: 'caution', text: 'S2 折返进站台' },
        { time: 12000, state: 'clear', text: 'S2 发车开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车进入终点站到达站台' },
      { time: 2500, text: '02 / 上下客完成，准备空车折返' },
      { time: 4500, text: '03 / 列车驶向站后折返线' },
      { time: 7000, text: '04 / 折返线换端，站台释放' },
      { time: 9500, text: '05 / 转入另一侧出发站台' },
      { time: 12000, text: '06 / 重新载客后反向发车' },
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
