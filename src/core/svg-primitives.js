import { clampTime } from './animation-controller.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const STATE_CLASSES = [
  'is-clear',
  'is-caution',
  'is-stop',
  'is-occupied',
  'is-protected',
  'is-active',
];
let sceneCounter = 0;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const round = (value) => Math.round(value * 100) / 100;

function safeId(value) {
  return String(value || 'scene')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'scene';
}

export function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function easeOut(value) {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

export function sampleFrames(frames, time, easing = 'smooth') {
  if (!Array.isArray(frames) || frames.length === 0) return 0;
  const ordered = [...frames].sort((a, b) => finiteNumber(a?.[0]) - finiteNumber(b?.[0]));
  const currentTime = finiteNumber(time);
  if (currentTime <= finiteNumber(ordered[0]?.[0])) return finiteNumber(ordered[0]?.[1]);
  const last = ordered[ordered.length - 1];
  if (currentTime >= finiteNumber(last?.[0])) return finiteNumber(last?.[1]);

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const startFrame = ordered[index];
    const endFrame = ordered[index + 1];
    const startTime = finiteNumber(startFrame?.[0]);
    const endTime = finiteNumber(endFrame?.[0]);
    if (currentTime > endTime) continue;
    const span = endTime - startTime;
    const rawProgress = span > 0 ? (currentTime - startTime) / span : 1;
    const progress = easing === 'linear' || easing === 'none'
      ? rawProgress
      : easing === 'easeOut'
        ? easeOut(rawProgress)
        : smoothstep(rawProgress);
    const startValue = finiteNumber(startFrame?.[1]);
    const endValue = finiteNumber(endFrame?.[1]);
    return startValue + (endValue - startValue) * progress;
  }
  return finiteNumber(last?.[1]);
}

export function sampleState(states, time) {
  if (!Array.isArray(states) || states.length === 0) return {};
  const ordered = [...states].sort((a, b) => finiteNumber(a?.time) - finiteNumber(b?.time));
  let current = ordered[0] ?? {};
  const currentTime = finiteNumber(time);
  for (const state of ordered) {
    if (currentTime >= finiteNumber(state?.time)) current = state;
    else break;
  }
  return current;
}

export function isVisible(ranges, time) {
  if (ranges === undefined || ranges === null) return true;
  if (!Array.isArray(ranges)) return Boolean(ranges);
  const currentTime = finiteNumber(time);
  return ranges.some((range) => {
    if (!Array.isArray(range) && typeof range === 'object') {
      return currentTime >= finiteNumber(range.start) && currentTime <= finiteNumber(range.end, Infinity);
    }
    return currentTime >= finiteNumber(range?.[0]) && currentTime <= finiteNumber(range?.[1], Infinity);
  });
}

function svgNode(tag, attributes = {}, text = '') {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== false) {
      node.setAttribute(key, String(value));
    }
  });
  if (text !== undefined && text !== null && text !== '') node.textContent = String(text);
  return node;
}

function pathData(shape = {}) {
  if (shape.d) return shape.d;
  if (shape.path) return shape.path;
  if (Array.isArray(shape.points) && shape.points.length > 0) {
    return `M ${shape.points.map((point) => `${finiteNumber(point?.[0])} ${finiteNumber(point?.[1])}`).join(' L ')}`;
  }
  if ([shape.x1, shape.y1, shape.x2, shape.y2].every((value) => Number.isFinite(Number(value)))) {
    return `M ${shape.x1} ${shape.y1} L ${shape.x2} ${shape.y2}`;
  }
  return 'M 0 0';
}

function setElementState(node, stateName) {
  if (!node) return;
  const safeState = STATE_CLASSES.includes(`is-${stateName}`) ? `is-${stateName}` : '';
  const key = safeState || 'none';
  if (node.dataset.stateKey === key) return;
  STATE_CLASSES.forEach((className) => node.classList.remove(className));
  if (safeState) node.classList.add(safeState);
  node.dataset.stateKey = key;
}

function setText(node, value) {
  if (!node) return;
  const text = value === undefined || value === null ? '' : String(value);
  if (node.textContent !== text) node.textContent = text;
}

function setTransform(node, entry, transform) {
  if (entry.lastTransform === transform) return;
  node.setAttribute('transform', transform);
  entry.lastTransform = transform;
}

function setDisplay(node, entry, visible) {
  const value = visible ? '' : 'none';
  if (entry.lastDisplay === value) return;
  node.style.display = value;
  entry.lastDisplay = value;
}

function setOpacity(node, entry, opacity) {
  const value = String(round(clamp01(opacity)));
  if (entry.lastOpacity === value) return;
  node.style.opacity = value;
  entry.lastOpacity = value;
}

function createDefs(uid, root) {
  const defs = svgNode('defs');
  const gridId = `${uid}-grid`;
  const hatchId = `${uid}-hatch`;
  const arrowTones = {
    cyan: '#56ccf2',
    amber: '#f6c453',
    mint: '#55d6be',
    rose: '#fb7185',
    neutral: '#aab6c8',
  };

  const grid = svgNode('pattern', { id: gridId, width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
  grid.appendChild(svgNode('path', {
    d: 'M24 0H0V24',
    fill: 'none',
    stroke: '#56CCF2',
    'stroke-opacity': '0.075',
    'stroke-width': '1',
  }));
  defs.appendChild(grid);

  const hatch = svgNode('pattern', {
    id: hatchId,
    width: 8,
    height: 8,
    patternUnits: 'userSpaceOnUse',
    patternTransform: 'rotate(45)',
  });
  hatch.appendChild(svgNode('line', {
    x1: 0, y1: 0, x2: 0, y2: 8,
    stroke: '#F6C453', 'stroke-width': '1', 'stroke-opacity': '0.35',
  }));
  defs.appendChild(hatch);

  Object.entries(arrowTones).forEach(([tone, color]) => {
    const markerId = `${uid}-arrow-${tone}`;
    const marker = svgNode('marker', {
      id: markerId,
      markerWidth: 9,
      markerHeight: 9,
      refX: 8,
      refY: 4.5,
      orient: 'auto',
      markerUnits: 'strokeWidth',
    });
    marker.appendChild(svgNode('path', { d: 'M0 0L9 4.5L0 9Z', fill: color }));
    defs.appendChild(marker);
    root.style.setProperty(`--scene-arrow-${tone}`, `url(#${markerId})`);
  });

  root.style.setProperty('--scene-grid-fill', `url(#${gridId})`);
  root.style.setProperty('--scene-hatch-fill', `url(#${hatchId})`);
  return defs;
}

function buildStaticElement(element, zoneNodes, signalNodes) {
  const d = pathData(element);
  const group = svgNode('g');

  switch (element.type) {
    case 'track': {
      const trackClass = element.thin ? 'track-thin' : 'track';
      if (element.sleepers !== false) {
        group.appendChild(svgNode('path', { d, class: 'sleepers' }));
      }
      group.appendChild(svgNode('path', {
        d,
        class: `${trackClass}${element.siding ? ' is-siding' : ''}`,
        'data-tone': element.tone,
      }));
      break;
    }
    case 'platform': {
      const rect = svgNode('rect', {
        x: element.x, y: element.y, width: element.w, height: element.h,
        rx: element.radius ?? 4,
        class: `platform${element.tone === 'neutral' ? ' is-neutral' : ''}`,
        'data-tone': element.tone ?? 'amber',
      });
      group.appendChild(rect);
      group.appendChild(svgNode('rect', {
        x: element.x, y: element.y, width: element.w, height: element.h,
        rx: element.radius ?? 4,
        class: 'platform-hatch',
        'data-tone': element.tone ?? 'amber',
      }));
      if (element.label) {
        group.appendChild(svgNode('text', {
          x: element.x + element.w / 2,
          y: element.y + element.h / 2 + 4,
          class: 'platform-label',
          'data-tone': element.tone ?? 'amber',
        }, element.label));
      }
      break;
    }
    case 'building': {
      group.appendChild(svgNode('rect', {
        x: element.x, y: element.y, width: element.w, height: element.h,
        rx: element.radius ?? 5,
        class: 'building',
      }));
      if (element.label) {
        group.appendChild(svgNode('text', {
          x: element.x + element.w / 2,
          y: element.y + element.h / 2 + 4,
          class: 'building-label',
        }, element.label));
      }
      break;
    }
    case 'zone': {
      const rect = svgNode('rect', {
        x: element.x, y: element.y, width: element.w, height: element.h,
        rx: element.radius ?? 7,
        class: 'zone',
      });
      const label = svgNode('text', {
        x: element.x + 10,
        y: element.y + 17,
        class: 'zone-label',
      }, element.label ?? '');
      group.appendChild(rect);
      group.appendChild(label);
      if (element.id) zoneNodes.set(element.id, { node: rect, label, lastKey: '' });
      break;
    }
    case 'signal': {
      const signalGroup = svgNode('g', { class: 'signal is-clear' });
      signalGroup.appendChild(svgNode('line', {
        x1: element.x, y1: element.y + 5, x2: element.x, y2: element.y + 24,
        class: 'signal-pole',
      }));
      signalGroup.appendChild(svgNode('circle', {
        cx: element.x, cy: element.y, r: 6, class: 'signal-lamp',
      }));
      const label = svgNode('text', {
        x: element.x + 10,
        y: element.y + 4,
        class: 'signal-label',
      }, element.label ?? '信号');
      signalGroup.appendChild(label);
      group.appendChild(signalGroup);
      if (element.id) signalNodes.set(element.id, { node: signalGroup, label, lastKey: '' });
      break;
    }
    case 'switch': {
      const switchTone = element.tone ?? 'mint';
      if (element.linkD) {
        group.appendChild(svgNode('path', {
          d: element.linkD,
          class: 'switch-link',
          'data-tone': switchTone,
        }));
      }
      if (element.highlight) {
        group.appendChild(svgNode('circle', {
          cx: element.x, cy: element.y, r: 8.5, class: 'switch-halo',
          'data-tone': switchTone,
        }));
      }
      group.appendChild(svgNode('circle', {
        cx: element.x, cy: element.y, r: 4.5, class: 'switch-node',
        'data-tone': switchTone,
      }));
      if (element.label) {
        group.appendChild(svgNode('text', {
          x: element.x + 8, y: element.y - 8, class: 'switch-label',
          'data-tone': switchTone,
        }, element.label));
      }
      break;
    }
    case 'boundary': {
      group.appendChild(svgNode('line', {
        x1: element.x1, y1: element.y1, x2: element.x2, y2: element.y2,
        class: 'boundary',
      }));
      if (element.label) {
        group.appendChild(svgNode('text', {
          x: (element.x1 + element.x2) / 2,
          y: element.y1 - 7,
          class: 'boundary-label',
        }, element.label));
      }
      break;
    }
    case 'arrow': {
      group.appendChild(svgNode('path', {
        d,
        class: 'arrow-line',
        'data-tone': element.tone ?? 'neutral',
      }));
      if (element.label && Number.isFinite(Number(element.labelX)) && Number.isFinite(Number(element.labelY))) {
        group.appendChild(svgNode('text', {
          x: element.labelX,
          y: element.labelY,
          class: 'object-label',
          'data-tone': element.tone,
          'data-align': element.align ?? 'middle',
        }, element.label));
      }
      break;
    }
    case 'profile': {
      if (element.fillD) group.appendChild(svgNode('path', { d: element.fillD, class: 'profile-fill' }));
      group.appendChild(svgNode('path', { d, class: 'profile-line' }));
      if (element.label) {
        group.appendChild(svgNode('text', {
          x: element.labelX, y: element.labelY, class: 'hump-label',
        }, element.label));
      }
      break;
    }
    case 'label':
    case 'text': {
      group.appendChild(svgNode('text', {
        x: element.x,
        y: element.y,
        class: element.micro ? 'micro-label' : 'object-label',
        'data-tone': element.tone,
        'data-align': element.align ?? 'middle',
        'font-size': element.size,
      }, element.text ?? element.label ?? ''));
      break;
    }
    case 'rect': {
      group.appendChild(svgNode('rect', {
        x: element.x, y: element.y, width: element.w, height: element.h,
        rx: element.radius ?? 0,
        class: element.class ?? 'building',
      }));
      break;
    }
    case 'line': {
      group.appendChild(svgNode('path', {
        d,
        class: element.class ?? 'axis-line',
        'data-tone': element.tone,
      }));
      break;
    }
    case 'circle': {
      group.appendChild(svgNode('circle', {
        cx: element.x, cy: element.y, r: element.r ?? 4,
        class: element.class ?? 'switch-node',
      }));
      break;
    }
    default:
      return null;
  }

  if (element.id) group.dataset.staticId = element.id;
  return group;
}

function createTrainVisual(config, kind = 'train') {
  const group = svgNode('g', {
    class: kind,
    'data-tone': config.tone ?? 'cyan',
  });
  if (kind === 'wagon') {
    const width = finiteNumber(config.width, 34);
    const height = finiteNumber(config.height, 16);
    group.appendChild(svgNode('rect', {
      x: -width / 2, y: -height / 2, width, height, rx: 3, class: 'wagon-body',
    }));
    if (config.label) {
      group.appendChild(svgNode('text', { x: 0, y: 3, class: 'wagon-label' }, config.label));
    }
    return group;
  }

  const cars = Math.max(1, Math.floor(finiteNumber(config.cars, 3)));
  const width = finiteNumber(config.width, cars * 30 + 14);
  const height = finiteNumber(config.height, 22);
  group.appendChild(svgNode('rect', {
    x: -width / 2, y: -height / 2, width, height, rx: 8, class: 'train-body',
  }));
  group.appendChild(svgNode('path', {
    d: `M ${-width / 2 + 9} 0 H ${width / 2 - 9}`,
    class: 'train-window',
  }));
  group.appendChild(svgNode('path', {
    d: `M ${width / 2 - 15} -4 L ${width / 2 - 8} 0 L ${width / 2 - 15} 4`,
    class: 'train-direction',
  }));
  group.appendChild(svgNode('circle', { cx: -width / 2 + 13, cy: height / 2 + 1, r: 2, class: 'train-wheel' }));
  group.appendChild(svgNode('circle', { cx: width / 2 - 13, cy: height / 2 + 1, r: 2, class: 'train-wheel' }));
  if (config.label) {
    group.appendChild(svgNode('text', { x: 0, y: 3.5, class: 'train-label' }, config.label));
  }
  return group;
}

function createPassengerVisual(config) {
  const group = svgNode('g', { class: 'passenger', 'data-tone': config.tone ?? 'cyan' });
  const radius = finiteNumber(config.radius, 4.5);
  group.appendChild(svgNode('circle', {
    cx: 0, cy: -4, r: radius, class: 'passenger-body',
  }));
  group.appendChild(svgNode('path', {
    d: `M0 1V10M-4 5H4M0 10L-4 16M0 10L4 16`,
    fill: 'none',
    stroke: config.tone === 'amber' ? '#f6c453' : config.tone === 'mint' ? '#55d6be' : config.tone === 'rose' ? '#fb7185' : '#56ccf2',
    'stroke-width': '1.6',
    'stroke-linecap': 'round',
  }));
  if (config.label) {
    group.appendChild(svgNode('text', { x: 0, y: -11, class: 'passenger-label', 'text-anchor': 'middle' }, config.label));
  }
  return group;
}

function createCallout(config) {
  const width = finiteNumber(config.w, 220);
  const height = finiteNumber(config.h, 54);
  const group = svgNode('g', {
    class: 'callout',
    'data-tone': config.tone ?? 'cyan',
  });
  if (config.leaderD) {
    group.appendChild(svgNode('path', { d: config.leaderD, class: 'callout-leader' }));
  }
  group.appendChild(svgNode('rect', {
    x: config.x, y: config.y, width, height, rx: 6, class: 'callout-box',
  }));
  const title = svgNode('text', {
    x: config.x + 12, y: config.y + 22, class: 'callout-text',
  }, config.title ?? '');
  const subtext = svgNode('text', {
    x: config.x + 12, y: config.y + 40, class: 'callout-subtext',
  }, config.subtext ?? '');
  group.appendChild(title);
  group.appendChild(subtext);
  return { node: group, title, subtext, lastDisplay: undefined };
}

function createMovingZone(config) {
  const group = svgNode('g', { class: 'moving-zone' });
  const rect = svgNode('rect', {
    x: 0, y: config.y, width: 1, height: config.h,
    rx: 5, class: 'zone',
  });
  const label = svgNode('text', {
    x: 8, y: config.y + 17, class: 'zone-label',
  }, config.label ?? '');
  group.appendChild(rect);
  group.appendChild(label);
  return { node: group, rect, label, lastKey: '', lastDisplay: undefined };
}

function pointOnRoute(route, progress) {
  if (!route?.node) return null;
  if (!Number.isFinite(route.length) || route.length <= 0) {
    try {
      route.length = route.node.getTotalLength();
    } catch {
      route.length = 0;
    }
  }
  if (!Number.isFinite(route.length) || route.length <= 0) return null;
  const distance = clamp01(progress) * route.length;
  try {
    const point = route.node.getPointAtLength(distance);
    const before = route.node.getPointAtLength(Math.max(0, distance - 2));
    const after = route.node.getPointAtLength(Math.min(route.length, distance + 2));
    const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
    return { x: point.x, y: point.y, angle };
  } catch {
    return null;
  }
}

export function isMoverInsideFrame({ x, y, angle = 0, halfWidth = 0, halfHeight = 0 }, bounds, padding = 0) {
  const radians = angle * Math.PI / 180;
  const extentX = Math.abs(Math.cos(radians)) * halfWidth + Math.abs(Math.sin(radians)) * halfHeight;
  const extentY = Math.abs(Math.sin(radians)) * halfWidth + Math.abs(Math.cos(radians)) * halfHeight;
  return x - extentX >= bounds.minX + padding
    && x + extentX <= bounds.maxX - padding
    && y - extentY >= bounds.minY + padding
    && y + extentY <= bounds.maxY - padding;
}

export function createSvgScene(scenario) {
  sceneCounter += 1;
  const uid = `rail-${safeId(scenario.id)}-${sceneCounter}`;
  const spec = scenario.spec ?? {};
  const viewBox = Array.isArray(spec.viewBox) ? spec.viewBox : [0, 0, 960, 440];
  const [minX, minY, width, height] = viewBox.map((value, index) => finiteNumber(value, [0, 0, 960, 440][index]));
  const duration = Math.max(1, finiteNumber(scenario.duration, 12000));

  const root = svgNode('svg', {
    class: 'scene-svg',
    xmlns: SVG_NS,
    viewBox: `${minX} ${minY} ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-labelledby': `${uid}-title ${uid}-desc`,
    focusable: 'false',
  });
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  root.appendChild(svgNode('title', { id: titleId }, `${scenario.title}动态示意图`));
  root.appendChild(svgNode('desc', { id: descId }, scenario.summary ?? '铁路运行原理动态图解'));

  const defs = createDefs(uid, root);
  root.appendChild(defs);
  root.appendChild(svgNode('rect', {
    x: minX, y: minY, width, height, class: 'scene-bg',
  }));
  root.appendChild(svgNode('rect', {
    x: minX, y: minY, width, height, class: 'scene-grid',
  }));

  const frame = svgNode('g', { 'aria-hidden': 'true' });
  frame.appendChild(svgNode('rect', {
    x: minX + 12, y: minY + 12, width: width - 24, height: height - 24,
    rx: 8, class: 'scene-frame',
  }));
  frame.appendChild(svgNode('path', { d: `M${minX + 12} ${minY + 36}V${minY + 12}H${minX + 36}`, class: 'scene-corner' }));
  frame.appendChild(svgNode('path', {
    d: `M${minX + width - 36} ${minY + height - 12}H${minX + width - 12}V${minY + height - 36}`,
    class: 'scene-corner',
  }));
  frame.appendChild(svgNode('text', {
    x: minX + 24, y: minY + 26, class: 'coordinate-text',
  }, `${String(scenario.index ?? '').padStart(2, '0')} / ${scenario.chapterLabel ?? 'RAIL ATLAS'}`));
  frame.appendChild(svgNode('text', {
    x: minX + width - 24, y: minY + 26, class: 'coordinate-text', 'text-anchor': 'end',
  }, 'SCHEMATIC · NOT TO SCALE'));
  frame.appendChild(svgNode('path', {
    d: `M${minX + 20} ${minY + height - 34}H${minX + width - 20}`,
    class: 'axis-line',
  }));
  frame.appendChild(svgNode('text', {
    x: minX + 24, y: minY + height - 18, class: 'micro-label',
  }, 'TRACK / VEHICLE / PASSENGER / SIGNAL'));
  frame.appendChild(svgNode('text', {
    x: minX + width - 24, y: minY + height - 18, class: 'micro-label', 'text-anchor': 'end',
  }, scenario.id.toUpperCase()));
  root.appendChild(frame);

  const routes = new Map();
  const zoneNodes = new Map();
  const signalNodes = new Map();
  const dynamicGroups = svgNode('g', { class: 'scene-dynamic' });

  (spec.routes ?? []).forEach((route) => {
    const path = svgNode('path', {
      id: `${uid}-route-${safeId(route.id)}`,
      d: pathData(route),
      class: 'motion-route',
      opacity: '0',
    });
    root.appendChild(path);
    routes.set(route.id, { node: path, length: null });
  });

  const staticGroup = svgNode('g', { class: 'scene-static' });
  (spec.elements ?? []).forEach((element) => {
    const node = buildStaticElement(element, zoneNodes, signalNodes);
    if (node) staticGroup.appendChild(node);
  });
  root.appendChild(staticGroup);
  root.appendChild(dynamicGroups);

  const flows = (spec.flows ?? []).map((config) => {
    const node = svgNode('path', {
      d: pathData(config),
      class: 'flow',
      'data-tone': config.tone ?? 'cyan',
    });
    dynamicGroups.appendChild(node);
    return { config, node, lastDisplay: undefined };
  });

  const callouts = new Map();
  (spec.callouts ?? []).forEach((config) => {
    const entry = createCallout(config);
    dynamicGroups.appendChild(entry.node);
    callouts.set(config.id, { ...entry, config });
  });

  const dynamicTexts = (spec.texts ?? []).map((config) => {
    const node = svgNode('text', {
      x: config.x, y: config.y,
      class: config.class ?? 'dynamic-text',
      'text-anchor': config.align ?? 'middle',
      'data-tone': config.tone,
    }, '');
    dynamicGroups.appendChild(node);
    return { config, node, lastDisplay: undefined };
  });

  const movingZones = (spec.movingZones ?? []).map((config) => {
    const entry = createMovingZone(config);
    dynamicGroups.appendChild(entry.node);
    return { config, ...entry };
  });

  const movers = [];

  [
    { key: 'trains', kind: 'train' },
    { key: 'wagons', kind: 'wagon' },
    { key: 'passengers', kind: 'passenger' },
  ].forEach(({ key, kind }) => {
    (spec[key] ?? []).forEach((config) => {
      const node = kind === 'passenger'
        ? createPassengerVisual(config)
        : createTrainVisual(config, kind);
      dynamicGroups.appendChild(node);
      movers.push({
        config,
        node,
        kind,
        route: routes.get(config.path),
        lastTransform: undefined,
        lastDisplay: undefined,
        lastOpacity: undefined,
      });
    });
  });

  const signalStates = new Map((spec.signals ?? []).map((config) => [config.id, config]));
  const zoneStates = new Map((spec.zones ?? []).map((config) => [config.id, config]));

  function renderSignals(time) {
    signalStates.forEach((config, id) => {
      const entry = signalNodes.get(id);
      if (!entry) return;
      const state = sampleState(config.states, time);
      const key = `${state.state ?? ''}|${state.text ?? ''}`;
      if (entry.lastKey === key) return;
      setElementState(entry.node, state.state);
      setText(entry.label, state.text ?? config.label ?? '');
      entry.lastKey = key;
    });
  }

  function renderZones(time) {
    zoneStates.forEach((config, id) => {
      const entry = zoneNodes.get(id);
      if (!entry) return;
      const state = sampleState(config.states, time);
      const key = `${state.state ?? ''}|${state.text ?? ''}`;
      if (entry.lastKey === key) return;
      setElementState(entry.node, state.state);
      setText(entry.label, state.text ?? config.label ?? '');
      entry.lastKey = key;
    });
  }

  function renderFlows(time) {
    flows.forEach((entry) => {
      setDisplay(entry.node, entry, isVisible(entry.config.visible, time));
    });
  }

  function renderCallouts(time) {
    callouts.forEach((entry) => {
      const state = sampleState(entry.config.states, time);
      setText(entry.title, state.title ?? entry.config.title ?? '');
      setText(entry.subtext, state.subtext ?? entry.config.subtext ?? '');
      const visible = isVisible(entry.config.visible, time);
      setDisplay(entry.node, entry, visible);
      entry.node.classList.toggle('is-visible', visible && entry.lastDisplay !== 'none');
    });
  }

  function renderDynamicTexts(time) {
    dynamicTexts.forEach((entry) => {
      const state = sampleState(entry.config.states, time);
      setText(entry.node, state.text ?? '');
      if (state.tone) entry.node.dataset.tone = state.tone;
      setDisplay(entry.node, entry, isVisible(entry.config.visible, time));
    });
  }

  function renderMovingZones(time) {
    movingZones.forEach((entry) => {
      const { config } = entry;
      const x = sampleFrames(config.x ?? [[0, 0]], time, config.easing ?? 'linear');
      const zoneWidth = sampleFrames(config.w ?? [[0, 0]], time, config.easing ?? 'linear');
      const state = sampleState(config.states, time);
      entry.rect.setAttribute('x', String(round(x)));
      entry.rect.setAttribute('width', String(Math.max(0, round(zoneWidth))));
      entry.label.setAttribute('x', String(round(x + 8)));
      setText(entry.label, state.text ?? config.label ?? '');
      setElementState(entry.rect, state.state ?? config.state ?? 'clear');
      const visible = isVisible(config.visible, time);
      setDisplay(entry.node, entry, visible);
      setOpacity(entry.node, entry, finiteNumber(state.opacity, 1));
    });
  }

  function renderMovers(time) {
    const frameBounds = {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
    };
    movers.forEach((entry) => {
      const { config, node, route, kind } = entry;
      const visible = Boolean(route) && isVisible(config.visible, time);
      if (!visible || !route) {
        setDisplay(node, entry, false);
        return;
      }
      const progress = sampleFrames(config.keyframes ?? [[0, 0], [duration, 1]], time, config.easing ?? 'smooth');
      const point = pointOnRoute(route, progress);
      if (!point) {
        setDisplay(node, entry, false);
        return;
      }
      const angle = config.rotation === false ? 0 : point.angle + finiteNumber(config.angleOffset, 0);
      const scale = finiteNumber(config.scale, 1);
      let halfWidth = finiteNumber(config.width, 0) / 2;
      let halfHeight = finiteNumber(config.height, 0) / 2;
      if (kind === 'passenger') {
        halfWidth = finiteNumber(config.radius, 4.5) + 2;
        halfHeight = 18;
      } else if (kind === 'train') {
        halfWidth = finiteNumber(config.width, finiteNumber(config.cars, 3) * 30 + 14) / 2;
        halfHeight = finiteNumber(config.height, 22) / 2;
      } else if (kind === 'wagon') {
        halfWidth = finiteNumber(config.width, 34) / 2;
        halfHeight = finiteNumber(config.height, 16) / 2;
      }
      const insideFrame = isMoverInsideFrame(
        {
          x: point.x,
          y: point.y,
          angle,
          halfWidth: halfWidth * scale,
          halfHeight: halfHeight * scale,
        },
        frameBounds,
        12 + finiteNumber(config.edgePadding, 0),
      );
      if (!insideFrame) {
        setDisplay(node, entry, false);
        return;
      }
      setDisplay(node, entry, true);
      const transform = `translate(${round(point.x)} ${round(point.y)}) rotate(${round(angle)}) scale(${scale})`;
      setTransform(node, entry, transform);
      const opacity = config.opacity
        ? sampleFrames(config.opacity, time, 'linear')
        : 1;
      setOpacity(node, entry, opacity);
    });
  }

  function render(time) {
    const currentTime = clampTime(time, duration);
    renderSignals(currentTime);
    renderZones(currentTime);
    renderFlows(currentTime);
    renderMovingZones(currentTime);
    renderMovers(currentTime);
    renderCallouts(currentTime);
    renderDynamicTexts(currentTime);
  }

  render(0);

  return {
    svg: root,
    render,
    destroy() {
      root.remove();
    },
  };
}

export const createSceneSvg = createSvgScene;
