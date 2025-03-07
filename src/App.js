import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [time, setTime] = useState('');
  const [time2, setTime2] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classDate2, setClassDate2] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Utility: Get next weekday (Monday-Friday) from a given moment date.
  function getNextWeekday(date) {
    let nextDate = date.clone();
    while (nextDate.isoWeekday() > 5) { // 6 = Saturday, 7 = Sunday
      nextDate.add(1, 'day');
    }
    return nextDate;
  }

  // Generate an initial list of 7 valid dates (weekdays only) starting from today + 2 days.
  function getInitialValidDates() {
    const startDate = moment().add(2, 'days');
    let nextValidDate = getNextWeekday(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(nextValidDate.format('MM/DD/YYYY'));
      nextValidDate = getNextWeekday(nextValidDate.clone().add(1, 'day'));
    }
    return dates;
  }

  // This function fetches fully booked dates from your backend and updates validDates accordingly.
  async function updateValidDates() {
    try {
      // Fetch fully booked dates from your backend endpoint
      const response = await axios.get('https://ai-schedular-backend.onrender.com/api/booked-dates');
      const fullyBookedDates = response.data; // Should be an array of dates in "MM/DD/YYYY"
      console.log('Fully booked dates:', fullyBookedDates);

      // Get the initial list of dates
      let dates = getInitialValidDates();
      console.log('Initial valid dates:', dates);

      // Filter out any dates that are fully booked
      dates = dates.filter(date => !fullyBookedDates.includes(date));
      console.log('Dates after filtering:', dates);

      // If we have fewer than 7 dates, append new dates until we have 7
      let lastDateStr = dates.length ? dates[dates.length - 1] : moment().add(2, 'days').format('MM/DD/YYYY');
      let lastDate = moment(lastDateStr, 'MM/DD/YYYY');
      while (dates.length < 7) {
        lastDate = getNextWeekday(lastDate.clone().add(1, 'day'));
        const newDateStr = lastDate.format('MM/DD/YYYY');
        if (!fullyBookedDates.includes(newDateStr)) {
          dates.push(newDateStr);
        }
      }
      console.log('Final valid dates:', dates);
      setValidDates(dates);
    } catch (error) {
      console.error('Error updating valid dates:', error);
    }
  }

  useEffect(() => {
    updateValidDates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(""); // Reset error message before checking

    if (!executeRecaptcha) {
      alert('reCAPTCHA is not initialized');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Step 1: Check if the selected date & time are available before submitting
      const availabilityResponse = await axios.post(
          "https://ai-schedular-backend.onrender.com/api/check-availability",
          {
              classDate,
              time
          }
      );

      if (!availabilityResponse.data.available) {
          // ❌ Date & time already booked, show an error message
          setErrorMessage("The selected date and time are already booked. Please choose another.");
          setIsLoading(false);
          return;
      }

      const recaptchaToken = await executeRecaptcha('submit_form');
      const formData = {
        firstName,
        lastName,
        email,
        company,
        phoneNumber,
        time,
        time2,
        classDate,
        classDate2,
        recaptchaToken,
      };

      const response = await axios.post(
        'https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment',
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      updateValidDates();

      window.location.href = "https://ka.kableacademy.com/intro-to-ai-bulk-tech-cred-scheduler-thank-you";

    } catch (error) {
      console.error('Error during form submission:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY}>
      {isLoading ? (
        <div className="loading-screen" style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading, please wait...</p>
        </div>
      ) : isSubmitted ? (
        // ✅ Full black screen on submission
        <div style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "24px"
        }}>
          Thank you! Redirecting...
        </div>
      ) : (
        <div className="App py-3" id="my-react-form">
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
                <label htmlFor="inputCompany" className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="inputCompnay"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
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

              <div className="col-md-6">
                <label htmlFor="inputDate" className="form-label">Class Date 1</label>
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
                      {moment(date).format('MM/DD/YYYY')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputTime" className="form-label">Program Time 1</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                >
                  <option value="">Select a time</option>
                  <option value="9am-12pm EST/8am-11pm CST">9am-12pm EST</option>
                  <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                  <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST(Friday only)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputDate" className="form-label">Class Date 2</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputDate"
                  value={classDate2}
                  onChange={(e) => setClassDate2(e.target.value)}
                  required
                >
                  <option value="">Please select a date</option>
                  {validDates.map((date, index) => (
                    <option key={index} value={moment(date).format('MM/DD/YYYY')}>
                      {moment(date).format('MM/DD/YYYY')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputTime" className="form-label">Program Time 2</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputTime"
                  value={time2}
                  onChange={(e) => setTime2(e.target.value)}
                  required
                >
                  <option value="">Select a time</option>
                  <option value="9am-12pm EST/8am-11pm CST">9am-12pm EST</option>
                  <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                  <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST(Friday only)</option>
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
                    By providing your contact information and checking the box, you agree that Kable Academy may contact you about our relevant content, products, and services via email, phone and SMS communications. SMS can be used for reminders. SMS can be used for updates. View our
                    <a href='https://kableacademy.com/private-policy/'> Privacy Policy.</a>
                  </label>
                </div>
              </div>

              <div className="col-12">
                <button type="submit" className="btn">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GoogleReCaptchaProvider>
  );
}

export default App;
