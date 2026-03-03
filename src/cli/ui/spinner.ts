import ora, { type Ora } from 'ora';

interface SpinnerLike {
  start: () => SpinnerLike;
  succeed: (text?: string) => SpinnerLike;
  fail: (text?: string) => SpinnerLike;
  stop: () => SpinnerLike;
  text: string;
}

class NoOpSpinner implements SpinnerLike {
  text = '';

  start(): SpinnerLike {
    return this;
  }

  succeed(_text?: string): SpinnerLike {
    return this;
  }

  fail(_text?: string): SpinnerLike {
    return this;
  }

  stop(): SpinnerLike {
    return this;
  }
}

export function createSpinner(
  text: string,
  options?: { quiet?: boolean }
): SpinnerLike {
  // Don't show spinner if quiet mode or not a TTY (piped output)
  if (options?.quiet || !process.stdout.isTTY) {
    return new NoOpSpinner();
  }

  return ora(text);
}
