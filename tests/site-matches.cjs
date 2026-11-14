const assert = require("node:assert/strict")
const {readFileSync} = require("node:fs")
const {runInNewContext} = require("node:vm")
const {join} = require("node:path")

const root = join(__dirname, "..")
const script = readFileSync(join(root, "youtube-subtitle-delay.user.js"), "utf8")
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"))
const expected = ["https://youtube.com/*", "https://www.youtube.com/*", "https://m.youtube.com/*"]

assert.deepEqual([...script.matchAll(/^\/\/ @match\s+(\S+)/gm)].map(match => match[1]), expected)
assert.deepEqual(manifest.host_permissions, expected)
assert.deepEqual(manifest.content_scripts[0].matches, expected)
assert.equal(script.match(/^\/\/ @version\s+(\S+)/m)[1], manifest.version)
console.log("PASS: userscript and extension match desktop and mobile YouTube with the same version")

let onActivated
let onUpdated
let currentUrl
let enabled
let icon
const tabId = 7
const context = {
  importScripts(...paths) {
    for (const path of paths) runInNewContext(readFileSync(join(root, path), "utf8"), context)
  },
  chrome: {
    runtime: {onMessage: {addListener() {}}, onInstalled: {addListener() {}}},
    tabs: {
      onActivated: {addListener(listener) { onActivated = listener }},
      onUpdated: {addListener(listener) { onUpdated = listener }},
      get(id, callback) { assert.equal(id, tabId); callback({url: currentUrl}) }
    },
    storage: {sync: {get(key, callback) { callback({options: {delay: 0}}) }}},
    action: {
      disable(id) { assert.equal(id, tabId); enabled = false },
      enable(id) { assert.equal(id, tabId); enabled = true },
      setBadgeText() {},
      setBadgeBackgroundColor() {},
      setIcon(data) { icon = data.path["16"] }
    }
  }
}
runInNewContext(readFileSync(join(root, "background.js"), "utf8"), context)

for (const [url, allowed] of [
  ["https://youtube.com/watch?v=one", true],
  ["https://www.youtube.com/watch?v=two", true],
  ["https://m.youtube.com/watch?v=three", true],
  ["https://m.youtube.com/", true],
  ["https://example.com/", false],
  ["https://music.youtube.com/", false],
  ["http://m.youtube.com/", false]
]) {
  currentUrl = url
  for (const event of [() => onActivated({tabId}), () => onUpdated(tabId, {status: "complete"})]) {
    enabled = undefined
    event()
    assert.equal(enabled, allowed, url)
    assert.equal(icon, allowed ? "icons/16x16.png" : "icons/d_16x16.png", url)
  }
  console.log(`PASS: extension button and icon for ${url}`)
}
