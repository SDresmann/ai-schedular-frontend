import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [program, setProgram] = useState('');
  const [time, setTime] = useState('');
  const [time2, setTime2] = useState('');
  const [time3, setTime3] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classDate2, setClassDate2] = useState('');
  const [classDate3, setClassDate3] = useState('');
  const [postal, setPostal] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const { executeRecaptcha } = useGoogleReCaptcha(); // Use reCAPTCHA hook

  // Generate valid program dates
  function getNextValidProgramDates(selectedDate) {
    const today = moment();
    const validDates = [];
    let nextValidDate = today.add(2, 'days'); // Start from 2 days ahead

    while (validDates.length < 7) {
      if (nextValidDate.isoWeekday() >= 1 && nextValidDate.isoWeekday() <= 4) {
        const formattedDate = nextValidDate.clone().format('MM/DD/YYYY');
        if (formattedDate !== selectedDate) {
          validDates.push(formattedDate);
        }
      }
      nextValidDate.add(1, 'day'); // Move to the next day
    }

    return validDates;
  }

  useEffect(() => {
    const dates = getNextValidProgramDates();
    setValidDates(dates);
  }, []);



  useEffect(() => {
    if (!executeRecaptcha) {
      console.warn("⚠️ reCAPTCHA is NOT ready. Retrying in 1 second...");

      const interval = setInterval(() => {
        if (executeRecaptcha) {
          console.log("✅ reCAPTCHA is now ready.");
          clearInterval(interval);
        }
      }, 1000); // Check every second

      return () => clearInterval(interval);
    } else {
      console.log("✅ reCAPTCHA is ready.");
    }
  }, [executeRecaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      alert("❌ reCAPTCHA is not initialized!");
      return;
    }

    try {
      console.log("⚡ Generating reCAPTCHA Token...");
      const recaptchaToken = await executeRecaptcha("submit_form");

      console.log("✅ Generated reCAPTCHA Token:", recaptchaToken);

      function convertDateToISO8601(date) {
        if (!date) return null;
        return new Date(date).toISOString(); // Converts to YYYY-MM-DDTHH:mm:ss.sTZD
      }
      
      // Ensure dates are converted before sending:
      const formData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        program,
        time,
        time2,
        time3,
        classDate: convertDateToISO8601(classDate),
        classDate2: convertDateToISO8601(classDate2),
        classDate3: convertDateToISO8601(classDate3),
        postal,
        recaptchaToken,
      };
      

      console.log("🚀 Sending Final Form Data:", formData);

      const response = await axios.post(
        "https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Form submission response:", response.data);
      alert("Form submitted successfully!");
    } catch (error) {
      console.error("❌ Error during form submission:", error);
      alert("Error submitting form. Please try again.");
    }
  };



  return (
    <GoogleReCaptchaProvider reCaptchaKey='6LcRLocqAAAAAJS6nXWzXbYLuYjLbqgLdHInE-4N'>
      <div className="App">
        <div className="container">
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-6">
              <label htmlFor="inputName" className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                id="inputName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="inputLast" className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                id="inputLast"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="col-6">
              <label htmlFor="inputEmail" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="inputEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="col-6">
              <label htmlFor="inputPhone" className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                id="inputPhone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label>Choose the program you are interested in</label>
              <select
                className="form-select"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
              >
                <option value="">Choose a Program</option>
                <option value="Intro to AI">Intro to AI</option>
              </select>
            </div>

            <div className="col-md-12">
              <label htmlFor="inputZip" className="form-label">Postal Code</label>
              <input
                type="text"
                className="form-control"
                id="inputZip"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="inputTime" className="form-label">Program Time</label>
              <select className="form-select form-select mb-3" value={time} onChange={(e) => setTime(e.target.value)} required>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST/9am-12pm CST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST/1pm-4pm CST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST/5pm-8pm CST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputTime2" className="form-label">Program Time 2</label>
              <select className="form-select form-select mb-3" value={time2} onChange={(e) => setTime2(e.target.value)} required>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST/9am-12pm CST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST/1pm-4pm CST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST/5pm-8pm CST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputTime3" className="form-label">Program Time 3</label>
              <select className="form-select form-select mb-3" value={time3} onChange={(e) => setTime3(e.target.value)} required>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST/9am-12pm CST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST/1pm-4pm CST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST/5pm-8pm CST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>

            <div className="col-md-6">
              <label htmlFor="inputDate" className="form-label">Class Date</label>
              <select
                className="form-select form-select mb-3"
                id="inputDate"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                required
              >
                <option value="">Please select a date</option>
                {validDates.map((date, index) => (
                  <option key={index} value={moment(date).format('MM/DD/YYYY')}>
                    {moment(date).format('YYYY/MM/DD')}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputDate" className="form-label">Class Date</label>
              <select
                className="form-select form-select mb-3"
                id="inputDate"
                value={classDate2}
                onChange={(e) => setClassDate2(e.target.value)}
                required
              >
                <option value="">Please select a date</option>
                {validDates.map((date, index) => (
                  <option key={index} value={moment(date).format('YYYY/MM/DD')}>
                    {moment(date).format('YYYY/MM/DD')}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputDate" className="form-label">Class Date</label>
              <select
                className="form-select form-select mb-3"
                id="inputDate"
                value={classDate3}
                onChange={(e) => setClassDate3(e.target.value)}
                required
              >
                <option value="">Please select a date</option>
                {validDates.map((date, index) => (
                  <option key={index} value={moment(date).format('YYYY/MM/DD')}>
                    {moment(date).format('YYYY/MM/DD')}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="gridCheck"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  required
                />
                <label className="form-check-label" htmlFor="gridCheck">
                  By providing your contact information, you agree to be contacted by us.
                </label>
              </div>
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </GoogleReCaptchaProvider>
  );
}

export default App;
