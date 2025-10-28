import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function AIFormOne() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [yourCompany, setYourCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [time, setTime] = useState('');
  const [classDate, setClassDate] = useState(null);
  const [bookedDates, setBookedDates] = useState({});
  const [termsChecked, setTermsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  // --------------------------------------------------
  // Time slot helpers
  // --------------------------------------------------
  const timeSlots = [
    '9am-12pm EST/8am-11pm CST',
    '2pm-5pm EST/1pm-4pm CST',
    '10am-1pm EST/9am-12pm CST', // Friday-only
  ];
  const formatKey = (d) => moment(d).format('MM/DD/YYYY');
  const isFriday = (d) => moment(d).isoWeekday() === 5;

  const slotsForDate = (d) => {
    if (!d) return [];
    const fri = isFriday(d);
    return timeSlots.filter((s) =>
      s === '10am-1pm EST/9am-12pm CST' ? fri : !fri
    );
  };

  const getBookedForDate = (d) => {
    if (!d) return [];
    return bookedDates?.[formatKey(d)] ?? [];
  };
  const getRawBookedCount = (d) => getBookedForDate(d).length;

  const getDisabledTimes = (d) => {
    const booked = new Set(getBookedForDate(d));
    return slotsForDate(d).filter((s) => booked.has(s));
  };

  const getAvailableTimeSlots = (d) => {
    if (!d) return [];
    const applicable = slotsForDate(d);
    const disabled = new Set(getDisabledTimes(d));
    return applicable.filter((s) => !disabled.has(s));
  };

  const isDateDisabled = (date) => {
    if (!date) return false;
    const wd = moment(date).isoWeekday();
    if (wd >= 6) return true; // weekends
    const required = wd === 5 ? 3 : 2;
    const raw = getRawBookedCount(date);
    return raw >= required;
  };

  const getDayClassName = (date) => {
    if (!date) return '';
    const wd = moment(date).isoWeekday();
    if (wd >= 6) return '';
    const required = wd === 5 ? 3 : 2;
    const raw = getRawBookedCount(date);
    if (raw >= required) return 'fully-booked';
    if (raw > 0) return 'partially-booked';
    return '';
  };

  // --------------------------------------------------
  // Fetch and cache booked dates
  // --------------------------------------------------
  const refreshBooked = useCallback(async () => {
    try {
      const res = await axios.get('https://ai-schedular-backend.onrender.com/api/booked-dates');
      const map = (res?.data && typeof res.data === 'object') ? res.data : {};
      setBookedDates(map);
      sessionStorage.setItem('bookedDates', JSON.stringify(map));
    } catch {
      const cached = sessionStorage.getItem('bookedDates');
      if (cached) setBookedDates(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    const bd = sessionStorage.getItem('bookedDates');
    if (bd) setBookedDates(JSON.parse(bd));
    refreshBooked();
  }, [refreshBooked]);

  // --------------------------------------------------
  // Form submit
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!executeRecaptcha) {
      setTimeout(() => handleSubmit(e), 500);
      return;
    }

    try {
      const recaptchaToken = await executeRecaptcha('submit_form');
      const key1 = classDate ? formatKey(classDate) : null;

      const availability = await axios.post(
        'https://ai-schedular-backend.onrender.com/api/check-availability',
        { classDate: key1, time }
      );

      if (!availability.data.available) {
        setErrorMessage(`❌ Date **${key1}** and Time **${time}** are already booked.`);
        setIsLoading(false);
        return;
      }

      const payload = {
        firstName,
        lastName,
        email,
        yourCompany,
        phoneNumber,
        time,
        classDate: classDate ? moment(classDate).format('YYYY-MM-DD') : null,
        recaptchaToken,
      };

      await axios.post(
        'https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment',
        payload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      sessionStorage.removeItem('bookedDates');
      refreshBooked();
      setIsSubmitted(true);
      window.top.location.href = 'https://ka.kableacademy.com/techcred-registration-thank-you';
    } catch {
      setErrorMessage('❌ An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // JSX
  // --------------------------------------------------
  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_SITE_KEY}>
      {isLoading ? (
        <div className="loading-screen" style={{ textAlign: 'center', padding: 50 }}>
          <p>Loading, please wait...</p>
        </div>
      ) : isSubmitted ? (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: 24,
          }}
        >
          Thank you! Redirecting...
        </div>
      ) : (
        <div className="App py-3" id="my-react-form">
          <div className="container">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-6">
                <label className="form-label">First Name</label>
                <input
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">Company Name</label>
                <input
                  className="form-control"
                  value={yourCompany}
                  onChange={(e) => setYourCompany(e.target.value)}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Date and time picker */}
              <div className="col-md-6">
                <label className="form-label date-picker">Class Date</label>
                <DatePicker
                  selected={classDate}
                  onChange={(d) => setClassDate(d)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(d) => !isDateDisabled(d)}
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Program Time</label>
                <select
                  className="form-select"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                >
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate).map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={getDisabledTimes(classDate).includes(slot)}
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    required
                  />
                  <label className="form-check-label">
                    By providing your contact information and checking the box, you agree that
                    Kable Academy may contact you...{' '}
                    <a href="https://kableacademy.com/private-policy/">Privacy Policy.</a>
                  </label>
                </div>
              </div>

              <div className="col-12">
                {errorMessage && (
                  <div
                    className="alert alert-danger"
                    style={{
                      marginTop: 10,
                      whiteSpace: 'pre-line',
                      fontWeight: 'bold',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}
                <button type="submit" className="btn">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GoogleReCaptchaProvider>
  );
}

export default AIFormOne;
