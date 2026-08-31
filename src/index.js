import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { parse } from "./gedcom/parse";
import { d3ize } from "./gedcom/d3ize";
import Graph from "./Graph";
import Controls from "./Controls";
import Load from "./Load";
import HjellumFamilyTree from "./gedcoms/HjellumFamilyTree.ged";
import "./sass/style.scss";

const readFile = (contents) => {
  const tree = parse(contents);
  return d3ize(tree);
};

const emptyHighlights = {
  node: null,
  family: [],
  links: [],
  spouses: [],
  notDescendent: [],
};

const App = () => {
  // DATA //
  const [d3Data, setD3Data] = useState(null);
  const [treeName, setTreeName] = useState("Hjellum Family Tree");

  // UI STATE //
  const [theme, setTheme] = useState(
    () => localStorage.getItem("family-plot-theme") || "dark",
  );
  const [nameFormat, setNameFormat] = useState(
    () => localStorage.getItem("family-plot-name-format") || "firstLast",
  );
  const [highlights, setHighlights] = useState(emptyHighlights);
  const [highlightedFamily, setHighlightedFamily] = useState(null);
  const [showingLegend, setShowingLegend] = useState(false);
  const [showingSurnames, setShowingSurnames] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const graphRef = useRef();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("family-plot-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("family-plot-name-format", nameFormat);
  }, [nameFormat]);

  useEffect(() => {
    const mobileCheck = () =>
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth < 700,
      );
    mobileCheck();
    window.addEventListener("resize", mobileCheck);
    return () => window.removeEventListener("resize", mobileCheck);
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlights(emptyHighlights);
  }, []);

  // LOAD //
  const loadGed = useCallback((contents, name) => {
    try {
      const data = readFile(contents);
      setD3Data(data);
      setTreeName(name || "family tree");
      clearHighlights();
      setHighlightedFamily(null);
    } catch (err) {
      console.error("Failed to parse GEDCOM file", err);
      alert(
        "Sorry, that file couldn't be read as a GEDCOM (.ged) file. Please double check the file and try again.",
      );
    }
  }, [clearHighlights]);

  const loadDefault = useCallback(() => {
    loadGed(HjellumFamilyTree, "Hjellum Family Tree");
  }, [loadGed]);

  const loadFromFile = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = (e) => loadGed(e.target.result, file.name);
      reader.readAsText(file);
    },
    [loadGed],
  );

  const startOver = useCallback(() => {
    setD3Data(null);
    clearHighlights();
    setHighlightedFamily(null);
  }, [clearHighlights]);

  // RENDER //
  if (!d3Data) {
    return (
      <Load
        theme={theme}
        setTheme={setTheme}
        onLoadDefault={loadDefault}
        onLoadFile={loadFromFile}
      />
    );
  }

  return (
    <>
      <Graph
        d3Data={d3Data}
        highlights={highlights}
        setHighlights={setHighlights}
        highlightedFamily={highlightedFamily}
        showingLegend={showingLegend}
        setShowingLegend={setShowingLegend}
        showingSurnames={showingSurnames}
        setShowingSurnames={setShowingSurnames}
        isMobile={isMobile}
        clearHighlights={clearHighlights}
        theme={theme}
        nameFormat={nameFormat}
        editPanelOpen={false}
        graphRef={graphRef}
        showPhotos={false}
        photoStore={{}}
      />
      <Controls
        d3Data={d3Data}
        treeName={treeName}
        highlights={highlights}
        setHighlights={setHighlights}
        clearHighlights={clearHighlights}
        highlightedFamily={highlightedFamily}
        setHighlightedFamily={setHighlightedFamily}
        showingLegend={showingLegend}
        setShowingLegend={setShowingLegend}
        showingSurnames={showingSurnames}
        setShowingSurnames={setShowingSurnames}
        isMobile={isMobile}
        theme={theme}
        setTheme={setTheme}
        nameFormat={nameFormat}
        setNameFormat={setNameFormat}
        graphRef={graphRef}
        onLoadFile={loadFromFile}
        onStartOver={startOver}
      />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
