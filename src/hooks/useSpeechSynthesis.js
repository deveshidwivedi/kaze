import { useState, useEffect, useCallback } from 'react';

const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        
        // filter for Japanese voices
        const japaneseVoices = availableVoices.filter(voice => 
          voice.lang.includes('ja') || voice.lang.includes('JP')
        );
        
        setVoices(japaneseVoices);
        
        // set default Japanese voice
        if (japaneseVoices.length > 0) {
          // female Japanese voices
          const preferredVoice = japaneseVoices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('Kyoko') ||
            voice.name.includes('Otoya') ||
            voice.gender === 'female'
          ) || japaneseVoices[0];
          
          setSelectedVoice(preferredVoice);
        }
      };

      // load voices immediately
      loadVoices();
      
      // load when voices change (some browsers load voices asynchronously)
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      setIsSupported(false);
      console.warn('Speech synthesis not supported in this browser');
    }
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported || !text) return;

    // cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // set voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // set language to Japanese
    utterance.lang = 'ja-JP';
    
    // apply options
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop,
    pause,
    resume
  };
};

export default useSpeechSynthesis;
