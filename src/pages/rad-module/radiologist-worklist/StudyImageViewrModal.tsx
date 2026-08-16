import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import { PacsStudyDTO } from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';

interface Props {
  open: boolean;
  onClose: () => void;
  studies: PacsStudyDTO[];
}

const StudyImageViewerModal = ({
  open,
  onClose,
  studies,
}: Props) => {
  return (
    <MyModal
      open={open}
      setOpen={onClose}
      title={`Select Study (${studies.length})`}
      bodyheight="60vh"
      hideActionBtn
      content={
        <div
          className="flex flex-col gap-4 pr-1"
          style={{
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {studies.map(study => {
            const patientName = [
              study.patient?.firstName,
              study.patient?.secondName,
              study.patient?.lastName,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={study.study}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1675e0',
                        marginBottom: '8px',
                      }}
                    >
                      {patientName}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          background: '#e8f3ff',
                          color: '#1675e0',
                          fontSize: '12px',
                        }}
                      >
                        MRN: {study.patient?.id}
                      </span>

                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          background: '#eefbf5',
                          color: '#00a36c',
                          fontSize: '12px',
                        }}
                      >
                        {study.modality || 'N/A'}
                      </span>

                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          background: '#f4f4f5',
                          color: '#555',
                          fontSize: '12px',
                        }}
                      >
                        {study.studyDate}
                      </span>
                    </div>

                    {study.studyDescription && (
                      <div
                        style={{
                          color: '#555',
                          fontSize: '13px',
                        }}
                      >
                        {study.studyDescription}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <MyButton
                      onClick={() =>
                        window.open(
                          study.link,
                          '_blank',
                          'noopener,noreferrer'
                        )
                      }
                    >
                      View Study
                    </MyButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      }
    />
  );
};

export default StudyImageViewerModal;