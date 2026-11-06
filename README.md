# 轨道图解 · 铁路运行动画图册

一个面向 GitHub Pages 的中文静态网站，用原创 SVG 与确定性时间轴展示车站布局、线路闭塞、列车折返和驼峰编组作业。无后端、无运行时框架、无远程素材依赖。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

浏览器打开终端输出的本地地址。构建与预览：

```bash
npm test
npm run build
npm run preview
```

## 内容结构

- `index.html`：页面骨架、首屏沙盘、语义化章节容器。
- `src/styles.css`：页面布局、设计令牌、交互状态与响应式规则。
- `src/scenes.css`：SVG 图元的统一视觉语言。
- `src/core/animation-controller.js`：可暂停、拖动、倍速、逐阶段的确定性时间轴。
- `src/core/svg-primitives.js`：共享 SVG 图元与声明式场景构建器。
- `src/core/controls.js`：播放控制条与阶段状态同步。
- `src/data/scenarios.js`：章节、场景注册表与共享元数据。
- `src/scenes/*.js`：四类演示的场景数据。
- `tests/`：时间轴与场景注册完整性测试。

## 新增一个演示

1. 在对应 `src/scenes/` 模块中追加一个场景对象，提供唯一 `id`、`duration`、`phases`、`legends`、`notes` 和 `spec`。
2. `spec` 使用声明式 `elements`、`routes`、`trains`、`passengers`、`signals`、`zones`、`flows` 与 `callouts`；时间统一使用毫秒。
3. 将场景加入该模块的导出数组，并可在 `tests/scenarios.test.js` 中补充覆盖断言。
4. 运行 `npm test` 与 `npm run build`。

## GitHub Pages 发布

`.github/workflows/deploy.yml` 会在推送到 `main` 或手动触发时执行测试、构建与 Pages 部署。仓库的 **Settings → Pages → Build and deployment** 应选择 **GitHub Actions**。Vite 使用相对基路径，因此可部署在项目子路径下。

## 说明

图中站台、线路、闭塞边界及作业流程均为原理示意，不对应真实线路、比例尺或特定运营规程，不用于工程设计或行车作业。
