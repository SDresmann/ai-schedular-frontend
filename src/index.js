import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.REACT_APP_SITE_KEY}
      scriptProps={{
        async: true, // Asynchronously load the reCAPTCHA script
        defer: true, // Defer loading the script until DOM is ready
      }}
      onScriptLoadError={(error) => {
        console.error("reCAPTCHA script failed to load:", error);
        alert("Error loading reCAPTCHA. Please try refreshing the page.");
      }}
    >
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);