import { useState, useEffect, useCallback } from "react";

const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();

        // filter for Japanese voices
        const japaneseVoices = availableVoices.filter(
          (voice) => voice.lang.includes("ja") || voice.lang.includes("JP")
        );

        setVoices(japaneseVoices);

        // set default Japanese voice or fallback to any voice
        if (japaneseVoices.length > 0) {
          const preferredVoice =
            japaneseVoices.find(
              (voice) =>
                voice.name.includes("Female") ||
                voice.name.includes("Kyoko") ||
                voice.name.includes("Otoya") ||
                voice.gender === "female"
            ) || japaneseVoices[0];

          setSelectedVoice(preferredVoice);
          setIsReady(true);
        } else if (availableVoices.length > 0) {
          // Fallback to any available voice
          const fallbackVoice = availableVoices[0];
          setSelectedVoice(fallbackVoice);
          setIsReady(true);
        } else {
          setIsReady(true);
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
      console.warn("Speech synthesis not supported in this browser");
      setIsSupported(false);
      setIsReady(true); // Mark as ready even if not supported
    }
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      if (!isSupported || !text) {
        return;
      }

      // cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Wait a bit for cancellation to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        // set voice (use selected voice or let browser choose)
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // set language to Japanese
        utterance.lang = "ja-JP";

        // apply options
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event.error);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      }, 50);
    },
    [isSupported, selectedVoice]
  );

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
    isReady,
    setSelectedVoice,
    speak,
    stop,
    pause,
    resume,
  };
};

export default useSpeechSynthesis;
