// global.d.ts
/// <reference types="node" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.webp';
declare module '*.css';
declare module '*.module.css';
declare module '*.module.scss';

// reCAPTCHA / firebase RecaptchaVerifier and other custom window fields:
interface Window {
  grecaptcha?: any;
  recaptchaVerifier?: any;
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  // add other custom window properties used in your app
}
