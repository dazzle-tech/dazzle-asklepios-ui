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

declare module '*.less';

// Extend Window to include Web Speech API types used in MyInput
interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}