import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Style.css';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; 
import Cookies from 'js-cookie';

const NumberRating = ({ fieldName, value, onChange, max }) => {
  const [hoverValue, setHoverValue] = useState(null);
  const [clickedValue, setClickedValue] = useState(value);

  const getBoxColor = (i) => {
    if (clickedValue !== null) {
      if (i <= clickedValue) {
        if (i <= 3) return 'red';
        if (i <= 6) return 'orange';
        return 'green';
      }
    } else if (hoverValue !== null && i <= hoverValue) {
      if (i <= 3) return 'red';
      if (i <= 6) return 'orange';
      return 'green';
    }
    return '#ddd';
  };

  const handleClick = (i) => {
    if (clickedValue === 0) {
      console.log(`${fieldName} updates to ${i}`);
    } else {
      console.log(`${fieldName} Changed to ${i}`);
    }

    setClickedValue(i);
    onChange(i);
  };

  return (
    <div className="number-rating">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className="rating-box"
          style={{
            backgroundColor: getBoxColor(i + 1),
          }}
          onMouseEnter={() => setHoverValue(i + 1)}
          onMouseLeave={() => setHoverValue(null)}
          onClick={() => handleClick(i + 1)}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

const SurveyWithSwiper = () => {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionField, setNewQuestionField] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('rating');
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const swiperRef = useRef(null);

  const [surveyAnswers, setSurveyAnswers] = useState({
    productSatisfaction: 0,
    priceFairness: 0,
    valueForMoney: 0,
    recommendScore: 0,
    improvementSuggestion: '',
  });

  useEffect(() => {
    fetch('http://localhost:5000/get-questions')
      .then(response => response.json())
      .then(data => {
        setQuestions(data);
      })
      .catch(error => console.error('Error fetching questions:', error));
  
    let userId = Cookies.get('userId');
    if (!userId) {
      userId = uuidv4();
      Cookies.set('userId', userId, { expires: 1 / 1440 });
      console.log(`New user with ID: ${userId}`);
    } else {
      console.log(`Returning user with ID: ${userId}`);
    }
  }, []);

  const handleStartClick = () => {
    setShowWelcome(false);
  };

  const handleRatingChange = (fieldName) => (value) => {
    setSurveyAnswers(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSkipClick = () => {
    swiperRef.current?.slideNext();
  };

  const handleSubmit = () => {
    console.log('Submitting Survey:', surveyAnswers);
  
    const userId = Cookies.get('userId');
    if (!userId) {
      console.error('User ID not found!');
      return;
    }
  
    const submissionData = {
      userId,
      surveyAnswers,
    };
  
    fetch('http://localhost:5000/submit-survey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error submitting survey, status code: ${response.status}`);
        }
        return response.text();
      })
      .then((message) => {
        console.log(message);
        setSurveyAnswers({
          productSatisfaction: 0,
          priceFairness: 0,
          valueForMoney: 0,
          recommendScore: 0,
          improvementSuggestion: '',
        });
        
        // Navigate to the Thank You page
        navigate('/thankyou');
        
        // Set a timeout to redirect back to the survey after 5 seconds
        setTimeout(() => {
          setShowWelcome(true); // Show the welcome screen again
          navigate('/survey'); // Navigate back to the survey page
        }, 5000); // 5 seconds delay
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the survey. Please try again.');
      });
  };  
  
  const handleAddQuestion = async () => {
    if (newQuestionText && newQuestionField) {
      try {
        const response = await fetch('http://localhost:5000/get-questions');
        const questions = await response.json();
        const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) : 0;
        const newOrder = maxOrder + 1;
  
        const newQuestion = {
          text: newQuestionText,
          fieldName: newQuestionField,
          type: newQuestionType,
          order: newOrder,
        };
  
        await fetch('http://localhost:5000/add-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newQuestion),
        });
  
        setQuestions(prev => [...prev, newQuestion]);
      } catch (error) {
        console.error('Error adding question:', error);
      }
    }
  };
  
  const popover = (
    <Popover id="popover-basic">
      <Popover.Body>
        <p>Are you sure? You won't be able to make any changes after submitting.</p>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Yes, Submit
        </button>
      </Popover.Body>
    </Popover>
  );

  const totalSlides = questions.length;

  return (
    <>
      <div className="survey-container">
        {showWelcome ? (
          <div className="welcome-screen">
            <h1>Welcome to Our Survey</h1>
            <p>We're glad you're here! Click the button below to start the survey.</p>
            <button onClick={handleStartClick} className="btn btn-primary">
              Start Survey
            </button>
          </div>
        ) : (
          <>
            <Swiper
              navigation={true}
              modules={[Navigation]}
              className="mySwiper"
              onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex + 1)}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
            >
              {questions.map((question, index) => (
                <SwiperSlide key={index} className="Container">
                  <div className="slide-wrapper">
                    <h3>{question.text}</h3>
                    {question.type === 'rating' ? (
                      <NumberRating
                        fieldName={question.fieldName}
                        max={10}
                        value={surveyAnswers[question.fieldName] || 0}
                        onChange={handleRatingChange(question.fieldName)}
                      />
                    ) : (
                      <textarea
                        placeholder="Your suggestions"
                        value={surveyAnswers[question.fieldName] || ''}
                        onChange={(e) =>
                          setSurveyAnswers(prev => ({
                            ...prev,
                            [question.fieldName]: e.target.value,
                          }))
                        }
                      />
                    )}
  
                    <button className="btn btn-warning skip-button" onClick={handleSkipClick}>
                      Skip
                    </button>
  
                    {index === questions.length - 1 && (
                      <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                        <button className="btn btn-success submit-button">Submit Survey</button>
                      </OverlayTrigger>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
  
            <div className="pagination">
              <div className="page-numbers">
                {currentSlide}/{totalSlides}
              </div>
            </div>
  
            {/* Add Question button is not shown on the last slide */}
            {!showWelcome && currentSlide !== totalSlides && (
              <button className="btn btn-primary new-question" onClick={() => setIsFormVisible(!isFormVisible)}>
                {isFormVisible ? 'Cancel' : 'Add Question'}
              </button>
            )}
          </>
        )}
      </div>
  
      {isFormVisible && (
        <div className="add-question-form">
          <h4>Add New Question</h4>
          <input
            type="text"
            placeholder="Question text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
          />
          <input
            type="text"
            placeholder="Field name"
            value={newQuestionField}
            onChange={(e) => setNewQuestionField(e.target.value)}
          />
          <select
            value={newQuestionType}
            onChange={(e) => setNewQuestionType(e.target.value)}
          >
            <option value="rating">Rating</option>
            <option value="text">Text</option>
          </select>
          <button className="btn btn-primary" onClick={handleAddQuestion}>
            Add Question
          </button>
        </div>
      )}
    </>
  );  
};

export default SurveyWithSwiper;
