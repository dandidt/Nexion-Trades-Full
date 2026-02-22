// ────── Format ────── //
function formatUSD(value) {
    if (value === 0) return "$0.00";

    const isNegative = value < 0;
    
    const formattedValue = Math.abs(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return `${isNegative ? '-' : ''}$${formattedValue}`;
}

function formatUSDShort(value) {
    if (value === 0) return "0";

    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);

    let formatted = '';
    let suffix = '';

    if (abs >= 1_000_000_000) {
        formatted = (abs / 1_000_000_000).toFixed(2);
        suffix = 'B';
    } else if (abs >= 1_000_000) {
        formatted = (abs / 1_000_000).toFixed(2);
        suffix = 'M';
    } else if (abs >= 100_000) {
        formatted = (abs / 1_000).toFixed(2);
        suffix = 'K';
    } else {
        return sign + abs.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    if (formatted.endsWith('.00')) formatted = formatted.slice(0, -3);
    return sign + formatted + suffix;
}

function formatPercent(value) {
  if (value === 0) return "0%";
  return `${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
  })}%`;
}

function formatCurrencyCompact(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);

  if (abs >= 1_000_000_000) return sign + '$' + (abs / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return sign + '$' + (abs / 1_000).toFixed(1) + 'K';
  return sign + '$' + abs.toFixed(2);
}

function formatValue(value) {
    let formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    formatted = formatted.replace(/(\.\d*?[1-9])0+$/, '$1');
    formatted = formatted.replace(/\.0+$/, '');

    return formatted;
}

// ────── Button Navbar ────── //
document.addEventListener("DOMContentLoaded", () => {
  const menus = document.querySelectorAll(".box-menu-in");

  const jurnalingSection = document.querySelector(".jurnaling");
  const statsSection = document.querySelector(".statistic");
  const settingSection = document.querySelector(".setting");

  function hideAll() {
    if (jurnalingSection) jurnalingSection.style.display = "none";
    if (statsSection) statsSection.style.display = "none";
    if (settingSection) settingSection.style.display = "none";
  }

  function animateSection(section) {
    if (!section) return;
    const items = section.querySelectorAll(".fade-up");
    items.forEach(el => el.classList.remove("show"));
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add("show"), i * 120);
    });
  }

  function openSection(name) {
    CloseAllPopupsGlobal();
    
    hideAll();
    window.scrollTo({ top: 0 });

    menus.forEach(m => m.classList.remove("active"));
    menus.forEach(m => {
      const text = m.querySelector("span")?.textContent.trim().toLowerCase();
      if (text === name) m.classList.add("active");
    });

    if (name === "jurnaling" && jurnalingSection) {
      jurnalingSection.style.display = "block";
      animateSection(jurnalingSection);
    }

    if (name === "statistic" && statsSection) {
      statsSection.style.display = "flex";
      animateSection(statsSection);
      setTimeout(() => {
        if (typeof resizeBalanceCanvas === "function") resizeBalanceCanvas();
        if (typeof drawBalanceChart === "function" && window.balanceCurrentData?.length) {
          drawBalanceChart();
        }
      }, 300);
    }

    if (name === "setting" && settingSection) {
      settingSection.style.display = "block";
      animateSection(settingSection);
    }
  }

  menus.forEach(menu => {
    menu.addEventListener("click", e => {
      e.preventDefault();

      const name = menu.querySelector("span")?.textContent.trim().toLowerCase();
      if (!name || menu.classList.contains("active")) return;

      openSection(name);
    });
  });

  const hashMap = {
    "#Header-Statistic": "statistic",
    "#Chart-Balance-Target": "statistic",
    "#Calender-Trade": "statistic",
    "#Pairs-Allocation": "statistic",
    "#Pairs-Performance": "statistic"
  };

  function handleHash() {
    const hash = window.location.hash;
    if (hashMap[hash]) {
      openSection(hashMap[hash]);
      setTimeout(() => {
        const target = document.getElementById(hash.replace("#", ""));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else {
      openSection("jurnaling");
    }
  }

  handleHash();
  window.addEventListener("hashchange", handleHash);
});

// ────── Back to Top Button ────── //
document.addEventListener("DOMContentLoaded", () => {
  const btnUp = document.querySelector(".box-up");
  const btnDown = document.querySelector(".box-down");

  if (!btnUp || !btnDown) return;

  const hide = (btn) => {
    btn.style.opacity = "0";
    btn.style.pointerEvents = "none";
  };

  const show = (btn) => {
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
  };

  [btnUp, btnDown].forEach(btn => {
    btn.style.transition = "opacity 0.3s ease";
    hide(btn);
  });

  show(btnDown);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      hide(btnDown);
      show(btnUp);
    } else {
      hide(btnUp);
      show(btnDown);
    }
  });

  btnUp.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  btnDown.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
});

// ────── Front Dashboard ────── //
function updateDashboardFromTrades(dataPerpetual = [], dataSpot = []) {
  const combinedData = [...dataPerpetual, ...dataSpot].filter(isTradeItem);

  if (!Array.isArray(combinedData) || combinedData.length === 0) return;

  const parsePnl = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizePair = (p) => {
    if (!p) return '';
    return String(p)
      .replace(/\.?USDT\.P$/i, '')
      .replace(/[-_./]?USDT$/i, '')
      .trim();
  };

  const pad = (n) => (n < 10 ? '0' + n : n);
  const formatDateDDMMYYYY = (d) => {
    const dt = new Date(d * 1000);
    if (Number.isNaN(dt.getTime())) return '-';
    return `${pad(dt.getDate())}-${pad(dt.getMonth()+1)}-${dt.getFullYear()}`;
  };

  const elPairsBestPerformer = document.getElementById('pairsBestPerformer');
  const elDateBestPerformer = document.getElementById('dateBestPerformer');
  const elValueBestPerformer = document.getElementById('valueBestPerformer');
  const elPersentaseBestPerformer = document.getElementById('persentaseBestPerformer');

  const elHighestPairs = document.getElementById('highestPairs');
  const elValuehighestPairs = document.getElementById('valuehighestPairs');

  const elMostpairs = document.getElementById('mostpairs');
  const elTotalMostTraded = document.getElementById('totalMostTraded');

  const elProfitability = document.getElementById('profitability');
  const elTotalProfitabilty = document.getElementById('totalProfitabilty');
  const elAvgPnlPerday = document.getElementById('avgPnlPerday');

  // --- Distribution Stats  ---
  const elStatsNavPerpetual = document.getElementById('statsNavPerpetual');
  const elStatsNavSpot = document.getElementById('statsNavSpot');

  const countPerp = (Array.isArray(dataPerpetual) ? dataPerpetual : []).filter(isTradeItem).length;
  const countSpot = (Array.isArray(dataSpot) ? dataSpot : []).filter(isTradeItem).length;
  const totalTrades = countPerp + countSpot;

  if (totalTrades > 0) {
    const perpPct = Math.round((countPerp / totalTrades) * 100);
    const spotPct = 100 - perpPct;

    if (elStatsNavPerpetual) elStatsNavPerpetual.textContent = `${perpPct}% Perpetual`;
    if (elStatsNavSpot) elStatsNavSpot.textContent = `${spotPct}% Spot`;
  } else {
    if (elStatsNavPerpetual) elStatsNavPerpetual.textContent = '0% Perpetual';
    if (elStatsNavSpot) elStatsNavSpot.textContent = '0% Spot';
  }

  // --- Best Performer ---
  let bestTrade = null;
  let bestPnl = -Infinity;
  for (const trade of combinedData) {
    const pnl = parsePnl(trade.Pnl);
    if (pnl > bestPnl) {
      bestPnl = pnl;
      bestTrade = trade;
    }
  }

  if (bestTrade) {
    const normPair = normalizePair(bestTrade.Pairs || bestTrade.pairs);
    if (elPairsBestPerformer) elPairsBestPerformer.textContent = normPair || '-';
    if (elDateBestPerformer) elDateBestPerformer.textContent = formatDateDDMMYYYY(bestTrade.date);
    if (elValueBestPerformer) {
      const formattedBest = formatUSD(Math.abs(bestPnl));
      elValueBestPerformer.textContent = bestPnl < 0 ? `-${formattedBest}` : formattedBest;
    }

    let originalPerpetual = [];
    let originalSpot = [];
    try {
      const rawPerp = localStorage.getItem("dbperpetual");
      if (rawPerp) originalPerpetual = JSON.parse(rawPerp);
      if (!Array.isArray(originalPerpetual)) originalPerpetual = [];
    } catch (err) {
      originalPerpetual = [];
    }

    try {
      const rawSpot = localStorage.getItem("dbspot");
      if (rawSpot) originalSpot = JSON.parse(rawSpot);
      if (!Array.isArray(originalSpot)) originalSpot = [];
    } catch (err) {
      originalSpot = [];
    }

    let saldoAwal = 0;
    try {
      const rawSaldo = localStorage.getItem("saldoAwal");
      saldoAwal = rawSaldo ? Number(rawSaldo) : 0;
    } catch (err) {
      return
    }

    let totalDeposit = 0;
    [originalPerpetual, originalSpot].forEach(db => {
      if (Array.isArray(db)) {
        totalDeposit += db.reduce((sum, item) => {
          if (item.action && item.action.toLowerCase() === "deposit") {
            const val = Number(item.value) || 0;
            return sum + val;
          }
          return sum;
        }, 0);
      }
    });

    let bestIndexInOriginal = -1;
    let sourceDb = null;
    const bestDateMs = new Date(bestTrade.date * 1000).getTime();

    for (let i = 0; i < originalPerpetual.length; i++) {
      const t = originalPerpetual[i];
      const tDateMs = new Date(t.date * 1000).getTime();
      const tPair = normalizePair(t.Pairs || t.pairs);
      const tPnl = parsePnl(t.Pnl);
      if (
        tDateMs === bestDateMs &&
        tPair === normPair &&
        Math.abs(tPnl - bestPnl) < 0.001
      ) {
        bestIndexInOriginal = i;
        sourceDb = originalPerpetual;
        break;
      }
    }

    if (bestIndexInOriginal === -1) {
      for (let i = 0; i < originalSpot.length; i++) {
        const t = originalSpot[i];
        const tDateMs = new Date(t.date * 1000).getTime();
        const tPair = normalizePair(t.Pairs || t.pairs);
        const tPnl = parsePnl(t.Pnl);
        if (
          tDateMs === bestDateMs &&
          tPair === normPair &&
          Math.abs(tPnl - bestPnl) < 0.001
        ) {
          bestIndexInOriginal = i;
          sourceDb = originalSpot;
          break;
        }
      }
    }

    let totalPnlBeforeBest = 0;
    if (bestIndexInOriginal >= 0 && sourceDb) {
      for (let i = 0; i < bestIndexInOriginal; i++) {
        totalPnlBeforeBest += parsePnl(sourceDb[i].Pnl);
      }
    }

    const totalModal = saldoAwal + totalDeposit + totalPnlBeforeBest;
    if (totalModal > 0) {
      const kenaikanPct = (bestPnl / totalModal) * 100;
      if (elPersentaseBestPerformer)
        elPersentaseBestPerformer.textContent = formatPercent(kenaikanPct);
    } else {
      if (elPersentaseBestPerformer)
        elPersentaseBestPerformer.textContent = 'N/A';
    }
  } else {
    if (elPairsBestPerformer) elPairsBestPerformer.textContent = '-';
    if (elDateBestPerformer) elDateBestPerformer.textContent = '-';
    if (elValueBestPerformer) elValueBestPerformer.textContent = '$0';
    if (elPersentaseBestPerformer) elPersentaseBestPerformer.textContent = '0%';
  }

  // --- Pair Stats ---
  const countMap = {};
  const pnlMap = {};
  combinedData.forEach(t => {
    const pairRaw = t.Pairs || t.pairs || '';
    const p = normalizePair(pairRaw);
    if (!p) return;
    countMap[p] = (countMap[p] || 0) + 1;
    pnlMap[p] = (pnlMap[p] || 0) + parsePnl(t.Pnl);
  });

  let topByPnl = null, topByPnlValue = 0;
  for (const p in pnlMap) {
    if (pnlMap[p] > topByPnlValue || topByPnl === null) {
      topByPnl = p;
      topByPnlValue = pnlMap[p];
    }
  }
  if (elHighestPairs) elHighestPairs.textContent = topByPnl || '-';
  if (elValuehighestPairs) elValuehighestPairs.textContent = topByPnl ? formatCurrencyCompact(topByPnlValue) : '$0';

  let topByCount = null, topCount = 0;
  for (const p in countMap) {
    if (countMap[p] > topCount || topByCount === null) {
      topByCount = p;
      topCount = countMap[p];
    }
  }
  if (elMostpairs) elMostpairs.textContent = topByCount || '-';
  if (elTotalMostTraded) elTotalMostTraded.textContent = topCount ? `${topCount} Trades` : '0 Trades';

  // --- Profitability ---
  let win = 0, lose = 0;
  combinedData.forEach(t => {
    const r = (t.Result || t.result || '').toString().toLowerCase();
    if (r === 'win' || r === 'profit') win++;
    else if (r === 'lose' || r === 'loss') lose++;
  });
  const denom = win + lose;
  if (denom > 0) {
    const wr = (win / denom) * 100;
    if (elProfitability) elProfitability.textContent = `${wr.toFixed(2)}%`;
    if (elTotalProfitabilty) elTotalProfitabilty.textContent = `${win} of ${denom} Profite Trade`;
  } else {
    if (elProfitability) elProfitability.textContent = '0%';
    if (elTotalProfitabilty) elTotalProfitabilty.textContent = `0 of 0 Profite Trade`;
  }

  // --- Avg Daily PnL ---
  const dailyWins = {};
  combinedData.forEach(t => {
    const pnl = parsePnl(t.Pnl);
    if (pnl <= 0) return;
    const d = new Date(t.date * 1000);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    dailyWins[key] = (dailyWins[key] || 0) + pnl;
  });

  const days = Object.keys(dailyWins).length;
  const totalDailyWins = Object.values(dailyWins).reduce((s, v) => s + v, 0);
  const avgDaily = days > 0 ? (totalDailyWins / days) : 0;

  if (elAvgPnlPerday) elAvgPnlPerday.textContent = `Avg Daily PnL: ${formatCurrencyCompact(avgDaily)}`;
}

// ────── Trading Jurnal ────── //
// ------ Global Deklarasi ------ //
let perpetualTrades = [];
let spotTrades = [];
let originalPerpetualTrades = [];
let originalSpotTrades = [];  
let currentActiveTab = 'perpetual';
let selectedSpotNumbers = [];
let selectedPerpetualNumbers = [];

// ------ Init All Data on Page Load ------ //
async function initializeAllData() {
  const perpData = await getDBPerpetual();
  perpetualTrades = perpData;
  originalPerpetualTrades = [...perpData];

  const spotData = await getDBSpot();
  spotTrades = spotData;
  originalSpotTrades = [...spotData];

  currentActiveTab = 'perpetual';
  renderPerpetualPaginated();
  updatePaginationUI();

  updateDashboardFromTrades(originalPerpetualTrades, originalSpotTrades);
}

document.addEventListener('DOMContentLoaded', () => { initializeAllData(); });

// ------ Swaap Jurnal ------ //
document.querySelectorAll('.swap-tabel').forEach((btn) => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.swap-tabel').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const perpTable = document.getElementById('tabel-perpetual');
        const spotTable = document.getElementById('tabel-spot');
        
        currentPage = 1;
        currentSort = { key: null, direction: null };
        updateSortIcons();

        if (this.innerText.includes("Perpetual")) {
            currentActiveTab = 'perpetual';
            perpTable.style.display = "table";
            spotTable.style.display = "none";
            renderPerpetualPaginated();
            updatePaginationUI();
        } else {
            currentActiveTab = 'spot';
            perpTable.style.display = "none";
            spotTable.style.display = "table";
            renderSpotPaginated();
            updatePaginationUI();
        }

        renderRiskInfo();
        calculate();
    });
});

// ------ Helper ------ //
// Load Data Perpetual
async function loadPerpetualData() {
  const data = await getDBPerpetual();
  perpetualTrades = data;
  originalPerpetualTrades = [...data];
  currentActiveTab = 'perpetual';
  
  renderPerpetualPaginated();
  updatePaginationUI();
}

// Load Data Spot
async function loadSpotData() {
  const data = await getDBSpot();
  spotTrades = data;
  originalSpotTrades = [...data];
  currentActiveTab = 'spot';
  
  renderSpotPaginated();
  updatePaginationUI();
}

function isTradeItem(item) {
  return item && (item.hasOwnProperty('Pairs') || item.hasOwnProperty('Result'));
}

function isActionItem(item) {
  return item && item.hasOwnProperty('action') && (item.action === 'Deposit' || item.action === 'Withdraw');
}

// ------ Perpetual Tabel ------ //
function renderPerpetualPaginated() {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = perpetualTrades.slice(startIndex, endIndex);
  renderPerpetualTable(pageData);
}

function renderPerpetualTable(data) {
  const tbody = document.querySelector("#tabel-perpetual tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  data.forEach((item) => {
    // Transaction
    if (isActionItem(item)) {
      const noCell = isEditMode
      ? `
        <td>
          <label class="ios-checkbox red">
            <input type="checkbox" data-id="${item.tradeNumber || 'tx'}" />
            <div class="checkbox-wrapper">
              <div class="checkbox-bg"></div>
              <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none">
                <path class="check-path"
                  d="M4 12L10 18L20 6"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
              </svg>
            </div>
          </label>
        </td>
      `
      : `<td><p class="no">${item.tradeNumber || '-'}</p></td>`;

      const date = new Date(item.date * 1000).toLocaleDateString("id-ID");
      const value = item.value || 0;
      const isDeposit = item.action === "Deposit";

      const row = document.createElement("tr");
      row.dataset.tradeNumber = item.tradeNumber || '';
      row.classList.add(isDeposit ? "deposit" : "withdraw");

      row.innerHTML = `
        ${noCell}
        <td><p class="date">${date}</p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p></p></td>
        <td><p class="${isDeposit ? 'result-win' : 'result-lose'}">${item.action}</p></td>
        <td><p class="${isDeposit ? 'pnl-win' : 'pnl-loss'}">${isDeposit ? '+' : ''}${formatUSD(Math.abs(value))}</p></td>
      `;
      
      tbody.appendChild(row);
      return;
    }

    // Trades
    if (!isTradeItem(item)) return;
    const trade = item;

    const noCell = isEditMode
      ? `
        <td>
          <label class="ios-checkbox">
            <input type="checkbox" data-id="${trade.tradeNumber || 'tx'}" />
            <div class="checkbox-wrapper">
              <div class="checkbox-bg"></div>
              <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none">
                <path class="check-path"
                  d="M4 12L10 18L20 6"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
              </svg>
            </div>
          </label>
        </td>
      `
      : `<td><p class="no">${trade.tradeNumber || '-'}</p></td>`;

    const date = new Date(item.date * 1000).toLocaleDateString("id-ID");

    const rr = Number(trade.RR);
    const pnl = Number(trade.Pnl) || 0;
    const margin = Number(trade.Margin) || 0;

    let rrClass = "rr-null";
    if (rr > 0) rrClass = "rr-win";
    else if (rr < 0) rrClass = "rr-lose";

    const psyClass = (trade.Psychology || "confident").toLowerCase();
    let posClass = "pos-null";
    let posText  = "-";

    const rawPos = trade.Pos || ""; 

    if (rawPos === "Short") {
      posClass = "short";
      posText = "SHORT";
    } else if (rawPos === "Long") {
      posClass = "long";
      posText = "LONG";
    }

    let resultClass = "result-lose";
    const resultValue = trade.Result?.toLowerCase();
    if (resultValue === "win" || resultValue === "profit") resultClass = "result-win";
    else if (resultValue === "missed") resultClass = "result-missed";

    let pnlClass = "pnl-null";
    if (pnl > 0) pnlClass = "pnl-win";
    else if (pnl < 0) pnlClass = "pnl-loss";

    const confluanceText = [trade.Confluance?.Entry, trade.Confluance?.TimeFrame]
    .filter(v => v && v !== '-')
    .join(' - ') || '-';

    const row = document.createElement("tr");
    row.dataset.tradeNumber = trade.tradeNumber;

    row.innerHTML = `
      ${noCell}
      <td><p class="date">${date}</p></td>
      <td><p class="pairs">${trade.Pairs || '-'}</p></td>
      <td><p class="method">${trade.Method || '-'}</p></td>
      <td><p class="confluance">${confluanceText}</p></td>
      <td><p class="${rrClass}">${isNaN(rr) ? "-" : rr}</p></td>
      <td><p class="behavior">${trade.Behavior || '-'}</p></td>
      <td>
        <div class="box-causes" id="box-causes">
          <svg class="icon-causes" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
            <path d="M240-384h480v-72H240v72Zm0-132h480v-72H240v72Zm0-132h480v-72H240v72ZM864-96 720-240H168q-29.7 0-50.85-21.15Q96-282.3 96-312v-480q0-29.7 21.15-50.85Q138.3-864 168-864h624q29.7 0 50.85 21.15Q864-821.7 864-792v696ZM168-312h582l42 42v-522H168v480Zm0 0v-480 480Z"/>
          </svg>
        </div>
      </td>
      <td><p class="${psyClass}">${trade.Psychology || '-'}</p></td>
      <td><p class="class">${trade.Class || '-'}</p></td>
      <td>
        <div class="box-causes" id="box-files" data-before="${trade.Files?.Before || '#'}" data-after="${trade.Files?.After || '#'}">
          <svg class="icon-causes" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
            <path d="M264-240h432L557-426q-2-1-3.69-1.6-1.69-.6-3.31-1.4L444-288l-72-96-108 144ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-528q0-29.7 21.15-50.85Q186.3-768 216-768h192v72H216v528h528v-231l72 72v159q0 29.7-21.15 50.85Q773.7-96 744-96H216Zm264-336Zm381 48L738-507q-20 13-42.55 20-22.55 7-47.92 7Q578-480 529-529t-49-119q0-70 49-119t119-49q70 0 119 48.95t49 118.88q0 25.17-7 47.67T789-558l123 123-51 51ZM647.77-552Q688-552 716-579.77q28-27.78 28-68Q744-688 716.23-716q-27.78-28-68-28Q608-744 580-716.23q-28 27.78-28 68Q552-608 579.77-580q27.78 28 68 28Z"/>
          </svg>
        </div>
      </td>
      <td><p class="${posClass}">${posText}</p></td>
      <td><p class="margin">${formatUSD(margin)}</p></td>
      <td><p class="${resultClass}">${trade.Result || '-'}</p></td>
      <td><p class="${pnlClass}">${pnl === 0 ? formatUSD(0) : (pnl > 0 ? "+" : "-") + formatUSD(Math.abs(pnl))}</p></td>
    `;

    const boxCauses = row.querySelector("#box-causes");
    const causes = trade.Causes?.trim();

    if (!causes || causes === "-" || causes === "No causes") {
      boxCauses.classList.add("causes-disabled");
      boxCauses.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg"
          height="20px" width="20px" viewBox="0 -960 960 960">
          <path d="M140-240q-23 0-41.5-18.5T80-300v-494l-54-54 43-43L876-84l-43 43-199-199H140Zm740 74L746-300h74v-520H226l-60-60h654q24 0 42 18.5t18 41.5v654ZM140-300h434L474-400H240v-60h174l-70-70H240v-60h44L140-734v434Zm506-100-60-60h134v60h-74ZM516-530l-60-60h264v60H516ZM386-660l-60-60h394v60H386Z"/>
        </svg>
      `;
    } else {
      boxCauses.dataset.content = causes;
    }

    const boxFiles = row.querySelector("#box-files");

    const before = trade.Files?.Before?.trim();
    const after  = trade.Files?.After?.trim();

    const hasBefore = before && before !== "#";
    const hasAfter  = after  && after  !== "#";

    if (!hasBefore && !hasAfter) {
      boxFiles.classList.add("files-disabled");
      boxFiles.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m816-246-72-72v-426H318l-72-72h498q29 0 50.5 21.5T816-744v498ZM768-90l-54-54H216q-29 0-50.5-21.5T144-216v-498l-54-54 51-51 678 678-51 51ZM264-288l108-144 72 96 34-45-262-261v426h426l-72-72H264Zm264-240ZM426-426Z"/></svg>
      `;
    }

    else if (hasBefore ^ hasAfter) {
      boxFiles.classList.add("files-single");

      boxFiles.dataset.before = hasBefore ? before : "";
      boxFiles.dataset.after  = hasAfter ? after : "";
      boxFiles.dataset.single = "true";

      boxFiles.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M216-144q-29.7 0-50.85-21.5Q144-187 144-216v-528q0-29 21.15-50.5T216-816h528q29.7 0 50.85 21.5Q816-773 816-744v528q0 29-21.15 50.5T744-144H216Zm0-72h528v-528H216v528Zm48-72h432L552-480 444-336l-72-96-108 144Zm-48 72v-528 528Z"/></svg>
      `;
    }

    else {
      boxFiles.dataset.before = before;
      boxFiles.dataset.after  = after;
    }

    tbody.appendChild(row);
  });

  setTimeout(() => {
    if (window.tooltipManager) window.tooltipManager.destroy();
    window.tooltipManager = new TooltipManager();
  }, 100);

  updateDashboardFromTrades(originalPerpetualTrades, originalSpotTrades);

  if (isEditMode) {
    document.querySelectorAll(".tabel-trade tbody tr").forEach(row => {
      row.style.cursor = "pointer";
      row.classList.add("editable");
    });

    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) btnEdit.classList.add("active");
  } else {
    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) btnEdit.classList.remove("active");
  }
}

// ------ Spot Tabel ------ //
function renderSpotPaginated() {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = spotTrades.slice(startIndex, endIndex);
  renderSpotTable(pageData);
}

function renderSpotTable(data) {
  const tbody = document.querySelector("#tabel-spot tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  
  data.forEach((item) => {
    // Transaction
    if (isActionItem(item)) {
      const noCell = isEditMode
      ? `
        <td>
          <label class="ios-checkbox red">
            <input type="checkbox" data-id="${item.tradeNumber || 'tx'}" />
            <div class="checkbox-wrapper">
              <div class="checkbox-bg"></div>
              <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none">
                <path class="check-path"
                  d="M4 12L10 18L20 6"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
              </svg>
            </div>
          </label>
        </td>
      `
      : `<td><p class="no">${item.tradeNumber || '-'}</p></td>`;
      
      const date = new Date(item.date * 1000).toLocaleDateString("id-ID");
      const value = Number(item.value) || 0;
      const isDeposit = item.action === "Deposit";

      const row = document.createElement("tr");
      row.dataset.tradeNumber = item.tradeNumber || '';
      row.classList.add(isDeposit ? "deposit" : "withdraw");

      row.innerHTML = `
          ${noCell}
          <td><p class="date">${date}</p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p></p></td>
          <td><p class="${isDeposit ? "result-win" : "result-lose"}">${item.action}</p></td>
          <td><p class="${isDeposit ? "pnl-win" : "pnl-loss"}">${isDeposit ? "+" : "-"}${formatUSD(Math.abs(value))}</p></td>
      `;

      tbody.appendChild(row);
      return;
    }

    // Trades
    if (!isTradeItem(item)) return;
    const trade = item;

    const noCell = isEditMode
    ? `
      <td>
        <label class="ios-checkbox red">
          <input type="checkbox" data-id="${trade.tradeNumber || 'tx'}" />
          <div class="checkbox-wrapper">
            <div class="checkbox-bg"></div>
            <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none">
              <path class="check-path"
                d="M4 12L10 18L20 6"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"/>
            </svg>
          </div>
        </label>
      </td>
    `
    : `<td><p class="no">${trade.tradeNumber || '-'}</p></td>`;
    
    const date = new Date(trade.date * 1000).toLocaleDateString("id-ID");

    const rr = Number(trade.RR) || 0;
    const pnl = Number(trade.Pnl) || 0;
    const margin = Number(trade.Margin) || 0;

    const rrClass = rr > 0 ? "rr-win" : rr < 0 ? "rr-lose" : "rr-null";
    const pnlClass = pnl > 0 ? "pnl-win" : pnl < 0 ? "pnl-loss" : "pnl-null";
    const resultClass =
        trade.Result?.toLowerCase() === "win" || trade.Result?.toLowerCase() === "profit"
            ? "result-win"
            : "result-lose";

    const confluanceText = [trade.Confluance?.Entry, trade.Confluance?.TimeFrame]
    .filter(v => v && v !== '-')
    .join(' - ') || '-';

    const row = document.createElement("tr");
    row.dataset.tradeNumber = trade.tradeNumber || '';

    row.innerHTML = `
      ${noCell}
      <td><p class="date">${date}</p></td>
      <td><p class="pairs">${trade.Pairs || "-"}</p></td>
      <td><p class="method">${trade.Method || "-"}</p></td>
      <td><p class="confluance">${confluanceText}</p></td>
      <td><p class="${rrClass}">${rr || "-"}</p></td>
      <td>
        <div class="box-causes" id="box-causes">
          <svg class="icon-causes" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
            <path d="M240-384h480v-72H240v72Zm0-132h480v-72H240v72Zm0-132h480v-72H240v72ZM864-96 720-240H168q-29.7 0-50.85-21.15Q96-282.3 96-312v-480q0-29.7 21.15-50.85Q138.3-864 168-864h624q29.7 0 50.85 21.15Q864-821.7 864-792v696ZM168-312h582l42 42v-522H168v480Zm0 0v-480 480Z"/>
          </svg>
        </div>
      </td>
      <td><p class="${(trade.Psychology || "confident").toLowerCase()}">${trade.Psychology || "-"}</p></td>
      <td><p class="class">${trade.Class || "-"}</p></td>
      <td>
        <div class="box-causes" id="box-files"
              data-before="${trade.Files?.Before || "#"}"
              data-after="${trade.Files?.After || "#"}">
            <svg class="icon-causes" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
              <path d="M264-240h432L557-426q-2-1-3.69-1.6-1.69-.6-3.31-1.4L444-288l-72-96-108 144ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-528q0-29.7 21.15-50.85Q186.3-768 216-768h192v72H216v528h528v-231l72 72v159q0 29.7-21.15 50.85Q773.7-96 744-96H216Zm264-336Zm381 48L738-507q-20 13-42.55 20-22.55 7-47.92 7Q578-480 529-529t-49-119q0-70 49-119t119-49q70 0 119 48.95t49 118.88q0 25.17-7 47.67T789-558l123 123-51 51ZM647.77-552Q688-552 716-579.77q28-27.78 28-68Q744-688 716.23-716q-27.78-28-68-28Q608-744 580-716.23q-28 27.78-28 68Q552-608 579.77-580q27.78 28 68 28Z"/>
            </svg>
        </div>
      </td>
      <td><p class="margin">${formatUSD(margin)}</p></td>
      <td><p class="${resultClass}">${trade.Result || "-"}</p></td>
      <td><p class="${pnlClass}">${pnl === 0 ? formatUSD(0) : (pnl > 0 ? "+" : "-") + formatUSD(Math.abs(pnl))}</p></td>
    `;

    const boxCauses = row.querySelector("#box-causes");
    const causes = trade.Causes?.trim();

    if (!causes || causes === "-" || causes === "No causes") {
      boxCauses.classList.add("causes-disabled");
      boxCauses.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg"
          height="20px" width="20px" viewBox="0 -960 960 960">
          <path d="M140-240q-23 0-41.5-18.5T80-300v-494l-54-54 43-43L876-84l-43 43-199-199H140Zm740 74L746-300h74v-520H226l-60-60h654q24 0 42 18.5t18 41.5v654ZM140-300h434L474-400H240v-60h174l-70-70H240v-60h44L140-734v434Zm506-100-60-60h134v60h-74ZM516-530l-60-60h264v60H516ZM386-660l-60-60h394v60H386Z"/>
        </svg>
      `;
    } else {
      boxCauses.dataset.content = causes;
    }

    const boxFiles = row.querySelector("#box-files");

    const before = trade.Files?.Before?.trim();
    const after  = trade.Files?.After?.trim();

    const hasBefore = before && before !== "#";
    const hasAfter  = after  && after  !== "#";

    if (!hasBefore && !hasAfter) {
      boxFiles.classList.add("files-disabled");
      boxFiles.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m816-246-72-72v-426H318l-72-72h498q29 0 50.5 21.5T816-744v498ZM768-90l-54-54H216q-29 0-50.5-21.5T144-216v-498l-54-54 51-51 678 678-51 51ZM264-288l108-144 72 96 34-45-262-261v426h426l-72-72H264Zm264-240ZM426-426Z"/></svg>
      `;
    }

    else if (hasBefore ^ hasAfter) {
      boxFiles.classList.add("files-single");

      boxFiles.dataset.before = hasBefore ? before : "";
      boxFiles.dataset.after  = hasAfter ? after : "";
      boxFiles.dataset.single = "true";

      boxFiles.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M216-144q-29.7 0-50.85-21.5Q144-187 144-216v-528q0-29 21.15-50.5T216-816h528q29.7 0 50.85 21.5Q816-773 816-744v528q0 29-21.15 50.5T744-144H216Zm0-72h528v-528H216v528Zm48-72h432L552-480 444-336l-72-96-108 144Zm-48 72v-528 528Z"/></svg>
      `;
    }

    else {
      boxFiles.dataset.before = before;
      boxFiles.dataset.after  = after;
    }

    tbody.appendChild(row);
  });

  setTimeout(() => {
    if (window.tooltipManager) window.tooltipManager.destroy();
    window.tooltipManager = new TooltipManager();
  }, 100);

  updateDashboardFromTrades(originalPerpetualTrades, originalSpotTrades);

  if (isEditMode) {
    document.querySelectorAll(".tabel-trade tbody tr").forEach(row => {
      row.style.cursor = "pointer";
      row.classList.add("editable");
    });

    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) btnEdit.classList.add("active");
  } else {
    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) btnEdit.classList.remove("active");
  }
}

// ------ Short Fiilter ------ //
let currentSort = { key: null, direction: null };

function getValue(item, key) {
  if (!item) return "";
  switch (key) {
    case "date":
      return item.date || 0;
    case "pairs":
      return item.Pairs || item.pairs || "";
    case "pnl":
      return item.Pnl ?? item.pnl ?? item.PnL ?? 0;
    default:
      return item[key] ?? "";
  }
}

function nextSortState(key) {
  if (currentSort.key !== key) return "desc"; 
  if (currentSort.direction === "desc") return "asc";
  if (currentSort.direction === "asc") return null;
  return "desc";
}

// ------ Global Short Filter ------ //
function initGlobalSorting() {
  const headers = document.querySelectorAll("th.sortable");

  headers.forEach(th => {
    const newTh = th.cloneNode(true);
    th.parentNode.replaceChild(newTh, th);

    newTh.addEventListener("click", () => {
      const key = newTh.dataset.key;
      const nextDirection = nextSortState(key);

      currentSort = nextDirection ? { key, direction: nextDirection } : { key: null, direction: null };
      
      executeSorting();
      updateSortIcons();
    });
  });

  document.querySelectorAll("th.sortable .sort-icon").forEach(span => {
    span.innerHTML = getSortIcon(null, null);
  });
}

function executeSorting() {
  let currentPageData;
  if (currentActiveTab === 'perpetual') {
    const startIndex = (currentPage - 1) * rowsPerPage;
    currentPageData = perpetualTrades.slice(startIndex, startIndex + rowsPerPage);
  } else {
    const startIndex = (currentPage - 1) * rowsPerPage;
    currentPageData = spotTrades.slice(startIndex, startIndex + rowsPerPage);
  }

  if (currentSort.key && currentSort.direction) {
    currentPageData.sort((a, b) => sortTrades(a, b, currentSort.key, currentSort.direction));
  }

  if (currentActiveTab === 'perpetual') {
    renderPerpetualTable(currentPageData);
  } else {
    renderSpotTable(currentPageData);
  }

}

function sortTrades(a, b, key, direction) {
  if (!key || !direction) return 0;

  switch (key) {
    case "date": {
      const dateA = new Date(getValue(a, "date"));
      const dateB = new Date(getValue(b, "date"));
      if (direction === "desc") return dateB - dateA;
      return dateA - dateB;
    }

    case "pairs": {
      const valA = (getValue(a, "pairs") || "").toString();
      const valB = (getValue(b, "pairs") || "").toString();

      const cmp = valA.localeCompare(valB, undefined, { sensitivity: "base" });
      if (direction === "asc") return cmp;
      if (direction === "desc") return -cmp;
      return 0;
    }

    case "pnl": {
      const pA = Number(getValue(a, "pnl")) || 0;
      const pB = Number(getValue(b, "pnl")) || 0;
      if (direction === "asc") return pA - pB;
      if (direction === "desc") return pB - pA;
      return 0;
    }

    default:
      return 0;
  }
}

function updateSortIcons() {
  document.querySelectorAll("th.sortable").forEach(th => {
    const iconSpan = th.querySelector(".sort-icon");
    const key = th.dataset.key;

    if (!currentSort.key) {
      iconSpan.innerHTML = getSortIcon(key, null);
    } else {
      if (th.dataset.key === currentSort.key) {
        iconSpan.innerHTML = getSortIcon(key, currentSort.direction);
      } else {
        iconSpan.innerHTML = getSortIcon(key, null);
      }
    }
  });
}

function getSortIcon(columnKey = null, direction = null) {
  let upOpacity = "0.3";
  let downOpacity = "0.3";

  if (columnKey === "pairs" || columnKey === "pnl") {
    if (direction === "asc") {
      upOpacity = "0.3";
      downOpacity = "1";
    } else if (direction === "desc") {
      upOpacity = "1";
      downOpacity = "0.3";
    } else {
      upOpacity = "0.3";
      downOpacity = "0.3";
    }
  } else {
    if (direction === "desc") {
      upOpacity = "1";
      downOpacity = "0.3";
    } else if (direction === "asc") {
      upOpacity = "0.3";
      downOpacity = "1";
    } else {
      upOpacity = "0.3";
      downOpacity = "1";
    }
  }

  const color = "#fff";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="15px" height="15px" style="color:${color};vertical-align:middle;">
      <polygon fill="currentColor" opacity="${upOpacity}" 
        points="6.73 10.62 6.73 4.04 4.21 6.56 3.33 5.69 
        7.35 1.67 11.38 5.69 10.5 6.56 7.98 4.04 7.98 10.62 6.73 10.62"/>
      <polygon fill="currentColor" opacity="${downOpacity}" 
        points="12.65 18.33 8.63 14.31 9.5 13.44 
        12.02 15.96 12.02 9.37 13.27 9.37 
        13.27 15.96 15.79 13.44 16.67 14.31 12.65 18.33"/>
    </svg>
  `;
}

document.addEventListener("DOMContentLoaded", loadPerpetualData);

// ------ Tooltip ------ //
class TooltipManager {

  createImageHtml(src, link, label) {
    return `
      <div style="text-align: center;">
        <a href="${link}" target="_blank" style="display: inline-block;">
          <div class="tooltip-img-placeholder" style="width: 160px; height: 90px; border-radius: 4px; border: 1px solid #eee; background: #333; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
            <img src="${src}" alt="${label}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
          </div>
        </a>
        <div style="margin-top: 6px; font-size: 12px;">
          <a href="${link}" target="_blank" class="tooltip-link">${label}</a>
        </div>
      </div>
    `;
  }

  constructor() {
    this.tooltip = document.getElementById('TooltipBox');
    this.tooltipContent = document.getElementById('TooltipContent');
    this.hideTimeout = null;
    this.showTimeout = null;
    this.currentTarget = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindGlobally() {
    this.tooltip.addEventListener('mouseenter', () => this.clearHideTimeout());
    this.tooltip.addEventListener('mouseleave', () => this.scheduleHideTooltip(300));
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    window.addEventListener('resize', () => this.hideTooltip(true), { passive: true });
  }

  bindEvents() {
    document.querySelectorAll('#box-causes, #box-files').forEach(el => {
      el.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
      el.addEventListener('mouseleave', () => this.handleMouseLeave());
      el.addEventListener('click', (e) => e.preventDefault());
    });
    this.bindGlobally();
  }

  handleMouseEnter(event) {
    this.hideTooltip(true);
    this.currentTarget = event.currentTarget;
    this.clearAllTimeouts();
    this.showTimeout = setTimeout(() => this.showTooltip(event), 0);
  }

  handleMouseLeave() {
    this.clearAllTimeouts();
    this.scheduleHideTooltip(300);
  }

  showTooltip(event) {
    if (!this.currentTarget) return;

    let content = "";
    let title = "";

    if (this.currentTarget.id === "box-causes") {
      title = "Causes";
      content = `<div class="tooltip-text">${this.currentTarget.dataset.content || "No causes"}</div>`;
    } else if (this.currentTarget.id === "box-files") {
      title = "Files";
      const before = this.currentTarget.dataset.before || "";
      const after  = this.currentTarget.dataset.after  || "";
      const beforeLink = this.currentTarget.dataset.beforeLink || before;
      const afterLink = this.currentTarget.dataset.afterLink || after;

      const hasBefore = before && before !== "#" && before.startsWith('http');
      const hasAfter = after && after !== "#" && after.startsWith('http');

      let imagesHtml = "";

      if (hasBefore && hasAfter) {
        imagesHtml = `
          ${this.createImageHtml(before, beforeLink, "Image Before")}
          ${this.createImageHtml(after, afterLink, "Image After")}
        `;
      } else if (hasBefore || hasAfter) {
        const img = hasBefore ? before : after;
        const link = hasBefore ? beforeLink : afterLink;
        const label = hasBefore ? "Image Before" : "Image After";
        imagesHtml = this.createImageHtml(img, link, label);
      } else {
        imagesHtml = `<div style="color: #666; font-size: 12px; padding: 10px;">No images available</div>`;
      }

      content = `
        <div class="tooltip-imgs-grid" style="display: flex; gap: 12px; justify-content: center; margin-bottom: 8px;">
          ${imagesHtml}
        </div>
      `;
    }

    this.tooltipContent.innerHTML = `<div class="tooltip-title">${title}</div>${content}`;
    this.tooltip.classList.remove('hidden');
    this.tooltip.classList.add('show');

    requestAnimationFrame(() => {
      this.positionTooltip(this.currentTarget);
    });
  }

  positionTooltip(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const gap = 10;
    const top = rect.top + scrollTop - tooltipRect.height - gap;
    const left = rect.left + scrollLeft + (rect.width / 2) - (tooltipRect.width / 2);

    const margin = 10;
    const viewportWidth = window.innerWidth;
    const safeLeft = Math.max(margin, Math.min(left, viewportWidth - tooltipRect.width - margin));

    this.tooltip.style.position = 'absolute';
    this.tooltip.style.left = `${safeLeft}px`;
    this.tooltip.style.top = `${top}px`;
  }

  scheduleHideTooltip(delay = 150) {
    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => this.hideTooltip(), delay);
  }

  hideTooltip(force = false) {
    if (!this.tooltip.classList.contains('show')) return;

    if (force) {
      this.tooltip.classList.remove('show');
      this.tooltip.classList.add('hidden');
      this.currentTarget = null;
      this.tooltipContent.innerHTML = '';
      this.clearAllTimeouts();
      return;
    }

    this.tooltip.classList.remove('show');
    setTimeout(() => {
      if (!this.tooltip.classList.contains('show')) {
        this.tooltip.classList.add('hidden');
        this.currentTarget = null;
        this.tooltipContent.innerHTML = '';
      }
    }, 200);
  }

  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  clearShowTimeout() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  clearAllTimeouts() {
    this.clearHideTimeout();
    this.clearShowTimeout();
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.tooltip.classList.contains('show')) {
      this.hideTooltip(true);
    }
  }

  handleScroll() {
    if (this.tooltip.classList.contains('show') && this.currentTarget) {
      requestAnimationFrame(() => this.positionTooltip(this.currentTarget));
    }
  }

  destroy() {
    this.hideTooltip(true);
    this.clearAllTimeouts();
  }
}

let tooltipManager;

function initTooltip() {
  if (tooltipManager) {
    tooltipManager.destroy();
  }
  tooltipManager = new TooltipManager();
  return tooltipManager;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    window.tooltipManager = initTooltip();
  } catch (error) {
    console.error('Result:', error);
  }
});

// ------ Pagination ------ //
let currentPage = 1;
let rowsPerPage = 50;

function updatePaginationUI() {
  const activeData = (currentActiveTab === 'perpetual') ? perpetualTrades : spotTrades;
  
  const totalTrades = activeData.length;
  const totalPages = Math.max(1, Math.ceil(totalTrades / rowsPerPage));

  document.getElementById('tradeTotal').textContent = `${totalTrades} Trade${totalTrades !== 1 ? 's' : ''}`;

  document.getElementById('pageOf').textContent = `Of ${totalPages}`;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const pageActive = document.querySelector('#pageSelector .number-page-active');
  if (pageActive) pageActive.textContent = currentPage;

  updatePageNumberBoxes(totalPages);
  updatePageDropdown();
}

function updatePageNumberBoxes(totalPages) {
  const container = document.querySelector('.wrapper-page-pagination');

  container.innerHTML = '';

  const addPage = (num, active = false) => {
    const div = createPageBox(num, active);
    container.appendChild(div);
  };

  const addDots = () => {
    const div = document.createElement('div');
    div.className = 'box-more';
    div.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
        <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/>
      </svg>`;
    container.appendChild(div);
  };

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      addPage(i, currentPage === i);
    }
    return;
  }

  const last = totalPages;

  if (currentPage <= 3) {
    addPage(1, currentPage === 1);
    addPage(2, currentPage === 2);
    addPage(3, currentPage === 3);

    addDots();

    addPage(last, currentPage === last);
    return;
  }

  if (currentPage >= last - 2) {
    addPage(1, currentPage === 1);

    addDots();

    addPage(last - 2, currentPage === last - 2);
    addPage(last - 1, currentPage === last - 1);
    addPage(last, currentPage === last);
    return;
  }

  addPage(1, false);

  addDots();

  addPage(currentPage - 1);
  addPage(currentPage, true);
  addPage(currentPage + 1);

  addDots();

  addPage(last, false);
}

function createPageBox(pageNum, isActive) {
  const div = document.createElement('div');
  div.className = `box-number-page ${isActive ? 'active' : ''}`;
  div.innerHTML = `<p class="number-page">${pageNum}</p>`;
  div.addEventListener('click', () => goToPage(pageNum));
  return div;
}

function goToPage(page) {
  const activeData = (currentActiveTab === 'perpetual') ? perpetualTrades : spotTrades;
  const totalPages = Math.ceil(activeData.length / rowsPerPage);
  
  if (page < 1 || page > totalPages || page === currentPage) return;

  currentPage = page;
  
  currentSort = { key: null, direction: null };
  
  if (currentActiveTab === 'perpetual') {
      renderPerpetualPaginated();
  } else {
      renderSpotPaginated();
  }
  
  updatePaginationUI();
}

function extractNumber(str) {
  const match = str.match(/^\d+/);
  return match ? match[0] : str;
}

function createDropdown(triggerEl, menuEl, items, activeSpan) {
  menuEl.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.textContent = item;
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      const displayValue = extractNumber(item);
      activeSpan.textContent = displayValue;
      menuEl.classList.remove('active');
    });
    menuEl.appendChild(div);
  });

  triggerEl.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== menuEl) menu.classList.remove('active');
    });
    menuEl.classList.toggle('active');
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('active');
  });
});

const pageTrigger = document.getElementById('pageSelector');
const pageMenu = document.getElementById('pageDropdown');
const pageActive = pageTrigger.querySelector('.number-page-active');
createDropdown(pageTrigger, pageMenu, ['1', '2'], pageActive);

function updatePageDropdown() {
  const pageTrigger = document.getElementById('pageSelector');
  const pageMenu = document.getElementById('pageDropdown');
  const pageActiveSpan = pageTrigger.querySelector('.number-page-active');

  if (!pageMenu || !pageActiveSpan) return;

  const activeData = (currentActiveTab === 'perpetual') ? perpetualTrades : spotTrades;
  const totalPages = Math.max(1, Math.ceil(activeData.length / rowsPerPage));

  pageActiveSpan.textContent = currentPage;

  pageMenu.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.textContent = i;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPage(i);
      pageMenu.classList.remove('active');
    });
    pageMenu.appendChild(item);
  }
}

const rowsTrigger = document.getElementById('rowsSelector');
const rowsMenu = document.getElementById('rowsDropdown');
const rowsActive = rowsTrigger.querySelector('.number-page-active');

rowsTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== rowsMenu) menu.classList.remove('active');
  });
  rowsMenu.classList.toggle('active');
});

['50 Rows', '100 Rows', '200 Rows', '400 Rows', '600 Rows', '1000 Rows'].forEach(item => {
  const div = document.createElement('div');
  div.className = 'dropdown-item';
  div.textContent = item;
  div.addEventListener('click', (e) => {
    e.stopPropagation();
    const newRows = parseInt(item);
    rowsActive.textContent = newRows;
    rowsMenu.classList.remove('active');
    
    rowsPerPage = newRows;
    currentPage = 1;
    
    if (currentActiveTab === 'perpetual') {
        renderPerpetualPaginated();
    } else {
        renderSpotPaginated();
    }
    updatePaginationUI();
  });
  rowsMenu.appendChild(div);
});

document.querySelector('.left-frist-page').addEventListener('click', () => goToPage(1));
document.querySelector('.left-one-page').addEventListener('click', () => goToPage(currentPage - 1));
document.querySelector('.right-one-page').addEventListener('click', () => goToPage(currentPage + 1));
document.querySelector('.right-frist-page').addEventListener('click', () => {
  const totalPages = Math.ceil(perpetualTrades.length / rowsPerPage);
  goToPage(totalPages);
});

document.addEventListener("DOMContentLoaded", () => {
  loadPerpetualData();
  initGlobalSorting();
});

// ────── Dashboard Header ────── //
async function updateEquityStats() {
  try {
    const dataPerpetual = await getDBPerpetual();
    const dataSpot = await getDBSpot();

    if (!Array.isArray(dataPerpetual)) {
      return;
    }
    if (!Array.isArray(dataSpot)) {
      return;
    }

    let totalPnl = 0;
    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalFeePaid = 0;

    let pnlPerp = 0, depositPerp = 0, withdrawPerp = 0;
    let pnlSpot = 0, depositSpot = 0, withdrawSpot = 0;

    const processDataset = (dataset, isPerp = true) => {
      let localPnl = 0;
      let localDeposit = 0;
      let localWithdraw = 0;
      let localFee = 0;

      dataset.forEach(item => {
        if (item.action === "Deposit") {
          const val = Math.abs(item.value || 0);
          localDeposit += val;
          totalDeposit += val;
        } else if (item.action === "Withdraw") {
          const val = Math.abs(item.value || 0);
          localWithdraw += val;
          totalWithdraw += val;
        } else if (item.hasOwnProperty("Pnl")) {
          const pnlVal = Number(item.Pnl) || 0;
          localPnl += pnlVal;
          totalPnl += pnlVal;

          const rr = parseFloat(item.RR);
          const margin = parseFloat(item.Margin);
          const actualPnl = parseFloat(item.Pnl);

          if (!isNaN(rr) && !isNaN(margin) && margin > 0 && !isNaN(actualPnl)) {
            const expectedPnl = rr * margin;
            let fee = 0;

            if (expectedPnl >= 0) {
              if (actualPnl < expectedPnl) {
                fee = expectedPnl - actualPnl;
              }
            } else {
              if (actualPnl < expectedPnl) {
                fee = expectedPnl - actualPnl;
              }
            }

            localFee += fee;
            totalFeePaid += fee;
          }
        }
      });

      if (isPerp) {
        pnlPerp = localPnl;
        depositPerp = localDeposit;
        withdrawPerp = localWithdraw;
      } else {
        pnlSpot = localPnl;
        depositSpot = localDeposit;
        withdrawSpot = localWithdraw;
      }
    };

    processDataset(dataPerpetual, true);
    processDataset(dataSpot, false);

    const equityPerp = depositPerp + pnlPerp - withdrawPerp;
    const equitySpot = depositSpot + pnlSpot - withdrawSpot;
    const totalEquity = totalDeposit + totalPnl - totalWithdraw;

    const persentaseWithdraw = totalDeposit > 0
      ? ((totalWithdraw / totalDeposit) * 100).toFixed(2)
      : "0.00";

    let persentaseFee = "0.00";
    if (totalEquity > 0) {
      persentaseFee = ((totalFeePaid / totalEquity) * 100).toFixed(2);
    }

    const elTotalEquity = document.getElementById("totalEquity");
    const elTotalPerp = document.getElementById("totalPerp");
    const elTotalSpot = document.getElementById("totalSpot");
    const elPersentaseWithdraw = document.getElementById("persentaseWithdraw");
    const elValueWithdraw = document.getElementById("valueWithdraw");
    const elValueDeposit = document.getElementById("valueDeposit");
    const elValueFeePaid = document.getElementById("valueFeePaid");
    const elPersentaseFeePaid = document.getElementById("persentaseFeePaid");

    if (elTotalEquity) elTotalEquity.textContent = formatUSD(totalEquity);
    if (elTotalPerp) elTotalPerp.textContent = formatUSD(equityPerp);
    if (elTotalSpot) elTotalSpot.textContent = formatUSD(equitySpot);
    if (elPersentaseWithdraw) elPersentaseWithdraw.textContent = `${persentaseWithdraw}%`;
    if (elValueWithdraw) elValueWithdraw.textContent = formatUSD(totalWithdraw);
    if (elValueDeposit) elValueDeposit.textContent = formatUSD(totalDeposit);
    if (elValueFeePaid) elValueFeePaid.textContent = formatUSD(-totalFeePaid);
    if (elPersentaseFeePaid) elPersentaseFeePaid.textContent = `(${persentaseFee}%)`;

  } catch (error) {
    console.error('Result:', error);
  }
}

document.addEventListener("DOMContentLoaded", updateEquityStats);
window.updateEquityStats = updateEquityStats;

async function updateStats(mode = "Perpetual") {
  let trades = [];

  try {
    if (mode === "Perpetual") {
      trades = await getDBPerpetual();
    } else if (mode === "Spot") {
      trades = await getDBSpot();
    } else if (mode === "All") {
      const perp = await getDBPerpetual();
      const spot = await getDBSpot();
      trades = [...(Array.isArray(perp) ? perp : []), ...(Array.isArray(spot) ? spot : [])];
    }

    if (!Array.isArray(trades)) {
      resetStatsUI();
      return;
    }

    let totalDeposit = 0;
    let tradeOnly = [];

    trades.forEach(item => {
      if (item.action === "Deposit") {
        totalDeposit += Math.abs(item.value || 0);
      } else if (item.hasOwnProperty('Pnl')) {
        tradeOnly.push(item);
      }
    });

    const deposit = totalDeposit || 0;
    const totalPnL = tradeOnly.reduce((sum, t) => sum + (Number(t.Pnl) || 0), 0);

    const formattedTotalPnL = formatUSD(Math.abs(totalPnL));
    const elTotalProfite = document.getElementById("totalProfite");
    if (elTotalProfite) {
      elTotalProfite.textContent = totalPnL < 0 ? `-${formattedTotalPnL}` : formattedTotalPnL;
    }

    const persentaseIncrease = deposit > 0 ? (totalPnL / deposit) * 100 : 0;
    const elPersentaseIncrease = document.getElementById("persentaseIncrease");
    if (elPersentaseIncrease) {
      elPersentaseIncrease.textContent = formatPercent(persentaseIncrease);
    }

    const totalWin = tradeOnly
      .filter(t => {
        const r = (t.Result || '').toString().toLowerCase();
        return r === 'profit' || r === 'win';
      })
      .reduce((sum, t) => sum + (Number(t.Pnl) || 0), 0);

    const totalLoss = tradeOnly
      .filter(t => {
        const r = (t.Result || '').toString().toLowerCase();
        return r === 'loss' || r === 'lose';
      })
      .reduce((sum, t) => sum + (Number(t.Pnl) || 0), 0);

    const elTotalValueWin = document.getElementById("totalValueWin");
    const elTotalValueLoss = document.getElementById("totalValueLoss");
    if (elTotalValueWin) elTotalValueWin.textContent = "+" + formatUSD(Math.abs(totalWin));
    if (elTotalValueLoss) elTotalValueLoss.textContent = "-" + formatUSD(Math.abs(totalLoss));

    const totalAbsWin = Math.abs(totalWin);
    const totalAbsLoss = Math.abs(totalLoss);
    const totalAbs = totalAbsWin + totalAbsLoss;

    const winPercent = totalAbs > 0 ? ((totalAbsWin / totalAbs) * 100).toFixed(2) : "0.00";
    const lossPercent = totalAbs > 0 ? ((totalAbsLoss / totalAbs) * 100).toFixed(2) : "0.00";

    const elPersentaseValueWin = document.getElementById("persentaseValueWin");
    const elPersentaseValueLoss = document.getElementById("persentaseValueLoss");
    if (elPersentaseValueWin) elPersentaseValueWin.textContent = winPercent + "%";
    if (elPersentaseValueLoss) elPersentaseValueLoss.textContent = lossPercent + "%";

    const bxDwn = document.querySelector(".bx-dwn");
    if (bxDwn) {
      const winNum = parseFloat(winPercent);
      if (winNum >= 50) {
        bxDwn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="rgb(52, 211, 153)">
            <path d="m123-240-43-43 292-291 167 167 241-241H653v-60h227v227h-59v-123L538-321 371-488 123-240Z"/>
          </svg>
          <p class="value-lessons green">UP</p>
        `;
      } else if (parseFloat(lossPercent) > 50) {
        bxDwn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="rgb(251, 113, 133)">
            <path d="M624-209v-72h117L529-492 377-340 96-621l51-51 230 230 152-152 263 262v-117h72v240H624Z"/>
          </svg>
          <p class="value-lessons red">DOWN</p>
        `;
      } else {
        bxDwn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="rgba(173, 173, 173, 1)">
            <path d="m702-301-43-42 106-106H120v-60h646L660-615l42-42 178 178-178 178Z"/>
          </svg>
          <p class="value-lessons gray">NETRAL</p>
        `;
      }
    }

    const progressEl = document.getElementById("progressHighlight");
    if (progressEl) {
      progressEl.style.setProperty("--win-percent", winPercent + "%");
    }

    // --- Max Drawdown Logic ---
    let maxDropPercent = 0;
    let maxDropValue = 0;
    let runningBalance = deposit;
    let currentDrop = 0;
    let balanceBeforeStreak = deposit;

    tradeOnly.forEach(t => {
      const pnl = Number(t.Pnl) || 0;
      const result = (t.Result || '').toString().toLowerCase().trim();
      const isLossOrMissed = ['loss', 'lose', 'missed'].includes(result);
      const isProfitOrBreakEven = ['profit', 'win', 'break even', 'breakeven'].includes(result);

      if (isLossOrMissed) {
        if (currentDrop === 0) {
          balanceBeforeStreak = runningBalance;
        }
        if (['loss', 'lose'].includes(result) && pnl < 0) {
          currentDrop += Math.abs(pnl);
        }
      } else if (isProfitOrBreakEven) {
        if (currentDrop > 0) {
          const dropPercent = balanceBeforeStreak > 0 
            ? (currentDrop / balanceBeforeStreak) * 100 
            : 0;
          if (dropPercent > maxDropPercent) {
            maxDropPercent = dropPercent;
            maxDropValue = currentDrop;
          }
          currentDrop = 0;
        }
      }
      runningBalance += pnl;
    });

    if (currentDrop > 0) {
      const dropPercent = balanceBeforeStreak > 0 
        ? (currentDrop / balanceBeforeStreak) * 100 
        : 0;
      if (dropPercent > maxDropPercent) {
        maxDropPercent = dropPercent;
        maxDropValue = currentDrop;
      }
    }

    const displayWidth = Math.min(Math.max(maxDropPercent, 35), 100);
    const dropBox = document.querySelector(".bx-usd");
    if (dropBox) {
      dropBox.style.width = displayWidth + "%";
    }

    const elWorstTrade = document.getElementById("worstTrade");
    const elValueWorstTrade = document.getElementById("valueWorstTrade");
    if (elWorstTrade) elWorstTrade.textContent = "-" + maxDropPercent.toFixed(2) + "%";
    if (elValueWorstTrade) elValueWorstTrade.textContent = "-" + formatUSD(maxDropValue);

    // --- ATH Logic ---
    let balance = deposit;
    let athBalance = balance;
    tradeOnly.forEach(t => {
      balance += Number(t.Pnl) || 0;
      if (balance > athBalance) athBalance = balance;
    });

    const elValueAthBalance = document.getElementById("valueAthBalance");
    const elPersentaseAthBalance = document.getElementById("persentaseAthBalance");
    if (elValueAthBalance) elValueAthBalance.textContent = formatUSD(athBalance);
    const athPercent = deposit > 0 ? ((athBalance - deposit) / deposit) * 100 : 0;
    if (elPersentaseAthBalance) elPersentaseAthBalance.textContent = formatPercent(athPercent) + " ROE";

  } catch (error) {
    console.error('Result:', error, mode);
    resetStatsUI();
  }
}

function resetStatsUI() {
  const ids = [
    "totalProfite", "persentaseIncrease", "totalValueWin", "totalValueLoss",
    "persentaseValueWin", "persentaseValueLoss", "worstTrade", "valueWorstTrade",
    "valueAthBalance", "persentaseAthBalance"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "~";
  });

  const bxDwn = document.querySelector(".bx-dwn");
  if (bxDwn) bxDwn.innerHTML = "";

  const progressEl = document.getElementById("progressHighlight");
  if (progressEl) progressEl.style.setProperty("--win-percent", "0%");

  const dropBox = document.querySelector(".bx-usd");
  if (dropBox) dropBox.style.width = "35%";
}

document.querySelectorAll(".btn-radio.data-value").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".btn-radio.data-value").forEach(b => b.classList.remove("active"));
        this.classList.add("active");

        const mode = this.textContent.trim();
        updateStats(mode);

        if (typeof loadBalanceData === 'function') {
            loadBalanceData(mode).then(() => {
                updateFilterStats(currentFilterRange);
            });
        }
    });
});

updateStats("Perpetual");

// ────── Monthly Prtformance ────── //

let monthlyData = [];

async function loadMonthlyData() {
    try {
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData) || rawData.length === 0) {
            monthlyData = [];
            renderMonthsGrid();
            renderBarChart();
            return;
        }

        const entries = [...rawData].sort((a, b) => Number(a.date) - Number(b.date));

        let initialCapital = null;
        const tradeOrCashEntries = [];

        for (const entry of entries) {
            if (entry.action === 'Deposit' && initialCapital === null) {
                initialCapital = Number(entry.value) || 0;
            } else {
                tradeOrCashEntries.push(entry);
            }
        }

        const monthlyPnL = {};
        const getMonthKey = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        };

        for (const entry of tradeOrCashEntries) {
            const date = new Date(Number(entry.date) * 1000);
            const monthKey = getMonthKey(date);

            if (!monthlyPnL[monthKey]) monthlyPnL[monthKey] = 0;

            if (entry.hasOwnProperty('Pnl') && entry.Result !== 'Missed') {
                monthlyPnL[monthKey] += Number(entry.Pnl) || 0;
            } else if (entry.action === 'Deposit' || entry.action === 'Withdraw') {
                const value = entry.action === 'Withdraw' ? -(Number(entry.value) || 0) : (Number(entry.value) || 0);
                monthlyPnL[monthKey] += value;
            }
        }

        const monthsArray = Object.entries(monthlyPnL)
            .map(([key, profitLoss]) => {
                const [year, month] = key.split('-');
                return {
                    year: parseInt(year, 10),
                    month: parseInt(month, 10) - 1,
                    profitLoss: parseFloat(profitLoss.toFixed(2)),
                    key
                };
            })
            .sort((a, b) => a.year - b.year || a.month - b.month);

        let balanceBefore = initialCapital || 0;
        const fullResult = [];

        for (let i = 0; i < monthsArray.length; i++) {
            const item = monthsArray[i];
            const pnlThisMonth = item.profitLoss;

            let returnRate = null;

            if (balanceBefore > 0) {
                returnRate = (pnlThisMonth / balanceBefore) * 100;
            }

            fullResult.push({
                year: item.year,
                month: item.month,
                monthName: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][item.month],
                profitLoss: pnlThisMonth,
                returnRate: returnRate !== null ? parseFloat(returnRate.toFixed(2)) : null
            });

            balanceBefore += pnlThisMonth;
        }

        const currentYear = new Date().getFullYear();
        monthlyData = fullResult.filter(m => m.year === currentYear);

        renderMonthsGrid();
        renderBarChart();

    } catch (error) {
        monthlyData = [];
        renderMonthsGrid();
        renderBarChart();
    }
}

function renderMonthsGrid() {
    const grid = document.getElementById('monthsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (monthlyData.length === 0) {
        grid.innerHTML = '<div class="no-data">Data not available</div>';
        return;
    }

    monthlyData.forEach(item => {
        const isPositive = item.profitLoss >= 0;
        const card = document.createElement('div');
        card.className = 'month-card';

        let displayReturn = '–';
        if (item.returnRate !== null) {
            const sign = item.returnRate >= 0 ? '+' : '';
            displayReturn = sign + formatPercent(item.returnRate);
        }

        card.innerHTML = `
            <div class="month-name">${item.monthName} ${item.year}</div>
            <div class="profit-loss ${isPositive ? 'positive' : 'negative'}">
                ${formatCurrencyCompact(item.profitLoss)}
            </div>
            <div class="return-rate ${isPositive ? 'positive' : 'negative'}">
                ${displayReturn}
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderBarChart() {
    const chart = document.getElementById('barChart');
    if (!chart) return;
    chart.innerHTML = '';

    const monthsNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentYear = new Date().getFullYear();

    const fullMonthsData = monthsNames.map((monthName, idx) => {
        const existing = monthlyData.find(m => m.month === idx && m.year === currentYear);
        return existing || {
            year: currentYear,
            month: idx,
            monthName,
            profitLoss: 0,
            returnRate: null
        };
    });

    const validRates = fullMonthsData
        .map(m => m.returnRate)
        .filter(r => r !== null && !isNaN(r));

    const maxValue = validRates.length > 0 ? Math.max(...validRates.map(r => Math.abs(r))) : 1;

    fullMonthsData.forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'bar';

        if (item.returnRate === null || isNaN(item.returnRate)) {
            bar.style.height = '0';
            bar.style.background = '#ccc';
        } else {
            const heightPercent = (Math.abs(item.returnRate) / maxValue) * 100;
            bar.style.height = `${Math.max(2, heightPercent)}%`;

            if (item.returnRate >= 0) {
                bar.style.background = 'linear-gradient(to top, rgba(23, 158, 109, 1), rgb(52, 211, 153))';
            } else {
                bar.style.background = 'linear-gradient(to top, rgba(185, 33, 56, 1), rgb(250, 93, 117))';
            }
        }

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = item.monthName;

        const valueLabel = document.createElement('div');
        valueLabel.className = 'bar-value';
        valueLabel.textContent = item.returnRate !== null ? formatPercent(item.returnRate) : '–';

        bar.appendChild(valueLabel);
        bar.appendChild(label);
        chart.appendChild(bar);
    });
}

// ────── Calendar Trade ────── //
let DataPnLDaily = {};

function getDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function loadDailyPnLData() {
    try {
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData) || rawData.length === 0) {
            DataPnLDaily = {};
            renderCalendar();
            return;
        }

        const dailyTotals = {};
        const dailyCounts = {};

        for (const trade of rawData) {
            if (trade.action === "Deposit" || trade.action === "Withdraw") {
                continue;
            }

            if (!trade.Result || trade.Result === "Missed") {
                continue;
            }

            const date = new Date(Number(trade.date) * 1000);
            const dateKey = getDateKey(date);

            dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + (Number(trade.Pnl) || 0);
            dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
        }

        const result = {};
        for (const dateKey in dailyTotals) {
            const totalPnl = dailyTotals[dateKey];
            const tradeCount = dailyCounts[dateKey];

            const rounded = Math.round(totalPnl * 100) / 100;
            const isPositive = rounded >= 0;
            const abs = Math.abs(rounded);

            let display = abs >= 1000 
                ? (abs / 1000).toFixed(2) + 'K' 
                : abs.toFixed(2);
            display = (isPositive ? '+$' : '-$') + display;
            const raw = (isPositive ? '+' : '') + rounded.toFixed(2);

            result[dateKey] = { display, raw, tradeCount };
        }

        DataPnLDaily = result;
        renderCalendar();

    } catch (error) {
        DataPnLDaily = {};
        renderCalendar();
    }
}

const calendar = document.getElementById('calendar');
const currentMonthEl = document.getElementById('currentMonth');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const datePicker = document.getElementById('datePicker');

let currentDate = new Date();
const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];
const today = new Date();
today.setHours(0,0,0,0);

function formatFullDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function renderCalendar() {
    if (!calendar) return;
    calendar.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    currentMonthEl.textContent = `${months[month]} ${year}`;
    updateDatePicker();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        calendar.appendChild(createDayCell(date));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        calendar.appendChild(createDayCell(date));
    }

    const total = firstDay + daysInMonth;
    const remaining = 42 - total;
    for (let day = 1; day <= remaining; day++) {
        const date = new Date(year, month + 1, day);
        calendar.appendChild(createDayCell(date));
    }
}

function createDayCell(date) {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';

    const dateKey = getDateKey(date);
    const dayNum = date.getDate();
    const cellDate = new Date(date);
    cellDate.setHours(0,0,0,0);

    if (date.getMonth() !== currentDate.getMonth()) {
        dayCell.classList.add('other-month');
    }

    if (cellDate > today) {
        dayCell.classList.add('future');
    } else if (cellDate.getTime() === today.getTime()) {
        dayCell.classList.add('today');
    } else {
        dayCell.classList.add('past');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = String(dayNum).padStart(2,'0');
    dayCell.appendChild(dayNumber);

    const tradeCountEl = document.createElement('div');
    tradeCountEl.className = 'trade-count';

    const pnlValue = document.createElement('div');
    pnlValue.className = 'pnl-value';

    if (cellDate > today) {
        tradeCountEl.textContent = '';
        pnlValue.textContent = '';
    } else {
        const data = DataPnLDaily[dateKey];
        if (data) {
            tradeCountEl.textContent = `${data.tradeCount} Trades`;
            pnlValue.textContent = `PnL: ${data.display}`;
            dayCell.classList.add(data.raw.startsWith('+') ? 'positive' : 'negative');
        } else {
            tradeCountEl.textContent = '';
            pnlValue.textContent = '';
            dayCell.classList.add('empty');
        }
    }

    dayCell.appendChild(tradeCountEl);
    dayCell.appendChild(pnlValue);

    if (cellDate > today) {
        pnlValue.textContent = '';
    } else {
        const data = DataPnLDaily[dateKey];
        if (data) {
            pnlValue.textContent = `PnL: ${data.display}`;
            dayCell.classList.add(data.raw.startsWith('+') ? 'positive' : 'negative');
        } else {
            dayCell.classList.add('empty');
            pnlValue.textContent = 'No Trades';
        }
    }
    dayCell.appendChild(pnlValue);

    if (cellDate <= today && DataPnLDaily[dateKey] !== undefined) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-calender';

        const dateEl = document.createElement('p');
        dateEl.className = 'date-daily-pnl';
        dateEl.textContent = formatFullDate(date);

        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper-pnl-daily';

        const labelEl = document.createElement('p');
        labelEl.className = 'pnl-label';
        labelEl.textContent = 'PnL:';

        const valueEl = document.createElement('p');
        const rawValue = DataPnLDaily[dateKey].raw;

        const isPositive = rawValue >= 0;
        const formattedNumber = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(rawValue));

        const sign = isPositive ? '+' : '-';

        valueEl.textContent = `${sign}$${formattedNumber}`;
        valueEl.className = `pnl-value ${isPositive ? 'positive' : 'negative'}`;

        wrapper.appendChild(labelEl);
        wrapper.appendChild(valueEl);

        tooltip.appendChild(dateEl);
        tooltip.appendChild(wrapper);

        dayCell.appendChild(tooltip);
    }

    return dayCell;
}

prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

currentMonthEl.addEventListener('click', (e) => {
    e.stopPropagation();
    datePicker.classList.toggle('active');
});

// ------ Calendar Dropdown ------ //
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function initDatePicker() {
    const monthOptions = document.getElementById('monthOptions');
    monthOptions.innerHTML = '';
    months.forEach((month, index) => {
        const option = document.createElement('div');
        option.className = 'select-option';
        option.dataset.value = index;
        option.textContent = month;
        option.addEventListener('click', () => selectMonth(index));
        monthOptions.appendChild(option);
    });

    const yearOptions = document.getElementById('yearOptions');
    yearOptions.innerHTML = '';
    const baseYear = today.getFullYear();
    for (let y = baseYear - 10; y <= baseYear + 10; y++) {
        const option = document.createElement('div');
        option.className = 'select-option';
        option.dataset.value = y;
        option.textContent = y;
        option.addEventListener('click', () => selectYear(y));
        yearOptions.appendChild(option);
    }

    setupCustomDropdowns();
}

function setupCustomDropdowns() {
    const monthHeader = document.getElementById('monthHeader');
    const yearHeader = document.getElementById('yearHeader');
    const monthSelect = document.getElementById('monthSelectWrapper');
    const yearSelect = document.getElementById('yearSelectWrapper');

    monthHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        monthSelect.classList.toggle('active');
        yearSelect.classList.remove('active');
    });

    yearHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        yearSelect.classList.toggle('active');
        monthSelect.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (!monthSelect.contains(e.target)) monthSelect.classList.remove('active');
        if (!yearSelect.contains(e.target)) yearSelect.classList.remove('active');
    });

    updateMonthDisplay(currentMonth);
    updateYearDisplay(currentYear);
}

function selectMonth(monthIndex) {
    currentMonth = monthIndex;
    updateMonthDisplay(monthIndex);
    document.getElementById('monthSelectWrapper').classList.remove('active');
}

function selectYear(year) {
    currentYear = year;
    updateYearDisplay(year);
    document.getElementById('yearSelectWrapper').classList.remove('active');
}

function updateMonthDisplay(monthIndex) {
    const monthDisplay = document.getElementById('monthDisplay');
    const monthOptions = document.querySelectorAll('#monthOptions .select-option');
    
    monthDisplay.textContent = months[monthIndex];
    
    monthOptions.forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.dataset.value) === monthIndex) {
            option.classList.add('selected');
        }
    });
}

function updateYearDisplay(year) {
    const yearDisplay = document.getElementById('yearDisplay');
    const yearOptions = document.querySelectorAll('#yearOptions .select-option');
    
    yearDisplay.textContent = year;
    
    yearOptions.forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.dataset.value) === year) {
            option.classList.add('selected');
        }
    });
}

function updateDatePicker() {
    updateMonthDisplay(currentDate.getMonth());
    updateYearDisplay(currentDate.getFullYear());
}

applyDateBtn.addEventListener('click', () => {
    currentDate = new Date(currentYear, currentMonth, 1);
    renderCalendar();
    datePicker.classList.remove('active');
    document.getElementById('monthSelectWrapper').classList.remove('active');
    document.getElementById('yearSelectWrapper').classList.remove('active');
});

cancelDateBtn.addEventListener('click', () => {
    datePicker.classList.remove('active');
    updateMonthDisplay(currentDate.getMonth());
    updateYearDisplay(currentDate.getFullYear());
    document.getElementById('monthSelectWrapper').classList.remove('active');
    document.getElementById('yearSelectWrapper').classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!datePicker.contains(e.target) && e.target !== currentMonthEl) {
        datePicker.classList.remove('active');
        updateDatePicker();
        document.getElementById('monthSelectWrapper').classList.remove('active');
        document.getElementById('yearSelectWrapper').classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    initDatePicker();
    await Promise.all([
        loadMonthlyData(),
        loadDailyPnLData()
    ]);
});

// ────── Detailed Statistics ────── /
const radios = document.querySelectorAll('input[name="toggle"]');
const activeLine = document.getElementById('activeLine');
const qualityContainer = document.querySelector('.container-quality');
const averagesContainer = document.querySelector('.container-averages');

function updateLine() {
  const checked = document.querySelector('input[name="toggle"]:checked');
  const label = checked.nextElementSibling;
  const parent = checked.closest('.radio-option');

  activeLine.style.width = label.offsetWidth + 'px';
  activeLine.style.left = parent.offsetLeft + 'px';

  qualityContainer.classList.remove('active');
  averagesContainer.classList.remove('active');

  if (checked.value === 'quality') {
    qualityContainer.classList.add('active');
  } else {
    averagesContainer.classList.add('active');
  }
}

radios.forEach(radio => {
  radio.addEventListener('change', updateLine);
});

async function updateTradingStats() {
    try {
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData)) throw new Error('Expected JSON array');

        const executedTrades = rawData
            .filter(item => 
                typeof item.date === 'number' && 
                !isNaN(item.date) &&
                item.Pairs &&
                (item.Result === 'Profit' || item.Result === 'Loss')
            )
            .map(item => ({
                date: new Date(item.date * 1000),
                pnl: item.Pnl,
                rr: item.RR,
                result: (item.Result || '').toString().trim()
            }))
            .sort((a, b) => a.date - b.date);
            
        const allTradesWithPnL = rawData
            .filter(item => 
                typeof item.date === 'number' && 
                !isNaN(item.date) && 
                typeof item.Pnl === 'number'
            )
            .map(item => ({
                date: new Date(item.date * 1000),
                pnl: item.Pnl,
                rr: item.RR,
                result: (item.Result || '').toString().trim()
            }));

        const validTrades = allTradesWithPnL.filter(t => t.pnl !== null && t.pnl !== undefined);

        const profitTrades = validTrades.filter(t => t.pnl > 0);
        const lossTrades = validTrades.filter(t => t.pnl < 0);

        const avgProfit = profitTrades.length
            ? parseFloat((profitTrades.reduce((sum, t) => sum + t.pnl, 0) / profitTrades.length).toFixed(2))
            : 0;

        const avgLoss = lossTrades.length
            ? parseFloat((Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0)) / lossTrades.length).toFixed(2))
            : 0;

        const rrProfitTrades = profitTrades.filter(t => typeof t.rr === 'number');
        const avgRR = rrProfitTrades.length
            ? parseFloat((rrProfitTrades.reduce((sum, t) => sum + t.rr, 0) / rrProfitTrades.length).toFixed(2))
            : 0;

        const maxProfitStreak = calculateResultStreak(executedTrades, 'Profit');
        const maxLossStreak = calculateResultStreak(executedTrades, 'Loss');

        document.getElementById('averageProfite').textContent = formatUSD(avgProfit);
        document.getElementById('averageLoss').textContent = '-' + formatUSD(avgLoss);
        document.getElementById('averageRR').textContent = avgRR;
        document.getElementById('averageProfiteStreak').textContent = '≈ ' + maxProfitStreak;
        document.getElementById('averageLossStreak').textContent = '≈ ' + maxLossStreak;

    } catch (error) {
        console.error('Result:', error);
        const ids = ['averageProfite', 'averageLoss', 'averageRR', 'averageProfiteStreak', 'averageLossStreak'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '–';
        });
    }
}

function calculateResultStreak(trades, targetType) {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const trade of trades) {
        if (trade.result === targetType) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return maxStreak;
}

async function updateTradeStats() {
  try {
    const data = await getDBPerpetual();
    if (!Array.isArray(data)) {
      return;
    }

    const tradeData = data.filter(item => item.Pairs);

    let profit = 0, loss = 0, missed = 0, breakEven = 0;

    tradeData.forEach(item => {
      switch (item.Result) {
        case 'Profit': profit++; break;
        case 'Loss': loss++; break;
        case 'Missed': missed++; break;
        case 'Break Even': breakEven++; break;
        default:
          if (item.Result);
      }
    });

    const totalTrade = profit + loss + missed + breakEven;
    const totalTradeExecuted = profit + loss;
    const winrateMurni = totalTradeExecuted > 0
      ? ((profit / totalTradeExecuted) * 100).toFixed(2)
      : "0.00";

    const daySet = new Set();
    tradeData.forEach(item => {
      const day = new Date(item.date * 1000).setHours(0, 0, 0, 0);
      daySet.add(day);
    });

    const sortedDays = Array.from(daySet).sort((a, b) => a - b);
    const totalDailyTrade = sortedDays.length;

    let bestStreak = 0;
    let currentStreak = 0;
    let lastDay = null;

    for (const day of sortedDays) {
      if (lastDay === null) {
        currentStreak = 1;
      } else {
        const diff = (day - lastDay) / (1000 * 60 * 60 * 24);
        if (diff === 1) currentStreak++;
        else currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      lastDay = day;
    }

    let dailyStreak = sortedDays.length > 0 ? currentStreak : 0;

    document.getElementById('winrateMurni').textContent = `${winrateMurni}%`;
    document.getElementById('totalTrade').textContent = totalTrade;
    document.getElementById('totalTradeExecuted').textContent = totalTradeExecuted;
    document.getElementById('totalProfiteTrade').textContent = `Profit: ${profit}`;
    document.getElementById('totalLossTrade').textContent = `Loss: ${loss}`;
    document.getElementById('totalMissedTrade').textContent = `Missed: ${missed}`;
    document.getElementById('totalBETrade').textContent = `Break Even: ${breakEven}`;
    document.getElementById('totalDailyTrade').textContent = totalDailyTrade;
    document.getElementById('daiyStreek').textContent = dailyStreak;
    document.getElementById('bestDailtStreek').textContent = bestStreak;

  } catch (error) {
    console.error('Result:', error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateLine();
  updateTradingStats();
  updateTradeStats();
});

// ────── Global Sumary  & Single Bhhavior ────── //
async function loadTradeStats() {
  try {
    const data = await getDBPerpetual();
    const root = document.documentElement;

    // --- POS ---
    let countLong = 0, countShort = 0;
    data.forEach(item => {
      if (item.Pos === "Long") countLong++;
      else if (item.Pos === "Short") countShort++;
    });

    const totalPos = countLong + countShort || 1;
    const longPct = ((countLong / totalPos) * 100).toFixed(2);
    
    document.getElementById("long").textContent = `${longPct}%`;
    document.getElementById("short").textContent = `${((countShort / totalPos) * 100).toFixed(2)}%`;
    
    root.style.setProperty('--PLS', `${longPct}%`);


    // --- BEHAVIOR ---
    let countRev = 0, countCon = 0;
    data.forEach(item => {
      if (item.Behavior === "Reversal") countRev++;
      else if (item.Behavior === "Continuation") countCon++;
    });

    const totalBeh = countRev + countCon || 1;
    const revPct = ((countRev / totalBeh) * 100).toFixed(2);

    document.getElementById("reversal").textContent = `${revPct}%`;
    document.getElementById("continuation").textContent = `${((countCon / totalBeh) * 100).toFixed(2)}%`;
    
    root.style.setProperty('--PRC', `${revPct}%`);


    // --- METHOD ---
    let countScalp = 0, countSwing = 0, countIntra = 0;
    data.forEach(item => {
      const method = item.Method;
      if (method === "Scalping") countScalp++;
      else if (method === "Swing") countSwing++;
      else if (method === "Intraday") countIntra++;
    });

    const totalMethod = countScalp + countSwing + countIntra || 1;
    
    const elements = {
      scalping: document.getElementById("scalping"),
      swing: document.getElementById("swing"),
      intraday: document.getElementById("intraday")
    };

    const counts = { Scalping: countScalp, Swing: countSwing, Intraday: countIntra };

    Object.keys(elements).forEach(key => {
      const el = elements[key];
      const pct = ((counts[key.charAt(0).toUpperCase() + key.slice(1)] / totalMethod) * 100).toFixed(0);
      
      el.textContent = `${pct}%`;
      el.classList.remove("green", "gray");
      el.classList.add(parseInt(pct) > 0 ? "green" : "gray");
    });

  } catch (error) {
    console.error('Result:', error);
  }
}

async function loadPsychologyStats() {
  try {
    const data = await getDBPerpetual();

    let totalConf = 0, totalDoubt = 0, totalReck = 0;
    data.forEach(item => {
      const psy = item.Psychology;
      if (psy === "Confident") totalConf++;
      else if (psy === "Doubtful") totalDoubt++;
      else if (psy === "Reckless") totalReck++;
    });

    document.getElementById("confid").textContent = totalConf;
    document.getElementById("doubt").textContent = totalDoubt;
    document.getElementById("reckl").textContent = totalReck;
  } catch (error) {
    console.error('Result:', error);
  }
}

async function loadBehaviorStats() {
  try {
    const data = await getDBPerpetual();

    function calcBehavior(type, ids) {
      const trades = data.filter(t => t.Behavior === type);

      const profit = trades.filter(t => t.Result === "Profit").length;
      const loss   = trades.filter(t => t.Result === "Loss").length;
      const be     = trades.filter(t => t.Result === "Break Even").length;
      const missed = trades.filter(t => t.Result === "Missed").length;

      const validTrade = profit + loss;
      const wr = validTrade > 0 ? Math.round((profit / validTrade) * 100) : 0;

      document.getElementById(ids.trade).textContent = `Trade: ${trades.length}`;
      document.getElementById(ids.profit).textContent = profit;
      document.getElementById(ids.loss).textContent   = loss;
      document.getElementById(ids.be).textContent     = be;
      document.getElementById(ids.missed).textContent = `Missed: ${missed}`;

      const total = trades.length;
      const done  = total - missed;

      const progress = total > 0
        ? Math.round((done / total) * 100)
        : 0;

      document.documentElement.style.setProperty(ids.barVar, `${progress}%`);
    }

    // Reversal
    calcBehavior("Reversal", {
      trade: "TRev",
      profit: "PRev",
      loss: "LRev",
      be: "BERev",
      missed: "MRev",
      wr: "WrRev",
      barVar: "--PRev"
    });

    // Continuation
    calcBehavior("Continuation", {
      trade: "TCon",
      profit: "PCon",
      loss: "LCon",
      be: "BECon",
      missed: "MCon",
      wr: "WrCon",
      barVar: "--PCon"
    });

  } catch (error) {
    console.error('Result:', error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadTradeStats();
  loadPsychologyStats();
  loadBehaviorStats();
});

// ────── List Pairs ────── //
window.assetData = window.assetData || [];
let currentPairsMode = "perpetual";

async function loadAssetDataIfNeeded() {
  if (window.assetData.length === 0) {
    try {
      const res = await fetch('Asset/Link-Symbol.json');
      if (!res.ok) throw new Error('File tidak ditemukan');
      window.assetData = await res.json();
    } catch (error) {
      console.error('Result:', error);
      window.assetData = [];
    }
  }
}

function extractBaseSymbol(pairStr) {
  if (!pairStr || window.assetData.length === 0) return null;
  const clean = pairStr.toUpperCase();
  const known = window.assetData
    .map(a => a.symbol)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const sym of known) {
    if (clean.startsWith(sym)) return sym;
  }
  return null;
}

async function updatePairsTable() {
  await loadAssetDataIfNeeded();
  let rawData = [];

  if (currentPairsMode === "perpetual") {
    rawData = await getDBPerpetual();
  } else {
    rawData = await getDBSpot();
  }

  if (!Array.isArray(rawData)) {
    document.querySelector('.pairs-body').innerHTML = '<div class="no-data">Tidak ada data.</div>';
    return;
  }

  const grouped = {};
  rawData.forEach(trade => {
    if (!trade.Pairs) return;
    const base = extractBaseSymbol(trade.Pairs);
    if (!base) return;
    if (!grouped[base]) grouped[base] = [];
    grouped[base].push(trade);
  });

  const body = document.querySelector('.pairs-body');

  if (!body) {
    return;
  }

  body.innerHTML = '';

  const sortedSymbols = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  sortedSymbols.forEach(symbol => {
    const trades = grouped[symbol];
    const asset = window.assetData.find(a => a.symbol === symbol);

    const profit = trades.filter(t => t.Result === "Profit").length;
    const loss = trades.filter(t => t.Result === "Loss").length;
    const totalExecuted = profit + loss;

    const winRate = totalExecuted > 0 ? (profit / totalExecuted) * 100 : 0;
    const winRateRounded = winRate.toFixed(2);

    let winRateColor;
    if (winRate >= 75) {
      winRateColor = 'var(--green)';
    } else if (winRate >= 50) {
      winRateColor = 'var(--yellow)';
    } else {
      winRateColor = 'var(--red)';
    }

    const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.Pnl) || 0), 0);

    const pnlDisplay = totalPnL >= 0 
      ? `+${formatUSD(totalPnL)}` 
      : `-${formatUSD(Math.abs(totalPnL))}`;
      
    const pnlColor = totalPnL >= 0 ? 'var(--green)' : 'var(--red)';

    const row = document.createElement('div');
    row.className = 'pairs-row';

    const icon = asset?.link || 'https://cdn.jsdelivr.net/gh/dandidt/Crypto-Icon/Pairs%20Icon/Nexion-Default.png';
    
    row.innerHTML = `
      <div class="pair-item">
        <img class="icon-tabel" src="${icon}" loading="lazy">
        ${symbol}
      </div>
      <div>
        <div class="column-win-loss">
          <!-- Progress bar container -->
          <div class="win-loss-progress">
            <div class="win-loss-fill" style="width: ${winRate}%;"></div>
          </div>
          <div class="row-win-loss">
            <div class="row-wl">
              <div class="label-win-box"></div>
              <div class="win-badge">Win ${profit}</div>
            </div>
            <div class="row-wl">
              <div class="label-loss-box"></div>
              <div class="loss-badge">Loss ${loss}</div>
            </div>
          </div>
        </div>
      </div>
      <div style="color: ${winRateColor};">
        ${winRateRounded}%
      </div>
      <div style="color: ${pnlColor};">
        ${pnlDisplay}
      </div>
    `;

    body.appendChild(row);
  });

  if (sortedSymbols.length === 0) {
    body.innerHTML = '<div class="no-data-pairs">Data not available</div>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadBehaviorStats === 'function') loadBehaviorStats();
    updatePairsTable();
  });
} else {
  if (typeof loadBehaviorStats === 'function') loadBehaviorStats();
  updatePairsTable();
}

document.querySelectorAll(".btn-swap-pairs-tabel").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-swap-pairs-tabel")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const text = btn.textContent.toLowerCase();
    currentPairsMode = text.includes("spot") ? "spot" : "perpetual";

    updatePairsTable();
  });
});

// ────── Setting ────── //
function loadSettings() {
    const savedSetting = localStorage.getItem('tradingSettings');
    
    if (savedSetting) {
        const settings = JSON.parse(savedSetting);
        
        if (settings.perpetual) {
            document.getElementById('fee-perp').value = settings.perpetual.fee || '';
            document.getElementById('risk-perp').value = settings.perpetual.risk || '';
        }
        
        if (settings.spot) {
            document.getElementById('fee-spot').value = settings.spot.fee || '';
            document.getElementById('risk-spot').value = settings.spot.risk || '';
        }
    }
}

function saveSettings() {
    const settings = {
        perpetual: {
            fee: document.getElementById('fee-perp').value,
            risk: document.getElementById('risk-perp').value
        },
        spot: {
            fee: document.getElementById('fee-spot').value,
            risk: document.getElementById('risk-spot').value
        }
    };
    
    localStorage.setItem('tradingSettings', JSON.stringify(settings));
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', saveSettings);
    });
});

// ------ Avatar Profile ------ //
function renderAvatar() {
    const container = document.getElementById("containerProfile");
    if (!container) return;

    const imgEl = container.querySelector("img");
    if (!imgEl) return;

    const avatar = localStorage.getItem("avatar");

    if (avatar) {
        imgEl.src = avatar;
    } else {
        imgEl.src = "../Asset/User.png";
    }
}

async function renderProfile() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return;

    const user_id = user.id;

    const { data: profile, error: profileErr } = await supabaseClient
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user_id)
        .single();

    const usernameEl = document.getElementById("username");
    const emailEl = document.getElementById("email");

    usernameEl.textContent = profile?.username || "User";
    emailEl.textContent = user.email || "no-email";

    renderAvatar();
}

document.addEventListener("DOMContentLoaded", () => {
    renderProfile();
});

// ────── Calculate & Settings ────── //
function getLocalData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

window.renderRiskInfo = function() {
    const riskInfoEl = document.querySelector(".informasion-risk");
    if (riskInfoEl) {
        const saved = getLocalData('setting');
        const risk = currentActiveTab === 'perpetual' 
            ? (saved?.perp?.risk || 0) 
            : (saved?.spot?.risk || 0);
        riskInfoEl.textContent = `Risk: ${risk}%`;
    }
};

window.calculate = async function() {
    const lev = parseFloat(document.getElementById("inputLeverage")?.value);
    const sl = parseFloat(document.getElementById("inputStopLoss")?.value);

    if (isNaN(lev) || isNaN(sl) || lev <= 0 || sl <= 0) return;

    const setting = getLocalData("setting");
    let activeSetting, activeTrades;

    if (currentActiveTab === 'perpetual') {
        activeSetting = setting?.perp || { fee: 0, risk: 0 };
        activeTrades = typeof originalPerpetualTrades !== 'undefined' ? originalPerpetualTrades : [];
    } else {
        activeSetting = setting?.spot || { fee: 0, risk: 0 };
        activeTrades = typeof originalSpotTrades !== 'undefined' ? originalSpotTrades : [];
    }

    const totalPnl = activeTrades.reduce((sum, trade) => sum + (parseFloat(trade.Pnl) || 0), 0);
    const deposit = activeTrades.reduce((sum, trade) => {
        return (trade.action?.toLowerCase() === "deposit") ? sum + (parseFloat(trade.value) || 0) : sum;
    }, 0);
    
    const balance = deposit + totalPnl;
    const riskPercent = (parseFloat(activeSetting.risk) || 0) / 100;
    const feePercent = (parseFloat(activeSetting.fee) || 0) / 100;

    const riskPerTrade = balance * riskPercent;
    const positionSize = riskPerTrade / (sl / 100);
    const margin = positionSize / (currentActiveTab === 'spot' ? 1 : lev);
    const marginOpen = balance > 0 ? (margin / balance) * 100 : 0;
    
    const roiTP = sl * lev;
    const roiSL = -sl * lev;
    const feeValue = positionSize * feePercent; 

    const values = document.querySelectorAll(".value-caculate");
    if (values.length >= 6) {
        values[0].textContent = formatUSD(positionSize);
        values[1].textContent = formatUSD(margin);
        values[2].textContent = `${marginOpen.toFixed(2)}%`;
        values[3].textContent = formatUSD(feeValue);
        values[4].textContent = `${roiTP.toFixed(2)}%`;
        values[5].textContent = `${roiSL.toFixed(2)}%`;
    }

    const riskValueEl = document.querySelector(".risk-value");
    if (riskValueEl) riskValueEl.textContent = formatUSD(riskPerTrade);

    localStorage.setItem("calculate", JSON.stringify({ leverage: lev, stopLoss: sl }));
};

document.addEventListener('DOMContentLoaded', function () {
    const inputs = {
        perpFee: document.getElementById('fee-perp'),
        perpRisk: document.getElementById('risk-perp'),
        spotFee: document.getElementById('fee-spot'),
        spotRisk: document.getElementById('risk-spot'),
        leverage: document.getElementById("inputLeverage"),
        stopLoss: document.getElementById("inputStopLoss")
    };

    function saveSettings() {
        const settings = {
            perp: { fee: inputs.perpFee?.value || 0, risk: inputs.perpRisk?.value || 0 },
            spot: { fee: inputs.spotFee?.value || 0, risk: inputs.spotRisk?.value || 0 }
        };
        localStorage.setItem('setting', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = getLocalData('setting');
        if (saved) {
            if (inputs.perpFee) inputs.perpFee.value = saved.perp?.fee || "";
            if (inputs.perpRisk) inputs.perpRisk.value = saved.perp?.risk || "";
            if (inputs.spotFee) inputs.spotFee.value = saved.spot?.fee || "";
            if (inputs.spotRisk) inputs.spotRisk.value = saved.spot?.risk || "";
        }
        
        const cachedCalc = getLocalData("calculate") || {};
        if (cachedCalc.leverage && inputs.leverage) inputs.leverage.value = cachedCalc.leverage;
        if (cachedCalc.stopLoss && inputs.stopLoss) inputs.stopLoss.value = cachedCalc.stopLoss;
        
        window.renderRiskInfo();
    }

    [inputs.perpFee, inputs.perpRisk, inputs.spotFee, inputs.spotRisk].forEach(el => {
        el?.addEventListener('input', () => {
            saveSettings();
            window.renderRiskInfo();
            window.calculate();
        });
    });

    inputs.leverage?.addEventListener("input", window.calculate);
    inputs.stopLoss?.addEventListener("input", window.calculate);

    loadSettings();
    window.calculate();
});

// ────── Download Data ────── //
function getLocalDB() {
  const spot = JSON.parse(localStorage.getItem("dbspot") || "[]");
  const perp = JSON.parse(localStorage.getItem("dbperpetual") || "[]");
  return { spot, perpetual: perp };
}

function downloadJSON() {
  const data = getLocalDB();

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trading-data.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function flattenObject(obj, prefix = "", res = {}) {
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      flattenObject(val, newKey, res);
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

function toCSV(arr) {
  if (!arr.length) return "";

  const flatData = arr.map(d => flattenObject(d));
  const headers = [...new Set(flatData.flatMap(o => Object.keys(o)))];

  const rows = flatData.map(o =>
    headers.map(h => `"${(o[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV() {
  const { spot, perpetual } = getLocalDB();

  const spotCSV = toCSV(spot);
  const perpCSV = toCSV(perpetual);

  const finalCSV =
    `### DB SPOT ###\n${spotCSV}\n\n### DB PERPETUAL ###\n${perpCSV}`;

  const blob = new Blob([finalCSV], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trading-data.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById("DwnDataJSON")
  .addEventListener("click", downloadJSON);

document.getElementById("DwnDataCSV")
  .addEventListener("click", downloadCSV);


// ────── Update UI Global ────── //
async function updateAllUI() {
  try {
    const [perpData, spotData] = await Promise.all([
      getDBPerpetual(),
      getDBSpot()
    ]);

    perpetualTrades = perpData;
    spotTrades = spotData;
    originalPerpetualTrades = [...perpData];
    originalSpotTrades = [...spotData];

    if (currentActiveTab === 'perpetual') {
      renderPerpetualPaginated();
    } else {
      renderSpotPaginated();
    }

    updatePaginationUI();

    updateDashboardFromTrades(originalPerpetualTrades, originalSpotTrades);

    await updateEquityStats();
    await updateTradeStats();
    await updateStats();     
    await updateTradingStats();
    await loadTradeStats();  
    await loadBehaviorStats();
    await loadPsychologyStats();
    await updatePairsTable();
    await loadMonthlyData(); 
    await loadDailyPnLData();

    window.dispatchEvent(new Event('recalculateTrading'));
  } catch (error) {
    console.error('Result:', error);
  }
}

window.updateAllUI = updateAllUI;