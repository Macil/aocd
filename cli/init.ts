export interface InitOptions {
  year: number;
  onlyAocdConfig?: boolean;
}

// deno-lint-ignore require-await
export async function init(options: InitOptions) {
  options;
  throw new Error("Not implemented yet"); // TODO
}
