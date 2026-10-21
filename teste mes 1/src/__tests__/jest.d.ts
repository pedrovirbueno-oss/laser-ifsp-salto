declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function expect(actual: any): any;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterAll(fn: () => void | Promise<void>): void;
