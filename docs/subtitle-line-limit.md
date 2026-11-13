# Latest three subtitle lines

Issue: https://github.com/C0verSnow/youtube-subtitle-delay/issues/1

The extension previously copied every caption line and disabled YouTube's vertical scrolling transform. With rolling
automatic captions, this exposed old lines that filled the screen. The delayed copy now keeps the last three
`.caption-visual-line` elements in document order, across caption windows. It removes empty windows and lets the
remaining window heights fit the retained lines. The original caption DOM is left intact.

Both the initial copy and each delayed snapshot use the same renderer. Text-node changes are observed so the newest
line updates as words arrive. An empty snapshot clears the display without accessing a missing caption window.
This uses YouTube's existing line elements and preserves their nested styling; it does not parse subtitle tracks
or introduce a separate subtitle engine.

## Open-source comparison

GitHub research on 2026-11-12:

| Project | Activity and license | Approach, dependencies, and relevant limitations |
| --- | --- | --- |
| [EasySubs](https://github.com/Nitrino/easysubs) | 304 stars; latest push 2026-10-13; MIT; issue discussions and recent subtitle fixes | [YouTube integration](https://github.com/Nitrino/easysubs/blob/master/src/streamings/youtube.ts) treats rolling captions as changing lines with bounded lifetimes. Its custom rendering uses React, Effector and subtitle parsing. Recent fixes include overlapping cues and caption timing. Adopted the principle of keeping only current lines; importing its renderer would add unnecessary dependencies. |
| [ImprovedTube](https://github.com/code-charity/youtube) | 4,680 stars; latest push 2026-11-10; recent issue fixes; custom license | [Player code](https://github.com/code-charity/youtube/blob/master/js%26css/web-accessible/www.youtube.com/player.js) mainly controls native subtitle settings and reads caption segments. Its broader extension has features and player lifecycle handling beyond this issue. Excluded as an implementation source because its custom licensing and wider scope are unnecessary here. |

No external implementation was copied. The change keeps this repository's plain JavaScript and native YouTube caption DOM.

## Verification

`tests/subtitle-lines.html` exercises the real content script, DOM observers, browser layout and real delay timers.
Only the extension messaging API is substituted so the page can run outside an installed extension. No build,
compiler, package installation, or new test framework is needed. The fixture represents YouTube's caption markup;
live YouTube, fullscreen and user-selected font settings still need a browser session with the extension installed.
