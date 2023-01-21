/**
 * Create a DataView object from the ArrayBuffer and write the Waveform Audio file's header data to the DataView object.
 * We use the setUint method of the DataView object to write the values for the header data and audio data to the buffer
 * at the appropriate offsets.
 *
 * Build on the RFC 2361 standards
 * https://www.rfc-editor.org/rfc/rfc2361.html
 *
 * WAV File Headers
 * ┌─────────────┬────────┬─────────┬───────────────┬────────────────────────────────────────────────────────────────┐
 * │ Bytes       │ Endian │ Offset  │ Field Name    │ Description                                                    │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┼──────┐
 * │ 52 49 46 46 │ MSB    │ 00      │ ChunkID       │ Marks the file as a riff file. Characters are each 1 byte long │ RIFF │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ xx xx xx xx │ LSB    │ 04      │ ChunkSize     │ Size of the overall file in bytes                              │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 57 41 56 45 │ MSB    │ 08      │ Format        │ File Type Header. For our purposes, it always equals “WAVE”    │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┼──────┤
 * │ 66 6d 74 20 │ MSB    │ 12      │ Subchunk1ID   │ Format chunk marker. Includes trailing null                    │ FMT  │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 10 00 00 00 │ LSB    │ 16      │ Subchunk1Size │ Length of format data as listed above                          │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 01 00       │ LSB    │ 20      │ AudioFormat   │ Type of format (1 is PCM)                                      │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 01 00       │ LSB    │ 22      │ NumChannels   │ Number of channels (1 or 2)                                    │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 44 AC 00 00 │ LSB    │ 24      │ SampleRate    │ Sample Rate (8000, 44100 etc)                                  │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 11 2B 00 00 │ LSB    │ 28      │ ByteRate      │ (SampleRate * NumChannels * BitsPerSample) / 8                 │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 02 00       │ LSB    │ 32      │ BlockAlign    │ NumChannels * BitsPerSample / 8                                │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ 10 00       │ LSB    │ 34      │ BitsPerSample │ Number of bits per sample (8 or 16)                            │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┼──────┤
 * │ 64 61 74 61 │ MSB    │ 36      │ Subchunk2ID   │ “data” chunk header. Marks the beginning of the data section   │ Data │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ xx xx xx xx │ LSB    │ 40      │ Subchunk2Size │ Sampled data length                                            │      │
 * ├─────────────┼────────┼─────────┼───────────────┼────────────────────────────────────────────────────────────────┤      │
 * │ xx xx xx xx │ LSB    │ 44      │ PCM data      │ The actual sound data                                          │      │
 * └─────────────┴────────┴─────────┴───────────────┴────────────────────────────────────────────────────────────────┴──────┘
 */

export default (data, sampleRate = 44100) => {

  // Create a new ArrayBuffer with the desired size
  const buffer = new ArrayBuffer(44 + data.length * 2); // 44 bytes for the header and 2 bytes for each sample
  const view   = new DataView(buffer); // Create a new DataView object from the ArrayBuffer

  // We use 32 bits instead of byte for simplicity sake so we can write each chunk in one go and without having to worry calulated decimal values

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false);                 // ChunkID 'RIFF'
  view.setUint32(4, 36 + data.length * 2, true);        // ChunkSize
  view.setUint32(8, 0x57415645, false);                 // Format 'WAVE'

  // FMT sub-chunk
  view.setUint32(12, 0x666d7420, false);                // Subchunk1ID 'fmt '
  view.setUint32(16, 0x00000010, true);                 // Subchunk1Size
  view.setUint16(20, 0x00000001, true);                 // AudioFormat
  view.setUint16(22, 0x00000001, true);                 // NumChannels
  view.setUint32(24, sampleRate, true);                 // SampleRate
  view.setUint32(28, (sampleRate * 2 * 1) / 8, true);   // ByteRate
  view.setUint16(32, 0x00000002, true);                 // BlockAlign
  view.setUint16(34, 0x00000010, true);                 // BitsPerSample

  // DATA sub-chunk
  view.setUint32(36, 0x64617461, false);                // Subchunk2ID 'data'
  view.setUint32(40, data.length * 2, true);            // Subchunk2Size

  floatTo16BitPCM(view, 44, data)                       // PCM data

  // Return the Blob object
  return new Blob([view.buffer], { type: 'audio/wav' })

}

/**
 * clamps a given numeric input to the range { min, max }
 *
 * Example:
 *   clamp(+0.5, { max: 1, min: -1 }) => 0.5
 *   clamp(+1.5, { max: 1, min: -1 }) => 1
 *   clamp(-1.5, { max: 1, min: -1 }) => -1
 */
export const clamp = (input, { max, min }) => {
  return input > max ? max : input < min ? min : input;
}

/**
 * Convert a floating-point audio signal to a 16-bit PCM (pulse-code modulation) representation by converting each floating-point number in input
 * to a 16-bit integer and write it to the output array at the current position indicated by the offset variable. The setInt16() method is used to
 * write the 16-bit integer to the output array.
 *
 * Before converting the floating-point number to a 16-bit integer, the number is first clamped to the range -1 to 1 which ensures that
 * the resulting 16-bit integer will be within the valid range for a 16-bit PCM signal. After the 16-bit integer is calculated, it is multiplied
 * by either 0x7FFF or 0x8000, depending on whether the number is positive or negative. This effectively converts the number from its original range
 * to the range (-32768, 32767) that is used for 16-bit PCM signals.
 */

function floatTo16BitPCM(output, offset, input) {
  input.forEach((value, index) => {

    const clampedInput = clamp(value, { max: 1, min: -1 });

    // The offset is the starting position in the output array at which the PCM data should be written
    const byteOffset = offset + index * 2;

    // The 16-bit integer is calculated by multiplying the floating-point number
    const data = clampedInput < 0
               ? clampedInput * 0x8000
               : clampedInput * 0x7FFF

    // The 16-bit integer is written to the output array
    output.setInt16(byteOffset, data, true);
  });
}
