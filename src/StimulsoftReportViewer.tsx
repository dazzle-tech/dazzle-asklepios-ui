import React, { useEffect } from 'react';

const loadScriptSafely = (src: string) =>
  new Promise<void>((resolve, reject) => {
    function appendWhenReady() {
      if (!document || !document.body) {
        console.warn('⚠️ DOM غير جاهز بعد، ننتظر...');
        return setTimeout(appendWhenReady, 50);
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log(`✅ تم تحميل السكربت: ${src}`);
        resolve();
      };
      script.onerror = (e) => {
        console.error(`❌ فشل تحميل السكربت: ${src}`, e);
        reject(e);
      };

      document.body.appendChild(script);
    }

    // انتظر DOM جاهز
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', appendWhenReady);
    } else {
      appendWhenReady();
    }
  });

const StimulsoftReportViewer = () => {
  useEffect(() => {
    const loadStimulsoft = async () => {
      try {
        await loadScriptSafely('https://cdn.stimulsoft.com/js/stimulsoft.reports.js');
        await loadScriptSafely('https://cdn.stimulsoft.com/js/stimulsoft.viewer.js');

        const Stimulsoft = (window as any).Stimulsoft;
        if (!Stimulsoft) throw new Error('Stimulsoft لم يُحمّل من السكربت');

        const report = new Stimulsoft.Report.StiReport();
        report.loadFile('/reports/Report.mrt'); // تأكد أنه داخل مجلد public

        const viewer = new Stimulsoft.Viewer.StiViewer(null, 'StiViewer', false);
        viewer.report = report;
        viewer.renderHtml('viewerContent');
      } catch (err) {
        console.error('❌ خطأ في تحميل وعرض التقرير:', err);
      }
    };

    loadStimulsoft();
  }, []);

  return <div id="viewerContent" style={{ width: '100%', height: '800px' }} />;
};

export default StimulsoftReportViewer;
