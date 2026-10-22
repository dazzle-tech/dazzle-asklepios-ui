import React, { useEffect, useRef, useState } from 'react';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { audioBlobToWav } from '@/utils/audioToWav';
import { useCreateAmbientDraftMutation } from '@/services/ai-services/ambientDraftService';
import AmbientDraftResults from './AmbientDraftResults';

type Props = {
  patient?: { id?: number };
  encounterId?: number;
  encounter?: any;
  setEncounter?: (encounter: any) => void;
  edit?: boolean;
};

/**
 * Ambient draft (preview only): record the visit, or upload a recording, and show the draft
 * ConvoVoiceAgent returns. Nothing is saved from here yet.
 */
const AmbientDraftSection: React.FC<Props> = ({ patient, encounterId, encounter, setEncounter, edit }) => {
  const dispatch = useAppDispatch();
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [createAmbientDraft, { data: draft, isLoading, isError, error, reset }] =
    useCreateAmbientDraftMutation();

  const sendAudio = async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (patient?.id) formData.append('patientId', String(patient.id));
    if (encounterId) formData.append('encounterId', String(encounterId));

    reset();
    setOpenResults(true);

    try {
      await createAmbientDraft(formData).unwrap();
    } catch (err) {
      dispatch(
        notify({
          msg: extractErrorMessage(err) || 'Could not build the visit draft. Please try again.',
          sev: 'error'
        })
      );
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        dispatch(notify({ msg: 'Audio recording is not supported by this browser.', sev: 'error' }));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;

        const recorded = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!recorded.size) {
          dispatch(notify({ msg: 'No audio was recorded. Please try again.', sev: 'warning' }));
          return;
        }

        // ConvoScribe accepts wav / mp3 / m4a, the browser records webm
        setIsConverting(true);
        try {
          const wav = await audioBlobToWav(recorded);
          await sendAudio(new File([wav], 'visit.wav', { type: 'audio/wav' }));
        } catch {
          dispatch(notify({ msg: 'Could not prepare the recording. Please try again.', sev: 'error' }));
        } finally {
          setIsConverting(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);
      dispatch(
        notify({
          msg: 'Could not access the microphone. Please allow microphone access and try again.',
          sev: 'error'
        })
      );
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      setIsRecording(false);
      recorder.stop();
    }
  };

  // For testing with a ready recording (e.g. the ConvoScribe sample .wav)
  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await sendAudio(file);
  };

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const busy = isLoading || isConverting;

  return (
    <div style={{ marginBottom: '16px' }}>
      <SectionContainer
        title={<Translate>Ambient Draft</Translate>}
        content={
          <span style={{ fontSize: 13, color: 'var(--primary-gray)' }}>
            <Translate>Record the visit (or upload a .wav / .mp3 / .m4a recording) to see the draft.</Translate>
          </span>
        }
        action={
          <>
            <MyButton
              size="small"
              onClick={isRecording ? stopRecording : startRecording}
              loading={busy}
              disabled={edit || busy}
            >
              {isRecording ? 'Stop Recording' : 'Record Visit'}
            </MyButton>

            <MyButton
              size="small"
              appearance="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={edit || busy || isRecording}
            >
              Upload Recording
            </MyButton>

            {draft && !busy && (
              <MyButton size="small" appearance="ghost" onClick={() => setOpenResults(true)}>
                Show Last Draft
              </MyButton>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4"
              style={{ display: 'none' }}
              onChange={handleFileChosen}
            />
          </>
        }
      />

      <AmbientDraftResults
        open={openResults}
        setOpen={setOpenResults}
        draft={draft}
        isLoading={busy}
        errorMessage={isError ? extractErrorMessage(error) || 'The draft request failed.' : null}
        patient={patient}
        patientId={patient?.id}
        encounterId={encounterId}
        encounter={encounter}
        setEncounter={setEncounter}
      />
    </div>
  );
};

export default AmbientDraftSection;
