import React, { useEffect, useState } from "react";
 import Loader_1 from "../../images/ASK_LOADER_1.svg";
 import Loader_2 from "../../images/ASK_LOADER_2.svg";
 import "./Loaders.css";
 import { useSelector } from "react-redux";
 import { RootState } from "@/store";
 
 function SystemLoader() {
   const [currentImage, setCurrentImage] = useState(0);
   const systemLoader = useSelector((state: RootState) => state.ui.systemLoader);
 
   useEffect(() => {
     const interval = setInterval(() => {
       setCurrentImage((prev) => (prev === 0 ? 1 : 0));
     }, 500);
     return () => clearInterval(interval);
   }, []);
 
   if (!systemLoader) return null;  
 
   return (
     <div className="loader-overlay">
       <div className="loader-container">
         <img
           src={currentImage === 0 ? Loader_1 : Loader_2}
           alt="Loader"
           className="loader-image"
         />
       </div>
     </div>
   );
 }
 
 export default SystemLoader;