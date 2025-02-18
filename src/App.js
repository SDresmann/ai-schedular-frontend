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
  if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => registration.unregister());
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

      console.log("Raw Times:", { time, time2, time3 });

      const fixProgramTime = (time) => {
        const validTimes = {
          "10am-1pm EST/9am-12pm CST": "10am-1pm EST/9am-12pm CST",
          "2pm-5pm EST/1pm-4pm CST": "2pm-5pm EST/1pm-4pm CST",
          "6pm-9pm EST/5pm-8pm CST": "6pm-9pm EST/5pm-8pm CST",
          "4pm-7pm EST": "4pm-7pm EST",
        };
        return validTimes[time] || null; // Fallback to the original value
      };
      console.log("Fixed Times:", {
        program_session: fixProgramTime(time),
        program_time_2: fixProgramTime(time2),
        program_time_3: fixProgramTime(time3),
      });
      // Ensure dates are converted before sending:
      const formData = {
        firstname: firstName,
        lastname: lastName,
        email,
        phone: phoneNumber, // ✅ Renamed
        program_session: fixProgramTime(time), // Ensure this is in the expected format
        program_time_2: fixProgramTime(time2), // Ensure this is in the expected format
        program_time_3: fixProgramTime(time3), // Ensure this is in the expected format
        intro_to_ai_program_date: classDate ? moment(classDate).format('MM/DD/YYYY') : null, 
        intro_to_ai_date_2: classDate2 ? moment(classDate2).format('MM/DD/YYYY') : null, 
        intro_to_ai_date_3: classDate3 ? moment(classDate3).format('MM/DD/YYYY') : null, 

        zip: postal, // ✅ Renamed
        recaptchaToken,
      };
      console.log("Payload Sent to Backend:", {
        program_session: fixProgramTime(time),
        program_time_2: fixProgramTime(time2),
        program_time_3: fixProgramTime(time3),
      });
        console.log("🚀 Sending Form Data:", formData);
      function convertDateToMidnightISO(date) {
        if (!date) {
          console.warn("⚠️ No date provided for conversion.");
          return null;
        }

        // Attempt to parse the date in both formats
        const parsedDate =
          moment(date, "YYYY/MM/DD", true).isValid() // Strict check for "YYYY/MM/DD"
            ? moment(date, "YYYY/MM/DD", true)
            : moment(date, "MM/DD/YYYY", true); // Fallback to "MM/DD/YYYY"

        if (!parsedDate.isValid()) {
          console.error(`❌ Invalid date format: ${date}. Expected formats: YYYY/MM/DD or MM/DD/YYYY`);
          return null;
        }

        return parsedDate.startOf("day").toISOString(); // Convert to ISO8601 at midnight UTC
      }

      console.log("🚀 Sending Form Data:", formData);


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
              <label htmlFor="inputName" name="firstName" className="form-label">First Name</label>
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
              <label htmlFor="inputLast" name="lastName" className="form-label">Last Name</label>
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
                name='email'
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
                name='phoneNumber'
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
                name="postal" 
                id="inputZip"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="inputTime" className="form-label">Program Time</label>
              <select className="form-select form-select mb-3" name="time" value={time} onChange={(e) => setTime(e.target.value)} required>
                <option value="">Select a time</option>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputTime2" className="form-label">Program Time 2</label>
              <select className="form-select form-select mb-3" name="time2"  value={time2} onChange={(e) => setTime2(e.target.value)} required>
                <option value="">Select a time</option>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="inputTime3" className="form-label">Program Time 3</label>
              <select className="form-select form-select mb-3" name="time3" value={time3} onChange={(e) => setTime3(e.target.value)} required>
                <option value="">Select a time</option>
                <option value="10am-1pm EST/9am-12pm CST">10am-1pm EST</option>
                <option value="2pm-5pm EST/1pm-4pm CST">2pm-5pm EST</option>
                <option value="6pm-9pm EST/5pm-8pm CST">6pm-9pm EST</option>
                <option value="4pm-7pm EST">4pm-7pm EST</option>
              </select>
            </div>

            <div className="col-md-6">
              <label htmlFor="inputDate" className="form-label">Class Date</label>
              <select
                className="form-select form-select mb-3"
                id="inputDate"
                name="classDate"
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
                name="classDate2"
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
                name="classDate3"
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
