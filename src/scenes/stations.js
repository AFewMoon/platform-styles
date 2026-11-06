const VIEW = [0, 0, 960, 440];
const DURATION = 12000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const platform = (x, y, w, h, label, tone = 'amber') => ({ type: 'platform', x, y, w, h, label, tone });
const building = (x, y, w, h, label) => ({ type: 'building', x, y, w, h, label });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const label = (x, y, text, options = {}) => ({ type: 'text', x, y, text, ...options });
const arrow = (d, tone = 'neutral', labelText, labelX, labelY) => ({
  type: 'arrow', d, tone, label: labelText, labelX, labelY,
});
const flow = (d, visible, tone = 'cyan') => ({ d, visible, tone });

function callout(id, x, y, title, subtext, visible, tone = 'cyan', w = 220, leaderD) {
  const calloutY = y < 100 ? 344 : y;
  const normalizedLeader = leaderD?.replace(/M620 (?:106|80)/, `M620 ${calloutY}`);
  return { id, x, y: calloutY, w, h: 54, title, subtext, visible, tone, leaderD: normalizedLeader };
}

function passengerGroup(prefix, path, tone, start, end, count = 3, step = 280) {
  return Array.from({ length: count }, (_, index) => {
    const from = start + index * step;
    const to = Math.min(end + index * step, DURATION);
    return {
      id: `${prefix}-${index}`,
      path,
      tone,
      rotation: false,
      scale: 0.78,
      keyframes: [[from, 0], [to, 1]],
      visible: [[from, to]],
    };
  });
}

function train(id, path, labelText, tone = 'cyan', cars = 3, offset = 0) {
  const stopIn = 2600 + offset;
  const stopOut = 8800 + offset;
  return {
    id,
    path,
    label: labelText,
    tone,
    cars,
    keyframes: [[0, 0], [stopIn, 0.48], [stopIn + 500, 0.5], [stopOut, 0.5], [stopOut + 600, 0.56], [DURATION, 1]],
  };
}

function signalStates(prefix) {
  return [
    { time: 0, state: 'clear', text: `${prefix} 开放` },
    { time: 2600, state: 'active', text: `${prefix} 进站` },
    { time: 3200, state: 'stop', text: `${prefix} 停稳` },
    { time: 9200, state: 'caution', text: `${prefix} 出站许可` },
    { time: 10800, state: 'clear', text: `${prefix} 区间开通` },
  ];
}

function stationPhases(extraDetail = {}) {
  return [
    phase(0, '列车进站', extraDetail.approach ?? '列车沿股道减速接近站台，信号开放，候车乘客在站台等待。'),
    phase(2800, '停稳开门', '列车对准停车位置停稳，车门开启；站台上的上下客区域同时进入作业状态。'),
    phase(4200, '下车客流', extraDetail.alight ?? '下车乘客从车门进入站台，再沿通道前往站厅或出站口。'),
    phase(6800, '上车客流', extraDetail.board ?? '候车乘客从站厅进入对应站台，在车门附近完成上车。'),
    phase(9200, '关门确认', '上下客结束，车门关闭；站台与列车间的人流路径清空。'),
    phase(10800, '列车离站', '出站进路建立，列车加速离开，站台恢复候车状态。'),
  ];
}

function stationLegends(items) {
  return [
    { label: '列车 / 股道', tone: 'cyan', shape: 'line' },
    { label: '站台 / 站房', tone: 'amber', shape: 'block' },
    ...items,
  ];
}

function stationSpec({ elements, routes, trains, passengers, flows, callouts, zones, signals, dynamicText }) {
  return {
    viewBox: VIEW,
    elements,
    routes,
    trains,
    passengers,
    flows,
    callouts,
    zones,
    signals,
    texts: [
      {
        x: 480,
        y: 70,
        class: 'dynamic-text',
        align: 'middle',
        tone: 'cyan',
        states: dynamicText,
      },
    ],
  };
}

const sideStation = {
  id: 'station-side',
  short: '侧式站台',
  title: '侧式站台：两座站台，各自对应一个方向',
  summary: '股道分列在两座侧式站台外侧。乘客需要按去向选择站台，两股客流通常由跨线通道或站厅连接。',
  duration: DURATION,
  phases: stationPhases({
    alight: '下车乘客从本侧车门进入对应侧式站台，再经站厅或通道离开。',
    board: '上车乘客先确认方向，再进入相应的侧式站台候车。',
  }),
  legends: stationLegends([
    { label: '下车客流', tone: 'rose', shape: 'dot' },
    { label: '上车客流', tone: 'mint', shape: 'dot' },
  ]),
  notes: [
    '两座站台夹在股道外侧，不同方向的候车区天然分开。',
    '换向通常需要经过站厅、天桥或地道，乘客走行距离取决于通道位置。',
    '观察青色列车与两色乘客点：停站阶段同时发生“下车”和“上车”，但路径不应互相穿插。',
  ],
  spec: stationSpec({
    elements: [
      zone('side-upper', 250, 124, 440, 52, '上行候车区'),
      zone('side-lower', 250, 284, 440, 52, '下行候车区'),
      track('M40 180H920'),
      track('M40 280H920'),
      platform(260, 138, 420, 30, '上行侧式站台'),
      platform(260, 292, 420, 30, '下行侧式站台'),
      building(405, 58, 150, 48, '站厅 / 售检票'),
      { type: 'rect', x: 468, y: 106, w: 24, h: 190, radius: 10, class: 'platform is-neutral' },
      label(480, 204, '跨线通道', { tone: 'neutral', size: 10 }),
      signal('side-s1', 100, 180, 'S1'),
      signal('side-s2', 860, 280, 'S2'),
      arrow('M70 125H220', 'cyan', '上行方向', 145, 115),
      arrow('M890 335H740', 'neutral', '下行方向', 815, 350),
      label(480, 382, '两座侧式站台分别服务相反方向 · 站厅承担换向联系', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'side-main', d: 'M-100 180H1060' },
      { id: 'side-out-1', d: 'M350 178C350 140 410 132 460 112' },
      { id: 'side-out-2', d: 'M610 178C610 140 550 132 500 112' },
      { id: 'side-in-1', d: 'M460 112C410 132 350 140 350 178' },
      { id: 'side-in-2', d: 'M500 112C550 132 610 140 610 178' },
    ],
    trains: [train('side-train', 'side-main', 'A 1201')],
    passengers: [
      ...passengerGroup('side-out-a', 'side-out-1', 'rose', 4200, 6100, 3),
      ...passengerGroup('side-out-b', 'side-out-2', 'rose', 4400, 6300, 2),
      ...passengerGroup('side-in-a', 'side-in-1', 'mint', 6800, 8700, 3),
      ...passengerGroup('side-in-b', 'side-in-2', 'mint', 7000, 8900, 2),
    ],
    flows: [
      flow('M100 155H235', [[0, 2800]], 'cyan'),
      flow('M730 180H865', [[9400, DURATION]], 'cyan'),
      flow('M370 125C390 105 430 100 455 108', [[4200, 6800]], 'rose'),
      flow('M455 108C430 100 390 105 370 125', [[6800, 9200]], 'mint'),
    ],
    callouts: [
      callout('side-c1', 620, 52, '车门开启', 'ALIGHTING FIRST', [[3200, 4300]], 'amber', 190, 'M620 106L560 170'),
      callout('side-c2', 620, 52, '下车 → 站厅', 'ONE-WAY PASSENGER FLOW', [[4300, 6800]], 'rose', 230, 'M620 106L535 140'),
      callout('side-c3', 620, 52, '站厅 → 上车', 'BOARDING FROM CORRECT SIDE', [[6800, 9200]], 'mint', 235, 'M620 106L555 140'),
      callout('side-c4', 620, 52, '车门关闭 · 离站', 'ROUTE CLEAR', [[9200, DURATION]], 'cyan', 205, 'M620 106L650 175'),
    ],
    zones: [
      {
        id: 'side-upper',
        states: [
          { time: 0, state: 'clear', text: '上行候车区' },
          { time: 3200, state: 'active', text: '上行站台 · 上下客' },
          { time: 9200, state: 'clear', text: '上行候车区' },
        ],
      },
      {
        id: 'side-lower',
        states: [{ time: 0, state: 'clear', text: '下行候车区（本演示无列车停靠）' }],
      },
    ],
    signals: [
      { id: 'side-s1', states: signalStates('S1') },
      { id: 'side-s2', states: [{ time: 0, state: 'clear', text: 'S2 开放' }] },
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车接近上行侧式站台' },
      { time: 2800, text: '02 / 停稳，车门开启' },
      { time: 4200, text: '03 / 下车客流进入站台与站厅' },
      { time: 6800, text: '04 / 候车乘客按方向进入正确站台' },
      { time: 9200, text: '05 / 关门，清空人流路径' },
      { time: 10800, text: '06 / 列车离站，信号恢复' },
    ],
  }),
};

const islandStation = {
  id: 'station-island',
  short: '岛式站台',
  title: '岛式站台：一座站台服务两侧股道',
  summary: '站台位于两股道之间。相反方向的乘客共用同一座站台，换向无需再次通过站厅，但须辨识列车方向。',
  duration: DURATION,
  phases: stationPhases({
    alight: '两列车的下车乘客从相反车门进入同一座岛式站台，再汇集到中央通道。',
    board: '候车乘客由站厅进入岛式站台，按方向分向站台两侧。',
  }),
  legends: stationLegends([
    { label: '上行下车客流', tone: 'rose', shape: 'dot' },
    { label: '下行下车客流', tone: 'amber', shape: 'dot' },
    { label: '上车客流', tone: 'mint', shape: 'dot' },
  ]),
  notes: [
    '同一座岛式站台服务两股道，换向一般比侧式站台更直接。',
    '站台宽度需要容纳两股相反方向客流，方向标识与广播尤其重要。',
    '对比侧式站台：这里乘客先到中间站台，再选择左、右两侧候车。',
  ],
  spec: stationSpec({
    elements: [
      zone('island-platform-zone', 245, 188, 470, 88, '共用岛式站台'),
      track('M40 170H920'),
      track('M40 290H920'),
      platform(260, 200, 440, 60, '岛式站台 · 双向共用'),
      building(405, 338, 150, 44, '站厅 / 出入口'),
      { type: 'rect', x: 468, y: 260, w: 24, h: 78, radius: 10, class: 'platform is-neutral' },
      label(480, 306, '中央通道', { tone: 'neutral', size: 10 }),
      signal('island-s1', 100, 170, 'S1'),
      signal('island-s2', 860, 290, 'S2'),
      arrow('M70 145H225', 'cyan', '上行', 145, 135),
      arrow('M890 315H735', 'amber', '下行', 815, 330),
      label(480, 405, '两股道共用中间站台 · 左右两侧对应不同方向', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'island-up', d: 'M-100 170H1060' },
      { id: 'island-down', d: 'M1060 290H-100' },
      { id: 'island-out-up', d: 'M360 178C360 205 410 218 470 238L480 338' },
      { id: 'island-out-down', d: 'M600 282C600 255 550 242 490 238L480 338' },
      { id: 'island-in-up', d: 'M480 338L470 238C410 218 360 205 360 178' },
      { id: 'island-in-down', d: 'M480 338L490 238C550 242 600 255 600 282' },
    ],
    trains: [
      train('island-train-up', 'island-up', 'A 1201'),
      train('island-train-down', 'island-down', 'B 0402', 'amber'),
    ],
    passengers: [
      ...passengerGroup('island-out-up', 'island-out-up', 'rose', 4200, 6300, 3),
      ...passengerGroup('island-out-down', 'island-out-down', 'amber', 4400, 6500, 2),
      ...passengerGroup('island-in-up', 'island-in-up', 'mint', 6800, 8800, 3),
      ...passengerGroup('island-in-down', 'island-in-down', 'mint', 7000, 9000, 2),
    ],
    flows: [
      flow('M100 195H250', [[0, 2800]], 'cyan'),
      flow('M860 265H710', [[0, 2800]], 'amber'),
      flow('M390 190C420 220 445 230 470 238', [[4200, 6800]], 'rose'),
      flow('M570 270C540 240 515 230 490 238', [[4200, 6800]], 'amber'),
      flow('M470 238C445 230 420 220 390 190', [[6800, 9200]], 'mint'),
      flow('M490 238C515 230 540 240 570 270', [[6800, 9200]], 'mint'),
    ],
    callouts: [
      callout('island-c1', 620, 52, '两侧列车同时停站', 'ISLAND PLATFORM', [[2800, 4300]], 'cyan', 220, 'M620 106L560 170'),
      callout('island-c2', 620, 52, '两向客流汇入中间站台', 'SHARED CONCOURSE', [[4300, 6800]], 'rose', 235, 'M620 106L520 230'),
      callout('island-c3', 620, 52, '按方向选择站台一侧', 'LEFT / RIGHT BOARDING', [[6800, 9200]], 'mint', 235, 'M620 106L520 230'),
      callout('island-c4', 620, 52, '双向列车离站', 'BOTH ROUTES CLEAR', [[9200, DURATION]], 'cyan', 215, 'M620 106L650 170'),
    ],
    zones: [
      {
        id: 'island-platform-zone',
        states: [
          { time: 0, state: 'clear', text: '共用岛式站台' },
          { time: 3200, state: 'occupied', text: '共用岛式站台 · 上下客密集' },
          { time: 9200, state: 'clear', text: '共用岛式站台' },
        ],
      },
    ],
    signals: [
      { id: 'island-s1', states: signalStates('S1') },
      { id: 'island-s2', states: signalStates('S2') },
    ],
    dynamicText: [
      { time: 0, text: '01 / 双向列车接近岛式站台' },
      { time: 2800, text: '02 / 两侧车门开启' },
      { time: 4200, text: '03 / 下车客流汇入同一站台' },
      { time: 6800, text: '04 / 上车客流按方向重新分流' },
      { time: 9200, text: '05 / 关门，站台恢复通行' },
      { time: 10800, text: '06 / 双向列车离站' },
    ],
  }),
};

const separatedIslandStation = {
  id: 'station-separated-island',
  short: '离岛式',
  title: '离岛式：与站房分离的独立岛式站台',
  summary: '此图按“独立岛式站台与站房分离、借跨线通道连接”的含义示意。站台本身仍夹在两股道之间，但进出站都需经过独立联络通道。',
  duration: DURATION,
  phases: stationPhases({
    approach: '列车接近被股道包围的独立站台；站房位于线路一侧，乘客已在跨线通道内等候。',
    alight: '下车乘客先到达独立岛式站台，再经楼梯上行至跨线通道，最后返回侧置站房。',
    board: '候车乘客从侧置站房进入跨线通道，越过股道后再下到独立站台。',
  }),
  legends: stationLegends([
    { label: '跨线联络通道', tone: 'cyan', shape: 'dash' },
    { label: '出站客流', tone: 'rose', shape: 'dot' },
    { label: '进站客流', tone: 'mint', shape: 'dot' },
  ]),
  notes: [
    '这里将“离岛式”按站台主体与站房分离、通过跨线通道连接来示意；不同资料对术语的用法可能不同。',
    '与常规岛式相比，进出站路径更集中，通道往往成为客流瓶颈。',
    '独立站台仍服务两侧股道，跨线通道解决的是站房与站台之间的连接问题。',
  ],
  spec: stationSpec({
    elements: [
      zone('separated-concourse', 60, 118, 840, 52, '跨线通道 / 与站台分离'),
      zone('separated-platform-zone', 290, 194, 380, 86, '独立岛式站台'),
      track('M40 190H920'),
      track('M40 310H920'),
      platform(300, 210, 360, 56, '独立岛式站台'),
      building(55, 48, 160, 54, '侧置站房'),
      { type: 'rect', x: 455, y: 170, w: 50, h: 40, radius: 6, class: 'building' },
      label(480, 194, '楼梯', { size: 10, tone: 'cyan' }),
      signal('separated-s1', 100, 190, 'S1'),
      signal('separated-s2', 860, 310, 'S2'),
      arrow('M215 145H430', 'cyan', '跨线通道 →', 320, 110),
      arrow('M480 170V210', 'rose', '下到站台', 525, 195),
      label(480, 405, '站台与站房不在同一建筑体内 · 通道承担全部进出站联系', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'separated-main', d: 'M-100 190H1060' },
      { id: 'separated-out', d: 'M390 198C390 220 430 238 480 238V170H215V102H135' },
      { id: 'separated-in', d: 'M135 102H215V170H480V238C430 238 390 220 390 198' },
      { id: 'separated-out-alt', d: 'M570 198C570 220 530 238 480 238V170H215V102H135' },
    ],
    trains: [train('separated-train', 'separated-main', 'A 1201')],
    passengers: [
      ...passengerGroup('separated-out-a', 'separated-out', 'rose', 4200, 6600, 3, 260),
      ...passengerGroup('separated-out-b', 'separated-out-alt', 'rose', 4400, 6800, 2, 300),
      ...passengerGroup('separated-in', 'separated-in', 'mint', 6800, 9100, 4, 240),
    ],
    flows: [
      flow('M100 165H275', [[0, 2800]], 'cyan'),
      flow('M760 190H890', [[9400, DURATION]], 'cyan'),
      flow('M480 238V170H215V145', [[4200, 6800]], 'rose'),
      flow('M215 145H480V238', [[6800, 9200]], 'mint'),
    ],
    callouts: [
      callout('separated-c1', 620, 52, '站房与站台分离', 'DETACHED ISLAND', [[0, 3200]], 'cyan', 215, 'M620 80L215 145'),
      callout('separated-c2', 620, 52, '下车 → 楼梯 → 通道', 'EXIT VIA OVERPASS', [[4200, 6800]], 'rose', 240, 'M620 106L480 210'),
      callout('separated-c3', 620, 52, '通道 → 楼梯 → 上车', 'ACCESS VIA OVERPASS', [[6800, 9200]], 'mint', 240, 'M620 106L480 210'),
      callout('separated-c4', 620, 52, '通道客流清空', 'ROUTE RESET', [[9200, DURATION]], 'cyan', 205, 'M620 106L480 170'),
    ],
    zones: [
      {
        id: 'separated-concourse',
        states: [
          { time: 0, state: 'clear', text: '跨线通道 / 与站台分离' },
          { time: 4200, state: 'active', text: '跨线通道 · 出站客流' },
          { time: 6800, state: 'protected', text: '跨线通道 · 进站客流' },
          { time: 9200, state: 'clear', text: '跨线通道 / 客流清空' },
        ],
      },
      {
        id: 'separated-platform-zone',
        states: [
          { time: 0, state: 'clear', text: '独立岛式站台' },
          { time: 3200, state: 'occupied', text: '独立岛式站台 · 上下客' },
          { time: 9200, state: 'clear', text: '独立岛式站台' },
        ],
      },
    ],
    signals: [
      { id: 'separated-s1', states: signalStates('S1') },
      { id: 'separated-s2', states: [{ time: 0, state: 'clear', text: 'S2 开放' }] },
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车接近独立岛式站台' },
      { time: 2800, text: '02 / 停稳，站台与通道开始联动' },
      { time: 4200, text: '03 / 下车客流经楼梯上跨线通道' },
      { time: 6800, text: '04 / 进站客流反向穿过通道' },
      { time: 9200, text: '05 / 通道清空，车门关闭' },
      { time: 10800, text: '06 / 列车离站' },
    ],
  }),
};

const spanishStation = {
  id: 'station-spanish',
  short: '西班牙式',
  title: '西班牙式：上下客分别在列车两侧完成',
  summary: '两股道配三座站台：外侧站台供上车，中央岛式站台供下车。列车两侧车门同时开启，把相反方向的人流彻底分开。',
  duration: DURATION,
  phases: stationPhases({
    approach: '两列车接近三站台布局；候车乘客只在外侧站台集结，中央站台保持出站通道畅通。',
    alight: '列车靠内侧的车门开启，下车乘客全部进入中央岛式站台。',
    board: '列车靠外侧的车门开启，候车乘客从两座侧式站台直接上车，不与下车客流交叉。',
  }),
  legends: stationLegends([
    { label: '中央站台 / 下车', tone: 'rose', shape: 'block' },
    { label: '外侧站台 / 上车', tone: 'mint', shape: 'block' },
    { label: '人流方向', tone: 'cyan', shape: 'dash' },
  ]),
  notes: [
    '典型组织是“中央岛式站台只下车、外侧站台只上车”，也可按运营需要调整分工。',
    '两股反向人流被列车两侧车门分隔，适合大客流、停站时间受严格限制的车站。',
    '代价是站台数量更多、土建规模更大，乘客必须按标识进入正确的外侧站台。',
  ],
  spec: stationSpec({
    elements: [
      zone('spanish-upper', 220, 114, 520, 52, '外侧站台 · 上车'),
      zone('spanish-center', 220, 192, 520, 76, '中央岛式站台 · 下车'),
      zone('spanish-lower', 220, 288, 520, 52, '外侧站台 · 上车'),
      track('M40 170H920'),
      track('M40 280H920'),
      platform(230, 128, 500, 28, '外侧站台 A · 仅上车', 'mint'),
      platform(230, 205, 500, 50, '中央岛式站台 · 仅下车', 'rose'),
      platform(230, 295, 500, 28, '外侧站台 B · 仅上车', 'mint'),
      building(35, 205, 130, 50, '进站集散'),
      signal('spanish-s1', 100, 170, 'S1'),
      signal('spanish-s2', 860, 280, 'S2'),
      arrow('M165 220H220', 'mint', '进站', 192, 198),
      arrow('M70 145H215', 'cyan', '上行', 145, 135),
      arrow('M890 325H745', 'amber', '下行', 815, 340),
      label(480, 405, '中央岛式站台：下车 / 外侧两座站台：上车 · 人流不交叉', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'spanish-up', d: 'M-100 170H1060' },
      { id: 'spanish-down', d: 'M1060 280H-100' },
      { id: 'spanish-alight-up', d: 'M380 178C380 192 420 205 480 228L480 260H165' },
      { id: 'spanish-alight-down', d: 'M580 272C580 258 540 240 480 228L480 260H165' },
      { id: 'spanish-board-up', d: 'M165 220H240C300 220 330 190 380 170' },
      { id: 'spanish-board-down', d: 'M165 220H240C300 220 330 260 380 280' },
    ],
    trains: [
      train('spanish-train-up', 'spanish-up', 'A 1201'),
      train('spanish-train-down', 'spanish-down', 'B 0402', 'amber'),
    ],
    passengers: [
      ...passengerGroup('spanish-alight-up', 'spanish-alight-up', 'rose', 4200, 6600, 3),
      ...passengerGroup('spanish-alight-down', 'spanish-alight-down', 'rose', 4400, 6800, 2),
      ...passengerGroup('spanish-board-up', 'spanish-board-up', 'mint', 6800, 8900, 3),
      ...passengerGroup('spanish-board-down', 'spanish-board-down', 'mint', 7000, 9100, 2),
    ],
    flows: [
      flow('M100 195H225', [[0, 2800]], 'cyan'),
      flow('M860 255H735', [[0, 2800]], 'amber'),
      flow('M390 180C420 198 450 215 480 228', [[4200, 6800]], 'rose'),
      flow('M570 270C540 250 510 235 480 228', [[4200, 6800]], 'rose'),
      flow('M220 220C285 220 330 190 380 170', [[6800, 9200]], 'mint'),
      flow('M220 220C285 220 330 260 380 280', [[6800, 9200]], 'mint'),
      flow('M480 258H300', [[4200, 6800]], 'rose'),
    ],
    callouts: [
      callout('spanish-c1', 620, 52, '三座站台 / 两股道', 'SPANISH SOLUTION', [[0, 3200]], 'cyan', 220, 'M620 106L620 205'),
      callout('spanish-c2', 620, 52, '内侧车门：只下车', 'ALIGHT TO CENTER', [[4200, 6800]], 'rose', 225, 'M620 106L500 225'),
      callout('spanish-c3', 620, 52, '外侧车门：只上车', 'BOARD FROM SIDES', [[6800, 9200]], 'mint', 225, 'M620 106L360 155'),
      callout('spanish-c4', 620, 52, '两股人流互不交叉', 'SEPARATED FLOWS', [[3200, 4200]], 'amber', 225),
      callout('spanish-c5', 620, 52, '分流结束 · 列车离站', 'DWELL COMPLETE', [[9200, DURATION]], 'cyan', 235, 'M620 106L650 170'),
    ],
    zones: [
      {
        id: 'spanish-center',
        states: [
          { time: 0, state: 'clear', text: '中央岛式站台 · 待下车' },
          { time: 4200, state: 'occupied', text: '中央岛式站台 · 下车客流' },
          { time: 9200, state: 'clear', text: '中央岛式站台 · 清空' },
        ],
      },
      {
        id: 'spanish-upper',
        states: [
          { time: 0, state: 'clear', text: '外侧站台 A · 候车' },
          { time: 6800, state: 'active', text: '外侧站台 A · 上车' },
          { time: 9200, state: 'clear', text: '外侧站台 A · 清空' },
        ],
      },
      {
        id: 'spanish-lower',
        states: [
          { time: 0, state: 'clear', text: '外侧站台 B · 候车' },
          { time: 6800, state: 'active', text: '外侧站台 B · 上车' },
          { time: 9200, state: 'clear', text: '外侧站台 B · 清空' },
        ],
      },
    ],
    signals: [
      { id: 'spanish-s1', states: signalStates('S1') },
      { id: 'spanish-s2', states: signalStates('S2') },
    ],
    dynamicText: [
      { time: 0, text: '01 / 列车接近三站台布局' },
      { time: 2800, text: '02 / 两侧车门按分工开启' },
      { time: 4200, text: '03 / 内侧下车 → 中央站台' },
      { time: 6800, text: '04 / 外侧站台 → 外侧车门上车' },
      { time: 9200, text: '05 / 两股人流清空，关闭车门' },
      { time: 10800, text: '06 / 列车离站，站台复原' },
    ],
  }),
};

export const stationScenarios = [
  sideStation,
  islandStation,
  separatedIslandStation,
  spanishStation,
];
