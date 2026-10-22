// Service worker básico de Centavo.
// Estrategia: red primero con caché de reserva para navegación,
// caché primero para estáticos. Suficiente para la demo instalable;
// se sustituirá por una estrategia completa al conectar el backend.

const CACHE = "centavo-v2";
const OFFLINE_URLS = ["/"];

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/.test(pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nunca interceptar los datos de las páginas: las navegaciones por <Link>
  // piden el RSC payload con fetch (no son "navigate") a la misma URL de
  // siempre, y con "caché primero" devolverían para siempre la primera
  // versión que se vio. Tampoco la API ni nada de otro origen.
  if (
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Navegación: red primero, caché de reserva
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit ?? caches.match("/")),
        ),
    );
    return;
  }

  // Estáticos versionados (JS/CSS con hash, iconos, imágenes): caché primero
  if (url.origin === self.location.origin && isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
