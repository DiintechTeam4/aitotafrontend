"use client";

import { useState, useRef, useEffect } from "react";
import { FiVolume2, FiTrash2 } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const VoiceSynthesizer = ({
  text,
  language = "en",
  speaker,
  onAudioGenerated,
  clientId,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const generateAudio = async () => {
    if (!text || !text.trim()) {
      setError("Text is required for audio generation");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const supportedSpeakers = new Set([
        "abhilash",
        "anushka",
        "karun",
        "manisha",
        "vidya",
        "arya",
        "hitesh",
      ]);

      const getDefaultSpeakerForLanguage = (lang) =>
        (lang || "en").toLowerCase() === "hi" ? "anushka" : "abhilash";

      const sanitizeSpeaker = (lang, requested) => {
        if (!requested || typeof requested !== "string") {
          return getDefaultSpeakerForLanguage(lang);
        }
        const s = requested.toLowerCase();
        return supportedSpeakers.has(s)
          ? s
          : getDefaultSpeakerForLanguage(lang);
      };

      const response = await fetch(
        `${API_BASE_URL}/client/voice/synthesize?clientId=${clientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
          body: JSON.stringify({
            text,
            language,
            speaker: sanitizeSpeaker(language, speaker),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data && typeof data === "object"
            ? JSON.stringify(data)
            : "Failed to generate audio";
        throw new Error(errMsg);
      }
      // Convert base64 to Blob for playback
      const audioBlob = b64toBlob(data.audioBase64, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      if (onAudioGenerated) {
        onAudioGenerated(audioBlob, audioUrl, data.audioBase64);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: base64 to Blob
  function b64toBlob(b64Data, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl("");
    setError("");
    if (onAudioGenerated) {
      onAudioGenerated(null, null, null);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioUrl]);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex gap-2 justify-center mb-4">
        <button
          type="button"
          onClick={generateAudio}
          disabled={isGenerating || !text?.trim()}
          className="px-4 py-2 border-none rounded cursor-pointer text-sm transition-all bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <FiVolume2 />
              Generate Audio
            </>
          )}
        </button>

        {audioUrl && (
          <button
            type="button"
            onClick={clearAudio}
            className="px-4 py-2 border-none rounded cursor-pointer text-sm transition-all bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
          >
            <FiTrash2 />
            Clear
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center gap-2 text-indigo-500 font-bold mb-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <span>Generating audio using Sarvam AI...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded mb-4">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="mt-2 text-center">
          <audio ref={audioRef} controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default VoiceSynthesizer;
