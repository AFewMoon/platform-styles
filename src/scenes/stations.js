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

const spanishStation = {
  id: 'station-spanish',
  short: '西班牙式',
  title: '西班牙式：进出站设施分离，通道与站台平行',
  summary: '两股道配三座站台：中央岛式站台专供下车，外侧站台专供上车；进站厅与出站厅分开设置，主要客流通道沿站台方向平行布置。',
  duration: DURATION,
  phases: stationPhases({
    approach: '两列车接近三站台布局；候车乘客分别在两座外侧站台等候，中央站台与右侧出站厅保持畅通。',
    alight: '列车内侧车门开启，下车乘客进入中央岛式站台，再沿平行通道前往右侧独立出站厅。',
    board: '列车外侧车门开启，候车乘客从左侧两座独立进站厅沿外侧站台平行通道上车。',
  }),
  legends: stationLegends([
    { label: '中央站台 / 下车', tone: 'rose', shape: 'block' },
    { label: '外侧站台 / 上车', tone: 'mint', shape: 'block' },
    { label: '进站通道', tone: 'mint', shape: 'dash' },
    { label: '出站通道', tone: 'rose', shape: 'dash' },
  ]),
  notes: [
    '两座外侧站台分别由左侧独立进站厅进入，进站通道沿站台方向平行布置。',
    '中央岛式站台承担下车客流，并通过右侧独立出站厅离开，不与进站流共用同一汇点。',
    '西班牙式利用列车两侧车门同时作业；图中进站与出站设施分离，避免“同进同出”。',
  ],
  spec: stationSpec({
    elements: [
      zone('spanish-upper', 220, 114, 520, 52, '外侧站台 A · 左侧进站'),
      zone('spanish-center', 220, 192, 520, 76, '中央岛式站台 · 右侧出站'),
      zone('spanish-lower', 220, 288, 520, 52, '外侧站台 B · 左侧进站'),
      track('M40 170H920'),
      track('M40 280H920'),
      platform(230, 128, 500, 28, '外侧站台 A · 仅上车', 'mint'),
      platform(230, 205, 500, 50, '中央岛式站台 · 仅下车', 'rose'),
      platform(230, 295, 500, 28, '外侧站台 B · 仅上车', 'mint'),
      building(25, 132, 100, 42, '进站厅 A'),
      building(25, 286, 100, 42, '进站厅 B'),
      building(835, 210, 100, 60, '出站厅'),
      signal('spanish-s1', 100, 170, 'S1'),
      signal('spanish-s2', 860, 280, 'S2'),
      arrow('M125 153H220', 'mint', '进站 A', 172, 145),
      arrow('M125 307H220', 'mint', '进站 B', 172, 330),
      arrow('M730 240H835', 'rose', '出站', 782, 230),
      label(175, 120, '进站通道 A · 与站台平行', { tone: 'mint', size: 10 }),
      label(175, 348, '进站通道 B · 与站台平行', { tone: 'mint', size: 10 }),
      label(700, 196, '出站通道 · 与站台平行', { tone: 'rose', size: 10 }),
      label(480, 104, '上行列车 →', { tone: 'cyan', size: 10 }),
      label(480, 360, '← 下行列车', { tone: 'amber', size: 10 }),
      label(480, 405, '左侧两座进站厅 → 外侧站台 · 中央站台 → 右侧独立出站厅', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'spanish-up', d: 'M-100 170H1060' },
      { id: 'spanish-down', d: 'M1060 280H-100' },
      { id: 'spanish-alight-up', d: 'M380 178C380 195 420 218 460 230H835' },
      { id: 'spanish-alight-down', d: 'M580 272C580 258 550 238 500 230H835' },
      { id: 'spanish-board-up', d: 'M125 158H300C330 158 350 164 380 170' },
      { id: 'spanish-board-down', d: 'M125 306H300C330 306 350 296 380 280' },
    ],
    trains: [
      train('spanish-train-up', 'spanish-up', 'A 1201'),
      train('spanish-train-down', 'spanish-down', 'B 0402', 'amber'),
    ],
    passengers: [
      ...passengerGroup('spanish-alight-up', 'spanish-alight-up', 'rose', 4200, 6500, 3),
      ...passengerGroup('spanish-alight-down', 'spanish-alight-down', 'rose', 4400, 6700, 2),
      ...passengerGroup('spanish-board-up', 'spanish-board-up', 'mint', 6800, 8900, 3),
      ...passengerGroup('spanish-board-down', 'spanish-board-down', 'mint', 7000, 9100, 2),
    ],
    flows: [
      flow('M100 195H225', [[0, 2800]], 'cyan'),
      flow('M860 255H735', [[0, 2800]], 'amber'),
      flow('M380 178C380 195 420 218 460 230', [[4200, 6800]], 'rose'),
      flow('M580 272C580 258 550 238 500 230', [[4200, 6800]], 'rose'),
      flow('M460 230H820', [[4200, 6800]], 'rose'),
      flow('M125 158H300C330 158 350 164 380 170', [[6800, 9200]], 'mint'),
      flow('M125 306H300C330 306 350 296 380 280', [[6800, 9200]], 'mint'),
    ],
    callouts: [
      callout('spanish-c1', 620, 52, '三座站台 / 两股道', 'SPANISH SOLUTION', [[0, 3200]], 'cyan', 220, 'M620 106L620 205'),
      callout('spanish-c4', 620, 52, '进出站设施完全分开', 'SEPARATE PARALLEL ACCESS', [[3200, 4200]], 'amber', 255),
      callout('spanish-c2', 620, 52, '内侧车门：下车 → 右侧出站厅', 'ALIGHT TO CENTER / EXIT RIGHT', [[4200, 6800]], 'rose', 285, 'M620 106L700 230'),
      callout('spanish-c3', 620, 52, '外侧车门：左侧进站厅 → 外侧站台', 'BOARD FROM OUTER PLATFORMS', [[6800, 9200]], 'mint', 295, 'M620 106L360 155'),
      callout('spanish-c5', 620, 52, '分流结束 · 列车离站', 'DWELL COMPLETE', [[9200, DURATION]], 'cyan', 235, 'M620 106L650 170'),
    ],
    zones: [
      {
        id: 'spanish-center',
        states: [
          { time: 0, state: 'clear', text: '中央岛式站台 · 待下车' },
          { time: 4200, state: 'occupied', text: '中央岛式站台 · 下车 → 右侧出站厅' },
          { time: 9200, state: 'clear', text: '中央岛式站台 · 清空' },
        ],
      },
      {
        id: 'spanish-upper',
        states: [
          { time: 0, state: 'clear', text: '外侧站台 A · 左侧进站厅候车' },
          { time: 6800, state: 'active', text: '外侧站台 A · 平行通道上车' },
          { time: 9200, state: 'clear', text: '外侧站台 A · 清空' },
        ],
      },
      {
        id: 'spanish-lower',
        states: [
          { time: 0, state: 'clear', text: '外侧站台 B · 左侧进站厅候车' },
          { time: 6800, state: 'active', text: '外侧站台 B · 平行通道上车' },
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
      { time: 2800, text: '02 / 两侧车门按上下客分工开启' },
      { time: 4200, text: '03 / 中央站台下车，沿右侧平行通道出站' },
      { time: 6800, text: '04 / 左侧进站厅经外侧站台上车' },
      { time: 9200, text: '05 / 进出站通道清空，关闭车门' },
      { time: 10800, text: '06 / 列车离站，站台复原' },
    ],
  }),
};

export const stationScenarios = [
  sideStation,
  islandStation,
  spanishStation,
];
