const VIEW = [0, 0, 960, 440];
const DURATION = 18000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const switchNode = (x, y, labelText, options = {}) => ({ type: 'switch', x, y, label: labelText, ...options });
const label = (x, y, text, options = {}) => ({ type: 'text', x, y, text, ...options });
const flow = (d, visible, tone = 'cyan') => ({ d, visible, tone });

function callout(id, title, subtext, visible, tone = 'cyan', w = 280, leaderD) {
  return { id, x: 620, y: 48, w, h: 54, title, subtext, visible, tone, leaderD };
}

function wagon(id, path, labelText, tone, start) {
  return {
    id,
    path,
    label: labelText,
    tone,
    width: 32,
    height: 16,
    keyframes: [[start, 0], [start + 600, 0.12], [start + 1800, 0.55], [start + 3000, 1]],
    easing: 'linear',
    visible: [[start, DURATION]],
  };
}

const humpYard = {
  id: 'hump-yard',
  short: '驼峰编组',
  title: '驼峰编组站：推送、解体、溜放与重新编组',
  summary: '调机把到达车列推上驼峰，车辆在峰顶按顺序逐辆摘钩，借重力沿溜放坡进入不同股道；车辆依次通过琥珀色道岔，不允许后车超越前车。',
  duration: DURATION,
  phases: [
    phase(0, '车列到达', '解体前的车列停在到达场，调车计划已确定每辆车应进入哪条编组线。'),
    phase(2500, '调机推送', '调机从车列后方持续推送，车辆低速接近峰顶。'),
    phase(5200, '01 号车摘钩', '第一辆车在峰顶摘钩，后续车辆仍在推送区保持顺序。'),
    phase(7000, '逐辆依次摘钩', '车辆按 1800ms 间隔依次进入溜放，任何后车都不得越过前车。'),
    phase(8800, '道岔依次分配', '车辆沿连通的琥珀色道岔进入各去向股道，进路随车序转换。'),
    phase(12400, '最后一辆溜放', '后续车辆完成分流，股道内按到达顺序集结。'),
    phase(16000, '股道集结与牵出', '编成车列整体牵往出发场，完成一次改编作业。'),
  ],
  legends: [
    { label: '调机 / 推送', tone: 'cyan', shape: 'line' },
    { label: '溜放车辆', tone: 'amber', shape: 'block' },
    { label: '琥珀色道岔 / 去向分配', tone: 'amber', shape: 'dot' },
    { label: '编组股道', tone: 'rose', shape: 'dash' },
  ],
  notes: [
    '驼峰利用纵断面高差：推送坡上坡、峰顶摘钩、溜放坡下坡，车辆靠重力进入股道。',
    '所有车辆从同一峰顶起点按序出现，后发车辆不会穿过仍在推送区的车辆。',
    '每辆车进入哪条股道由去向决定；道岔必须在相邻车辆的间隔内完成转换。',
    '下方曲线是纵断面示意，并非上方平面图的比例或同一视角。',
  ],
  spec: {
    viewBox: VIEW,
    elements: [
      zone('hy-arrival', 35, 100, 260, 185, '到达场 / 待解车列'),
      zone('hy-hump', 305, 100, 285, 185, '驼峰 / 推送与摘钩'),
      zone('hy-bowl', 600, 105, 325, 240, '编组场 / 分类线束'),
      track('M45 140H430', 'rose', { thin: true }),
      track('M45 200H430', 'rose', { thin: true }),
      track('M45 230H430', 'rose', { thin: true }),
      track('M45 260H430', 'rose', { thin: true }),
      track('M60 170H430', 'cyan'),
      track('M430 170H590', 'cyan'),
      track('M470 170C500 170 510 140 540 140H900', 'rose', { thin: true }),
      track('M500 170C525 170 535 190 560 190H900', 'rose', { thin: true }),
      track('M530 170C555 170 565 240 590 240H900', 'rose', { thin: true }),
      track('M560 170C585 170 595 290 620 290H900', 'rose', { thin: true }),
      track('M590 170C615 170 625 340 650 340H900', 'rose', { thin: true }),
      switchNode(430, 170, '峰顶'),
      switchNode(470, 170, 'W1', {
        tone: 'amber',
        highlight: true,
        linkD: 'M470 170C484 170 492 160 502 151',
      }),
      switchNode(500, 170, 'W2', {
        tone: 'amber',
        highlight: true,
        linkD: 'M500 170C516 170 524 181 536 186',
      }),
      switchNode(530, 170, 'W3', {
        tone: 'amber',
        highlight: true,
        linkD: 'M530 170C546 170 554 205 568 226',
      }),
      switchNode(560, 170, 'W4', {
        tone: 'amber',
        highlight: true,
        linkD: 'M560 170C576 170 584 247 598 278',
      }),
      switchNode(590, 170, 'W5', {
        tone: 'amber',
        highlight: true,
        linkD: 'M590 170C606 170 614 303 628 335',
      }),
      signal('hy-s1', 285, 170, '推送信号'),
      signal('hy-s2', 700, 140, 'A 线'),
      signal('hy-s3', 700, 340, 'E 线'),
      label(158, 95, '到达车列', { tone: 'cyan', size: 11 }),
      label(395, 95, '峰顶摘钩', { tone: 'amber', size: 11 }),
      label(760, 95, '按去向重新集结', { tone: 'mint', size: 11 }),
      label(610, 135, 'A 去向', { tone: 'rose', size: 10, align: 'start' }),
      label(610, 185, 'B 去向', { tone: 'amber', size: 10, align: 'start' }),
      label(610, 235, 'C 去向', { tone: 'cyan', size: 10, align: 'start' }),
      label(610, 285, 'D 去向', { tone: 'mint', size: 10, align: 'start' }),
      label(610, 335, 'E 去向', { tone: 'rose', size: 10, align: 'start' }),
      {
        type: 'profile',
        d: 'M40 400H220L300 365H360C410 365 430 400 480 400H920',
        fillD: 'M40 400H220L300 365H360C410 365 430 400 480 400H920V410H40Z',
        label: '纵断面 · 推送坡 → 峰顶 → 溜放坡',
        labelX: 480,
        labelY: 356,
      },
      label(150, 392, '推送坡', { tone: 'neutral', size: 10 }),
      label(330, 356, '峰顶', { tone: 'amber', size: 10 }),
      label(500, 392, '溜放坡与调速', { tone: 'neutral', size: 10 }),
    ],
    routes: [
      { id: 'hy-push', d: 'M80 170H390' },
      { id: 'hy-return', d: 'M390 170H80' },
      { id: 'hy-a', d: 'M450 170H470C500 170 510 140 540 140H860' },
      { id: 'hy-b', d: 'M450 170H500C525 170 535 190 560 190H860' },
      { id: 'hy-c', d: 'M450 170H530C555 170 565 240 590 240H860' },
      { id: 'hy-d', d: 'M450 170H560C585 170 595 290 620 290H860' },
      { id: 'hy-e', d: 'M450 170H590C615 170 625 340 650 340H860' },
      { id: 'hy-a2', d: 'M450 170H470C500 170 510 140 540 140H800' },
    ],
    trains: [
      {
        id: 'hy-loco',
        path: 'hy-push',
        label: '调机',
        tone: 'cyan',
        cars: 2,
        keyframes: [[0, 0], [2500, 0.55], [5000, 0.9], [9500, 0.9], [10000, 0.9]],
        visible: [[0, 10000]],
      },
      {
        id: 'hy-loco-return',
        path: 'hy-return',
        label: '调机返回',
        tone: 'mint',
        cars: 2,
        rotation: false,
        keyframes: [[10000, 0], [12500, 1]],
        visible: [[10000, 12500]],
      },
    ],
    wagons: [
      wagon('hy-w1', 'hy-a', '01', 'rose', 5200),
      wagon('hy-w2', 'hy-b', '02', 'amber', 7000),
      wagon('hy-w3', 'hy-c', '03', 'cyan', 8800),
      wagon('hy-w4', 'hy-d', '04', 'mint', 10600),
      wagon('hy-w5', 'hy-e', '05', 'rose', 12400),
      wagon('hy-w6', 'hy-a2', '06', 'amber', 14200),
    ],
    flows: [
      flow('M80 145H260', [[0, 2500]], 'cyan'),
      flow('M300 145H440', [[2500, 5200]], 'cyan'),
      flow('M470 170C500 170 510 140 540 140', [[5200, 8800]], 'amber'),
      flow('M500 170C525 170 535 190 560 190', [[7000, 10600]], 'amber'),
      flow('M530 170C555 170 565 240 590 240', [[8800, 12400]], 'amber'),
      flow('M560 170C585 170 595 290 620 290', [[10600, 14200]], 'amber'),
      flow('M590 170C615 170 625 340 650 340', [[12400, 16000]], 'amber'),
      flow('M800 240H900', [[16000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('hy-c1', '到达车列等待解体', 'ARRIVAL / DISASSEMBLY PLAN', [[0, 2500]], 'cyan', 300, 'M620 102L260 170'),
      callout('hy-c2', '调机持续推送上峰', 'PUSH OVER THE HUMP', [[2500, 5200]], 'amber', 285, 'M620 102L330 170'),
      callout('hy-c3', '峰顶按顺序逐辆摘钩', 'SEQUENTIAL UNCOUPLING', [[5200, 7000]], 'rose', 285, 'M620 102L450 170'),
      callout('hy-c4', '车辆依次溜放，不得超越', 'ONE CUT AT A TIME', [[7000, 8800]], 'amber', 285, 'M620 102L540 220'),
      callout('hy-c5', '琥珀色道岔依次分配去向', 'CONNECTED TURNOUT LADDER', [[8800, 12400]], 'mint', 295, 'M620 102L530 170'),
      callout('hy-c6', '股道内按序集结', 'ACCUMULATE WITHOUT OVERTAKING', [[12400, 16000]], 'cyan', 300, 'M620 102L760 240'),
      callout('hy-c7', '整列牵出至出发场', 'DEPARTURE COMPLETE', [[16000, DURATION]], 'mint', 265, 'M620 102L860 240'),
    ],
    zones: [
      {
        id: 'hy-arrival',
        states: [
          { time: 0, state: 'occupied', text: '到达场 · 待解车列' },
          { time: 2500, state: 'protected', text: '到达场 · 推送解体' },
          { time: 10000, state: 'clear', text: '到达场 · 线路释放' },
        ],
      },
      {
        id: 'hy-hump',
        states: [
          { time: 0, state: 'clear', text: '驼峰 / 准备推送' },
          { time: 2500, state: 'occupied', text: '驼峰 · 推送占用' },
          { time: 5200, state: 'active', text: '驼峰 · 逐辆摘钩' },
          { time: 16000, state: 'clear', text: '驼峰 · 一批作业结束' },
        ],
      },
      {
        id: 'hy-bowl',
        states: [
          { time: 0, state: 'clear', text: '编组场 / 空线' },
          { time: 5200, state: 'active', text: '编组场 · 依序溜入' },
          { time: 16000, state: 'occupied', text: '编组场 · 股道集结' },
          { time: 17500, state: 'clear', text: '编组场 · 车列牵出' },
        ],
      },
    ],
    signals: [
      {
        id: 'hy-s1',
        states: [
          { time: 0, state: 'clear', text: '推送信号 · 准备' },
          { time: 2500, state: 'active', text: '推送信号 · 允许上峰' },
          { time: 5000, state: 'stop', text: '推送信号 · 本批推送完毕' },
          { time: 10000, state: 'caution', text: '推送信号 · 调机返回' },
          { time: 12500, state: 'clear', text: '推送信号 · 可继续' },
        ],
      },
      {
        id: 'hy-s2',
        states: [
          { time: 0, state: 'clear', text: 'A 线 · 空闲' },
          { time: 5200, state: 'active', text: 'A 线 · 01 进入' },
          { time: 8800, state: 'caution', text: 'A 线 · 01 已集结' },
          { time: 14200, state: 'active', text: 'A 线 · 06 进入' },
          { time: 17200, state: 'clear', text: 'A 线 · 整列集结' },
        ],
      },
      {
        id: 'hy-s3',
        states: [
          { time: 0, state: 'clear', text: 'E 线 · 空闲' },
          { time: 12400, state: 'active', text: 'E 线 · 05 进入' },
          { time: 15400, state: 'caution', text: 'E 线 · 05 已集结' },
          { time: 16000, state: 'clear', text: 'E 线 · 待牵出' },
        ],
      },
    ],
    texts: [
      {
        x: 250,
        y: 68,
        class: 'dynamic-text',
        align: 'start',
        tone: 'cyan',
        states: [
          { time: 0, text: '01 / 车列到达，编组计划确定去向' },
          { time: 2500, text: '02 / 调机从后方推送到峰顶' },
          { time: 5200, text: '03 / 01 号车摘钩，后续车辆依次等待' },
          { time: 7000, text: '04 / 02 号车摘钩，沿琥珀色道岔进入 B 线' },
          { time: 8800, text: '05 / 车辆按序分流，不允许后车超越' },
          { time: 12400, text: '06 / 最后一辆进入股道，按去向集结' },
          { time: 16000, text: '07 / 整列牵出至出发场' },
        ],
      },
    ],
  },
};

export const yardScenarios = [humpYard];
