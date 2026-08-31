import React, { useState, useRef, useMemo, useCallback } from "react";

const Controls = ({
  d3Data,
  treeName,
  highlights,
  clearHighlights,
  highlightedFamily,
  setHighlightedFamily,
  showingLegend,
  setShowingLegend,
  showingSurnames,
  setShowingSurnames,
  isMobile,
  theme,
  setTheme,
  nameFormat,
  setNameFormat,
  graphRef,
  onLoadFile,
  onStartOver,
}) => {
  // STATE //
  const [searchTerm, setSearchTerm] = useState("");
  const [showingSearch, setShowingSearch] = useState(false);
  const [showingSettings, setShowingSettings] = useState(false);
  const fileInputRef = useRef();

  // Mobile bottom sheet: "closed" | "peek" | "expanded"
  const [sheetState, setSheetState] = useState("peek");
  const dragInfo = useRef({ dragging: false, startY: 0, startState: "peek" });

  // DISPLAY NAME //
  const displayName = useCallback(
    (node) => {
      if (!node) return "?";
      if (node.firstName === "?") return node.name;
      if (node.firstName === node.surname) return node.firstName;
      return nameFormat === "lastFirst"
        ? `${node.surname}, ${node.firstName}`
        : `${node.firstName} ${node.surname}`;
    },
    [nameFormat],
  );

  // SEARCH //
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.trim().toLowerCase();
    return d3Data.nodes
      .filter((n) => n.name.toLowerCase().includes(term))
      .slice(0, 20);
  }, [searchTerm, d3Data]);

  const zoomToNode = useCallback(
    (node) => {
      const fg = graphRef.current;
      if (!fg || node.x == null) return;
      const distance = 220;
      const distRatio =
        1 + distance / Math.hypot(node.x, node.y || 0, node.z || 0 || 1);
      fg.cameraPosition(
        {
          x: (node.x || 0.1) * distRatio,
          y: (node.y || 0.1) * distRatio,
          z: (node.z || 0.1) * distRatio,
        },
        node,
        1200,
      );
    },
    [graphRef],
  );

  const handleSelectResult = (node) => {
    zoomToNode(node);
    setSearchTerm("");
    setShowingSearch(false);
  };

  // SURNAMES //
  const surnameList = useMemo(
    () => (d3Data.surnameList || []).slice().sort((a, b) => b.count - a.count),
    [d3Data],
  );

  const toggleSurname = (surname) => {
    setHighlightedFamily(highlightedFamily === surname ? null : surname);
  };

  // NODE INFO //
  const nodeInfoInsert = () => {
    const node = highlights.node;
    if (!node) return null;

    const relatives = (highlights.family || [])
      .filter((id) => id !== node.id)
      .map((id) => d3Data.nodes.find((n) => n.id === id))
      .filter(Boolean);

    return (
      <div className="nodeInfo">
        <button className="closeButton" onClick={clearHighlights} aria-label="Close">
          ×
        </button>
        <h2 style={{ color: node.color }}>{displayName(node)}</h2>
        {node.title && <p className="nodeTitle">{node.title}</p>}
        <p>
          {node.dob !== "?" ? `Born ${node.dob}` : node.yob !== "?" ? `b. ${node.yob}` : ""}
          {node.pob ? ` in ${node.pob}` : ""}
        </p>
        {(node.dod !== "?" || node.yod === "Present") && (
          <p>
            {node.dod !== "?" ? `Died ${node.dod}` : ""}
            {node.pod ? ` in ${node.pod}` : ""}
          </p>
        )}
        {node.bio && <p className="nodeBio">{node.bio}</p>}
        {relatives.length > 0 && (
          <div className="nodeRelatives">
            <h3>Related</h3>
            <ul>
              {relatives.map((r) => (
                <li key={r.id} onClick={() => zoomToNode(r)}>
                  {displayName(r)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // MOBILE BOTTOM SHEET //
  const onDragStart = (clientY) => {
    dragInfo.current = { dragging: true, startY: clientY, startState: sheetState };
  };
  const onDragMove = (clientY) => {
    if (!dragInfo.current.dragging) return;
    const delta = clientY - dragInfo.current.startY;
    if (delta < -40) setSheetState("expanded");
    else if (delta > 40) setSheetState(dragInfo.current.startState === "expanded" ? "peek" : "closed");
  };
  const onDragEnd = () => {
    dragInfo.current.dragging = false;
  };

  const touchHandlers = isMobile
    ? {
        onTouchStart: (e) => onDragStart(e.touches[0].clientY),
        onTouchMove: (e) => onDragMove(e.touches[0].clientY),
        onTouchEnd: onDragEnd,
      }
    : {};

  const handleUploadClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) onLoadFile(file);
    e.target.value = "";
    setShowingSettings(false);
  };

  return (
    <div className={`controls ${isMobile ? "mobile" : "desktop"} sheet-${isMobile ? sheetState : "expanded"}`}>
      {/* TOP BAR */}
      <div className="topBar">
        <div className="treeName">{treeName}</div>

        <div className="topBarActions">
          <button
            className="iconButton"
            onClick={() => setShowingSearch((s) => !s)}
            aria-label="Search"
          >
            🔍
          </button>
          <button
            className="iconButton"
            onClick={() => setShowingSurnames((s) => !s)}
            aria-label="Surnames"
          >
            👪
          </button>
          <button
            className="iconButton"
            onClick={() => setShowingSettings((s) => !s)}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </div>

      {showingSearch && (
        <div className="searchPanel">
          <input
            autoFocus
            type="text"
            placeholder="Search by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchResults.length > 0 && (
            <ul className="searchResults">
              {searchResults.map((n) => (
                <li key={n.id} onClick={() => handleSelectResult(n)}>
                  {displayName(n)}
                  {n.yob !== "?" ? ` (${n.yob})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showingSurnames && (
        <div className="surnamePanel">
          <ul>
            {surnameList.map((s) => (
              <li
                key={s.surname}
                className={highlightedFamily === s.surname ? "active" : ""}
                onClick={() => toggleSurname(s.surname)}
              >
                <span className="swatch" style={{ backgroundColor: s.color }} />
                {s.surname} ({s.count})
              </li>
            ))}
          </ul>
        </div>
      )}

      {showingSettings && (
        <div className="settingsPanel">
          <div className="settingsRow">
            <span>Theme</span>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "Dark" : "Light"}
            </button>
          </div>
          <div className="settingsRow">
            <span>Name order</span>
            <div className="pillGroup">
              <button
                className={nameFormat === "firstLast" ? "active" : ""}
                onClick={() => setNameFormat("firstLast")}
              >
                First Last
              </button>
              <button
                className={nameFormat === "lastFirst" ? "active" : ""}
                onClick={() => setNameFormat("lastFirst")}
              >
                Last, First
              </button>
            </div>
          </div>
          <div className="settingsRow">
            <span>Legend</span>
            <button onClick={() => setShowingLegend((v) => !v)}>
              {showingLegend ? "Hide" : "Show"}
            </button>
          </div>
          <div className="settingsRow">
            <button className="fullWidth" onClick={handleUploadClick}>
              Load a different .ged file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ged"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
          <div className="settingsRow">
            <button className="fullWidth" onClick={onStartOver}>
              Back to start screen
            </button>
          </div>
          {!isMobile && (
            <p className="controlsHelp">
              Drag to rotate · scroll to zoom · click a person for details
            </p>
          )}
          {isMobile && (
            <p className="controlsHelp">
              Drag to rotate · pinch to zoom · tap a person for details
            </p>
          )}
        </div>
      )}

      {showingLegend && (
        <div className="legendPanel">
          <p>
            <span className="legendSwatch romantic" /> marriage / partnership
          </p>
          <p>
            <span className="legendSwatch normal" /> parent / child
          </p>
        </div>
      )}

      {highlights.node && (
        <div className="nodeInfoPanel" {...touchHandlers}>
          {isMobile && <div className="dragHandle" />}
          {nodeInfoInsert()}
        </div>
      )}
    </div>
  );
};

export default Controls;
