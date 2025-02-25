import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [time, setTime] = useState('');
  const [time2, setTime2] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classDate2, setClassDate2] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  function getNextWeekday(date) {
    let nextDate = moment(date);
    while (nextDate.isoWeekday() > 5) { // isoWeekday: 6 = Saturday, 7 = Sunday
      nextDate = nextDate.add(1, 'day');
    }
    return nextDate;
  }

  // Generate an initial list of 7 valid dates (weekdays only) starting from today + 2 days.
  function getInitialValidDates() {
    const today = moment();
    const dates = [];
    let nextValidDate = today.add(2, 'days');
    nextValidDate = getNextWeekday(nextValidDate);

    for (let i = 0; i < 7; i++) {
      dates.push(nextValidDate.format('MM/DD/YYYY'));
      nextValidDate = nextValidDate.add(1, 'day');
      nextValidDate = getNextWeekday(nextValidDate);
    }
    return dates;
  }

  // Fetch fully booked dates from your backend (which in turn uses HubSpot data).
  async function fetchFullyBookedDates() {
    try {
      // This endpoint should return an array of dates (formatted as MM/DD/YYYY)
      // that are fully booked (i.e. both time slots are taken)
      const response = await axios.get('https://ai-schedular-backend.onrender.com/api/booked-dates');
      return response.data;
    } catch (error) {
      console.error('Error fetching booked dates:', error);
      return [];
    }
  }

  // Combine the initial dates with filtering out fully booked days,
  // and then ensure that you always have 7 available dates.
  async function updateValidDates() {
    const fullyBookedDates = await fetchFullyBookedDates();
    let dates = getInitialValidDates();

    // Remove dates that are fully booked
    dates = dates.filter(date => !fullyBookedDates.includes(date));

    // If the available dates drop below 7, append new future dates until there are 7
    let lastDateStr = dates[dates.length - 1] || moment().add(2, 'days').format('MM/DD/YYYY');
    let lastDate = moment(lastDateStr, 'MM/DD/YYYY');
    while (dates.length < 7) {
      lastDate = lastDate.add(1, 'day');
      lastDate = getNextWeekday(lastDate);
      const newDateStr = lastDate.format('MM/DD/YYYY');
      if (!fullyBookedDates.includes(newDateStr)) {
        dates.push(newDateStr);
      }
    }
    setValidDates(dates);
  }

  // Fetch available dates on component mount and update after a booking.
  useEffect(() => {
    updateValidDates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!executeRecaptcha) {
      alert('reCAPTCHA is not initialized');
      setIsLoading(false);
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha('submit_form');
      console.log('Generated reCAPTCHA Token:', recaptchaToken);

      const formData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        time,
        time2,
        classDate,
        classDate2,
        recaptchaToken,
      };

      console.log('Form Data Sent to Backend:', formData);

      const response = await axios.post(
        'https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment',
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Form submission response:', response.data);
      alert('Form submitted successfully!');
      
      // After successful booking, refresh available dates.
      updateValidDates();
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
