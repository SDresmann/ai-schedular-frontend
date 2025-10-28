import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function AIFormTwo() {
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [email, setEmail]             = useState('');
  const [yourCompany, setYourCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [time, setTime]   = useState('');
  const [time2, setTime2] = useState('');

  const [classDate, setClassDate]   = useState(null); // Date objects
  const [classDate2, setClassDate2] = useState(null);

  const [bookedDates, setBookedDates]   = useState({});
  const [termsChecked, setTermsChecked] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { executeRecaptcha }            = useGoogleReCaptcha();

  // --------------------------------------------------
  // Constants & helpers
  // --------------------------------------------------
  const timeSlots = [
    '9am-12pm EST/8am-11pm CST',
    '2pm-5pm EST/1pm-4pm CST',
    '10am-1pm EST/9am-12pm CST', // Friday-only
  ];
  const formatKey = (d) => moment(d).format('MM/DD/YYYY');
  const isFriday  = (d) => moment(d).isoWeekday() === 5;

  function getNextWeekday(date) {
    let nextDate = date.clone();
    while (nextDate.isoWeekday() > 5) nextDate.add(1, 'day');
    return nextDate;
  }

  // Which slots are offered on this date? (Fri has 3, others 2)
  const slotsForDate = (d) => {
    if (!d) return [];
    const fri = isFriday(d);
    return timeSlots.filter((s) =>
      s === '10am-1pm EST/9am-12pm CST' ? fri : !fri
    );
  };

  // Raw booked slots (from backend) for this date key
  const getBookedForDate = (d) => {
    if (!d) return [];
    const key = formatKey(d);
    return bookedDates?.[key] ?? [];
  };

  // Raw count used to decide if the whole day is full (no string-matching needed)
  const getRawBookedCount = (d) => getBookedForDate(d).length;

  // Dropdown disables only the applicable slots that are booked (intersection)
  const getDisabledTimes = (d) => {
    const booked = new Set(getBookedForDate(d));
    return slotsForDate(d).filter((s) => booked.has(s));
  };

  // Time options shown for a specific date (hide Friday-only slot on other days)
  const getAvailableTimeSlots = (d) => {
    if (!d) return [];
    const applicable = slotsForDate(d);
    const disabledSet = new Set(getDisabledTimes(d));
    return applicable.filter((slot) => !disabledSet.has(slot));
  };

  // The ONLY thing that disables a DAY: raw count vs required
  const isDateDisabled = (date) => {
    if (!date) return false;
    const wd = moment(date).isoWeekday();
    if (wd >= 6) return true; // weekends

    const required = wd === 5 ? 3 : 2; // Fri=3, others=2
    const rawCount = getRawBookedCount(date);

    // Debug each visible day when the calendar is opened
    console.log('[FILTER]', formatKey(date), { rawCount, required, wd });

    return rawCount >= required;
  };

  // Visual classes (purely cosmetic; do NOT block clicks)
  const getDayClassName = (date) => {
    if (!date) return '';
    const wd       = moment(date).isoWeekday();
    if (wd >= 6) return '';

    const required = wd === 5 ? 3 : 2;
    const rawCount = getRawBookedCount(date);
    if (rawCount >= required) return 'fully-booked';
    if (rawCount > 0)         return 'partially-booked';
    return '';
  };

  // --------------------------------------------------
  // Fetch booked map and cache
  // --------------------------------------------------
  const updateValidDates = useCallback(async () => {
    try {
      const res = await axios.get('https://ai-schedular-backend.onrender.com/api/booked-dates');
      const map = (res?.data && typeof res.data === 'object') ? res.data : {};
      console.log('[FETCH]/api/booked-dates =>', map);

      setBookedDates(map);
      sessionStorage.setItem('bookedDates', JSON.stringify(map));

      // Optional: compute preview list of next 7 selectable weekdays (not required for UI)
      const preview = [];
      let cursor = moment().add(2, 'days');
      let guard = 0;
      while (preview.length < 7 && guard < 60) {
        // skip weekends
        while (cursor.isoWeekday() > 5) cursor = cursor.clone().add(1, 'day');
        const key = cursor.format('MM/DD/YYYY');
        const req = cursor.isoWeekday() === 5 ? 3 : 2;
        const cnt = (map[key] ?? []).length;
        console.log('[VALIDATE]', key, { cnt, required: req, weekday: cursor.isoWeekday() });
        if (cnt < req) preview.push(key);
        cursor = cursor.clone().add(1, 'day');
        guard++;
      }
      console.log('[PREVIEW next 7]', preview);
    } catch (err) {
      console.error('❌ Error fetching /api/booked-dates:', err);
      const cachedBooked = sessionStorage.getItem('bookedDates');
      if (cachedBooked) setBookedDates(JSON.parse(cachedBooked));
    }
  }, []);

  useEffect(() => {
    // Load any cached map first for snappy UI, then refresh
    const bd = sessionStorage.getItem('bookedDates');
    if (bd) setBookedDates(JSON.parse(bd));
    updateValidDates();
  }, [updateValidDates]);

  // --------------------------------------------------
  // Submit
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

      // Availability check: send MM/DD/YYYY (DB key)
      const key1 = classDate  ? formatKey(classDate)  : null;
      const key2 = classDate2 ? formatKey(classDate2) : null;

      const [a1, a2] = await Promise.all([
        axios.post('https://ai-schedular-backend.onrender.com/api/check-availability', { classDate: key1, time }),
        axios.post('https://ai-schedular-backend.onrender.com/api/check-availability', { classDate: key2, time: time2 }),
      ]);

      const errs = [];
      if (!a1.data.available) errs.push(`❌ Date **${key1}** and Time **${time}** are already booked.`);
      if (!a2.data.available) errs.push(`❌ Date **${key2}** and Time **${time2}** are already booked.`);
      if (errs.length) {
        setErrorMessage(errs.join('\n'));
        setIsLoading(false);
        return;
      }

      // Final submission: send YYYY-MM-DD (backend converts for HubSpot & Mongo)
      const payload = {
        firstName, lastName, email, yourCompany, phoneNumber,
        time, time2,
        classDate:  classDate  ? moment(classDate).format('YYYY-MM-DD')  : null,
        classDate2: classDate2 ? moment(classDate2).format('YYYY-MM-DD') : null,
        recaptchaToken,
      };

      await axios.post('https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment', payload, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      // Clear cache and refresh availability
      sessionStorage.removeItem('bookedDates');
      updateValidDates();

      setIsSubmitted(true);
      window.top.location.href = 'https://ka.kableacademy.com/techcred-registration-thank-you';
    } catch (err) {
      console.error(err);
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
        <div style={{
          width: '100vw', height: '100vh', backgroundColor: 'black',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'white', fontSize: 24
        }}>
          Thank you! Redirecting...
        </div>
      ) : (
        <div className="App py-3" id="my-react-form">
          <div className="container">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-6">
                <label className="form-label">First Name</label>
                <input className="form-control" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input className="form-control" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="form-label">Company Name</label>
                <input className="form-control" value={yourCompany} onChange={(e)=>setYourCompany(e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} required />
              </div>
              <div className="col-12">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              </div>

              <div className="col-md-6">
                <label className="form-label date-picker">Class Date 1</label>
                <DatePicker
                  selected={classDate}
                  onChange={(d)=>setClassDate(d)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(d)=>!isDateDisabled(d)}   // IMPORTANT: negate to disable
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Program Time 1</label>
                <select className="form-select" value={time} onChange={(e)=>setTime(e.target.value)} required>
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate).map((s)=>(
                    <option key={s} value={s} disabled={getDisabledTimes(classDate).includes(s)}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label date-picker">Class Date 2</label>
                <DatePicker
                  selected={classDate2}
                  onChange={(d)=>setClassDate2(d)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(d)=>!isDateDisabled(d)}
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Program Time 2</label>
                <select className="form-select" value={time2} onChange={(e)=>setTime2(e.target.value)} required>
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate2).map((s)=>(
                    <option key={s} value={s} disabled={getDisabledTimes(classDate2).includes(s)}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" checked={termsChecked} onChange={(e)=>setTermsChecked(e.target.checked)} required />
                  <label className="form-check-label">
                    By providing your contact information and checking the box, you agree that Kable Academy may contact you...
                    <a href="https://kableacademy.com/private-policy/"> Privacy Policy.</a>
                  </label>
                </div>
              </div>

              <div className="col-12">
                {errorMessage && (
                  <div className="alert alert-danger" style={{ marginTop: 10, whiteSpace: 'pre-line', fontWeight: 'bold' }}>
                    {errorMessage}
                  </div>
                )}
                <button type="submit" className="btn">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GoogleReCaptchaProvider>
  );
}

export default AIFormTwo;
