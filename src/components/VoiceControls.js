import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';

const VoiceControls = ({
  isListening,
  isVoiceEnabled,
  onStartListening,
  onStopListening,
  onToggleVoice,
  onSendMessage,
  disabled = false
}) => {
  return (
    <div className="controls">
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={isListening ? onStopListening : onStartListening}
        disabled={disabled}
        title={isListening ? '音声入力を停止' : '音声入力を開始'}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      
      <button
        className={`voice-toggle ${!isVoiceEnabled ? 'disabled' : ''}`}
        onClick={onToggleVoice}
        title={isVoiceEnabled ? '音声出力をオフ' : '音声出力をオン'}
      >
        {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      
      <button
        className="send-button"
        onClick={onSendMessage}
        disabled={disabled}
        title="メッセージを送信"
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default VoiceControls;
