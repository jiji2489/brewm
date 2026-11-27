// 酿梦 Brewm · 离线壳（cache-first）
// 安装时只备好 CORE（页面本身和几个小文件）。这些文件页面刚加载过、浏览器缓存里就有，所以通常一两秒内装好并接管页面。
// 其余素材由页面在离线壳就绪后发来 'precache' 消息，再在后台按顺序补：核心屏的底图先补，头像大图最后补。
// 每个请求都有超时：卡住就先放过，不让一个连接拖住整个安装；缺的下次打开页面时会再补。
var CACHE = "brewm-v6-82";
var CORE = ["./", "./index.html", "./manifest.webmanifest", "./img/bg-splash.webp", "./img/qr.png", "./img/mark-starheart.png", "./img/icon-192.png", "./img/voice-f.mp3", "./img/voice-m.mp3"];
// 顺序有讲究：浏览器对同一个站最多同时开 6 条连接，排在前面的先下
var LATER = ["./img/bg-desk.webp", "./img/bg-tree.webp", "./img/bg-boat.webp", "./img/bg-pour.webp", "./img/bg-galaxy.webp", "./img/amian-welcome.png", "./img/mon-rite.png", "./img/mon-open.png", "./img/mon-night.webp", "./img/og-cover.jpg", "./img/icon-512.png"];
var BIG = ["./img/amian-front.png"];
function putOne(c, u) {
  return fetch(u).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {});
}
function inTime(p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); }
function cacheList(c, list, ms) {
  return Promise.all(list.map(function (u) { return c.match(u).then(function (hit) { return hit || inTime(putOne(c, u), ms); }); }));
}
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return cacheList(c, CORE, 6000); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches["delete"](k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("message", function (e) {
  if (e.data !== "precache") return;
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return cacheList(c, LATER, 15000).then(function () { return cacheList(c, BIG, 60000); });
  }).catch(function () {}));
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
