# 手机 YouTube 网页支持

对应 Issue：https://github.com/C0verSnow/youtube-subtitle-delay/issues/5

用户脚本原来的 `@match` 只包含 `youtube.com` 和 `www.youtube.com`，因此脚本管理器不会在
`m.youtube.com` 注入脚本。1.8.1 新增明确的 `https://m.youtube.com/*` 匹配，保留两个电脑端网址。
字幕延迟和最新三行仍使用原有实现，手机通过脚本管理器菜单设置延迟，不要求有键盘。

扩展直接加载同一个用户脚本，所以同时补上 manifest 的手机域名权限和内容脚本匹配。后台原来只在
电脑网址启用设置按钮，现在也识别 `m.youtube.com`，避免手机页面已经注入脚本却无法打开设置。
用户脚本和扩展版本都升为 1.8.1，便于脚本管理器识别更新。

静态读取[手机视频页](https://m.youtube.com/watch?v=jNQXAC9IVRw)引用的播放器，再检查同版本的
[官方字幕模块](https://www.youtube.com/s/player/fad7e4e9/player-plasma-es6-en_US.vflset/captions.js)，
确认模块仍创建带有 `id="ytp-caption-window-container"` 的字幕容器，所以这次不更换选择器。
这只是当前模块源码的证据，不等于已在手机上播放并验证字幕。

## GitHub 检索与取舍

2026-11-14 检索了 YouTube 字幕、用户脚本和手机网址相关代码，并核对下列项目的源码、许可证和活动。
没有找到值得引入本仓库的独立手机字幕延迟实现，也没有复制第三方代码。

| 项目 | 活动、许可证和问题 | 实现、依赖与取舍 |
| --- | --- | --- |
| [EasySubs](https://github.com/Nitrino/easysubs) | 304 stars；最近推送 2026-10-13；MIT；[问题 #272](https://github.com/Nitrino/easysubs/issues/272) 有回复并在 2026-10-04 更新 | [YouTube 接入](https://github.com/Nitrino/easysubs/blob/master/src/streamings/youtube.ts) 读取字幕轨道并独立渲染，依赖字幕解析和现有应用状态；仍有桌面播放器控件选择器。这次只需让现有脚本在手机域名运行，不引入另一套字幕引擎。 |
| [DualSubs/YouTube](https://github.com/DualSubs/YouTube) | 535 stars；最近推送 2026-10-16；Apache-2.0；本次抽查的关闭记录是旧 PR，未核实近期 Issue 响应，因此不作为借鉴来源 | [实现](https://github.com/DualSubs/YouTube/tree/main/src) 改写播放器和字幕接口，依赖 Protobuf、共享工具及 Rollup 构建。适用范围和依赖都超出本次网址适配，排除。 |

此次沿用本仓库已经使用的“独立用户脚本 + 原有字幕 DOM 观察”设计。没有为手机新增字幕下载、
解析或渲染分支。网址匹配检查和真实手机播放器验收是两项不同的证据，不能用前者宣称后者已通过。

## 验证方式

仓库原来没有远端 CI；用户明确同意新增 GitHub Actions。工作流在远端执行，不要求本地编译或运行浏览器。

- `tests/site-matches.cjs` 读取实际用户脚本和 manifest，检查三个网址入口及版本一致性，再执行实际后台
  脚本，检查切换标签页和网页加载完成两条路径的按钮、图标状态。只代替 Chrome 宿主接口。
- `tests/subtitle-lines.html` 继续直接加载实际字幕脚本。CI 用固定版本的 agent-browser 运行扩展和脚本猫
  两种模式，各跑一次电脑视口和 iPhone 14 模拟。测试页补上 viewport，并让字幕容器适应窄屏。
- 测试覆盖字幕最新三行、延迟、清空与恢复，以及脚本猫菜单设置、跨标签页设置、快捷键和站内换视频。
- 本地仅做源码阅读、语法与差异检查；不运行构建、编译或浏览器测试。

[远端检查已通过](https://github.com/C0verSnow/youtube-subtitle-delay/actions/runs/43595639015)：

| 环境 | 扩展模式 | 脚本猫模式 |
| --- | --- | --- |
| 电脑视口 | 19 项通过 | 37 项通过 |
| iPhone 14 模拟 | 19 项通过 | 37 项通过 |

实际元信息、manifest 入口和后台按钮、图标检查也全部通过。

浏览器模拟不等于真实手机。测试页不安装脚本管理器、不验证真实 YouTube 的 DOM，也不播放真实视频。
真实手机上的安装授权、CC、菜单调节、刷新、站内换视频、横竖屏和浏览器全屏按 README 手动验收。
原生 App 和系统视频播放器不属于网页字幕脚本作用范围。
