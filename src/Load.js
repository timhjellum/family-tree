import React, { useRef } from "react";

const Load = ({ theme, setTheme, onLoadDefault, onLoadFile }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) onLoadFile(file);
    e.target.value = "";
  };

  return (
    <div className="load">
      <button
        className="themeToggle"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div className="loadTitle">
        <h1>family plot</h1>
        <p>render a family tree in 3D from a GEDCOM (.ged) file</p>
      </div>

      <div className="loadActions">
        <button className="sampleButton" onClick={onLoadDefault}>
          View Hjellum Family Tree
        </button>

        <button
          className="sampleButton"
          onClick={() => fileInputRef.current.click()}
        >
          Upload a .ged file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ged"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default Load;
