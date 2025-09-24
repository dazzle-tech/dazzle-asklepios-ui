import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import React,{useEffect,useState} from "react";
import { Divider, Input, List, Panel } from "rsuite";
import {Role} from '@/types/model-types-new';

import { useGetRolesByFacilityQuery} from "@/services/security/roleService";

const Roles=({
  selected,
  setSelected,
  facilityId
})=>{


 const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
 const {  data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useGetRolesByFacilityQuery(facilityId);
 
 const [roles, setRoles] = useState<Role[]>([]);
  const addRole = () => {
    // if (!newRoleName.trim()) return;
    // const id = Date.now();
    // const r: Role = { id, name: newRoleName.trim(), description: newRoleDesc.trim() };
    // setRoles((prev) => {
    //   const next = [...prev, r];
    //   return next;
    // });
    // setNewRoleName("");
    // setNewRoleDesc("");
    // setSelected(r);
  };


    return  <SectionContainer 
        
        content={ 
            <div className="list-wrapper">
              <List bordered hover>
                {rolesData?.map((r) => (
                  <List.Item
                    key={r.id}
                    className={`list-item ${selected?.id === r.id ? "selected" : ""}`}
                    onClick={() => setSelected(r)}
                  >
                    <div className="item-name">{r.name}</div>
                   
                  </List.Item>
                ))}
              </List>
            </div>}
            title={"Roles"}
            button={   <div className="add-form">
              <Input
                placeholder="Role name"
                value={newRoleName}
                onChange={(v: any) => setNewRoleName(v)}
                className="input-name"
              />
              <Input
                placeholder="Description"
                value={newRoleDesc}
                onChange={(v: any) => setNewRoleDesc(v)}
                className="input-desc"
              />
              <MyButton  onClick={addRole}>
                Add
              </MyButton>
            </div>}
            
            />
          

         
}
export default Roles;