const BASE_URL = 'https://api.frankfurter.dev/v1';

function toDateOnly(date) {
    return date.toISOString().slice(0, 10);
}

async function fetchRates(path, base, symbols) {
    const url = new URL(`${BASE_URL}/${path}`);
    url.searchParams.set('base', base);
    if (symbols) url.searchParams.set('symbols', symbols);

    const res = await fetch(url, { headers: { Connection: 'close' } });
    if (!res.ok) {
        throw new Error(`Frankfurter API request failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
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
