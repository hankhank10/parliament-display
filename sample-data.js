(function attachSampleControls() {
  const arch500Sample = {
    type: "arch",
    options: {
      showLegend: true,
      showMajorityLine: true
    },
    parties: [
      { name: "Left Alliance", color: "#dc2626", seats: 160 },
      { name: "Greens", color: "#16a34a", seats: 38 },
      { name: "Centre", color: "#f59e0b", seats: 107 },
      { name: "Liberal", color: "#0ea5e9", seats: 65 },
      { name: "Right Bloc", color: "#1d4ed8", seats: 130 }
    ]
  };

  const arch100Sample = {
    type: "arch",
    options: {
      showLegend: true,
      showMajorityLine: true
    },
    parties: [
      { name: "Left Alliance", color: "#dc2626", seats: 32 },
      { name: "Greens", color: "#16a34a", seats: 8 },
      { name: "Centre", color: "#f59e0b", seats: 21 },
      { name: "Liberal", color: "#0ea5e9", seats: 13 },
      { name: "Right Bloc", color: "#1d4ed8", seats: 26 }
    ]
  };

  const westminster500Sample = {
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

  const westminster100Sample = {
    type: "westminster",
    options: {
      showLegend: true,
      showWestminsterHeaders: true
    },
    parties: [
      { name: "Gov Party A", color: "#ef4444", seats: 44, side: "government" },
      { name: "Gov Party B", color: "#f97316", seats: 8, side: "government" },
      { name: "Opp Party A", color: "#2563eb", seats: 36, side: "opposition" },
      { name: "Opp Party B", color: "#06b6d4", seats: 9, side: "opposition" },
      { name: "Opp Party C", color: "#64748b", seats: 3, side: "opposition" }
    ]
  };

  const arch500Btn = document.getElementById("seed-arch-500-btn");
  const arch100Btn = document.getElementById("seed-arch-100-btn");
  const west500Btn = document.getElementById("seed-westminster-500-btn");
  const west100Btn = document.getElementById("seed-westminster-100-btn");

  function loadSample(sample) {
    if (!window.parliamentChart) {
      return;
    }
    window.parliamentChart.loadData(sample);
  }

  if (arch500Btn) {
    arch500Btn.addEventListener("click", () => loadSample(arch500Sample));
  }

  if (arch100Btn) {
    arch100Btn.addEventListener("click", () => loadSample(arch100Sample));
  }

  if (west500Btn) {
    west500Btn.addEventListener("click", () => loadSample(westminster500Sample));
  }

  if (west100Btn) {
    west100Btn.addEventListener("click", () => loadSample(westminster100Sample));
  }

  loadSample(arch500Sample);
})();
