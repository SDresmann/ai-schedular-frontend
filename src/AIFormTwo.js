import React, { useEffect, useState,useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function AIFormTwo() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [yourCompany, setYourCompany] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [time, setTime] = useState('');
  const [time2, setTime2] = useState('');
  const [classDate, setClassDate] = useState('');
  const [classDate2, setClassDate2] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [validDates, setValidDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookedDates, setBookedDates] = useState({});
  const [datesLoading, setDatesLoading] = useState(true);
  const { executeRecaptcha } = useGoogleReCaptcha();


  // Utility: Get next weekday (Monday-Friday) from a given moment date.
  function getNextWeekday(date) {
    let nextDate = date.clone();
    while (nextDate.isoWeekday() > 5) { // 6 = Saturday, 7 = Sunday
      nextDate.add(1, "day");
    }
    return nextDate;
  }

  const getAvailableTimeSlots = (selectedDate) => {
    if (!selectedDate) return [];
  
    const isFriday = moment(selectedDate, "MM/DD/YYYY").isoWeekday() === 5; // 5 = Friday
  
    return timeSlots.filter(slot => {
      if (slot === "10am-1pm EST/9am-12pm CST") {
        return isFriday; // Show this slot ONLY on Fridays
      }
      return !isFriday; // Hide it on other days
    }).filter(slot => !getDisabledTimes(selectedDate).includes(slot));
  };

  const isDateDisabled = (date) => {
    if (!bookedDates || typeof bookedDates !== "object") return false; // Ensure bookedDates is valid
  
    const formattedDate = moment(date).format("MM/DD/YYYY");
  
    // Check if the date is fully booked
    const isFullyBooked = Object.keys(bookedDates).includes(formattedDate);
  
    // Check if the date falls on a weekend (Saturday = 6, Sunday = 7)
    const isWeekend = moment(date).isoWeekday() >= 6;
  
    return isFullyBooked || isWeekend;
  };
  
  // ✅ Function to add a grey block around booked dates
  const getDayClassName = (date) => {
    const formattedDate = moment(date).format("MM/DD/YYYY");
  
    if (Object.keys(bookedDates).includes(formattedDate)) {
      return "booked-date"; // Add a class for booked dates
    }
    return "";
  };
  
  

// async function updateValidDates() {
//   try {
//     // Check if cached dates exist
//     const cachedDates = sessionStorage.getItem("validDates");
//     if (cachedDates) {
//       setValidDates(JSON.parse(cachedDates));
//       console.log("✅ Loaded dates from cache");
//       return;
//     }

//     const response = await axios.get("https://ai-schedular-backend.onrender.com/api/booked-dates");
//     const fullyBookedDates = response.data;

//     let dates = [];
//     let startDate = moment().add(2, "days");

//     while (dates.length < 7) {
//       let formattedDate = startDate.format("MM/DD/YYYY");
//       if (!(fullyBookedDates[formattedDate] && fullyBookedDates[formattedDate].length >= timeSlots.length)) {
//         dates.push(formattedDate);
//       }
//       startDate = getNextWeekday(startDate.clone().add(1, "day"));
//     }

//     setValidDates(dates);
//     setBookedDates(fullyBookedDates);

//     // Store in session storage to speed up reloads
//     sessionStorage.setItem("validDates", JSON.stringify(dates));

//     console.log("✅ Fetched and cached valid dates:", dates);
//   } catch (error) {
//     console.error("❌ Error updating valid dates:", error);
//   }
// }

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
  }, []); // ✅ Empty dependency array makes it stable
  

  // Fetch fully booked dates and update valid dates accordingly.
  const updateValidDates = useCallback(async () => {
    try {
      setDatesLoading(true);
  
      // 🔹 Check if cached dates exist
      const cachedDates = sessionStorage.getItem("validDates");
      const cachedBookedDates = sessionStorage.getItem("bookedDates");
  
      if (cachedDates && cachedBookedDates) {
        setValidDates(JSON.parse(cachedDates));
        setBookedDates(JSON.parse(cachedBookedDates));
        console.log("✅ Loaded dates from cache");
        setDatesLoading(false);
        return;
      }
  
      // 🔹 Fetch latest booked dates from backend
      const response = await axios.get("https://ai-schedular-backend.onrender.com/api/booked-dates");
      const fullyBookedDates = response.data;
  
      console.log("✅ Received booked dates from backend:", fullyBookedDates);
  
      setBookedDates(fullyBookedDates); // ✅ Store in state properly
      let dates = [];
      let startDate = moment().add(2, "days");
  
      while (dates.length < 7) {
        let formattedDate = startDate.format("MM/DD/YYYY");
  
        // 🔹 Check if it's a Friday
        const isFriday = startDate.isoWeekday() === 5;
  
        // 🔹 Determine how many time slots should be available
        let requiredSlots = isFriday ? 3 : 2;
  
        // ❌ Skip fully booked dates
        if (!(fullyBookedDates[formattedDate] && fullyBookedDates[formattedDate].length >= requiredSlots)) {
          dates.push(formattedDate);
        }
  
        // Move to the next weekday (Monday-Friday only)
        startDate = getNextWeekday(startDate.clone().add(1, "day"));
      }
  
      console.log("📌 Final valid dates list:", dates);
  
      // ✅ Cache available dates
      sessionStorage.setItem("validDates", JSON.stringify(dates));
      sessionStorage.setItem("bookedDates", JSON.stringify(fullyBookedDates));
  
      // ✅ Update state
      setValidDates([...dates]);
      setBookedDates({...fullyBookedDates});
    } catch (error) {
      console.error("❌ Error updating valid dates:", error);
    } finally {
      setDatesLoading(false);
    }
  }, []); // ✅ Empty dependency array ensures function remains stable
  
  

useEffect(() => {
  // Set placeholder dates while fetching from backend
  const placeholderDates = getInitialValidDates();
  setValidDates(placeholderDates);

  // Fetch actual booked dates from the backend
  updateValidDates();
}, [getInitialValidDates, updateValidDates]);

  // List of available time slots
  const timeSlots = [
    "9am-12pm EST/8am-11pm CST",
    "2pm-5pm EST/1pm-4pm CST",
    "10am-1pm EST/9am-12pm CST"
  ];

  // Get booked times for a selected date
  const getDisabledTimes = (selectedDate) => {
    return bookedDates[selectedDate] ? bookedDates[selectedDate] : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
  
    if (!executeRecaptcha) {
      alert("reCAPTCHA is not initialized");
      setIsLoading(false);
      return;
    }
  
    try {
      // ✅ Check availability
      const [availabilityResponse1, availabilityResponse2] = await Promise.all([
        axios.post("https://ai-schedular-backend.onrender.com/api/check-availability", { classDate, time }),
        axios.post("https://ai-schedular-backend.onrender.com/api/check-availability", { classDate: classDate2, time: time2 })
      ]);
  
      let errorMessages = [];
  
      if (!availabilityResponse1.data.available) {
        errorMessages.push(`❌ Date **${classDate}** and Time **${time}** are already booked.`);
      }
      if (!availabilityResponse2.data.available) {
        errorMessages.push(`❌ Date **${classDate2}** and Time **${time2}** are already booked.`);
      }
  
      if (errorMessages.length > 0) {
        setErrorMessage(errorMessages.join("\n"));
        setIsLoading(false);
        return;
      }
  
      // ✅ Submit form data
      const recaptchaToken = await executeRecaptcha("submit_form");
      const formData = {
        firstName,
        lastName,
        email,
        yourCompany,
        phoneNumber,
        time,
        time2,
        classDate,
        classDate2,
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
  
      // 🔥 Clear cached dates after booking
      sessionStorage.removeItem("validDates");
      sessionStorage.removeItem("bookedDates");
  
      // 🔄 Refresh dates after submission
      updateValidDates();
  
      // ✅ Redirect to thank-you page
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
            <label htmlFor="inputDate" className="form-label">Class Date 1</label>
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
            <label htmlFor="inputDate2" className="form-label">Class Date 2</label>
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

export default AIFormTwo;
