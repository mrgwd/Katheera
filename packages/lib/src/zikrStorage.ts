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

export const ensureDailyReset = (keys: ZikrKey[]): void => {
  if (!isBrowser()) return;
  try {
    const last = window.localStorage.getItem(LAST_RESET_KEY);
    const today = todayLocal();
    if (last !== today) {
      keys.forEach((k) => window.localStorage.setItem(k, "0"));
      window.localStorage.setItem(LAST_RESET_KEY, today);
    } else {
      window.localStorage.setItem(LAST_RESET_KEY, today);
    }
  } catch {}
};

export const getCounts = (keys: ZikrKey[]): Record<string, number> => {
  const out: Record<string, number> = {};
  if (!isBrowser()) return keys.reduce((acc, k) => ((acc[k] = 0), acc), out);
  keys.forEach((k) => {
    const raw = window.localStorage.getItem(k);
    const num = raw ? parseInt(raw, 10) : 0;
    out[k] = Number.isFinite(num) ? num : 0;
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
  const raw = window.localStorage.getItem(key);
  const num = raw ? parseInt(raw, 10) : 0;
  const current = Number.isFinite(num) ? num : 0;
  const next = current + by;
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
        const last: string | undefined = res[LAST_RESET_KEY];
        const today = todayLocal();
        if (last !== today) {
          const resetObj: Record<string, number | string> = {};
          keys.forEach((k) => (resetObj[k] = 0));
          resetObj[LAST_RESET_KEY] = today;
          chromeAny.storage.local.set(resetObj, () => resolve());
        } else {
          chromeAny.storage.local.set({ [LAST_RESET_KEY]: today }, () => resolve());
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
        const fixes: Record<string, number> = {};
        keys.forEach((k) => {
          const raw = res[k];
          const num = raw ? parseInt(String(raw), 10) : 0;
          out[k] = Number.isFinite(num) ? num : 0;
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
        const raw = res[key];
        const num = raw ? parseInt(String(raw), 10) : 0;
        resolve(Number.isFinite(num) ? num : 0);
      });
    });
    const next = current + by;
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
      if (typeof nv === "number") out[k] = nv;
    });
    if (Object.keys(out).length > 0) cb(out);
  };
  chromeAny.storage.onChanged.addListener(handler);
  return () => chromeAny.storage.onChanged.removeListener(handler);
};
