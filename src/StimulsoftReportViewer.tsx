import type { ApPatient } from '@/types/model-types';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stimulsoft } from 'stimulsoft-reports-js-react/viewer';
import BackButton from './components/BackButton/BackButton';

type PatientWithImage = ApPatient & {
  profilePictureUrl?: string;
  secondaryDocuments?: any[];
};

const StimulsoftReportViewer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient = (location.state as any)?.patient as PatientWithImage | undefined;

  useEffect(() => {
    if (!patient) {
      navigate(-1);
      return;
    }

    console.log('Patient data:', patient);

    const report = new Stimulsoft.Report.StiReport();

    try {
      const savedReportJson = localStorage.getItem('edited_report');
      if (savedReportJson) {
        report.load(savedReportJson);
      } else {
        report.loadFile('/reports/patient.mrt');
      }

      try {
        if (report.pages && report.pages.count > 0) {
          const page = report.pages.getByIndex(0);

          page.brush = new Stimulsoft.Base.Drawing.StiSolidBrush(
            Stimulsoft.System.Drawing.Color.white
          );
        }
      } catch (error) {
        console.log('Could not set page background color:', error);
      }

      const patientData = {
        PatientData: [
          {
            fullName: patient.fullName || '',
            patientMrn: patient.patientMrn || '',
            firstName: patient.firstName || '',
            secondName: (patient as any).secondName || '',
            thirdName: (patient as any).thirdName || '',
            lastName: patient.lastName || '',
            dob: patient.dob || '',
            'genderLvalue.lovDisplayVale': (patient as any).genderLvalue?.lovDisplayVale || '',
            'patientClassLvalue.lovDisplayVale':
              (patient as any).patientClassLvalue?.lovDisplayVale || '',
            phoneNumber: (patient as any).phoneNumber || '',
            mobileNumber:
              (patient as any).mobileNumber || (patient as any).secondaryMobileNumber || '',
            secondaryMobileNumber: (patient as any).secondaryMobileNumber || '',
            homePhone: (patient as any).homePhone || '',
            workPhone: (patient as any).workPhone || '',
            email: (patient as any).email || '',
            streetAddressLine1: (patient as any).streetAddressLine1 || '',
            streetAddressLine2: (patient as any).streetAddressLine2 || '',
            'cityLvalue.lovDisplayVale': (patient as any).cityLvalue?.lovDisplayVale || '',
            'stateProvinceRegionLvalue.lovDisplayVale':
              (patient as any).stateProvinceRegionLvalue?.lovDisplayVale || '',
            'countryLvalue.lovDisplayVale': (patient as any).countryLvalue?.lovDisplayVale || '',
            postalCode: (patient as any).postalCode || '',
            'documentTypeLvalue.lovDisplayVale':
              (patient as any).documentTypeLvalue?.lovDisplayVale || '',
            documentNo: (patient as any).documentNo || '',
            'documentCountryLvalue.lovDisplayVale':
              (patient as any).documentCountryLvalue?.lovDisplayVale || '',
            hasAllergy: (patient as any).hasAllergy ? 'Yes' : 'No',
            hasWarning: (patient as any).hasWarning ? 'Yes' : 'No',
            verified: (patient as any).verified ? 'Yes' : 'No',
            incompletePatient: (patient as any).incompletePatient ? 'Yes' : 'No'
          }
        ]
      };

      const secondaryDocumentsArray =
        patient?.secondaryDocuments && Array.isArray(patient.secondaryDocuments)
          ? patient.secondaryDocuments
          : [];

      const reportData = {
        ...patientData,
        SecondaryDocuments: secondaryDocumentsArray.map((doc: any) => ({
          'documentCountryLvalue.lovDisplayVale':
            doc.documentCountryLvalue && doc.documentCountryLvalue.lovDisplayVale
              ? doc.documentCountryLvalue.lovDisplayVale
              : '',
          'documentTypeLvalue.lovDisplayVale':
            doc.documentTypeLvalue && doc.documentTypeLvalue.lovDisplayVale
              ? doc.documentTypeLvalue.lovDisplayVale
              : '',
          documentNo: doc.documentNo || ''
        }))
      };

      console.log('SecondaryDocuments for report = ', reportData.SecondaryDocuments);

      const dataSet = new Stimulsoft.System.Data.DataSet('DataSet');
      dataSet.readJson(reportData);

      report.regData('DataSet', 'DataSet', dataSet);
      report.dictionary.synchronize();

      console.log('Report loaded successfully');
    } catch (e) {
      console.error('Error loading report:', e);
    }

    const viewerOptions = new Stimulsoft.Viewer.StiViewerOptions();
    viewerOptions.appearance.rightToLeft = false;
    viewerOptions.toolbar.showDesignButton = false;
    viewerOptions.appearance.theme = Stimulsoft.Viewer.StiViewerTheme.Office2022LightGrayBlue;
    viewerOptions.exports.showExportDialog = true;
    viewerOptions.appearance.backgroundColor = Stimulsoft.System.Drawing.Color.white;
    viewerOptions.appearance.pageBorderColor = Stimulsoft.System.Drawing.Color.fromArgb(
      204,
      204,
      204
    );

    const viewer = new Stimulsoft.Viewer.StiViewer(viewerOptions, 'StiViewer', false);
    viewer.report = report;
    viewer.renderHtml('viewerContent');
  }, [patient, navigate]);

  const goBack = () => {
    navigate(-1);
  };
  return (
    <>
      <div
        style={{
          margin: '6px',
          marginTop: '2px',
          cursor: 'pointer'
        }}
      >
        <BackButton onClick={goBack} appearance="ghost" />
      </div>

      <div id="viewerContent" style={{ width: '100%', height: '140vh' }} />
    </>
  );
};

export default StimulsoftReportViewer;
