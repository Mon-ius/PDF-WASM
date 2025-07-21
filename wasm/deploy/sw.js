const CACHE_NAME = 'pdf-wasm-v1';
const CRITICAL_CACHE = 'pdf-wasm-critical-v1';

const CRITICAL_ASSETS = [
    './',
    './index.html',
    './pkg/pdf_wasm_bindings.js',
    './pkg/pdf_wasm_bindings_bg.wasm'
];

const OPTIONAL_ASSETS = [
    './favicon.webp'
];

const CACHE_STRATEGIES = {
    cacheFirst: [
        /\.wasm$/,
        /\.js$/,
        /\.css$/,
        /favicon/
    ],
    networkFirst: [
        /\.html$/,
        /\/$/
    ],
    staleWhileRevalidate: [
        /cdn\.jsdelivr\.net/
    ]
};

const CACHE_DURATION = {
    wasm: 7 * 24 * 60 * 60 * 1000, // 7 days
    js: 24 * 60 * 60 * 1000, // 1 day
    css: 24 * 60 * 60 * 1000, // 1 day
    html: 60 * 60 * 1000, // 1 hour
    default: 24 * 60 * 60 * 1000 // 1 day
};

self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const criticalCache = await caches.open(CRITICAL_CACHE);
            for (const asset of CRITICAL_ASSETS) {
                try {
                    await cacheWithRetry(criticalCache, asset);
                } catch (error) {
                    console.warn(`Failed to cache critical asset: ${asset}`, error);
                }
            }
            
            const cache = await caches.open(CACHE_NAME);
            for (const asset of OPTIONAL_ASSETS) {
                cacheWithRetry(cache, asset).catch(() => {});
            }
            
            self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== CRITICAL_CACHE)
                    .map(name => caches.delete(name))
            );
            
            self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin && !url.hostname.includes('cdn.jsdelivr.net')) {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
    const url = new URL(request.url);
    let strategy = 'networkFirst';
    for (const [strat, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => pattern.test(url.pathname))) {
            strategy = strat;
            break;
        }
    }
    
    switch (strategy) {
        case 'cacheFirst':
            return cacheFirst(request);
        case 'networkFirst':
            return networkFirst(request);
        case 'staleWhileRevalidate':
            return staleWhileRevalidate(request);
        default:
            return networkFirst(request);
    }
}

async function cacheFirst(request) {
    const cached = await getCachedResponse(request);
    if (cached && !isExpired(cached)) {
        return cached;
    }
    
    try {
        const response = await fetchWithTimeout(request);
        if (response.ok) {
            await putInCache(request, response.clone());
        }
        return response;
    } catch (error) {
        if (cached) return cached;
        throw error;
    }
}

async function networkFirst(request) {
    try {
        const response = await fetchWithTimeout(request, 5000);
        if (response.ok) {
            await putInCache(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await getCachedResponse(request);
        if (cached) return cached;
        throw error;
    }
}

async function staleWhileRevalidate(request) {
    const cached = await getCachedResponse(request);
    
    const fetchPromise = fetchWithTimeout(request)
        .then(response => {
            if (response.ok) {
                putInCache(request, response.clone());
            }
            return response;
        })
        .catch(() => null);
    
    return cached || fetchPromise;
}

async function cacheWithRetry(cache, url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetchWithTimeout(url);
            if (response.ok) {
                await cache.put(url, response.clone());
                return response;
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await delay(Math.pow(2, i) * 1000);
        }
    }
}

async function fetchWithTimeout(request, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, {
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

async function getCachedResponse(request) {
    const criticalCache = await caches.open(CRITICAL_CACHE);
    const criticalResponse = await criticalCache.match(request);
    if (criticalResponse) return criticalResponse;
    
    const cache = await caches.open(CACHE_NAME);
    return cache.match(request);
}

async function putInCache(request, response) {
    const cache = await caches.open(CACHE_NAME);
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', new Date().toISOString());
    
    const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
    
    await cache.put(request, cachedResponse);
}

function isExpired(response) {
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return false;
    
    const age = Date.now() - new Date(cachedAt).getTime();
    const url = new URL(response.url);
    
    let maxAge = CACHE_DURATION.default;
    if (url.pathname.endsWith('.wasm')) maxAge = CACHE_DURATION.wasm;
    else if (url.pathname.endsWith('.js')) maxAge = CACHE_DURATION.js;
    else if (url.pathname.endsWith('.css')) maxAge = CACHE_DURATION.css;
    else if (url.pathname.endsWith('.html')) maxAge = CACHE_DURATION.html;
    
    return age > maxAge;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-processed-pdfs') {
        event.waitUntil(syncProcessedPDFs());
    }
});

async function syncProcessedPDFs() {
    console.log('Background sync triggered');
}