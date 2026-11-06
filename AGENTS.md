# AGENTS.md

本文件记录本项目的工程约束、实施经验与修改检查清单。面向后续参与本仓库的编码代理与维护者。

## 项目定位

- 这是一个面向 GitHub Pages 的中文静态站点，用原创 SVG 和原生 ES Modules 演示铁路运行原理。
- 四个固定章节：车站布局、线路与闭塞、列车折返、编组站。
- 当前注册 15 个场景，场景注册表是内容与导航的唯一事实源。
- 不引入后端、前端框架、远程图片、远程字体或第三方运行时依赖。
- 所有线路、站台、闭塞边界和作业流程都是原理示意，不用于工程设计或真实行车作业。

## 常用命令

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
npm audit --audit-level=moderate
```

环境基线：Node.js 22+、Vite 8.3.6、原生 ES Modules。

## 架构契约

### 目录职责

- `index.html`：页面骨架、首屏沙盘、章节容器、页脚。
- `src/main.js`：章节渲染、场景挂载、URL 哈希、可见性暂停、导航与生命周期。
- `src/core/animation-controller.js`：确定性时间轴、播放/暂停、进度、倍速、逐阶段。
- `src/core/controls.js`：控制条与阶段面板同步。
- `src/core/svg-primitives.js`：SVG 图元、声明式场景构建、运动对象插值。
- `src/data/scenarios.js`：章节与场景注册、元数据规范化、ID 索引。
- `src/scenes/*.js`：各章节的场景数据。
- `tests/`：时间轴边界与场景注册完整性。

### 场景数据

每个场景至少包含：

```js
{
  id: 'unique-scene-id',
  short: '标签短名',
  title: '演示标题',
  summary: '一句话摘要',
  duration: 14000,
  phases: [{ start: 0, title: '阶段名', detail: '阶段说明' }],
  legends: [{ label: '图例文本', tone: 'cyan', shape: 'line' }],
  notes: ['观察要点'],
  spec: {
    viewBox: [0, 0, 960, 440],
    elements: [],
    routes: [],
    trains: [],
    passengers: [],
    flows: [],
    callouts: [],
    zones: [],
    signals: [],
    movingZones: [],
    texts: [],
  },
}
```

约束：

- 时间统一使用毫秒。
- `start` 阶段从 0 开始并递增，且必须小于 `duration`。
- 所有运动对象的 `path` 必须引用 `spec.routes` 中存在的 `id`。
- 动态 `zones` / `signals` 必须引用 `spec.elements` 中带 `id` 的静态图元。
- 场景 ID 全局唯一；路径 ID、标注 ID 在单个场景内唯一。
- 动画状态必须由 `render(time)` 纯计算得出，不能依赖上一帧的增量状态。

## 经验教训

### 1. 控制器的根节点必须是整个工作台

`DemoControls` 需要同时查询播放按钮、进度条、阶段标题、阶段说明和阶段按钮。只把 `.control-bar` 传给它，会出现播放正常但阶段面板一直显示“准备”的隐蔽错误。

正确做法：

```js
const controls = new DemoControls(workbench);
```

### 2. 阶段按钮渲染后必须再次同步控制器

`mountScene()` 中先绑定控制器，再动态创建阶段按钮。因此必须在 `renderWorkbenchText()` 之后再次调用 `controller.emit()`，否则阶段进度条没有初始高亮。

### 3. 同页多个 SVG 必须隔离所有 ID

页面会同时挂载多个场景 SVG。`pattern`、`marker`、`clipPath`、渐变等 ID 不能共用固定名称，否则后一个 SVG 会污染前一个的引用。

本项目使用：

- 每个场景生成唯一 `uid` 前缀；
- SVG 根节点通过 CSS 自定义属性注入 `--scene-grid-fill`、`--scene-arrow-cyan` 等引用；
- CSS 只使用 `var(...)`，不硬编码 `url(#scene-...)`。

### 4. Windows 下不要给 Node 测试传目录

`node --test tests` 在 Windows PowerShell 下会被当成模块路径，而不是测试目录。使用显式文件：

```bash
node --test tests/animation-controller.test.js tests/scenarios.test.js
```

### 5. 手机端不要无限缩小 SVG

将 960×440 的 SVG 强行压进 390px 视口会让标注不可读。当前策略：

- 小屏 SVG 保持 720px 宽；
- `.scene-canvas` 内部横向滚动，页面本身不产生横向溢出；
- 图例栏显示“横向滑动查看图解”提示；
- 滚动容器可键盘聚焦。

修改响应式规则后必须验证：

```js
document.documentElement.scrollWidth - window.innerWidth === 0
```

### 6. 暂停时保留用户播放意图

进入视口、离屏、页面隐藏都会触发暂停。主线程通过 `suppressIntentUpdate` 区分“系统暂停”和“用户主动暂停”，防止离屏暂停把 `wantPlaying` 错误清零。

### 7. 减少动态效果是独立路径

`prefers-reduced-motion: reduce` 下：

- 默认不自动播放；
- 关键帧仍然可手动逐阶段查看；
- CSS 装饰动画关闭；
- 不能依赖自动运动传达唯一信息。

### 8. GitHub Pages 配置

- Vite 使用 `base: './'`，兼容用户站点和项目子路径。
- `public/.nojekyll` 必须随构建产物发布。
- Actions 使用 Node.js 22 和 `npm ci`。
- Pages 来源选择 **GitHub Actions**，不要选择分支目录模式。
- 构建目录固定为 `dist`。
- 工作流固定运行在 `ubuntu-24.04`，避免 `ubuntu-latest` 迁移导致环境漂移。
- 当前使用 Node 24 运行时 Actions：`checkout@v5`、`setup-node@v5`、`configure-pages@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`。
- `configure-pages` 返回 `Get Pages site failed` / `HttpError: Not Found` 时，优先检查仓库是否已创建 Pages 站点，以及来源是否为 GitHub Actions，而不是先怀疑构建产物。
- `enablement: true` 需要非默认 `GITHUB_TOKEN` 的 PAT 或 GitHub App 权限。本项目不为此引入长期凭据，采用仓库管理员手动启用 Pages 的最小权限路径。
- Actions 的 Node.js 运行时版本与项目 `node-version` 是两个概念：前者由 Action 主版本决定，后者由 `setup-node` 决定。

### 9. 无头浏览器验证优先使用系统 Edge

如果 Playwright 缺少 Chrome，可使用系统已安装的 Edge，避免额外下载：

```bash
playwright-cli open --browser=msedge http://127.0.0.1:4173/
```

至少验证：

- 15 个场景全部可切换；
- 每个场景阶段标题、说明和进度条正确；
- 播放、暂停、重置、进度拖动、倍速；
- `#scene=...` 深链接；
- 390px 视口无页面横向溢出；
- 控制台无错误；
- 减少动态效果下默认暂停。

### 10. 推送卡住时先诊断，不要强推

在无交互终端中，Git 凭据管理器可能长时间等待。可设置非交互环境并限制低速超时来快速暴露问题：

```bash
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=Never git push -u origin main
```

禁止使用 `--force` 覆盖远端。若远端已有提交，先 fetch / rebase，确认差异后再推送。

### 11. `.codebuddy` 不是构建缓存

不要删除项目中的 `.codebuddy/`。它不是前端产物，也不应被静态站点构建脚本清理。

## 修改检查清单

1. 改动场景数据后运行 `npm test`。
2. 新增或修改 SVG 图元后检查同页 ID 冲突。
3. 改变控制条结构后检查阶段面板是否仍同步。
4. 修改响应式样式后检查桌面、平板、390px 手机三种视口。
5. 完成前运行 `npm run build` 与 `npm audit --audit-level=moderate`。
6. 使用 Playwright 检查实际交互、控制台和深链接。
7. 更新 README 中受影响的内容、命令或架构说明。
8. 提交前确认没有把 `node_modules/`、`dist/`、`test-results/`、`.playwright-cli/` 纳入版本控制。

## 许可证

项目使用 GNU Affero General Public License v3.0。许可证全文见 `LICENSE`，不得以 MIT 或未声明许可证的方式再分发。
