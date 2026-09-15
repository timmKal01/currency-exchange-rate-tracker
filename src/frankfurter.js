const BASE_URL = 'https://api.frankfurter.dev/v1';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateOnly(date) {
    return date.toISOString().slice(0, 10);
}

async function fetchRates(path, base, symbols) {
    const url = new URL(`${BASE_URL}/${path}`);
    url.searchParams.set('base', base);
    if (symbols) url.searchParams.set('symbols', symbols);

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { headers: { Connection: 'close' }, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res.json();
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`Frankfurter API request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`Frankfurter API request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

export async function fetchRateChanges({ baseCurrency, targetCurrencies, daysBack }) {
    const compareDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const [current, historical] = await Promise.all([
        fetchRates('latest', baseCurrency, targetCurrencies),
        fetchRates(toDateOnly(compareDate), baseCurrency, targetCurrencies),
    ]);

    return Object.entries(current.rates).map(([currency, rate]) => {
        const oldRate = historical.rates[currency] ?? null;
        const percentChange = oldRate ? ((rate - oldRate) / oldRate) * 100 : null;
        return {
            baseCurrency: current.base,
            currency,
            currentRate: rate,
            currentDate: current.date,
            comparisonRate: oldRate,
            comparisonDate: historical.date,
            percentChange: percentChange !== null ? Number(percentChange.toFixed(4)) : null,
        };
    });
}
