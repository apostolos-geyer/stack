type MaybePromise<T> = T | Promise<T>;
type AnyGenerator<T> =
  | Generator<T, void, unknown>
  | AsyncGenerator<T, void, unknown>;

export function contextFactory<Resource>(
  generatorFn: () => AnyGenerator<Resource>,
) {
  return async function <Result>(
    body: (resource: Resource) => MaybePromise<Result>,
  ): Promise<Result> {
    const gen = generatorFn();

    const { value: resource, done } = await gen.next();
    if (done) {
      throw new Error("Generator must yield exactly once");
    }

    try {
      const result = await body(resource as Resource);
      await gen.next(); // trigger finally block
      return result;
    } catch (err) {
      await gen.throw?.(err); // trigger catch/finally in generator
      throw err;
    }
  };
}
