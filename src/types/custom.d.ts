declare const require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): {
    (key: string): string;
    keys(): string[];
  };
};
