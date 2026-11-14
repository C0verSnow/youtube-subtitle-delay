# YouTube Subtitle Delay

Mini tool to delay subtitles on the YouTube official website. Available as a Chrome extension or a standalone
userscript for ScriptCat (脚本猫).

Supports `https://youtube.com/*`, `https://www.youtube.com/*`, and the mobile website
`https://m.youtube.com/*`.

**[Chrome Web Store](https://chrome.google.com/webstore/detail/youtube-subtitle-delay/fegfigommgpglnlpdmgncojmkghbijkc?hl=en&authuser=1)**

As you may know, YouTube doesn't have this functionality by default, and sometimes being able to delay subtitle
streaming can be of great help, especially when you're trying to learn a new language.

This tool is only allowed to execute on the official website of YouTube and I hope they add the subtitle delay
options soon and make this extension useless :)

### Subtitle lines

The delayed display keeps the latest three YouTube caption lines. Older lines are removed as new lines arrive;
captions with fewer than three lines stay unchanged. This applies both when the extension first finds the captions
and after each configured delay. The original YouTube captions and the formatting of retained lines are preserved.

### How to install?

It's available on **[Chrome Web Store](https://chrome.google.com/webstore/detail/youtube-subtitle-delay/fegfigommgpglnlpdmgncojmkghbijkc?hl=en&authuser=1)**.

### Install in ScriptCat / 脚本猫安装

1. Install and enable [ScriptCat](https://docs.scriptcat.org/).
2. Open [youtube-subtitle-delay.user.js](https://raw.githubusercontent.com/C0verSnow/youtube-subtitle-delay/main/youtube-subtitle-delay.user.js)
   and confirm installation in ScriptCat. You can also create a script in ScriptCat, replace the editor contents with
   the complete contents of the repository's `youtube-subtitle-delay.user.js`, and save it.
3. Refresh an open YouTube video and turn on YouTube's captions (CC). In the ScriptCat menu, choose
   **设置字幕延迟 / Set delay (0–5s)** and enter a delay in seconds. Changes apply immediately and are saved for later visits.
4. Press **A** to decrease or **D** to increase delay by **0.2 seconds (200 ms)**, between 0 and 5 seconds.
   The other two ScriptCat menu entries let you change these keys. Shortcuts are ignored while typing in a text field.

脚本猫里打开上面的 `.user.js` 链接安装，或者新建脚本后粘贴整个文件并保存。刷新 YouTube、打开字幕，
再从脚本猫菜单里设置延迟和快捷键即可。首次安装默认延迟是 0 秒，字幕仍保留最新三行。

Choose either the unpacked extension or the ScriptCat script for a given browser; enabling both creates two subtitle
copies. Their settings are stored separately. ScriptCat does not need `manifest.json`, the extension popup, a build,
or any external script dependencies. The source `.user.js` is also the content script loaded by the unpacked extension.

### Use on mobile / 手机网页使用

Use a mobile browser that supports ScriptCat or a compatible userscript manager. Install or update the script to
**1.8.1** or later, allow it to run on `m.youtube.com`, then open a video at `https://m.youtube.com/` and enable CC.
Use **设置字幕延迟 / Set delay (0–5s)** in the script manager's menu to change delay without a keyboard.
Desktop-site mode is not required. The three-line limit and saved delay work through the same script as desktop.

手机浏览器须支持脚本猫或兼容的用户脚本管理器。安装或更新到 **1.8.1** 后，允许脚本在 `m.youtube.com`
运行，打开手机网页视频并开启 CC，再从脚本管理器菜单设置延迟，无需键盘或切换电脑版网页。
本脚本作用于网页字幕，不作用于 YouTube 原生 App 或系统视频播放器。

For the unpacked extension, reload it after updating so the new mobile host permission and content-script match
take effect. Its settings button is also enabled on `m.youtube.com`; the Chrome Web Store package is updated separately.

### How to install it manually on Chromium base browsers?

1. Clone the repo or download it as a zip and extract it
2. Go to extensions settings of your browser and active **Developer mode** by clicking the toggle that is already in the
   extensions page. (You can also open extensions' page by going to `chrome://extensions` or `edge://extensions` for
   Edge or, `opera://extensions` for Opera browser)
3. At the same page, click on **Load unpacked** button and load the folder you just cloned or the zip
   file you have downloaded.
4. Enjoy! :)

### Verify the subtitle line limit

Open `tests/subtitle-lines.html` directly in Chrome or another Chromium-based browser. It loads the actual content
script without a build or dependencies and reports `PASS` or `FAIL`. It checks initial rendering, one to three lines,
long rolling captions, formatting, multiple windows, text updates, delay, clearing, and recovery.

For a live check, reload the unpacked extension, refresh a YouTube video, enable automatic captions, and set a delay.
Confirm that only the newest three caption lines appear after the delay. Also check zero delay, toggling captions,
and full-screen playback. These live checks require a YouTube session.

For the ScriptCat regression checks, open `tests/subtitle-lines.html?runtime=userscript` in the browser (append the
query after opening the local HTML file). It runs the standalone file after page load, substituting only the GM
storage, style, menu, and dialog boundaries. In addition to the caption checks it covers menu validation, saved
settings loaded by a fresh script instance, cross-tab settings updates, keyboard shortcuts and typing, delay changes,
and YouTube-style navigation. Both modes use actual DOM observers, layout, and timers, without a build.

For a live ScriptCat check, install the script, disable the unpacked extension, refresh a YouTube video, enable CC,
and set a delay using ScriptCat's menu. Check A/D, text input, page refresh, navigation to another video, CC off/on,
and fullscreen. The local regression page does not install ScriptCat or access live YouTube.

Implementation notes and the open-source comparison are in [docs/subtitle-line-limit.md](docs/subtitle-line-limit.md).
ScriptCat adaptation notes and research are in [docs/scriptcat.md](docs/scriptcat.md).
Mobile support and its verification limits are in [docs/mobile.md](docs/mobile.md).

### Remote checks

[Subtitle tests](https://github.com/C0verSnow/youtube-subtitle-delay/actions/workflows/test.yml) runs on feature-branch
pushes and pull requests. It checks the actual userscript metadata, extension host permissions, content-script matches,
and background button/icon behavior, then opens the existing regression page in Chromium through agent-browser 0.42.0.
Both extension and userscript modes run at a desktop viewport and with iPhone 14 emulation. The fixture uses the viewport
width on narrow screens. No project build is required.

The CI page substitutes browser-extension/GM host APIs; it does not install a script manager or play live YouTube.
For phone acceptance, open `m.youtube.com` in your supported browser, enable CC, set delay from the script menu,
then check changing delay, refresh, switching videos, CC off/on, portrait/landscape, and browser fullscreen.
System video fullscreen may use a separate native player that does not render page DOM overlays.
