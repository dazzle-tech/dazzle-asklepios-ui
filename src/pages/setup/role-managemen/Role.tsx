import MyButton from "@/components/MyButton/MyButton";
import SectionContainer from "@/components/SectionsoContainer";
import React,{useEffect,useState} from "react";
import { Divider, Input, List, Panel } from "rsuite";
type Role = { id: number; name: string; description: string };
const Role=({
  selected,
  setSelected
})=>{

  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: "Admin", description: "Full permissions" },
    { id: 2, name: "Editor", description: "Can edit content" },
    { id: 3, name: "Viewer", description: "View only" },
  ]);
 const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const addRole = () => {
    if (!newRoleName.trim()) return;
    const id = Date.now();
    const r: Role = { id, name: newRoleName.trim(), description: newRoleDesc.trim() };
    setRoles((prev) => {
      const next = [...prev, r];
      return next;
    });
    setNewRoleName("");
    setNewRoleDesc("");
    setSelected(r);
  };


    return  <SectionContainer 
        
        content={ 
            <div className="list-wrapper">
              <List bordered hover>
                {roles.map((r) => (
                  <List.Item
                    key={r.id}
                    className={`list-item ${selected?.id === r.id ? "selected" : ""}`}
                    onClick={() => setSelected(r)}
                  >
                    <div className="item-name">{r.name}</div>
                    <div className="item-desc">{r.description}</div>
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
export default Role;