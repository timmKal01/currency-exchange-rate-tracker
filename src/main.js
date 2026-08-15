import { Actor, log } from 'apify';
import { fetchRateChanges } from './frankfurter.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { baseCurrency = 'USD', targetCurrencies, daysBack = 7 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const RATE_CHECK_EVENT = 'rate-check';

const rates = await fetchRateChanges({
    baseCurrency: baseCurrency.toUpperCase(),
    targetCurrencies: targetCurrencies ? targetCurrencies.toUpperCase() : undefined,
    daysBack,
});

for (const rate of rates) {
    await Actor.pushData(rate);
}

await Actor.charge({ eventName: RATE_CHECK_EVENT });

log.info(`Pushed ${rates.length} rate(s)`);

await Actor.exit();
