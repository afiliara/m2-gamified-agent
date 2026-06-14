import { config } from "../config.js";
import type { AssetSymbol, MarketSnapshot, PricePoint } from "../types.js";

type HermesParsedFeed = {
  id: string;
  price: {
    price: string;
    expo: number;
    publish_time: number;
  };
};

type HermesLatestPriceResponse = {
  parsed: HermesParsedFeed[];
};

const SYMBOL_BY_FEED_ID: Record<string, AssetSymbol> = {
  [config.PYTH_BTC_USD_FEED_ID.toLowerCase()]: "BTC",
  [config.PYTH_ETH_USD_FEED_ID.toLowerCase()]: "ETH",
  [config.PYTH_SOL_USD_FEED_ID.toLowerCase()]: "SOL",
};

export class MarketService {
  async getLatestSnapshot(): Promise<MarketSnapshot> {
    const url = new URL("/v2/updates/price/latest", config.PYTH_HERMES_URL);
    url.searchParams.append("ids[]", withHexPrefix(config.PYTH_BTC_USD_FEED_ID));
    url.searchParams.append("ids[]", withHexPrefix(config.PYTH_ETH_USD_FEED_ID));
    url.searchParams.append("ids[]", withHexPrefix(config.PYTH_SOL_USD_FEED_ID));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.PYTH_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (config.PYTH_API_KEY) {
        headers["X-API-Key"] = config.PYTH_API_KEY;
      }

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Pyth request failed with status ${response.status}`);
      }

      const payload = await response.json() as HermesLatestPriceResponse;
      const prices = buildPriceMap(payload.parsed);

      return {
        source: "pyth",
        capturedAt: Date.now(),
        prices,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildPriceMap(parsedFeeds: HermesParsedFeed[]) {
  const prices = {} as Record<AssetSymbol, PricePoint>;

  for (const feed of parsedFeeds) {
    const symbol = SYMBOL_BY_FEED_ID[feed.id.toLowerCase()];
    if (!symbol) {
      continue;
    }

    prices[symbol] = {
      symbol,
      price: Number(feed.price.price) * 10 ** feed.price.expo,
      publishTime: feed.price.publish_time,
    };
  }

  for (const symbol of ["BTC", "ETH", "SOL"] as const) {
    if (!prices[symbol]) {
      throw new Error(`Missing ${symbol} price in Pyth response`);
    }
  }

  return prices;
}

function withHexPrefix(value: string) {
  return value.startsWith("0x") ? value : `0x${value}`;
}
