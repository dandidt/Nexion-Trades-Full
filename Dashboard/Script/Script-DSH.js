// ======================= Format ======================= //
function formatUSD(value) {
    if (value === 0) return "$0";
    return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatPercentI(value) {
    if (value === 0) return "0%";
    return `${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%`;
}

function formatPercent(value) {
    if (value === 0) return "0%";
    return value.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + "%";
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

// ======================= Button Navbar ======================= //
document.addEventListener("DOMContentLoaded", () => {
  const menus = document.querySelectorAll(".box-menu-in");

  const jurnalingSection = document.querySelector(".jurnaling");
  const statsSection = document.querySelector(".statistic");
  const notesSection = document.querySelector(".notes");
  const settingSection = document.querySelector(".setting");

  if (statsSection) statsSection.style.display = "none";
  if (notesSection) notesSection.style.display = "none";
  if (settingSection) settingSection.style.display = "none";
  jurnalingSection.style.display = "block";

  function animateSection(section) {
    if (!section) return;

    const animatedItems = section.querySelectorAll('.fade-up');
    animatedItems.forEach(el => el.classList.remove('visible'));

    animatedItems.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('visible');
      }, index * 120);
    });
  }

  animateSection(jurnalingSection);

  menus.forEach((menu) => {
    menu.addEventListener("click", () => {
      if (menu.classList.contains("active")) return;

      menus.forEach((m) => m.classList.remove("active"));
      menu.classList.add("active");

      const menuName = menu.querySelector("span").textContent.trim().toLowerCase();

      jurnalingSection.style.display = "none";
      if (statsSection) statsSection.style.display = "none";
      if (notesSection) notesSection.style.display = "none";
      if (settingSection) settingSection.style.display = "none";

      window.scrollTo({ top: 0, behavior: 'instant' });

      if (menuName === "jurnaling") {
        jurnalingSection.style.display = "block";
        animateSection(jurnalingSection);
      } 
      else if (menuName === "statistic") {
        if (statsSection) {
          statsSection.style.display = "flex";
          animateSection(statsSection);
          setTimeout(() => {
            resizeBalanceCanvas();
            if (balanceCurrentData.length > 0) {
              drawBalanceChart();
            } else {
              loadTradeHistory().then(() => {
                filterData('all');
              });
            }
          }, 300);
        }
      }
      else if (menuName === "notes") {
        if (notesSection) {
          notesSection.style.display = "block";
          animateSection(notesSection);
        }
      }
      else if (menuName === "setting") {
        if (settingSection) {
          settingSection.style.display = "block";
          animateSection(settingSection);
        }
      }
    });
  });
});

// ======================= Back to Top Button ======================= //
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

// ======================= Front Dashboard ======================= //
function updateDashboardFromTrades(data = []) {
  if (!Array.isArray(data) || data.length === 0) return;

  const tradeData = data.filter(isTradeItem);

  const parsePnl = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizePair = (p) => {
    if (!p) return '';
    return String(p).replace(/\.?USDT\.P$/i, '').trim();
  };

  const pad = (n) => (n < 10 ? '0' + n : n);
  const formatDateDDMMYYYY = (d) => {
    const dt = new Date(d * 1000);
    if (Number.isNaN(dt.getTime())) return '-';
    return `${pad(dt.getDate())}-${pad(dt.getMonth()+1)}-${dt.getFullYear()}`;
  };

  const elStatsNavReversal = document.getElementById('statsNavReversal');
  const elStatsNavContinuation = document.getElementById('statsNavContinuation');

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

  // --- Behavior Stats ---
  let reversalCount = 0, continuCount = 0;
  tradeData.forEach(t => {
    const b = (t.Behavior || t.behavior || '').toString().toLowerCase();
    if (b.includes('reversal')) reversalCount++;
    else if (b.includes('continuation') || b.includes('continuasion')) continuCount++;
  });
  const totalBeh = reversalCount + continuCount;
  if (totalBeh > 0) {
    const revPct = Math.round((reversalCount / totalBeh) * 100);
    const conPct = 100 - revPct;
    if (elStatsNavReversal) elStatsNavReversal.textContent = `${revPct}% Reversal`;
    if (elStatsNavContinuation) elStatsNavContinuation.textContent = `${conPct}% Continuation`;
  } else {
    if (elStatsNavReversal) elStatsNavReversal.textContent = '0% Reversal';
    if (elStatsNavContinuation) elStatsNavContinuation.textContent = '0% Continuation';
  }

  // --- Best Performer ---
  let bestTrade = null;
  let bestPnl = -Infinity;
  for (const trade of tradeData) {
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

    let originalData = [];
    try {
      const raw = localStorage.getItem("dbtrade");
      if (raw) originalData = JSON.parse(raw);
      if (!Array.isArray(originalData)) originalData = [];
    } catch (err) {
      console.warn("⚠️ Gagal parse dbtrade:", err);
      originalData = [];
    }

    let saldoAwal = 0;
    try {
      const rawSaldo = localStorage.getItem("saldoAwal");
      saldoAwal = rawSaldo ? Number(rawSaldo) : 0;
    } catch (err) {
      console.warn("⚠️ Gagal ambil saldoAwal:", err);
    }

    let totalDeposit = 0;
    try {
      if (Array.isArray(originalData)) {
        totalDeposit = originalData.reduce((sum, item) => {
          if (item.action && item.action.toLowerCase() === "deposit") {
            const val = Number(item.value) || 0;
            return sum + val;
          }
          return sum;
        }, 0);
      }
    } catch (err) {
      console.warn("⚠️ Gagal hitung totalDeposit dari dbtrade:", err);
    }

    let bestIndexInOriginal = -1;
    const bestDateMs = new Date(bestTrade.date * 1000).getTime();
    for (let i = 0; i < originalData.length; i++) {
      const t = originalData[i];
      const tDateMs = new Date(t.date * 1000).getTime();
      const tPair = normalizePair(t.Pairs || t.pairs);
      const tPnl = parsePnl(t.Pnl);

      if (
        tDateMs === bestDateMs &&
        tPair === normPair &&
        Math.abs(tPnl - bestPnl) < 0.001
      ) {
        bestIndexInOriginal = i;
        break;
      }
    }

    let totalPnlBeforeBest = 0;
    if (bestIndexInOriginal >= 0) {
      for (let i = 0; i < bestIndexInOriginal; i++) {
        totalPnlBeforeBest += parsePnl(originalData[i].Pnl);
      }
    }

    const totalModal = saldoAwal + totalDeposit + totalPnlBeforeBest;
    if (totalModal > 0) {
      const kenaikanPct = (bestPnl / totalModal) * 100;
      if (elPersentaseBestPerformer)
        elPersentaseBestPerformer.textContent = formatPercentI(kenaikanPct);
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
  tradeData.forEach(t => {
    const pairRaw = t.Pairs || t.pairs || '';
    const p = normalizePair(pairRaw);
    if (!p) return;
    countMap[p] = (countMap[p] || 0) + 1;
    pnlMap[p] = (pnlMap[p] || 0) + parsePnl(t.Pnl);
  });

  // Highest PnL Pair
  let topByPnl = null, topByPnlValue = 0;
  for (const p in pnlMap) {
    if (pnlMap[p] > topByPnlValue || topByPnl === null) {
      topByPnl = p;
      topByPnlValue = pnlMap[p];
    }
  }
  if (elHighestPairs) elHighestPairs.textContent = topByPnl || '-';
  if (elValuehighestPairs) elValuehighestPairs.textContent = topByPnl ? formatCurrencyCompact(topByPnlValue) : '$0';

  // Most Traded Pair
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
  tradeData.forEach(t => {
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
  tradeData.forEach(t => {
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

// ======================= Trading Jurnal ======================= //
async function loadTradingData() {
  const data = await getDB();

  globalTrades = data;
  originalTrades = [...data];

  rowsPerPage = parseInt(document.querySelector('#rowsSelector .number-page-active').textContent) || 50;

  updatePaginationUI();

  renderPaginatedTable();
  initSorting();
}

function isTradeItem(item) {
  return item && (item.hasOwnProperty('Pairs') || item.hasOwnProperty('Result'));
}

function isActionItem(item) {
  return item && item.hasOwnProperty('action') && (item.action === 'Deposit' || item.action === 'Withdraw');
}

// ------ RENDER TRADING TABLE ------ //
function renderPaginatedTable() {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = globalTrades.slice(startIndex, endIndex);
  renderTradingTable(pageData);
}

function renderTradingTable(data) {
  const tbody = document.querySelector(".tabel-trade tbody");
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    if (isActionItem(item)) {
      const date = new Date(item.date * 1000);
      const formattedDate = date.toLocaleDateString("id-ID");
      const value = item.value || 0;
      const isDeposit = item.action === "Deposit";

      const row = document.createElement("tr");
      row.classList.add(isDeposit ? "deposit" : "withdraw");

      row.innerHTML = `
        <td><p class="no">${item.tradeNumber || '-'}</p></td>
        <td><p class="date">${formattedDate}</p></td>
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

    // === HANDLE TRADE BIASA ===
    if (!isTradeItem(item)) return;

    const trade = item;

    function formatDateAsWIB(dateInput) {
      const timestamp = typeof dateInput === 'number' ? dateInput * 1000 : dateInput;
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '-';

      return d.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }

    const formattedDate = formatDateAsWIB(item.date);

    const rr = Number(trade.RR);
    const margin = Number(trade.Margin) || 0;
    const pnl = Number(trade.Pnl) || 0;

    // ====== CLASS DYNAMIC RULES ======
    let rrClass = "rr-null";
    if (rr > 0) rrClass = "rr-win";
    else if (rr < 0) rrClass = "rr-lose";

    const psyClass = (trade.Psychology || "confident").toLowerCase();
    const posClass = (trade.Pos === "S") ? "short" : "long";

    let resultClass = "result-lose";
    const resultValue = trade.Result?.toLowerCase();
    if (resultValue === "win" || resultValue === "profit") resultClass = "result-win";
    else if (resultValue === "missed") resultClass = "result-missed";

    let pnlClass = "pnl-null";
    if (pnl > 0) pnlClass = "pnl-win";
    else if (pnl < 0) pnlClass = "pnl-loss";

    // ====== ROW TEMPLATE ======
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><p class="no">${trade.tradeNumber || '-'}</p></td>
      <td><p class="date">${formattedDate}</p></td>
      <td><p class="pairs">${trade.Pairs || '-'}</p></td>
      <td><p class="method">${trade.Method || '-'}</p></td>
      <td><p class="confluance">${(trade.Confluance?.Entry || '-') + ' - ' + (trade.Confluance?.TimeFrame || '-')}</p></td>
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
        <div class="box-causes" id="box-files" data-bias="${trade.Files?.Bias || '#'}" data-last="${trade.Files?.Last || '#'}">
          <svg class="icon-causes" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
            <path d="M264-240h432L557-426q-2-1-3.69-1.6-1.69-.6-3.31-1.4L444-288l-72-96-108 144ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-528q0-29.7 21.15-50.85Q186.3-768 216-768h192v72H216v528h528v-231l72 72v159q0 29.7-21.15 50.85Q773.7-96 744-96H216Zm264-336Zm381 48L738-507q-20 13-42.55 20-22.55 7-47.92 7Q578-480 529-529t-49-119q0-70 49-119t119-49q70 0 119 48.95t49 118.88q0 25.17-7 47.67T789-558l123 123-51 51ZM647.77-552Q688-552 716-579.77q28-27.78 28-68Q744-688 716.23-716q-27.78-28-68-28Q608-744 580-716.23q-28 27.78-28 68Q552-608 579.77-580q27.78 28 68 28Z"/>
          </svg>
        </div>
      </td>
      <td><p class="${posClass}">${posClass.toUpperCase()}</p></td>
      <td><p class="margin">${formatUSD(margin)}</p></td>
      <td><p class="${resultClass}">${trade.Result || '-'}</p></td>
      <td><p class="${pnlClass}">${pnl === 0 ? formatUSD(0) : (pnl > 0 ? "+" : "-") + formatUSD(Math.abs(pnl))}</p></td>
    `;

    row.querySelector("#box-causes").dataset.content = trade.Causes || "No causes";
    const boxFiles = row.querySelector("#box-files");
    boxFiles.dataset.bias = trade.Files?.Bias || "#";
    boxFiles.dataset.last = trade.Files?.Last || "#";

    tbody.appendChild(row);
  });

  setTimeout(() => {
    if (window.tooltipManager) window.tooltipManager.destroy();
    window.tooltipManager = new TooltipManager();
  }, 100);

  updateDashboardFromTrades(originalTrades);

  if (isEditMode) {
    document.querySelectorAll(".tabel-trade tbody tr").forEach(row => {
      row.style.cursor = "pointer";
      row.classList.add("editable");
    });
    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) btnEdit.classList.add("active");
  }
}

// ------ Short Fiilter ------ //
let globalTrades = [];
let originalTrades = [];
let currentSort = { key: null, direction: null };

function getValue(item, key) {
  if (!item) return "";
  switch (key) {
    case "date":
      return item.date;
    case "pairs":
      return item.Pairs ?? item.pairs ?? "";
    case "pnl":
      return item.Pnl ?? item.pnl ?? item.PnL ?? 0;
    default:
      return item[key] ?? "";
  }
}

function nextSortState(key) {
  if (key === "date") {
    if (currentSort.key !== key || currentSort.direction === null) return "desc";
    return null;
  }

  if (currentSort.key !== key) return "asc";
  if (currentSort.direction === "asc") return "desc";
  if (currentSort.direction === "desc") return null;
  return "asc";
}

function initSorting() {
  const headers = document.querySelectorAll("th.sortable");

  headers.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;

      const nextDirection = nextSortState(key);
      if (!nextDirection) {
        // Kembalikan ke data asli halaman ini (tanpa sort)
        currentSort = { key: null, direction: null };
        renderPaginatedTable(); // render ulang dari globalTrades
      } else {
        currentSort = { key, direction: nextDirection };

        // Ambil data halaman ini SAAT INI
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        let pageData = globalTrades.slice(startIndex, endIndex);

        // Sort hanya data halaman ini
        pageData = [...pageData].sort((a, b) =>
          sortTrades(a, b, currentSort.key, currentSort.direction)
        );

        // Render langsung data yang sudah disort
        renderTradingTable(pageData);
      }

      updateSortIcons();
    });
  });

  // Reset ikon
  document.querySelectorAll("th.sortable .sort-icon").forEach(span => {
    const th = span.closest("th.sortable");
    const key = th ? th.dataset.key : null;
    span.innerHTML = getSortIcon(key, null);
  });
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

  const color = "#ffffff";
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

document.addEventListener("DOMContentLoaded", loadTradingData);

// ------ Trading Jurnal Tooltip ------ //
class TooltipManager {
  constructor() {
    this.tooltip = document.getElementById('tooltip-box');
    this.tooltipContent = document.getElementById('tooltip-content');
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
      const bias = this.currentTarget.dataset.bias || "";
      const last = this.currentTarget.dataset.last || "";
      const biasLink = this.currentTarget.dataset.biasLink || bias;
      const lastLink = this.currentTarget.dataset.lastLink || last;

    content = `
      <div class="tooltip-imgs-grid" style="display: flex; gap: 12px; justify-content: center; margin-bottom: 8px;">
        ${bias ? `
          <div style="text-align: center;">
            <a href="${biasLink}" target="_blank" style="display: inline-block;">
              <div class="tooltip-img-placeholder" style="width: 160px; height: 90px; border-radius: 4px; border: 1px solid #eee; background: #333; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
                ${bias.startsWith('http') ? `<img src="${bias}" alt="Preview 1" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : 'No image'}
              </div>
            </a>
            <div style="margin-top: 6px; font-size: 12px;">
              <a href="${biasLink}" target="_blank" class="tooltip-link">Image Before</a>
            </div>
          </div>
        ` : `
          <div style="text-align: center;">
            <div class="tooltip-img-placeholder" style="width: 160px; height: 90px; border-radius: 4px; border: 1px solid #444; background: #333; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
              No image
            </div>
            <div style="margin-top: 6px; font-size: 12px; color: #555;">
              Image Before
            </div>
          </div>
        `}
        
        ${last ? `
          <div style="text-align: center;">
            <a href="${lastLink}" target="_blank" style="display: inline-block;">
              <div class="tooltip-img-placeholder" style="width: 160px; height: 90px; border-radius: 4px; border: 1px solid #eee; background: #333; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
                ${last.startsWith('http') ? `<img src="${last}" alt="Preview 2" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : 'No image'}
              </div>
            </a>
            <div style="margin-top: 6px; font-size: 12px;">
              <a href="${lastLink}" target="_blank" class="tooltip-link">Image After</a>
            </div>
          </div>
        ` : `
          <div style="text-align: center;">
            <div class="tooltip-img-placeholder" style="width: 160px; height: 90px; border-radius: 4px; border: 1px solid #444; background: #333; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
              No image
            </div>
            <div style="margin-top: 6px; font-size: 12px; color: #555;">
              Image After
            </div>
          </div>
        `}
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
    console.error('Failed to initialize tooltip manager:', error);
  }
});

// ------ Pagination ------ //
let currentPage = 1;
let rowsPerPage = 50;

function updatePaginationUI() {
  const totalTrades = globalTrades.length;
  const totalPages = Math.max(1, Math.ceil(totalTrades / rowsPerPage));

  document.getElementById('tradeTotal').textContent = `${totalTrades} Trade${totalTrades !== 1 ? 's' : ''}`;

  document.getElementById('pageOf').textContent = `Of ${totalPages}`;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const pageMenu = document.getElementById('pageDropdown');
  const pageItems = Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  const pageActive = document.querySelector('#pageSelector .number-page-active');
  pageActive.textContent = currentPage;

  pageMenu.innerHTML = '';
  pageItems.forEach(num => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.textContent = num;
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      goToPage(parseInt(num));
      pageMenu.classList.remove('active');
    });
    pageMenu.appendChild(div);
  });

  updatePageNumberBoxes(totalPages);
}

function updatePageNumberBoxes(totalPages) {
  const container = document.querySelector('.wrapper-page-pagination');

  const leftFirst = document.querySelector('.left-frist-page');
  const leftOne = document.querySelector('.left-one-page');
  const rightOne = document.querySelector('.right-one-page');
  const rightFirst = document.querySelector('.right-frist-page');

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
  const totalPages = Math.ceil(globalTrades.length / rowsPerPage);
  if (page < 1 || page > totalPages || page === currentPage) return;

  currentPage = page;
  
  currentSort = { key: null, direction: null };
  
  renderPaginatedTable();
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
    renderPaginatedTable();
    updatePaginationUI();
  });
  rowsMenu.appendChild(div);
});

document.querySelector('.left-frist-page').addEventListener('click', () => goToPage(1));
document.querySelector('.left-one-page').addEventListener('click', () => goToPage(currentPage - 1));
document.querySelector('.right-one-page').addEventListener('click', () => goToPage(currentPage + 1));
document.querySelector('.right-frist-page').addEventListener('click', () => {
  const totalPages = Math.ceil(globalTrades.length / rowsPerPage);
  goToPage(totalPages);
});

// =================== Dashboard Header =================== //
async function updateEquityStats() {
  try {
    const tradingData = await getDB();

    if (!Array.isArray(tradingData)) {
      console.warn("Data trading tidak valid");
      return;
    }

    let totalPnl = 0;
    let totalDeposit = 0;
    let totalWithdraw = 0;
    let totalFeePaid = 0;

    const formatCurrency = (n) => {
      const v = Number(n) || 0;
      const sign = v < 0 ? "-" : "";
      const abs = Math.abs(v);
      return sign + "$" + abs.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    tradingData.forEach(item => {
      if (item.action === "Deposit") {
        totalDeposit += Math.abs(item.value || 0);
      } else if (item.action === "Withdraw") {
        totalWithdraw += Math.abs(item.value || 0);
      } else if (item.hasOwnProperty("Pnl")) {
        totalPnl += Number(item.Pnl) || 0;

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

          totalFeePaid += fee;
        }
      }
    });

    const totalEquity = totalDeposit + totalPnl - totalWithdraw;
    const persentaseWithdraw = totalDeposit > 0
      ? ((totalWithdraw / totalDeposit) * 100).toFixed(2)
      : "0.00";

    // === HITUNG PERSENTASE FEE ===
    let persentaseFee = "0.00";
    if (totalEquity > 0) {
      persentaseFee = ((totalFeePaid / totalEquity) * 100).toFixed(2);
    }
    // Jika totalEquity <= 0, biarkan "0.00" (atau ganti jadi "N/A" jika mau)

    // Update elemen
    const elTotalEquity = document.getElementById("totalEquity");
    const elTotalPerp = document.getElementById("total-perp");
    const elPersentaseWithdraw = document.getElementById("persentaseWithdraw");
    const elValueWithdraw = document.getElementById("valueWithdraw");
    const elValueDeposit = document.getElementById("valueDeposit");
    const elValueFeePaid = document.getElementById("valueFeePaid");
    const elPersentaseFeePaid = document.getElementById("persentaseFeePaid"); // <-- BARU

    if (elTotalEquity) elTotalEquity.textContent = formatCurrency(totalEquity);
    if (elTotalPerp) elTotalPerp.textContent = formatCurrency(totalEquity);
    if (elPersentaseWithdraw) elPersentaseWithdraw.textContent = `${persentaseWithdraw}%`;
    if (elValueWithdraw) elValueWithdraw.textContent = formatCurrency(totalWithdraw);
    if (elValueDeposit) elValueDeposit.textContent = formatCurrency(totalDeposit);
    if (elValueFeePaid) elValueFeePaid.textContent = formatCurrency(-totalFeePaid);
    if (elPersentaseFeePaid) elPersentaseFeePaid.textContent = `(${persentaseFee}%)`; // <-- TAMPILKAN

  } catch (error) {
    console.error("Gagal update equity stats:", error);
  }
}

document.addEventListener("DOMContentLoaded", updateEquityStats);
window.updateEquityStats = updateEquityStats;

// ======================= Container 1 Statistic ======================= //
async function updateStats() {
  const trades = await getDB();

  if (!Array.isArray(trades)) {
    console.warn("Data trading tidak valid");
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
  document.getElementById("totalProfite").textContent =
    totalPnL < 0 ? `-${formattedTotalPnL}` : formattedTotalPnL;

  const persentaseIncrease = deposit > 0 ? (totalPnL / deposit) * 100 : 0;
  document.getElementById("persentaseIncrease").textContent = formatPercent(persentaseIncrease);

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

  document.getElementById("totalValueWin").textContent = "+" + formatUSD(Math.abs(totalWin));
  document.getElementById("totalValueLoss").textContent = "-" + formatUSD(Math.abs(totalLoss));

  const totalAbsWin = Math.abs(totalWin);
  const totalAbsLoss = Math.abs(totalLoss);
  const totalAbs = totalAbsWin + totalAbsLoss;

  const winPercent = totalAbs > 0 ? ((totalAbsWin / totalAbs) * 100).toFixed(2) : "0.00";
  const lossPercent = totalAbs > 0 ? ((totalAbsLoss / totalAbs) * 100).toFixed(2) : "0.00";

  document.getElementById("persentaseValueWin").textContent = winPercent + "%";
  document.getElementById("persentaseValueLoss").textContent = lossPercent + "%";

  const bxDwn = document.querySelector(".bx-dwn");
  if (bxDwn) {
    const winNum = parseFloat(winPercent);
    const lossNum = parseFloat(lossPercent);

    if (winNum >= 50) {
      bxDwn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="rgb(52, 211, 153)">
          <path d="m123-240-43-43 292-291 167 167 241-241H653v-60h227v227h-59v-123L538-321 371-488 123-240Z"/>
        </svg>
        <p class="value-lessons green">UP</p>
      `;
    } else if (lossNum > 50) {
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

  document.getElementById("worstTrade").textContent = "-" + maxDropPercent.toFixed(2) + "%";
  document.getElementById("valueWorstTrade").textContent = "-" + formatUSD(maxDropValue);

  let balance = deposit;
  let athBalance = balance;
  tradeOnly.forEach(t => {
    balance += Number(t.Pnl) || 0;
    if (balance > athBalance) athBalance = balance;
  });

  document.getElementById("valueAthBalance").textContent = formatUSD(athBalance);
  const athPercent = deposit > 0 ? ((athBalance - deposit) / deposit) * 100 : 0;
  document.getElementById("persentaseAthBalance").textContent = formatPercent(athPercent) + " ROE";
}

updateStats().catch(console.error);

// ======================= Monthly Prtformance & Calender Trade ======================= //
// ------ Monthly Prtformance ------ //

let monthlyData = [];

async function loadMonthlyData() {
    try {
        const rawData = await getDB();
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
        console.error('Error loading monthly data:', error);
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

    // Buat array 12 bulan
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

// ------ Calendar Trade ------ //
let DataPnLDaily = {};

function getDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function loadDailyPnLData() {
    try {
        const rawData = await getDB();
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
        console.error('Error loading daily PnL:', error);
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

// ======================= Container 2 Statistic ======================= //

// ------ Swap menu Detailed Statistics ------ /
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

updateLine();

// ------ Detailed Statistics ------ //
async function updateTradingStats() {
    try {
        const rawData = await getDB();
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

    } catch (err) {
        console.error('Gagal memuat statistik trading:', err);
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
            // Reset streak untuk semua trade yang bukan targetType (termasuk lawan jenis)
            currentStreak = 0;
        }
    }

    return maxStreak;
}

updateTradingStats();

async function updateTradeStats() {
  try {
    const data = await getDB();
    if (!Array.isArray(data)) {
      console.error('Data harus berupa array');
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
          if (item.Result) console.warn('Nilai Result tidak dikenali:', item.Result);
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
    console.error('Gagal memuat data:', error);
  }
}

updateTradeStats();
window.updateTradeStats = updateTradeStats;

// ======================= Global Sumary  & Single Bhhavior ======================= //
async function loadTradeStats() {
  try {
    const data = await getDB();

    // Pos (Long / Short)
    let countLong = 0, countShort = 0;
    data.forEach(item => {
      if (item.Pos === "B") countLong++;
      else if (item.Pos === "S") countShort++;
    });

    const totalPos = countLong + countShort || 1;
    const longPct = ((countLong / totalPos) * 100).toFixed(2);
    const shortPct = ((countShort / totalPos) * 100).toFixed(2);

    document.getElementById("long").textContent = `${longPct}%`;
    document.getElementById("short").textContent = `${shortPct}%`;
    document.getElementById("progressLongShort").style.width = `${longPct}%`;

    // Behavior (Reversal / Continuation)
    let countRev = 0, countCon = 0;
    data.forEach(item => {
      if (item.Behavior === "Reversal") countRev++;
      else if (item.Behavior === "Continuation") countCon++;
    });

    const totalBeh = countRev + countCon || 1;
    const revPct = ((countRev / totalBeh) * 100).toFixed(2);
    const conPct = ((countCon / totalBeh) * 100).toFixed(2);

    document.getElementById("reversal").textContent = `${revPct}%`;
    document.getElementById("continuation").textContent = `${conPct}%`;
    document.getElementById("progressRevCon").style.width = `${revPct}%`;

    // Method (Scalping / Swing / Intraday)
    let countScalp = 0, countSwing = 0, countIntra = 0;
    data.forEach(item => {
      const method = item.Method;
      if (method === "Scalping") countScalp++;
      else if (method === "Swing") countSwing++;
      else if (method === "Intraday") countIntra++;
    });

    const totalMethod = countScalp + countSwing + countIntra || 1;
    const scalpPct = ((countScalp / totalMethod) * 100).toFixed(0);
    const swingPct = ((countSwing / totalMethod) * 100).toFixed(0);
    const intraPct = ((countIntra / totalMethod) * 100).toFixed(0);

    const scalpEl = document.getElementById("scalping");
    const swingEl = document.getElementById("swing");
    const intraEl = document.getElementById("intraday");

    scalpEl.textContent = `${scalpPct}%`;
    swingEl.textContent = `${swingPct}%`;
    intraEl.textContent = `${intraPct}%`;

    // Update warna badge
    [scalpEl, swingEl, intraEl].forEach(el => {
      const val = parseFloat(el.textContent);
      el.classList.remove("badge-green", "badge-gray");
      el.classList.add(val > 0 ? "badge-green" : "badge-gray");
    });

  } catch (err) {
    console.error("Gagal memuat data trading:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTradeStats);

async function loadBehaviorStats() {
  try {
    const data = await getDB();

    // Reversal
    const reversalTrades = data.filter(t => t.Behavior === "Reversal");
    const totalRev = reversalTrades.length;

    const totalRevProfit = reversalTrades.filter(t => t.Result === "Profit").length;
    const totalRevLoss   = reversalTrades.filter(t => t.Result === "Loss").length;
    const totalRevMissed = reversalTrades.filter(t => t.Result === "Missed").length;

    const wrReversal = totalRev > 0 
        ? ((totalRevProfit / (totalRevProfit + totalRevLoss)) * 100).toFixed(0) 
        : 0;

    document.getElementById("totalTradeReveral").textContent = totalRev;
    document.getElementById("totalProfitReveral").textContent = totalRevProfit;
    document.getElementById("totalLossReveral").textContent = totalRevLoss;
    document.getElementById("totalMissedReveral").textContent = totalRevMissed;

    const wrRevEl = document.getElementById("wrReversal");
    wrRevEl.textContent = `Winrate ${wrReversal}%`;
    wrRevEl.classList.remove("winrate-positive", "winrate-negative");
    wrRevEl.classList.add(wrReversal >= 50 ? "winrate-positive" : "winrate-negative");

    // Continuation
    const contTrades = data.filter(t => t.Behavior === "Continuation");
    const totalCont = contTrades.length;

    const totalContProfit = contTrades.filter(t => t.Result === "Profit").length;
    const totalContLoss   = contTrades.filter(t => t.Result === "Loss").length;
    const totalContMissed = contTrades.filter(t => t.Result === "Missed").length;

    const wrContinuation = totalCont > 0 
        ? ((totalContProfit / (totalContProfit + totalContLoss)) * 100).toFixed(0)
        : 0;

    document.getElementById("totalTradeContinuation").textContent = totalCont;
    document.getElementById("totalProfitContinuation").textContent = totalContProfit;
    document.getElementById("totalLossContinuation").textContent = totalContLoss;
    document.getElementById("totalMissedContinuation").textContent = totalContMissed;

    const wrContEl = document.getElementById("wrContinuation");
    wrContEl.textContent = `Winrate ${wrContinuation}%`;
    wrContEl.classList.remove("winrate-positive", "winrate-negative");
    wrContEl.classList.add(wrContinuation >= 50 ? "winrate-positive" : "winrate-negative");

  } catch (err) {
    console.error("Gagal memuat data trading:", err);
  }
}

async function loadPsychologyStats() {
  try {
    const data = await getDB();

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
  } catch (err) {
    console.error("Gagal memuat data psychology:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPsychologyStats);

// ======================= List Pairs ======================= //
window.assetData = window.assetData || [];

async function loadAssetDataIfNeeded() {
  if (window.assetData.length === 0) {
    try {
      const res = await fetch('Asset/Link-Symbol.json');
      if (!res.ok) throw new Error('File tidak ditemukan');
      window.assetData = await res.json();
    } catch (err) {
      console.error("⚠️ Gagal memuat Asset/Link-Symbol.json:", err);
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
  const rawData = await getDB();

  if (!Array.isArray(rawData)) {
    console.warn("Data trading tidak valid.");
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
    console.error("Element .pairs-body tidak ditemukan!");
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

// ======================= Setting ======================= //
function loadSettings() {
    const savedSetting = localStorage.getItem('setting');
    if (savedSetting) {
        const setting = JSON.parse(savedSetting);
        document.getElementById('fee').value = setting.fee;
        document.getElementById('risk').value = setting.risk;
    }
}

document.addEventListener('DOMContentLoaded', loadSettings);

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

// ------ Download Data ------ //
document.addEventListener('DOMContentLoaded', function () {
    const downloadCSVBtn = document.getElementById('downloadCSV');
    const downloadJSONBtn = document.getElementById('downloadJSON');
    const localStorageKey = 'dbtrade';

    function downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function flattenObject(obj, prefix = '') {
        const flattened = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const pre = prefix.length ? prefix + '.' : '';
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, flattenObject(obj[key], pre + key));
                } else {
                    flattened[pre + key] = obj[key] === null ? '' : String(obj[key]);
                }
            }
        }
        return flattened;
    }

    function convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return 'No data';

        const flatData = data.map(item => flattenObject(item));
        const headers = [...new Set(flatData.flatMap(Object.keys))].sort();

        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of flatData) {
            const values = headers.map(header => {
                let val = row[header] || '';
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    if (downloadJSONBtn) {
        downloadJSONBtn.addEventListener('click', () => {
            try {
                const rawData = localStorage.getItem(localStorageKey);
                if (!rawData) {
                    return;
                }
                const data = JSON.parse(rawData);
                const jsonStr = JSON.stringify(data, null, 2);
                downloadFile(jsonStr, 'trades.json', 'application/json');
            } catch (e) {
                console.error('Gagal membuat file JSON:', e);
            }
        });
    }

    // === Event: Download CSV ===
    if (downloadCSVBtn) {
        downloadCSVBtn.addEventListener('click', () => {
            try {
                const rawData = localStorage.getItem(localStorageKey);
                if (!rawData) {
                    return;
                }
                const data = JSON.parse(rawData);
                const csvContent = convertToCSV(data);
                downloadFile(csvContent, 'trades.csv', 'text/csv');
            } catch (e) {
                console.error('Gagal membuat file CSV:', e);
            }
        });
    }
});

// ======================= Caculate ======================= //
function getLocalData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
        return null;
    }
}

function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.classList.add("toast");
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    const feeInput = document.getElementById('fee');
    const riskInput = document.getElementById('risk');
    const riskInfoEl = document.querySelector(".informasion-risk");
    const leverageInput = document.getElementById("inputLeverage");
    const stopLossInput = document.getElementById("inputStopLoss");
    const localStorageKey = 'setting';

    const cachedData = getLocalData("calculate") || {};
    if (cachedData.leverage) leverageInput.value = cachedData.leverage;
    if (cachedData.stopLoss) stopLossInput.value = cachedData.stopLoss;

    function saveSettings() {
        const settings = {
            fee: feeInput?.value || 0,
            risk: riskInput?.value || 0
        };
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(settings));
        } catch (e) {
            console.error('Gagal menyimpan ke localStorage:', e);
        }
    }

    function loadSettings() {
        const saved = getLocalData(localStorageKey);
        if (saved) {
            if (feeInput && saved.fee !== undefined) feeInput.value = saved.fee;
            if (riskInput && saved.risk !== undefined) riskInput.value = saved.risk;
        }
        renderRiskInfo();
    }

    function renderRiskInfo() {
        if (riskInfoEl) {
            const setting = getLocalData(localStorageKey) || { risk: 0 };
            const risk = parseFloat(setting.risk) || 0;
            riskInfoEl.textContent = `Risk: ${risk}%`;
        }
    }

    async function calculate() {
        await getDB();

        const leverage = parseFloat(leverageInput?.value);
        const stopLoss = parseFloat(stopLossInput?.value);

        if (isNaN(leverage) || isNaN(stopLoss) || leverage <= 0 || stopLoss <= 0) return;

        const setting = getLocalData("setting") || { fee: 0, risk: 0 };
        const dbtrade = getLocalData("dbtrade") || [];

        const totalPnl = dbtrade.reduce((sum, trade) => sum + (parseFloat(trade.Pnl) || 0), 0);
        const deposit = dbtrade.reduce((sum, trade) => {
            if (trade.action && trade.action.toLowerCase() === "deposit") {
                return sum + (parseFloat(trade.value) || 0);
            }
            return sum;
        }, 0);
        const balance = deposit + totalPnl;

        const riskPercent = (parseFloat(setting.risk) || 0) / 100;
        const feePercent = (parseFloat(setting.fee) || 0) / 100;

        const riskPerTrade = balance * riskPercent;
        const positionSize = riskPerTrade / (stopLoss / 100);
        const margin = positionSize / leverage;
        const marginOpen = (margin / balance) * 100;
        const roiTP = stopLoss * leverage;
        const roiSL = -stopLoss * leverage;
        const feeValue = positionSize * feePercent / 100;

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
        if (riskValueEl) {
            riskValueEl.textContent = formatUSD(riskPerTrade);
        }

        localStorage.setItem("calculate", JSON.stringify({
            leverage: leverageInput.value,
            stopLoss: stopLossInput.value
        }));
    }

    window.addEventListener('recalculateTrading', calculate);

    // Copy to clipboard on popup click
    document.querySelector(".popup-caculate")?.addEventListener("click", function (e) {
        const row = e.target.closest(".row-if");
        if (row) {
            const valueEl = row.querySelector(".value-caculate");
            if (valueEl) {
                let text = valueEl.textContent.replace('$', '').replace(/,/g, '');
                navigator.clipboard.writeText(text)
                    .then(() => showToast(`Copied: ${text}`))
                    .catch(() => showToast("Gagal copy"));
            }
        }
    });

    // Event listeners
    feeInput?.addEventListener('input', saveSettings);
    riskInput?.addEventListener('input', () => {
        saveSettings();
        renderRiskInfo();
        calculate();
    });

    leverageInput?.addEventListener("input", calculate);
    stopLossInput?.addEventListener("input", calculate);

    // Init
    loadSettings();
    calculate();
});

// ======================= Notes ======================= //
function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function renderNotes(filter = "ALL") {
    const container = document.querySelector(".wrapper-content-notes");
    if (!container) return;

    let db = await window.getDBNotes();

    let filtered = db;
    if (filter !== "ALL") {
        filtered = db.filter(note =>
            note.category && note.category.toLowerCase() === filter.toLowerCase()
        );
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:#999; text-align:center; padding:20px;">Data not available</p>`;
        return;
    }

    let html = "";
    filtered.forEach(note => {
        html += `
            <div class="content-notes">
                <p class="title-content-notes">${note.title}</p>
                <p class="date-content-notes">${formatDate(note.timestamp)}</p>
                <p class="content-main-notes">
                    <strong>Something happened: </strong>${note.something || "-"}
                </p>
                <div class="learning-content-notes">
                    <div class="text-learning-notes">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M480-144 216-276v-240L48-600l432-216 432 216v312h-72v-276l-96 48v240L480-144Zm0-321 271-135-271-135-271 135 271 135Zm0 240 192-96v-159l-192 96-192-96v159l192 96Zm0-240Zm0 81Zm0 0Z"/></svg>
                        <p><strong>Learning: </strong>${note.learning || "-"}</p>
                    </div>
                </div>
                <div class="action-content-plan-notes">
                    <div class="action-content-plan">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M407.74-240Q378-240 357-261.15 336-282.3 336-312v-67q-57-37.3-88.5-95.65Q216-533 216-600q0-110.31 76.78-187.16 76.78-76.84 187-76.84T667-787.16q77 76.85 77 187.16 0 66.82-31.5 125.41T624-379v67q0 29.7-21.18 50.85Q581.65-240 551.91-240H407.74Zm.26-72h144v-106l33-21q41-26 64-69.18 23-43.18 23-91.82 0-79.68-56.23-135.84-56.22-56.16-136-56.16Q400-792 344-735.84 288-679.68 288-600q0 48.64 23 91.82Q334-465 375-439l33 21v106Zm0 216q-20.4 0-34.2-13.8Q360-123.6 360-144v-24h240v24q0 20.4-13.8 34.2Q572.4-96 552-96H408Zm72-504Z"/></svg>
                        <p><strong>Action Plan: </strong>${note.plan || "-"}</p>
                    </div>
                </div>
                <div class="wrapper-position-right-notes">
                    <div class="box-category-notes">
                        <p class="text-category-notes">${note.category || "None"}</p>
                    </div>
                    <div class="box-delete-notes" data-id="${note.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
                            <path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getNextNoteId() {
    const db = localStorage.getItem("dbnotes");
    if (!db) return 1;

    try {
        const notes = JSON.parse(db);
        if (!Array.isArray(notes) || notes.length === 0) return 1;
        const maxId = Math.max(...notes.map(n => Number(n.id) || 0));
        return maxId + 1;
    } catch (e) {
        console.warn("⚠️ Gagal baca dbnotes untuk ID", e);
        return 1;
    }
}

function showConfirmDeleteNotes(noteId) {
    return new Promise((resolve) => {
        const popup = document.getElementById("confirmDeleteNotes");
        const messageEl = document.getElementById("confirmasionIdNotes");
        const btnDelete = document.getElementById("btnDeleteNotes");
        const btnCancel = document.getElementById("btnCancelNotes");

        messageEl.textContent = `Are you sure you want to delete note #${noteId}?`;
        popup.classList.remove("hidden");

        btnDelete.replaceWith(btnDelete.cloneNode(true));
        btnCancel.replaceWith(btnCancel.cloneNode(true));

        const newBtnDelete = document.getElementById("btnDeleteNotes");
        const newBtnCancel = document.getElementById("btnCancelNotes");

        newBtnDelete.onclick = () => {
            popup.classList.add("hidden");
            resolve(true);
        };

        newBtnCancel.onclick = () => {
            popup.classList.add("hidden");
            resolve(false);
        };

        popup.onclick = (e) => {
            if (e.target === popup) {
                popup.classList.add("hidden");
                resolve(false);
            }
        };
    });
}

async function handleAddNote() {
    const saveBtn = document.getElementById("notesSave");
    if (!saveBtn) return;
    saveBtn.classList.add("loading");

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");

        const title = document.getElementById("notesTitle")?.value.trim();
        const something = document.getElementById("notesSomething")?.value.trim();
        const learning = document.getElementById("notesLearning")?.value.trim();
        const plan = document.getElementById("notesPlan")?.value.trim();
        const dropdownSelected = document.querySelector('.custom-dropdown[data-dropdown="category"] .dropdown-selected span');
        const category = dropdownSelected?.innerText.trim() || "Category";

        const titleInput = document.getElementById("notesTitle");
        const dropdownSelectedEl = document.querySelector('.custom-dropdown[data-dropdown="category"] .dropdown-selected');

        titleInput.style.borderColor = "";
        if (dropdownSelectedEl) dropdownSelectedEl.style.borderColor = "";

        let isValid = true;

        if (!titleInput.value.trim()) {
            titleInput.style.borderColor = "rgb(250, 93, 117)";
            isValid = false;
        }

        if (category === "Category") {
            if (dropdownSelectedEl) dropdownSelectedEl.style.borderColor = "rgb(250, 93, 117)";
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const nextId = getNextNoteId();

        const serverNote = {
            id: nextId,
            user_id: user.id,
            timestamp: Date.now(),
            title: title,
            category: category === "Category" ? null : category,
            something: something || null,
            learning: learning || null,
            plan: plan || null
        };

        const { data: insertedNote, error: insertErr } = await supabaseClient
            .from("notes")
            .insert(serverNote)
            .select()
            .single();

        if (insertErr) throw insertErr;

        const localNote = {
            id: insertedNote.id,
            timestamp: insertedNote.timestamp,
            title: insertedNote.title,
            category: insertedNote.category,
            something: insertedNote.something || "",
            learning: insertedNote.learning || "",
            plan: insertedNote.plan || ""
        };

        let db = localStorage.getItem("dbnotes");
        db = db ? JSON.parse(db) : [];
        db.push(localNote);
        localStorage.setItem("dbnotes", JSON.stringify(db));

        refreshDBNotesCache();
        renderNotes("ALL");
        updateStatsNotes();

        document.getElementById("notesTitle").value = "";
        document.getElementById("notesSomething").value = "";
        document.getElementById("notesLearning").value = "";
        document.getElementById("notesPlan").value = "";
        if (dropdownSelected) dropdownSelected.innerText = "Category";

    } catch (err) {
        console.error("❌ Gagal simpan catatan:", err.message);
        alert("Gagal menyimpan. Coba lagi.");
    } finally {
        saveBtn.classList.remove("loading");
    }
}

async function handleDeleteNote(noteId) {
    const confirmed = await showConfirmDeleteNotes(noteId);
    if (!confirmed) return;

    const deleteBtn = document.getElementById("btnDeleteNotes");
    if (deleteBtn) deleteBtn.classList.add("loading");

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");

        const { error: deleteErr } = await supabaseClient
            .from("notes")
            .delete()
            .eq("id", noteId)
            .eq("user_id", user.id);

        if (deleteErr) throw deleteErr;

        let db = localStorage.getItem("dbnotes");
        if (db) {
            db = JSON.parse(db).filter(note => note.id !== noteId);
            localStorage.setItem("dbnotes", JSON.stringify(db));
        }

        refreshDBNotesCache();

        const activeFilter = document.querySelector(".btn-filter-notes.active span")?.textContent.trim() || "ALL";
        renderNotes(activeFilter);
        updateStatsNotes();

    } catch (err) {
        console.error("❌ Gagal hapus:", err.message);
        alert("Gagal menghapus catatan.");
    } finally {
        if (deleteBtn) deleteBtn.classList.remove("loading");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const saveBtn = document.getElementById("notesSave");
    const notesContainer = document.querySelector(".wrapper-content-notes");
    const filterButtons = document.querySelectorAll(".btn-filter-notes");

    if (saveBtn) saveBtn.addEventListener("click", handleAddNote);

    const titleInput = document.getElementById("notesTitle");
    if (titleInput) {
        titleInput.addEventListener("input", () => {
            if (titleInput.value.trim()) {
                titleInput.style.borderColor = "";
            }
        });
    }

    const dropdownOptions = document.querySelectorAll('.custom-dropdown[data-dropdown="category"] .dropdown-option');
    const dropdownContainer = document.querySelector('.custom-dropdown[data-dropdown="category"]');
    const dropdownSelectedSpan = dropdownContainer?.querySelector('.dropdown-selected span');

    dropdownOptions.forEach(option => {
        option.addEventListener("click", () => {
            if (dropdownContainer) {
                dropdownContainer.style.borderColor = "";
            }
        });
    });

    const dropdownSelected = document.querySelector('.custom-dropdown[data-dropdown="category"] .dropdown-selected');
    if (dropdownSelected) {
        dropdownSelected.addEventListener("click", () => {
            if (dropdownContainer) {
                dropdownContainer.style.borderColor = "";
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const filterText = btn.querySelector("span").textContent.trim();
            renderNotes(filterText);
        });
    });

    if (notesContainer) {
        notesContainer.addEventListener("click", (e) => {
            const deleteBtn = e.target.closest(".box-delete-notes");
            if (deleteBtn) {
                const id = Number(deleteBtn.getAttribute("data-id"));
                if (!isNaN(id)) handleDeleteNote(id);
            }
        });
    }

    renderNotes("ALL");
    updateStatsNotes();
});

function updateStatsNotes() {
    let db = localStorage.getItem("dbnotes");
    db = db ? JSON.parse(db) : [];

    document.getElementById("statsTotalLearning").textContent = db.length;

    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thisWeekCount = db.filter(note => note.timestamp >= sevenDaysAgo).length;
    document.getElementById("statsWeekLearning").textContent = thisWeekCount;

    const categoryCount = {};
    db.forEach(note => {
        if (note.category) {
            categoryCount[note.category] = (categoryCount[note.category] || 0) + 1;
        }
    });

    let mostCategory = "–";
    if (Object.keys(categoryCount).length > 0) {
        mostCategory = Object.keys(categoryCount).reduce((a, b) =>
            categoryCount[a] > categoryCount[b] ? a : b
        );
    }

    document.getElementById("statsMostCategories").textContent = mostCategory;
}

// ======================= Update UI Global ======================= //
async function updateAllUI() {
  try {
    const data = await getDB();

    await loadTradingData()
    updateDashboardFromTrades(data);
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

    renderNotes("ALL");
    updateStatsNotes();

    window.dispatchEvent(new Event('recalculateTrading'));

    console.log("✅ All UI updated successfully.");
  } catch (error) {
    console.error("❌ Failed to update UI:", error);
  }
}

window.updateAllUI = updateAllUI;