import React, { useEffect, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

// import "survey-core/defaultV2.min.css";
// import "survey-creator-core/survey-creator-core.min.css";

const STORAGE_KEY = "demo-survey-json";

function AdminBuilder() {
  const [creator, setCreator] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creatorOptions = {
      showLogicTab: true,
      isAutoSave: false
    };
    const c = new SurveyCreator(creatorOptions);

    const existingJson = window.localStorage.getItem(STORAGE_KEY);
    if (existingJson) {
      try {
        c.JSON = JSON.parse(existingJson);
      } catch (e) {
        console.error("Error parsing stored survey JSON", e);
      }
    }

    setCreator(c);
  }, []);

  const handleSave = () => {
    if (!creator) return;
    const json = creator.JSON;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!creator) return <div>Loading builder…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin: Dynamic Form Builder</h2>
      <p style={{ marginBottom: 8 }}>
        Build your form here. Click <b>Save Form</b> when you’re done.
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
        <SurveyCreatorComponent creator={creator} />
      </div>

      <button
        onClick={handleSave}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer"
        }}
      >
        💾 Save Form
      </button>

      {saved && (
        <span style={{ marginLeft: 8, color: "green" }}>
          Form saved to localStorage!
        </span>
      )}
    </div>
  );
}

function TakeSurvey() {
  const [surveyJson, setSurveyJson] = useState<any | null>(null);
  const [completedData, setCompletedData] = useState<any | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSurveyJson(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored survey JSON", e);
      }
    }
  }, []);

  if (!surveyJson) {
    return (
      <div style={{ padding: 16 }}>
        <h2>User: Fill the Form</h2>
        <p>No form found. Please create and save one in Admin mode first.</p>
      </div>
    );
  }

  const survey = new Model(surveyJson);
  survey.onComplete.add((sender) => {
    const data = sender.data;
    setCompletedData(data);
    console.log("Survey results:", data);
  });

  return (
    <div style={{ padding: 16 }}>
      <h2>User: Fill the Form</h2>
      <Survey model={survey} />
      {completedData && (
        <div style={{ marginTop: 16 }}>
          <h3>Submitted data (for demo):</h3>
          <pre>{JSON.stringify(completedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function Form() {
  const [mode, setMode] = useState<"admin" | "user">("admin");

  return (
    <div>
      <header
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #ddd",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <h1 style={{ marginRight: "auto" }}>SurveyJS Dynamic Form Demo</h1>
        <button
          onClick={() => setMode("admin")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: mode === "admin" ? "2px solid #333" : "1px solid #ccc",
            background: mode === "admin" ? "#eee" : "#fff",
            cursor: "pointer"
          }}
        >
          Admin Mode
        </button>
        <button
          onClick={() => setMode("user")}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: mode === "user" ? "2px solid #333" : "1px solid #ccc",
            background: mode === "user" ? "#eee" : "#fff",
            cursor: "pointer"
          }}
        >
          User Mode
        </button>
      </header>

      {mode === "admin" ? <AdminBuilder /> : <TakeSurvey />}
    </div>
  );
}
