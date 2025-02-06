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
        async: true,
        defer: true,
        onLoad: () => console.log("✅ reCAPTCHA script loaded successfully!"),
      }}
      onScriptLoadError={(error) => {
        console.error("❌ reCAPTCHA script failed to load:", error);
        alert("Error loading reCAPTCHA. Please try refreshing the page.");
      }}
    >
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);
