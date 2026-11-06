import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chapters,
  REQUIRED_SCENARIO_IDS,
  scenarioById,
  scenarios,
} from '../src/data/scenarios.js';
import { isVisible, sampleFrames, sampleState } from '../src/core/svg-primitives.js';

const SUPPORTED_ELEMENT_TYPES = new Set([
  'track', 'platform', 'building', 'zone', 'signal', 'switch',
  'boundary', 'arrow', 'profile', 'label', 'text', 'rect', 'line', 'circle',
]);

test('章节与场景数量符合规划', () => {
  assert.equal(chapters.length, 4);
  assert.deepEqual(chapters.map((chapter) => chapter.id), ['stations', 'blocks', 'turnbacks', 'yard']);
  assert.deepEqual(chapters.map((chapter) => chapter.scenarioCount), [4, 7, 3, 1]);
  assert.equal(scenarios.length, 15);
  assert.equal(scenarioById.size, 15);
});

test('用户要求的全部场景均已注册且 ID 唯一', () => {
  const requiredIds = Object.values(REQUIRED_SCENARIO_IDS).flat();
  assert.equal(requiredIds.length, 15);
  requiredIds.forEach((id) => assert.ok(scenarioById.has(id), `缺少场景 ${id}`));
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  assert.ok(scenarioById.has('station-separated-island'));
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

    const staticIds = new Set(spec.elements.filter((element) => element.id).map((element) => element.id));
    (spec.zones ?? []).forEach((config) => {
      assert.ok(staticIds.has(config.id), `${scenario.id} 动态区间引用了不存在的 zone ${config.id}`);
      assert.ok(config.states.length > 0, `${scenario.id} 动态区间缺少状态`);
    });
    (spec.signals ?? []).forEach((config) => {
      assert.ok(staticIds.has(config.id), `${scenario.id} 动态信号引用了不存在的 signal ${config.id}`);
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
