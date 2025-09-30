import MyTable from "@/components/MyTable";
import { formatDateWithoutSeconds } from "@/utils";
import React from "react";

import { useState, useEffect } from 'react';
const CallLog = ({list}) => {
    const columns=[
       
        { key: 'startedBy', title: 'Request Accessed', width: 200,
            render: (row: any) => (
                <span>{row.startedBy}</span>
            )

         },
        { key: 'startedDate', title: 'Date', width: 200,
        render: (row: any) => (
            <span>{formatDateWithoutSeconds(row.startedDate)}</span>
        )
        },

    ]
  return (
   <MyTable 
    columns={columns}
    data={list ??[]}
   />
    );
};
export default CallLog;