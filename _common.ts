// This object may be passed in to the current version of Aocd through
// a module using an older version of Aocd through `configureAocd()`,
// so make sure any changes to it and the values contained inside are
// backwards-compatible! All new properties should be optional.
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
  submit: boolean;
  concurrency: boolean;
  resultsInOrder: boolean;
  printResults: boolean;
}

export type Answer = number | string;
export type Solver = (input: string) => Answer | Promise<Answer>;

export interface PartResult {
  answer: Answer;
  correct?: boolean;
}
