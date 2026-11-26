// 酿梦 Brewm · 离线壳（cache-first）
// 安装时只备好 CORE（页面本身和几个小文件），所以几秒内就能装好并接管页面；
// LATER 由页面在离线壳就绪后发来 'precache' 消息再在后台补，补不上也不影响离线打开。
var CACHE = "brewm-v6-79";
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./img/bg-splash.webp", "./img/qr.png", "./img/mark-starheart.png", "./img/icon-192.png", "./img/voice-f.mp3", "./img/voice-m.mp3"];
var LATER = ["./img/amian-welcome.png", "./img/amian-front.png", "./img/mon-rite.png", "./img/mon-open.png", "./img/mon-night.webp", "./img/og-cover.jpg", "./img/icon-512.png", "./img/bg-desk.webp", "./img/bg-galaxy.webp", "./img/bg-tree.webp", "./img/bg-boat.webp", "./img/bg-pour.webp"];
function putOne(c, u) { return fetch(u, { cache: "reload" }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); }
function cacheList(c, list) { return Promise.all(list.map(function (u) { return c.match(u).then(function (hit) { return hit || putOne(c, u); }); })); }
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return cacheList(c, CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches["delete"](k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("message", function (e) {
  if (e.data === "precache") e.waitUntil(caches.open(CACHE).then(function (c) { return cacheList(c, LATER); }).catch(function () {}));
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
      }).catch(function () { return caches.match("./").then(function (hit) { return hit || caches.match("./index.html"); }); })
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
