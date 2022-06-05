export type Solver = (input: string) => number | Promise<number>;

export interface Config {
  submit: boolean;
  concurrency: boolean;
  resultsInOrder: boolean;
  printResults: boolean;
}

export const defaultConfig: Config = {
  submit: false,
  concurrency: false,
  resultsInOrder: true,
  printResults: true,
};

export interface PartResult {
  answer: number;
}

export abstract class Aocd {
  protected config: Config;
  private tasksComplete = Promise.resolve();

  constructor(config: Partial<Config>) {
    this.config = { ...defaultConfig, ...config };
  }

  async runPart(
    year: number,
    day: number,
    part: number,
    solver: Solver,
  ): Promise<PartResult> {
    if (this.config.submit) {
      // TODO
      console.warn("Answer submitting is not implemented yet");
    }
    const inputPromise = this.getInput(year, day);
    let runAndGetResultShower = async (): Promise<() => PartResult> => {
      const input = await inputPromise;
      const answer = await solver(input);

      return () => {
        if (this.config.printResults) {
          console.log(`${year} Day ${day} Part ${part}: ${answer}`);
        }
        return { answer };
      };
    };

    if (this.config.concurrency && !this.config.resultsInOrder) {
      const showResult = await runAndGetResultShower();
      return showResult();
    } else {
      if (this.config.resultsInOrder) {
        const showResultPromise = runAndGetResultShower();
        runAndGetResultShower = () => showResultPromise;
      }
      const partPromise = this.tasksComplete.then(
        async (): Promise<PartResult> => {
          const showResult = await runAndGetResultShower();
          return showResult();
        },
      );
      this.tasksComplete = partPromise.then(() => {});
      return partPromise;
    }
  }

  abstract getInput(year: number, day: number): Promise<string>;
}
