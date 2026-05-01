// Ambient global type augmentations (no imports/exports — keep as ambient)
interface Window {
  gtag?: (...args: any[]) => void;
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}
