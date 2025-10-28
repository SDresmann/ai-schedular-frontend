import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function AIFormThree() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [yourCompany, setYourCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [time, setTime] = useState('');
  const [time2, setTime2] = useState('');
  const [time3, setTime3] = useState('');
  const [classDate, setClassDate] = useState(null);
  const [classDate2, setClassDate2] = useState(null);
  const [classDate3, setClassDate3] = useState(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookedDates, setBookedDates] = useState({});
  const [datesLoading, setDatesLoading] = useState(true);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // --- Helpers ---
  const formatKey = (d) => moment(d).format("MM/DD/YYYY");
  const isFri = (d) => moment(d).isoWeekday() === 5;

  // Utility: Get next weekday (Monday-Friday) from a given moment date.
  function getNextWeekday(date) {
    let nextDate = date.clone();
    while (nextDate.isoWeekday() > 5) { // 6 = Saturday, 7 = Sunday
      nextDate.add(1, "day");
    }
    return nextDate;
  }

  // List of available time slots
  const timeSlots = [
    "9am-12pm EST/8am-11pm CST",
    "2pm-5pm EST/1pm-4pm CST",
    "10am-1pm EST/9am-12pm CST" // Friday-only slot
  ];

  // Get booked times for a selected date (safe)
  const getDisabledTimes = (selectedDate) => {
    if (!selectedDate) return [];
    const key = formatKey(selectedDate);
    return bookedDates?.[key] ?? [];
  };

  // Available slots for the given day (respect Friday-only third slot)
  const getAvailableTimeSlots = (selectedDate) => {
    if (!selectedDate) return [];
    const friday = isFri(selectedDate);
    const available = timeSlots.filter(slot => {
      if (slot === "10am-1pm EST/9am-12pm CST") {
        return friday; // only on Fridays
      }
      return !friday; // the other two only on non-Fridays
    });
    const disabled = new Set(getDisabledTimes(selectedDate));
    return available.filter(slot => !disabled.has(slot));
  };

  // Disable date ONLY if all required slots are booked (2 on non-Fri, 3 on Fri)
  const isDateDisabled = (date) => {
    if (!date) return false;
    const weekend = moment(date).isoWeekday() >= 6;
    if (weekend) return true;

    const key = formatKey(date);
    const bookedCount = (bookedDates?.[key] ?? []).length;
    const requiredSlots = isFri(date) ? 3 : 2;
    const fullyBooked = bookedCount >= requiredSlots;
    return fullyBooked;
  };

  // Day class (for grey block) when any bookings exist (optional styling cue)
  const getDayClassName = (date) => {
    const key = formatKey(date);
    if (bookedDates?.[key]?.length > 0) return "booked-date";
    return "";
  };

  // Generate an initial list of 7 valid dates (weekdays only) starting from today + 2 days.
  const getInitialValidDates = useCallback(() => {
    const startDate = moment().add(2, "days");
    let nextValidDate = getNextWeekday(startDate);
    const dates = [];

    for (let i = 0; i < 7; i++) {
      dates.push(nextValidDate.format("MM/DD/YYYY"));
      nextValidDate = getNextWeekday(nextValidDate.clone().add(1, "day"));
    }
    return dates;
  }, []);

  // Fetch booked-times map and derive the next 7 valid dates (not fully booked)
  const updateValidDates = useCallback(async () => {
    try {
      const response = await axios.get("https://ai-schedular-backend.onrender.com/api/booked-dates");
      const bookedMap = response.data; // { "MM/DD/YYYY": ["slot1","slot2",...] }

      const newValidDates = [];
      let cursor = moment().add(2, "days");

      while (newValidDates.length < 7) {
        const key = cursor.format("MM/DD/YYYY");
        const requiredSlots = cursor.isoWeekday() === 5 ? 3 : 2;
        const count = (bookedMap?.[key] ?? []).length;
        const fullyBooked = count >= requiredSlots;

        if (!fullyBooked && cursor.isoWeekday() <= 5) {
          newValidDates.push(key);
        }
        cursor = getNextWeekday(cursor.clone().add(1, "day"));
      }

      setValidDates(newValidDates);
      setBookedDates(bookedMap);

      sessionStorage.setItem("validDates", JSON.stringify(newValidDates));
      sessionStorage.setItem("bookedDates", JSON.stringify(bookedMap));

      setDatesLoading(false);
      console.log("📌 Fetched & updated latest valid dates");
    } catch (err) {
      console.error("❌ Error fetching dates:", err);
      setDatesLoading(false);
    }
  }, []);

  useEffect(() => {
    const placeholderDates = getInitialValidDates();
    setValidDates(placeholderDates); // fast placeholder

    // Load cached if exists
    const cachedDates = sessionStorage.getItem("validDates");
    const cachedBookedDates = sessionStorage.getItem("bookedDates");
    if (cachedDates && cachedBookedDates) {
      setValidDates(JSON.parse(cachedDates));
      setBookedDates(JSON.parse(cachedBookedDates));
      setDatesLoading(false);
      console.log("✅ Loaded cached valid & booked dates");
    }

    // Always fetch fresh
    updateValidDates();
  }, [getInitialValidDates, updateValidDates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Ensure recaptcha is ready
    if (!executeRecaptcha) {
      console.warn("⚠️ reCAPTCHA not ready yet, retrying in 500ms...");
      setTimeout(() => handleSubmit(e), 500);
      return;
    }

    try {
      // Run reCAPTCHA
      const recaptchaToken = await executeRecaptcha("submit_form");

      // Prepare date keys for availability (MM/DD/YYYY) and ISO for submission (YYYY-MM-DD)
      const classDateKey1 = classDate ? formatKey(classDate) : null;
      const classDateKey2 = classDate2 ? formatKey(classDate2) : null;
      const classDateKey3 = classDate3 ? formatKey(classDate3) : null;

      const isoDate1 = classDate ? moment(classDate).format("YYYY-MM-DD") : null;
      const isoDate2 = classDate2 ? moment(classDate2).format("YYYY-MM-DD") : null;
      const isoDate3 = classDate3 ? moment(classDate3).format("YYYY-MM-DD") : null;

      // Check availability per (date,time) using MM/DD/YYYY to match backend Booking keys
      const [availabilityResponse1, availabilityResponse2, availabilityResponse3] = await Promise.all([
        axios.post("https://ai-schedular-backend.onrender.com/api/check-availability", {
          classDate: classDateKey1,
          time,
        }),
        axios.post("https://ai-schedular-backend.onrender.com/api/check-availability", {
          classDate: classDateKey2,
          time: time2,
        }),
        axios.post("https://ai-schedular-backend.onrender.com/api/check-availability", {
          classDate: classDateKey3,
          time: time3,
        }),
      ]);

      const errors = [];
      if (!availabilityResponse1.data.available) {
        errors.push(`❌ Date **${classDateKey1}** and Time **${time}** are already booked.`);
      }
      if (!availabilityResponse2.data.available) {
        errors.push(`❌ Date **${classDateKey2}** and Time **${time2}** are already booked.`);
      }
      if (!availabilityResponse3.data.available) {
        errors.push(`❌ Date **${classDateKey3}** and Time **${time3}** are already booked.`);
      }
      if (errors.length) {
        setErrorMessage(errors.join("\n"));
        setIsLoading(false);
        return;
      }

      // Submit form: send ISO dates so backend's HubSpot conversion (YYYY-MM-DD) works cleanly
      const formData = {
        firstName,
        lastName,
        email,
        yourCompany,
        phoneNumber,
        time,
        time2,
        time3,
        classDate: isoDate1,
        classDate2: isoDate2,
        classDate3: isoDate3,
        recaptchaToken,
      };

      await axios.post(
        "https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      // Clear cached dates & refresh
      sessionStorage.removeItem("validDates");
      sessionStorage.removeItem("bookedDates");
      updateValidDates();

      // Redirect
      setIsSubmitted(true);
      window.top.location.href = "https://ka.kableacademy.com/techcred-registration-thank-you";
    } catch (error) {
      console.error("Error during form submission:", error);
      setErrorMessage("❌ An error occurred. Please try again.");
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
              <div className="col-6">
                <label htmlFor="inputName" className="form-label">First Name</label>
                <input type="text" className="form-control" id="inputName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>

              <div className="col-6">
                <label htmlFor="inputLast" className="form-label">Last Name</label>
                <input type="text" className="form-control" id="inputLast" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>

              <div className="col-6">
                <label htmlFor="inputCompany" className="form-label">Company Name</label>
                <input type="text" className="form-control" id="inputCompnay" value={yourCompany} onChange={(e) => setYourCompany(e.target.value)} required />
              </div>

              <div className="col-6">
                <label htmlFor="inputPhone" className="form-label">Phone Number</label>
                <input type="text" className="form-control" id="inputPhone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>

              <div className="col-12">
                <label htmlFor="inputEmail" className="form-label">Email</label>
                <input type="email" className="form-control" id="inputEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {/* ✅ Class Date 1 - Calendar Picker */}
              <div className="col-md-6">
                <label htmlFor="inputDate" className="form-label date-picker">Class Date 1</label>
                <DatePicker
                  selected={classDate}
                  onChange={(date) => setClassDate(date)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(date) => !isDateDisabled(date)}
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="inputTime" className="form-label">Program Time 1</label>
                <select className="form-select form-select mb-3" id="inputTime" value={time} onChange={(e) => setTime(e.target.value)} required>
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate).map((slot, index) => (
                    <option key={index} value={slot} disabled={getDisabledTimes(classDate).includes(slot)}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Class Date 2 - Calendar Picker */}
              <div className="col-md-6">
                <label htmlFor="inputDate2" className="form-label date-picker">Class Date 2</label>
                <DatePicker
                  selected={classDate2}
                  onChange={(date) => setClassDate2(date)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(date) => !isDateDisabled(date)}
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="inputTime2" className="form-label">Program Time 2</label>
                <select className="form-select form-select mb-3" id="inputTime2" value={time2} onChange={(e) => setTime2(e.target.value)} required>
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate2).map((slot, index) => (
                    <option key={index} value={slot} disabled={getDisabledTimes(classDate2).includes(slot)}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Class Date 3 - Calendar Picker */}
              <div className="col-md-6">
                <label htmlFor="inputDate3" className="form-label date-picker">Class Date 3</label>
                <DatePicker
                  selected={classDate3}
                  onChange={(date) => setClassDate3(date)}
                  dateFormat="MM/dd/yyyy"
                  filterDate={(date) => !isDateDisabled(date)}
                  dayClassName={getDayClassName}
                  className="form-control"
                  placeholderText="Select a date"
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="inputTime3" className="form-label">Program Time 3</label>
                <select className="form-select form-select mb-3" id="inputTime3" value={time3} onChange={(e) => setTime3(e.target.value)} required>
                  <option value="">Select a time</option>
                  {getAvailableTimeSlots(classDate3).map((slot, index) => (
                    <option key={index} value={slot} disabled={getDisabledTimes(classDate3).includes(slot)}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="gridCheck" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} required />
                  <label className="form-check-label" htmlFor="gridCheck">
                    By providing your contact information and checking the box, you agree that Kable Academy may contact you about our relevant content, products, and services via email, phone and SMS communications. SMS can be used for reminders. SMS can be used for updates. View our
                    <a href='https://kableacademy.com/private-policy/'> Privacy Policy.</a>
                  </label>
                </div>
              </div>

              <div className="col-12">
                {errorMessage && (
                  <div className="alert alert-danger" style={{
                    marginTop: "10px",
                    whiteSpace: "pre-line",
                    fontWeight: "bold",
                    padding: "10px",
                    border: "2px solid red",
                    backgroundColor: "#ffe6e6",
                    color: "red"
                  }}>
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

export default AIFormThree;
