import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';
import './App.css'


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey='6LcRLocqAAAAAJS6nXWzXbYLuYjLbqgLdHInE-4N'
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
