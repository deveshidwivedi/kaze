import { useState, useEffect, useCallback } from "react";

const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("Checking speech synthesis support...");
    if ("speechSynthesis" in window) {
      console.log("Speech synthesis is supported");
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        console.log("Available voices:", availableVoices.length);

        // filter for Japanese voices
        const japaneseVoices = availableVoices.filter(
          (voice) => voice.lang.includes("ja") || voice.lang.includes("JP")
        );

        console.log("Japanese voices:", japaneseVoices.length);

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
          console.log("Selected Japanese voice:", preferredVoice.name);
          setIsReady(true);
        } else if (availableVoices.length > 0) {
          // Fallback to any available voice
          const fallbackVoice = availableVoices[0];
          setSelectedVoice(fallbackVoice);
          console.log("Selected fallback voice:", fallbackVoice.name);
          setIsReady(true);
        } else {
          console.log("No voices available, using browser default");
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
        console.log("Speech not supported or no text provided");
        return;
      }

      console.log(
        "Starting speech synthesis for:",
        text.substring(0, 50) + "..."
      );

      // cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Wait a bit for cancellation to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        // set voice (use selected voice or let browser choose)
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log("Using voice:", selectedVoice.name);
        } else {
          console.log("No voice selected, using browser default");
        }

        // set language to Japanese
        utterance.lang = "ja-JP";

        // apply options
        utterance.rate = options.rate || 0.9;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        utterance.onstart = () => {
          console.log("Speech started:", text.substring(0, 50) + "...");
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log("Speech ended");
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event.error);
          setIsSpeaking(false);
        };

        console.log("Speaking with utterance:", utterance);
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
