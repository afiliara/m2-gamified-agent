import "dotenv/config";

import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MANTLE_RPC_URL: z.string().url(),
  MANTLE_CHAIN_ID: z.coerce.number().int().positive().default(5003),
  MANTLE_EXPLORER_URL: z.string().url(),
  OPERATOR_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  M2_ARENA_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  M2_AGENT_REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  M2_MOCK_USDC_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  PYTH_HERMES_URL: z.string().url().default("https://hermes.pyth.network"),
  PYTH_API_KEY: z.string().optional(),
  PYTH_BTC_USD_FEED_ID: z.string().regex(/^[a-fA-F0-9]{64}$/),
  PYTH_ETH_USD_FEED_ID: z.string().regex(/^[a-fA-F0-9]{64}$/),
  PYTH_SOL_USD_FEED_ID: z.string().regex(/^[a-fA-F0-9]{64}$/),
  PYTH_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SCHEDULER_ENABLED: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  SCHEDULER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  ROUND_SETTLEMENT_RETRY_LIMIT: z.coerce.number().int().positive().default(3),
  RUNTIME_DIR: z.string().min(1).default("./runtime"),
});

const parsedEnv = envSchema.parse(process.env);

export const config = {
  ...parsedEnv,
  runtimeDir: path.resolve(process.cwd(), parsedEnv.RUNTIME_DIR),
} as const;
