"use client"

import type React from "react"
import { Button } from "rsuite"
import Trash from "@rsuite/icons/Trash"
import MyTable from "../../MyTable/MyTable"
import Translate from "../../Translate"

interface ToothCdtTabProps {
  selectedTooth: any
  cdtMap: any
}

const ToothCdtTab: React.FC<ToothCdtTabProps> = ({ selectedTooth, cdtMap }) => {
  const handleRemoveCdt = (rowIndex: number) => {
    console.log("Remove CDT at index:", rowIndex)
    // Implement remove CDT logic here
  }

  const columns = [
    {
      key: "code",
      title: "Code",
      align: "center" as const,
      render: (rowData: any) => <Translate>{cdtMap[rowData.cdtKey]?.cdtCode ?? rowData.cdtKey}</Translate>,
    },
    {
      key: "cdt",
      title: "CDT",
      align: "center" as const,
      render: (rowData: any) => <Translate>{cdtMap[rowData.cdtKey]?.description ?? "Loading..."}</Translate>,
    },
    {
      key: "surface",
      title: "Surface",
      align: "center" as const,
      render: (rowData: any) => (rowData.surfaceLvalue ? rowData.surfaceLvalue.lovDisplayVale : rowData.surfaceLkey),
    },
    {
      key: "source",
      title: "Source",
      align: "center" as const,
      render: (rowData: any) => <Translate>{rowData.source}</Translate>,
    },
    {
      key: "remove",
      title: "Remove",
      align: "center" as const,
      render: (rowData: any, rowIndex: number) => (
        <Button appearance="primary" color="red" size="sm" onClick={() => handleRemoveCdt(rowIndex)}>
          <Trash />
        </Button>
      ),
    },
  ]

  return <MyTable data={selectedTooth.toothCdts || []} columns={columns} height={400} />
}

export default ToothCdtTab
