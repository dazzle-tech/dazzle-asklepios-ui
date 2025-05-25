"use client"

import type React from "react"
import { Button, Panel, SelectPicker } from "rsuite"
import Trash from "@rsuite/icons/Trash"
import MyTable from "../../MyTable/MyTable"
import Translate from "../../Translate"

interface ToothServicesTabProps {
  selectedTooth: any
  currentToothService: any
  setCurrentToothService: (service: any) => void
  dentalServicesList: any[]
  dentalServicesMap: any
  addService: () => void
  servicesLoading: boolean
}

const ToothServicesTab: React.FC<ToothServicesTabProps> = ({
  selectedTooth,
  currentToothService,
  setCurrentToothService,
  dentalServicesList,
  dentalServicesMap,
  addService,
  servicesLoading,
}) => {
  const handleRemoveService = (rowIndex: number) => {
    console.log("Remove service at index:", rowIndex)
    // Implement remove service logic here
  }

  const columns = [
    {
      key: "service",
      title: "Service",
      align: "center" as const,
      render: (rowData: any) => <Translate>{dentalServicesMap[rowData.serviceKey]?.name}</Translate>,
    },
    {
      key: "source",
      title: "Source",
      align: "center" as const,
      render: (rowData: any) => <Translate>{rowData.source}</Translate>,
    },
    {
      key: "price",
      title: "Price",
      align: "center" as const,
      render: (rowData: any) => <Translate>{dentalServicesMap[rowData.serviceKey]?.price}</Translate>,
    },
    {
      key: "remove",
      title: "Remove",
      align: "center" as const,
      render: (rowData: any, rowIndex: number) => (
        <Button appearance="primary" color="red" size="sm" onClick={() => handleRemoveService(rowIndex)}>
          <Trash />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <SelectPicker
        style={{ width: "30%", marginRight: "10px" }}
        placeholder={<Translate>Select Service From List</Translate>}
        value={currentToothService.serviceKey}
        loading={servicesLoading}
        onChange={(e) =>
          setCurrentToothService({
            ...currentToothService,
            serviceKey: e,
          })
        }
        data={dentalServicesList}
        labelKey="name"
        valueKey="key"
      />
      <Button style={{ marginRight: "10px" }} appearance="primary" color="green" onClick={addService}>
        <Translate>Add Service</Translate>
      </Button>
      <hr />
      <Panel
        header={
          <>
            <Translate>Applied Services on Tooth</Translate> <b># {selectedTooth.toothNumber}</b>
          </>
        }
        bordered
      >
        <MyTable data={selectedTooth.toothServices || []} columns={columns} height={400} />
      </Panel>
    </div>
  )
}

export default ToothServicesTab
