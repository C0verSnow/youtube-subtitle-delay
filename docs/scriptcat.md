# 脚本猫适配

对应 issue：https://github.com/C0verSnow/youtube-subtitle-delay/issues/3

原来只能通过 Chrome 扩展运行，因为字幕脚本依赖扩展后台传递设置。现在把字幕入口改名为根目录的
`youtube-subtitle-delay.user.js`，加上脚本猫需要的安装信息。这个文件本身就是源代码，无需打包、编译，
也不需要从网上加载其他脚本。扩展的 manifest 直接加载同一个文件，原来的后台和弹窗继续使用。

在脚本猫里，通过 `GM_getValue` / `GM_setValue` 保存设置，`GM_registerMenuCommand` 提供延迟和两个
快捷键设置菜单，`GM_addValueChangeListener` 接收其他标签页的设置变化，`GM_addStyle` 补上提示样式。
在扩展里，继续使用 `chrome.runtime` 传递设置。设置只在读入和接收时整理，字幕渲染共用一份实现，
保留最新三行和原有文字格式。两种安装方式各自保存设置，请在同一个浏览器里只启用其中一种。

脚本猫按 `document-end` 运行；入口同时处理页面加载中和已经加载完的情况。页面内换视频时，重新连接
字幕节点，并清理旧观察器、查找定时器、字幕快照和隐藏样式。调整延迟时清理还没显示的旧快照，防止
旧延迟的字幕随后覆盖新字幕。快捷键仍是每次 0.2 秒，输入框和可编辑文字区域不会触发快捷键。

## GitHub 检索和比较

2026-11-13 查看了下面的项目、官方说明和 issue。只借鉴公开接口和设计方法，没有复制第三方实现。

| 项目 | 维护和许可证 | 实现、依赖和相关问题 | 本仓库采用什么 |
| --- | --- | --- | --- |
| [ScriptCat](https://github.com/scriptscat/scriptcat) | 5864 stars；2026-11-13 有提交；GPL-3.0；[安装问题 #1841](https://github.com/scriptscat/scriptcat/issues/1841) 有 8 条评论并已关闭 | 脚本管理器本身用 TypeScript 和扩展架构。官方 [API 文档](https://github.com/scriptscat/docs.scriptcat.org/blob/main/docs/dev/api.md) 提供 GM 存储、菜单、样式和监听；[元信息文档](https://github.com/scriptscat/docs.scriptcat.org/blob/main/docs/dev/meta.md) 说明运行时间和 content 注入。文档提醒 GM_setValue 后立即关闭页面可能没保存完；本脚本不会在保存后关闭页面。 | 按官方接口直接实现设置入口；用 content 环境操作 DOM，避开页面 CSP 对脚本注入的限制。无需引入脚本管理器自身的依赖。 |
| [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) | 2069 stars；2026-11-07 有提交；MIT；[构建问题 #292](https://github.com/lisonge/vite-plugin-monkey/issues/292) 有 3 条评论并已关闭 | 用 Vite 把模块、元信息和 GM 接口整理为可安装用户脚本，支持脚本猫。会引入 Vite、Node 和构建流程；[CSP 问题 #290](https://github.com/lisonge/vite-plugin-monkey/issues/290) 反映注入方式仍有环境限制。 | 借鉴独立 `.user.js` 和显式权限声明的分发方式；仓库没有构建流程，因此不引入该工具。 |

## 检查方式与边界

沿用 `tests/subtitle-lines.html`，让同一组真实字幕检查分别走扩展消息接口和 GM 接口。
普通页面检查扩展模式；在地址末尾加 `?runtime=userscript` 检查脚本猫模式。测试页面只代替宿主提供
存储、菜单、对话框、样式和消息入口，直接执行实际用户脚本；DOM、布局、观察器和计时器均由 Chrome 执行。

没有安装新测试框架，没有运行本地构建或编译。真实脚本猫安装确认、真实 YouTube 和全屏播放仍需要
按 README 的步骤验收；浏览器回归页面不能代替这些操作。仓库没有现成的远端 CI。
