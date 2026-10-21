let passCount = 0;
let failCount = 0;
let testQueue: Promise<void> = Promise.resolve();
let currentBeforeEach: (() => void) | null = null;
let pendingAfterAlls: (() => void)[] = [];

(global as any).beforeEach = (fn: () => void) => {
  currentBeforeEach = fn;
};

(global as any).afterAll = (fn: () => void) => {
  pendingAfterAlls.push(fn);
};

(global as any).describe = (name: string, fn: () => void) => {
  const prevBeforeEach = currentBeforeEach;
  const prevAfterAlls = pendingAfterAlls;
  currentBeforeEach = null;
  pendingAfterAlls = [];

  testQueue = testQueue.then(() => {
    console.log(`\n=== SUITE: ${name} ===`);
  });

  try {
    fn();
  } catch (err: any) {
    console.error(`❌ Suite Error in [${name}]:`, err.message);
  }

  const suiteAfterAlls = [...pendingAfterAlls];
  testQueue = testQueue.then(async () => {
    for (const hook of suiteAfterAlls) {
      try {
        await hook();
      } catch {}
    }
  });

  currentBeforeEach = prevBeforeEach;
  pendingAfterAlls = prevAfterAlls;
};

(global as any).it = (name: string, fn: () => void | Promise<void>) => {
  const hookBefore = currentBeforeEach;
  testQueue = testQueue.then(async () => {
    try {
      if (hookBefore) {
        hookBefore();
      }
      await fn();
      passCount++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      failCount++;
      console.error(`  ✕ ${name}`);
      console.error(`    -> ${err.message}`);
    }
  });
};


(global as any).expect = (actual: any) => {
  return {
    toBe(expected: any) {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    },
    toBeGreaterThan(expected: number) {
      if (!(actual > expected)) throw new Error(`Expected ${actual} to be greater than ${expected}`);
    },
    toBeLessThanOrEqual(expected: number) {
      if (!(actual <= expected)) throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected ${actual} to be null`);
    },
    toBeUndefined() {
      if (actual !== undefined) throw new Error(`Expected ${actual} to be undefined`);
    },
    toContain(expectedItem: any) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expectedItem)) throw new Error(`Expected array to contain ${JSON.stringify(expectedItem)}`);
      } else if (typeof actual === 'string') {
        if (!actual.includes(expectedItem)) throw new Error(`Expected string to contain ${JSON.stringify(expectedItem)}`);
      } else {
        throw new Error(`actual is not string or array for toContain`);
      }
    },
    toThrow(pattern?: string | RegExp) {
      let threw = false;
      let errMessage = '';
      try {
        if (typeof actual === 'function') {
          actual();
        }
      } catch (err: any) {
        threw = true;
        errMessage = err.message || String(err);
      }
      if (!threw) throw new Error(`Expected function to throw an error, but it did not`);
      if (pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        if (!regex.test(errMessage)) {
          throw new Error(`Expected error message "${errMessage}" to match ${pattern}`);
        }
      }
    },
    rejects: {
      async toThrow() {
        let threw = false;
        try {
          if (typeof actual === 'function') {
            await actual();
          } else if (actual && typeof actual.then === 'function') {
            await actual;
          }
        } catch {
          threw = true;
        }
        if (!threw) throw new Error(`Expected promise rejection, but it resolved`);
      }
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) throw new Error(`Expected ${JSON.stringify(actual)} NOT to be ${JSON.stringify(expected)}`);
      },
      toEqual(expected: any) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(actual)} NOT to equal ${JSON.stringify(expected)}`);
      },
      toBeNull() {
        if (actual === null) throw new Error(`Expected value NOT to be null`);
      },
      toThrow() {
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (err: any) {
          throw new Error(`Expected function NOT to throw an error, but it threw: ${err.message}`);
        }
      }
    }
  };
};

export function printSummary() {
  testQueue.then(() => {
    console.log(`\n========================================`);
    console.log(`TOTAL TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);
    if (failCount > 0) {
      process.exit(1);
    }
  });
}

