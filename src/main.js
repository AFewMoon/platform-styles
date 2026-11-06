import './styles.css';
import './scenes.css';
import { AnimationController } from './core/animation-controller.js';
import { DemoControls } from './core/controls.js';
import { createSvgScene } from './core/svg-primitives.js';
import { chapters, chapterById, scenarioById, scenarios } from './data/scenarios.js';

const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sectionsRoot = document.getElementById('chapter-sections');
const noticeRoot = document.getElementById('app-notice');
const progressBar = document.querySelector('.scroll-progress span');
const runtime = new Map();
let activeChapterId = chapters[0]?.id ?? null;
let noticeTimer = null;
let scrollFrame = null;

function showNotice(message) {
  if (!noticeRoot) return;
  noticeRoot.textContent = message;
  noticeRoot.classList.add('is-visible');
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => noticeRoot.classList.remove('is-visible'), 4200);
}

function controlBarMarkup() {
  return `
    <div class="control-bar" role="group" aria-label="动画播放控制">
      <div class="control-buttons">
        <button class="control-button" data-control="play" type="button" aria-label="播放动画">
          <span class="play-icon" data-play-icon aria-hidden="true">▶</span>
          <span class="control-text" data-play-label>播放</span>
        </button>
        <button class="control-button" data-control="reset" type="button" aria-label="重置动画">↺ <span class="control-text">重置</span></button>
        <button class="control-button" data-control="prev" type="button" aria-label="上一阶段">‹ <span class="control-text">上一阶段</span></button>
        <button class="control-button" data-control="next" type="button" aria-label="下一阶段">› <span class="control-text">下一阶段</span></button>
      </div>
      <div class="timeline">
        <div class="time-readout">
          <span data-time-current>00:00</span>
          <span>进度 / <span data-time-total>00:12</span></span>
        </div>
        <input class="timeline-range" type="range" min="0" max="1000" value="0" step="1"
          data-timeline-range aria-label="演示进度" aria-valuetext="00:00 / 00:12" />
      </div>
      <label class="speed-control">
        速度
        <select data-speed aria-label="播放速度">
          <option value="0.5">0.5×</option>
          <option value="1" selected>1.0×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2.0×</option>
        </select>
      </label>
    </div>
  `;
}

function chapterMarkup(chapter) {
  const tabs = chapter.scenarios.map((scenario, index) => `
    <button class="scene-tab${index === 0 ? ' is-active' : ''}" type="button" role="tab"
      id="tab-${escapeHTML(scenario.id)}"
      aria-controls="workbench-${escapeHTML(chapter.id)}"
      aria-selected="${index === 0 ? 'true' : 'false'}"
      tabindex="${index === 0 ? '0' : '-1'}"
      data-scene="${escapeHTML(scenario.id)}">
      <span class="tab-index">${String(index + 1).padStart(2, '0')}</span>
      <span>${escapeHTML(scenario.short)}</span>
    </button>
  `).join('');

  return `
    <section class="chapter" id="${escapeHTML(chapter.id)}" data-chapter-section="${escapeHTML(chapter.id)}">
      <div class="chapter-heading">
        <div class="chapter-kicker">CHAPTER ${escapeHTML(chapter.number)}<span>${String(chapter.scenarioCount).padStart(2, '0')} 个动态图解</span></div>
        <div>
          <h2>${escapeHTML(chapter.title)}</h2>
          <p>${escapeHTML(chapter.lead)}</p>
        </div>
      </div>

      <div class="scene-tabs" role="tablist" aria-label="${escapeHTML(chapter.title)}场景选择">${tabs}</div>

      <div class="workbench" id="workbench-${escapeHTML(chapter.id)}" role="tabpanel"
        aria-labelledby="tab-${escapeHTML(chapter.scenarios[0].id)}" data-workbench="${escapeHTML(chapter.id)}">
        <div class="stage-header">
          <div>
            <div class="scene-meta" data-scene-meta>DEMO 01 / ${escapeHTML(chapter.title)}</div>
            <h3 data-scene-title>${escapeHTML(chapter.scenarios[0].title)}</h3>
            <p class="scene-summary" data-scene-summary>${escapeHTML(chapter.scenarios[0].summary)}</p>
          </div>
          <div class="scene-id-badge" data-scene-badge>${escapeHTML(chapter.scenarios[0].id.toUpperCase())}</div>
        </div>

        <div class="workbench-layout">
          <div class="diagram-shell">
            <div class="diagram-topbar">
              <span><i class="live-dot"></i><span data-diagram-label>FIG. 01 · ${escapeHTML(chapter.scenarios[0].title)}</span></span>
              <span data-diagram-state>READY / STATIC</span>
            </div>
            <div class="scene-canvas" data-scene-canvas tabindex="0" aria-label="铁路动态图解，小屏幕可横向滚动查看"></div>
            <div class="diagram-footer">
              <span data-diagram-footer>${escapeHTML(chapter.scenarios[0].id.toUpperCase())} · SCHEMATIC VIEW</span>
              <span>颜色 + 文字 + 方向 / 状态可辨识</span>
            </div>
          </div>

          <aside class="info-panel" aria-label="演示说明">
            <div class="phase-card" aria-live="polite">
              <span class="section-label">当前阶段 / PHASE</span>
              <div class="phase-index" data-phase-index>01 / 01</div>
              <h4 data-phase-title>准备</h4>
              <p class="phase-detail" data-phase-detail></p>
              <ol class="phase-list" data-phase-list></ol>
            </div>
            <div class="legend-card">
              <span class="section-label">图例 / LEGEND</span>
              <ul class="legend-list" data-legend-list></ul>
            </div>
            <div class="note-card">
              <span class="section-label">观察要点 / KEY POINTS</span>
              <ul data-note-list></ul>
            </div>
          </aside>
        </div>
        ${controlBarMarkup()}
      </div>
    </section>
  `;
}

function renderList(container, items, createItem) {
  if (!container) return;
  container.replaceChildren(...items.map(createItem));
}

function renderPhaseButtons(container, scenario) {
  renderList(container, scenario.phases, (phase, index) => {
    const item = document.createElement('li');
    item.style.flex = '1';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.phase = String(index);
    button.title = phase.title;
    item.appendChild(button);
    return item;
  });
}

function renderWorkbenchText(workbench, scenario) {
  const setText = (selector, value) => {
    const node = workbench.querySelector(selector);
    if (node) node.textContent = value;
  };
  setText('[data-scene-meta]', `DEMO ${String(scenario.index).padStart(2, '0')} / ${scenario.chapterTitle}`);
  setText('[data-scene-title]', scenario.title);
  setText('[data-scene-summary]', scenario.summary);
  setText('[data-scene-badge]', scenario.id.toUpperCase());
  setText('[data-diagram-label]', `FIG. ${String(scenario.globalIndex).padStart(2, '0')} · ${scenario.title}`);
  setText('[data-diagram-footer]', `${scenario.id.toUpperCase()} · SCHEMATIC VIEW`);

  renderPhaseButtons(workbench.querySelector('[data-phase-list]'), scenario);
  renderList(workbench.querySelector('[data-legend-list]'), scenario.legends, (legend) => {
    const item = document.createElement('li');
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.dataset.tone = legend.tone ?? 'neutral';
    swatch.dataset.shape = legend.shape ?? 'block';
    const text = document.createElement('span');
    text.textContent = legend.label;
    item.append(swatch, text);
    return item;
  });
  renderList(workbench.querySelector('[data-note-list]'), scenario.notes, (note) => {
    const item = document.createElement('li');
    item.textContent = note;
    return item;
  });
}

function updateTabs(selectedScenarioId) {
  document.querySelectorAll('.scene-tab').forEach((tab) => {
    const active = tab.dataset.scene === selectedScenarioId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = active ? 0 : -1;
  });
  const selected = scenarioById.get(selectedScenarioId);
  const workbench = document.querySelector(`[data-workbench="${selected?.chapter}"]`);
  if (workbench && selected) {
    workbench.setAttribute('aria-labelledby', `tab-${selected.id}`);
    workbench.dataset.currentScene = selected.id;
  }
  document.body.dataset.activeScene = selectedScenarioId;
}

function pauseWithoutLosingIntent(entry) {
  if (!entry?.controller) return;
  entry.suppressIntentUpdate = true;
  entry.controller.pause();
  entry.suppressIntentUpdate = false;
}

function resumeActiveIfPossible() {
  if (!activeChapterId || document.hidden || reduceMotion.matches) return;
  const entry = runtime.get(activeChapterId);
  if (!entry || !entry.wantPlaying || !entry.visible || !entry.controller) return;
  entry.suppressIntentUpdate = true;
  entry.controller.play();
  entry.suppressIntentUpdate = false;
}

function activateChapter(chapterId, { autoPlay = false } = {}) {
  if (!chapterById.has(chapterId)) return;
  activeChapterId = chapterId;
  runtime.forEach((entry, id) => {
    if (id !== chapterId) pauseWithoutLosingIntent(entry);
  });
  const activeEntry = runtime.get(chapterId);
  if (!activeEntry) return;
  if (autoPlay && !reduceMotion.matches) activeEntry.wantPlaying = true;
  document.body.dataset.activeChapter = chapterId;
  document.body.dataset.activeScene = activeEntry.scenario?.id ?? '';
  resumeActiveIfPossible();
}

function mountScene(chapterId, scenarioId, { autoPlay = false } = {}) {
  const chapter = chapterById.get(chapterId);
  const scenario = scenarioById.get(scenarioId);
  const workbench = document.querySelector(`[data-workbench="${chapterId}"]`);
  if (!chapter || !scenario || !workbench) return false;

  const canvas = workbench.querySelector('[data-scene-canvas]');
  const oldEntry = runtime.get(chapterId);
  oldEntry?.controller?.destroy();
  oldEntry?.scene?.destroy();

  try {
    const scene = createSvgScene(scenario);
    canvas.replaceChildren(scene.svg);

    const controller = new AnimationController({
      duration: scenario.duration,
      phases: scenario.phases,
      render: (time) => scene.render(time),
    });
    let controls = oldEntry?.controls;
    if (!controls) controls = new DemoControls(workbench);

    const entry = {
      chapterId,
      scenario,
      scene,
      controller,
      controls,
      wantPlaying: oldEntry?.wantPlaying ?? false,
      visible: oldEntry?.visible ?? false,
      suppressIntentUpdate: true,
    };
    runtime.set(chapterId, entry);

    controls.bind(controller, scenario, (state) => {
      if (!entry.suppressIntentUpdate) entry.wantPlaying = state.playing;
      const stateNode = workbench.querySelector('[data-diagram-state]');
      if (stateNode) {
        stateNode.textContent = state.playing
          ? `RUNNING / ${state.speed.toFixed(1)}×`
          : `PAUSED / ${String(state.phaseIndex + 1).padStart(2, '0')}`;
      }
    });
    const speedSelect = workbench.querySelector('[data-speed]');
    if (speedSelect) controller.setSpeed(Number(speedSelect.value) || 1);
    entry.suppressIntentUpdate = false;

    renderWorkbenchText(workbench, scenario);
    updateTabs(scenarioId);
    controller.emit();
    activateChapter(chapterId, { autoPlay });
    return true;
  } catch (error) {
    console.error('场景载入失败', error);
    canvas.replaceChildren();
    const fallback = document.createElement('p');
    fallback.className = 'scene-empty';
    fallback.textContent = '当前图解暂时无法载入，请刷新页面或选择其他演示。';
    canvas.appendChild(fallback);
    showNotice('当前图解暂时无法载入，已保留其他章节。');
    return false;
  }
}

function readScenarioFromHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const directId = decoded.startsWith('scene=') ? decoded.slice(6) : decoded;
    return scenarioById.has(directId) ? directId : raw;
  } catch {
    return null;
  }
}

function writeScenarioHash(scenarioId) {
  const nextHash = `#scene=${encodeURIComponent(scenarioId)}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}

function selectScene(scenarioId, { fromHash = false, autoPlay = false } = {}) {
  let scenario = scenarioById.get(scenarioId);
  if (!scenario) {
    showNotice('未找到该演示，已切换到第一个图解。');
    scenario = scenarios[0];
    writeScenarioHash(scenario.id);
  }
  const success = mountScene(scenario.chapter, scenario.id, { autoPlay });
  if (success && !fromHash) writeScenarioHash(scenario.id);
  return success;
}

function initSections() {
  if (!sectionsRoot) return;
  sectionsRoot.innerHTML = chapters.map(chapterMarkup).join('');
}

function initEvents() {
  sectionsRoot?.addEventListener('click', (event) => {
    const tab = event.target.closest('.scene-tab');
    if (!tab) return;
    const scenario = scenarioById.get(tab.dataset.scene);
    if (!scenario) return;
    selectScene(scenario.id, { autoPlay: !reduceMotion.matches });
  });

  sectionsRoot?.addEventListener('keydown', (event) => {
    const tab = event.target.closest('.scene-tab');
    if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const tabList = tab.closest('.scene-tabs');
    const tabs = Array.from(tabList?.querySelectorAll('.scene-tab') ?? []);
    const current = tabs.indexOf(tab);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (tabs[next]) {
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  });

  document.querySelectorAll('[data-nav], .entry-card').forEach((link) => {
    link.addEventListener('click', () => {
      const chapterId = link.dataset.nav ?? link.getAttribute('href')?.replace('#', '');
      if (chapterId && chapterById.has(chapterId)) {
        activateChapter(chapterId, { autoPlay: !reduceMotion.matches });
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const scenarioId = readScenarioFromHash();
    if (scenarioId && scenarioById.has(scenarioId)) {
      selectScene(scenarioId, { fromHash: true, autoPlay: !reduceMotion.matches });
    }
  });

  window.addEventListener('scroll', () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      scrollFrame = null;
    });
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) runtime.forEach(pauseWithoutLosingIntent);
    else resumeActiveIfPossible();
  });

  reduceMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    runtime.forEach((entry) => {
      entry.wantPlaying = false;
      pauseWithoutLosingIntent(entry);
    });
  });

  window.addEventListener('pagehide', () => {
    runtime.forEach((entry) => entry.controller?.pause());
  });
}

function initObservers() {
  const navLinks = Array.from(document.querySelectorAll('.chapter-nav a'));
  const setCurrentNav = (chapterId) => {
    navLinks.forEach((link) => link.classList.toggle('is-current', link.dataset.nav === chapterId));
  };
  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.dataset?.chapterSection) {
        setCurrentNav(visible.target.dataset.chapterSection);
      }
    }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.1, 0.35, 0.6] });
    document.querySelectorAll('[data-chapter-section]').forEach((section) => chapterObserver.observe(section));

    const workbenchObserver = new IntersectionObserver((entries) => {
      entries.forEach((observed) => {
        const chapterId = observed.target.dataset.workbench;
        const entry = runtime.get(chapterId);
        if (!entry) return;
        entry.visible = observed.isIntersecting;
        if (!observed.isIntersecting && chapterId === activeChapterId) {
          pauseWithoutLosingIntent(entry);
        } else if (observed.isIntersecting && chapterId === activeChapterId) {
          resumeActiveIfPossible();
        }
      });
    }, { threshold: [0, 0.08, 0.3], rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-workbench]').forEach((workbench) => workbenchObserver.observe(workbench));
  } else {
    runtime.forEach((entry) => { entry.visible = true; });
    resumeActiveIfPossible();
  }
  setCurrentNav(chapters[0]?.id ?? '');
}

function init() {
  initSections();
  chapters.forEach((chapter) => {
    const first = chapter.scenarios[0];
    if (first) mountScene(chapter.id, first.id, { autoPlay: false });
  });
  initEvents();
  initObservers();

  const hashScenario = readScenarioFromHash();
  const initialScenario = hashScenario && scenarioById.has(hashScenario)
    ? hashScenario
    : scenarios[0]?.id;
  if (initialScenario) {
    selectScene(initialScenario, {
      fromHash: Boolean(window.location.hash),
      autoPlay: !reduceMotion.matches,
    });
    if (window.location.hash) {
      window.requestAnimationFrame(() => {
        const scenario = scenarioById.get(initialScenario);
        const target = document.querySelector(`[data-workbench="${scenario?.chapter}"]`);
        target?.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    }
  }

  window.railAtlas = {
    chapters: chapters.map((chapter) => ({ id: chapter.id, count: chapter.scenarioCount })),
    scenarioIds: scenarios.map((scenario) => scenario.id),
    getActiveScenarioId: () => document.body.dataset.activeScene ?? null,
    getActiveState: () => runtime.get(activeChapterId)?.controller.getState() ?? null,
  };
}

init();
