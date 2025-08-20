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
            gap: "8px",
            overflowX: "auto",
            padding: "8px 0",
            maxWidth: "calc((100px + 8px) * 8)",
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
                  width: "100px",
                  height: "80px",
                  backgroundColor: isSelected
                    ? "#d6f5d6"
                    : slice.isBreak
                    ? "#ffcfcf"
                    : "white",
                  border: "1.5px solid #ccc",
                  borderRadius: "10px",
                  fontSize: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  padding: "2px",
                  boxSizing: "border-box",
                  position: "relative",
                  cursor: isClickable ? "pointer" : "not-allowed",
                  opacity: isClickable || isSelected ? 1 : 0.3,
                }}
              >
                <div style={{ fontWeight: "bold" }}>{fromStr}</div>
                <div>{toStr}</div>
                {slice.isBreak && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      right: "2px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "red",
                    }}
                  >
                    BREAK
                  </div>
                )}
                {isRemovable && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      unselect(slice.SliceKey);
                    }}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "red",
                      cursor: "pointer",
                    }}
                  >
                    ✖
                  </div>
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
