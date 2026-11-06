import { stationScenarios } from '../scenes/stations.js';
import { blockScenarios } from '../scenes/block-systems.js';
import { turnbackScenarios } from '../scenes/turnbacks.js';
import { yardScenarios } from '../scenes/yard.js';

const chapterSeeds = [
  {
    id: 'stations',
    number: '01',
    title: '车站布局',
    lead: '站台的位置决定乘客从哪里进出、在哪一侧候车，也决定站厅、通道与列车车门之间怎样组织两股方向相反的人流。',
    label: 'CHAPTER 01 · STATION LAYOUT',
    scenarios: stationScenarios,
  },
  {
    id: 'blocks',
    number: '02',
    title: '线路与闭塞',
    lead: '从单线的一区间一列车，到双线的分级防护，再到多线的快慢车分工，核心问题始终是：列车如何知道前方有多远是安全的。',
    label: 'CHAPTER 02 · BLOCK SYSTEMS',
    scenarios: blockScenarios,
  },
  {
    id: 'turnbacks',
    number: '03',
    title: '列车折返',
    lead: '终点站让列车换向后再次载客，需要渡线、折返线或环形线路，也必须安排进路转换、司机换端或列车本身完成掉头。',
    label: 'CHAPTER 03 · TURNBACK MOVEMENTS',
    scenarios: turnbackScenarios,
  },
  {
    id: 'yard',
    number: '04',
    title: '编组站',
    lead: '货车在编组站被拆解，又按去向重新集结。驼峰利用高差与道岔，把车辆逐辆溜放到不同的股道，形成新的车列。',
    label: 'CHAPTER 04 · MARSHALLING YARD',
    scenarios: yardScenarios,
  },
];

export const REQUIRED_SCENARIO_IDS = {
  stations: [
    'station-side',
    'station-island',
    'station-separated-island',
    'station-spanish',
  ],
  blocks: [
    'single-block',
    'passing-loop',
    'fixed-block',
    'quasi-moving-block',
    'moving-block',
    'express-local',
    'storage-siding',
  ],
  turnbacks: ['front-turnback', 'rear-turnback', 'balloon-loop'],
  yard: ['hump-yard'],
};

function normalizeScenario(scenario, chapter, localIndex, globalIndex) {
  if (!scenario || !scenario.id || !scenario.spec) {
    throw new Error(`场景数据不完整：章节 ${chapter.id}，序号 ${localIndex + 1}`);
  }
  const duration = Number(scenario.duration) || 12000;
  const phases = Array.isArray(scenario.phases) && scenario.phases.length > 0
    ? [...scenario.phases].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0))
    : [{ start: 0, title: '完整演示', detail: scenario.summary ?? '' }];
  return {
    ...scenario,
    duration,
    phases,
    legends: Array.isArray(scenario.legends) ? scenario.legends : [],
    notes: Array.isArray(scenario.notes) ? scenario.notes : [],
    chapter: chapter.id,
    chapterNumber: chapter.number,
    chapterTitle: chapter.title,
    chapterLabel: chapter.label,
    index: localIndex + 1,
    globalIndex,
  };
}

let globalIndex = 0;
export const chapters = chapterSeeds.map((chapter) => {
  const scenarios = chapter.scenarios.map((scenario, localIndex) => {
    globalIndex += 1;
    return normalizeScenario(scenario, chapter, localIndex, globalIndex);
  });
  return {
    ...chapter,
    scenarios,
    scenarioCount: scenarios.length,
  };
});

export const scenarios = chapters.flatMap((chapter) => chapter.scenarios);
export const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
export const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

export function getScenario(id) {
  return scenarioById.get(id) ?? null;
}

export function getChapterForScenario(id) {
  const scenario = getScenario(id);
  return scenario ? chapterById.get(scenario.chapter) : null;
}
