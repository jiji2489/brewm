// 酿梦 Brewm · 离线壳（cache-first）
var CACHE = "brewm-v6-45";
var ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./img/qr.png", "./img/amian-front.png", "./img/amian-welcome.png", "./img/amian-side.png", "./img/amian-jump.png", "./img/amian-back.png", "./img/amian-moon.png", "./img/mark-starheart.png", "./img/og-cover.webp", "./img/icon-192.png", "./img/icon-512.png",
  "./img/voice-f.mp3", "./img/voice-m.mp3"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches["delete"](k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // HTML 页面：network-first（每次拉最新版，断网才回缓存）
  var accept = e.request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (err) {} });
        return res;
      }).catch(function () { return caches.match("./"); })
    );
    return;
  }
  // 其余资源：cache-first
  e.respondWith(caches.match(e.request).then(function (hit) {
    return hit || fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (err) {} });
      return res;
    });
  }));
});