function isClient() {
  return import.meta.client;
}

export function getStorage<T>(key: string, fallback: T): T {
  if (!isClient()) {
    return fallback;
  }

  const value = localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T) {
  if (!isClient()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string) {
  if (!isClient()) {
    return;
  }

  localStorage.removeItem(key);
}
