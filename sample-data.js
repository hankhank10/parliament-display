(function attachSampleControls() {
  const archSample = {
    type: "arch",
    options: {
      showLegend: true,
      showMajorityLine: true
    },
    parties: [
      { name: "Left Alliance", color: "#dc2626", seats: 132 },
      { name: "Greens", color: "#16a34a", seats: 31 },
      { name: "Centre", color: "#f59e0b", seats: 88 },
      { name: "Liberal", color: "#0ea5e9", seats: 54 },
      { name: "Right Bloc", color: "#1d4ed8", seats: 110 }
    ]
  };

  const westminsterSample = {
    type: "westminster",
    options: {
      showLegend: true,
      showWestminsterHeaders: true
    },
    parties: [
      { name: "Gov Party A", color: "#ef4444", seats: 220, side: "government" },
      { name: "Gov Party B", color: "#f97316", seats: 40, side: "government" },
      { name: "Opp Party A", color: "#2563eb", seats: 180, side: "opposition" },
      { name: "Opp Party B", color: "#06b6d4", seats: 45, side: "opposition" },
      { name: "Opp Party C", color: "#64748b", seats: 15, side: "opposition" }
    ]
  };

  const archBtn = document.getElementById("seed-arch-btn");
  const westBtn = document.getElementById("seed-westminster-btn");

  function loadSample(sample) {
    if (!window.parliamentChart) {
      return;
    }
    window.parliamentChart.loadData(sample);
  }

  if (archBtn) {
    archBtn.addEventListener("click", () => loadSample(archSample));
  }

  if (westBtn) {
    westBtn.addEventListener("click", () => loadSample(westminsterSample));
  }

  loadSample(archSample);
})();
