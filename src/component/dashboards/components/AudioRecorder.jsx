import React, { useState, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";

const AudioRecorder = ({ onAudioRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        onAudioRecorded(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setAudioURL("");
    onAudioRecorded(null);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex gap-2 justify-center mb-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 border-none rounded cursor-pointer text-sm transition-all bg-green-500 text-white hover:bg-green-600"
          >
            🎤 Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 border-none rounded cursor-pointer text-sm transition-all bg-red-500 text-white hover:bg-red-600"
          >
            ⏹️ Stop Recording
          </button>
        )}

        {audioURL && (
          <button
            type="button"
            onClick={clearRecording}
            className="px-4 py-2 border-none rounded cursor-pointer text-sm transition-all bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
          >
            <FiTrash2 />
            Clear
          </button>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-red-500 font-bold mb-4">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          Recording...
        </div>
      )}

      {audioURL && (
        <div className="mt-4 text-center">
          <audio controls src={audioURL}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
