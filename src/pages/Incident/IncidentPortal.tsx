import React, { useEffect } from "react";
import { Tabs } from "rsuite";
import { useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Dashboard from "./Dashboard";
import IncidentList from "./IncidentList";
import ReportIncident from "./ReportIncident";
import Settings from "./Settings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faShieldAlt,
    faChartBar,
    faFileAlt,
    faCog,
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from "react-redux";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import ReactDOMServer from "react-dom/server";

const queryClient = new QueryClient();

const IncidentPortal: React.FC = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { patient, encounter, edit } = location.state || {};

    // Page Header
    useEffect(() => {
        const divContent = (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: "#1976d2" }} />
                <h5 style={{ margin: 0 }}>MedCare Incident Portal</h5>
            </div>
        );

        const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

        dispatch(setPageCode("MedCare_Incident_Portal"));
        dispatch(setDivContent(divContentHTML));

        return () => {
            dispatch(setPageCode(""));
            dispatch(setDivContent(" "));
        };
    }, [location.pathname, dispatch]);


    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <div className="min-h-screen bg-background p-4">
                    <Tabs defaultActiveKey="dashboard" appearance="subtle">
                        <Tabs.Tab
                            eventKey="dashboard"
                            title={
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faChartBar} />
                                    <span>Dashboard</span>
                                </div>
                            }
                        >
                            <Dashboard />
                        </Tabs.Tab>
                        <Tabs.Tab
                            eventKey="report"
                            title={
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileAlt} />
                                    <span>Report Incident</span>
                                </div>
                            }
                        >
                            <ReportIncident />
                        </Tabs.Tab>
                        <Tabs.Tab
                            eventKey="incidents"
                            title={
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faShieldAlt} />
                                    <span>Incidents</span>
                                </div>
                            }
                        >
                            <IncidentList />
                        </Tabs.Tab>
                        <Tabs.Tab
                            eventKey="settings"
                            title={
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCog} />
                                    <span>Settings</span>
                                </div>
                            }
                        >
                            <Settings />
                        </Tabs.Tab>
                    </Tabs>
                </div>
            </TooltipProvider>
        </QueryClientProvider>
    );
};

export default IncidentPortal;
