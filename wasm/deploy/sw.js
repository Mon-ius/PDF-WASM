const CACHE_NAME = 'pdf-wasm-v2';
const CRITICAL_CACHE = 'pdf-wasm-critical-v2';

const CRITICAL_ASSETS = [
    './',
    './index.html',
    './pkg/pdf_wasm_bindings.js',
    './pkg/pdf_wasm_bindings_bg.wasm'
];

const OPTIONAL_ASSETS = [
    './favicon.webp',
    './font-awesome.min.css',
    './fonts/fontawesome-webfont.woff2',
    './fonts/fontawesome-webfont.woff',
    './fonts/fontawesome-webfont.ttf',
    './fonts/fontawesome-webfont.eot',
    './fonts/fontawesome-webfont.svg'
];

const CACHE_STRATEGIES = {
    cacheFirst: [
        /\.wasm$/,
        /\.js$/,
        /\.css$/,
        /favicon/,
        /\.woff2?$/,
        /\.ttf$/,
        /\.eot$/,
        /\.svg$/,
        /fontawesome/
    ],
    networkFirst: [
        /\.html$/,
        /\/$/
    ]
};

const CACHE_DURATION = {
    wasm: 7 * 24 * 60 * 60 * 1000,
    js: 24 * 60 * 60 * 1000,
    css: 24 * 60 * 60 * 1000,
    fonts: 30 * 24 * 60 * 60 * 1000,
    html: 60 * 60 * 1000,
    default: 24 * 60 * 60 * 1000
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
            const optionalPromises = OPTIONAL_ASSETS.map(asset => 
                cacheWithRetry(cache, asset).catch(error => {
                    console.warn(`Failed to cache optional asset: ${asset}`, error);
                })
            );
            await Promise.all(optionalPromises);
            
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
            const cache = await caches.open(CACHE_NAME);
            const fontUrls = OPTIONAL_ASSETS.filter(url => /\.(woff2?|ttf|eot|svg)$/.test(url));
            await Promise.all(
                fontUrls.map(url => 
                    cache.match(url).then(response => {
                        if (!response) {
                            return cacheWithRetry(cache, url).catch(() => {});
                        }
                    })
                )
            );
            
            self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    
    event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
    const url = new URL(request.url);
    const preferCache = networkQuality === 'poor' || networkQuality === 'slow';
    let strategy = 'networkFirst';
    for (const [strat, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => pattern.test(url.pathname) || pattern.test(url.href))) {
            strategy = strat;
            break;
        }
    }
    
    if (preferCache && strategy !== 'networkFirst') {
        strategy = 'cacheFirst';
    }
    
    switch (strategy) {
        case 'cacheFirst':
            return cacheFirst(request);
        case 'networkFirst':
            return networkFirst(request);
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
        const response = await fetchWithTimeout(request);
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

async function cacheWithRetry(cache, url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const request = new Request(url, {
                mode: 'same-origin'
            });
            const response = await fetchWithTimeout(request);
            if (response.ok || response.status === 0) {
                await cache.put(url, response.clone());
                return response;
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await delay(Math.pow(2, i) * 1000);
        }
    }
}

let networkQuality = 'good';

function updateNetworkQuality(duration, success) {
    if (!success) {
        networkQuality = 'poor';
    } else if (duration > 3000) {
        networkQuality = 'slow';
    } else if (duration > 1000) {
        networkQuality = 'moderate';
    } else {
        networkQuality = 'good';
    }
}

function getTimeout() {
    switch (networkQuality) {
        case 'poor': return 20000;
        case 'slow': return 15000;
        case 'moderate': return 10000;
        default: return 5000;
    }
}

async function fetchWithTimeout(request, timeout = null) {
    const actualTimeout = timeout || getTimeout();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), actualTimeout);
    const startTime = Date.now();
    
    try {
        const response = await fetch(request, {
            signal: controller.signal,
            mode: request.mode || 'same-origin',
            credentials: request.credentials || 'omit',
            cache: 'default'
        });
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        updateNetworkQuality(duration, response.ok);
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        updateNetworkQuality(Date.now() - startTime, false);
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
    else if (/\.(woff2?|ttf|eot|svg)$/.test(url.pathname)) maxAge = CACHE_DURATION.fonts;
    
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

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_STATUS') {
        event.waitUntil(
            (async () => {
                const cacheNames = await caches.keys();
                const cacheSize = await Promise.all(
                    cacheNames.map(async name => {
                        const cache = await caches.open(name);
                        const keys = await cache.keys();
                        return keys.length;
                    })
                );
                
                event.ports[0].postMessage({
                    type: 'CACHE_STATUS_RESPONSE',
                    caches: cacheNames,
                    totalItems: cacheSize.reduce((a, b) => a + b, 0),
                    networkQuality: networkQuality
                });
            })()
        );
    }
});