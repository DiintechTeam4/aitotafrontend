class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.chunkSize = 160; // 160 bytes = 80 samples at 16-bit
      this.sampleRate = 8000;
      this.buffer = new Float32Array(80); // 80 samples for 160 bytes
      this.bufferIndex = 0;
      this.isActive = false;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      
      if (!this.isActive || !input.length) {
        return true;
      }
      
      const inputChannel = input[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        // When we have 80 samples (160 bytes when converted to int16)
        if (this.bufferIndex >= 80) {
          // Send buffer to main thread
          this.port.postMessage({
            type: 'audioData',
            data: this.buffer.slice(),
            timestamp: currentTime
          });
          
          // Reset buffer
          this.bufferIndex = 0;
          this.buffer.fill(0);
        }
      }
      
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);
  