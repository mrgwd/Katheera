export type ZikrKey = string;

const isBrowser = (): boolean => typeof window !== "undefined";
const getChrome = (): any => (globalThis as any).chrome;
const isChromeExt = (): boolean => {
  const c = getChrome();
  return typeof c !== "undefined" && !!c.storage?.local;
};

const todayLocal = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const LAST_RESET_KEY = "lastResetDate";

/** Coerce any stored value to a safe non-negative integer count. */
const toCount = (raw: unknown): number => {
  const num = typeof raw === "number" ? raw : Number(raw ?? 0);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
};

const lastError = (): unknown => getChrome()?.runtime?.lastError;

export const ensureDailyReset = (keys: ZikrKey[]): void => {
  if (!isBrowser()) return;
  try {
    const last = window.localStorage.getItem(LAST_RESET_KEY);
    const today = todayLocal();
    if (last !== today) {
      keys.forEach((k) => window.localStorage.setItem(k, "0"));
      window.localStorage.setItem(LAST_RESET_KEY, today);
    }
  } catch {}
};

export const getCounts = (keys: ZikrKey[]): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!isBrowser()) return keys.reduce((acc, k) => ((acc[k] = 0), acc), out);
  keys.forEach((k) => {
    out[k] = toCount(window.localStorage.getItem(k));
  });
  return out;
};

export const setCount = (key: ZikrKey, value: number): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {}
};

export const incrementCount = (key: ZikrKey, by: number = 1): number => {
  if (!isBrowser()) return 0;
  const current = toCount(window.localStorage.getItem(key));
  const next = Math.max(0, current + by);
  try {
    window.localStorage.setItem(key, String(next));
  } catch {}
  return next;
};

export const getLastResetDate = (): string | null => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(LAST_RESET_KEY);
  } catch {
    return null;
  }
};

export const ensureDailyResetAsync = async (keys: ZikrKey[]): Promise<void> => {
  if (isChromeExt()) {
    return new Promise((resolve) => {
      const chromeAny = getChrome();
      chromeAny.storage.local.get([LAST_RESET_KEY, ...keys], (res: any) => {
        if (lastError()) {
          resolve();
          return;
        }
        const last: string | undefined = res[LAST_RESET_KEY];
        const today = todayLocal();
        if (last !== today) {
          const resetObj: Record<string, number | string> = {};
          keys.forEach((k) => (resetObj[k] = 0));
          resetObj[LAST_RESET_KEY] = today;
          chromeAny.storage.local.set(resetObj, () => resolve());
        } else {
          resolve();
        }
      });
    });
  }
  ensureDailyReset(keys);
};

export const getCountsAsync = async (
  keys: ZikrKey[],
): Promise<Record<string, number>> => {
  if (isChromeExt()) {
    const out: Record<string, number> = {};
    return new Promise((resolve) => {
      const chromeAny = getChrome();
      chromeAny.storage.local.get(keys, (res: any) => {
        if (lastError()) {
          keys.forEach((k) => (out[k] = 0));
          resolve(out);
          return;
        }
        const fixes: Record<string, number> = {};
        keys.forEach((k) => {
          const raw = res[k];
          out[k] = toCount(raw);
          if (typeof raw === "string") {
            fixes[k] = out[k];
          }
        });
        if (Object.keys(fixes).length > 0) {
          chromeAny.storage.local.set(fixes, () => resolve(out));
        } else {
          resolve(out);
        }
      });
    });
  }
  return Promise.resolve(getCounts(keys));
};

export const setCountAsync = async (key: ZikrKey, value: number): Promise<void> => {
  if (isChromeExt()) {
    return new Promise((resolve) => {
      const chromeAny = getChrome();
      chromeAny.storage.local.set({ [key]: Math.max(0, Math.floor(value)) }, () => resolve());
    });
  }
  setCount(key, value);
  return Promise.resolve();
};

export const incrementCountAsync = async (
  key: ZikrKey,
  by: number = 1,
): Promise<number> => {
  if (isChromeExt()) {
    const chromeAny = getChrome();
    const current = await new Promise<number>((resolve) => {
      chromeAny.storage.local.get([key], (res: any) => {
        if (lastError()) {
          resolve(0);
          return;
        }
        resolve(toCount(res[key]));
      });
    });
    const next = Math.max(0, current + by);
    await new Promise<void>((resolve) => {
      chromeAny.storage.local.set({ [key]: next }, () => resolve());
    });
    return next;
  }
  return Promise.resolve(incrementCount(key, by));
};

export const subscribeCounts = (
  cb: (changes: Record<string, number>) => void,
): (() => void) => {
  if (!isChromeExt()) return () => {};
  const chromeAny = getChrome();
  const handler = (changes: any, namespace: string) => {
    if (namespace !== "local") return;
    const out: Record<string, number> = {};
    Object.entries(changes).forEach(([k, v]) => {
      const nv: any = (v as any).newValue;
      // Accept numbers and numeric strings (sync API writes strings).
      const n =
        typeof nv === "number" || typeof nv === "string" ? Number(nv) : NaN;
      if (Number.isFinite(n)) out[k] = Math.max(0, Math.floor(n));
    });
    if (Object.keys(out).length > 0) cb(out);
  };
  chromeAny.storage.onChanged.addListener(handler);
  return () => chromeAny.storage.onChanged.removeListener(handler);
};
