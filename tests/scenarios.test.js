import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chapters,
  REQUIRED_SCENARIO_IDS,
  scenarioById,
  scenarios,
} from '../src/data/scenarios.js';
import { isMoverInsideFrame, isVisible, sampleFrames, sampleState } from '../src/core/svg-primitives.js';

const SUPPORTED_ELEMENT_TYPES = new Set([
  'track', 'platform', 'building', 'zone', 'signal', 'switch',
  'boundary', 'arrow', 'profile', 'label', 'text', 'rect', 'line', 'circle',
]);

test('章节与场景数量符合规划', () => {
  assert.equal(chapters.length, 4);
  assert.deepEqual(chapters.map((chapter) => chapter.id), ['stations', 'blocks', 'turnbacks', 'yard']);
  assert.deepEqual(chapters.map((chapter) => chapter.scenarioCount), [3, 7, 3, 1]);
  assert.equal(scenarios.length, 14);
  assert.equal(scenarioById.size, 14);
});

test('用户要求的全部场景均已注册且 ID 唯一', () => {
  const requiredIds = Object.values(REQUIRED_SCENARIO_IDS).flat();
  assert.equal(requiredIds.length, 14);
  requiredIds.forEach((id) => assert.ok(scenarioById.has(id), `缺少场景 ${id}`));
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  assert.ok(scenarioById.has('station-spanish'));
  assert.ok(scenarioById.has('balloon-loop'));
  assert.ok(scenarioById.has('hump-yard'));
});

test('每个场景具备完整可演示元数据', () => {
  scenarios.forEach((scenario) => {
    assert.ok(scenario.title, `${scenario.id} 缺少标题`);
    assert.ok(scenario.short, `${scenario.id} 缺少短标题`);
    assert.ok(scenario.summary, `${scenario.id} 缺少摘要`);
    assert.ok(scenario.duration >= 10000, `${scenario.id} 时长过短`);
    assert.ok(scenario.phases.length >= 4, `${scenario.id} 阶段过少`);
    assert.ok(scenario.legends.length >= 3, `${scenario.id} 图例过少`);
    assert.ok(scenario.notes.length >= 3, `${scenario.id} 观察要点过少`);
    assert.ok(scenario.chapter && scenario.chapterTitle, `${scenario.id} 缺少章节关联`);

    const starts = scenario.phases.map((item) => Number(item.start) || 0);
    assert.equal(starts[0], 0, `${scenario.id} 第一阶段必须从 0 开始`);
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b), `${scenario.id} 阶段时间未排序`);
    assert.ok(starts.every((start) => start < scenario.duration), `${scenario.id} 存在超出时长的阶段`);
    scenario.phases.forEach((item) => {
      assert.ok(item.title && item.detail, `${scenario.id} 阶段文字不完整`);
    });
  });
});

test('每个 SVG 场景的数据引用与图元类型有效', () => {
  scenarios.forEach((scenario) => {
    const spec = scenario.spec;
    assert.ok(Array.isArray(spec.viewBox) && spec.viewBox.length === 4, `${scenario.id} viewBox 无效`);
    assert.ok(Array.isArray(spec.elements) && spec.elements.length > 0, `${scenario.id} 缺少静态图元`);
    assert.ok(Array.isArray(spec.routes) && spec.routes.length > 0, `${scenario.id} 缺少运动路径`);

    spec.elements.forEach((element) => {
      assert.ok(SUPPORTED_ELEMENT_TYPES.has(element.type), `${scenario.id} 不支持的图元 ${element.type}`);
    });

    const routeIds = new Set(spec.routes.map((route) => route.id));
    assert.equal(routeIds.size, spec.routes.length, `${scenario.id} 路径 ID 重复`);
    const movers = [
      ...(spec.trains ?? []),
      ...(spec.wagons ?? []),
      ...(spec.passengers ?? []),
    ];
    assert.ok(movers.length > 0, `${scenario.id} 缺少运动对象`);
    movers.forEach((mover) => {
      assert.ok(routeIds.has(mover.path), `${scenario.id} 运动对象引用了不存在的路径 ${mover.path}`);
      assert.ok(Array.isArray(mover.keyframes) && mover.keyframes.length >= 2, `${scenario.id} 运动关键帧不足`);
      mover.keyframes.forEach((frame) => {
        assert.ok(Number.isFinite(Number(frame[0])), `${scenario.id} 关键帧时间无效`);
        assert.ok(Number.isFinite(Number(frame[1])), `${scenario.id} 关键帧进度无效`);
      });
    });

    const staticById = new Map(
      spec.elements.filter((element) => element.id).map((element) => [element.id, element]),
    );
    (spec.zones ?? []).forEach((config) => {
      assert.equal(staticById.get(config.id)?.type, 'zone', `${scenario.id} 动态区间引用了不存在的 zone ${config.id}`);
      assert.ok(config.states.length > 0, `${scenario.id} 动态区间缺少状态`);
    });
    (spec.signals ?? []).forEach((config) => {
      assert.equal(staticById.get(config.id)?.type, 'signal', `${scenario.id} 动态信号引用了不存在的 signal ${config.id}`);
      assert.ok(config.states.length > 0, `${scenario.id} 动态信号缺少状态`);
    });
    (spec.movingZones ?? []).forEach((config) => {
      assert.ok(config.x.length >= 2 && config.w.length >= 2, `${scenario.id} 移动区间关键帧不足`);
    });
    (spec.callouts ?? []).forEach((config) => {
      assert.ok(Array.isArray(config.visible), `${scenario.id} 标注缺少可见区间`);
    });
  });
});

test('时间轴辅助函数处理边界、插值与可见区间', () => {
  assert.equal(sampleFrames([[0, 0], [1000, 1]], -100, 'linear'), 0);
  assert.equal(sampleFrames([[0, 0], [1000, 1]], 500, 'linear'), 0.5);
  assert.equal(sampleFrames([[0, 0], [1000, 1]], 2000, 'linear'), 1);
  assert.equal(sampleFrames([[0, 0], [1000, 1]], 500, 'smooth'), 0.5);
  assert.equal(sampleFrames([[0, 0], [1000, 1]], 250, 'easeOut'), 0.578125);
  assert.equal(sampleFrames([], 500), 0);

  const states = [{ time: 0, state: 'clear', text: '空闲' }, { time: 500, state: 'occupied', text: '占用' }];
  assert.equal(sampleState(states, 499).state, 'clear');
  assert.equal(sampleState(states, 500).text, '占用');
  assert.equal(sampleState(states, 5000).state, 'occupied');

  assert.equal(isVisible(undefined, 100), true);
  assert.equal(isVisible([[0, 500]], 500), true);
  assert.equal(isVisible([[0, 500]], 501), false);
  assert.equal(isVisible([{ start: 500, end: 1000 }], 700), true);
  assert.equal(isVisible([], 700), false);
});

test('关键动画修正具备回归约束', () => {
  const fixed = scenarioById.get('fixed-block');
  assert.equal(fixed.spec.zones.length, 5);
  assert.equal(fixed.spec.signals.length, 5);
  fixed.spec.signals.forEach((config) => {
    assert.ok(config.states.some((state) => state.state === 'stop'), `${config.id} 缺少停车状态`);
  });

  const rear = scenarioById.get('rear-turnback');
  const rearRoute = rear.spec.routes[0].d;
  assert.match(rearRoute, /H840H780/);
  assert.match(rearRoute, /C740 170 740 270 700 270/);
  assert.doesNotMatch(rearRoute, /C850 170 850 270/);

  const hump = scenarioById.get('hump-yard');
  const startTimes = hump.spec.wagons.map((item) => item.keyframes[0][0]);
  assert.equal(new Set(startTimes).size, hump.spec.wagons.length);
  startTimes.slice(1).forEach((start, index) => {
    assert.ok(start - startTimes[index] >= 1500, '驼峰车辆摘钩间隔不足');
  });
  hump.spec.wagons.forEach((item) => {
    assert.equal(item.visible[0][0], item.keyframes[0][0]);
    assert.match(hump.spec.routes.find((route) => route.id === item.path).d, /^M450 170/);
  });

  const spanish = scenarioById.get('station-spanish');
  const buildingLabels = spanish.spec.elements
    .filter((element) => element.type === 'building')
    .map((element) => element.label);
  assert.deepEqual(buildingLabels, ['进站厅 A', '进站厅 B', '出站厅']);
  const routeData = new Map(spanish.spec.routes.map((route) => [route.id, route.d]));
  assert.match(routeData.get('spanish-board-up'), /^M125 158H300/);
  assert.match(routeData.get('spanish-board-down'), /^M125 306H300/);
  assert.match(routeData.get('spanish-alight-up'), /H835$/);
  assert.match(routeData.get('spanish-alight-down'), /H835$/);
});

test('运动对象只有完整进入图框时才可见', () => {
  const bounds = { minX: 0, minY: 0, maxX: 960, maxY: 440 };
  assert.equal(isMoverInsideFrame({ x: 480, y: 220, halfWidth: 52, halfHeight: 11 }, bounds, 12), true);
  assert.equal(isMoverInsideFrame({ x: 40, y: 220, halfWidth: 52, halfHeight: 11 }, bounds, 12), false);
  assert.equal(isMoverInsideFrame({ x: 930, y: 220, halfWidth: 52, halfHeight: 11 }, bounds, 12), false);
  assert.equal(isMoverInsideFrame({ x: 480, y: 20, halfWidth: 52, halfHeight: 11 }, bounds, 12), false);
  assert.equal(isMoverInsideFrame({ x: 930, y: 220, angle: 90, halfWidth: 52, halfHeight: 11 }, bounds, 12), true);
});
