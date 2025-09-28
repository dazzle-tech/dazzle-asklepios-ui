import React, { useState } from "react";

const SliceBox = ({ dailySlices, openDay, onSelectionChange }) => {
  const [selectedSlices, setSelectedSlices] = useState([]);

  const toggleSelect = (sliceKey, index) => {
    if (selectedSlices.includes(sliceKey)) return; 

    let newSelection = [...selectedSlices];

    if (selectedSlices.length === 0) {
      newSelection = [sliceKey];
    } else {
      const selectedIndices = dailySlices[openDay]
        .map((s, i) => (selectedSlices.includes(s.SliceKey) ? i : null))
        .filter((v) => v !== null);

      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);

      if (index === minIndex - 1 || index === maxIndex + 1) {
        newSelection.push(sliceKey);
      } else {
        return;
      }
    }

    setSelectedSlices(newSelection);
    if (onSelectionChange) onSelectionChange(newSelection);
  };

  const unselect = (sliceKey) => {
    let newSelection = [...selectedSlices];

    const selectedIndices = dailySlices[openDay]
      .map((s, i) => (selectedSlices.includes(s.SliceKey) ? i : null))
      .filter((v) => v !== null);

    const minIndex = Math.min(...selectedIndices);
    const maxIndex = Math.max(...selectedIndices);

    const idx = dailySlices[openDay].findIndex((s) => s.SliceKey === sliceKey);

    if (idx === minIndex || idx === maxIndex) {
      newSelection = newSelection.filter((id) => id !== sliceKey);
      setSelectedSlices(newSelection);
      if (onSelectionChange) onSelectionChange(newSelection);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          overflow: "hidden",
          transition: "all 0.3s ease",
          maxHeight: openDay ? "140px" : "0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            padding: "12px 8px",
            maxWidth: "calc((110px + 12px) * 8)",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e0 #f7fafc",
            scrollBehavior: "smooth",
          }}
        >
          {dailySlices[openDay]?.map((slice, i) => {
            const fromStr =
              slice.from instanceof Date && !isNaN(slice.from)
                ? slice.from.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Invalid Date";
            const toStr =
              slice.to instanceof Date && !isNaN(slice.to)
                ? slice.to.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Invalid Date";

            const sliceId = `${openDay}-${i}`;
            const isSelected = selectedSlices.includes(slice.SliceKey);

            const selectedIndices = dailySlices[openDay]
              .map((s, idx) =>
                selectedSlices.includes(s.SliceKey) ? idx : null
              )
              .filter((v) => v !== null);

            const minIndex = selectedIndices.length
              ? Math.min(...selectedIndices)
              : -1;
            const maxIndex = selectedIndices.length
              ? Math.max(...selectedIndices)
              : -1;

            const isRemovable =
              isSelected && (i === minIndex || i === maxIndex);

            const isClickable =
              selectedSlices.length === 0 ||
              isSelected ||
              i === minIndex - 1 ||
              i === maxIndex + 1;

            return (
              <div
                key={sliceId}
                onClick={() =>
                  isClickable && !isSelected && toggleSelect(slice.SliceKey, i)
                }
                style={{
                  width: "110px",
                  height: "85px",
                  backgroundColor: isSelected
                    ? "linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)"
                    : slice.isBreak
                    ? "linear-gradient(135deg, #ffeaea 0%, #f8d7da 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                  border: isSelected
                    ? "2px solid #28a745"
                    : slice.isBreak
                    ? "2px solid #dc3545"
                    : "1px solid #e9ecef",
                  borderRadius: "12px",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? "0 4px 12px rgba(40, 167, 69, 0.25), 0 2px 4px rgba(0,0,0,0.1)"
                    : slice.isBreak
                    ? "0 4px 12px rgba(220, 53, 69, 0.15), 0 2px 4px rgba(0,0,0,0.1)"
                    : "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                  padding: "8px 4px",
                  boxSizing: "border-box",
                  position: "relative",
                  cursor: isClickable ? "pointer" : "not-allowed",
                  opacity: isClickable || isSelected ? 1 : 0.4,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                  background: isSelected
                    ? "linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)"
                    : slice.isBreak
                    ? "linear-gradient(135deg, #ffeaea 0%, #f8d7da 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                }}
                onMouseEnter={(e) => {
                  if (isClickable || isSelected) {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = isSelected
                      ? "0 6px 16px rgba(40, 167, 69, 0.3), 0 4px 8px rgba(0,0,0,0.15)"
                      : slice.isBreak
                      ? "0 6px 16px rgba(220, 53, 69, 0.2), 0 4px 8px rgba(0,0,0,0.15)"
                      : "0 4px 12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable || isSelected) {
                    e.currentTarget.style.transform = isSelected ? "translateY(-2px)" : "translateY(0)";
                    e.currentTarget.style.boxShadow = isSelected
                      ? "0 4px 12px rgba(40, 167, 69, 0.25), 0 2px 4px rgba(0,0,0,0.1)"
                      : slice.isBreak
                      ? "0 4px 12px rgba(220, 53, 69, 0.15), 0 2px 4px rgba(0,0,0,0.1)"
                      : "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)";
                  }
                }}
              >
                {/* Time Display */}
                <div style={{ 
                  fontWeight: "600", 
                  fontSize: "13px",
                  color: isSelected ? "#155724" : slice.isBreak ? "#721c24" : "#495057",
                  marginBottom: "2px",
                  textAlign: "center"
                }}>
                  {fromStr}
                </div>
                <div style={{ 
                  fontSize: "11px",
                  color: isSelected ? "#28a745" : slice.isBreak ? "#dc3545" : "#6c757d",
                  fontWeight: "500",
                  textAlign: "center"
                }}>
                  {toStr}
                </div>

                {/* Break Badge */}
                {slice.isBreak && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      fontSize: "9px",
                      fontWeight: "700",
                      color: "#dc3545",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      border: "1px solid rgba(220, 53, 69, 0.2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    Break
                  </div>
                )}

                {/* Remove Button */}
                {isRemovable && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      unselect(slice.SliceKey);
                    }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                      border: "1px solid rgba(220, 53, 69, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#dc3545",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      userSelect: "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.2)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Remove from selection"
                  >
                    ×
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                      border: "2px solid white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                )}
              </div>
            );
          })}       
        </div>
      </div>
    </div>
  );
};

export default SliceBox;
