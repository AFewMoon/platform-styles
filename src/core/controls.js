import { formatTime, resolvePhaseIndex } from './animation-controller.js';

export class DemoControls {
  constructor(root) {
    this.root = root;
    this.controller = null;
    this.scenario = null;
    this.onState = () => {};
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;

    this.playButton = root.querySelector('[data-control="play"]');
    this.resetButton = root.querySelector('[data-control="reset"]');
    this.prevButton = root.querySelector('[data-control="prev"]');
    this.nextButton = root.querySelector('[data-control="next"]');
    this.playIcon = root.querySelector('[data-play-icon]');
    this.playLabel = root.querySelector('[data-play-label]');
    this.range = root.querySelector('[data-timeline-range]');
    this.currentTime = root.querySelector('[data-time-current]');
    this.totalTime = root.querySelector('[data-time-total]');
    this.speed = root.querySelector('[data-speed]');
    this.phaseIndex = root.querySelector('[data-phase-index]');
    this.phaseTitle = root.querySelector('[data-phase-title]');
    this.phaseDetail = root.querySelector('[data-phase-detail]');
    this.phaseList = root.querySelector('[data-phase-list]');

    this.registerEvents();
  }

  registerEvents() {
    this.playButton?.addEventListener('click', () => this.controller?.toggle(), { signal: this.signal });
    this.resetButton?.addEventListener('click', () => this.controller?.reset(), { signal: this.signal });
    this.prevButton?.addEventListener('click', () => this.controller?.stepPhase(-1), { signal: this.signal });
    this.nextButton?.addEventListener('click', () => this.controller?.stepPhase(1), { signal: this.signal });

    this.range?.addEventListener(
      'input',
      (event) => this.controller?.seek(Number(event.target.value) / 1000, { ratio: true }),
      { signal: this.signal },
    );

    this.speed?.addEventListener(
      'change',
      (event) => this.controller?.setSpeed(Number(event.target.value)),
      { signal: this.signal },
    );

    this.phaseList?.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('[data-phase]');
        if (!button || !this.controller || !this.scenario) return;
        const index = Number(button.dataset.phase);
        const phase = this.scenario.phases[index];
        if (phase) this.controller.seek((Number(phase.start) || 0) + 1);
      },
      { signal: this.signal },
    );
  }

  bind(controller, scenario, onState = () => {}) {
    this.controller = controller;
    this.scenario = scenario;
    this.onState = onState;
    if (this.totalTime) this.totalTime.textContent = formatTime(scenario.duration);
    controller.onUpdate = (state) => {
      this.sync(state);
      this.onState(state);
    };
    controller.emit();
  }

  sync(state) {
    if (!this.scenario) return;
    const phases = this.scenario.phases ?? [];
    const phaseIndex = resolvePhaseIndex(state.time, phases);
    const phase = phases[phaseIndex] ?? { title: '演示准备', detail: '' };
    const progress = Math.max(0, Math.min(1, state.progress));

    if (this.playIcon) this.playIcon.textContent = state.playing ? '❚❚' : '▶';
    if (this.playLabel) this.playLabel.textContent = state.playing ? '暂停' : '播放';
    this.playButton?.setAttribute('aria-label', state.playing ? '暂停动画' : '播放动画');

    if (this.currentTime) this.currentTime.textContent = formatTime(state.time);
    if (this.range) {
      const sliderValue = Math.round(progress * 1000);
      if (document.activeElement !== this.range) {
        this.range.value = String(sliderValue);
      }
      this.range.style.setProperty('--progress', `${(progress * 100).toFixed(2)}%`);
      this.range.setAttribute('aria-valuetext', `${formatTime(state.time)} / ${formatTime(state.duration)}`);
    }

    if (this.phaseIndex) {
      this.phaseIndex.textContent = `${String(phaseIndex + 1).padStart(2, '0')} / ${String(phases.length).padStart(2, '0')}`;
    }
    if (this.phaseTitle) this.phaseTitle.textContent = phase.title;
    if (this.phaseDetail) this.phaseDetail.textContent = phase.detail;

    this.phaseList?.querySelectorAll('[data-phase]').forEach((button, index) => {
      const isActive = index === phaseIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'step' : 'false');
      button.setAttribute('aria-label', `跳到阶段 ${index + 1}：${phases[index]?.title ?? ''}`);
    });

    if (this.prevButton) this.prevButton.disabled = state.time <= 0;
    if (this.nextButton) this.nextButton.disabled = phaseIndex >= phases.length - 1;
  }

  destroy() {
    this.abortController.abort();
    this.controller = null;
    this.scenario = null;
  }
}
