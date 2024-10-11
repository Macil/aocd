export interface Config {
  options: Partial<Options>;
  source: AocdSource;
}

// If you plan to update this interface, see the note on Config above.
export interface AocdSource {
  getInput(year: number, day: number): Promise<string>;

  submit(
    year: number,
    day: number,
    part: number,
    solution: Answer,
  ): Promise<boolean>;
}

// If you plan to update this interface, see the note on Config above.
export interface Options {
  /**
   * Show the runtimes of the solvers.
   * @default false
   */
  time: boolean;
  /**
   * Submit the answer to the AoC website.
   * @default false
   */
  submit: boolean;
  /**
   * Execute the solvers concurrently. Only has benefit if they're asynchronous functions.
   * @default false
   */
  concurrency: boolean;
  /** @default true */
  printResults: boolean;
  /**
   * When using concurrency mode, still print the results in order.
   * @default true
   */
  resultsInOrder: boolean;
}

export type Answer = number | string;
export type MaybeAnswer = Answer | null | undefined;
export type Solver = (input: string) => MaybeAnswer | Promise<MaybeAnswer>;

export interface PartResult {
  answer: MaybeAnswer;
  correct?: boolean;
}
