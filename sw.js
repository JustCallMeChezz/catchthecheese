const V = "cheese-v1";
const files = [
    "./", "index.html", "cheese.js", "manifest.webmanifest",
    "lily.webp", "lily_left.webp", "lily_right.webp", "lily_left_stop.webp", "lily_right_stop.webp", "cheese.webp",
    "music.mp3", "game-over.mp3", "catch.mp3", "fall.mp3",
    "icons/icon-192x192.png", "icons/icon-512x512.png", "icons/favicon.svg"
];

const ranged = async (req, res) => {
    const buf = await res.arrayBuffer();
    const size = buf.byteLength;
    const [, s, e] = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range"));
    const start = s ? +s : size - +e;
    const end = s && e ? Math.min(+e + 1, size) : size;
    return new Response(buf.slice(start, end), {
        status: 206,
        headers: {
            "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
            "Content-Range": `bytes ${start}-${end - 1}/${size}`,
        },
    });
};

self.addEventListener("install", e => e.waitUntil(
    caches.open(V).then(c => Promise.allSettled(files.map(f => c.add(f)))).then(() => self.skipWaiting())
));

self.addEventListener("activate", e => e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => clients.claim())
));

self.addEventListener("fetch", e => {
    const req = e.request;
    if (req.method !== "GET") return;
    e.respondWith((async () => {
        const cache = await caches.open(V);
        const hit = await cache.match(req.url, { ignoreSearch: true });
        if (hit && req.headers.has("range")) return ranged(req, hit);
        const net = fetch(req).then(res => {
            if (res.status === 200 || res.type === "opaque") cache.put(req.url, res.clone());
            return res;
        });
        if (hit) {
            net.catch(() => {});
            return hit;
        }
        return net.catch(() => cache.match("./"));
    })());
});
