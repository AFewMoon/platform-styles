import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AnimationController,
  clampTime,
  formatTime,
  resolvePhaseIndex,
} from '../src/core/animation-controller.js';

function fixture(options = {}) {
  let now = 0;
  const rendered = [];
  const states = [];
  const controller = new AnimationController({
    duration: 1000,
    phases: [
      { start: 0, title: '进站' },
      { start: 500, title: '停站' },
      { start: 800, title: '出站' },
    ],
    clock: () => now,
    schedule: () => 1,
    cancel: () => {},
    render: (time) => rendered.push(time),
    onUpdate: (state) => states.push(state),
    ...options,
  });
  return {
    controller,
    rendered,
    states,
    setNow(value) {
      now = value;
    },
  };
}

test('clampTime 约束负数、超界和非有限时间', () => {
  assert.equal(clampTime(-100, 1000), 0);
  assert.equal(clampTime(2400, 1000), 1000);
  assert.equal(clampTime(Number.NaN, 1000), 0);
  assert.equal(clampTime(250, 0), 0);
});

test('resolvePhaseIndex 返回当前时间所属阶段', () => {
  const phases = [{ start: 0 }, { start: 400 }, { start: 900 }];
  assert.equal(resolvePhaseIndex(-10, phases), 0);
  assert.equal(resolvePhaseIndex(399, phases), 0);
  assert.equal(resolvePhaseIndex(400, phases), 1);
  assert.equal(resolvePhaseIndex(2000, phases), 2);
  assert.equal(resolvePhaseIndex(100, []), 0);
});

test('formatTime 输出分秒读数', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(3400), '00:03');
  assert.equal(formatTime(12500), '00:13');
  assert.equal(formatTime(65000), '01:05');
});

test('播放、倍速、暂停与恢复使用确定性时间轴', () => {
  const { controller, setNow } = fixture();
  assert.equal(controller.play(), true);
  assert.equal(controller.play(), false);

  setNow(100);
  controller.frame(100);
  assert.equal(controller.time, 100);

  assert.equal(controller.setSpeed(2), 2);
  setNow(300);
  controller.frame(300);
  assert.equal(controller.time, 500);

  assert.equal(controller.pause(), true);
  assert.equal(controller.playing, false);
  assert.equal(controller.time, 500);

  setNow(900);
  controller.play();
  setNow(1000);
  controller.frame(1000);
  assert.equal(controller.time, 700);
});

test('seek 支持比例与绝对时间，reset 回到起点', () => {
  const { controller } = fixture();
  controller.seek(0.25, { ratio: true });
  assert.equal(controller.time, 250);
  controller.seek(5000);
  assert.equal(controller.time, 1000);
  controller.seek(-50);
  assert.equal(controller.time, 0);
  assert.equal(controller.seek(Number.NaN), false);

  controller.play();
  controller.reset();
  assert.equal(controller.time, 0);
  assert.equal(controller.playing, false);
});

test('循环模式在总时长处回绕，非循环模式停在终点', () => {
  const looping = fixture();
  looping.controller.seek(900);
  looping.controller.play();
  looping.setNow(100);
  looping.controller.frame(100);
  assert.equal(looping.controller.time, 0);
  assert.equal(looping.controller.playing, true);

  const finite = fixture({ loop: false });
  finite.controller.seek(950);
  finite.controller.play();
  finite.setNow(100);
  finite.controller.frame(100);
  assert.equal(finite.controller.time, 1000);
  assert.equal(finite.controller.playing, false);
});

test('逐阶段切换与阶段状态同步', () => {
  const { controller, states } = fixture();
  controller.stepPhase(1);
  assert.equal(controller.time, 500);
  assert.equal(controller.getState().phaseIndex, 1);
  assert.equal(controller.getState().phase.title, '停站');
  controller.stepPhase(1);
  assert.equal(controller.time, 800);
  controller.stepPhase(-1);
  assert.equal(controller.time, 500);
  assert.ok(states.length >= 4);
});

test('destroy 停止播放并清理回调', () => {
  const { controller, rendered } = fixture();
  controller.play();
  controller.destroy();
  assert.equal(controller.playing, false);
  assert.equal(controller.destroyed, true);
  assert.equal(controller.play(), false);
  assert.equal(controller.seek(500), false);
  const renderedCount = rendered.length;
  controller.frame(1000);
  assert.equal(rendered.length, renderedCount);
});
