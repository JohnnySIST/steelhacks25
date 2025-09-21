"use client";
import { useEffect, useState } from "react";
import AuthTable from "../components/AuthTable";
import WordCloudComponent from "../components/WordCloudComponent";
import SankeyDiagram from "../components/SankeyDiagram";

export default function Dashboard() {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const navbar = document.querySelector("nav");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
    }
  }, []);

  return (
    <div
      style={{
        display: "grid", // Changed to grid layout for better control
        gridTemplateColumns: "1fr 1fr", // Left side takes 1/2, right side takes 1/2
        gridTemplateRows: "1fr 1fr", // Right side split into two equal rows
        height: `calc(100vh - ${navbarHeight}px)`,
        padding: "1rem",
        gap: "1rem",
      }}
    >
      {/* Left side: AuthTable */}
      <div
        style={{
          gridColumn: "1 / 2", // Span the first column
          gridRow: "1 / 3", // Span both rows
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1rem",
        }}
      >
        <AuthTable />
      </div>

      {/* Right side: WordCloud and SankeyDiagram */}
      <div
        style={{
          gridColumn: "2 / 3", // Second column
          gridRow: "1 / 2", // First row
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1rem",
        }}
      >
        <WordCloudComponent />
      </div>
      <div
        style={{
          gridColumn: "2 / 3", // Second column
          gridRow: "2 / 3", // Second row
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "1rem",
        }}
      >
        <SankeyDiagram />
      </div>
    </div>
  );
}
