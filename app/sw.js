// Recovery OS: service worker potrzebny do instalacji aplikacji z przeglądarki i do otwarcia jej bez sieci.
// Zapisuje w pamięci telefonu WYŁĄCZNIE pliki samej aplikacji z tej domeny (strona, ikony, manifest).
// Zapytań do Supabase (dane, logowanie) w ogóle nie obsługuje: idą prosto do sieci i nie są nigdzie zapisywane.
const CACHE = "recovery-os-1.4.2";
const FILES = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys()
        .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
    const req = e.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
    if (req.mode === "navigate") {
        // Najpierw sieć (zawsze najnowsza wersja), bez sieci: ostatnio pobrana wersja aplikacji.
        e.respondWith(fetch(req).then((res) => {
            if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./", copy)); }
            return res;
        }).catch(() => caches.match("./")));
        return;
    }
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
