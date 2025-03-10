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
  const [bookedDates, setBookedDates] = useState({});


  // Utility: Get next weekday (Monday-Friday) from a given moment date.
  function getNextWeekday(date) {
    let nextDate = date.clone();
    while (nextDate.isoWeekday() > 5) { // 6 = Saturday, 7 = Sunday
      nextDate.add(1, "day");
    }
    return nextDate;
  }


  async function updateValidDates() {
    try {
      const response = await axios.get("https://ai-schedular-backend.onrender.com/api/booked-dates");
      const fullyBookedDates = response.data;

      console.log("✅ Received booked dates from backend:", fullyBookedDates); // Debugging

      let dates = [];
      let startDate = moment().add(2, "days"); // Start from 2 days ahead

      // Generate 7 valid dates, skipping fully booked ones
      while (dates.length < 7) {
        let formattedDate = startDate.format("MM/DD/YYYY");

        if (!(fullyBookedDates[formattedDate] && fullyBookedDates[formattedDate].length >= timeSlots.length)) {
          dates.push(formattedDate);
        }

        // Move to the next weekday (Monday-Friday only)
        startDate = getNextWeekday(startDate.clone().add(1, "day"));
      }

      setValidDates(dates);
      setBookedDates(fullyBookedDates);

    } catch (error) {
      console.error("❌ Error updating valid dates:", error);
    }
  }




  // Generate an initial list of 7 valid dates (weekdays only) starting from today + 2 days.
  function getInitialValidDates() {
    const startDate = moment().add(2, "days");
    let nextValidDate = getNextWeekday(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(nextValidDate.format("MM/DD/YYYY"));
      nextValidDate = getNextWeekday(nextValidDate.clone().add(1, "day"));
    }
    return dates;
  }

  // Fetch fully booked dates and update valid dates accordingly.
  async function updateValidDates() {
    try {
      const response = await axios.get("https://ai-schedular-backend.onrender.com/api/booked-dates");
      const fullyBookedDates = response.data; // Expected format: { "MM/DD/YYYY": ["9am-12pm EST", "2pm-5pm EST"] }

      console.log("✅ Received booked dates from backend:", fullyBookedDates);

      let dates = getInitialValidDates();

      // Ensure only FULLY booked dates are removed (all time slots taken)
      dates = dates.filter(date => !(fullyBookedDates[date] && fullyBookedDates[date].length >= timeSlots.length));

      setValidDates(dates);
      setBookedDates(fullyBookedDates); // ✅ Store booked dates & times

    } catch (error) {
      console.error("❌ Error updating valid dates:", error);
    }
  }



  useEffect(() => {
    updateValidDates();
    console.log("📌 Booked Dates State:", bookedDates);  // ✅ Debugging Log
  }, []);


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

    // 🚨 Prevent submission if both classDate & time are the same for both slots
    if (classDate === classDate2 && time === time2) {
      setErrorMessage(`❌ You selected the same date (${classDate}) and time (${time}) for both slots. Please choose a different one.`);
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Step 1: Check availability for both date/time selections
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

      // ✅ Step 2: Proceed with form submission if dates & times are available
      const recaptchaToken = await executeRecaptcha("submit_form");
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
        "https://ai-schedular-backend.onrender.com/api/intro-to-ai-payment",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      updateValidDates();

      // ✅ Redirect to thank-you page
      window.top.location.href = "https://ka.kableacademy.com/intro-to-ai-bulk-tech-cred-scheduler-thank-you";

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
              <div className="col-6">
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

              <div className="col-6">
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
                    <option key={index} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputDate2" className="form-label">Class Date 2</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputDate2"
                  value={classDate2}
                  onChange={(e) => setClassDate2(e.target.value)}
                  required
                >
                  <option value="">Please select a date</option>
                  {validDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputDate2" className="form-label">Class Date 2</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputDate2"
                  value={classDate2}
                  onChange={(e) => setClassDate2(e.target.value)}
                  required
                >
                  <option value="">Please select a date</option>
                  {validDates.map((date, index) => (
                    <option key={index} value={moment(date).format("MM/DD/YYYY")}
                      disabled={bookedDates[date] && bookedDates[date].length >= timeSlots.length}>
                      {moment(date).format("MM/DD/YYYY")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="inputDate2" className="form-label">Class Date 2</label>
                <select
                  className="form-select form-select mb-3"
                  id="inputDate2"
                  value={classDate2}
                  onChange={(e) => setClassDate2(e.target.value)}
                  required
                >
                  <option value="">Please select a date</option>
                  {validDates.map((date, index) => (
                    <option
                      key={index}
                      value={moment(date).format("MM/DD/YYYY")}
                      disabled={bookedDates[date] && bookedDates[date].length >= timeSlots.length}
                    >
                      {moment(date).format("MM/DD/YYYY")}
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

export default App;
