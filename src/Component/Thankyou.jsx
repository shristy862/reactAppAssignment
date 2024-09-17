import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style.css';
const ThankYou = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to SurveyForm after 5 seconds
    const timer = setTimeout(() => {
      navigate('/survey');
    }, 5000);

    // Cleanup the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="thank-you-page">
      <h1>Thank you for completing the survey!</h1>
      <p>You will be redirected back to the survey page in 5 seconds...</p>
    </div>
  );
};

export default ThankYou;
