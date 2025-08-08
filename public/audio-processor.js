// audio-processor.js
// This file should be placed in your public directory

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleBuffer = [];
    this.isActive = false;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'activate') {
        this.isActive = true;
      } else if (event.data.type === 'deactivate') {
        this.isActive = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!this.isActive || !input || input.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    
    if (!inputChannel) {
      return true;
    }

    // Accumulate samples in our buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.sampleBuffer.push(inputChannel[i]);
      
      // When we have 80 samples (10ms at 8kHz), send them
      if (this.sampleBuffer.length >= 80) {
        const chunk = new Float32Array(this.sampleBuffer.splice(0, 80));
        this.port.postMessage({
          type: 'audioData',
          data: chunk
        });
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
