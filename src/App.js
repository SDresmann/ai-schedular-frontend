import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    program: '',
    time: '',
    classDate: '',
    postal: '',
  });
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    const generateValidDates = () => {
      const today = moment();
      const validDates = [];
      let nextDate = today.add(2, 'days');

      const excludedDates = ['10/31/2024']; // Add excluded dates as needed

      while (validDates.length < 10) {
        if (nextDate.isoWeekday() <= 4 && !excludedDates.includes(nextDate.format('MM/DD/YYYY'))) {
          validDates.push(nextDate.format('MM/DD/YYYY'));
        }
        nextDate = nextDate.add(1, 'days');
      }
      setValidDates(validDates);
    };

    generateValidDates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      setFormStatus({ type: 'error', message: 'reCAPTCHA not initialized' });
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha('submit_form');
      const response = await axios.post('/api/intro-to-ai-payment', {
        ...formData,
        recaptchaToken,
      });

      setFormStatus({ type: 'success', message: 'Form submitted successfully!' });
      console.log('Form submission response:', response.data);
    } catch (error) {
      console.error('Error submitting form:', error.response?.data || error.message);
      setFormStatus({ type: 'error', message: 'Failed to submit form. Please try again.' });
    }
  };

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY}>
      <div className="App">
        <form onSubmit={handleSubmit}>
          {['firstName', 'lastName', 'email', 'phoneNumber', 'postal'].map((field) => (
            <div key={field}>
              <label>{field.replace(/^\w/, (c) => c.toUpperCase())}</label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div>
            <label>Program</label>
            <select name="program" value={formData.program} onChange={handleChange} required>
              <option value="">Choose a Program</option>
              <option value="Intro to AI">Intro to AI</option>
            </select>
          </div>

          <div>
            <label>Program Time</label>
            <select name="time" value={formData.time} onChange={handleChange} required>
              <option value="">Select a time</option>
              <option value="2pm-5pm EST">2pm-5pm EST</option>
              <option value="6pm-9pm EST">6pm-9pm EST</option>
            </select>
          </div>

          <div>
            <label>Class Date</label>
            <select name="classDate" value={formData.classDate} onChange={handleChange} required>
              <option value="">Please select a date</option>
              {validDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              required
            />
            <label>
              Agree to Terms
            </label>
          </div>

          <button type="submit">Submit</button>
        </form>

        {formStatus.message && (
          <p className={formStatus.type === 'success' ? 'success' : 'error'}>
            {formStatus.message}
          </p>
        )}
      </div>
    </GoogleReCaptchaProvider>
  );
}

export default App;
