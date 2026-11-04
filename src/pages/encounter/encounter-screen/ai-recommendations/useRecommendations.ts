import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecommendationsResponse,
  useGetClinicalRecommendationsMutation
} from '@/services/ai-services/clinicalRecommendationsService';
import { errorDetails, LOADING_STEPS, Phase, STEP_GAP_MS } from './utils';

type Params = {
  patientId?: number | string;
  encounterId?: number | string;
  focusAreas: string[];
};

// Owns the request lifecycle: loading steps, result, error, cancel and reset per encounter
const useRecommendations = ({ patientId, encounterId, focusAreas }: Params) => {
  const [getClinicalRecommendations] = useGetClinicalRecommendationsMutation();

  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<RecommendationsResponse | null>(null);
  const [errorText, setErrorText] = useState('');
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const requestRef = useRef<{ abort: () => void } | null>(null);
  const canRequest = !!patientId && !!encounterId;

  const start = useCallback(() => {
    if (!canRequest) return;
    requestRef.current?.abort();

    setPhase('loading');
    setStep(0);
    setErrorText('');

    const request = getClinicalRecommendations({
      patientId: Number(patientId),
      encounterId: Number(encounterId),
      focusAreas
    });
    requestRef.current = request;

    request
      .unwrap()
      .then(data => {
        if (requestRef.current !== request) return;
        setResult(data);
        setGeneratedAt(new Date());
        setPhase(data?.recommendations?.length || data?.summary ? 'success' : 'empty');
      })
      .catch((error: any) => {
        if (requestRef.current !== request || error?.name === 'AbortError') return;
        setErrorText(errorDetails(error));
        setPhase('error');
      });
  }, [canRequest, patientId, encounterId, focusAreas, getClinicalRecommendations]);

  const cancel = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setPhase(result ? 'success' : 'idle');
  };

  // The steps only show progress; the last one stays current until the response arrives
  useEffect(() => {
    if (phase !== 'loading' || step >= LOADING_STEPS.length - 1) return;
    const timer = setTimeout(() => setStep(s => s + 1), STEP_GAP_MS);
    return () => clearTimeout(timer);
  }, [phase, step]);

  // A new encounter starts from scratch
  useEffect(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setResult(null);
    setPhase('idle');
  }, [patientId, encounterId]);

  useEffect(() => () => requestRef.current?.abort(), []);

  return { phase, step, result, errorText, generatedAt, canRequest, start, cancel };
};

export default useRecommendations;
