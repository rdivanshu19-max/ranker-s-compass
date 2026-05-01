/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export {};
