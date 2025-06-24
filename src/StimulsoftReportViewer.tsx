// import React, { useEffect } from 'react';
// import 'stimulsoft-reports-js/Scripts/stimulsoft.reports.js';
// import 'stimulsoft-reports-js/Scripts/stimulsoft.viewer.js';

// const loadScriptSafely = (src: string) =>
//   new Promise<void>((resolve, reject) => {
//     function appendWhenReady() {
//       if (!document || !document.body) {
//         console.warn('⚠️ DOM غير جاهز بعد، ننتظر...');
//         return setTimeout(appendWhenReady, 50);
//       }

//       const script = document.createElement('script');
//       script.src = src;
//       script.async = true;
//       script.onload = () => {
//         console.log(`✅ تم تحميل السكربت: ${src}`);
//         resolve();
//       };
//       script.onerror = (e) => {
//         console.error(`❌ فشل تحميل السكربت: ${src}`, e);
//         reject(e);
//       };

//       document.body.appendChild(script);
//     }

//     // انتظر DOM جاهز
//     if (document.readyState === 'loading') {
//       window.addEventListener('DOMContentLoaded', appendWhenReady);
//     } else {
//       appendWhenReady();
//     }
//   });

// const StimulsoftReportViewer = () => {
//   useEffect(() => {
//     const loadStimulsoft = async () => {
//       try {

//         await loadScriptSafely('stimulsoft.reports.js');
//         await loadScriptSafely('stimulsoft.viewer.js');

//         const Stimulsoft = (window as any).Stimulsoft;
//         if (!Stimulsoft) throw new Error('Stimulsoft لم يُحمّل من السكربت');

//         const report = new Stimulsoft.Report.StiReport();
//         report.loadFile('/reports/Report.mrt'); // تأكد أنه داخل مجلد public

//         const viewer = new Stimulsoft.Viewer.StiViewer(null, 'StiViewer', false);
//         viewer.report = report;
//         viewer.renderHtml('viewerContent');
//       } catch (err) {
//         console.error('❌ خطأ في تحميل وعرض التقرير:', err);
//       }
//     };

//     loadStimulsoft();
//   }, []);

//   return <div id="viewerContent" style={{ width: '100%', height: '800px' }} />;
// };

// export default StimulsoftReportViewer;

// import React, { useEffect } from 'react';

// const loadScriptSafely = (src: string): Promise<void> =>
//   new Promise((resolve, reject) => {
//     const script = document.createElement('script');
//     script.src = src;
//     script.async = true;
//     script.onload = () => resolve();
//     script.onerror = (e) => reject(e);
//     document.body.appendChild(script);
//   });

// const StimulsoftReportViewer = () => {
//   useEffect(() => {
//     const loadViewer = async () => {
//       try {
//         await loadScriptSafely('/stimulsoft.reports.js');
//         await loadScriptSafely('/stimulsoft.viewer.js');

//         const Stimulsoft = (window as any).Stimulsoft;
//         if (!Stimulsoft) throw new Error('Stimulsoft غير متوفر على window');

//         const options = new Stimulsoft.Viewer.StiViewerOptions();
//         options.appearance.fullScreenMode = true;

//         const viewer = new Stimulsoft.Viewer.StiViewer(options, "StiViewer", false);
//         const report = new Stimulsoft.Report.StiReport();
//         report.loadFile("/reports/Report.mrt");

//         viewer.report = report;
//         viewer.renderHtml("viewer-content");
//       } catch (err) {
//         console.error("فشل تحميل السكربتات:", err);
//       }
//     };

//     loadViewer();
//   }, []);

//   return (
//     <div>
//       <h2>Stimulsoft Report Viewer</h2>
//       <div id="viewer-content" style={{ width: '100%', height: '800px' }}></div>
//     </div>
//   );
// };

// export default StimulsoftReportViewer;
// StimulsoftReportViewer.jsx

// import React from 'react';
// import { Viewer, Stimulsoft } from 'stimulsoft-reports-js-react/viewer';

// const StimulsoftReportViewer= () =>  {
//     var report = new Stimulsoft.Report.StiReport();
//     report.loadFile('../public/reports/Report.mrt');

//     var viewerOptions = new Stimulsoft.Viewer.StiViewerOptions();
//     viewerOptions.appearance.rightToLeft = true;

//     return <Viewer options={viewerOptions} report={report} />;
// }

// export default StimulsoftReportViewer;
//////////////////////////////////////////////////////////this ready
// import React, { useEffect } from 'react';
// import { Viewer, Stimulsoft } from 'stimulsoft-reports-js-react/viewer';

// const StimulsoftReportViewer = () => {
//   useEffect(() => {
//     const report = new Stimulsoft.Report.StiReport();

//     try {
//        // report.loadFile(process.env.PUBLIC_URL + '/reports/Report.mrt');
//        report.loadFile('public/reports/reports.mrt');
//        report.dictionary.databases.add(new Stimulsoft.System.Data.StiCsvDatabase("CSV", "/data/Book1.csv", true, true, ","));


//     } catch (e) {
//         console.error('Error loading .mrt file:', e);
//     }

//     const viewerOptions = new Stimulsoft.Viewer.StiViewerOptions();
//     viewerOptions.appearance.rightToLeft = true;

//     const viewer = new Stimulsoft.Viewer.StiViewer(viewerOptions, 'StiViewer', false);
//     viewer.report = report;
//     viewer.renderHtml('viewerContent');
// }, []);

//     return <div id="viewerContent" style={{ width: '100%', height: '100vh' }}></div>;
// };

// export default StimulsoftReportViewer;

import React, { useEffect } from 'react';
import { Viewer, Stimulsoft } from 'stimulsoft-reports-js-react/viewer';

// للتأكد أن TypeScript يتعرف على الكائنات الديناميكية
declare global {
  interface Window {
    Stimulsoft: any;
  }
}

const StimulsoftReportViewer = () => {
  useEffect(() => {
    const report = new Stimulsoft.Report.StiReport();

    try {
      // ✅ تحميل التقرير (المسار الصحيح بدون "public/")
      report.loadFile('public/reports/patient.mrt');

      // ✅ ربط قاعدة بيانات CSV باستخدام طريقة آمنة مع TypeScript
      const csvDb = new (Stimulsoft as any).System.Data.StiCsvDatabase(
        'CSV',
        'public/data/patient.csv', // يجب أن يكون داخل public/data
        true,   // First row as column names
        true,   // Use delimiters
        ','     // Separator
      );

      report.dictionary.databases.clear();
      report.dictionary.databases.add(csvDb);

    } catch (e) {
      console.error('Error loading .mrt or .csv file:', e);
    }

    // ✅ إعدادات العرض
    const viewerOptions = new Stimulsoft.Viewer.StiViewerOptions();
    viewerOptions.appearance.rightToLeft = true;

    const viewer = new Stimulsoft.Viewer.StiViewer(viewerOptions, 'StiViewer', false);
    viewer.report = report;
    viewer.renderHtml('viewerContent');
  }, []);

  return <div id="viewerContent" style={{ width: '100%', height: '100vh' }}></div>;
};

export default StimulsoftReportViewer;

