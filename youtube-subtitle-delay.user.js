// ==UserScript==
// @name         YouTube Subtitle Delay
// @namespace    https://github.com/C0verSnow/youtube-subtitle-delay
// @version      1.8.1
// @description  Delay YouTube captions and keep the latest three lines.
// @match        https://youtube.com/*
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @noframes
// @run-at       document-end
// @inject-into  content
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function () {
'use strict';

const defaultOptions = {
  delay: 0,
  elementSelector: "#ytp-caption-window-container",
  decDelayKey: "a",
  incDelayKey: "d"
}
const platform = createPlatform()

let options = null;
let subtitleElm = null;
let delayedSubtitleElm = null;
let toastVisibilityInterval = null;
let checkElementInterval = null;
let subtitleStyle = null;
const pendingSubtitles = new Set();

const orgElmObserver = new MutationObserver(() => {
  updateDelayedSubtitle(subtitleElm.innerHTML, subtitleElm.getAttribute("style"))
})

function init() {
  platform.loadOptions(savedOptions => {
    options = normalizeOptions(savedOptions)
    platform.onOptionsChanged(savedOptions => applyOptions(normalizeOptions(savedOptions)))
    document.addEventListener("keyup", handleKeyup)
    let lastUrl = location.href
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href
        startObservation()
      }
    }).observe(document, {childList: true, subtree: true})
    startObservation();
  })
}

function startObservation() {
  orgElmObserver.disconnect()
  clearInterval(checkElementInterval)
  pendingSubtitles.forEach(clearTimeout)
  pendingSubtitles.clear()
  subtitleStyle?.remove()
  if (delayedSubtitleElm) {
    delayedSubtitleElm.remove()
    delayedSubtitleElm = null
  }

  let checkCount = 0
  showToast("Looking for the subtitle mechanism...", 0)

  // find original subtitle element on the document
  // and clone it within its parent
  // and start observe
  checkElementInterval = setInterval(() => {
    checkCount++;
    subtitleElm = document.querySelector(options.elementSelector)
    if (subtitleElm && !delayedSubtitleElm) {
      delayedSubtitleElm = subtitleElm.cloneNode(true)
      delayedSubtitleElm.id = delayedSubtitleElm.id + "-delayed"
      delayedSubtitleElm.classList.add("delayed")
      subtitleElm.parentNode.insertBefore(delayedSubtitleElm, subtitleElm)
      renderDelayedSubtitle(subtitleElm.innerHTML, subtitleElm.getAttribute("style"))
      orgElmObserver.observe(subtitleElm, {attributes: true, childList: true, characterData: true, subtree: true});

      // add style to hide original styles
      subtitleStyle = document.createElement("style")
      subtitleStyle.textContent = `body ${options.elementSelector}:not(.delayed) *{display:none!important;text-shadow:none!important;color:transparent!important}`
      document.head.appendChild(subtitleStyle)

      clearInterval(checkElementInterval)
      if (!!+options.delay) {
        showToast(`Subtitle delay set as ${options.delay} sec !`)
      } else {
        showToast("Delay functionality added :)")
      }
    }

    // in the case of not finding the subtitle element
    if (checkCount > 5 && !delayedSubtitleElm) {
      clearInterval(checkElementInterval)
      showToast("Could not find the subtitle mechanism, maybe it's not available for this content!", 5000)
    }
  }, 2000)
}

function updateDelayedSubtitle(nextContent, nextStyles) {
  let delay = (+options.delay * 1000) || 0

  const timer = setTimeout(() => {
    pendingSubtitles.delete(timer)
    renderDelayedSubtitle(nextContent, nextStyles)
  }, delay);
  pendingSubtitles.add(timer)
}

function renderDelayedSubtitle(nextContent, nextStyles) {
  delayedSubtitleElm.innerHTML = nextContent.replaceAll("translateY", "translateYFake");
  delayedSubtitleElm.setAttribute("style", nextStyles)

  const lines = [...delayedSubtitleElm.querySelectorAll(".caption-visual-line")]
  lines.slice(0, -3).forEach(line => line.remove())

  delayedSubtitleElm.querySelectorAll(".caption-window").forEach(captionWindow => {
    if (!captionWindow.querySelector(".caption-visual-line")) {
      captionWindow.remove()
      return
    }
    // YouTube's copied height still includes the lines removed above.
    captionWindow.style.height = "auto"
  })

  const firstCaptionWindow = delayedSubtitleElm.firstElementChild
  if (!firstCaptionWindow) return

  firstCaptionWindow.id = ""
  firstCaptionWindow.style.width = `calc(${subtitleElm.clientWidth}px - ${firstCaptionWindow.style.left} + 50px)`;
}

function applyOptions(savedOptions) {
  options = savedOptions
  pendingSubtitles.forEach(clearTimeout)
  pendingSubtitles.clear()
  if (delayedSubtitleElm) {
    updateDelayedSubtitle(subtitleElm.innerHTML, subtitleElm.getAttribute("style"))
  }
  showToast(options.delay ? `Subtitle delay set as ${options.delay} sec !` : "No subtitle delay!")
}

function handleKeyup(e) {
  const target = e.composedPath()[0];
  if (target.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false'])") ||
      e.ctrlKey || e.altKey || e.metaKey) {
    return;
  }

  let updatedDelay = null
  if (e.key.toLowerCase() === options.decDelayKey) {
    updatedDelay = +options.delay - 0.2
  } else if (e.key.toLowerCase() === options.incDelayKey) {
    updatedDelay = +options.delay + 0.2
  }

  if (updatedDelay !== null) {
    platform.saveOptions({
      ...options,
      delay: Math.min(5, Math.max(0, +updatedDelay.toFixed(1)))
    }, applyOptions)
  }
}

function showToast(msg, hideDelay = 3000) {
  if (!msg) return

  let msgElm = document.getElementById("dyst-toast")
  if (!msgElm) {
    msgElm = document.createElement("div")
    msgElm.setAttribute("id", "dyst-toast")
    msgElm.classList.add("dyst-toast")
  }
  msgElm.innerText = msg;

  // append as a sibling of delayed element or as an element of body
  (delayedSubtitleElm?.parentNode || document.body).appendChild(msgElm)
  if (delayedSubtitleElm?.parentNode) {
    msgElm.classList.add("on-video")
  }

  if (!hideDelay) {
    return msgElm
  }

  if (toastVisibilityInterval) {
    clearTimeout(toastVisibilityInterval)
  }

  toastVisibilityInterval = setTimeout(() => {
    msgElm.remove()
    msgElm = null
  }, hideDelay)
}

function createPlatform() {
  if (typeof GM_getValue === "function") {
    GM_addStyle(`
      .dyst-toast {position:fixed;left:1rem;bottom:1.5rem;font:1.5rem sans-serif;
        padding:.5rem 1rem;max-width:calc(100% - 2rem);background:#000;color:#fff;z-index:999;}
      .dyst-toast.on-video {position:absolute;bottom:1rem;font-size:1.25rem;}
    `)
    GM_registerMenuCommand("设置字幕延迟 / Set delay (0–5s)", () => editOption("delay"))
    GM_registerMenuCommand("设置减少延迟快捷键 / Decrease shortcut", () => editOption("decDelayKey"))
    GM_registerMenuCommand("设置增加延迟快捷键 / Increase shortcut", () => editOption("incDelayKey"))
    return {
      loadOptions(callback) { callback(GM_getValue("options", defaultOptions)) },
      saveOptions(nextOptions, callback) {
        GM_setValue("options", nextOptions)
        callback(nextOptions)
      },
      onOptionsChanged(callback) {
        GM_addValueChangeListener("options", (name, oldValue, newValue, remote) => {
          if (remote) callback(newValue)
        })
      }
    }
  }
  return {
    loadOptions(callback) {
      chrome.runtime.sendMessage({action: "INIT"}, response => callback(response.options))
    },
    saveOptions(nextOptions, callback) {
      chrome.runtime.sendMessage({action: "SET_OPTIONS", options: nextOptions}, callback)
    },
    onOptionsChanged(callback) {
      chrome.runtime.onMessage.addListener(data => {
        if (data.action === "OPTIONS_UPDATE") callback(data.options)
      })
    }
  }
}

function normalizeOptions(savedOptions) {
  const data = savedOptions && typeof savedOptions === "object" ? savedOptions : {}
  const delay = Number(data.delay ?? defaultOptions.delay)
  return {
    delay: Number.isFinite(delay) ? Math.min(5, Math.max(0, delay)) : defaultOptions.delay,
    elementSelector: data.elementSelector || defaultOptions.elementSelector,
    decDelayKey: typeof data.decDelayKey === "string" && data.decDelayKey.length === 1
      ? data.decDelayKey.toLowerCase() : defaultOptions.decDelayKey,
    incDelayKey: typeof data.incDelayKey === "string" && data.incDelayKey.length === 1
      ? data.incDelayKey.toLowerCase() : defaultOptions.incDelayKey
  }
}

function editOption(key) {
  const nextValue = readOption(key)
  if (nextValue === null) return
  platform.saveOptions({...options, [key]: nextValue}, applyOptions)
}

function readOption(key) {
  const isDelay = key === "delay"
  const value = prompt(isDelay ? "字幕延迟（0–5 秒） / Delay in seconds (0–5)" :
    "输入一个快捷键字符 / Enter one shortcut character", String(options[key]))
  if (value === null) return null
  const nextValue = isDelay ? Number(value) : value.trim().toLowerCase()
  if (isDelay ? !value.trim() || !Number.isFinite(nextValue) || nextValue < 0 || nextValue > 5 :
      nextValue.length !== 1 || nextValue === options[key === "decDelayKey" ? "incDelayKey" : "decDelayKey"]) {
    alert(isDelay ? "请输入 0–5 之间的数字 / Enter a number from 0 to 5" :
      "请输入一个不同的快捷键字符 / Enter one distinct shortcut character")
    return null
  }
  return nextValue
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, {once: true})
} else {
  init()
}
})();
