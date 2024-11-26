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
  const [classDate, setClassDate] = useState('');
  const [postal, setPostal] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  
  const { executeRecaptcha } = useGoogleReCaptcha(); // For executing reCAPTCHA

  function getNextValidProgramDates() {
    const today = moment();
    const validDates = [];
    let nextValidDate = today.add(2, 'days');

    // Dates to exclude (like holidays or days off)
    const excludedDates = ['10/31/2024']; // Add more dates here in MM/DD/YYYY format

    // Generate valid dates for the next 10 available days (Monday-Thursday)
    for (let i = 0; i < 10; i++) {
      // Skip to the next day if it falls on a Friday, Saturday, Sunday, or an excluded date
      while (nextValidDate.isoWeekday() > 4 || excludedDates.includes(nextValidDate.format('MM/DD/YYYY'))) {
        nextValidDate = nextValidDate.add(1, 'day');
      }
      // Push the valid Monday-Thursday date into the array
      validDates.push(nextValidDate.format('MM/DD/YYYY'));
      // Move to the next day
      nextValidDate = nextValidDate.add(1, 'day');
    }

    return validDates;
  }

  useEffect(() => {
    const dates = getNextValidProgramDates();
    setValidDates(dates);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const recaptchaToken = await executeRecaptcha('submit_form');
    console.log('Generated reCAPTCHA Token:', recaptchaToken);
  
    const formData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      program,
      time,
      classDate,
      postal,
      recaptchaToken,
    };
  
    console.log('Form Data to Send:', formData);
  
    try {
      const response = await axios.post(
        'https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment',
        formData
      );
      console.log('Form submission response:', response.data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY}>
      <div className="App">
        <div className='container'>
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-6">
              <label htmlFor="inputName" className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                id="inputName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
              />
            </div>
            <div className='col-12'>
              <label>Choose the program you are interested in</label>
              <select className="form-select" aria-label="Default select example" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">Choose a Program</option>
                <option value="Intro to AI">Intro to AI</option>
              </select>
            </div>
            <div className="col-md-12">
              <label htmlFor="inputZip" className="form-label">Postal Code</label>
              <input type="text" className="form-control" id="inputZip" value={postal} onChange={(e) => setPostal(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="inputTime" className="form-label">Program Time</label>
              <select className="form-select form-select mb-3" aria-label="Large select example" id='inputTime' value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Select a time</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputDate" className="form-label">Class Date</label>
              <select className="form-select form-select mb-3" aria-label="Large select example" id='inputDate' value={classDate} onChange={(e) => setClassDate(e.target.value)}>
                <option value=''>Please select a date</option>
                {validDates.map((date, index) => (
                  <option key={index} value={moment(date).format('MM/DD/YYYY')}>{moment(date).format('MM/DD/YYYY')}</option>
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
                />
                <label className="form-check-label" htmlFor="gridCheck">
                  By providing your contact information and checking the box, you agree that Kable Academy may contact you about our relevant content, products, and services via email, phone and SMS communications. SMS can be used for reminders. SMS can be used for updates. View our Privacy Policy.*
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
