/**
 * Native debounce implementation - replaces lodash/debounce
 * Reduces bundle size by ~70KB
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
  immediate: boolean = false
): T & { cancel: () => void; flush: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let result: ReturnType<T>;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;

  function debounced(this: any, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate && lastArgs) {
        result = func.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, wait);

    if (callNow) {
      result = func.apply(this, args);
    }

    return result;
  }

  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = function() {
    if (timeout && lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as T & { cancel: () => void; flush: () => void };
}

/**
 * Native throttle implementation
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;
  let result: ReturnType<T>;
  let lastCallTime: number | null = null;

  const { leading = true, trailing = true } = options;

  function throttled(this: any, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    
    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - (lastCallTime || 0));
    lastThis = this;
    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        lastCallTime = leading ? Date.now() : null;
        timeout = null;
        if (lastArgs) {
          result = func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, remaining);
    }

    return result;
  }

  throttled.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCallTime = null;
    lastArgs = null;
    lastThis = null;
  };

  return throttled as T & { cancel: () => void };
}

export default debounce;
