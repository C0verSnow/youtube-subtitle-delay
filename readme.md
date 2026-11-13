# YouTube Subtitle Delay

Mini tool to delay subtitles on the YouTube official website.

**[Chrome Web Store](https://chrome.google.com/webstore/detail/youtube-subtitle-delay/fegfigommgpglnlpdmgncojmkghbijkc?hl=en&authuser=1)**

As you may know, YouTube doesn't have this functionality by default, and sometimes being able to delay subtitle
streaming can be of great help, especially when you're trying to learn a new language.

This extension is only allowed to execute on the official website of YouTube and I hope they add the subtitle delay
options soon and make this extension useless :)

### Subtitle lines

The delayed display keeps the latest three YouTube caption lines. Older lines are removed as new lines arrive;
captions with fewer than three lines stay unchanged. This applies both when the extension first finds the captions
and after each configured delay. The original YouTube captions and the formatting of retained lines are preserved.

### How to install?

It's available on **[Chrome Web Store](https://chrome.google.com/webstore/detail/youtube-subtitle-delay/fegfigommgpglnlpdmgncojmkghbijkc?hl=en&authuser=1)**.

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

Implementation notes and the open-source comparison are in [docs/subtitle-line-limit.md](docs/subtitle-line-limit.md).
