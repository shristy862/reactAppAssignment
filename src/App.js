import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SurveyWithSwiper from './Component/SurveyForm';
import ThankYou from './Component/Thankyou';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/survey" element={<SurveyWithSwiper />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="*" element={<SurveyWithSwiper />} />
      </Routes>
    </Router>
  );
}

export default App;
