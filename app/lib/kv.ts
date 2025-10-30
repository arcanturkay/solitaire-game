// app/lib/kv.ts
import { Redis } from "@upstash/redis";

export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// --- KV Key sabitleri ---
export const KV_KEYS = {
  CHECKIN_STATE_PREFIX: "player:checkin:",
  CHECKIN_POINTS_ZSET: "leaderboard:checkin:scores",
  SCORE_ZSET: "leaderboard:scores",
  PROFILE_HASH: "leaderboard:names",
};

// --- Yardımcı fonksiyonlar (SDK üstüne) ---
export async function kvGet<T = any>(key: string): Promise<T | null> {
  return (await kv.get<T>(key)) ?? null;
}

export async function kvSet(key: string, value: any) {
  await kv.set(key, value);
}

export async function kvZincrby(key: string, increment: number, member: string) {
  await kv.zincrby(key, increment, member);
}

export async function kvZrange(
  key: string,
  start: number,
  stop: number,
  opts?: { withScores?: boolean }
) {
  return await kv.zrange(key, start, stop, opts);
}

export async function kvHset(key: string, obj: Record<string, any>) {
  // ✅ SDK otomatik olarak field-value formatını işler
  await kv.hset(key, obj);
}

export async function kvHgetall<T = Record<string, any>>(key: string): Promise<T | {}> {
  return (await kv.hgetall<T>(key)) ?? {};
}
