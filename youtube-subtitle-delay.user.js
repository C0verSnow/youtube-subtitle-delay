
// ==UserScript==
// @name         YouTube Subtitle Delay - Firefox & Chrome Fixed
// @namespace    https://github.com/C0verSnow/youtube-subtitle-delay
// @version      1.9.3
// @description  YouTube subtitle delay with Firefox Trusted Types CSP fix.
// @match        https://youtube.com/*
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @noframes
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULTS = {
    delay: 0,
    elementSelector: '#ytp-caption-window-container',
    decDelayKey: 'a',
    incDelayKey: 'd'
  };

  const PREFIX = '[YT Subtitle Delay]';

  let options = { ...DEFAULTS };
  let original = null;
  let clone = null;
  let captionObserver = null;
  let scanTimer = null;
  let toastTimer = null;
  let toast = null;
  let hideStyle = null;
  let lastUrl = location.href;
  let generation = 0;
  let lastSignature = null;
  let pending = new Set();
  let connected = false;
  let lastError = '';

  function log(...args) {
    console.log(PREFIX, ...args);
  }

  function reportError(error) {
    const message = String(error?.message || error);
    console.error(PREFIX, error);

    if (message !== lastError) {
      lastError = message;
      showToast('Subtitle error: ' + message, 5000);
    }
  }

  function safe(fn) {
    try {
      return fn();
    } catch (error) {
      reportError(error);
      return null;
    }
  }

  function normalize(value) {
    const data =
      value && typeof value === 'object' ? value : {};

    const delay = Number(data.delay ?? 0);

    return {
      delay: Number.isFinite(delay)
        ? Math.max(0, Math.min(5, delay))
        : 0,

      elementSelector:
        typeof data.elementSelector === 'string' &&
        data.elementSelector.trim()
          ? data.elementSelector
          : DEFAULTS.elementSelector,

      decDelayKey:
        typeof data.decDelayKey === 'string' &&
        data.decDelayKey.length === 1
          ? data.decDelayKey.toLowerCase()
          : 'a',

      incDelayKey:
        typeof data.incDelayKey === 'string' &&
        data.incDelayKey.length === 1
          ? data.incDelayKey.toLowerCase()
          : 'd'
    };
  }

  function loadOptions() {
    if (typeof GM_getValue === 'function') {
      return normalize(
        GM_getValue('options', DEFAULTS)
      );
    }

    return { ...DEFAULTS };
  }

  function addStyle(css) {
    if (typeof GM_addStyle === 'function') {
      return GM_addStyle(css);
    }

    const style = document.createElement('style');
    style.textContent = css;

    (document.head || document.documentElement)
      .appendChild(style);

    return style;
  }

  function showToast(message, duration = 3000) {
    clearTimeout(toastTimer);

    if (!toast || !toast.isConnected) {
      toast = document.createElement('div');
      toast.id = 'dyst-toast';

      (document.body || document.documentElement)
        .appendChild(toast);
    }

    toast.textContent = message;

    if (duration > 0) {
      toastTimer = setTimeout(clearToast, duration);
    }
  }

  function clearToast() {
    clearTimeout(toastTimer);

    if (toast) {
      toast.remove();
      toast = null;
    }
  }

  function cancelPending() {
    generation++;

    for (const timer of pending) {
      clearTimeout(timer);
    }

    pending.clear();
  }

  function cleanup() {
    captionObserver?.disconnect();
    captionObserver = null;

    cancelPending();

    hideStyle?.remove();
    hideStyle = null;

    clone?.remove();
    clone = null;

    original = null;
    connected = false;
    lastSignature = null;
  }

  function getCaptionElement() {
    const selectors = [
      options.elementSelector,
      '#ytp-caption-window-container',
      '.ytp-caption-window-container'
    ];

    for (const selector of new Set(selectors)) {
      try {
        const elements =
          document.querySelectorAll(selector);

        for (const element of elements) {
          if (
            !element.classList.contains('dyst-delayed') &&
            !element.closest('.dyst-delayed')
          ) {
            return element;
          }
        }
      } catch (error) {
        console.warn(PREFIX, 'Invalid selector:', selector);
      }
    }

    return null;
  }

  function hasRealCaptions(element) {
    if (!element) return false;

    return Boolean(
      element.querySelector('.caption-visual-line') ||
      element.querySelector('.ytp-caption-segment')
    );
  }

  function makeHideStyle() {
    hideStyle = document.createElement('style');

    hideStyle.textContent = `
      #ytp-caption-window-container:not(.dyst-delayed)
      .caption-window {
        visibility: hidden !important;
      }

      .dyst-delayed {
        pointer-events: none !important;
      }

      .dyst-delayed .caption-window {
        visibility: visible !important;
      }
    `;

    (document.head || document.documentElement)
      .appendChild(hideStyle);
  }

  // Firefox CSP fix:
  // Never write HTML strings using innerHTML.
  // Copy existing DOM nodes instead.
  function renderCaption(snapshot, style) {
    if (!clone || !original || !snapshot) return;

    const nodes = Array.from(
      snapshot.childNodes,
      node => node.cloneNode(true)
    );

    clone.replaceChildren(...nodes);

    if (style === null) {
      clone.removeAttribute('style');
    } else {
      clone.setAttribute('style', style);
    }

    clone.style.pointerEvents = 'none';

    // Avoid duplicate IDs in the document.
    clone.querySelectorAll('[id]').forEach(el => {
      el.removeAttribute('id');
    });

    // Prevent the copied transform from moving
    // delayed subtitles out of position.
    clone.querySelectorAll('[style]').forEach(el => {
      const transform = el.style.transform;

      if (transform && transform.includes('translateY')) {
        el.style.transform = transform.replace(
          /translateY\([^)]*\)/g,
          'none'
        );
      }
    });

    const lines = [
      ...clone.querySelectorAll('.caption-visual-line')
    ];

    // Keep only the latest three caption lines.
    lines.slice(0, -3).forEach(line => line.remove());

    clone.querySelectorAll('.caption-window')
      .forEach(windowElement => {
        const hasLine = windowElement.querySelector(
          '.caption-visual-line, .ytp-caption-segment'
        );

        if (!hasLine) {
          windowElement.remove();
        } else {
          windowElement.style.height = 'auto';
        }
      });

    const first = clone.firstElementChild;

    if (first) {
      first.removeAttribute('id');

      const left = first.style.left || '0px';

      first.style.width =
        `calc(${original.clientWidth}px - ${left} + 50px)`;
    }
  }

  function prepareClone(element) {
    if (!element || !element.parentNode) return false;

    cleanup();

    try {
      original = element;
      clone = element.cloneNode(true);

      clone.id =
        (original.id || 'ytp-caption-window-container') +
        '-delayed';

      clone.classList.add('dyst-delayed');
      clone.style.pointerEvents = 'none';

      original.parentNode.insertBefore(clone, original);

      // Render initial captions without innerHTML writes.
      renderCaption(
        original.cloneNode(true),
        original.getAttribute('style')
      );

      makeHideStyle();

      captionObserver = new MutationObserver(() => {
        safe(() => scheduleRender());
      });

      captionObserver.observe(original, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        characterData: true,
        subtree: true
      });

      connected = true;
      lastError = '';

      clearToast();

      showToast(
        options.delay > 0
          ? `Subtitle delay ready: ${options.delay.toFixed(1)}s`
          : 'Subtitle delay ready',
        2500
      );

      log('Connected to YouTube captions');
      return true;

    } catch (error) {
      cleanup();
      reportError(error);
      return false;
    }
  }

  function scheduleRender(force = false) {
    if (!original || !clone) return;

    const style = original.getAttribute('style');

    // Reading innerHTML is allowed. The CSP error
    // occurs when assigning a string to innerHTML.
    const signature =
      original.innerHTML + '\u0000' + style;

    if (!force && signature === lastSignature) {
      return;
    }

    lastSignature = signature;

    // Capture DOM at the moment the subtitle changes.
    // Do not read the live DOM after the delay.
    const snapshot = original.cloneNode(true);

    const currentGeneration = generation;
    const delay = Math.max(
      0,
      Number(options.delay) * 1000
    );

    const timer = setTimeout(() => {
      pending.delete(timer);

      if (currentGeneration !== generation) return;

      if (
        !original?.isConnected ||
        !clone?.isConnected
      ) {
        return;
      }

      safe(() => renderCaption(snapshot, style));
    }, delay);

    pending.add(timer);
  }

  function scan() {
    safe(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;

        cleanup();
        clearToast();

        log('YouTube navigation detected');
      }

      if (
        connected &&
        (
          !original?.isConnected ||
          !clone?.isConnected
        )
      ) {
        cleanup();
      }

      if (connected) return;

      const element = getCaptionElement();

      if (!element) return;

      // Wait until YouTube creates actual caption text.
      if (!hasRealCaptions(element)) return;

      prepareClone(element);
    });
  }

  function restart() {
    cleanup();
    clearToast();
    scan();
  }

  function startMonitoring() {
    clearInterval(scanTimer);

    // Keep searching even if subtitles load late.
    scanTimer = setInterval(scan, 1000);

    document.addEventListener(
      'yt-navigate-finish',
      () => {
        lastUrl = location.href;
        restart();
      }
    );

    showToast(
      'Looking for YouTube captions...',
      3000
    );

    scan();
  }

  function applyOptions(nextOptions, persist = true) {
    const oldSelector = options.elementSelector;

    options = normalize(nextOptions);

    if (
      persist &&
      typeof GM_setValue === 'function'
    ) {
      GM_setValue('options', options);
    }

    if (oldSelector !== options.elementSelector) {
      restart();
    } else {
      cancelPending();
      lastSignature = null;

      if (connected) {
        scheduleRender(true);
      }
    }

    showToast(
      options.delay
        ? `Subtitle delay: ${options.delay.toFixed(1)}s`
        : 'No subtitle delay',
      2500
    );
  }

  function handleKeyup(event) {
    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    const target =
      event.composedPath?.()[0] || event.target;

    if (target?.closest?.(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
    )) {
      return;
    }

    const key = event.key?.toLowerCase();
    let next = null;

    if (key === options.decDelayKey) {
      next = options.delay - 0.2;
    } else if (key === options.incDelayKey) {
      next = options.delay + 0.2;
    }

    if (next === null) return;

    applyOptions({
      ...options,
      delay: Math.max(
        0,
        Math.min(5, Number(next.toFixed(1)))
      )
    });
  }

  function editOption(key) {
    const isDelay = key === 'delay';

    const input = prompt(
      isDelay
        ? '字幕延迟（0–5 秒） / Delay (0–5 sec)'
        : '输入一个快捷键字符 / Enter shortcut key',
      String(options[key])
    );

    if (input === null) return;

    const value = isDelay
      ? Number(input)
      : input.trim().toLowerCase();

    if (isDelay) {
      if (
        !input.trim() ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 5
      ) {
        alert('请输入 0–5 之间的数字');
        return;
      }
    } else {
      const otherKey =
        key === 'decDelayKey'
          ? 'incDelayKey'
          : 'decDelayKey';

      if (
        value.length !== 1 ||
        value === options[otherKey]
      ) {
        alert('请输入一个不同的单字符快捷键');
        return;
      }
    }

    applyOptions({
      ...options,
      [key]: value
    });
  }

  function registerMenus() {
    if (
      typeof GM_registerMenuCommand !== 'function'
    ) {
      return;
    }

    GM_registerMenuCommand(
      '设置字幕延迟 / Set delay (0–5s)',
      () => editOption('delay')
    );

    GM_registerMenuCommand(
      '减少延迟快捷键 / Decrease shortcut',
      () => editOption('decDelayKey')
    );

    GM_registerMenuCommand(
      '增加延迟快捷键 / Increase shortcut',
      () => editOption('incDelayKey')
    );

    GM_registerMenuCommand(
      '重新连接字幕 / Reconnect captions',
      () => {
        restart();

        if (!connected) {
          showToast('Waiting for captions...', 3000);
        }
      }
    );

    GM_registerMenuCommand(
      '查看字幕状态 / Caption status',
      () => {
        const element = getCaptionElement();

        const status = {
          browser: navigator.userAgent,
          found: Boolean(element),
          hasText: hasRealCaptions(element),
          connected,
          delay: options.delay,
          originalConnected:
            Boolean(original?.isConnected),
          cloneConnected:
            Boolean(clone?.isConnected),
          pendingTimers: pending.size,
          lastError
        };

        console.table(status);

        alert(
          '字幕容器：' +
          (status.found ? '已找到' : '未找到') +
          '\n字幕内容：' +
          (status.hasText ? '已找到' : '未找到') +
          '\n延迟功能：' +
          (status.connected ? '已连接' : '未连接') +
          '\n延迟秒数：' +
          status.delay +
          '\n最近错误：' +
          (status.lastError || '无') +
          '\n\n详细信息见 F12 控制台'
        );
      }
    );
  }

  function init() {
    options = loadOptions();

    addStyle(`
      #dyst-toast {
        position: fixed;
        left: 1rem;
        bottom: 1.5rem;
        z-index: 2147483647;
        max-width: calc(100% - 2rem);
        padding: .5rem 1rem;
        border-radius: 5px;
        background: #000;
        color: #fff;
        font: 16px sans-serif;
        pointer-events: none;
      }

      .dyst-delayed {
        pointer-events: none !important;
      }
    `);

    registerMenus();

    if (
      typeof GM_addValueChangeListener === 'function'
    ) {
      GM_addValueChangeListener(
        'options',
        (name, oldValue, newValue, remote) => {
          if (remote) {
            applyOptions(newValue, false);
          }
        }
      );
    }

    document.addEventListener(
      'keyup',
      handleKeyup
    );

    startMonitoring();

    log('Initialized successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => safe(init),
      { once: true }
    );
  } else {
    safe(init);
  }
})();
