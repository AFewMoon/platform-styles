# 轨道图解 · 铁路运行动画图册

一个面向 GitHub Pages 的中文静态网站，用原创 SVG 和确定性时间轴展示车站布局、线路闭塞、列车折返与驼峰编组作业。无后端、无运行时框架、无远程素材依赖。

站点以“现代铁路运行图册”为视觉方向：深色调度台、工程网格、技术标注、青蓝运行轨迹与琥珀色信号重点。所有演示都可以暂停、拖动到任意时刻，并按阶段逐步观察。

## 在线预览

部署后的地址：

- <https://afewmoon.github.io/platform-styles/>

仓库推送到 `main` 后由 GitHub Actions 自动测试、构建并发布。若尚未生效，请在 **Settings → Pages → Build and deployment** 中将来源设为 **GitHub Actions**。

## 内容

### 01 车站布局

| 演示 | 重点 |
| --- | --- |
| 侧式站台 | 两座站台分别服务相反方向，换向通常需要跨线通道。 |
| 岛式站台 | 一座站台服务两侧股道，乘客在中央站台按方向分流。 |
| 西班牙式 | 中央站台下车、外侧站台上车；进站厅与出站厅分开，通道与站台平行。 |

### 02 线路与闭塞

| 演示 | 重点 |
| --- | --- |
| 单线闭塞区间 | 一个区间同一时间只允许一列车占用。 |
| 单线避让站 | 一列进入侧线等待，另一列沿正线通过。 |
| 双线固定闭塞 | 分区边界固定，以整个分区为单位判断占用。 |
| 准移动闭塞 | 目标点仍落在固定分区边界，但可随占用状态分段更新。 |
| 移动闭塞 | 连续位置报告与动态制动距离形成连续移动的授权边界。 |
| 快慢车越行 | 慢车进入越行线停站，快车沿直通正线通过。 |
| 存车线出入库 | 夜间收车、备用车待命和次日出库的进路转换。 |

### 03 列车折返

| 演示 | 重点 |
| --- | --- |
| 站前折返 | 列车借站台前方渡线换向，折返会占用咽喉区。 |
| 站后折返 | 列车空车驶入站后折返线换端，再返回另一侧站台。 |
| 灯泡线 | 列车沿环形线路连续完成约 180° 方向变化，无需换端。 |

### 04 编组站

| 演示 | 重点 |
| --- | --- |
| 驼峰编组 | 到达、推送、峰顶摘钩、重力溜放、道岔分配、股道集结与牵出。 |

## 交互

- 播放、暂停、重置、逐阶段前后切换。
- 进度条拖动、0.5× / 1× / 1.5× / 2× 倍速。
- 阶段标题、阶段说明与阶段进度条同步。
- 每章场景标签支持鼠标、触屏和左右方向键切换。
- `#scene=<id>` 深链接可直接打开指定演示。
- 当前工作台离开视口或页面隐藏时自动暂停，返回时恢复。
- 支持 `prefers-reduced-motion: reduce`：默认暂停，关闭装饰性循环动画，仍可手动逐阶段查看。
- 移动端图解保持 720px 可读宽度，在容器内横向滚动，并可通过键盘聚焦。
- 移动端控制按钮保持至少 44px 触控区域。

## 技术栈

- **页面**：HTML5、CSS 自定义属性、原生 ES Modules。
- **动画**：内联 SVG、`requestAnimationFrame`、确定性时间轴。
- **构建**：Vite 8.3.6，无运行时依赖。
- **测试**：Node.js 内置测试运行器。
- **部署**：GitHub Actions + GitHub Pages。
- **字体**：使用系统中文字体栈，不请求远程字体。
- **图形**：所有轨迹、站台、列车、乘客、信号与标注均为原创 SVG。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

浏览器打开终端输出的本地地址。

### 可用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器。 |
| `npm test` | 运行时间轴和场景注册测试。 |
| `npm run build` | 生成 `dist/` 静态产物。 |
| `npm run preview` | 本地预览构建产物。 |
| `npm audit --audit-level=moderate` | 检查依赖安全告警。 |

## 项目结构

```text
.
├── index.html                     # 页面骨架、首屏沙盘、章节容器
├── src/
│   ├── main.js                    # 导航、场景挂载、哈希、可见性与生命周期
│   ├── styles.css                 # 页面设计令牌、布局、控件与响应式
│   ├── scenes.css                 # SVG 轨道、站台、列车、信号等视觉语言
│   ├── core/
│   │   ├── animation-controller.js
│   │   ├── controls.js
│   │   └── svg-primitives.js
│   ├── data/
│   │   └── scenarios.js           # 章节与 14 个场景的注册表
│   └── scenes/
│       ├── stations.js
│       ├── block-systems.js
│       ├── turnbacks.js
│       └── yard.js
├── tests/
│   ├── animation-controller.test.js
│   └── scenarios.test.js
├── public/
│   ├── favicon.svg
│   └── .nojekyll
├── .github/workflows/deploy.yml
├── AGENTS.md
├── LICENSE
├── package.json
└── vite.config.js
```

## 架构说明

### 场景注册表

`src/data/scenarios.js` 汇总四个场景模块，并为每个演示补充章节、序号和规范化元数据。页面导航、场景标签、工作台和深链接都从注册表生成，新增场景不需要手工修改多处 HTML。

### 确定性时间轴

`AnimationController` 不累积状态，而是根据当前时间计算画面。播放、暂停、拖动、倍速、循环和逐阶段都调用同一套 `render(time)` 路径，因此任何时刻的画面都可以重现。

### 声明式 SVG

`svg-primitives.js` 负责创建轨道、站台、建筑、信号、道岔、流动线、列车、乘客、标注和动态区间。场景模块只描述布局、路径、对象和关键帧。

场景数据中的主要字段：

```js
{
  id: 'moving-block',
  duration: 14000,
  phases: [{ start: 0, title: '连续位置报告', detail: '…' }],
  legends: [{ label: '动态防护区', tone: 'rose', shape: 'block' }],
  notes: ['…'],
  spec: {
    viewBox: [0, 0, 960, 440],
    elements: [],
    routes: [],
    trains: [],
    movingZones: [],
    callouts: [],
  },
}
```

运动对象使用 `[时间, 进度]` 关键帧，时间单位为毫秒。每个运动对象的 `path` 必须引用 `spec.routes` 中存在的路径 ID。

### 场景生命周期

`main.js` 为每个章节维护一个工作台，切换场景时销毁旧控制器与 SVG 场景，再挂载新场景。只有当前可见且处于播放状态的章节会推进动画；离屏、页面隐藏或减少动态效果模式下会暂停。

## 新增一个演示

1. 在对应的 `src/scenes/*.js` 中增加场景对象，提供唯一 `id`、`duration`、`phases`、`legends`、`notes` 和 `spec`。
2. 使用 `spec.elements` 描述静态图元，`spec.routes` 描述运动路径。
3. 使用 `trains`、`wagons`、`passengers`、`signals`、`zones`、`movingZones`、`flows`、`callouts` 和 `texts` 描述动态元素。
4. 将场景加入该模块导出的数组。测试会检查 ID 唯一性、路径引用、阶段时间、图元类型和动态区间引用。
5. 运行：

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

6. 如需本地浏览器复查，启动 `npm run preview`，再用 Playwright 检查所有场景、控制器、哈希定位、移动端和控制台。

更完整的工程约束与踩坑记录见 [AGENTS.md](./AGENTS.md)。

## GitHub Pages 发布

`.github/workflows/deploy.yml` 在推送到 `main` 或手动触发时执行：

1. 使用 `actions/checkout@v5` 检出代码；
2. 使用 `actions/setup-node@v5`（Node.js 22）安装锁定依赖；
3. 运行测试并构建 `dist/`；
4. 由 `actions/configure-pages@v6` 读取 Pages 配置；
5. 使用 `actions/upload-pages-artifact@v5` 上传 artifact；
6. 使用 `actions/deploy-pages@v5` 发布站点。

工作流固定运行在 `ubuntu-24.04`，并保留最小权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 首次启用 Pages

默认 `GITHUB_TOKEN` 不能创建 Pages 站点，`actions/configure-pages` 也不会自动启用它。首次发布前必须由仓库管理员完成一次性设置：

1. 打开 <https://github.com/AFewMoon/platform-styles/settings/pages>；
2. 在 **Build and deployment** 中将 **Source** 设为 **GitHub Actions**；
3. 返回 Actions，重新运行 `Deploy GitHub Pages` 工作流。

Vite 使用相对基路径，站点可在 `/<repo>/` 子路径下工作。

### 部署故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `Get Pages site failed` / `HttpError: Not Found` | 仓库尚未创建 Pages 站点，或构建来源不是 GitHub Actions | 按“首次启用 Pages”完成设置后重跑工作流。 |
| `enablement` 提示权限不足 | 自动启用需要非 `GITHUB_TOKEN` 的 PAT 或 GitHub App 权限 | 不推荐为此新增长期凭据；直接手动启用 Pages。 |
| Node.js 20 弃用告警 | 使用了旧版 Actions | 当前工作流已升级到 Node 24 运行时版本。 |
| `ubuntu-latest` 迁移提示 | 标签未来会切换到 Ubuntu 26 | 已固定为 `ubuntu-24.04`。 |
| 站点 404 但工作流成功 | 部署尚未传播完成，或 Pages URL 尚未生效 | 等待部署完成后刷新 Pages 地址，并确认 environment 为 `github-pages`。 |

## 验证基线

当前提交应满足：

- 14 个场景全部注册且可切换；
- 时间轴、阶段、进度和倍速状态一致；
- 深链接与无效场景安全回退；
- 桌面与 390px 移动端布局无页面横向溢出；
- 减少动态效果模式下默认暂停；
- 浏览器控制台无错误；
- `npm test`、`npm run build` 和依赖审计通过。

## 说明

图中站台、线路、闭塞边界、信号和作业流程均为原理示意，不对应真实线路、固定比例尺或某一套运营规程，不用于工程设计、行车指挥或安全培训。

## 许可证

本项目以 **GNU Affero General Public License v3.0** 发布，许可证全文见 [LICENSE](./LICENSE)。

如将本项目作为网络服务提供修改后的版本，请遵守 AGPL-3.0 关于源代码提供的相应要求。
