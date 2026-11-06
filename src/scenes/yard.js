const VIEW = [0, 0, 960, 440];
const DURATION = 18000;

const phase = (start, title, detail) => ({ start, title, detail });
const track = (d, tone = 'neutral', extra = {}) => ({ type: 'track', d, tone, ...extra });
const zone = (id, x, y, w, h, label) => ({ type: 'zone', id, x, y, w, h, label });
const signal = (id, x, y, label) => ({ type: 'signal', id, x, y, label });
const switchNode = (x, y, labelText) => ({ type: 'switch', x, y, label: labelText });
const label = (x, y, text, options = {}) => ({ type: 'text', x, y, text, ...options });
const flow = (d, visible, tone = 'cyan') => ({ d, visible, tone });

function callout(id, title, subtext, visible, tone = 'cyan', w = 280, leaderD) {
  return { id, x: 620, y: 48, w, h: 54, title, subtext, visible, tone, leaderD };
}

function wagon(id, path, labelText, tone, start, endX = 850) {
  return {
    id,
    path,
    label: labelText,
    tone,
    width: 32,
    keyframes: [[start, 0], [start + 1200, 0.34], [start + 3000, 0.72], [start + 4600, 1]],
    easing: 'linear',
    visible: [[0, DURATION]],
    endX,
  };
}

const humpYard = {
  id: 'hump-yard',
  short: '驼峰编组',
  title: '驼峰编组站：推送、解体、溜放与重新编组',
  summary: '调机把到达车列推上驼峰，车辆在峰顶被逐辆摘钩，借重力沿溜放坡进入不同股道；道岔按去向排列，车辆在编组线内集结成新车列。',
  duration: DURATION,
  phases: [
    phase(0, '车列到达', '解体前的车列停在到达场，调车计划已确定每辆车应进入哪条编组线。'),
    phase(2500, '调机推送', '调机从车列后方持续推送，车辆以低速越过峰顶，而不是自行牵引上坡。'),
    phase(5000, '峰顶摘钩', '车辆到达峰顶附近依次摘钩，成为独立的溜放单元。'),
    phase(7500, '重力溜放', '摘钩车辆借坡度高差向编组场溜行，速度由制动设备控制。'),
    phase(10500, '道岔分配去向', '道岔在车辆间隙中快速转换，把不同去向的车辆导入对应股道。'),
    phase(13500, '股道内集结', '车辆在编组线内连挂，按去向形成新的车列；峰顶可继续下一批溜放。'),
    phase(16000, '牵出与出发', '编成的车列被牵往出发场，检查后挂上本务机，完成一次改编作业。'),
  ],
  legends: [
    { label: '调机 / 推送', tone: 'cyan', shape: 'line' },
    { label: '溜放车辆', tone: 'amber', shape: 'block' },
    { label: '道岔 / 去向分配', tone: 'mint', shape: 'dot' },
    { label: '编组股道', tone: 'rose', shape: 'dash' },
  ],
  notes: [
    '驼峰利用纵断面高差：推送坡上坡、峰顶摘钩、溜放坡下坡，车辆靠重力进入股道。',
    '实际作业还包括调车计划、车号核对、调速制动、防溜和连挂，图中只展示核心流程。',
    '每辆车进入哪条股道由去向决定；道岔必须在相邻车辆的间隔内完成转换。',
    '下方曲线是纵断面示意，并非上方平面图的比例或同一视角。',
  ],
  spec: {
    viewBox: VIEW,
    elements: [
      zone('hy-arrival', 35, 100, 260, 185, '到达场 / 待解车列'),
      zone('hy-hump', 305, 100, 180, 185, '驼峰 / 推送与摘钩'),
      zone('hy-bowl', 495, 100, 430, 245, '编组场 / 分类线束'),
      track('M45 140H430C470 140 480 140 520 140H900', 'rose', { thin: true }),
      track('M45 170H430C470 170 480 190 520 190H900', 'rose', { thin: true }),
      track('M45 200H430C470 200 480 240 520 240H900', 'rose', { thin: true }),
      track('M45 230H430C470 230 480 290 520 290H900', 'rose', { thin: true }),
      track('M45 260H430C470 260 480 340 520 340H900', 'rose', { thin: true }),
      track('M60 170H430', 'cyan'),
      switchNode(430, 170, '峰顶'),
      switchNode(470, 190, 'W1'),
      switchNode(490, 240, 'W2'),
      switchNode(510, 290, 'W3'),
      signal('hy-s1', 285, 170, '推送信号'),
      signal('hy-s2', 570, 140, 'A 线'),
      signal('hy-s3', 570, 340, 'E 线'),
      label(158, 95, '到达车列', { tone: 'cyan', size: 11 }),
      label(395, 95, '峰顶摘钩', { tone: 'amber', size: 11 }),
      label(710, 95, '按去向重新集结', { tone: 'mint', size: 11 }),
      label(560, 135, 'A 去向', { tone: 'rose', size: 10, align: 'start' }),
      label(560, 185, 'B 去向', { tone: 'amber', size: 10, align: 'start' }),
      label(560, 235, 'C 去向', { tone: 'cyan', size: 10, align: 'start' }),
      label(560, 285, 'D 去向', { tone: 'mint', size: 10, align: 'start' }),
      label(560, 335, 'E 去向', { tone: 'rose', size: 10, align: 'start' }),
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
      { id: 'hy-push', d: 'M80 170H425' },
      { id: 'hy-return', d: 'M425 170H80' },
      { id: 'hy-a', d: 'M220 170H430C470 140 480 140 520 140H850' },
      { id: 'hy-b', d: 'M260 170H430C470 170 480 190 520 190H850' },
      { id: 'hy-c', d: 'M300 170H430C470 200 480 240 520 240H850' },
      { id: 'hy-d', d: 'M340 170H430C470 230 480 290 520 290H850' },
      { id: 'hy-e', d: 'M380 170H430C470 260 480 340 520 340H850' },
      { id: 'hy-depart', d: 'M850 240H960' },
    ],
    trains: [
      {
        id: 'hy-loco',
        path: 'hy-push',
        label: '调机',
        tone: 'cyan',
        cars: 2,
        keyframes: [[0, 0], [2500, 0.18], [6500, 0.72], [9500, 0.94], [11000, 0.94]],
        visible: [[0, 11000]],
      },
      {
        id: 'hy-loco-return',
        path: 'hy-return',
        label: '调机返回',
        tone: 'mint',
        cars: 2,
        rotation: false,
        keyframes: [[11000, 0], [14000, 0.75], [15500, 1]],
        visible: [[11000, 15500]],
      },
      {
        id: 'hy-departure',
        path: 'hy-depart',
        label: '编成车列',
        tone: 'cyan',
        cars: 4,
        keyframes: [[16000, 0], [DURATION, 1]],
        visible: [[16000, DURATION]],
      },
    ],
    wagons: [
      wagon('hy-w1', 'hy-a', '01', 'rose', 5200),
      wagon('hy-w2', 'hy-b', '02', 'amber', 6500),
      wagon('hy-w3', 'hy-c', '03', 'cyan', 7800),
      wagon('hy-w4', 'hy-d', '04', 'mint', 9100),
      wagon('hy-w5', 'hy-e', '05', 'rose', 10400),
      wagon('hy-w6', 'hy-b', '06', 'amber', 11700),
    ],
    flows: [
      flow('M80 145H260', [[0, 5000]], 'cyan'),
      flow('M300 145H420', [[2500, 7500]], 'cyan'),
      flow('M430 170C470 170 480 190 520 190', [[5000, 10500]], 'amber'),
      flow('M430 170C470 230 480 290 520 290', [[7500, 13500]], 'amber'),
      flow('M800 240H900', [[16000, DURATION]], 'mint'),
    ],
    callouts: [
      callout('hy-c1', '到达车列等待解体', 'ARRIVAL / DISASSEMBLY PLAN', [[0, 2500]], 'cyan', 300, 'M620 102L260 170'),
      callout('hy-c2', '调机持续推送上峰', 'PUSH OVER THE HUMP', [[2500, 5000]], 'amber', 285, 'M620 102L330 170'),
      callout('hy-c3', '峰顶逐辆摘钩', 'UNCOUPLE AT CREST', [[5000, 7500]], 'rose', 265, 'M620 102L430 170'),
      callout('hy-c4', '重力溜放 · 控制速度', 'GRAVITY + RETARDERS', [[7500, 10500]], 'amber', 285, 'M620 102L480 240'),
      callout('hy-c5', '道岔按去向逐车转换', 'ROUTE EACH CUT', [[10500, 13500]], 'mint', 285, 'M620 102L490 240'),
      callout('hy-c6', '同去向车辆连挂集结', 'FORM NEW TRAIN', [[13500, 16000]], 'cyan', 280, 'M620 102L760 240'),
      callout('hy-c7', '牵出至出发场', 'DEPARTURE COMPLETE', [[16000, DURATION]], 'mint', 265, 'M620 102L860 240'),
    ],
    zones: [
      {
        id: 'hy-arrival',
        states: [
          { time: 0, state: 'occupied', text: '到达场 · 待解车列' },
          { time: 5000, state: 'protected', text: '到达场 · 推送解体' },
          { time: 11000, state: 'clear', text: '到达场 · 线路释放' },
        ],
      },
      {
        id: 'hy-hump',
        states: [
          { time: 0, state: 'clear', text: '驼峰 / 准备推送' },
          { time: 2500, state: 'occupied', text: '驼峰 · 推送占用' },
          { time: 5000, state: 'active', text: '驼峰 · 摘钩溜放' },
          { time: 13500, state: 'clear', text: '驼峰 · 一批作业结束' },
        ],
      },
      {
        id: 'hy-bowl',
        states: [
          { time: 0, state: 'clear', text: '编组场 / 空线' },
          { time: 7500, state: 'active', text: '编组场 · 车辆溜入' },
          { time: 13500, state: 'occupied', text: '编组场 · 同去向集结' },
          { time: 16000, state: 'clear', text: '编组场 · 车列牵出' },
        ],
      },
    ],
    signals: [
      {
        id: 'hy-s1',
        states: [
          { time: 0, state: 'clear', text: '推送信号 · 准备' },
          { time: 2500, state: 'active', text: '推送信号 · 允许上峰' },
          { time: 9500, state: 'stop', text: '推送信号 · 本批完成' },
          { time: 13500, state: 'clear', text: '推送信号 · 可继续' },
        ],
      },
      {
        id: 'hy-s2',
        states: [
          { time: 0, state: 'clear', text: 'A 线 · 空闲' },
          { time: 5200, state: 'active', text: 'A 线 · 01 进入' },
          { time: 13500, state: 'clear', text: 'A 线 · 集结' },
        ],
      },
      {
        id: 'hy-s3',
        states: [
          { time: 0, state: 'clear', text: 'E 线 · 空闲' },
          { time: 10400, state: 'active', text: 'E 线 · 05 进入' },
          { time: 13500, state: 'clear', text: 'E 线 · 集结' },
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
          { time: 2500, text: '02 / 调机从后方推送车列上峰' },
          { time: 5000, text: '03 / 峰顶逐辆摘钩，开始溜放' },
          { time: 7500, text: '04 / 车辆借重力下坡并受控调速' },
          { time: 10500, text: '05 / 道岔按去向在车组间转换' },
          { time: 13500, text: '06 / 同去向车辆在股道内连挂' },
          { time: 16000, text: '07 / 编成车列牵出，准备出发' },
        ],
      },
    ],
  },
};

export const yardScenarios = [humpYard];
