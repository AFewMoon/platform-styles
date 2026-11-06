const VIEW = [0, 0, 960, 440];
const DURATION = 14000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const boundary = (x, label) => ({ type: 'boundary', x1: x, y1: 100, x2: x, y2: 330, label });
const label = (x, y, text, options = {}) => ({ type: 'text', x, y, text, ...options });
const switchNode = (x, y, labelText) => ({ type: 'switch', x, y, label: labelText });
const arrow = (d, tone = 'neutral', labelText, labelX, labelY) => ({ type: 'arrow', d, tone, label: labelText, labelX, labelY });
const flow = (d, visible, tone = 'cyan') => ({ d, visible, tone });

function callout(id, title, subtext, visible, tone = 'cyan', w = 260, leaderD) {
  return { id, x: 620, y: 344, w, h: 54, title, subtext, visible, tone, leaderD };
}

function train(id, path, labelText, tone, keyframes, extra = {}) {
  return { id, path, label: labelText, tone, keyframes, ...extra };
}

function zoneStates(id, labelText, events = []) {
  return {
    id,
    states: [{ time: 0, state: 'clear', text: `${labelText} · 空闲` }, ...events],
  };
}

function signalStates(id, events = []) {
  return {
    id,
    states: [{ time: 0, state: 'clear', text: `${id.toUpperCase()} 开放` }, ...events],
  };
}

function legends(items) {
  return [
    { label: '列车运行方向', tone: 'cyan', shape: 'line' },
    { label: '区间占用 / 防护', tone: 'rose', shape: 'block' },
    { label: '开放 / 许可边界', tone: 'mint', shape: 'dash' },
    ...items,
  ];
}

function blockSpec({ elements, routes, trains, flows, callouts, zones = [], signals = [], movingZones = [], dynamicText }) {
  return {
    viewBox: VIEW,
    elements,
    routes,
    trains,
    flows,
    callouts,
    zones,
    signals,
    movingZones,
    texts: [{ x: 480, y: 70, class: 'dynamic-text', align: 'middle', tone: 'cyan', states: dynamicText }],
  };
}

const singleBlock = {
  id: 'single-block',
  short: '单线闭塞区间',
  title: '单线闭塞：一个区间，一次只允许一列车占用',
  summary: '相邻车站之间的单线区段被划为一个闭塞区间。区间被前车占用时，后车必须在区间入口信号前等待，直到前车完整出清。',
  duration: DURATION,
  phases: [
    phase(0, '区间空闲', '入口信号开放，区间没有列车占用，行车许可可以授予一列车。'),
    phase(1200, '前车取得区间', 'A 车进入区间，闭塞设备把区间标记为占用，入口信号转为停车。'),
    phase(4500, '后车等待', 'B 车到达同一区间入口，即使前方目视距离很长，也不能越过关闭的信号。'),
    phase(7000, '前车出清', 'A 车完整越过区间终点，计轴或轨道电路确认区间空闲。'),
    phase(9000, '许可转移给后车', '入口信号重新开放，B 车获得区间行车许可。'),
    phase(11000, '后车进入', 'B 车占用同一区间；同一时间仍只有一列车在闭塞区内。'),
  ],
  legends: legends([{ label: '区间边界', tone: 'amber', shape: 'dash' }]),
  notes: [
    '闭塞关注的是“区间是否被占用”，不是司机能否看见前车。',
    '图中用一个站间区间演示原理；实际线路可设置多个闭塞分区或采用不同闭塞方式。',
    '状态同时用颜色、虚线和文字表达：占用、出清确认、许可转移各有明确阶段。',
  ],
  spec: blockSpec({
    elements: [
      zone('single-zone', 280, 140, 440, 160, '闭塞区间 A—B'),
      track('M40 220H920'),
      platformAt(70, 240, 150, 26, 'A 站'),
      platformAt(740, 240, 150, 26, 'B 站'),
      boundary(280, '区间起点'),
      boundary(720, '区间终点'),
      signal('sb-s1', 250, 220, 'S1'),
      signal('sb-s2', 750, 220, 'S2'),
      arrow('M80 185H220', 'cyan', '运行方向', 150, 175),
      label(350, 405, '单线站间区间 · 占用以整个区间为单位', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'single-line', d: 'M-100 220H1060' }],
    trains: [
      train('single-a', 'single-line', 'A 1001', 'cyan', [[0, 0], [1200, 0.18], [7000, 0.85], [9000, 1], [DURATION, 1]]),
      train('single-b', 'single-line', 'B 1002', 'amber', [[0, 0], [2200, 0.12], [8500, 0.12], [10000, 0.25], [DURATION, 0.85]], { visible: [[1500, DURATION]] }),
    ],
    flows: [
      flow('M100 195H240', [[0, 7000]], 'cyan'),
      flow('M760 195H890', [[7000, 11000]], 'mint'),
      flow('M100 195H240', [[9000, DURATION]], 'amber'),
    ],
    callouts: [
      callout('sb-c1', '区间空闲 · 信号开放', 'BLOCK CLEAR', [[0, 1200]], 'mint', 250, 'M620 344L280 220'),
      callout('sb-c2', 'A 车占用 · S1 关闭', 'ONE TRAIN ONLY', [[1200, 7000]], 'rose', 260, 'M620 344L480 220'),
      callout('sb-c3', 'A 车完整出清', 'RELEASE CHECK', [[7000, 9000]], 'amber', 245, 'M620 344L720 220'),
      callout('sb-c4', '许可转移给 B 车', 'AUTHORITY GRANTED', [[9000, 11000]], 'mint', 255, 'M620 344L250 220'),
      callout('sb-c5', 'B 车占用同一区间', 'SAME PRINCIPLE', [[11000, DURATION]], 'rose', 255, 'M620 344L430 220'),
    ],
    zones: [
      zoneStates('single-zone', '闭塞区间 A—B', [
        { time: 1200, state: 'occupied', text: '闭塞区间 · A 车占用' },
        { time: 7000, state: 'protected', text: '闭塞区间 · 出清确认' },
        { time: 9000, state: 'clear', text: '闭塞区间 · 空闲' },
        { time: 11000, state: 'occupied', text: '闭塞区间 · B 车占用' },
      ]),
    ],
    signals: [
      signalStates('sb-s1', [
        { time: 1200, state: 'stop', text: 'S1 停车 · 占用' },
        { time: 7000, state: 'caution', text: 'S1 出清确认' },
        { time: 9000, state: 'clear', text: 'S1 开放 · B 可进入' },
        { time: 11000, state: 'stop', text: 'S1 停车 · 再次占用' },
      ]),
      signalStates('sb-s2', [
        { time: 7000, state: 'active', text: 'S2 到达确认' },
        { time: 9000, state: 'clear', text: 'S2 开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 闭塞区间空闲，入口信号开放' },
      { time: 1200, text: '02 / A 车进入，区间被锁定' },
      { time: 4500, text: '03 / B 车在关闭信号前等待' },
      { time: 7000, text: '04 / A 车完整出清，设备确认空闲' },
      { time: 9000, text: '05 / 行车许可交给 B 车' },
      { time: 11000, text: '06 / B 车取得区间' },
    ],
  }),
};

const passingLoop = {
  id: 'passing-loop',
  short: '单线避让站',
  title: '单线避让站：一列进侧线，另一列从正线通过',
  summary: '在单线上设置带道岔的站线，可以让相反方向的列车会车。较慢或先行到达的列车进入避让线停妥，另一列沿正线通过，再恢复各自行程。',
  duration: DURATION,
  phases: [
    phase(0, '两车接近', 'A、B 两列车从相反方向接近单线区段，道岔已为会车进路准备。'),
    phase(2500, 'A 车转入侧线', 'A 车经入口道岔进入避让线，限速贴近站台停车。'),
    phase(4000, 'A 车停妥等待', '侧线被占用，正线进路保持给对向列车。'),
    phase(5500, 'B 车通过正线', 'B 车沿正线通过车站，两车在站内完成交会。'),
    phase(8500, 'B 车出清', '正线恢复空闲，出口道岔转换，A 车获得发车许可。'),
    phase(10500, 'A 车返回正线', 'A 车从侧线驶出，避让站完成一次会让作业。'),
  ],
  legends: legends([{ label: '道岔 / 会车进路', tone: 'amber', shape: 'dot' }]),
  notes: [
    '避让线必须有足够长度容纳整列车；站线长度会限制可会车的列车长度。',
    '道岔转换、进路锁闭与信号开放有先后次序，动画将其压缩为几个阶段。',
    '对比前一演示：这里把“等待”从区间入口搬到了有配线的车站内。',
  ],
  spec: blockSpec({
    elements: [
      zone('pass-main-zone', 320, 150, 360, 95, '正线会车区段'),
      zone('pass-loop-zone', 320, 255, 360, 90, '避让线 / 站台'),
      track('M40 220H920'),
      track('M320 220C360 220 350 300 390 300H570C610 300 600 220 640 220'),
      platformAt(400, 314, 220, 26, '避让站站台'),
      switchNode(320, 220, 'W1'),
      switchNode(640, 220, 'W2'),
      signal('pass-s1', 255, 220, 'S1'),
      signal('pass-s2', 705, 220, 'S2'),
      arrow('M80 190H230', 'cyan', 'A 车方向', 150, 180),
      arrow('M880 190H730', 'amber', 'B 车方向', 805, 180),
      label(360, 405, '正线通过 + 侧线等待 = 单线会让', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'pass-main', d: 'M1060 220H-100' },
      { id: 'pass-loop', d: 'M-100 220H320C360 220 350 300 390 300H570C610 300 600 220 640 220H1060' },
    ],
    trains: [
      train('pass-a', 'pass-loop', 'A 2101', 'cyan', [[0, 0], [2500, 0.42], [3500, 0.5], [8500, 0.5], [10500, 0.6], [DURATION, 1]]),
      train('pass-b', 'pass-main', 'B 2102', 'amber', [[0, 0], [2500, 0.12], [5500, 0.62], [8500, 0.95], [DURATION, 1]]),
    ],
    flows: [
      flow('M80 195H260', [[0, 3200]], 'cyan'),
      flow('M880 195H700', [[2500, 8500]], 'amber'),
      flow('M650 195H860', [[9000, DURATION]], 'cyan'),
    ],
    callouts: [
      callout('pass-c1', '对向列车接近', 'MEETING MOVEMENT', [[0, 2500]], 'cyan', 245, 'M620 344L320 220'),
      callout('pass-c2', 'A 车经 W1 转入侧线', 'DIVERGE TO LOOP', [[2500, 4000]], 'mint', 270, 'M620 344L390 300'),
      callout('pass-c3', 'A 车停妥 · 正线保持空闲', 'WAIT IN SIDING', [[4000, 5500]], 'rose', 285, 'M620 344L480 300'),
      callout('pass-c4', 'B 车沿正线通过', 'THROUGH MAIN LINE', [[5500, 8500]], 'amber', 260, 'M620 344L480 220'),
      callout('pass-c5', '道岔转换 · A 车发车', 'ROUTE RELEASE', [[8500, DURATION]], 'mint', 270, 'M620 344L640 220'),
    ],
    zones: [
      zoneStates('pass-loop-zone', '避让线', [
        { time: 2500, state: 'occupied', text: '避让线 · A 车占用' },
        { time: 8500, state: 'protected', text: '避让线 · 发车进路' },
        { time: 10500, state: 'clear', text: '避让线 · 空闲' },
      ]),
      zoneStates('pass-main-zone', '正线', [
        { time: 4000, state: 'active', text: '正线 · B 车通过' },
        { time: 8500, state: 'clear', text: '正线 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('pass-s1', [
        { time: 2500, state: 'caution', text: 'S1 限速进侧线' },
        { time: 3500, state: 'stop', text: 'S1 A 车停妥' },
        { time: 8500, state: 'clear', text: 'S1 发车开放' },
      ]),
      signalStates('pass-s2', [
        { time: 4000, state: 'clear', text: 'S2 正线通过' },
        { time: 8500, state: 'caution', text: 'S2 进路转换' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 相反方向列车接近避让站' },
      { time: 2500, text: '02 / A 车转入避让线' },
      { time: 4000, text: '03 / A 车停妥，锁闭会车进路' },
      { time: 5500, text: '04 / B 车沿正线通过' },
      { time: 8500, text: '05 / B 车出清，道岔可转换' },
      { time: 10500, text: '06 / A 车返回正线继续行程' },
    ],
  }),
};

const fixedBlock = {
  id: 'fixed-block',
  short: '固定闭塞',
  title: '双线固定闭塞：边界固定，按整区段判断占用',
  summary: '线路被预先划成若干固定闭塞分区。只要列车占用某分区，后续列车就必须依据信号显示，在该分区之前保持规定的空闲分区数量。',
  duration: DURATION,
  phases: [
    phase(0, '分区边界固定', 'B1—B4 的边界在建设时确定，不随列车位置移动。'),
    phase(1000, '前车占用 B1', 'A 车进入 B1，整个分区显示占用，后方信号降级。'),
    phase(3500, '前车逐区段前进', 'A 车驶入 B2；B1 出清后，后车才可能逐步向前跟进。'),
    phase(6500, '后车保持间隔', 'B 车依据固定边界上的信号显示运行，安全间隔以“整个分区”为粒度。'),
    phase(9500, '分区依次出清', 'A 车远离后，B1—B3 依次恢复空闲，但边界位置始终不变。'),
    phase(12000, '通过能力受限', '分区越长，列车间最小间隔通常越大；追踪能力受到固定划分约束。'),
  ],
  legends: legends([{ label: '固定分区边界', tone: 'amber', shape: 'dash' }]),
  notes: [
    '信号显示与分区占用绑定，列车位置只精确到“所在分区”。',
    '不同系统可要求一或多个空闲分区作为防护，图中只表达固定边界这一核心差别。',
    '对比后续两种演示：边界不移动，是固定闭塞最直观的特征。',
  ],
  spec: blockSpec({
    elements: [
      zone('fb-b1', 160, 145, 160, 150, 'B1'),
      zone('fb-b2', 320, 145, 160, 150, 'B2'),
      zone('fb-b3', 480, 145, 160, 150, 'B3'),
      zone('fb-b4', 640, 145, 160, 150, 'B4'),
      track('M40 220H920'),
      boundary(160, 'S1'), boundary(320, 'S2'), boundary(480, 'S3'), boundary(640, 'S4'), boundary(800, 'S5'),
      signal('fb-s1', 160, 220, 'S1'), signal('fb-s2', 320, 220, 'S2'), signal('fb-s3', 480, 220, 'S3'), signal('fb-s4', 640, 220, 'S4'),
      arrow('M70 185H145', 'cyan', '追踪方向', 105, 175),
      label(360, 405, '固定分区 B1—B4 · 位置判定以区段为单位', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'fb-line', d: 'M-100 220H1060' }],
    trains: [
      train('fb-a', 'fb-line', 'A 3001', 'cyan', [[0, 0], [1000, 0.15], [3500, 0.35], [6500, 0.58], [9500, 0.82], [12000, 1], [DURATION, 1]]),
      train('fb-b', 'fb-line', 'B 3002', 'amber', [[0, 0], [2000, 0.05], [4500, 0.18], [7000, 0.34], [9500, 0.5], [12000, 0.66], [DURATION, 0.78]], { visible: [[1800, DURATION]] }),
    ],
    flows: [
      flow('M80 195H150', [[0, 3500]], 'cyan'),
      flow('M330 195H470', [[3500, 9500]], 'amber'),
      flow('M650 195H790', [[9500, DURATION]], 'mint'),
    ],
    callouts: [
      callout('fb-c1', '边界在建设时确定', 'FIXED SECTIONS', [[0, 1000]], 'mint', 250, 'M620 344L480 145'),
      callout('fb-c2', 'B1 整体显示占用', 'WHOLE BLOCK OCCUPIED', [[1000, 3500]], 'rose', 275, 'M620 344L240 220'),
      callout('fb-c3', '占用状态逐段传递', 'STEPWISE RELEASE', [[3500, 6500]], 'amber', 260, 'M620 344L400 220'),
      callout('fb-c4', '后车按固定信号追踪', 'DISCRETE AUTHORITY', [[6500, 9500]], 'cyan', 275, 'M620 344L320 220'),
      callout('fb-c5', '边界不动 · 间隔粒度较粗', 'FIXED RESOLUTION', [[9500, DURATION]], 'rose', 285, 'M620 344L640 220'),
    ],
    zones: [
      zoneStates('fb-b1', 'B1', [
        { time: 1000, state: 'occupied', text: 'B1 · A 车占用' },
        { time: 3500, state: 'protected', text: 'B1 · 防护' },
        { time: 4500, state: 'clear', text: 'B1 · 空闲' },
        { time: 7000, state: 'occupied', text: 'B1 · B 车占用' },
        { time: 9500, state: 'clear', text: 'B1 · 空闲' },
      ]),
      zoneStates('fb-b2', 'B2', [
        { time: 3500, state: 'occupied', text: 'B2 · A 车占用' },
        { time: 6500, state: 'clear', text: 'B2 · 空闲' },
        { time: 9500, state: 'occupied', text: 'B2 · B 车占用' },
      ]),
      zoneStates('fb-b3', 'B3', [
        { time: 6500, state: 'occupied', text: 'B3 · A 车占用' },
        { time: 9500, state: 'clear', text: 'B3 · 空闲' },
      ]),
      zoneStates('fb-b4', 'B4', [
        { time: 9500, state: 'occupied', text: 'B4 · A 车占用' },
        { time: 12000, state: 'clear', text: 'B4 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('fb-s1', [
        { time: 1000, state: 'stop', text: 'S1 停车 · B1 占用' },
        { time: 4500, state: 'caution', text: 'S1 注意' },
        { time: 7000, state: 'stop', text: 'S1 停车 · B1 再占用' },
      ]),
      signalStates('fb-s2', [
        { time: 3500, state: 'stop', text: 'S2 停车 · B2 占用' },
        { time: 6500, state: 'clear', text: 'S2 开放' },
      ]),
      signalStates('fb-s3', [
        { time: 6500, state: 'stop', text: 'S3 停车 · B3 占用' },
        { time: 9500, state: 'clear', text: 'S3 开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 固定闭塞分区 B1—B4' },
      { time: 1000, text: '02 / A 车占用 B1，信号降级' },
      { time: 3500, text: '03 / 占用状态按分区逐段传递' },
      { time: 6500, text: '04 / B 车保持整区段间隔' },
      { time: 9500, text: '05 / 分区依次出清，但边界不动' },
      { time: 12000, text: '06 / 追踪粒度受分区长度约束' },
    ],
  }),
};

const quasiMovingBlock = {
  id: 'quasi-moving-block',
  short: '准移动闭塞',
  title: '准移动闭塞：目标点落在前方占用分区的边界',
  summary: '仍以固定分区判断是否占用，但后车的行车许可终点可计算到前方第一个占用分区的起点。当前车离开一个分区，目标点便跳到下一个边界。',
  duration: DURATION,
  phases: [
    phase(0, '保留固定分区', '地面仍把线路划成固定区段，列车占用以区段为单位检查。'),
    phase(1000, '计算目标点', 'B 车获得一个允许运行终点：前方第一个占用分区的起点。'),
    phase(3000, '前车离开 B2', 'A 车完整出清 B2，目标点从 B2 起点跳到 B3 起点。'),
    phase(6000, '目标点再次跳变', 'A 车出清 B3，B 车的许可范围继续分段延长，但仍落在边界上。'),
    phase(9000, '分区全部出清', '前方已无占用分区，目标点移到更远的安全终点。'),
    phase(12000, '间隔可分段缩短', '相比逐级信号，后车可以更接近前车，但精度仍受分区长度限制。'),
  ],
  legends: legends([
    { label: '目标点 / 跳变边界', tone: 'amber', shape: 'line' },
    { label: '移动许可范围', tone: 'mint', shape: 'dash' },
  ]),
  notes: [
    '“准移动”不是边界连续移动：目标点仍取固定分区边界，只是可随占用状态重新计算。',
    '动画中的窄琥珀色条表示目标点，薄荷色范围表示 B 车可运行至目标点的许可。',
    '实际目标距离还会叠加安全防护、制动与线路条件，此处仅作概念示意。',
  ],
  spec: blockSpec({
    elements: [
      zone('qmb-b1', 100, 145, 200, 150, 'B1'),
      zone('qmb-b2', 300, 145, 200, 150, 'B2'),
      zone('qmb-b3', 500, 145, 200, 150, 'B3'),
      zone('qmb-b4', 700, 145, 200, 150, 'B4'),
      track('M40 220H920'),
      boundary(100, ''), boundary(300, 'B2'), boundary(500, 'B3'), boundary(700, 'B4'), boundary(900, ''),
      signal('qmb-s1', 300, 220, 'S1'), signal('qmb-s2', 500, 220, 'S2'), signal('qmb-s3', 700, 220, 'S3'),
      arrow('M60 190H120', 'cyan', '追踪方向', 90, 180),
      label(360, 405, '目标点按分区边界跳变 · 许可长度分段增长', { tone: 'neutral', size: 11 }),
    ],
    routes: [{ id: 'qmb-line', d: 'M-100 220H1060' }],
    trains: [
      train('qmb-a', 'qmb-line', 'A 4001', 'cyan', [[0, 0.35], [3000, 0.52], [6000, 0.7], [9000, 0.88], [12000, 1], [DURATION, 1]]),
      train('qmb-b', 'qmb-line', 'B 4002', 'amber', [[0, 0.08], [3000, 0.14], [6000, 0.2], [9000, 0.28], [12000, 0.36], [DURATION, 0.42]]),
    ],
    flows: [
      flow('M60 195H100', [[0, 3000]], 'cyan'),
      flow('M120 195H280', [[3000, 9000]], 'mint'),
      flow('M760 195H890', [[9000, DURATION]], 'cyan'),
    ],
    callouts: [
      callout('qmb-c1', '固定分区仍存在', 'FIXED TRACK SECTIONS', [[0, 1000]], 'cyan', 275, 'M620 344L500 145'),
      callout('qmb-c2', '目标点 = 占用区起点', 'TARGET AT BLOCK ENTRY', [[1000, 3000]], 'amber', 280, 'M620 344L300 220'),
      callout('qmb-c3', '目标点跳到下一边界', 'DISCRETE JUMP', [[3000, 6000]], 'mint', 265, 'M620 344L500 220'),
      callout('qmb-c4', '许可范围分段延长', 'STEPWISE EXTENSION', [[6000, 9000]], 'mint', 265, 'M620 344L700 220'),
      callout('qmb-c5', '精度仍受分区长度限制', 'NOT CONTINUOUS YET', [[9000, DURATION]], 'rose', 285, 'M620 344L900 220'),
    ],
    zones: [
      zoneStates('qmb-b2', 'B2', [
        { time: 0, state: 'occupied', text: 'B2 · A 车占用' },
        { time: 3000, state: 'clear', text: 'B2 · 空闲' },
      ]),
      zoneStates('qmb-b3', 'B3', [
        { time: 3000, state: 'occupied', text: 'B3 · A 车占用' },
        { time: 6000, state: 'clear', text: 'B3 · 空闲' },
      ]),
      zoneStates('qmb-b4', 'B4', [
        { time: 6000, state: 'occupied', text: 'B4 · A 车占用' },
        { time: 9000, state: 'clear', text: 'B4 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('qmb-s1', [{ time: 3000, state: 'active', text: 'S1 目标点更新' }]),
      signalStates('qmb-s2', [{ time: 6000, state: 'active', text: 'S2 目标点更新' }]),
      signalStates('qmb-s3', [{ time: 9000, state: 'clear', text: 'S3 前方出清' }]),
    ],
    movingZones: [
      {
        y: 145,
        h: 150,
        label: 'B 车移动许可',
        state: 'active',
        x: [[0, 33], [3000, 102], [3100, 102], [6000, 172], [6100, 172], [9000, 265], [9100, 265], [12000, 358], [DURATION, 427]],
        w: [[0, 267], [3000, 198], [3100, 398], [6000, 328], [6100, 528], [9000, 435], [9100, 635], [12000, 542], [DURATION, 473]],
      },
      {
        y: 135,
        h: 170,
        label: '目标点',
        state: 'protected',
        x: [[0, 294], [3000, 294], [3100, 494], [6000, 494], [6100, 694], [9000, 694], [9100, 894], [DURATION, 894]],
        w: [[0, 12], [DURATION, 12]],
      },
    ],
    dynamicText: [
      { time: 0, text: '01 / 仍以固定分区检查占用' },
      { time: 1000, text: '02 / 计算前方占用分区起点' },
      { time: 3000, text: '03 / A 车出清 B2，目标点跳变' },
      { time: 6000, text: '04 / 目标点跳到下一固定边界' },
      { time: 9000, text: '05 / 前方分区出清，许可延长' },
      { time: 12000, text: '06 / 追踪距离可分段缩短' },
    ],
  }),
};

const movingBlock = {
  id: 'moving-block',
  short: '移动闭塞',
  title: '移动闭塞：安全边界随列车连续更新',
  summary: '列车连续报告自身位置与速度，列控系统据此计算后车的移动授权和防护距离。安全分隔不再依赖预先划定的固定分区边界。',
  duration: DURATION,
  phases: [
    phase(0, '连续位置报告', 'A、B 两车持续向列控系统报告位置，图中青色虚线表示数据链路。'),
    phase(2500, '计算制动曲线', '系统按前车位置、速度及线路条件，计算后车必须保持的防护距离。'),
    phase(5000, '授权边界连续前移', 'B 车的移动授权终点随 A 车前进连续移动，而不是等下一个分区出清。'),
    phase(8000, '两车同步推进', '只要安全距离得到满足，后车可以比固定闭塞更紧密地追踪。'),
    phase(11000, '前车减速影响后车', '前车状态变化会立即影响防护区与目标距离，图中同步收窄间隔。'),
    phase(13000, '能力来自信息精度', '更小的位置与速度更新粒度，可支持更精细的行车间隔。'),
  ],
  legends: legends([
    { label: '连续数据链路', tone: 'cyan', shape: 'dash' },
    { label: '动态防护区', tone: 'rose', shape: 'block' },
  ]),
  notes: [
    '移动闭塞不表示列车可以贴在一起：仍必须保留制动距离与各类安全余量。',
    '不同列控制式的通信方式、授权计算与后备模式差异很大，此图只解释共同概念。',
    '与固定、准移动闭塞对比：这里没有随占用状态逐级跳变的固定分区目标点。',
  ],
  spec: blockSpec({
    elements: [
      { type: 'building', x: 390, y: 90, w: 180, h: 42, label: '列控中心 / 连续位置' },
      track('M40 220H920'),
      { type: 'line', d: 'M40 320H920', class: 'boundary', tone: 'neutral' },
      label(480, 348, '无固定闭塞分区边界 · 安全距离连续计算', { tone: 'neutral', size: 11 }),
      label(360, 405, '位置越精确 · 授权边界越能贴近真实安全需求', { tone: 'neutral', size: 11 }),
      arrow('M60 190H145', 'cyan', '追踪方向', 100, 180),
    ],
    routes: [{ id: 'mb-line', d: 'M-100 220H1060' }],
    trains: [
      train('mb-a', 'mb-line', 'A 5001', 'cyan', [[0, 0.35], [3000, 0.5], [6000, 0.65], [9000, 0.8], [12000, 0.95], [DURATION, 1]]),
      train('mb-b', 'mb-line', 'B 5002', 'amber', [[0, 0.15], [3000, 0.28], [6000, 0.4], [9000, 0.53], [12000, 0.65], [DURATION, 0.72]]),
    ],
    flows: [
      flow('M480 132V195', [[0, DURATION]], 'cyan'),
      flow('M306 200C350 150 420 130 450 120', [[0, 5000]], 'cyan'),
      flow('M74 200C150 155 300 135 410 120', [[0, 5000]], 'cyan'),
      flow('M828 200C760 150 610 130 550 120', [[5000, DURATION]], 'cyan'),
      flow('M515 200C470 160 490 135 510 120', [[5000, DURATION]], 'cyan'),
    ],
    callouts: [
      callout('mb-c1', '连续位置与速度报告', 'CONTINUOUS DATA', [[0, 2500]], 'cyan', 270, 'M620 344L480 132'),
      callout('mb-c2', '计算动态制动距离', 'BRAKING ENVELOPE', [[2500, 5000]], 'rose', 265, 'M620 344L480 220'),
      callout('mb-c3', '授权边界连续前移', 'MOVING AUTHORITY', [[5000, 8000]], 'mint', 265, 'M620 344L620 220'),
      callout('mb-c4', '不必等待分区出清', 'NO FIXED BLOCK', [[8000, 11000]], 'cyan', 255, 'M620 344L700 220'),
      callout('mb-c5', '仍保留制动与防护余量', 'SAFETY MARGIN REMAINS', [[11000, DURATION]], 'rose', 285, 'M620 344L800 220'),
    ],
    movingZones: [
      {
        y: 165,
        h: 110,
        label: 'B 车移动授权',
        state: 'active',
        x: [[0, 124], [3000, 275], [6000, 414], [9000, 565], [12000, 704], [DURATION, 785]],
        w: [[0, 122], [3000, 145], [6000, 180], [9000, 203], [12000, 238], [DURATION, 215]],
      },
      {
        y: 165,
        h: 110,
        label: 'A 后方动态防护',
        state: 'protected',
        x: [[0, 196], [3000, 370], [6000, 544], [9000, 718], [12000, 892], [DURATION, 950]],
        w: [[0, 110], [3000, 110], [6000, 110], [9000, 110], [12000, 110], [DURATION, 110]],
      },
    ],
    dynamicText: [
      { time: 0, text: '01 / 两车连续报告位置与速度' },
      { time: 2500, text: '02 / 计算制动曲线与安全余量' },
      { time: 5000, text: '03 / 后车移动授权连续前移' },
      { time: 8000, text: '04 / 无需等待固定分区出清' },
      { time: 11000, text: '05 / 前车状态变化即时影响防护距离' },
      { time: 13000, text: '06 / 信息精度决定间隔精细程度' },
    ],
  }),
};

const expressLocal = {
  id: 'express-local',
  short: '快慢车越行',
  title: '多线快慢车：慢车进站线，快车从正线越行',
  summary: '在设置有越行线的车站，慢车可转入站线停站，快车沿直通正线超越。多线铁路用股道分工减少不同速度列车之间的相互等待。',
  duration: DURATION,
  phases: [
    phase(0, '两种速度接近', '快车与慢车沿同一方向接近，快车在后方逐渐追近。'),
    phase(2500, '慢车转入站线', '入口道岔转换为侧向进路，慢车减速进入越行线。'),
    phase(3500, '慢车停站', '慢车在站台停稳，直通正线保持给快车通过。'),
    phase(5500, '快车越行', '快车以较高速度沿正线通过，不在该站停车。'),
    phase(8500, '慢车等待出清', '快车完整通过越行区段后，出口进路才为慢车建立。'),
    phase(10500, '慢车返回正线', '慢车从站线驶出，恢复常规运行；快慢车完成一次越行。'),
  ],
  legends: legends([
    { label: '快车 / 直通正线', tone: 'amber', shape: 'line' },
    { label: '慢车 / 越行线', tone: 'cyan', shape: 'line' },
  ]),
  notes: [
    '越行站需要足够长的站线和两端道岔，列车长度与停站时间会影响越行能力。',
    '多线也可采用快慢车各自独立的平行线路；此图展示带越行线的常见组织。',
    '观察两车轨迹：快车不进入站台股道，慢车让出直通进路而不倒车。',
  ],
  spec: blockSpec({
    elements: [
      zone('el-main-zone', 250, 145, 460, 90, '直通正线'),
      zone('el-loop-zone', 330, 250, 380, 90, '越行线 / 站台'),
      track('M40 200H920'),
      track('M250 200C300 200 300 290 350 290H610C660 290 660 200 710 200'),
      platformAt(400, 304, 220, 26, '慢车站台'),
      switchNode(250, 200, 'W1'),
      switchNode(710, 200, 'W2'),
      signal('el-s1', 210, 200, 'S1'),
      signal('el-s2', 750, 200, 'S2'),
      arrow('M70 170H210', 'amber', '快车方向', 140, 160),
      label(360, 405, '股道分工：直通快车 + 停站慢车', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'el-main', d: 'M-100 200H1060' },
      { id: 'el-loop', d: 'M-100 200H250C300 200 300 290 350 290H610C660 290 660 200 710 200H1060' },
    ],
    trains: [
      train('el-local', 'el-loop', 'L 6101', 'cyan', [[0, 0], [2500, 0.38], [3500, 0.45], [8500, 0.45], [9500, 0.55], [DURATION, 1]]),
      train('el-express', 'el-main', 'E 6001', 'amber', [[0, 0], [2500, 0.2], [5500, 0.62], [8500, 0.95], [DURATION, 1]]),
    ],
    flows: [
      flow('M70 175H210', [[0, 3500]], 'cyan'),
      flow('M260 175H460', [[3500, 8500]], 'amber'),
      flow('M720 175H880', [[8500, 10500]], 'amber'),
      flow('M620 315H710', [[9500, DURATION]], 'mint'),
    ],
    callouts: [
      callout('el-c1', '快车在后方追近', 'SPEED DIFFERENCE', [[0, 2500]], 'amber', 255, 'M620 344L200 200'),
      callout('el-c2', '慢车经 W1 进站线', 'DIVERGE TO LOOP', [[2500, 3500]], 'cyan', 265, 'M620 344L350 290'),
      callout('el-c3', '慢车停站 · 正线让出', 'LOCAL DWELL', [[3500, 5500]], 'rose', 260, 'M620 344L480 290'),
      callout('el-c4', '快车沿正线越行', 'EXPRESS OVERTAKE', [[5500, 8500]], 'amber', 255, 'M620 344L480 200'),
      callout('el-c5', '出口进路恢复慢车', 'REJOIN MAIN LINE', [[8500, DURATION]], 'mint', 275, 'M620 344L710 200'),
    ],
    zones: [
      zoneStates('el-loop-zone', '越行线', [
        { time: 2500, state: 'occupied', text: '越行线 · 慢车占用' },
        { time: 8500, state: 'protected', text: '越行线 · 发车进路' },
        { time: 10500, state: 'clear', text: '越行线 · 空闲' },
      ]),
      zoneStates('el-main-zone', '直通正线', [
        { time: 3500, state: 'active', text: '直通正线 · 快车通过' },
        { time: 8500, state: 'clear', text: '直通正线 · 空闲' },
      ]),
    ],
    signals: [
      signalStates('el-s1', [
        { time: 2500, state: 'caution', text: 'S1 侧向进站线' },
        { time: 3500, state: 'stop', text: 'S1 慢车停站' },
        { time: 8500, state: 'clear', text: 'S1 直通开放' },
      ]),
      signalStates('el-s2', [
        { time: 5500, state: 'clear', text: 'S2 快车通过' },
        { time: 8500, state: 'active', text: 'S2 慢车出岔' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 快车与慢车接近越行站' },
      { time: 2500, text: '02 / 慢车转入越行线' },
      { time: 3500, text: '03 / 慢车停站，直通正线让出' },
      { time: 5500, text: '04 / 快车不停站直接越行' },
      { time: 8500, text: '05 / 快车出清，出口进路转换' },
      { time: 10500, text: '06 / 慢车返回正线' },
    ],
  }),
};

const storageSiding = {
  id: 'storage-siding',
  short: '存车线出入库',
  title: '存车线：备用车与夜间停放如何接入正线',
  summary: '存车线通过两端道岔连接运营正线，可停放备用列车或夜间收车。出入库必须占用道岔区，并与正线行车进路协调。',
  duration: DURATION,
  phases: [
    phase(0, '收车进路准备', '夜间回库列车接近，入口道岔转向存车线。'),
    phase(2000, '列车入库', '列车限速经道岔区进入存车线，正线进路需要短暂防护。'),
    phase(5000, '存车线占用', '列车在存车线停稳，道岔解锁；存车线标记为占用。'),
    phase(8000, '出库进路准备', '次日运营前，出库列车完成检查，出口道岔建立通向正线的进路。'),
    phase(10000, '列车出库', '列车从存车线驶出，经道岔区汇入正线。'),
    phase(12500, '存车线出清', '存车线恢复空闲，可供备用车停放或下一轮作业。'),
  ],
  legends: legends([
    { label: '入库列车', tone: 'cyan', shape: 'line' },
    { label: '出库列车', tone: 'mint', shape: 'line' },
  ]),
  notes: [
    '存车线可承担夜间停放、备用车待命、临时折返或故障车隔离等功能。',
    '道岔区是多股道共用的关键资源，出入库时不能与冲突的正线进路同时建立。',
    '图中把“夜间入库”和“次日出库”压缩在同一段时间轴上，便于连续观察。',
  ],
  spec: blockSpec({
    elements: [
      track('M40 120H920', 'neutral', { thin: true }),
      track('M40 200H920'),
      track('M250 200C300 200 300 320 350 320H920'),
      zone('ss-storage-zone', 330, 278, 430, 84, '存车线 A / 夜间停放'),
      zone('ss-throat-zone', 220, 160, 180, 180, '道岔区'),
      platformAt(720, 340, 150, 26, '存车线端'),
      switchNode(250, 200, 'W1'),
      switchNode(350, 320, 'W2'),
      signal('ss-s1', 190, 200, 'S1'),
      signal('ss-s2', 810, 200, 'S2'),
      arrow('M70 170H210', 'cyan', '入库方向', 140, 160),
      arrow('M760 170H890', 'mint', '出库方向', 825, 160),
      label(360, 405, '出入库须占用共用道岔区 · 与正线进路协调', { tone: 'neutral', size: 11 }),
    ],
    routes: [
      { id: 'ss-in', d: 'M-100 200H250C300 200 300 320 350 320H700' },
      { id: 'ss-out', d: 'M700 320H350C300 320 300 200 250 200H1060' },
    ],
    trains: [
      train('ss-night', 'ss-in', 'N 7001', 'cyan', [[0, 0], [2000, 0.4], [5000, 0.92], [6500, 1], [7000, 1]], { visible: [[0, 7000]] }),
      train('ss-morning', 'ss-out', 'M 7002', 'mint', [[8000, 0], [10000, 0.35], [12500, 0.75], [DURATION, 1]], { visible: [[8000, DURATION]] }),
    ],
    flows: [
      flow('M70 175H210', [[0, 5000]], 'cyan'),
      flow('M760 175H890', [[9000, DURATION]], 'mint'),
      flow('M250 200C300 200 300 320 350 320', [[1500, 5500]], 'cyan'),
      flow('M350 320C300 320 300 200 250 200', [[9500, 12500]], 'mint'),
    ],
    callouts: [
      callout('ss-c1', '夜间收车 · 道岔转向', 'ENTRY ROUTE SET', [[0, 2000]], 'cyan', 260, 'M620 344L250 200'),
      callout('ss-c2', '列车经道岔区入库', 'LIMITED SPEED', [[2000, 5000]], 'amber', 255, 'M620 344L350 320'),
      callout('ss-c3', '存车线占用 · 道岔解锁', 'STABLE / OCCUPIED', [[5000, 8000]], 'rose', 280, 'M620 344L540 320'),
      callout('ss-c4', '出库进路建立', 'DEPARTURE ROUTE', [[8000, 10000]], 'mint', 245, 'M620 344L350 320'),
      callout('ss-c5', '汇入正线 · 存车线出清', 'BACK TO SERVICE', [[10000, DURATION]], 'cyan', 280, 'M620 344L250 200'),
    ],
    zones: [
      zoneStates('ss-storage-zone', '存车线 A', [
        { time: 5000, state: 'occupied', text: '存车线 A · 夜间占用' },
        { time: 8000, state: 'protected', text: '存车线 A · 出库检查' },
        { time: 12500, state: 'clear', text: '存车线 A · 空闲' },
      ]),
      zoneStates('ss-throat-zone', '道岔区', [
        { time: 2000, state: 'occupied', text: '道岔区 · 入库占用' },
        { time: 5000, state: 'clear', text: '道岔区 · 解锁' },
        { time: 9500, state: 'occupied', text: '道岔区 · 出库占用' },
        { time: 12500, state: 'clear', text: '道岔区 · 解锁' },
      ]),
    ],
    signals: [
      signalStates('ss-s1', [
        { time: 0, state: 'caution', text: 'S1 限速入库' },
        { time: 5000, state: 'clear', text: 'S1 正线恢复' },
        { time: 9500, state: 'caution', text: 'S1 出库汇入' },
      ]),
      signalStates('ss-s2', [
        { time: 8000, state: 'active', text: 'S2 出库许可' },
        { time: 12500, state: 'clear', text: 'S2 正线开放' },
      ]),
    ],
    dynamicText: [
      { time: 0, text: '01 / 夜间收车，准备入库进路' },
      { time: 2000, text: '02 / 列车限速通过道岔区' },
      { time: 5000, text: '03 / 存车线占用，道岔解锁' },
      { time: 8000, text: '04 / 次日出库，建立出岔进路' },
      { time: 10000, text: '05 / 列车汇入运营正线' },
      { time: 12500, text: '06 / 存车线恢复空闲' },
    ],
  }),
};

function platformAt(x, y, w, h, labelText) {
  return { type: 'platform', x, y, w, h, label: labelText, tone: 'amber' };
}

export const blockScenarios = [
  singleBlock,
  passingLoop,
  fixedBlock,
  quasiMovingBlock,
  movingBlock,
  expressLocal,
  storageSiding,
];
