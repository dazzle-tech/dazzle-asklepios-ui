
import React, { useEffect, useRef, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput/MyInput';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { useAutoPopulateMutation } from '@/services/auto-Population/autoPopulationService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useSummarizeClinicalVoiceMutation } from '@/services/ai-services/clinicalSummaryVoiceService';
import AutoPopulationResults from './AutoPopulationResults';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import { Patient } from '@/types/model-types-new';

type Props = {
    patient?: Patient;
    edit?: boolean;
};

const AutoPopulationSection: React.FC<Props> = ({ patient, edit }) => {
    const dispatch = useAppDispatch();
    const [caseSummary, setCaseSummary] = useState({ caseSummary: null });
    const [showAutoPopulationResults, setShowAutoPopulationResults] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const [
        autoPopulate,
        {
            data: autoPopulationResult,
            isLoading: isAutoPopulating,
            isError: isAutoPopulationError,
        },
    ] = useAutoPopulateMutation();

    const [summarizeClinicalVoice, { isLoading: isTranscribing }] =
        useSummarizeClinicalVoiceMutation();

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
                dispatch(
                    notify({
                        msg: 'Audio recording is not supported by this browser.',
                        sev: 'error',
                    })
                );
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            streamRef.current = stream;
            audioChunksRef.current = [];

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                mediaRecorderRef.current = null;

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: recorder.mimeType || 'audio/webm',
                });

                if (!audioBlob.size) {
                    dispatch(
                        notify({
                            msg: 'No audio was recorded. Please try again.',
                            sev: 'warning',
                        })
                    );
                    return;
                }

                const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
                const audioFile = new File(
                    [audioBlob],
                    `case-summary.${extension}`,
                    { type: audioBlob.type }
                );

                const formData = new FormData();
                formData.append('audio', audioFile);

                try {
                    const result = await summarizeClinicalVoice(formData).unwrap();

                    if (!result.summary?.trim()) {
                        dispatch(
                            notify({
                                msg: 'The clinical summary could not be generated. Please try recording again.',
                                sev: 'error',
                            })
                        );
                        return;
                    }

                    setCaseSummary({
                        caseSummary: result.summary,
                    });

                    dispatch(
                        notify({
                            msg: 'Clinical summary generated successfully.',
                            sev: 'success',
                        })
                    );
                } catch (error) {
                    const message = extractErrorMessage(error);

                    dispatch(
                        notify({
                            msg:
                                message ||
                                'We couldn’t generate a clinical summary. Please try recording again.',
                            sev: 'error',
                        })
                    );
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
                    sev: 'error',
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

    const handleCaseSummary = async () => {
        try {
            if (!caseSummary.caseSummary?.trim()) {
                dispatch(
                    notify({
                        msg: 'Please enter a case summary.',
                        sev: 'warning',
                    })
                );
                return;
            }

            if (!patient?.id) {
                dispatch(
                    notify({
                        msg: 'Patient ID is missing.',
                        sev: 'error',
                    })
                );
                return;
            }

            setShowAutoPopulationResults(true);

            await autoPopulate({
                userText: caseSummary.caseSummary,
                patientId: patient.id,
            }).unwrap();

            dispatch(
                notify({
                    msg: 'Auto population completed successfully.',
                    sev: 'success',
                })
            );
        } catch (error) {
            const message = extractErrorMessage(error);

            dispatch(
                notify({
                    msg: message || 'Auto population failed. Please try again.',
                    sev: 'error',
                })
            );
        }
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

    return (
        <div style={{ marginBottom: '16px' }}>
            <SectionContainer
                title={<Translate>Case Summary</Translate>}
                content={
                    <Form fluid>
                        <MyInput
                            width="100%"
                            showLabel={false}
                            fieldType="textarea"
                            fieldName="caseSummary"
                            record={caseSummary}
                            setRecord={setCaseSummary}
                            disabled={edit}
                        />
                    </Form>
                }
                action={
                    <>
                        <MyButton
                            size="small"
                            onClick={isRecording ? stopRecording : startRecording}
                            loading={isTranscribing}
                            disabled={edit || isTranscribing || isAutoPopulating}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </MyButton>

                        <MyButton
                            size="small"
                            onClick={handleCaseSummary}
                            loading={isAutoPopulating}
                            disabled={
                                edit ||
                                isRecording ||
                                isTranscribing ||
                                isAutoPopulating
                            }
                        >
                            Auto Populate
                        </MyButton>
                    </>
                }
            />

            <AutoPopulationResults
                open={showAutoPopulationResults}
                setOpen={setShowAutoPopulationResults}
                result={autoPopulationResult}
                isLoading={isAutoPopulating}
                isError={isAutoPopulationError}
            />
        </div>
    );
};

export default AutoPopulationSection;
