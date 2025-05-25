import type React from "react"
import MyTable from "../../MyTable/MyTable"
import Translate from "../../Translate"

interface ToothHistoryTabProps {
  selectedTooth: any
  dentalActionsMap: any
}

const ToothHistoryTab: React.FC<ToothHistoryTabProps> = ({ selectedTooth, dentalActionsMap }) => {
  const columns = [
    {
      key: "actionType",
      title: "Action Type",
      render: (rowData: any) => (
        <small>
          {dentalActionsMap[rowData.actionKey]?.type === "treatment" ? (
            <b style={{ color: "green" }}>Treatment</b>
          ) : (
            <b style={{ color: "red" }}>Condition</b>
          )}
        </small>
      ),
    },
    {
      key: "auditDetails",
      title: "Audit Details",
      render: (rowData: any) => (
        <span>
          <Translate>
            <b>
              {rowData.logType === "SAVE" ? "Added " : rowData.logType === "CHANGE" ? "Changed To" : "Removed "}
            </b>{" "}
          </Translate>
          <Translate> {dentalActionsMap[rowData.actionKey]?.description}</Translate>
          <Translate> @ {rowData.fingerprint}</Translate>
        </span>
      ),
    },
  ]

  return <MyTable data={selectedTooth.toothHistory || []} columns={columns} height={650} />
}

export default ToothHistoryTab
