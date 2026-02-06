const svg = document.getElementById("parliament-svg");
const tooltip = document.getElementById("tooltip");
const summary = document.getElementById("summary");
const legend = document.getElementById("legend");
const errorEl = document.getElementById("error");
const input = document.getElementById("data-input");
const renderBtn = document.getElementById("render-btn");

let activePartyId = null;
let partyMeta = [];
let currentType = "arch";
let currentOptions = {
  showLegend: true,
  showWestminsterHeaders: false,
  showMajorityLine: false
};

function validateData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("JSON must be an object.");
  }

  const type = data.type === "westminster" ? "westminster" : data.type === "arch" ? "arch" : null;
  if (!type) {
    throw new Error('JSON must include type: "arch" or "westminster".');
  }

  if (!Array.isArray(data.parties) || !data.parties.length) {
    throw new Error("JSON must include a non-empty parties array.");
  }

  const options = {
    showLegend: true,
    showWestminsterHeaders: false,
    showMajorityLine: false
  };
  if (data.options !== undefined) {
    if (!data.options || typeof data.options !== "object" || Array.isArray(data.options)) {
      throw new Error("If provided, options must be an object.");
    }
    if (data.options.showLegend !== undefined) {
      if (typeof data.options.showLegend !== "boolean") {
        throw new Error("options.showLegend must be true or false.");
      }
      options.showLegend = data.options.showLegend;
    }
    if (data.options.showWestminsterHeaders !== undefined) {
      if (typeof data.options.showWestminsterHeaders !== "boolean") {
        throw new Error("options.showWestminsterHeaders must be true or false.");
      }
      options.showWestminsterHeaders = data.options.showWestminsterHeaders;
    }
    if (data.options.showMajorityLine !== undefined) {
      if (typeof data.options.showMajorityLine !== "boolean") {
        throw new Error("options.showMajorityLine must be true or false.");
      }
      options.showMajorityLine = data.options.showMajorityLine;
    }
  }

  const sanitized = data.parties.map((party, index) => {
    if (typeof party.name !== "string" || !party.name.trim()) {
      throw new Error(`Party at index ${index} must have a non-empty name.`);
    }
    if (typeof party.color !== "string" || !party.color.trim()) {
      throw new Error(`Party \"${party.name}\" must have a color.`);
    }
    if (!Number.isInteger(party.seats) || party.seats <= 0) {
      throw new Error(`Party \"${party.name}\" must have seats as a positive integer.`);
    }

    let side = null;
    if (type === "westminster") {
      if (party.side !== "government" && party.side !== "opposition") {
        throw new Error(`Party \"${party.name}\" must include side: \"government\" or \"opposition\" for westminster.`);
      }
      side = party.side;
    }

    return {
      id: index,
      name: party.name.trim(),
      color: party.color.trim(),
      seats: party.seats,
      side
    };
  });

  if (type === "westminster") {
    const gov = sanitized.some((p) => p.side === "government");
    const opp = sanitized.some((p) => p.side === "opposition");
    if (!gov || !opp) {
      throw new Error("Westminster layout requires at least one government party and one opposition party.");
    }
  }

  return { type, parties: sanitized, options };
}

function computeRowLayout(totalSeats, rowCount) {
  const maxOuterRadius = 450;
  const minInnerRadius = 150;
  const step = (maxOuterRadius - minInnerRadius) / Math.max(1, rowCount - 1);

  const raw = [];
  for (let row = 0; row < rowCount; row += 1) {
    const radius = maxOuterRadius - row * step;
    raw.push(Math.max(3, Math.floor((Math.PI * radius) / 22)));
  }

  const rawTotal = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((v) => (v / rawTotal) * totalSeats);
  const base = scaled.map((v) => Math.max(1, Math.floor(v)));
  let remainder = totalSeats - base.reduce((a, b) => a + b, 0);

  const order = scaled
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  let cursor = 0;
  while (remainder > 0) {
    base[order[cursor % order.length].i] += 1;
    cursor += 1;
    remainder -= 1;
  }

  while (remainder < 0) {
    const idx = order[cursor % order.length].i;
    if (base[idx] > 1) {
      base[idx] -= 1;
      remainder += 1;
    }
    cursor += 1;
  }

  return base;
}

function archSeatPositions(totalSeats) {
  let rows = Math.max(5, Math.min(11, Math.round(Math.sqrt(totalSeats) / 2)));
  let rowSeats = computeRowLayout(totalSeats, rows);

  while (rowSeats.length > 1 && rowSeats[rowSeats.length - 1] < 8) {
    rows -= 1;
    if (rows < 4) {
      break;
    }
    rowSeats = computeRowLayout(totalSeats, rows);
  }

  const cx = 490;
  const cy = 510;
  const outer = 450;
  const inner = 150;
  const step = (outer - inner) / Math.max(1, rowSeats.length - 1);
  const result = [];

  rowSeats.forEach((count, row) => {
    const radius = outer - row * step;
    for (let i = 0; i < count; i += 1) {
      const offset = row % 2 === 0 ? 0.5 : 0;
      const theta = Math.PI - ((i + offset + 0.5) / (count + offset)) * Math.PI;
      result.push({
        x: cx + radius * Math.cos(theta),
        y: cy - radius * Math.sin(theta)
      });
    }
  });

  return result.slice(0, totalSeats);
}

function orderedArchPositions(totalSeats) {
  const cx = 490;
  const cy = 510;
  return archSeatPositions(totalSeats)
    .map((pos) => {
      const theta = Math.atan2(cy - pos.y, pos.x - cx);
      const radius = Math.hypot(pos.x - cx, cy - pos.y);
      return { ...pos, theta, radius };
    })
    .sort((a, b) => {
      if (b.theta !== a.theta) {
        return b.theta - a.theta;
      }
      return b.radius - a.radius;
    })
    .map(({ x, y }) => ({ x, y }));
}

function blockSeatPositions(count, side) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(count * 1.25)));
  const rows = Math.ceil(count / cols);
  const leftPadding = 80;
  const rightPadding = 900;
  const aisleLeft = 430;
  const aisleRight = 550;
  const top = 80;
  const bottom = 500;
  const seatGapX = (aisleLeft - leftPadding) / Math.max(cols - 1, 1);
  const seatGapY = (bottom - top) / Math.max(rows - 1, 1);

  const result = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const y = top + row * seatGapY;
    if (side === "government") {
      const x = leftPadding + col * seatGapX;
      result.push({ x, y });
    } else {
      const x = aisleRight + col * ((rightPadding - aisleRight) / Math.max(cols - 1, 1));
      result.push({ x, y });
    }
  }
  return result;
}

function westminsterSeatPositions(parties) {
  const govParties = parties.filter((p) => p.side === "government");
  const oppParties = parties.filter((p) => p.side === "opposition");
  const govSeats = govParties.reduce((sum, p) => sum + p.seats, 0);
  const oppSeats = oppParties.reduce((sum, p) => sum + p.seats, 0);

  const govPos = blockSeatPositions(govSeats, "government");
  const oppPos = blockSeatPositions(oppSeats, "opposition");

  const byParty = new Map();
  let gi = 0;
  let oi = 0;

  parties.forEach((party) => {
    const seats = [];
    if (party.side === "government") {
      for (let i = 0; i < party.seats; i += 1) {
        seats.push(govPos[gi]);
        gi += 1;
      }
    } else {
      for (let i = 0; i < party.seats; i += 1) {
        seats.push(oppPos[oi]);
        oi += 1;
      }
    }
    byParty.set(party.id, seats);
  });

  return byParty;
}

function buildPartyMeta(parties) {
  const totalSeats = parties.reduce((sum, p) => sum + p.seats, 0);
  return parties.map((p) => ({
    ...p,
    totalSeats,
    percent: (p.seats / totalSeats) * 100
  }));
}

function tooltipHtml(party) {
  return `
    <div class="font-semibold">${party.name}</div>
    <div>${party.seats} seats</div>
    <div>${party.percent.toFixed(1)}% of parliament</div>
  `;
}

function updateSeatStyles() {
  const seats = svg.querySelectorAll(".seat");
  seats.forEach((seat) => {
    const partyId = Number(seat.dataset.partyId);
    const party = partyMeta[partyId];
    const inactive = activePartyId !== null && partyId !== activePartyId;
    seat.setAttribute("fill", inactive ? "var(--seat-grey)" : party.color);
    seat.setAttribute("opacity", inactive ? "0.55" : "1");
  });
}

function renderLegend() {
  legend.classList.toggle("hidden", !currentOptions.showLegend);
  if (!currentOptions.showLegend) {
    legend.innerHTML = "";
    return;
  }

  legend.innerHTML = "";
  partyMeta.forEach((party) => {
    const chip = document.createElement("div");
    chip.className = "badge badge-outline gap-2 py-4";
    const sideLabel = currentType === "westminster" ? `, ${party.side}` : "";
    chip.innerHTML = `
      <span class="inline-block h-3 w-3 rounded-full" style="background:${party.color}"></span>
      <span>${party.name}: ${party.seats} (${party.percent.toFixed(1)}%${sideLabel})</span>
    `;
    legend.appendChild(chip);
  });
}

function drawAisle() {
  if (currentType !== "westminster") {
    return;
  }

  const aisle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  aisle.setAttribute("x", "490");
  aisle.setAttribute("y", "70");
  aisle.setAttribute("width", "4");
  aisle.setAttribute("height", "440");
  aisle.setAttribute("fill", "#e2e8f0");
  svg.appendChild(aisle);
}

function drawWestminsterHeaders() {
  if (currentType !== "westminster" || !currentOptions.showWestminsterHeaders) {
    return;
  }

  const govHeader = document.createElementNS("http://www.w3.org/2000/svg", "text");
  govHeader.setAttribute("x", "260");
  govHeader.setAttribute("y", "46");
  govHeader.setAttribute("text-anchor", "middle");
  govHeader.setAttribute("font-size", "24");
  govHeader.setAttribute("font-weight", "700");
  govHeader.setAttribute("fill", "#334155");
  govHeader.textContent = "Government";

  const oppHeader = document.createElementNS("http://www.w3.org/2000/svg", "text");
  oppHeader.setAttribute("x", "720");
  oppHeader.setAttribute("y", "46");
  oppHeader.setAttribute("text-anchor", "middle");
  oppHeader.setAttribute("font-size", "24");
  oppHeader.setAttribute("font-weight", "700");
  oppHeader.setAttribute("fill", "#334155");
  oppHeader.textContent = "Opposition";

  svg.appendChild(govHeader);
  svg.appendChild(oppHeader);
}

function drawArchMajorityLine(positions) {
  if (currentType !== "arch" || !currentOptions.showMajorityLine || positions.length < 2) {
    return;
  }

  const cx = 490;
  const cy = 510;
  const mid = positions.length / 2;
  let theta;

  if (positions.length % 2 === 0) {
    const left = positions[mid - 1];
    const right = positions[mid];
    const leftTheta = Math.atan2(cy - left.y, left.x - cx);
    const rightTheta = Math.atan2(cy - right.y, right.x - cx);
    theta = (leftTheta + rightTheta) / 2;
  } else {
    const center = positions[Math.floor(mid)];
    theta = Math.atan2(cy - center.y, center.x - cx);
  }

  const outerR = 468;
  const innerR = 118;
  const x1 = cx + outerR * Math.cos(theta);
  const y1 = cy - outerR * Math.sin(theta);
  const x2 = cx + innerR * Math.cos(theta);
  const y2 = cy - innerR * Math.sin(theta);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("stroke", "#0f172a");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-dasharray", "8 6");
  line.setAttribute("opacity", "0.7");
  svg.appendChild(line);
}

function mountSeat(pos, party) {
  const seat = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  seat.setAttribute("class", "seat");
  seat.setAttribute("cx", String(pos.x));
  seat.setAttribute("cy", String(pos.y));
  seat.setAttribute("r", currentType === "westminster" ? "7.8" : "8.4");
  seat.setAttribute("fill", party.color);
  seat.dataset.partyId = String(party.id);

  seat.addEventListener("mouseenter", () => {
    activePartyId = party.id;
    tooltip.classList.remove("hidden");
    tooltip.innerHTML = tooltipHtml(party);
    updateSeatStyles();
  });

  seat.addEventListener("mousemove", (event) => {
    const { left, top } = svg.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - left}px`;
    tooltip.style.top = `${event.clientY - top}px`;
  });

  seat.addEventListener("mouseleave", () => {
    activePartyId = null;
    tooltip.classList.add("hidden");
    updateSeatStyles();
  });

  svg.appendChild(seat);
}

function renderArch(parties) {
  const totalSeats = parties.reduce((sum, p) => sum + p.seats, 0);
  const positions = orderedArchPositions(totalSeats);
  let seatIndex = 0;

  parties.forEach((party) => {
    for (let i = 0; i < party.seats; i += 1) {
      mountSeat(positions[seatIndex], party);
      seatIndex += 1;
    }
  });

  drawArchMajorityLine(positions);
}

function renderWestminster(parties) {
  drawAisle();
  drawWestminsterHeaders();
  const byParty = westminsterSeatPositions(parties);

  parties.forEach((party) => {
    const seats = byParty.get(party.id) || [];
    seats.forEach((pos) => mountSeat(pos, party));
  });
}

function render(data) {
  const validated = validateData(data);
  currentType = validated.type;
  currentOptions = validated.options;
  partyMeta = buildPartyMeta(validated.parties);
  activePartyId = null;

  const totalSeats = partyMeta[0].totalSeats;
  summary.textContent = `${totalSeats} total seats (${currentType})`;
  renderLegend();

  svg.innerHTML = "";
  tooltip.classList.add("hidden");

  if (currentType === "westminster") {
    renderWestminster(partyMeta);
  } else {
    renderArch(partyMeta);
  }

  updateSeatStyles();
}

renderBtn.addEventListener("click", () => {
  try {
    errorEl.textContent = "";
    const parsed = JSON.parse(input.value);
    render(parsed);
  } catch (err) {
    errorEl.textContent = err.message || "Invalid JSON.";
  }
});

window.parliamentChart = {
  loadData(data) {
    input.value = JSON.stringify(data, null, 2);
    render(data);
  },
  loadFromText(text) {
    input.value = text;
    render(JSON.parse(text));
  },
  renderFromEditor() {
    const parsed = JSON.parse(input.value);
    render(parsed);
  }
};
