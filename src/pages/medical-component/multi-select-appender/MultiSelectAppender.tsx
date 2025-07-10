import React, { useEffect, useState } from "react";
import { Col, Form, Input, Row } from "rsuite";
import MyInput from "@/components/MyInput";

const MultiSelectAppender = ({
    label = "Select",
    options = [],
    optionLabel = "label",
    optionValue = "value",
 
    setObject,
    object
}) => {
    const [selected, setSelected] = useState({ item: null });
    const [list, setList] = useState([]);
        useEffect(() => {
    
    if (object && list.length === 0) {
        const parsedList = object.split(",").map((item) => item.trim()).filter(Boolean);
        setList(parsedList);
    }
}, [object]);
  
      useEffect(()=>{
            setObject(joinValuesFromArray(list))
        },[list])
    
    
        useEffect(() => {
            if (selected?.item != null) {
              const foundItem = options?.find(
                item => item.key === selected?.item
              );
          
              const value = foundItem?.lovDisplayVale;
          
              if (value) {
    
               
                setList(prev => [...prev, foundItem?.lovDisplayVale]);
              } else {
                console.warn("⚠️ Could not find display value for key:", selected?.item);
              }
            }
          }, [selected?.item]);
  const joinValuesFromArray = (values) => {
        return values?.filter(Boolean)?.join(', ');
    };

    return (<Form fluid >
        <Col md={24}>
        <Row>
            <MyInput
                width="100%"
                fieldType="select"
                fieldLabel={label}
                selectData={options}
                selectDataLabel={optionLabel}
                selectDataValue={optionValue}
                fieldName="item"
                record={selected}
                setRecord={setSelected}
            /></Row>
           <Row>
            <Input
                as="textarea"
                onChange={(e) => setObject(e.target.value)}
                value={object}
                rows={3}
                readOnly
                style={{ width: "100%", marginTop: "10px" }}
            /></Row></Col>
    </Form>
  );
};

export default MultiSelectAppender;
