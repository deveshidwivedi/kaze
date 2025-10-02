import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// Components
import WeatherInfo from './components/WeatherInfo';
import ChatMessage from './components/ChatMessage';
import VoiceControls from './components/VoiceControls';
import LoadingIndicator from './components/LoadingIndicator';

// Hooks
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';

// Utils
import { getCurrentWeather, getUserLocation } from './utils/weatherApi';
import { generateWellnessAdvice, generateResponseToUserInput } from './utils/geminiApi';

function App() {
  // State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);

  // Custom hooks
  const {
    isListening,
    transcript,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const {
    isSupported: speechSynthesisSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking
  } = useSpeechSynthesis();

  // Effects
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Functions
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      const location = await getUserLocation();
      const weather = await getCurrentWeather(location.lat, location.lon);
      setWeatherData(weather);
      
      // Generate initial wellness advice
      const initialAdvice = await generateWellnessAdvice(weather);
      setMessages([{
        id: Date.now(),
        text: initialAdvice,
        sender: 'assistant',
        timestamp: new Date()
      }]);
      
      // Speak initial advice if voice is enabled
      if (isVoiceEnabled && speechSynthesisSupported) {
        speak(initialAdvice);
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      setLocationError(error.message);
      setMessages([{
        id: Date.now(),
        text: `申し訳ございません。${error.message} 手動で地域を設定するか、ブラウザの位置情報設定を確認してください。`,
        sender: 'assistant',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText = inputText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await generateResponseToUserInput(
        messageText,
        weatherData,
        messages.slice(-4) // Last 4 messages for context
      );

      const assistantMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak response if voice is enabled
      if (isVoiceEnabled && speechSynthesisSupported) {
        speak(response);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'すみません、応答の生成中にエラーが発生しました。もう一度お試しください。',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceOutput = () => {
    setIsVoiceEnabled(prev => !prev);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const handleStartListening = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌤️ 天気ウェルネスアシスタント</h1>
        <p>天気に合わせた健康アドバイスをお届けします</p>
      </header>

      <div className="chat-container">
        {weatherData && <WeatherInfo weatherData={weatherData} />}
        
        <div className="messages">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.sender === 'user'}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <input
              type="text"
              className="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "音声を聞いています..." : "メッセージを入力または音声で話してください"}
              disabled={isLoading || isListening}
            />
          </div>
          
          <VoiceControls
            isListening={isListening}
            isVoiceEnabled={isVoiceEnabled}
            onStartListening={handleStartListening}
            onStopListening={stopListening}
            onToggleVoice={toggleVoiceOutput}
            onSendMessage={() => handleSendMessage()}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Error messages */}
      {locationError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff6b6b',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: '300px',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          {locationError}
        </div>
      )}

      {!speechRecognitionSupported && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#ffc107',
          color: '#333',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          音声入力未対応
        </div>
      )}

      {!speechSynthesisSupported && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          background: '#ffc107',
          color: '#333',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem'
        }}>
          音声出力未対応
        </div>
      )}
    </div>
  );
}

export default App;
