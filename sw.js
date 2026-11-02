// 酿梦 Brewm · 离线壳（cache-first）
var CACHE = "brewm-v6-30";
var ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./img/mon-open.png", "./img/mon-rite.png", "./img/mon-avatar.png",
  "./img/qr.png", "./img/mark-starheart.png", "./img/og-cover.webp", "./img/icon-192.png", "./img/icon-512.png",
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
  e.respondWith(caches.match(e.request).then(function (hit) {
    return hit || fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (err) {} });
      return res;
    }).catch(function () { return caches.match("./"); });
  }));
});
