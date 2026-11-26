const SPEECH_SAMPLE_RATE = 16000;

const supportedExtension = (audio: Blob): 'wav' | 'mp3' | 'm4a' | null => {
  const type = (audio.type || '').toLowerCase();
  const name = audio instanceof File ? audio.name.toLowerCase() : '';
  if (type.includes('wav') || name.endsWith('.wav')) {
    return 'wav';
  }
  if (type.includes('mpeg') || type.includes('mp3') || name.endsWith('.mp3')) {
    return 'mp3';
  }
  if (
    type.includes('mp4') ||
    type.includes('m4a') ||
    type.includes('aac') ||
    name.endsWith('.m4a') ||
    name.endsWith('.mp4')
  ) {
    return 'm4a';
  }
  return null;
};

export const preferredRecorderMimeType = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  const candidates = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];
  return candidates.find(type => MediaRecorder.isTypeSupported(type));
};

const asFile = (audio: Blob, fileName: string, type: string) => {
  if (audio instanceof File && audio.name.toLowerCase() === fileName.toLowerCase()) {
    return audio;
  }
  return new File([audio], fileName, { type });
};

const writeAscii = (view: DataView, offset: number, text: string) => {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
};

const toMono = (buffer: AudioBuffer) => {
  const mono = new Float32Array(buffer.length);
  const channels = buffer.numberOfChannels;
  for (let channel = 0; channel < channels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < buffer.length; index += 1) {
      mono[index] += samples[index] / channels;
    }
  }
  return mono;
};

const resample = (samples: Float32Array, fromRate: number, toRate: number) => {
  if (fromRate === toRate) {
    return samples;
  }
  const nextLength = Math.max(1, Math.round((samples.length * toRate) / fromRate));
  const next = new Float32Array(nextLength);
  const ratio = samples.length / nextLength;
  for (let index = 0; index < nextLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const fraction = position - left;
    const start = samples[left] ?? 0;
    const end = samples[Math.min(left + 1, samples.length - 1)] ?? 0;
    next[index] = start + (end - start) * fraction;
  }
  return next;
};

const encodeWav = (samples: Float32Array, sampleRate: number) => {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

const webmToWav = async (audio: Blob) => {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await audio.arrayBuffer());
    const samples = resample(toMono(decoded), decoded.sampleRate, SPEECH_SAMPLE_RATE);
    return encodeWav(samples, SPEECH_SAMPLE_RATE);
  } finally {
    await context.close();
  }
};

export const toSupportedAudioFile = async (audio: Blob, baseName = 'ambient-scribe'): Promise<File> => {
  const extension = supportedExtension(audio);
  if (extension === 'wav') {
    return asFile(audio, `${baseName}.wav`, 'audio/wav');
  }
  if (extension === 'mp3') {
    return asFile(audio, `${baseName}.mp3`, 'audio/mpeg');
  }
  if (extension === 'm4a') {
    return asFile(audio, `${baseName}.m4a`, audio.type && audio.type.includes('mp4') ? audio.type.split(';')[0] : 'audio/mp4');
  }
  const wav = await webmToWav(audio);
  return new File([wav], `${baseName}.wav`, { type: 'audio/wav' });
};
