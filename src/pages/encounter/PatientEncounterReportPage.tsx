import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Loader,
  Panel,
  Stack,
} from 'rsuite';

import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useLazyGetPatientEncountersReportQuery,
} from '@/services/observationServiceNew';

import { newDepartment } from '@/types/model-types-constructor-new';
import { Department } from '@/types/model-types-new';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';

const PatientEncounterReportPage = () => {
  const viewerRef = useRef<HTMLDivElement>(null);

  const [stimulsoftReady, setStimulsoftReady] =
    useState(false);

  const [department, setDepartment] =
    useState<Department>({
      ...newDepartment,
    });

  const [status, setStatus] = useState({
    value: '',
  });

  const [paginationParam] = useState({
    page: 0,
    size: 1000,
    sort: 'id,asc',
  });

  const { data: departmentListResponse } =
    useGetDepartmentsQuery(
      paginationParam
    );

  const TreatmentStatusEnum =
    useEnumOptions(
      'TreatmentStatus'
    );

  const [
    generateReport,
    {
      data,
      isFetching,
    },
  ] =
    useLazyGetPatientEncountersReportQuery();

  // Load Stimulsoft Scripts
  useEffect(() => {
    const script1 =
      document.createElement(
        'script'
      );

    script1.src =
      '/stimulsoft/stimulsoft.reports.js';

    const script2 =
      document.createElement(
        'script'
      );

    script2.src =
      '/stimulsoft/stimulsoft.viewer.js';

    script1.onload = () => {
      console.log(
        'stimulsoft.reports loaded'
      );

      document.body.appendChild(
        script2
      );

      script2.onload = () => {
        console.log(
          'stimulsoft.viewer loaded'
        );

        if (
          (window as any)
            .Stimulsoft
        ) {
          setStimulsoftReady(
            true
          );

          console.log(
            'Stimulsoft Ready'
          );
        }
      };
    };

    document.body.appendChild(
      script1
    );
  }, []);

  // Render Report
  useEffect(() => {
    if (
      !stimulsoftReady
    )
      return;

    const Stimulsoft =
      (window as any)
        .Stimulsoft;

    if (
      !Stimulsoft
    ) {
      console.error(
        'Stimulsoft not found'
      );
      return;
    }

    try {
      const report =
        new Stimulsoft.Report.StiReport();

      report.loadFile(
        '/reports/PatientEncounterReport2.mrt'
      );

      // TEMP TEST DATA
      const json = {
        PatientEncounter: [
          {
            departmentName:
              'Emergency',
            encounterDate:
              '2026-08-17',
            encounterReason:
              'Consultation',
            status:
              'PENDING_PAYMENT',
            encounterType:
              'OUTPATIENT',
          },
        ],
      };

      console.log(
        'JSON:',
        json
      );

      const dataSet =
        new Stimulsoft.System.Data.DataSet(
          'PatientEncounter'
        );

      dataSet.readJson(
        json
      );

      report.regData(
        'PatientEncounter',
        '',
        dataSet
      );

      report.dictionary.synchronize();

      console.log(
        report.dictionary
          .dataSources
      );

      report.renderAsync(
        () => {
          console.log(
            'REPORT READY'
          );

          const viewer =
            new Stimulsoft.Viewer.StiViewer(
              null,
              'StiViewer',
              false
            );

          viewer.report =
            report;

          if (
            viewerRef.current
          ) {
            viewerRef.current.innerHTML =
              '';

            viewer.renderHtml(
              viewerRef.current
            );
          }
        }
      );
    } catch (
      error
    ) {
      console.error(
        'REPORT ERROR:',
        error
      );
    }
  }, [
    stimulsoftReady,
  ]);

  return (
    <div
      style={{
        padding: 24,
      }}
    >
      <Panel
        bordered
        header="Patient Encounter Report"
      >
        <Form>
          <MyInput
            column
            fieldLabel="Select Departments"
            fieldType="select"
            fieldName="id"
            selectData={
              departmentListResponse?.data ??
              []
            }
            selectDataLabel="name"
            selectDataValue="id"
            width={250}
            record={
              department
            }
            setRecord={
              setDepartment
            }
            required
          />

          <MyInput
            column
            width={260}
            fieldType="select"
            fieldLabel="Treatment Status"
            fieldName="value"
            selectData={
              TreatmentStatusEnum
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              status
            }
            setRecord={
              setStatus
            }
          />
        </Form>

        <Stack
          spacing={12}
        >
          <Button
            appearance="primary"
            loading={
              isFetching
            }
            onClick={() =>
              generateReport(
                {
                  departmentId:
                    department?.id,
                  status:
                    status?.value,
                }
              )
            }
          >
            Generate Report
          </Button>
        </Stack>

        <br />

        {isFetching && (
          <Loader
            center
            content="Generating Report..."
          />
        )}

        <div
          ref={
            viewerRef
          }
          style={{
            width: '100%',
            minHeight:
              '800px',
            marginTop: 20,
          }}
        />
      </Panel>
    </div>
  );
};

export default PatientEncounterReportPage;