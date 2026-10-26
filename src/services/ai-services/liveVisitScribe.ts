import config from '../../../app-config';

export type LiveSegment = {
  id: string;
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
  lang: string;
  final: boolean;
};

export type LiveEvidence = {
  text: string;
  segment_ids?: string[];
};

export type LiveMedication = {
  name: string;
  detail?: string | null;
  confirm?: boolean;
  segment_ids?: string[];
};

export type LivePickedUp = {
  complaint?: LiveEvidence | null;
  symptoms?: LiveEvidence[];
  medications?: LiveMedication[];
  exam?: LiveEvidence[];
  record?: Record<string, Record<string, unknown> | null>;
  record_evidence?: Record<string, string[]>;
  record_status?: Record<string, string>;
  missing_required?: Record<string, string[]>;
};

export type LivePatientContext = {
  chronic_diseases: string[];
  active_medications: string[];
  allergies: string[];
  known_diagnoses: string[];
};

type LiveVisitListener = {
  onSegment: (segment: LiveSegment) => void;
  onFinal: (segments: LiveSegment[]) => void;
  onPickedUp: (picked: LivePickedUp) => void;
  onError: (detail: string) => void;
  onReady?: () => void;
  onAudio?: (hearing: boolean) => void;
};

const asList = (value: unknown) =>
  Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];

export const liveVisitScribeUrl = () => {
  const override = config.liveVisitScribeUrl?.trim();
  if (override) return override;
  const base = (config.backendBaseURL || 'http://localhost:8080').replace(/\/$/, '');
  const socketBase = base.replace(/^http/i, 'ws');
  return `${socketBase}/api/ai/v1/live-visit-scribe/live`;
};

export const livePatientContext = (raw?: string | null): LivePatientContext | null => {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const context: LivePatientContext = {
      chronic_diseases: asList(parsed.chronic_diseases),
      active_medications: asList(parsed.active_medications),
      allergies: asList(parsed.allergies),
      known_diagnoses: asList(parsed.known_diagnoses)
    };
    return Object.values(context).some(items => items.length) ? context : null;
  } catch {
    return null;
  }
};

const floatToInt16 = (samples: Float32Array) => {
  const out = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    out[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return out;
};

const asSegment = (value: unknown): LiveSegment | null => {
  if (!value || typeof value !== 'object') return null;
  const segment = value as Partial<LiveSegment>;
  if (!segment.id || !segment.text) return null;
  return {
    id: String(segment.id),
    speaker: String(segment.speaker || 'unknown'),
    start_ms: Number(segment.start_ms) || 0,
    end_ms: Number(segment.end_ms) || 0,
    text: String(segment.text),
    lang: String(segment.lang || ''),
    final: Boolean(segment.final)
  };
};

export class LiveVisitConnection {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private armed = false;
  private wantAudio = true;
  private deferredPause = false;
  private gotReady = false;
  private stopping = false;
  private reported = false;
  private generation = 0;
  private frames = 0;
  private heard = false;
  private recordStream: MediaStream | null = null;
  private playbackAudio: HTMLAudioElement | null = null;
  private playbackSource: MediaElementAudioSourceNode | null = null;
  private listener: LiveVisitListener | null = null;

  start(stream: MediaStream, patientContext: LivePatientContext | null, listener: LiveVisitListener) {
    this.stop();
    const generation = ++this.generation;
    this.stopping = false;
    this.reported = false;
    this.gotReady = false;
    this.wantAudio = true;
    this.deferredPause = false;
    this.armed = false;
    this.frames = 0;
    this.heard = false;
    this.listener = listener;

    const audioCtx = new AudioContext();
    this.audioCtx = audioCtx;
    const sampleRate = audioCtx.sampleRate;
    if (sampleRate < 8000 || sampleRate > 48000) {
      void audioCtx.close();
      this.audioCtx = null;
      throw new Error('This browser sample rate is outside the range the live transcript accepts.');
    }

    this.openSocket(generation, sampleRate, patientContext);
    this.attachProcessor(audioCtx, stream, generation);
    void audioCtx.resume().then(() => {
      if (generation !== this.generation || this.stopping) return;
      if (audioCtx.state !== 'running') {
        this.fail('The browser has not started microphone processing.');
      }
    });
    return this.recordStream ?? stream;
  }

  playRecording(
    audio: HTMLAudioElement,
    patientContext: LivePatientContext | null,
    listener: LiveVisitListener,
    restart: boolean
  ) {
    if (
      !restart &&
      this.ws &&
      !this.stopping &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      this.wantAudio = true;
      if (this.gotReady) this.armed = true;
      void this.audioCtx?.resume();
      return;
    }

    const generation = ++this.generation;
    const previous = this.ws;
    this.ws = null;
    this.armed = false;
    if (previous && (previous.readyState === WebSocket.OPEN || previous.readyState === WebSocket.CONNECTING)) {
      previous.close();
    }
    this.stopping = false;
    this.reported = false;
    this.gotReady = false;
    this.wantAudio = true;
    this.deferredPause = false;
    this.frames = 0;
    this.heard = false;
    this.listener = listener;
    this.attachPlayback(audio);
    const sampleRate = this.audioCtx?.sampleRate ?? 0;
    if (sampleRate < 8000 || sampleRate > 48000) {
      throw new Error('This browser sample rate is outside the range the live transcript accepts.');
    }
    this.openSocket(generation, sampleRate, patientContext);
    void this.audioCtx?.resume();
  }

  private openSocket(generation: number, sampleRate: number, patientContext: LivePatientContext | null) {
    const payload: Record<string, unknown> = { type: 'start', sample_rate: sampleRate, channels: 1 };
    if (patientContext) payload.patient_context = patientContext;

    const ws = new WebSocket(liveVisitScribeUrl());
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      if (generation !== this.generation || this.stopping) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify(payload));
    };
    ws.onmessage = event => {
      if (generation !== this.generation || typeof event.data !== 'string') return;
      this.handleMessage(event.data);
    };
    ws.onerror = () => {
      if (generation !== this.generation) return;
      this.fail('Live transcript could not connect. Is the AI service running?');
    };
    ws.onclose = () => {
      if (generation !== this.generation) return;
      this.armed = false;
      if (!this.stopping && !this.gotReady) {
        this.fail('Live transcript could not connect. Is the AI service running?');
      } else if (!this.stopping && this.gotReady) {
        this.fail('Live transcript disconnected.');
      }
      if (this.ws === ws) this.ws = null;
    };
  }

  private attachProcessor(audioCtx: AudioContext, stream: MediaStream, generation: number) {
    const source = audioCtx.createMediaStreamSource(stream);
    const mute = audioCtx.createGain();
    mute.gain.value = 0;
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = event => {
      if (generation !== this.generation) return;
      this.onSamples(event.inputBuffer.getChannelData(0));
    };
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);
    source.connect(processor);
    processor.connect(mute);
    mute.connect(audioCtx.destination);
    this.nodes = [source, processor, mute, destination];
    this.recordStream = destination.stream;
  }

  private attachPlayback(audio: HTMLAudioElement) {
    if (this.playbackAudio === audio && this.playbackSource && this.audioCtx && this.audioCtx.state !== 'closed') {
      void this.audioCtx.resume();
      return;
    }
    this.detachAudio();
    const audioCtx = new AudioContext();
    this.audioCtx = audioCtx;
    const source = audioCtx.createMediaElementSource(audio);
    const processor = audioCtx.createScriptProcessor(4096, 2, 1);
    const mute = audioCtx.createGain();
    mute.gain.value = 0;
    processor.onaudioprocess = event => {
      const input = event.inputBuffer;
      const output = event.outputBuffer.getChannelData(0);
      const left = input.getChannelData(0);
      if (input.numberOfChannels < 2) {
        output.set(left);
        this.onSamples(left);
        return;
      }
      const right = input.getChannelData(1);
      const mono = new Float32Array(left.length);
      for (let index = 0; index < left.length; index += 1) {
        mono[index] = (left[index] + right[index]) / 2;
        output[index] = mono[index];
      }
      this.onSamples(mono);
    };
    source.connect(audioCtx.destination);
    source.connect(processor);
    processor.connect(mute);
    mute.connect(audioCtx.destination);
    this.nodes = [source, processor, mute];
    this.playbackAudio = audio;
    this.playbackSource = source;
  }

  private onSamples(samples: Float32Array) {
    let sum = 0;
    for (let index = 0; index < samples.length; index += 1) sum += samples[index] * samples[index];
    const rms = Math.sqrt(sum / Math.max(1, samples.length));
    if (rms > 0.01) this.heard = true;
    this.frames += 1;
    if (this.frames === 1 || this.frames % 8 === 0) this.listener?.onAudio?.(this.heard);
    if (!this.armed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const pcm = floatToInt16(samples);
    this.ws.send(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
  }

  pause() {
    this.wantAudio = false;
    this.armed = false;
    if (this.gotReady) this.send({ type: 'pause' });
    else this.deferredPause = true;
  }

  resume() {
    this.wantAudio = true;
    this.armed = false;
    this.deferredPause = false;
    if (this.gotReady) this.send({ type: 'resume' });
  }

  stop() {
    if (this.stopping && !this.ws && !this.audioCtx) return;
    this.stopping = true;
    this.wantAudio = false;
    this.armed = false;
    const ws = this.ws;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN && this.gotReady) {
      ws.send(JSON.stringify({ type: 'stop' }));
      return;
    }
    if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }

  dispose() {
    this.stop();
    this.detachAudio();
  }

  private fail(detail: string) {
    if (this.reported || this.stopping) return;
    this.reported = true;
    this.listener?.onError(detail);
  }

  private send(payload: { type: string }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  private handleMessage(raw: string) {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = String(message.type || '');
    if (type === 'ready') {
      this.gotReady = true;
      if (this.deferredPause || !this.wantAudio) {
        this.deferredPause = false;
        this.armed = false;
        this.send({ type: 'pause' });
      } else {
        this.armed = true;
      }
      this.listener?.onReady?.();
      return;
    }
    if (type === 'segment') {
      const segment = asSegment(message);
      if (segment) this.listener?.onSegment(segment);
      return;
    }
    if (type === 'picked_up') {
      this.listener?.onPickedUp(message as LivePickedUp);
      return;
    }
    if (type === 'resumed') {
      this.armed = this.wantAudio;
      return;
    }
    if (type === 'final') {
      const segments = Array.isArray(message.segments)
        ? message.segments.map(asSegment).filter((segment): segment is LiveSegment => Boolean(segment))
        : [];
      this.listener?.onFinal(segments);
      return;
    }
    if (type === 'error') {
      const detail = String(message.detail || 'The live transcript service reported an error.');
      this.listener?.onError(detail);
      if (!this.gotReady) {
        this.reported = true;
        this.ws?.close();
      }
    }
  }

  private detachAudio() {
    this.nodes.forEach(node => {
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    });
    this.nodes = [];
    this.playbackAudio = null;
    this.playbackSource = null;
    const audioCtx = this.audioCtx;
    this.audioCtx = null;
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close();
    }
  }
}
