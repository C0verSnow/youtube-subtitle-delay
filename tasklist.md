# 本文档为4象限的任务清单，全文书写大白话

## 想做：
- [1794533504] 本次 issue 的代码、文档和 PR 已完成，没有新增计划。

## 做完：
- [1794533421] 首次显示和每次延迟更新都只保留最后三行；删掉空字幕窗口并重算高度，保留字幕格式，支持文字直接更新与清空后恢复。
- [1794533421] 已补充浏览器回归页面、使用说明和开源方案比较；Chrome 直接执行原始脚本，19 项检查通过；旧版脚本在同一测试中未通过，确认测试能发现原问题。
- [1794533421] JavaScript 语法检查和 git diff --check 通过；未执行本地构建或编译。
- [1794533421] GitHub 检索与比较结果已写到 docs/subtitle-line-limit.md：借鉴 EasySubs 限制当前字幕行的思路，没有复制第三方代码，也没有增加依赖。
- [1794478498] 已同步 GitHub 仓库，读完 issue 和补充说明，并创建 feature/latest-three-subtitle-lines 分支。
- [1794533421] 完成最后的差异检查，准备提交 feature 分支和 PR，等待用户 review。
- [1794478498] 查看字幕收集与显示逻辑，确认三行限制应该放在哪里，并检查现有验证流程。
- [1794478644] 确认旧字幕被整段复制的问题；GitHub 检索到 EasySubs（MIT，304 stars，2026-10-13 有提交）和 ImprovedTube（4680 stars，2026-11-10 有提交），正在比较字幕实现；仓库没有现成测试或远端 CI。
- [1794533504] 已推送 feature/latest-three-subtitle-lines，创建 PR #2：https://github.com/C0verSnow/youtube-subtitle-delay/pull/2 。PR 可以合并，当前未合并，留给用户 review。
- [1794533504] 按 issue 原文要求关闭 issue #1：https://github.com/C0verSnow/youtube-subtitle-delay/issues/1 。

## 没做：
- [1794478498] 按用户约定不做本地构建、编译，也不运行会触发编译的测试。
- [1794533504] 没有在真实 YouTube 页面验收全屏和用户字体设置；README 已写出验收步骤。仓库没有现成远端 CI。

## 在做：
- [1794545268] 开始适配 ScriptCat：已确认仓库是 Chrome 扩展，正在核对脚本猫接口，准备提供可直接安装的用户脚本，保留扩展用法和三行字幕限制。
- [1794533504] PR #2 等待用户 review。
- [1794548967] 已读完 issue #3 并同步 origin/main，新建 feature/scriptcat-support 分支；保留原有未提交的进度记录。确认需要提供脚本猫安装入口、测试、文档、PR 并关闭 issue。
- [1794548998] GitHub 已检索并比较 ScriptCat（GPL-3.0，5864 stars，近期提交及 issue 回复）和 vite-plugin-monkey（MIT，2069 stars，近期提交及 issue 回复）。采用原生 GM 存储和菜单接口，保持纯 JavaScript，不增加构建工具或第三方依赖。
- [1794549183] 已提供独立用户脚本及 GM 存储、设置菜单、快捷键入口；扩展改为加载同一字幕实现。已补充不编译的浏览器回归用例，覆盖菜单、保存、延迟、快捷键、页面内换视频和原三行限制，正在执行检查。
- [1794549323] Chrome 直接执行源代码的回归页面通过：扩展模式 19 项，用户脚本模式 37 项。已补充中英文安装步骤、验收说明与 docs/scriptcat.md 的开源方案比较；未运行本地构建或编译。真实脚本猫安装确认和 YouTube 全屏尚未验收，已如实写入文档。
- [1794549364] 最终用户脚本回归 37 项再次通过，扩展模式 19 项已通过；全部 JavaScript 语法检查、manifest 引用路径、版本号和 GM 权限核对通过。正在提交 feature 分支并提 PR，保留给用户 review。
