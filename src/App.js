import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AIFormTwo from "./AIFormTwo";
import AIFormOne from './AIFormOne'
import AIFormThree from './AIFormThree'

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AIFormTwo/>}/>
          <Route path="/one" element={<AIFormOne/>}/>
          <Route path="/three" element={<AIFormThree/>} />
        </Routes>
      </BrowserRouter>
    </div>

  );
}

export default App;
