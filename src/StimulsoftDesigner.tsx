import React, { useEffect, useRef } from "react";
import { Stimulsoft } from 'stimulsoft-reports-js-react/designer';

const ReportDesigner = () => {
  const designerRef = useRef(null);
  const reportRef = useRef<any>(null); // لتخزين التقرير

  useEffect(() => {
    const options = new Stimulsoft.Designer.StiDesignerOptions();
    options.appearance.fullScreenMode = true; // وضع ملء الشاشة

    const designer = new Stimulsoft.Designer.StiDesigner(options, "StiDesigner", false);
    const report = new Stimulsoft.Report.StiReport();

    const savedReportJson = localStorage.getItem("edited_report");
    if (savedReportJson) {
      report.load(savedReportJson);
    } else {
      report.loadFile("public/reports/patient.mrt");
    }

    designer.report = report;
    designer.renderHtml(designerRef.current);

    reportRef.current = report;
  }, []);

  const handleSave = () => {
    const json = reportRef.current.saveToJsonString();
    localStorage.setItem("edited_report", json);
    alert("✅ تم حفظ التعديل");
  };

  return (
    <>
    <button
        onClick={handleSave}
        style={{
          position: "absolute",
          top: 10,
          left: 30,
          zIndex: 1000,
          padding: "10px 15px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        💾 حفظ التعديل
      </button>

    <div style={{ position: "relative", width: "100%", height: "90vh" }}>
      {/* زر حفظ فوق المصمم */}
      
      {/* واجهة المصمم */}
      <div ref={designerRef} style={{ width: "100%", height: "100%" }} />
    </div></>
  );
};

export default ReportDesigner;
