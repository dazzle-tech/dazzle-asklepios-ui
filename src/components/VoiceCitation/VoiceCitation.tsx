import React, { useState } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import { Button, IconButton, Input, InputGroup, Tooltip, Whisper } from 'rsuite';
import MicrophoneIcon from '@rsuite/icons/legacy/Microphone';
import StopIcon from '@rsuite/icons/legacy/Stop';
import * as icons from '@rsuite/icons';

const VoiceCitation = ({
  auto = true,
  originalRecord,
  record,
  setRecord,
  fieldName,
  saveMethod = undefined,
  rows = 7
}) => {
  const processAudio = async blob => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Resample the audio buffer to 16000 Hz
    const offlineContext = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    // Convert the audio buffer to LINEAR16
    const audioData = renderedBuffer.getChannelData(0);
    let linear16Buffer = new ArrayBuffer(audioData.length * 2);
    let view = new DataView(linear16Buffer);
    for (let i = 0; i < audioData.length; i++) {
      let s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return linear16Buffer;
  };

  const transcribeAudio = async blobUrl => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const linear16Buffer = await processAudio(blob);

      const base64Audio = btoa(
        new Uint8Array(linear16Buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const apiResponse = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=AIzaSyAgluhqV7VfPM8vo5gKt-ebyaOJTV_ds98`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US'
            },
            audio: {
              content: base64Audio
            }
          })
        }
      );

      const data = await apiResponse.json();
      console.log('API Response:', data);

      if (data.error) {
        // oopsie daisy
      } else if (data.results && data.results[0] && data.results[0].alternatives[0]) {
        const trasncriptResponse = data.results[0].alternatives[0].transcript;
        const _record = { ...record };
        _record[fieldName] = trasncriptResponse;
        setRecord(_record);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dataIsChanged = () => {
    return originalRecord[fieldName] !== record[fieldName];
  };

  const handleStop = async blobUrl => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;

    console.log('Recording duration:', duration);

    if (auto) {
      if (duration > 3) {
        await transcribeAudio(blobUrl);
        document.getElementById('theInput').focus();
      }
    }
  };

  return (
    <>
      <ReactMediaRecorder
        audio
        onStop={blobUrl => handleStop(blobUrl)}
        render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
          // idle, recording, stopped
          <>
            <InputGroup>
              <InputGroup.Addon>
                {status !== 'recording' && !dataIsChanged() && <icons.CheckRound color="green" />}
                {status !== 'recording' && dataIsChanged() && <icons.Gear spin />}
                {status === 'recording' && (
                  <Whisper placement="top" speaker={<Tooltip>Recording in Progress</Tooltip>}>
                    <MicrophoneIcon spin />
                  </Whisper>
                )}
              </InputGroup.Addon>
              <Input
                id="theInput"
                as="textarea"
                rows={rows}
                value={record[fieldName]}
                onChange={e => setRecord({ ...record, [fieldName]: e })}
                onBlur={saveMethod ? saveMethod : undefined}
              />

              <InputGroup.Addon>
                {(status === 'idle' || status === 'stopped') && (
                  <Whisper placement="top" speaker={<Tooltip>Start Recording</Tooltip>}>
                    <IconButton
                      size="xs"
                      appearance="primary"
                      color="green"
                      onClick={startRecording}
                      icon={<MicrophoneIcon />}
                    />
                  </Whisper>
                )}

                {status === 'recording' && (
                  <Whisper placement="top" speaker={<Tooltip>Finish Recording</Tooltip>}>
                    <IconButton
                      size="xs"
                      appearance="primary"
                      color="red"
                      onClick={stopRecording}
                      icon={<StopIcon />}
                    />
                  </Whisper>
                )}

                {!auto && status === 'stopped' && mediaBlobUrl && (
                  <Whisper placement="top" speaker={<Tooltip>Transribe Recording to Text</Tooltip>}>
                    <IconButton
                      style={{ marginTop: '5px' }}
                      size="xs"
                      appearance="primary"
                      color="blue"
                      onClick={() => transcribeAudio(mediaBlobUrl)}
                      icon={<icons.PushMessage />}
                    />
                  </Whisper>
                )}
              </InputGroup.Addon>
            </InputGroup>
          </>
        )}
      />
    </>
  );
};

export default VoiceCitation;
