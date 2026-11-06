const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function clampTime(time, duration) {
  const numericDuration = Number(duration);
  if (!Number.isFinite(numericDuration) || numericDuration <= 0) return 0;
  const numericTime = Number(time);
  if (!Number.isFinite(numericTime)) return 0;
  return clamp(numericTime, 0, numericDuration);
}

export function resolvePhaseIndex(time, phases = []) {
  if (!Array.isArray(phases) || phases.length === 0) return 0;
  const numericTime = Math.max(0, Number(time) || 0);
  let index = 0;
  for (let i = 0; i < phases.length; i += 1) {
    const start = Number(phases[i]?.start) || 0;
    if (numericTime >= start) index = i;
    else break;
  }
  return index;
}

export function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.round(Number(milliseconds) / 1000) || 0);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export class AnimationController {
  constructor({
    duration,
    phases = [],
    render = () => {},
    onUpdate = () => {},
    loop = true,
    clock = () => performance.now(),
    schedule = (callback) => requestAnimationFrame(callback),
    cancel = (frameId) => cancelAnimationFrame(frameId),
  } = {}) {
    this.duration = Math.max(1, Number(duration) || 1);
    this.phases = Array.isArray(phases)
      ? [...phases].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0))
      : [];
    this.render = render;
    this.onUpdate = onUpdate;
    this.loop = Boolean(loop);
    this.clock = clock;
    this.schedule = schedule;
    this.cancel = cancel;

    this.time = 0;
    this.speed = 1;
    this.playing = false;
    this.destroyed = false;
    this.anchorTime = 0;
    this.anchorClock = Number(this.clock()) || 0;
    this.frameId = null;

    this.render(this.time, this.getState());
    this.emit();
  }

  getState() {
    return {
      time: this.time,
      duration: this.duration,
      progress: this.duration > 0 ? this.time / this.duration : 0,
      playing: this.playing,
      speed: this.speed,
      loop: this.loop,
      phaseIndex: resolvePhaseIndex(this.time, this.phases),
      phase: this.phases[resolvePhaseIndex(this.time, this.phases)] ?? null,
    };
  }

  emit() {
    this.onUpdate(this.getState());
  }

  play() {
    if (this.destroyed || this.playing) return false;
    if (!this.loop && this.time >= this.duration) this.time = 0;
    const now = Number(this.clock()) || 0;
    this.playing = true;
    this.anchorTime = this.time;
    this.anchorClock = now;
    this.queueFrame();
    this.emit();
    return true;
  }

  pause() {
    if (this.destroyed || !this.playing) return false;
    const now = Number(this.clock()) || 0;
    this.syncTime(now);
    this.playing = false;
    this.clearFrame();
    this.render(this.time, this.getState());
    this.emit();
    return true;
  }

  toggle() {
    return this.playing ? this.pause() : this.play();
  }

  reset() {
    if (this.destroyed) return false;
    this.clearFrame();
    this.playing = false;
    this.time = 0;
    this.anchorTime = 0;
    this.anchorClock = Number(this.clock()) || 0;
    this.render(this.time, this.getState());
    this.emit();
    return true;
  }

  seek(value, { ratio = false } = {}) {
    if (this.destroyed) return false;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return false;
    const nextTime = ratio ? numericValue * this.duration : numericValue;
    this.time = clampTime(nextTime, this.duration);
    this.anchorTime = this.time;
    this.anchorClock = Number(this.clock()) || 0;
    this.render(this.time, this.getState());
    this.emit();
    return true;
  }

  setSpeed(value) {
    if (this.destroyed) return this.speed;
    const nextSpeed = Number(value);
    if (!Number.isFinite(nextSpeed) || nextSpeed <= 0) return this.speed;
    if (this.playing) {
      const now = Number(this.clock()) || 0;
      this.syncTime(now);
      this.render(this.time, this.getState());
    }
    this.speed = nextSpeed;
    this.anchorTime = this.time;
    this.anchorClock = Number(this.clock()) || 0;
    this.emit();
    return this.speed;
  }

  stepPhase(direction) {
    if (this.destroyed || this.phases.length === 0) return false;
    const currentIndex = resolvePhaseIndex(this.time, this.phases);
    const currentStart = Number(this.phases[currentIndex]?.start) || 0;
    let targetIndex = direction > 0 ? currentIndex + 1 : currentIndex - 1;
    if (direction < 0 && this.time > currentStart + 250) targetIndex = currentIndex;
    targetIndex = clamp(targetIndex, 0, this.phases.length - 1);
    const targetStart = Number(this.phases[targetIndex]?.start) || 0;
    return this.seek(targetStart);
  }

  frame(now) {
    if (this.destroyed || !this.playing) return;
    this.syncTime(Number(now) || 0);
    this.render(this.time, this.getState());
    if (!this.loop && this.time >= this.duration) {
      this.playing = false;
      this.clearFrame();
      this.emit();
      return;
    }
    this.emit();
    this.queueFrame();
  }

  syncTime(now) {
    const elapsed = Math.max(0, now - this.anchorClock) * this.speed;
    const rawTime = this.anchorTime + elapsed;
    if (rawTime >= this.duration) {
      if (this.loop) {
        const wrapped = rawTime % this.duration;
        this.anchorTime = wrapped;
        this.anchorClock = now;
        this.time = clampTime(wrapped, this.duration);
      } else {
        this.time = this.duration;
      }
    } else {
      this.time = clampTime(rawTime, this.duration);
    }
  }

  queueFrame() {
    this.frameId = this.schedule((timestamp) => this.frame(timestamp));
  }

  clearFrame() {
    if (this.frameId !== null && this.frameId !== undefined) {
      this.cancel(this.frameId);
      this.frameId = null;
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.clearFrame();
    this.playing = false;
    this.destroyed = true;
    this.render = () => {};
    this.onUpdate = () => {};
  }
}
