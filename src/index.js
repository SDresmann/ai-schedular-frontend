import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY}>
    <App />
  </GoogleReCaptchaProvider>
);
