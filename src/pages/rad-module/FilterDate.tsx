import { addFilterToListRequest, getNumericTimestamp } from "@/utils";
import React,{useEffect,useState} from "react";
import { Col, DatePicker, Row } from "rsuite";
const FilterDate=({listOrdersResponse,setListOrdersResponse})=>{
    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(), //new Date(),
        toDate: new Date()
      });
      //when data change update filter of orders
       useEffect(() => {
          if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
      
            const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
      
            setListOrdersResponse(
              addFilterToListRequest(
                'submitted_at',
                'between',
                formattedFromDate + '_' + formattedToDate,
                listOrdersResponse
              )
            );
          } else if (dateFilter.fromDate) {
            const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
            setListOrdersResponse(
              addFilterToListRequest('submitted_at', 'gte', formattedFromDate, listOrdersResponse)
            );
          } else if (dateFilter.toDate) {
            const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
            setListOrdersResponse(
              addFilterToListRequest('submitted_at', 'lte', formattedToDate, listOrdersResponse)
            );
          } else {
            setListOrdersResponse({ ...listOrdersResponse, filters: [] });
          }
        }, [dateFilter]);
       useEffect(() => {
          handleManualSearch();
        }, []);

         const handleManualSearch = () => {
            if (dateFilter.fromDate && dateFilter.toDate) {
              const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
        
              const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
        
              setListOrdersResponse(
                addFilterToListRequest(
                  'submitted_at',
                  'between',
                  formattedFromDate + '_' + formattedToDate,
                  listOrdersResponse
                )
              );
            } else if (dateFilter.fromDate) {
              const formattedFromDate = getNumericTimestamp(dateFilter.fromDate, true);
              setListOrdersResponse(
                addFilterToListRequest('submitted_at', 'gte', formattedFromDate, listOrdersResponse)
              );
            } else if (dateFilter.toDate) {
              const formattedToDate = getNumericTimestamp(dateFilter.toDate, false);
              setListOrdersResponse(
                addFilterToListRequest('submitted_at', 'lte', formattedToDate, listOrdersResponse)
              );
            } else {
              setListOrdersResponse({ ...listOrdersResponse, filters: [] });
            }
          };
    return(<>
  
        <Col md={12}>
         <DatePicker
                          oneTap
                          placeholder="From Date"
                          value={dateFilter.fromDate}
                          onChange={e => setDateFilter({ ...dateFilter, fromDate: e })}
                          style={{
                            width: '100%',
                            marginRight: '5px',
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            height: '30px'
                          }}
                        /></Col>
        <Col md={12}>
         <DatePicker
                          oneTap
                          placeholder="To Date"
                          value={dateFilter.toDate}
                          onChange={e => setDateFilter({ ...dateFilter, toDate: e })}
                          style={{
                            width: '100%',
                            marginRight: '5px',
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            height: '30px'
                          }}
                        /></Col>
  
    </>)
}
export default FilterDate;