import React, { useEffect } from "react";

const StimulsoftReportViewer = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const Stimulsoft = (window as any).Stimulsoft;
      if (Stimulsoft && Stimulsoft.Viewer && Stimulsoft.Report) {
        clearInterval(interval);

        const viewer = new Stimulsoft.Viewer.StiViewer(null, 'StiViewer', false);
        viewer.renderHtml("viewerContent");

        const report = new Stimulsoft.Report.StiReport();
        report.loadFile("Report.mrt");

        viewer.report = report;
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return <div id="viewerContent" style={{ width: '100%', height: '800px' }}></div>;
};

export default StimulsoftReportViewer;
