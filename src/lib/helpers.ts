import type { InjectionKey } from "vue";
import { inject } from "vue";

export const injectStrict = <T>(key: InjectionKey<T> | string, fallback?:T) => {
    const resolved = inject(key, fallback);
  if ( resolved === undefined) {
    throw new Error(`Could not resolve`);
  }
  return resolved;
}

export const typeCheckingParseInt = (value: number | string):number => {
    return typeof value === "string" ? parseInt(value) : value;
};


