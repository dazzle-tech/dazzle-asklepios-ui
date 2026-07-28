import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyCard from '@/components/MyCard/MyCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useInterpretLabsMutation } from '@/services/ai-services/labInterpretationService';
import { InterpretationDTO, LabInterpretationRequest } from '@/services/ai-services/labInterpretationService';
import Translate from '@/components/Translate';
import dayjs from 'dayjs';
import { Form } from 'rsuite';

type Props = {
  patientId: number;
};

interface FormData {
  dateFrom: string | null;
  dateTo: string | null;
}

// ✅ Severity colors
const getSeverityColor = (severity?: string): string => {
  if (!severity) return '#9E9E9E';

  switch (severity.toLowerCase()) {
    case 'high':
    case 'critical':
      return '#D32F2F';
    case 'medium':
    case 'warning':
      return '#F57C00';
    case 'low':
    case 'info':
      return '#388E3C';
    default:
      return '#9E9E9E';
  }
};

const LabInterpretationAI: React.FC<Props> = ({ patientId }) => {
  const [formState, setFormState] = useState<FormData>({
    dateFrom: null,
    dateTo: null,
  });

  const [interpretLabs, { isLoading, data: interpretationResponse, error }] =
    useInterpretLabsMutation();

  const [localError, setLocalError] = useState<string | null>(null);

  // ✅ Submit
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  const onSubmit = async (formData: FormData) => {
    setLocalError(null);

    if (!formData.dateFrom) {
      setLocalError('Date From is required');
      return;
    }

    if (!formData.dateTo) {
      setLocalError('Date To is required');
      return;
    }

    const startDate = dayjs(formData.dateFrom);
    const endDate = dayjs(formData.dateTo);

    if (!startDate.isValid() || !endDate.isValid()) {
      setLocalError('Please enter valid dates');
      return;
    }

    if (startDate.isAfter(endDate)) {
      setLocalError('Date From must be before Date To');
      return;
    }

    try {
      const request: LabInterpretationRequest = {
        patientId,
        // ✅ FIX الأساسي هون
        dateFrom: startDate.startOf('day').toISOString(),
        dateTo: endDate.endOf('day').toISOString(),
      };

      await interpretLabs(request).unwrap();
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to interpret labs');
    }
  };

  const interpretation = interpretationResponse?.interpretation as
    | InterpretationDTO
    | undefined;

  const displayError =
    localError ||
    (error &&
    typeof error === 'object' &&
    'message' in error
      ? (error.message as string)
      : null);

  // ✅ Date Inputs
  const renderDateInput = (name: keyof FormData) => (
    <Form>
    <MyInput
      fieldName={name}
      fieldType="date"
      record={formState}
      setRecord={setFormState}
      placeholder="YYYY-MM-DD"
      width="100%"
      showLabel={false}
    />
    </Form>
  );

  return (
    <MyCard
      title={
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="text-primary">⚙️</span>
          <Translate>Lab Interpretation (AI)</Translate>
        </div>
      }
      contant={
        <div className="space-y-5">
          {/* ✅ FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {renderDateInput('dateFrom')}
              {renderDateInput('dateTo')}

              <div className="flex items-end">
                <MyButton
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  appearance="primary"
                  width="100%"
                  backgroundColor="var(--primary-blue)"
                >
                  <Translate>Run AI Interpretation</Translate>
                </MyButton>
              </div>
            </div>
          </form>

          {/* ✅ ERROR */}
          {displayError && (
            <Alert variant="destructive">
              <AlertTitle>
                <Translate>Error</Translate>
              </AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* ✅ RESULT */}
          {interpretation && (
            <div className="space-y-4">

              {/* ✅ Severity */}
              {interpretation.severity && (
                <MyCard
                  title={<Translate>Severity</Translate>}
                  contant={
                    <span
                      className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: getSeverityColor(interpretation.severity) }}
                    >
                      {interpretation.severity.toUpperCase()}
                    </span>
                  }
                />
              )}

              {/* ✅ Findings */}
              {interpretation.key_findings && interpretation.key_findings.length > 0 && (
                <MyCard
                  title={<Translate>Key Findings</Translate>}
                  contant={
                    <div className="space-y-3">
                      {interpretation.key_findings.map((finding, index) => (
                        <MyCard
                          key={index}
                          title={<div className="text-sm font-semibold text-slate-900">{finding.lab_name}</div>}
                          contant={
                            <div className="space-y-3 bg-slate-50 p-3 rounded border">
                              <div className="grid md:grid-cols-2 gap-2">
                                <div>
                                  <div className="text-xs text-slate-500">Value</div>
                                  <div className="text-sm">
                                    {finding.value} {finding.unit && `(${finding.unit})`}
                                  </div>
                                </div>

                                {finding.flag && (
                                  <div>
                                    <div className="text-xs text-slate-500">Flag</div>
                                    <div className="text-sm font-semibold text-red-600">
                                      {finding.flag}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {finding.finding && (
                                <div className="pt-2 border-t text-sm text-slate-700">
                                  {finding.finding}
                                </div>
                              )}
                            </div>
                          }
                        />
                      ))}
                    </div>
                  }
                />
              )}

              {/* ✅ Follow-up */}
              {interpretation.follow_up_considerations &&
                interpretation.follow_up_considerations.length > 0 && (
                  <MyCard
                    title={<Translate>Follow-up Considerations</Translate>}
                    contant={
                      <ul className="list-disc pl-5 text-sm">
                        {interpretation.follow_up_considerations.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    }
                  />
                )}
            </div>
          )}

          {/* ✅ Loading */}
          {isLoading && (
            <Alert>
              <AlertTitle>
                <Translate>Processing</Translate>
              </AlertTitle>
              <AlertDescription>
                <Translate>Interpretation request is in progress...</Translate>
              </AlertDescription>
            </Alert>
          )}
        </div>
      }
    />
  );
};

export default LabInterpretationAI;