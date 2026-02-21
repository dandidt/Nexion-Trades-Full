// Global state
let isEditMode = false;
let currentEditingTradeNo = null;
const dropdownData = {};

function unixToWIBDatetimeLocal(unixSeconds) {
    if (!unixSeconds && unixSeconds !== 0) return "";
    
    const utcDate = new Date(unixSeconds * 1000);
    
    const wibDate = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
    
    const y = wibDate.getUTCFullYear();
    const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(wibDate.getUTCDate()).padStart(2, '0');
    const h = String(wibDate.getUTCHours()).padStart(2, '0');
    const min = String(wibDate.getUTCMinutes()).padStart(2, '0');
    
    return `${y}-${m}-${d}T${h}:${min}`;
}

// ────── POPUP & DROPDOWN SETUP ────── //
function closeAllPopups() {
    document.querySelector(".popup-perpetual-add")?.classList.remove("show");
    document.querySelector(".popup-perpetual-edit")?.classList.remove("show");
    document.querySelector(".popup-spot-add")?.classList.remove("show");
    document.querySelector(".popup-spot-edit")?.classList.remove("show");
    document.querySelector(".popup-overlay")?.classList.remove("show");
    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupAddPerpetual = document.querySelector(".popup-perpetual-add");
    const popupEditPerpetual = document.querySelector(".popup-perpetual-edit");
    const popupEditPerpetualTransactions = document.querySelector(".popup-perpetual-transactions-edit");
    const popupAddSpot = document.querySelector(".popup-spot-add");
    const popupEditSpot = document.querySelector(".popup-spot-edit");
    const popupEditSpotTransaction = document.querySelector(".popup-spot-transactions-edit");

    const btnEdit = document.getElementById("btnEdit");

    function hasAnyPopupOpen() {
        return (
            popupAddPerpetual?.classList.contains("show") ||
            popupEditPerpetual?.classList.contains("show") ||
            popupEditPerpetualTransactions?.classList.contains("show") ||
            popupAddSpot?.classList.contains("show") ||
            popupEditSpot?.classList.contains("show") ||
            popupEditSpotTransaction?.classList.contains("show")
        );
    }

    function closePopup(popup) {
        popup?.classList.remove("show");
        if (!hasAnyPopupOpen()) {
            popupOverlay?.classList.remove("show");
            document.body.classList.remove("popup-open");
            document.body.style.overflow = "";
        }
    }

    function closeAllPopups() {
        [
            popupAddPerpetual,
            popupEditPerpetual,
            popupEditPerpetualTransactions,
            popupAddSpot,
            popupEditSpot,
            popupEditSpotTransaction
        ].forEach(p => p?.classList.remove("show"));

        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    // ------ ADD BUTTON ------
    document.getElementById("btnAdd")?.addEventListener("click", () => {
        closeAllPopups();
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        const overlay = document.querySelector(".popup-overlay");
        overlay?.classList.add("show");

        const getCurrentDateTime = () => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, "0");
            const d = String(now.getDate()).padStart(2, "0");
            const h = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            return `${y}-${m}-${d}T${h}:${min}`;
        };

        const currentDateTime = getCurrentDateTime();

        if (currentActiveTab === "spot") {
            document.querySelector(".popup-spot-add")?.classList.add("show");
            
            const spotDate = document.getElementById("SpotDate");
            const spotTransDate = document.getElementById("SpotTransactionDate");
            
            if (spotDate) spotDate.value = currentDateTime;
            if (spotTransDate) spotTransDate.value = currentDateTime;

        } else {
            document.querySelector(".popup-perpetual-add")?.classList.add("show");
            
            const perpDate = document.getElementById("PerpetualDate");
            const perpTransDate = document.getElementById("PerpetualDateTransaction");
            
            if (perpDate) perpDate.value = currentDateTime;
            if (perpTransDate) perpTransDate.value = currentDateTime;
        }
    });

    // ------ Edit Mode ------ //
    btnEdit?.addEventListener("click", () => {
        isEditMode = !isEditMode;

        if (!isEditMode) {
            hideDeleteButton();
            selectedSpotNumbers = [];
            selectedPerpetualNumbers = [];
        }
        
        renderPerpetualPaginated();
        renderSpotPaginated();
    });
    
    // ------ EDIT MODE (SPOT & PERPETUAL) ------
    document.querySelectorAll(".tabel-trade tbody").forEach(tableBody => {
        tableBody.addEventListener("click", async (e) => {
            if (!isEditMode) return;
            if (e.target.closest('input[type="checkbox"], label')) return;

            const row = e.target.closest("tr");
            if (!row) return;

            const isSpotTable = row.closest("#tabel-spot") !== null;
            const tradeNumber = parseInt(row.dataset.tradeNumber);
            if (!tradeNumber) return;

            const db = isSpotTable
                ? JSON.parse(localStorage.getItem("dbspot")) || []
                : JSON.parse(localStorage.getItem("dbperpetual")) || [];

            const tradeData = db.find(t => t.tradeNumber === tradeNumber);

            if (!tradeData) return;

            if (tradeData.action === "Deposit" || tradeData.action === "Withdraw") {
                if (isSpotTable) {
                    openEditSpotTransactionPopup(tradeData);
                } else {
                    openEditPerpetualTransactionPopup(tradeData);
                }
            } else {
                if (isSpotTable) {
                    openEditSpotPopup(tradeData);
                } else {
                    openEditPerpetualPopup(tradeData);
                }
            }
        });
    });

    // ------ DELETE MASSAL ------
    const btnDeleteSelect = document.getElementById("btnDeleteSelect");

    document.addEventListener("change", (e) => {
        const checkbox = e.target;
        if (!checkbox.matches('.tabel-trade input[type="checkbox"]')) return;
        if (!isEditMode) return;

        const anyChecked = document.querySelector(
            '.tabel-trade input[type="checkbox"]:checked'
        );

        btnDeleteSelect.style.display = anyChecked ? "flex" : "none";
    });

    document.addEventListener("change", (e) => {
    const cb = e.target;
    if (!cb.matches('.tabel-trade input[type="checkbox"]')) return;
    if (!isEditMode) return;

    const row = cb.closest("tr");
    if (!row) return;

    const tradeNumber = Number(row.dataset.tradeNumber);
    if (!tradeNumber) return;

    const isSpot = row.closest("#tabel-spot") !== null;

    const targetArr = isSpot ? selectedSpotNumbers : selectedPerpetualNumbers;

    if (cb.checked) {
        if (!targetArr.includes(tradeNumber)) {
        targetArr.push(tradeNumber);
        }
    } else {
        const idx = targetArr.indexOf(tradeNumber);
        if (idx > -1) targetArr.splice(idx, 1);
    }
    });

    // ------ Overlay ------ //
    popupOverlay?.addEventListener("click", closeAllPopups);

    // ------ Cancel ------ //
    document.getElementById("closeAddPerpetual")?.addEventListener("click", () => closePopup(popupAddPerpetual));
    document.getElementById("closeEditPerpetual")?.addEventListener("click", () => closePopup(popupEditPerpetual));
    document.getElementById("closeEditPerpetualTransaction")?.addEventListener("click", () => closePopup(popupEditPerpetualTransactions));
    document.getElementById("closeAddSpot")?.addEventListener("click", () => closePopup(popupAddSpot));
    document.getElementById("closeEditSpot")?.addEventListener("click", () => closePopup(popupEditSpot));
    document.getElementById("closeEditSpotTransaction")?.addEventListener("click", () => closePopup(popupEditSpotTransaction));

    // ------ Custom Dropdowns ------ //
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const optionElements = dropdown.querySelectorAll('.dropdown-option');
        const name = dropdown.getAttribute('data-dropdown');
        const selectedSpan = selected.querySelector('span');

        function updateDropdownDisplay(hasValue, text = null) {
            if (hasValue) {
                selected.classList.add('has-value');
                if (text) selectedSpan.textContent = text;
                selectedSpan.classList.remove('placeholder');
            } else {
                selected.classList.remove('has-value');
                const placeholderText = selectedSpan.getAttribute('data-placeholder') || 
                                    (name === 'method' ? 'Method' : 
                                    name === 'behavior' ? 'Behavior' :
                                    name === 'psychology' ? 'Psychology' :
                                    name === 'class' ? 'Class' :
                                    name === 'position' ? 'Position' :
                                    name === 'result' ? 'Result' :
                                    name === 'timeframe' ? 'Select' :
                                    name === 'entry' ? 'Select' : 'Select');
                selectedSpan.textContent = placeholderText;
                selectedSpan.classList.add('placeholder');
            }
        }

        selected.addEventListener('click', (e) => {
            e.stopPropagation();

            if (e.target.closest('.close-icon')) {
                updateDropdownDisplay(false);
                
                const allOptions = dropdown.querySelectorAll('.dropdown-option');
                allOptions.forEach(opt => opt.classList.remove('selected'));
                
                if (window.dropdownData) delete window.dropdownData[name];
                return;
            }

            document.querySelectorAll('.dropdown-options.show').forEach(o => {
                if (o !== options) o.classList.remove('show');
            });
            options.classList.toggle('show');
            selected.classList.toggle('active');
        });

        optionElements.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = opt.dataset.value;

                if (value === '__edit__') {
                    options.classList.remove('show');
                    selected.classList.remove('active');
                    return;
                }

                window.dropdownData = window.dropdownData || {};
                window.dropdownData[name] = value;

                updateDropdownDisplay(true, opt.textContent);

                optionElements.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');

                options.classList.remove('show');
                selected.classList.remove('active');
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-options.show').forEach(o => o.classList.remove('show'));
        document.querySelectorAll('.dropdown-selected.active').forEach(s => s.classList.remove('active'));
    });

    document.querySelectorAll('.input-with-clear').forEach(container => {
        const input = container.querySelector('input, textarea');
        const clearBtn = container.querySelector('.clear-btn');

        if (!input || !clearBtn) return;

        function updateClearButton() {
            if (input.value.trim().length > 0) {
                container.classList.add('has-value');
            } else {
                container.classList.remove('has-value');
            }
        }

        input.addEventListener('input', updateClearButton);
        updateClearButton();

        clearBtn.addEventListener('click', () => {
            input.value = '';
            input.dispatchEvent(new Event('input'));
            input.focus();
        });
    });

    ['timeframe', 'entry'].forEach(name => {
    rebuildDropdown(name);
    });
});

// ────── Serch Data ────── //
function refreshClearButtons() {
    document.querySelectorAll('.input-with-clear').forEach(container => {
        const input = container.querySelector('input, textarea');
        if (input) {
            container.classList.toggle('has-value', input.value.trim() !== '');
        }
    });
}

// ------ Perpetual ------ //
function fillEditFormTrade(trade) {
    document.getElementById("PerpetualEditDate").value = unixToWIBDatetimeLocal(trade.date);
    document.getElementById("PerpetualEditPairs").value = trade.Pairs || "";
    document.getElementById("PerpetualEditRr").value = trade.RR || "";
    document.getElementById("PerpetualEditMargin").value = trade.Margin || "";
    document.getElementById("PerpetualEditPnl").value = trade.Pnl || "";
    document.getElementById("PerpetualEditCauses").value = trade.Causes || "";
    document.getElementById("PerpetualEditBefore-url").value = trade.Files?.Before || "";
    document.getElementById("PerpetualEditAfter-url").value = trade.Files?.After || "";

    setDropdownValue("PerpetualEditMethod", trade.Method);
    setDropdownValue("PerpetualEditBehavior", trade.Behavior);
    setDropdownValue("PerpetualEditPsychology", trade.Psychology);
    setDropdownValue("PerpetualEditClass", trade.Class);
    setDropdownValue("PerpetualEditPosition", trade.Pos);
    setDropdownValue("PerpetualEditResult", trade.Result);
    setDropdownValue("PerpetualEditTimeframe", trade.Confluance?.TimeFrame || "");
    setDropdownValue("PerpetualEditEntry", trade.Confluance?.Entry || "");

    currentEditingTradeNo = trade.tradeNumber;

    refreshClearButtons();
}

function fillEditFormTransfer(trade) {
    document.getElementById("PerpetualTransactionEditDate").value = unixToWIBDatetimeLocal(trade.date);
    setDropdownValue("PerpetualTransactionEditAction", trade.action);
    document.getElementById("PerpetualTransactionEditValue").value = Math.abs(trade.value) || "";

    currentEditingTradeNo = trade.tradeNumber;

    refreshClearButtons();
}

// ------ Spot ------ //
function fillEditFormSpot(trade) {
    document.getElementById("SpotEditDate").value = unixToWIBDatetimeLocal(trade.date);
    document.getElementById("SpotEditPairs").value = trade.Pairs || "";
    document.getElementById("SpotEditRr").value = trade.RR || "";
    document.getElementById("SpotEditMargin").value = trade.Margin || "";
    document.getElementById("SpotEditPnl").value = trade.Pnl || "";
    document.getElementById("SpotEditCauses").value = trade.Causes || "";
    document.getElementById("SpotEditBefore-url").value = trade.Files?.Before || "";
    document.getElementById("SpotEditAfter-url").value = trade.Files?.After || "";

    setDropdownValue("SpotEditMethod", trade.Method);
    setDropdownValue("SpotEditPsychology", trade.Psychology);
    setDropdownValue("SpotEditClass", trade.Class);
    setDropdownValue("SpotEditResult", trade.Result);
    setDropdownValue("SpotEditTimeframe", trade.Confluance?.TimeFrame || "");
    setDropdownValue("SpotEditEntry", trade.Confluance?.Entry || "");

    currentEditingTradeNo = trade.tradeNumber;
    refreshClearButtons();
}

function fillEditFormSpotTransfer(trade) {
    document.getElementById("EditSpotTransactionDate").value = unixToWIBDatetimeLocal(trade.date);
    setDropdownValue("EditSpotTransactionAction", trade.action);
    document.getElementById("EditSpotTransactionValue").value = Math.abs(trade.value) || "";
    currentEditingTradeNo = trade.tradeNumber;
    refreshClearButtons();
}

// ────── DROPDOWN ────── //
function setDropdownValue(dropdownName, value) {
    const dropdown = document.querySelector(`.custom-dropdown[data-dropdown="${dropdownName}"]`);
    if (!dropdown) return;

    const selected = dropdown.querySelector(".dropdown-selected");
    const selectedSpan = selected.querySelector("span");
    const options = dropdown.querySelectorAll(".dropdown-option");

    options.forEach(opt => opt.classList.remove("selected"));

    if (value && value !== "") {
        const matched = Array.from(options).find(opt => opt.dataset.value === value);
        if (matched) {
            matched.classList.add("selected");
            selectedSpan.textContent = matched.textContent;
            selectedSpan.classList.remove("placeholder");
            selected.classList.add("has-value");
        } else {
            selected.classList.remove("has-value");
            selectedSpan.textContent = selectedSpan.getAttribute("data-placeholder") || "Select";
            selectedSpan.classList.add("placeholder");
        }
    } else {
        selected.classList.remove("has-value");
        selectedSpan.textContent = selectedSpan.getAttribute("data-placeholder") || "Select";
        selectedSpan.classList.add("placeholder");
    }
}

// ------ EDIT DROPDOWN ------ //
function getCustomOptions(dropdownName) {
    const alias = {
        PerpetualEditTimeframe: 'PerpetualTimeframe',
        PerpetualEditEntry: 'PerpetualEntry',
        SpotEditTimeframe: 'SpotTimeframe',
        SpotEditEntry: 'SpotEntry'
    };

    const actualName = alias[dropdownName] || dropdownName;

    const saved = JSON.parse(localStorage.getItem("customDropdownOptions")) || {};
    if (!saved[actualName]) {
        const defaults = {
            PerpetualTimeframe: ["1M", "5M", "15M", "1H", "2H", "4H", "1D"],
            PerpetualEntry: ["OB", "FVG"],
            SpotTimeframe: ["1M", "5M", "15M", "1H", "2H", "4H", "1D"],
            SpotEntry: ["OB", "FVG"]
        };
        return defaults[actualName] || [];
    }
    return saved[actualName];
}

function saveCustomOptions(dropdownName, options) {
    const all = JSON.parse(localStorage.getItem("customDropdownOptions")) || {};
    all[dropdownName] = options;
    localStorage.setItem("customDropdownOptions", JSON.stringify(all));
}

function rebuildDropdown(dropdownName) {
    const dropdown = document.querySelector(`.custom-dropdown[data-dropdown="${dropdownName}"]`);
    if (!dropdown) return;

    const optionsContainer = dropdown.querySelector('.dropdown-options');
    const currentSelection = getDropdownValue(dropdownName);

    optionsContainer.innerHTML = '';

    const customOpts = getCustomOptions(dropdownName);
    customOpts.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'dropdown-option';
        el.dataset.value = opt;
        el.textContent = opt;
        if (opt === currentSelection) el.classList.add('selected');
        optionsContainer.appendChild(el);
    });

    if (['PerpetualTimeframe','PerpetualEntry','SpotTimeframe','SpotEntry'].includes(dropdownName)) {
        const editEl = document.createElement('div');
        editEl.className = 'dropdown-option edit-trigger';
        editEl.dataset.value = '__edit__';
        editEl.style.display = 'flex';
        editEl.style.alignItems = 'center';
        editEl.style.gap = '8px';
        editEl.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
                <path d="M216-216h51l375-375-51-51-375 375v51Zm-72 72v-153l498-498q11-11 23.84-16 12.83-5 27-5 14.16 0 27.16 5t24 16l51 51q11 11 16 24t5 26.54q0 14.45-5.02 27.54T795-642L297-144H144Zm600-549-51-51 51 51Zm-127.95 76.95L591-642l51 51-25.95-25.05Z"/>
            </svg>
            Edit List
        `;
        optionsContainer.appendChild(editEl);
    }

    optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.removeEventListener('click', handleOptionClick);
        opt.addEventListener('click', handleOptionClick);
    });
}

function handleOptionClick(e) {
    e.stopPropagation();
    const opt = e.currentTarget;
    const value = opt.dataset.value;
    const dropdown = opt.closest('.custom-dropdown');
    const name = dropdown.getAttribute('data-dropdown');
    const selected = dropdown.querySelector('.dropdown-selected');
    const selectedSpan = selected.querySelector('span');

    if (value === '__edit__') {
        openEditModal(name);
        return;
    }

    selected.classList.add('has-value');

    selectedSpan.textContent = opt.textContent;
    selectedSpan.classList.remove('placeholder');
    window.dropdownData = window.dropdownData || {};
    window.dropdownData[name] = value;

    dropdown.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');

    dropdown.querySelector('.dropdown-options').classList.remove('show');
    selected.classList.remove('active');
}

function openEditModal(dropdownName) {
    document.querySelectorAll('.dropdown-options').forEach(o => o.classList.remove('show'));
    
    const modal = document.getElementById('editDropdownModal');
    document.getElementById('editDropdownName').textContent = dropdownName;
    
    const options = getCustomOptions(dropdownName);
    const listEl = document.getElementById('editOptionsList');
    listEl.innerHTML = '';

    options.forEach((opt, i) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '3px 0';
        item.innerHTML = `
        <span>${opt}</span>
        <button class="remove-opt btn btn-red btn-remove" data-index="${i}">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z"/></svg>
        </button>
        `;
        listEl.appendChild(item);
    });

    document.getElementById('saveDropdownEdit').onclick = () => {
        const newOpts = Array.from(listEl.children).map(el => el.querySelector('span').textContent);
        saveCustomOptions(dropdownName, newOpts);
        
        rebuildDropdown(dropdownName);
        
        if (dropdownName === 'PerpetualTimeframe') rebuildDropdown('PerpetualEditTimeframe');
        if (dropdownName === 'PerpetualEntry') rebuildDropdown('PerpetualEditEntry');
        if (dropdownName === 'SpotTimeframe') rebuildDropdown('SpotEditTimeframe');
        if (dropdownName === 'SpotEntry') rebuildDropdown('SpotEditEntry');

        modal.style.display = 'none';
    };

    document.getElementById('cancelDropdownEdit').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('addNewOption').onclick = () => {
        const input = document.getElementById('newOptionInput');
        const val = input.value.trim();
        if (val && !options.includes(val)) {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '3px 0';
        item.innerHTML = `
        <span>${val}</span><button class="remove-opt btn btn-red btn-remove" data-index="${options.length}">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z"/></svg>
        </button>`;
        listEl.appendChild(item);
        input.value = '';
        }
    };

    listEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-opt')) {
        e.target.parentElement.remove();
        }
    });

    modal.style.display = 'block';
}

function initializeAllDropdowns() {
    rebuildDropdown('PerpetualTimeframe');
    rebuildDropdown('PerpetualEntry');
    rebuildDropdown('PerpetualEditTimeframe');
    rebuildDropdown('PerpetualEditEntry');

    rebuildDropdown('SpotTimeframe');
    rebuildDropdown('SpotEntry');
    rebuildDropdown('SpotEditTimeframe');
    rebuildDropdown('SpotEditEntry');

}

document.addEventListener('DOMContentLoaded', () => {
    initializeAllDropdowns();
});

// ------ get Dropdown Value ------ //
function getDropdownValue(dropdownName) {
    const dropdown = document.querySelector(`.custom-dropdown[data-dropdown="${dropdownName}"]`);
    if (!dropdown) {
        return null;
    }
    const selectedOption = dropdown.querySelector('.dropdown-option.selected');
    if (selectedOption) {
        return selectedOption.getAttribute('data-value');
    } else {
        return null;
    }
}

// ------ Reset Form After Update ------ //
function resetForm(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('input, textarea').forEach(el => {
    if (el.type === 'datetime-local') {
      el.value = new Date().toISOString().slice(0, 16);
    } else {
      el.value = '';
    }
    el.dispatchEvent(new Event('input'));
  });

  container.querySelectorAll('.custom-dropdown').forEach(dd => {
    const selectedEl = dd.querySelector('.dropdown-selected');
    const span = selectedEl?.querySelector('span');
    const name = dd.getAttribute('data-dropdown');
    
    if (span) {
      const placeholder = span.getAttribute('data-placeholder') || 'Select';
      span.textContent = placeholder;
      span.classList.add('placeholder');
    }

    if (selectedEl) {
      selectedEl.classList.remove('has-value', 'active');
    }

    dd.querySelectorAll('.dropdown-option.selected').forEach(opt => {
      opt.classList.remove('selected');
    });

    if (name && window.dropdownData) {
      delete window.dropdownData[name];
    }
  });
}

// ------ Get Number Trade Perpetual ------ //
function getNextLocalIdsPerpetual() {
    const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];

    const lastId = dbPerpetual.length > 0
        ? Math.max(...dbPerpetual.map(t => t.id || 0))
        : 0;
    const newId = lastId + 1;

    const lastTradeNumber = dbPerpetual.length > 0
        ? dbPerpetual[dbPerpetual.length - 1].tradeNumber
        : 0;
    const nextTradeNumber = lastTradeNumber + 1;

    return { newId, nextTradeNumber };
}

// ------ Get Number Trade Spot ------ //
function getNextLocalIdsSpot() {
    const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];

    const lastId = dbSpot.length > 0
        ? Math.max(...dbSpot.map(t => t.id || 0))
        : 0;
    const newId = lastId + 1;

    const lastTradeNumber = dbSpot.length > 0
        ? dbSpot[dbSpot.length - 1].tradeNumber
        : 0;
    const nextTradeNumber = lastTradeNumber + 1;

    return { newId, nextTradeNumber };
}

// ────── POPUP JURNAL ────── //

// ------ Perpetual ------ //
//  Swap Trades = Transaction  //
document.querySelectorAll('.btn-swap-perpetual').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-swap-perpetual').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const formTrade = document.getElementById('addDataPerpetual');
        const formDW = document.getElementById('addDataPerpetualTransactions');
        const btnTrade = document.getElementById('AddPerpetual');
        const btnDW = document.getElementById('AddPerpetualTransaction');

        if (index === 0) {
            formTrade.style.display = 'block';
            formDW.style.display = 'none';
            btnTrade.classList.add('active');
            btnDW.classList.remove('active');
        } else {
            formTrade.style.display = 'none';
            formDW.style.display = 'block';
            btnTrade.classList.remove('active');
            btnDW.classList.add('active');
        }
    });
});

// ------ Add ------ //
//  Add Trades  //
async function AddPerpetual() {
    const btn = document.getElementById("AddPerpetual");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        
        const user_id = user.id;

        // --- Load local ---
        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];

        const { newId, nextTradeNumber } = getNextLocalIdsPerpetual();

        // --- Date ---
        const dateInputValue = document.getElementById("PerpetualDate").value;
        const correctedDate = new Date(dateInputValue);

        // --- Dropdown values ---
        const methodValue = getDropdownValue("PerpetualMethod");
        const behaviorValue = getDropdownValue("PerpetualBehavior");
        const psychologyValue = getDropdownValue("PerpetualPsychology");
        const classValue = getDropdownValue("PerpetualClass");
        const positionValue = getDropdownValue("PerpetualPosition");
        const entryValue = getDropdownValue("PerpetualEntry");
        const timeframeValue = getDropdownValue("PerpetualTimeframe");

        // --- Server --- 
        const serverData = {
            id: newId,
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: document.getElementById("PerpetualPairs").value.trim(),
            method: methodValue,
            entry: entryValue || "",
            timeframe: timeframeValue || "",
            rr: parseFloat(document.getElementById("PerpetualRr").value) || 0,
            behavior: behaviorValue,
            causes: document.getElementById("PerpetualCauses").value.trim(),
            psychology: psychologyValue,
            class: classValue,
            before: document.getElementById("PerpetualBefore-url").value.trim(),
            after: document.getElementById("PerpetualAfter-url").value.trim(),
            pos: positionValue || "",
            margin: parseFloat(document.getElementById("PerpetualMargin").value) || 0,
            result: getDropdownValue("PerpetualResult") || "",
            pnl: parseFloat(document.getElementById("PerpetualPnl").value) || 0
        };

        const { data: insertData, error: insertErr } = await supabaseClient
            .from("perpetual")
            .insert(serverData)
            .select();

        if (insertErr) throw insertErr;

        // --- Local ---
        const localData = {
            id: newId,
            tradeNumber: nextTradeNumber,
            date: Math.floor(correctedDate.getTime() / 1000),
            Pairs: serverData.pairs,
            Method: serverData.method,
            Confluance: {
                Entry: serverData.entry,
                TimeFrame: serverData.timeframe
            },
            RR: serverData.rr,
            Behavior: serverData.behavior,
            Causes: serverData.causes,
            Psychology: serverData.psychology,
            Class: serverData.class,
            Files: {
                Before: serverData.before,
                After: serverData.after
            },
            Pos: serverData.pos,
            Margin: serverData.margin,
            Result: serverData.result,
            Pnl: serverData.pnl
        };

        dbPerpetual.push(localData);
        localStorage.setItem("dbperpetual", JSON.stringify(dbPerpetual));

        // --- Refresh ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        resetForm("#addDataPerpetual");

    } catch (err) {
        alert("Error Add:\n" + err);
    }
    finally {
        btn.classList.remove("loading");
    }
}

//  Add Transaction  //
async function AddPerpetualTransactions() {
    const btn = document.getElementById("AddPerpetualTransaction");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- ID lokal ---
        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];
        const lastId = dbPerpetual.length > 0
            ? Math.max(...dbPerpetual.map(t => t.id || 0))
            : 0;
        const newId = lastId + 1;

        const lastTradeNumber = dbPerpetual.length > 0
            ? dbPerpetual[dbPerpetual.length - 1].tradeNumber
            : 0;
        const nextTradeNumber = lastTradeNumber + 1;

        // --- Date ---
        const dateInputValue = document.getElementById("PerpetualDateTransaction").value;
        const correctedDate = new Date(dateInputValue);

        // --- Action & Value ---
        const selectedActionEl = document.querySelector('[data-dropdown="PerpetualActionTransaction"] .dropdown-selected span');
        const selectedAction = selectedActionEl?.innerText.trim();
        const valueInput = parseFloat(document.getElementById("PerpetualValueTransaction").value);

        if (!selectedAction || !["Deposit", "Withdraw"].includes(selectedAction)) {
            return;
        }
        if (isNaN(valueInput) || valueInput === 0) {
            return;
        }

        const finalValue = selectedAction === "Withdraw" ? -Math.abs(valueInput) : Math.abs(valueInput);

        // --- Server ---
        const serverData = {
            id: newId,
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: selectedAction,
            value: finalValue
        };

        const { error: insertErr } = await supabaseClient
            .from("perpetual_transactions")
            .insert([serverData]);

        if (insertErr) throw insertErr;

        // --- Local ---
        const localData = {
            id: newId,
            tradeNumber: nextTradeNumber,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: selectedAction,
            value: finalValue
        };

        dbPerpetual.push(localData);
        localStorage.setItem("dbperpetual", JSON.stringify(dbPerpetual));

        // --- Refresh ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        resetForm("#addDataPerpetualTransactions");

    } catch (err) {
        alert("Error Add:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

// ------ Edit ------ //
//  Trade  //
function openEditPerpetualPopup(trade) {
    closeAllPopups();

    const popup = document.querySelector(".popup-perpetual-edit");
    const overlay = document.querySelector(".popup-overlay");

    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => fillEditFormTrade(trade), 50);
}

// Transaction  //
function openEditPerpetualTransactionPopup(trade) {
    closeAllPopups();

    const popup = document.querySelector(".popup-perpetual-transactions-edit");
    const overlay = document.querySelector(".popup-overlay");

    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => fillEditFormTransfer(trade), 50);
}

//  Edit Trade  //
async function SaveEditPerpetual() {
    const btn = document.getElementById("updatePerpetual");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-perpetual-edit .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        // --- Id lokal ---
        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];
        const item = dbPerpetual.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Trade tidak ditemukan di cache lokal!");
        
        const recordId = item.id;

        // --- Date ---
        const dateInputValue = getVal("PerpetualEditDate");
        if (!dateInputValue) {
            const input = document.getElementById("PerpetualEditDate");
            input.classList.add("input-error");

            setTimeout(() => {
                input.classList.remove("input-error");
            }, 2000);

            return;
        }
        const correctedDate = new Date(dateInputValue);

        // --- Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: getVal("PerpetualEditPairs"),
            method: getDropdown("PerpetualEditMethod"),
            entry: getDropdown("PerpetualEditEntry"),
            timeframe: getDropdown("PerpetualEditTimeframe"),
            rr: parseFloat(getVal("PerpetualEditRr")) || 0,
            behavior: getDropdown("PerpetualEditBehavior"),
            causes: getVal("PerpetualEditCauses"),
            psychology: getDropdown("PerpetualEditPsychology"),
            class: getDropdown("PerpetualEditClass"),
            before: getVal("PerpetualEditBefore-url"),
            after: getVal("PerpetualEditAfter-url"),
            pos: getDropdown("PerpetualEditPosition") || "",
            margin: parseFloat(getVal("PerpetualEditMargin")) || 0,
            result: getDropdown("PerpetualEditResult"),
            pnl: parseFloat(getVal("PerpetualEditPnl")) || 0
        };

        const { error: updateErr } = await supabaseClient
            .from("perpetual")
            .update(serverUpdate)
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (updateErr) throw updateErr;

        // --- Local ---
        const updatedLocal = {
            ...item,
            date: Math.floor(correctedDate.getTime() / 1000),
            Pairs: serverUpdate.pairs,
            Method: serverUpdate.method,
            Confluance: {
                Entry: serverUpdate.entry,
                TimeFrame: serverUpdate.timeframe
            },
            RR: serverUpdate.rr,
            Behavior: serverUpdate.behavior,
            Causes: serverUpdate.causes,
            Psychology: serverUpdate.psychology,
            Class: serverUpdate.class,
            Files: {
                Before: serverUpdate.before,
                After: serverUpdate.after
            },
            Pos: serverUpdate.pos,
            Margin: serverUpdate.margin,
            Result: serverUpdate.result,
            Pnl: serverUpdate.pnl
        };

        const idx = dbPerpetual.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbPerpetual[idx] = updatedLocal;
            localStorage.setItem("dbperpetual", JSON.stringify(dbPerpetual));
        }
        
        // --- Refresh ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        CancelEditPerpetual();
    } catch (err) {
        alert("Error Edit:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Edit Transaction  //
async function SaveEditPerpetualTransaction() {
    const btn = document.getElementById("updatePerpetualTransaction");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-perpetual-transactions-edit .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];
        const item = dbPerpetual.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Transfer tidak ditemukan di cache lokal!");
        
        const recordId = item.id;

        const dateInputValue = getVal("PerpetualTransactionEditDate");
        if (!dateInputValue) {
            const input = document.getElementById("PerpetualTransactionEditDate");
            input.classList.add("input-error");

            setTimeout(() => {
                input.classList.remove("input-error");
            }, 2000);

            return;
        }
        const correctedDate = new Date(dateInputValue);

        const action = getDropdownValue("PerpetualTransactionEditAction");

        if (!action || !["Deposit", "Withdraw"].includes(action)) {
            const selected = document.querySelector(
                '.custom-dropdown[data-dropdown="PerpetualTransactionEditAction"] .dropdown-selected'
            );
            if (selected) {
                selected.classList.add("input-error");
                setTimeout(() => {
                selected.classList.remove("input-error");
                }, 2000);
            }
            return;
        }

        let value = parseFloat(getVal("PerpetualTransactionEditValue"));
        if (isNaN(value) || value === 0) {
        const input = document.getElementById("PerpetualTransactionEditValue");
        input.classList.add("input-error");
        setTimeout(() => input.classList.remove("input-error"), 2000);
        return;
        }
        value = action === "Withdraw" ? -Math.abs(value) : Math.abs(value);

        // --- Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: action,
            value: value
        };

        const { error: updateErr } = await supabaseClient
            .from("perpetual_transactions")
            .update(serverUpdate)
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (updateErr) throw updateErr;

        // --- Local ---
        const updatedLocal = {
            ...item,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: action,
            value: value
        };

        const idx = dbPerpetual.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbPerpetual[idx] = updatedLocal;
            localStorage.setItem("dbperpetual", JSON.stringify(dbPerpetual));
        }

        // --- Refresh ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        CancelEditPerpetual();
    } catch (err) {
        alert("Error Edit:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Cancel  //
function CancelEditPerpetual() {
    try {
        currentEditingTradeNo = null;

        const popupEditPerpetual = document.querySelector(".popup-perpetual-edit");
        const popupEditPerpetualTransactions = document.querySelector(".popup-perpetual-transactions-edit");
        const overlay = document.querySelector(".popup-overlay");

        [popupEditPerpetual, popupEditPerpetualTransactions].forEach(p => p?.classList.remove("show"));
        overlay?.classList.remove("show");

        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";

        document.querySelectorAll(".btn-main.loading, .btn-delete.loading").forEach(b => b.classList.remove("loading"));

        [popupEditPerpetual, popupEditPerpetualTransactions].forEach(popup => {
            if (!popup) return;
            popup.querySelectorAll('.custom-dropdown').forEach(dd => {
                const span = dd.querySelector('.dropdown-selected span');
                const placeholder = span?.getAttribute('data-placeholder') || 'Select';
                if (span) {
                    span.textContent = placeholder;
                    span.classList.add('placeholder');
                }
                dd.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
            });
            popup.querySelectorAll('input[type="text"], input[type="url"], input[type="number"], input[type="datetime-local"], textarea').forEach(inp => {
                inp.value = "";
            });
        });

    } catch (error) {
        console.error('Result:', error);
    }
}

//  Delete Trade  //
async function DeletePerpetual() {
    const btn = document.getElementById("deletePerpetual");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada trade yang dipilih untuk dihapus!");
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await ConfirmDeletePerpetual(`Delete Trade #${currentEditingTradeNo}?`);
    if (!confirmDelete) {
        btn.classList.remove("loading");
        return;
    }

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- ID Local ---
        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];
        const itemToDelete = dbPerpetual.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Trade tidak ditemukan di cache lokal!");

        const recordId = itemToDelete.id;

        // --- Server ---
        const { error: deleteErr } = await supabaseClient
            .from("perpetual")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        // --- Local ---
        const newDb = dbPerpetual.filter(t => t.id !== recordId);
        localStorage.setItem("dbperpetual", JSON.stringify(newDb));

        // --- Refresh UI ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        CancelEditPerpetual();

    } catch (error) {
        console.error('Result:', error);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Delete Transaction  //
async function DeletePerpetualTransaction() {

    const btn = document.getElementById("deletePerpetualTransaction");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await ConfirmDeletePerpetual(`Delete Transfer #${currentEditingTradeNo}?`);
    if (!confirmDelete) {
        btn.classList.remove("loading");
        return;
    }

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- load Local ---
        const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual")) || [];
        const itemToDelete = dbPerpetual.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Transfer tidak ditemukan di cache lokal!");

        const recordId = itemToDelete.id;

        // --- Server ---
        const { error: deleteErr } = await supabaseClient
            .from("perpetual_transactions")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        // --- Local ---
        const newDb = dbPerpetual.filter(t => t.id !== recordId);
        localStorage.setItem("dbperpetual", JSON.stringify(newDb));

        // --- Refresh UI ---
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        CancelEditPerpetual();

    } catch (error) {
        console.error('Result:', error);
    } finally {
        btn.classList.remove("loading");
    }
}

// ------ Spot ------ //
//  Swap Trades = Transaction  //
document.querySelectorAll('.btn-swap-spot').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-swap-spot')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const formTrade = document.getElementById('addDataSpot');
        const formDW = document.getElementById('addDataSpotTransactions');
        const btnTrade = document.getElementById('AddSpot');
        const btnDW = document.getElementById('AddSpotTransaction');

        if (index === 0) {
            formTrade.style.display = 'block';
            formDW.style.display = 'none';
            btnTrade.classList.add('active');
            btnDW.classList.remove('active');
        } else {
            formTrade.style.display = 'none';
            formDW.style.display = 'block';
            btnTrade.classList.remove('active');
            btnDW.classList.add('active');
        }
    });
});

// ------ Add ------ //
//  Add Trade  //
async function AddSpot() {
    const btn = document.getElementById("AddSpot");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- Load local DB ---
        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];

        const { newId, nextTradeNumber } = getNextLocalIdsSpot();

        // --- Date ---
        const dateInputValue = document.getElementById("SpotDate").value;
        const correctedDate = new Date(dateInputValue);

        // --- Dropdown values ---
        const methodValue = getDropdownValue("SpotMethod");
        const psychologyValue = getDropdownValue("SpotPsychology");
        const classValue = getDropdownValue("SpotClass");
        const resultValue = getDropdownValue("SpotResult");
        const timeframeValue = getDropdownValue("SpotTimeframe");
        const entryValue = getDropdownValue("SpotEntry");

        // --- Server Data ---
        const serverData = {
            id: newId,
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: document.getElementById("SpotPairs").value.trim(),
            method: methodValue,
            entry: entryValue || "",
            timeframe: timeframeValue || "",
            rr: parseFloat(document.getElementById("SpotRr").value) || 0,
            causes: document.getElementById("SpotCauses").value.trim(),
            psychology: psychologyValue,
            class: classValue,
            before: document.getElementById("SpotBefore-url").value.trim(),
            after: document.getElementById("SpotAfter-url").value.trim(),
            margin: parseFloat(document.getElementById("SpotMargin").value) || 0,
            result: resultValue || "",
            pnl: parseFloat(document.getElementById("SpotPnl").value) || 0
        };

        const { data: insertData, error: insertErr } = await supabaseClient
            .from("spot")
            .insert(serverData)
            .select();

        if (insertErr) throw insertErr;

        // --- Local Data ---
        const localData = {
            id: newId,
            tradeNumber: nextTradeNumber,
            date: Math.floor(correctedDate.getTime() / 1000),
            Pairs: serverData.pairs,
            Method: serverData.method,
            Confluance: {
                Entry: serverData.entry,
                TimeFrame: serverData.timeframe
            },
            RR: serverData.rr,
            Causes: serverData.causes,
            Psychology: serverData.psychology,
            Class: serverData.class,
            Files: {
                Before: serverData.before,
                After: serverData.after
            },
            Margin: serverData.margin,
            Result: serverData.result,
            Pnl: serverData.pnl
        };

        dbSpot.push(localData);
        localStorage.setItem("dbspot", JSON.stringify(dbSpot));

        // --- Refresh UI ---
        if (typeof spotTrades !== 'undefined') {
            spotTrades = dbSpot;
        }

        refreshDBSpotCache?.();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP?.();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups?.();

        resetForm("#addDataSpot");

    } catch (err) {
        alert("Error Add:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Add Transaction  //
async function AddSpotTransactions() {
    const btn = document.getElementById("AddSpotTransaction");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- Load local DB ---
        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];

        const { newId, nextTradeNumber } = getNextLocalIdsSpot();

        // --- Date ---
        const dateInputValue = document.getElementById("SpotTransactionDate").value;
        const correctedDate = new Date(dateInputValue);

        // --- Action & Value ---
        const selectedActionEl = document.querySelector('[data-dropdown="SpotTransactionAction"] .dropdown-selected span');
        const selectedAction = selectedActionEl?.innerText.trim();
        const valueInput = parseFloat(document.getElementById("SpotTransactionValue").value);

        if (!selectedAction || !["Deposit", "Withdraw"].includes(selectedAction)) {
            alert("Pilih tipe transaksi yang valid.");
            return;
        }
        if (isNaN(valueInput) || valueInput <= 0) {
            alert("Nilai transaksi harus lebih dari 0.");
            return;
        }

        const finalValue = selectedAction === "Withdraw" ? -Math.abs(valueInput) : Math.abs(valueInput);

        // --- Server Data ---
        const serverData = {
            id: newId,
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: selectedAction,
            value: finalValue
        };

        const { error: insertErr } = await supabaseClient
            .from("spot_transactions")
            .insert([serverData]);

        if (insertErr) throw insertErr;

        // --- Local Data ---
        const localData = {
            id: newId,
            tradeNumber: nextTradeNumber,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: selectedAction,
            value: finalValue
        };

        dbSpot.push(localData);
        localStorage.setItem("dbspot", JSON.stringify(dbSpot));

        // --- Refresh UI ---
        if (typeof spotTrades !== 'undefined') {
            spotTrades = dbSpot; 
        }

        refreshDBSpotCache?.();
        if (typeof updateAllUI === "function") await updateAllUI();
        
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups?.();

        resetForm("#addDataSpotTransactions");

    } catch (err) {
        alert("Error Add:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

// ------ Edit ------ //
//  Trade  //
function openEditSpotPopup(trade) {
    closeAllPopups();
    const popup = document.querySelector(".popup-spot-edit");
    const overlay = document.querySelector(".popup-overlay");
    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => fillEditFormSpot(trade), 50);
}

//  Transaction  //
function openEditSpotTransactionPopup(trade) {
    closeAllPopups();
    const popup = document.querySelector(".popup-spot-transactions-edit");
    const overlay = document.querySelector(".popup-overlay");
    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => fillEditFormSpotTransfer(trade), 50);
}

//  Edit Trade  //
async function SaveEditSpot() {
    const btn = document.getElementById("updateSpot");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-spot-edit .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        // --- Local DB ---
        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];
        const item = dbSpot.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Trade tidak ditemukan di cache lokal!");
        const recordId = item.id;

        // --- Validasi Wajib ---
        const dateInputValue = getVal("SpotEditDate");
        if (!dateInputValue) {
            const input = document.getElementById("SpotEditDate");
            input.classList.add("input-error");

            setTimeout(() => {
                input.classList.remove("input-error");
            }, 2000);

            return;
        }
        const correctedDate = new Date(dateInputValue);

        // --- Data untuk Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: getVal("SpotEditPairs"),
            method: getDropdown("SpotEditMethod"),
            entry: getDropdown("SpotEditEntry"),
            timeframe: getDropdown("SpotEditTimeframe"),
            rr: parseFloat(getVal("SpotEditRr")) || 0,
            causes: getVal("SpotEditCauses"),
            psychology: getDropdown("SpotEditPsychology"),
            class: getDropdown("SpotEditClass"),
            before: getVal("SpotEditBefore-url"),
            after: getVal("SpotEditAfter-url"),
            margin: parseFloat(getVal("SpotEditMargin")) || 0,
            result: getDropdown("SpotEditResult"),
            pnl: parseFloat(getVal("SpotEditPnl")) || 0
        };

        // --- Update ke Supabase ---
        const { error: updateErr } = await supabaseClient
            .from("spot")
            .update(serverUpdate)
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (updateErr) throw updateErr;

        // --- Update Local Cache ---
        const updatedLocal = {
            ...item,
            date: Math.floor(correctedDate.getTime() / 1000),
            Pairs: serverUpdate.pairs,
            Method: serverUpdate.method,
            Confluance: {
                Entry: serverUpdate.entry,
                TimeFrame: serverUpdate.timeframe
            },
            RR: serverUpdate.rr,
            Causes: serverUpdate.causes,
            Psychology: serverUpdate.psychology,
            Class: serverUpdate.class,
            Files: {
                Before: serverUpdate.before,
                After: serverUpdate.after
            },
            Margin: serverUpdate.margin,
            Result: serverUpdate.result,
            Pnl: serverUpdate.pnl
        };

        const idx = dbSpot.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbSpot[idx] = updatedLocal;
            localStorage.setItem("dbspot", JSON.stringify(dbSpot));
        }

        // --- Refresh UI ---
        refreshDBSpotCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        CancelEditSpot();

    } catch (err) {
        alert("Error Edit:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Edit Transaction  //
async function SaveEditSpotTransaction() {
    const btn = document.getElementById("updateSpotTransaction");
    btn.classList.add("loading");

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-spot-transactions-edit .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];
        const item = dbSpot.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Transfer tidak ditemukan di cache lokal!");
        const recordId = item.id;

        const dateInputValue = getVal("EditSpotTransactionDate");
        if (!dateInputValue) {
            const input = document.getElementById("EditSpotTransactionDate");
            input.classList.add("input-error");

            setTimeout(() => {
                input.classList.remove("input-error");
            }, 2000);

            return;
        }
        const correctedDate = new Date(dateInputValue);

        const action = getDropdown("EditSpotTransactionAction");
        if (!action || !["Deposit", "Withdraw"].includes(action)) {
            const selected = document.querySelector(
                '.custom-dropdown[data-dropdown="EditSpotTransactionAction"] .dropdown-selected'
            );
            if (selected) {
                selected.classList.add("input-error");
                setTimeout(() => {
                selected.classList.remove("input-error");
                }, 2000);
            }
            return;
        }

        let value = parseFloat(getVal("EditSpotTransactionValue"));
        if (isNaN(value) || value === 0) {
        const input = document.getElementById("EditSpotTransactionValue");
        input.classList.add("input-error");
        setTimeout(() => input.classList.remove("input-error"), 2000);
        return;
        }
        value = action === "Withdraw" ? -Math.abs(value) : Math.abs(value);

        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: action,
            value: value
        };

        const { error: updateErr } = await supabaseClient
            .from("spot_transactions")
            .update(serverUpdate)
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (updateErr) throw updateErr;

        const updatedLocal = { ...item, date: serverUpdate.date, action: action, value: value };
        const idx = dbSpot.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbSpot[idx] = updatedLocal;
            localStorage.setItem("dbspot", JSON.stringify(dbSpot));
        }

        refreshDBSpotCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        
        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        CancelEditSpot();

    } catch (err) {
        alert("Error Edit:\n" + err);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Cancel  //
function CancelEditSpot() {
    currentEditingTradeNo = null;

    const popupEdit = document.querySelector(".popup-spot-edit");
    const popupTrans = document.querySelector(".popup-spot-transactions-edit");
    const overlay = document.querySelector(".popup-overlay");

    [popupEdit, popupTrans].forEach(p => p?.classList.remove("show"));
    overlay?.classList.remove("show");

    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";

    [popupEdit, popupTrans].forEach(popup => {
        if (!popup) return;
        popup.querySelectorAll('.custom-dropdown').forEach(dd => {
            const span = dd.querySelector('.dropdown-selected span');
            if (span) {
                span.textContent = span.getAttribute('data-placeholder') || 'Select option';
                span.classList.add('placeholder');
            }
            dd.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
        });
        popup.querySelectorAll('input, textarea').forEach(inp => inp.value = "");
    });
}

//  Delete Trade  //
async function DeleteSpot() {
    const btn = document.getElementById("deleteSpot");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada trade yang dipilih untuk dihapus!");
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await ConfirmDeletePerpetual(`Delete Spot Trade #${currentEditingTradeNo}?`);
    if (!confirmDelete) {
        btn.classList.remove("loading");
        return;
    }

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];
        const itemToDelete = dbSpot.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Trade tidak ditemukan di cache lokal!");
        const recordId = itemToDelete.id;

        const { error: deleteErr } = await supabaseClient
            .from("spot")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        const newDb = dbSpot.filter(t => t.id !== recordId);
        localStorage.setItem("dbspot", JSON.stringify(newDb));

        refreshDBSpotCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        CancelEditSpot();

    } catch (error) {
        console.error('Result:', error);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Delete Transaction  //
async function DeleteSpotTransaction() {
    const btn = document.getElementById("deleteSpotTransaction");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada transfer yang dipilih untuk dihapus!");
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await ConfirmDeletePerpetual(`Delete Spot Transfer #${currentEditingTradeNo}?`);
    if (!confirmDelete) {
        btn.classList.remove("loading");
        return;
    }

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const dbSpot = JSON.parse(localStorage.getItem("dbspot")) || [];
        const itemToDelete = dbSpot.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Transfer tidak ditemukan di cache lokal!");
        const recordId = itemToDelete.id;

        const { error: deleteErr } = await supabaseClient
            .from("spot_transactions")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        const newDb = dbSpot.filter(t => t.id !== recordId);
        localStorage.setItem("dbspot", JSON.stringify(newDb));

        refreshDBSpotCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        CancelEditSpot();

    } catch (error) {
        console.error('Result:', error);
    } finally {
        btn.classList.remove("loading");
    }
}

// Confirmasi Delete Perpetual & Spot //
function ConfirmDeletePerpetual(message) {
  return new Promise((resolve) => {
    const popup = document.getElementById("confirmPopup");
    const msg = document.getElementById("confirmMessage");
    const yes = document.getElementById("confirmYes");
    const no = document.getElementById("confirmNo");
    const popupContent = document.querySelector(".container-confirm");

    msg.textContent = message;

    popup.style.display = "flex";
    popup.style.zIndex = "99999";

    const cleanup = (result) => {
      popup.style.display = "none";

      yes.removeEventListener("click", onYes);
      no.removeEventListener("click", onNo);
      document.removeEventListener("keydown", onEscKey);
      popup.removeEventListener("click", onOutsideClick);

      resolve(result);
    };

    const onYes = (e) => {
      e.stopPropagation();
      cleanup(true);
    };

    const onNo = (e) => {
      e.stopPropagation();
      cleanup(false);
    };

    const onEscKey = (e) => {
      if (e.key === "Escape") cleanup(false);
    };

    const onOutsideClick = (e) => {
      if (!popupContent.contains(e.target)) {
        cleanup(false);
      }
    };

    yes.addEventListener("click", onYes);
    no.addEventListener("click", onNo);
    document.addEventListener("keydown", onEscKey);
    popup.addEventListener("click", onOutsideClick);
  });
}

// ────── DELETE MASSAL ────── //
function hideDeleteButton() {
  btnDeleteSelect.style.display = "none";
}

document.getElementById("btnDeleteSelect")?.addEventListener("click", async () => {

  const isSpot = selectedSpotNumbers.length > 0;
  const isPerpetual = selectedPerpetualNumbers.length > 0;

  if (isSpot && isPerpetual) {
    alert("⚠️ Tidak bisa delete Spot & Perpetual bersamaan");
    return;
  }

  const target = isSpot ? "Spot" : "Perpetual";
  const total = isSpot ? selectedSpotNumbers.length : selectedPerpetualNumbers.length;

  if (total === 0) return;

  const confirmed = await ConfirmDeletePerpetual(
    `Delete ${total} ${target} trade(s)?`
  );

  if (!confirmed) return;

  if (isSpot) {
    await DeleteSelectedSpotTrades();
  } else {
    await DeleteSelectedPerpetualTrades();
  }

  // cleanup UI
  selectedSpotNumbers = [];
  selectedPerpetualNumbers = [];
  hideDeleteButton();
});

async function DeleteSelectedPerpetualTrades() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) throw new Error("User tidak login");
    const user_id = user.id;

    const db = JSON.parse(localStorage.getItem("dbperpetual")) || [];

    const targets = db.filter(t =>
      selectedPerpetualNumbers.includes(t.tradeNumber)
    );

    for (const item of targets) {
      const table = item.action ? "perpetual_transactions" : "perpetual";

      await supabaseClient
        .from(table)
        .delete()
        .eq("id", item.id)
        .eq("user_id", user_id);
    }

    const newDb = db.filter(
      t => !selectedPerpetualNumbers.includes(t.tradeNumber)
    );

    localStorage.setItem("dbperpetual", JSON.stringify(newDb));

    refreshDBPerpetualCache();
    if (typeof updateAllUI === "function") await updateAllUI();
    restartSOP();
    CancelEditPerpetual();

  } catch (error) {
    console.error('Result:', error);
  }
}

async function DeleteSelectedSpotTrades() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) throw new Error("User tidak login");
    const user_id = user.id;

    const db = JSON.parse(localStorage.getItem("dbspot")) || [];

    const targets = db.filter(t =>
      selectedSpotNumbers.includes(t.tradeNumber)
    );

    for (const item of targets) {
      const table = item.action ? "spot_transactions" : "spot";

      await supabaseClient
        .from(table)
        .delete()
        .eq("id", item.id)
        .eq("user_id", user_id);
    }

    const newDb = db.filter(
      t => !selectedSpotNumbers.includes(t.tradeNumber)
    );

    localStorage.setItem("dbspot", JSON.stringify(newDb));

    refreshDBSpotCache?.();
    if (typeof updateAllUI === "function") await updateAllUI();
    restartSOP();

  } catch (error) {
    console.error('Result:', error);
  }
}

// ────── CALCULATE POPUP ────── //
document.addEventListener("DOMContentLoaded", () => {
    const popupCaculate = document.querySelector(".popup-caculate");
    const popupOverlay = document.querySelector(".popup-overlay");
    const btnCaculate = document.getElementById("btnCaculate");
    const closeBtn = document.getElementById("closeCaculate");

    function openCaculate() {
        if (typeof closeAllPopups === "function") closeAllPopups();
        
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupCaculate?.classList.add("show");
    }

    function closeCaculate() {
        popupCaculate?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    btnCaculate?.addEventListener("click", openCaculate);
    closeBtn?.addEventListener("click", closeCaculate);
    popupOverlay?.addEventListener("click", closeCaculate);

    popupCaculate?.addEventListener("click", function (e) {
        const row = e.target.closest(".row-if");
        if (row) {
            const valueEl = row.querySelector(".value-caculate");
            if (valueEl) {
                let text = valueEl.textContent.replace(/[$,]/g, '');
                
                navigator.clipboard.writeText(text)
                    .then(() => {
                        if (typeof window.showToast === "function") {
                            window.showToast(`Copied: ${text}`);
                        } else {
                            return
                        }
                    })
                    .catch(() => {
                        if (typeof window.showToast === "function") {
                            window.showToast("Gagal copy!");
                        }
                    });
            }
        }
    });
});

// ------ Automation PnL Perpetual ------ //
document.getElementById("PerpetualAutoPnL")?.addEventListener("click", () => {
    try {
        window.dropdownData = window.dropdownData || {};
        const resultValue = window.dropdownData["PerpetualEditResult"];

        if (!resultValue || !["Profit", "Loss"].includes(resultValue)) {
            showToast("Select Result Profit/Loss!");
            return;
        }

        const settingData = getLocalData("setting");
        const calc = getLocalData("calculate") || {};
        const activeSetting = settingData?.perp || {};
        const dbTrades = getLocalData("dbperpetual") || [];

        const rrInput = document.getElementById("PerpetualEditRr");
        const marginInput = document.getElementById("PerpetualEditMargin");
        const pnlInput = document.getElementById("PerpetualEditPnl");

        const rr = parseFloat(rrInput?.value || "0");
        const risk = parseFloat(activeSetting.risk) || 0;
        const feePercent = parseFloat(activeSetting.fee) || 0;
        const fee = feePercent / 100;
        const leverage = parseFloat(calc.leverage) || 1;

        const totalPNL = dbTrades.reduce((sum, item) => sum + (parseFloat(item.Pnl || item.pnl || 0)), 0);
        const totalDeposit = dbTrades.reduce((sum, item) => 
            item.action?.toLowerCase() === "deposit" ? sum + (parseFloat(item.value || 0)) : sum, 0);
        
        const finalBalance = totalPNL + totalDeposit;
        const margin = finalBalance * (risk / 100);
        const positionSize = margin * leverage;
        const feeValue = positionSize * fee * 2;

        let pnlFinal = 0;
        let rrUsed = rr;

        if (resultValue === "Profit") {
            if (isNaN(rr) || rr <= 0) { showToast("Enter RR!"); return; }
            pnlFinal = (margin * rrUsed) - feeValue;
        } else if (resultValue === "Loss") {
            rrUsed = -1;
            pnlFinal = -(margin + feeValue);
        }

        if (marginInput) marginInput.value = margin.toFixed(2);
        if (pnlInput) pnlInput.value = pnlFinal.toFixed(2);
        if (rrInput) rrInput.value = rrUsed.toFixed(2);

        showToast("Perpetual PnL Calculated!");
    } catch (error) { 
        console.error('Result:', error); 
    }
});

// ------ Automation PnL Spot ------ //
document.getElementById("SpotAutoPnL")?.addEventListener("click", () => {
    try {
        window.dropdownData = window.dropdownData || {};
        const resultValue = window.dropdownData["SpotEditResult"];

        if (!resultValue || !["Profit", "Loss"].includes(resultValue)) {
            showToast("Select Result Profit/Loss!");
            return;
        }

        const settingData = getLocalData("setting");
        const activeSetting = settingData?.spot || {};
        const dbTrades = getLocalData("dbspot") || [];

        const rrInput = document.getElementById("SpotEditRr");
        const marginInput = document.getElementById("SpotEditMargin");
        const pnlInput = document.getElementById("SpotEditPnl");

        const rr = parseFloat(rrInput?.value || "0");
        const risk = parseFloat(activeSetting.risk) || 0;
        const feePercent = parseFloat(activeSetting.fee) || 0;
        const fee = feePercent / 100;
        
        const leverage = 1;

        const totalPNL = dbTrades.reduce((sum, item) => sum + (parseFloat(item.Pnl || item.pnl || 0)), 0);
        const totalDeposit = dbTrades.reduce((sum, item) => 
            item.action?.toLowerCase() === "deposit" ? sum + (parseFloat(item.value || 0)) : sum, 0);
        
        const finalBalance = totalPNL + totalDeposit;
        const margin = finalBalance * (risk / 100);
        const positionSize = margin * leverage; 
        const feeValue = positionSize * fee * 2;

        let pnlFinal = 0;
        let rrUsed = rr;

        if (resultValue === "Profit") {
            if (isNaN(rr) || rr <= 0) { showToast("Enter RR!"); return; }
            pnlFinal = (margin * rrUsed) - feeValue;
        } else if (resultValue === "Loss") {
            rrUsed = -1;
            pnlFinal = -(margin + feeValue);
        }

        if (marginInput) marginInput.value = margin.toFixed(2);
        if (pnlInput) pnlInput.value = pnlFinal.toFixed(2);
        if (rrInput) rrInput.value = rrUsed.toFixed(2);

        showToast("Spot PnL Calculated!");
    } catch (error) {
        console.error('Result:', error);
    }
});

// ────── Popup SOP  ────── //
let globalPopupOverlay = null;
let globalPopupSop = null;

function closePopupSop() {
    if (!globalPopupSop || !globalPopupOverlay) return;
    globalPopupSop.classList.remove("show");
    globalPopupOverlay.classList.remove("show");
    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
}

function openPopupSop() {
    if (!globalPopupSop || !globalPopupOverlay) return;
    closePopupSop(); 
    
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";
    globalPopupOverlay.classList.add("show");
    globalPopupSop.classList.add("show");
}

document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupSop = document.querySelector(".popup-sop");
    const btnSopTrading = document.getElementById("BtnSop");

    globalPopupOverlay = popupOverlay;
    globalPopupSop = popupSop;

    if (btnSopTrading) {
        btnSopTrading.addEventListener("click", openPopupSop);
    }

    popupOverlay?.addEventListener("click", closePopupSop);
    document.getElementById("closeSop")?.addEventListener("click", closePopupSop);
});

function loadSOP() {
    const saved = localStorage.getItem('sop');
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        maxWin: 2,
        maxLoss: 2,
        maxEntry: 3,
        maxDD: 1
    };
}

function saveSOP(sop) {
    localStorage.setItem('sop', JSON.stringify(sop));
}

let sopRules = loadSOP();

function getTodayTrades(db) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const startTime = start.getTime();
    const endTime = end.getTime();

    return db.filter(t => {
        let tradeTime;
        if (typeof t.date === 'string') {
            tradeTime = new Date(t.date).getTime();
        } else if (typeof t.date === 'number') {
            tradeTime = t.date * 1000;
        } else {
            return false;
        }
        return !isNaN(tradeTime) && tradeTime >= startTime && tradeTime < endTime;
    });
}

function getTodaySOPData() {
    const raw = localStorage.getItem('dbperpetual');
    if (!raw) return { wins: 0, losses: 0, entries: 0, drawdown: 0 };

    const db = JSON.parse(raw);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const startTime = todayStart.getTime();

    const beforeToday = [];
    const todayTrades = [];

    for (const t of db) {
        let tradeTime;
        if (typeof t.date === 'string') {
            tradeTime = new Date(t.date).getTime();
        } else if (typeof t.date === 'number') {
            tradeTime = t.date * 1000;
        } else {
            continue;
        }

        if (isNaN(tradeTime)) continue;

        if (tradeTime < startTime) {
            beforeToday.push(t);
        } else {
            todayTrades.push(t);
        }
    }

    let balanceAwal = 0;
    for (const t of beforeToday) {
        if (t.action === "Deposit") {
            balanceAwal += t.value || 0;
        } else if (t.action === "Withdraw") {
            balanceAwal -= t.value || 0;
        } else if (t.Pnl !== undefined && typeof t.Pnl === 'number') {
            balanceAwal += t.Pnl;
        }
    }

    if (balanceAwal <= 0) {
        balanceAwal = 1;
    }

    let wins = 0, losses = 0, entries = 0;
    let totalPnLHariIni = 0;

    for (const t of todayTrades) {
        if (!t.Result || typeof t.Pnl !== 'number') continue;
        entries++;
        totalPnLHariIni += t.Pnl;
        if (t.Result === "Profit") wins++;
        else if (t.Result === "Loss") losses++;
    }

    const balanceSekarang = balanceAwal + totalPnLHariIni;
    let drawdown = 0;

    if (balanceSekarang < balanceAwal) {
        drawdown = ((balanceAwal - balanceSekarang) / balanceAwal) * 100;
    }

    return {
        wins,
        losses,
        entries,
        drawdown: Number(drawdown.toFixed(2))
    };
}

const todaySop = getTodaySOPData();
const tradingDataSop = { ...todaySop };

function updateUI() {
    const { wins, losses, entries, drawdown } = tradingDataSop;
    const { maxWin, maxLoss, maxEntry, maxDD } = sopRules;
    
    document.getElementById('maxWinDisplay').textContent = `${maxWin}x`;
    document.getElementById('maxLossDisplay').textContent = `${maxLoss}x`;
    document.getElementById('maxEntryDisplay').textContent = `${maxEntry}x`;
    document.getElementById('maxDDDisplay').textContent = `${maxDD}%`;
    
    document.getElementById('winCount').textContent = `${wins}/${maxWin}`;
    document.getElementById('lossCount').textContent = `${losses}/${maxLoss}`;
    document.getElementById('entryCount').textContent = `${entries}/${maxEntry}`;
    document.getElementById('ddCount').textContent = `${drawdown}%`;
    
    const winBar = document.getElementById('winBar');
    const lossBar = document.getElementById('lossBar');
    const entryBar = document.getElementById('entryBar');
    const ddBar = document.getElementById('ddBar');
    
    winBar.style.width = `${(wins/maxWin)*100}%`;
    lossBar.style.width = `${(losses/maxLoss)*100}%`;
    entryBar.style.width = `${(entries/maxEntry)*100}%`;
    ddBar.style.width = `${(drawdown/maxDD)*100}%`;
    
    if (wins >= maxWin) winBar.className = 'progress-fill-sop danger';
    else if (wins >= maxWin - 1) winBar.className = 'progress-fill-sop warning';
    else winBar.className = 'progress-fill-sop';
    
    if (losses >= maxLoss) lossBar.className = 'progress-fill-sop danger';
    else if (losses >= maxLoss - 1) lossBar.className = 'progress-fill-sop warning';
    else lossBar.className = 'progress-fill-sop';
    
    if (entries >= maxEntry) entryBar.className = 'progress-fill-sop danger';
    else if (entries >= maxEntry - 1) entryBar.className = 'progress-fill-sop warning';
    else entryBar.className = 'progress-fill-sop';
    
    if (drawdown >= maxDD) ddBar.className = 'progress-fill-sop danger';
    else if (drawdown >= maxDD * 0.7) ddBar.className = 'progress-fill-sop warning';
    else ddBar.className = 'progress-fill-sop';
    
    const statusEntry = document.getElementById('statusEntry');
    const statusWin = document.getElementById('statusWin');
    const statusLoss = document.getElementById('statusLoss');
    
    const canTrade = wins < maxWin && losses < maxLoss && entries < maxEntry && drawdown < maxDD;
    const canEntry = entries < maxEntry && canTrade;
    
    if (!canEntry) {
        statusEntry.className = 'info-card danger';
        statusEntry.querySelector('.info-value').textContent = 'BLOCKED';
        statusEntry.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M480-96q-79 0-149-30t-122.5-82.5Q156-261 126-331T96-480q0-80 30-149.5t82.5-122Q261-804 331-834t149-30q80 0 149.5 30t122 82.5Q804-699 834-629.5T864-480q0 79-30 149t-82.5 122.5Q699-156 629.5-126T480-96Zm0-72q55 0 104-18t89-50L236-673q-32 40-50 89t-18 104q0 130 91 221t221 91Zm244-119q32-40 50-89t18-104q0-130-91-221t-221-91q-55 0-104 18t-89 50l437 437ZM480-480Z"/></svg>';
    } else if (entries >= maxEntry - 1) {
        statusEntry.className = 'info-card warning';
        statusEntry.querySelector('.info-value').textContent = 'LAST ENTRY';
        statusEntry.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M336-144v-72h288v72H336Zm0-144-48-449q-2-32 19-55.5t53-23.5h240q32 0 53 23.5t19 55.5l-48 449H336Zm65-72h158l41-384H360l41 384Zm-7-384h-34 240-206Z"/></svg>';
    } else {
        statusEntry.className = 'info-card active';
        statusEntry.querySelector('.info-value').textContent = 'ALLOWED';
        statusEntry.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-72q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-72q70 0 119-49t49-119q0-70-49-119t-119-49q-70 0-119 49t-49 119q0 70 49 119t119 49Zm-.21-96Q450-408 429-429.21t-21-51Q408-510 429.21-531t51-21Q510-552 531-530.79t21 51Q552-450 530.79-429t-51 21Z"/></svg>';
    }
    
    const winsLeft = maxWin - wins;
    if (winsLeft <= 0) {
        statusWin.className = 'info-card danger';
        statusWin.querySelector('.info-value').textContent = 'MAX REACHED';
    } else if (winsLeft === 1) {
        statusWin.className = 'info-card warning';
        statusWin.querySelector('.info-value').textContent = '1 LEFT';
    } else {
        statusWin.className = 'info-card active';
        statusWin.querySelector('.info-value').textContent = `${winsLeft} LEFT`;
    }
    
    const lossesLeft = maxLoss - losses;
    if (lossesLeft <= 0) {
        statusLoss.className = 'info-card danger';
        statusLoss.querySelector('.info-value').textContent = 'MAX REACHED';
    } else if (lossesLeft === 1) {
        statusLoss.className = 'info-card warning';
        statusLoss.querySelector('.info-value').textContent = '1 LEFT';
    } else {
        statusLoss.className = 'info-card active';
        statusLoss.querySelector('.info-value').textContent = `${lossesLeft} LEFT`;
    }

    function setRuleRowState(el, value, max, warningAt = max - 1) {
        if (!el) return;

        el.classList.remove("active", "warning", "danger");

        if (value >= max) {
            el.classList.add("danger");
        } else if (value >= warningAt) {
            el.classList.add("warning");
        } else {
            el.classList.add("active");
        }
    }

    // setelah hitung data
    setRuleRowState(
        document.getElementById("ruleWin"),
        wins,
        maxWin
    );

    setRuleRowState(
        document.getElementById("ruleLoss"),
        losses,
        maxLoss
    );

    setRuleRowState(
        document.getElementById("ruleEntry"),
        entries,
        maxEntry
    );

    setRuleRowState(
        document.getElementById("ruleDD"),
        drawdown,
        maxDD,
        maxDD * 0.7
    );

}


// ------ Popup Edit SOP ------ //
document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupEdit = document.querySelector(".popup-edit-sop");
    const editRuleLabel = document.getElementById("editRuleLabel");
    const editRuleInput = document.getElementById("editRuleInput");
    const cancelEditBtn = document.getElementById("cancelEditRule");
    const saveEditBtn = document.getElementById("saveEditRule");

    let currentRule = null;

    function closePopupEdit() {
        popupEdit?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
        currentRule = null;

        setTimeout(() => {
            openPopupSop();
        }, 100);
    }

    function openPopupEdit(ruleName, label, currentValue) {
        const popupSop = document.querySelector(".popup-sop");
        if (popupSop?.classList.contains("show")) {
            popupSop.classList.remove("show");
        }

        currentRule = ruleName;
        editRuleLabel.textContent = label;
        editRuleInput.value = currentValue;
        editRuleInput.focus();

        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupEdit?.classList.add("show");
    }

    document.querySelectorAll(".rule-row").forEach(row => {
        const editable = row.querySelector(".editable");
        if (!editable) return;

        row.addEventListener("click", () => {
            const ruleName = editable.getAttribute("data-rule");
            const label = editable.closest(".rule-info").querySelector(".rule-label").textContent;
            const currentValue = sopRules[ruleName];
            openPopupEdit(ruleName, label, currentValue);
        });
    });

    cancelEditBtn?.addEventListener("click", closePopupEdit);
    saveEditBtn?.addEventListener("click", () => {
        const raw = editRuleInput.value.trim();
        if (raw === "" || isNaN(raw) || parseInt(raw) <= 0) {
            alert("Masukkan angka valid (> 0)");
            return;
        }

        sopRules[currentRule] = parseInt(raw);
        saveSOP(sopRules);
        updateUI();
        closePopupEdit();
    });

    popupOverlay?.addEventListener("click", (e) => {
        if (popupEdit?.classList.contains("show")) {
            closePopupEdit();
        }
    });
});

updateUI();

function restartSOP() {
    sopRules = loadSOP();

    const todaySop = getTodaySOPData();

    Object.assign(tradingDataSop, todaySop);

    updateUI();
}

// ────── Edit Profile ────── //
document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupSop = document.querySelector(".popup-container.popup-edit-profile");
    const btnEditProfile = document.getElementById("btnEditProfile");

    function hasAnyPopupOpen() {
        const popupShare = document.querySelector(".popup-share");
        return (
            (popupSop && popupSop.classList.contains("show")) ||
            (popupShare && popupShare.classList.contains("show"))
        );
    }

    function closePopup(popup) {
        popup?.classList.remove("show");
        if (!hasAnyPopupOpen()) {
            popupOverlay?.classList.remove("show");
            document.body.classList.remove("popup-open");
            document.body.style.overflow = "";
        }
    }

    function closeAllPopups() {
        const popupShare = document.querySelector(".popup-share");
        popupSop?.classList.remove("show");
        popupShare?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    function resetEditProfileForm() {
        namaInput.value = "";
        previewNama.textContent = 'New Username';
        previewNama.classList.add('profile-placeholder');
        
        fotoInput.value = "";
        resetUploadArea();
        
        const savedAvatar = localStorage.getItem('avatar');
        previewFoto.src = savedAvatar || htmlDefaultImage;
    }

    btnEditProfile?.addEventListener("click", () => {
        closeAllPopups();
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupSop?.classList.add("show");
        
        resetEditProfileForm();
    });

    popupOverlay?.addEventListener("click", closeAllPopups);

    document.getElementById("closeEditProfile")?.addEventListener("click", () => {
        closePopup(popupSop);
    });
});

const namaInput = document.getElementById('nama');
const fotoInput = document.getElementById('foto');
const uploadArea = document.getElementById('uploadArea');
const fileName = document.getElementById('fileName');
const btnRemove = document.getElementById('btnRemove');
const previewNama = document.getElementById('previewNama');
const previewFoto = document.getElementById('previewFoto');

const htmlDefaultImage = previewFoto.src;

function resetUploadArea() {
    fileName.textContent = '';
    btnRemove.style.display = 'none';
    
    uploadArea.querySelector('.upload-icon')?.classList.remove('hidden');
    uploadArea.querySelectorAll('.upload-text').forEach(t => t.classList.remove('hidden'));
    
    uploadArea.classList.remove('dragover');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        previewFoto.src = dataUrl;
        fileName.textContent = file.name;
        btnRemove.style.display = 'inline-block';

        uploadArea.querySelector('.upload-icon')?.classList.add('hidden');
        uploadArea.querySelectorAll('.upload-text').forEach(t => t.classList.add('hidden'));
    };
    reader.readAsDataURL(file);
}

const savedAvatar = localStorage.getItem('avatar');
previewFoto.src = savedAvatar || htmlDefaultImage;

namaInput.addEventListener('input', function() {
    const alertEl = document.getElementById("usernameAltert");
    if (alertEl) {
        alertEl.style.display = "none";
    }

    const value = this.value.trim();
    const isValid = /^[a-zA-Z]{3,20}$/.test(value);

    if (value === '') {
        previewNama.textContent = 'New Username';
        previewNama.classList.add('profile-placeholder');
    } else {
        previewNama.textContent = value;
        previewNama.classList.remove('profile-placeholder');
    }

    if (isValid) {
        this.style.borderColor = 'var(--green)';
    } else {
        this.style.borderColor = 'var(--red)';
    }
});

uploadArea.addEventListener('click', function(e) {
    if (e.target !== btnRemove) {
        fotoInput.click();
    }
});

fotoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});

btnRemove.addEventListener('click', function(e) {
    e.stopPropagation();
    fotoInput.value = '';
    
    const savedAvatar = localStorage.getItem('avatar');
    previewFoto.src = savedAvatar || htmlDefaultImage;
    
    resetUploadArea();
});

async function SaveEditProfile() {
    const btnSave = document.getElementById('SaveEditProfile');
    btnSave.classList.add('loading');

    try {
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const newUsername = document.getElementById('nama').value.trim();
        const usernameIsValid = /^[a-zA-Z]{3,20}$/.test(newUsername);

        const previewFoto = document.getElementById('previewFoto');
        const currentPreviewSrc = previewFoto.src;
        const isUploadingNewImage = currentPreviewSrc.startsWith('data:image');

        const { data: currentProfile } = await supabaseClient
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user_id)
            .single();

        const oldUsername = currentProfile?.username || "";
        const oldAvatar = currentProfile?.avatar_url || null;

        let avatarPathForDB = undefined;
        let shouldUpdate = false;

        if (newUsername && newUsername !== oldUsername) {
            if (!usernameIsValid) {
                const alertEl = document.getElementById("usernameAltert");
                if (alertEl) {
                    alertEl.textContent = "Username format is incorrect";
                    alertEl.style.display = "block";
                }
                return;
            }
            shouldUpdate = true;
        }

        if (isUploadingNewImage) {
            shouldUpdate = true;

            localStorage.setItem('avatar', currentPreviewSrc);

            updateAvatarInSavedAccounts(user_id, currentPreviewSrc);

            if (oldAvatar) {
                await supabaseClient.storage
                    .from('avatars')
                    .remove([oldAvatar])
                    .catch(error => console.error('Result:', error));
            }

            const byteString = atob(currentPreviewSrc.split(',')[1]);
            const mimeString = currentPreviewSrc.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const ext = mimeString.split('/')[1];
            const fileName = `${user_id}/${Date.now()}.${ext}`;
            const fullPath = `public/${fileName}`;

            const { error: uploadErr } = await supabaseClient.storage
                .from('avatars')
                .upload(fullPath, blob, { contentType: mimeString, upsert: true });

            if (uploadErr) throw new Error("Gagal upload avatar: " + uploadErr.message);

            avatarPathForDB = fullPath;

        } else if (currentPreviewSrc === htmlDefaultImage && oldAvatar !== null) {
            shouldUpdate = true;
            avatarPathForDB = null;
            localStorage.removeItem('avatar');
            updateAvatarInSavedAccounts(user_id, null);
        }

        if (!shouldUpdate) {
            btnSave.classList.remove('loading');
            closeEditProfilePopup();
            return;
        }

        const profileUpdate = {};

        if (newUsername && newUsername !== oldUsername) {
            profileUpdate.username = newUsername;
        }

        if (avatarPathForDB !== undefined) {
            profileUpdate.avatar_url = avatarPathForDB;
        }

        const { error: updateErr } = await supabaseClient
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user_id);

        if (updateErr) throw new Error("Gagal update profil: " + updateErr.message);

        await renderProfile();

        resetEditProfileForm();
        closeEditProfilePopup();

        renderNavbarAvatar();
        renderAccountList();

    } catch (error) {
        console.error('Result:', error);
        const alertEl = document.getElementById("usernameAltert");
        if (alertEl) {
            let message = "Failed to save: " + (err.message || "Unknown error");

            if (err.message && 
                err.message.includes('duplicate key value violates unique constraint') &&
                err.message.includes('profiles_username_key')) {
                message = "Username is already taken.";
            }

            alertEl.textContent = message;
            alertEl.style.display = "block";
        }
    } finally {
        btnSave.classList.remove('loading');
    }
}

function closeEditProfilePopup() {
    const popup = document.querySelector(".popup-container.popup-edit-profile");
    const overlay = document.querySelector(".popup-overlay");
    popup?.classList.remove("show");
    const otherPopup = document.querySelector(".popup-share");
    if (!otherPopup?.classList.contains("show")) {
        overlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }
}

function resetEditProfileForm() {
    namaInput.value = "";
    previewNama.textContent = 'New Username';
    previewNama.classList.add('profile-placeholder');
    
    fotoInput.value = "";
    resetUploadArea();
    
    const savedAvatar = localStorage.getItem('avatar');
    previewFoto.src = savedAvatar || htmlDefaultImage;
}

function updateAvatarInSavedAccounts(user_id, newAvatarBase64) {
    const savedRaw = localStorage.getItem('saved_accounts');
    if (!savedRaw) return;

    let savedAccounts = JSON.parse(savedRaw);
    const accountIndex = savedAccounts.findIndex(acc => acc.user_id === user_id);
    
    if (accountIndex !== -1) {
        savedAccounts[accountIndex].avatar = newAvatarBase64;
        localStorage.setItem('saved_accounts', JSON.stringify(savedAccounts));
    }
}

// ────── POPUP SHARE ────── //
document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupShare = document.querySelector(".popup-share");
    const btnShare = document.getElementById("BtnShare");

    function closeAllPopups() {
        popupShare?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    if(btnShare) {
        btnShare.addEventListener("click", async () => {
            try {
                if(typeof supabaseClient !== 'undefined') {
                    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
                    if (!authErr && user) {
                        const { data: profile } = await supabaseClient.from("profiles").select("username").eq("id", user.id).single();
                        TEXT_CONTENT_SHARE.username = profile?.username || 'User';
                    }
                }
            } catch (error) { 
                console.error('Result:', error);
            }

            closeAllPopups();
            document.body.classList.add("popup-open");
            document.body.style.overflow = "hidden";
            popupOverlay?.classList.add("show");
            popupShare?.classList.add("show");
            
            updateDataShare();
            loadProfileImageShare();
        });
    }

    popupOverlay?.addEventListener("click", closeAllPopups);
    document.getElementById("closeShare")?.addEventListener("click", () => {
        popupShare?.classList.remove("show");
        if (!document.querySelector(".popup-container.show")) {
             popupOverlay?.classList.remove("show");
             document.body.classList.remove("popup-open");
             document.body.style.overflow = "";
        }
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadFonts();
    await loadAssets();
    
    loadProfileImageShare();
    updateDataShare();

    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {

            if (btn.classList.contains('active')) return;

            document.querySelectorAll('.share-btn')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');
            selectedRangeShare = btn.textContent.trim();
            updateDataShare();
        });
    });

});

// --- GLOBAL CONFIG & STATE --- //
const canvasShare = document.getElementById('canvasShare');
const ctxShare = canvasShare.getContext('2d');

const CANVAS_WIDTH = 1700;
const NORMAL_TEXT_SPACING = 1;

let selectedRangeShare = '24H';
let profileImageShare = null;
let templateImageShare = null;
let pairIconImage = null;
let symbolJsonData = null;

const TEMPLATE_SHARE_VERSION = "2.2";
const TEMPLATE_URL_SHARE = 'Asset/template.jpg';
const SYMBOL_JSON_URL = 'Asset/Link-Symbol.json';

const TEXT_CONTENT_SHARE = {
    username: 'N/A',
    timestamp: getCurrentTimestamp(),
    pairName: 'N/A',
    tradeCount: '0',
    avgRR: '0.00',
    winrate: '0.00%',
    volume: '$0.00',
    return: '+0.00%',
    toWin: '$0.00',
    mainEdge: 'N/A',
    performanceTitle: 'N/A'
};

// --- HELPER FUNCTIONS --- //

function loadFonts() {
    if (!document.fonts || typeof document.fonts.load !== "function") {
        return Promise.resolve();
    }
    const fonts = new Set();
    fonts.add("600 36px Poppins");
    fonts.add("24px Arial");
    fonts.add("700 88px Arial");
    fonts.add("28px Poppins");
    fonts.add("600 34px Arial");
    fonts.add("600 60px Arial");
    fonts.add("bold 60px Arial");
    fonts.add("700 30px Poppins");
    fonts.add("600 38px Poppins");
    fonts.add("600 30px Poppins");
    
    return Promise.all(Array.from(fonts).map(f => document.fonts.load(f))).then(() => document.fonts.ready);
}

function getFontSizePx(font, fallback = 24) {
    if (!font) return fallback;
    const match = String(font).match(/(\d+(?:\.\d+)?)px/);
    if (!match) return fallback;
    const size = Number.parseFloat(match[1]);
    return Number.isFinite(size) ? size : fallback;
}

function normalizePadding(padding) {
    if (Array.isArray(padding)) {
        const [top = 0, right = 0, bottom = 0, left = 0] = padding;
        return { top, right, bottom, left };
    }
    return { top: padding ?? 0, right: padding ?? 0, bottom: padding ?? 0, left: padding ?? 0 };
}

function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctxShare.beginPath();
    if (typeof ctxShare.roundRect === "function") {
        ctxShare.roundRect(x, y, width, height, r);
    } else {
        ctxShare.moveTo(x + r, y);
        ctxShare.lineTo(x + width - r, y);
        ctxShare.quadraticCurveTo(x + width, y, x + width, y + r);
        ctxShare.lineTo(x + width, y + height - r);
        ctxShare.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctxShare.lineTo(x + r, y + height);
        ctxShare.quadraticCurveTo(x, y + height, x, y + height - r);
        ctxShare.lineTo(x, y + r);
        ctxShare.quadraticCurveTo(x, y, x + r, y);
        ctxShare.closePath();
    }
}

function drawCircleImage(img, x, y, size, borderWidth = 0, borderColor = "#ffffff") {
    if (!img) return;
    const radius = size / 2;
    const centerX = x + radius;
    const centerY = y + radius;

    ctxShare.save();
    ctxShare.beginPath();
    ctxShare.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctxShare.closePath();
    ctxShare.clip();
    ctxShare.drawImage(img, x, y, size, size);
    ctxShare.restore();

    if (borderWidth > 0) {
        ctxShare.beginPath();
        ctxShare.arc(centerX, centerY, radius - borderWidth / 2, 0, Math.PI * 2);
        ctxShare.strokeStyle = borderColor;
        ctxShare.lineWidth = borderWidth;
        ctxShare.stroke();
    }
}

// --- TEXT DRAWING --- //
function drawTextWithSpacing(text, x, y, spacing = 0, font, color, align = 'left') {
    ctxShare.font = font;
    ctxShare.fillStyle = color;
    
    let totalWidth = 0;
    const charWidths = [];
    
    for (const char of text) {
        const w = ctxShare.measureText(char).width;
        charWidths.push(w);
        totalWidth += w + spacing;
    }
    if (text.length > 0) totalWidth -= spacing;

    let startX = x;
    if (align === 'right') {
        startX = x - totalWidth;
    } else if (align === 'center') {
        startX = x - (totalWidth / 2);
    }

    let currentX = startX;
    for (let i = 0; i < text.length; i++) {
        ctxShare.fillText(text[i], currentX, y);
        currentX += charWidths[i] + spacing;
    }
}

// --- RENDER LOGIC --- //

function renderUserBadge() {
    const config = {
        x: "center",
        y: 65,
        padding: [16, 30, 16, 20],
        gap: 12,
        radius: "pill",
        avatarSize: 60,
        text: TEXT_CONTENT_SHARE.username,
        font: "600 36px Poppins",
        textColor: "#ffffff",
        background: "rgba(10, 10, 10, 0.45)",
    };

    const { x, y, padding, gap, radius, avatarSize, text, font, textColor, background } = config;
    const { top, right, bottom, left } = normalizePadding(padding);

    ctxShare.font = font;
    const textWidth = ctxShare.measureText(text).width;
    const fontSize = getFontSizePx(font, 24);
    const contentHeight = Math.max(avatarSize, fontSize);
    const width = Math.ceil(left + avatarSize + gap + textWidth + right);
    const height = Math.ceil(top + contentHeight + bottom);
    
    const baseX = x === "center" ? Math.round((canvasShare.width - width) / 2) : x;

    const resolvedRadius = radius === "pill" || radius == null ? height / 2 : Math.min(radius, height / 2);

    ctxShare.fillStyle = background;
    drawRoundedRect(baseX, y, width, height, resolvedRadius);
    ctxShare.fill();

    const avatarX = baseX + left;
    const avatarY = y + top + (contentHeight - avatarSize) / 2;
    
    if (profileImageShare) {
        drawCircleImage(profileImageShare, avatarX, avatarY, avatarSize, 0);
    } else {
        ctxShare.beginPath();
        ctxShare.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
        ctxShare.fillStyle = '#333';
        ctxShare.fill();
    }

    const textX = avatarX + avatarSize + gap;
    const textY = y + top + contentHeight / 2 + fontSize * 0.35;
    
    ctxShare.fillStyle = textColor;
    ctxShare.textAlign = 'left';
    ctxShare.fillText(text, textX, textY);
}

function renderPairIcon() {
    const config = {
        x: 280,
        y: 340,
        size: 72,
        borderWidth: 2,
        borderColor: "#8e8e8e",
    };
    
    if(pairIconImage) {
        drawCircleImage(pairIconImage, config.x, config.y, config.size, config.borderWidth, config.borderColor);
    }
}

function renderTextLayers() {
    const layers = [
        { text: "Best Pairs", x: 280, y: 320, font: "600 28px Poppins", color: "#fff" },
        { text: TEXT_CONTENT_SHARE.timestamp, x: 280, y: 455, font: "24px Arial", color: "rgb(163, 163, 163)" },
        { text: TEXT_CONTENT_SHARE.pairName, x: 370, y: 398, font: "700 60px Arial", color: "#fff" },

        { text: "Total Trades", x: 280, y: 525, font: "28px Poppins", color: "rgb(163, 163, 163)" },
        { text: "Avg RR", x: 510, y: 525, font: "28px Poppins", color: "rgb(163, 163, 163)" },
        { text: "Winrate", x: 680, y: 525, font: "28px Poppins", color: "rgb(163, 163, 163)" },

        { text: TEXT_CONTENT_SHARE.tradeCount, x: 280, y: 580, font: "600 36px Arial", color: "#fff" },
        { text: TEXT_CONTENT_SHARE.avgRR, x: 510, y: 580, font: "600 36px Arial", color: "#fff" },
        { text: TEXT_CONTENT_SHARE.winrate, x: 680, y: 580, font: "600 36px Arial", color: "#fff" },

        { text: "Main Edge:", x: 280, y: 650, font: "28px Poppins", color: "rgb(163, 163, 163)" },
        { text: TEXT_CONTENT_SHARE.mainEdge, x: 450, y: 650, font: "600 30px Poppins", color: "#fff" },

        { text: TEXT_CONTENT_SHARE.performanceTitle, x: 1040, y: 320, font: "600 38px Poppins", color: "rgb(52, 211, 153)" },
        { text: "Capital I.V", x: 1040, y: 385, font: "28px Poppins", color: "rgb(163, 163, 163)" },
        { text: TEXT_CONTENT_SHARE.volume, x: 1465, y: 385, font: "600 34px Arial", align: "right", color: "#ffffff" },
        
        { text: "Return", x: 1040, y: 455, font: "28px Poppins", color: "rgb(163, 163, 163)" },
        { text: TEXT_CONTENT_SHARE.return, x: 1465, y: 455, font: "600 34px Arial", align: "right", color: "#ffffff" },
        
        { text: TEXT_CONTENT_SHARE.toWinLabel, x: 1040, y: 565, font: "700 30px Poppins", color: "#fff" },
        { text: TEXT_CONTENT_SHARE.toWin, x: 1040, y: 645, font: "600 60px Arial", align: "left", color: "#ffffff" },
    ];

    layers.forEach(layer => {
        const spacing = layer.letterSpacing != null ? layer.letterSpacing : (layer.font.includes('bold') || /[6-9]00/.test(layer.font) ? 0 : NORMAL_TEXT_SPACING);
        drawTextWithSpacing(layer.text, layer.x, layer.y, spacing, layer.font, layer.color, layer.align || 'left');
    });
}

function renderImage() {
    if (!templateImageShare) return;

    const scale = CANVAS_WIDTH / templateImageShare.width;
    canvasShare.width = CANVAS_WIDTH;
    canvasShare.height = Math.round(templateImageShare.height * scale);

    ctxShare.clearRect(0, 0, canvasShare.width, canvasShare.height);
    
    ctxShare.drawImage(templateImageShare, 0, 0, canvasShare.width, canvasShare.height);

    renderUserBadge();
    renderPairIcon();
    renderTextLayers();
}

// --- DATA CALCULATION & LOGIC --- //

function getCurrentTimestamp() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

function cleanPairName(pair) {
    if (!pair) return 'BTC';
    const upperPair = String(pair).toUpperCase();
    const usdIndex = upperPair.indexOf('USD');
    if (usdIndex !== -1) {
    return upperPair.substring(0, usdIndex);
    }
    return upperPair || 'BTC';
}

function getPerformanceTitle(range) {
    switch (range) {
        case '24H': return 'Daily Performance';
        case '1W': return 'Weekly Performance';
        case '30D': return 'Monthly Performance';
        case 'ALL': return 'All-Time Performance';
        default: return 'Performance';
    }
}

function getTradeTimestamp(item) {
    if (typeof item.date === 'number') return item.date * 1000;
    if (typeof item.date === 'string') return new Date(item.date).getTime();
    return 0;
}

function filterByRangeShare(data, range) {
    if (range === 'ALL') return data;
    const now = Date.now();
    let cutoff = 0;
    if (range === '24H') cutoff = now - 24 * 60 * 60 * 1000;
    else if (range === '1W') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30D') cutoff = now - 30 * 24 * 60 * 60 * 1000;

    return data.filter(item => {
        const tDate = getTradeTimestamp(item);
        return tDate >= cutoff;
    });
}

function calculateBalanceAtTime(trades, targetTime) {
    let balance = 0;
    trades.forEach(t => {
        const tDate = getTradeTimestamp(t);
        if (!tDate || tDate > targetTime) return;

        if (t.action?.toLowerCase() === 'deposit') balance += parseFloat(t.value) || 0;
        else if (t.action?.toLowerCase() === 'withdraw') balance -= parseFloat(t.value) || 0;
        else if ((t.Result === 'Profit' || t.Result === 'Loss') && typeof t.Pnl === 'number') balance += parseFloat(t.Pnl) || 0;
    });
    return balance;
}

// --- DATA PROCESSING --- //

async function loadSymbolJson() {
    if (symbolJsonData) return symbolJsonData;
    try {
        const response = await fetch(SYMBOL_JSON_URL);
        const data = await response.json();
        symbolJsonData = data;
        return data;
    } catch (error) {
        console.error('Result:', error);
        return [];
    }
}

function getMostFrequentPair(trades) {
    const counts = {};
    let maxCount = 0;
    let topPair = 'BTC';

    trades.forEach(t => {
        if (!t.Pairs) return;
        const clean = cleanPairName(t.Pairs).toUpperCase();
        counts[clean] = (counts[clean] || 0) + 1;
        if (counts[clean] > maxCount) {
            maxCount = counts[clean];
            topPair = clean;
        }
    });
    return topPair;
}

async function updatePairIcon(pairSymbol) {
    if (!symbolJsonData) await loadSymbolJson();
    
    const found = symbolJsonData.find(item => item.symbol?.toUpperCase() === pairSymbol.toUpperCase());
    
    if (found && found.link) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            pairIconImage = img;
            renderImage();
        };
        img.onerror = () => {
            pairIconImage = null; 
            renderImage();
        };
        img.src = found.link.trim();
    } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { pairIconImage = img; renderImage(); };
        img.src = 'Asset/btc.png';
    }
}

function getMostFrequentEdge(trades) {
    const counts = {};
    let maxCount = 0;
    let topEdge = 'No Trade';

    trades.forEach(t => {
        if (t.Method && String(t.Method).trim() !== '') {
            const methodKey = String(t.Method).trim();
            counts[methodKey] = (counts[methodKey] || 0) + 1;
            
            if (counts[methodKey] > maxCount) {
                maxCount = counts[methodKey];
                topEdge = methodKey;
            }
        }
        
        if (t.Behavior && String(t.Behavior).trim() !== '') {
            const behaviorKey = String(t.Behavior).trim();
            counts[behaviorKey] = (counts[behaviorKey] || 0) + 1;
            
            if (counts[behaviorKey] > maxCount) {
                maxCount = counts[behaviorKey];
                topEdge = behaviorKey;
            }
        }
    });
    
    return topEdge;
}

const canvasLoading = document.getElementById('canvasLoading');

function showLoading() {
    if (canvasLoading) {
        canvasLoading.classList.add('active');
        canvasShareContainer.classList.add("loading");
    }
}

function hideLoading() {
    if (canvasLoading) {
        canvasLoading.classList.remove('active');
        canvasShareContainer.classList.remove("loading");
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateDataShare() {
    showLoading();
    
    const tradesPerp = JSON.parse(localStorage.getItem('dbperpetual') || '[]');
    const tradesSpot = JSON.parse(localStorage.getItem('dbspot') || '[]');
    
    let allTrades = [...tradesPerp, ...tradesSpot];

    const now = Date.now();
    const filteredTrades = filterByRangeShare(allTrades, selectedRangeShare);

    const executedTrades = filteredTrades.filter(t => 
        ['Profit', 'Loss', 'Break Even'].includes(t.Result)
    );

    const totalTradeCount = executedTrades.length;

    const winCount = executedTrades.filter(t => t.Result === 'Profit').length;
    const winratePercent = totalTradeCount > 0 ? (winCount / totalTradeCount) * 100 : 0;

    const profitTrades = executedTrades.filter(t => t.Result === 'Profit');
    let avgRR = 0;
    if (profitTrades.length > 0) {
        const totalRR = profitTrades.reduce((sum, t) => sum + (parseFloat(t.RR) || 0), 0);
        avgRR = totalRR / profitTrades.length;
    }

    const mainEdge = getMostFrequentEdge(executedTrades);

    const topPairSymbol = getMostFrequentPair(executedTrades);
    TEXT_CONTENT_SHARE.pairName = topPairSymbol;
    await updatePairIcon(topPairSymbol);

    const allDeposits = [...tradesPerp, ...tradesSpot].filter(t => t.action?.toLowerCase() === 'deposit');

    const totalPnL = executedTrades.reduce((sum, t) => sum + (parseFloat(t.Pnl) || 0), 0);

    let roiPercent = 0;
    if (['24H', '1W', '30D'].includes(selectedRangeShare)) {
        let cutoff = 0;
        if (selectedRangeShare === '24H') cutoff = now - 24 * 60 * 60 * 1000;
        else if (selectedRangeShare === '1W') cutoff = now - 7 * 24 * 60 * 60 * 1000;
        else if (selectedRangeShare === '30D') cutoff = now - 30 * 24 * 60 * 60 * 1000;

        const balanceBefore = calculateBalanceAtTime(allTrades, cutoff - 1);
        roiPercent = balanceBefore !== 0 ? (totalPnL / balanceBefore) * 100 : 0;
    } else {
        const totalDepositAll = allDeposits.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);
        roiPercent = totalDepositAll !== 0 ? (totalPnL / totalDepositAll) * 100 : 0;
    }

    const capitalImpactVolume = executedTrades.reduce((sum, t) => {
        const pnl = parseFloat(t.Pnl) || 0;
        return sum + Math.abs(pnl);
    }, 0);

    const isProfit = totalPnL >= 0;

    TEXT_CONTENT_SHARE.tradeCount = totalTradeCount.toString();
    TEXT_CONTENT_SHARE.winrate = formatPercent(winratePercent).replace('+', '');
    TEXT_CONTENT_SHARE.avgRR = avgRR.toFixed(2);
    TEXT_CONTENT_SHARE.mainEdge = mainEdge;
    
    TEXT_CONTENT_SHARE.volume = '$' + formatUSDShort(capitalImpactVolume);
    TEXT_CONTENT_SHARE.return = formatPercent(roiPercent);
    TEXT_CONTENT_SHARE.toWinLabel = isProfit ? "To Win" : "To Lose";
    TEXT_CONTENT_SHARE.toWin =
    totalPnL < 0
        ? `-$${formatUSDShort(Math.abs(totalPnL))}`
        : `$${formatUSDShort(totalPnL)}`;
    
    TEXT_CONTENT_SHARE.timestamp = getCurrentTimestamp();
    TEXT_CONTENT_SHARE.performanceTitle = getPerformanceTitle(selectedRangeShare);

    renderImage();
    
    await delay(1000);
    
    hideLoading();
}

async function handleRangeChange(range) {
    selectedRangeShare = range;
    await updateDataShare();
}

async function handleShareButtonClick() {
    await updateDataShare();
}

// --- ASSET & CACHE --- //

function getTemplateCache() {
    try {
        const cached = JSON.parse(localStorage.getItem("templateShareCache"));
        if (cached && cached.version === TEMPLATE_SHARE_VERSION) return cached.images;
    } catch (error) { console.error('Result:', error); }
    return null;
}

function setTemplateCache(imagesObj) {
    try {
        localStorage.setItem("templateShareCache", JSON.stringify({ version: TEMPLATE_SHARE_VERSION, images: imagesObj }));
    } catch (error) { console.error('Result:', error); }
}

async function loadAssets() {
    const cached = getTemplateCache();
    
    if (cached && cached[TEMPLATE_URL_SHARE]) {
        templateImageShare = new Image();
        templateImageShare.src = cached[TEMPLATE_URL_SHARE];
    } else {
        templateImageShare = new Image();
        templateImageShare.crossOrigin = "anonymous";
        templateImageShare.src = TEMPLATE_URL_SHARE;
    }

    await new Promise(resolve => {
        if(templateImageShare.complete) resolve();
        else templateImageShare.onload = resolve;
    });

    if (!cached || !cached[TEMPLATE_URL_SHARE]) {
        const reader = new FileReader();
        reader.onload = () => {
            const fullCache = getTemplateCache() || {};
            fullCache[TEMPLATE_URL_SHARE] = reader.result;
            setTemplateCache(fullCache);
        };
        fetch(TEMPLATE_URL_SHARE).then(r => r.blob()).then(b => reader.readAsDataURL(b));
    }
    
    await loadSymbolJson();
}

function getCurrentAvatarPath() {
    return localStorage.getItem('avatar') || '../Asset/User.png';
}

function loadProfileImageShare() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        profileImageShare = img;
        renderImage();
    };
    img.onerror = function() {
        profileImageShare = null;
        renderImage();
    };
    img.src = getCurrentAvatarPath();
}

async function copyImageShare() {
    try {
        const blob = await new Promise(resolve =>
            canvasShare.toBlob(resolve, 'image/png')
        );

        if (!blob) throw new Error("Canvas empty");

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);

        showToast("Image Copied");
    } catch (err) {
        showToast("Error Copied");
    }
}

function downloadImageShare() {
    try {
        const link = document.createElement('a');
        link.download = 'Nexion_Trade_Result.png';
        link.href = canvasShare.toDataURL('image/png');
        link.click();

        showToast("Image Downloaded");
    } catch (err) {
        showToast("Error Download");
    }
}

// ────── MONTHLY DETAIL POPUP TRIGGER ────── //
let selectedMonthlyEntry = null;

function closeMonthlyPopup() {
    const popup = document.querySelector(".popup-monthly");
    const overlay = document.querySelector(".popup-overlay");
    if (!popup || !overlay) return;

    popup.classList.remove("show");
    overlay.classList.remove("show");
    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
}

async function getInitialDeposit() {
    const rawData = await getDBPerpetual();
    const sorted = [...rawData].sort((a, b) => a.date - b.date);
    const firstDeposit = sorted.find(item => item.action === "Deposit");
    return firstDeposit ? firstDeposit.value : 0;
}

async function calculateCumulativeBalanceUpToMonth(targetYear, targetMonth) {
    const rawData = await getDBPerpetual();
    if (!Array.isArray(rawData)) return 0;

    const sorted = [...rawData].sort((a, b) => a.date - b.date);
    const initialDeposit = await getInitialDeposit();
    const firstDeposit = sorted.find(item => item.action === "Deposit");

    let balance = initialDeposit;
    let depositFirstProcessed = false;

    for (const item of sorted) {
        const date = new Date(item.date * 1000);
        const year = date.getFullYear();
        const month = date.getMonth();

        if (year > targetYear || (year === targetYear && month > targetMonth)) {
            break;
        }

        if (item === firstDeposit) {
            continue;
        }

        if (item.Pnl !== undefined && item.Pnl !== null) {
            balance += item.Pnl;
        } else if (item.action === "Deposit") {
            balance += item.value || 0;
        } else if (item.action === "Withdraw") {
            balance -= item.value || 0;
        }
    }

    return balance;
}

async function calculateMonthlyStats(targetYear, targetMonth) {
    try {
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData)) return null;

        const monthlyTrades = rawData.filter(item => {
            if (!item.date) return false;
            const tradeDate = new Date(item.date * 1000);
            return tradeDate.getFullYear() === targetYear && 
                   tradeDate.getMonth() === targetMonth;
        });

        const validTrades = monthlyTrades.filter(t => 
            t.Pnl !== null && t.Pnl !== undefined && t.Result !== 'Missed'
        );

        const profitTrades = validTrades.filter(t => t.Pnl > 0);
        const lossTrades = validTrades.filter(t => t.Pnl < 0);

        const avgProfit = profitTrades.length
            ? parseFloat((profitTrades.reduce((sum, t) => sum + t.Pnl, 0) / profitTrades.length).toFixed(2))
            : 0;

        const avgLoss = lossTrades.length
            ? parseFloat((Math.abs(lossTrades.reduce((sum, t) => sum + t.Pnl, 0)) / lossTrades.length).toFixed(2))
            : 0;

        const rrProfitTrades = profitTrades.filter(t => typeof t.RR === 'number');
        const avgRR = rrProfitTrades.length
            ? parseFloat((rrProfitTrades.reduce((sum, t) => sum + t.RR, 0) / rrProfitTrades.length).toFixed(2))
            : 0;

        let profit = 0, loss = 0, missed = 0, breakEven = 0;

        monthlyTrades.forEach(item => {
            switch (item.Result) {
                case 'Profit': profit++; break;
                case 'Loss': loss++; break;
                case 'Missed': missed++; break;
                case 'Break Even': breakEven++; break;
            }
        });

        const totalTrade = profit + loss + missed + breakEven;
        const totalTradeExecuted = profit + loss;
        const winrate = totalTradeExecuted > 0
            ? ((profit / totalTradeExecuted) * 100).toFixed(2)
            : "0.00";

        const sortedValidTrades = [...validTrades].sort((a, b) => a.date - b.date);
        const maxProfitStreak = calculateMaxStreak(sortedValidTrades, 'Profit');
        const maxLossStreak = calculateMaxStreak(sortedValidTrades, 'Loss');

        const daySet = new Set();
        monthlyTrades.forEach(item => {
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

        const dailyStreak = sortedDays.length > 0 ? currentStreak : 0;

        return {
            avgProfit,
            avgLoss,
            avgRR,
            maxProfitStreak,
            maxLossStreak,
            
            winrate,
            totalTrade,
            profit,
            loss,
            missed,
            breakEven,
            totalTradeExecuted,
            
            totalDailyTrade,
            dailyStreak,
            bestStreak
        };

    } catch (error) {
        console.error('Result:', error);
        return null;
    }
}

function calculateMaxStreak(trades, targetType) {
    let maxStreak = 0;
    let currentStreak = 0;

    for (const trade of trades) {
        if (trade.Result === targetType) {
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else if (trade.Result === 'Loss' || trade.Result === 'Profit') {
            currentStreak = 0;
        }
    }

    return maxStreak;
}

async function updateMonthlyPopupData(monthData) {
    if (!monthData) return;
    
    const cumulativeBalance = await calculateCumulativeBalanceUpToMonth(monthData.year, monthData.month);
    const balanceElement = document.getElementById("balanceValueMonthly");
    if (balanceElement) {
        balanceElement.textContent = formatCurrencyCompact(cumulativeBalance);
    }
    
    const pnlElement = document.getElementById("pnlgainMonthly");
    if (pnlElement) {
        const profitLoss = monthData.profitLoss;

        let prevYear = monthData.year;
        let prevMonth = monthData.month - 1;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear = monthData.year - 1;
        }

        const startingBalance = await calculateCumulativeBalanceUpToMonth(prevYear, prevMonth);

        let returnRate = null;
        if (startingBalance === 0 || startingBalance === null || isNaN(startingBalance)) {
            returnRate = null;
        } else {
            returnRate = (profitLoss / startingBalance) * 100;
        }

        const profitLossFormatted = formatCurrencyCompact(profitLoss);

        let returnRateFormatted = "N/A";
        if (returnRate !== null && !isNaN(returnRate)) {
            const signRR = returnRate >= 0 ? "+" : "";
            returnRateFormatted = `${signRR}${formatPercent(returnRate)}`;
        }

        const sign = profitLoss >= 0 ? "+" : "";
        pnlElement.textContent = `${sign}${profitLossFormatted} (${returnRateFormatted})`;

        pnlElement.className = 'pnl-value-monthly';

        if (profitLoss >= 0) {
            pnlElement.style.color = 'var(--green)';
        } else {
            pnlElement.style.color = 'var(--red)';
        }
    }

    const monthlyStats = await calculateMonthlyStats(monthData.year, monthData.month);
    
    if (monthlyStats) {
        document.getElementById('averageProfitMonthly').textContent = formatUSD(monthlyStats.avgProfit);
        document.getElementById('averageLossMonthly').textContent = formatUSD(monthlyStats.avgLoss);
        document.getElementById('averageRRMonthly').textContent = monthlyStats.avgRR.toFixed(2);
        
        document.getElementById('winrateMonthly').textContent = `${monthlyStats.winrate}%`;
        document.getElementById('alltredeMonthly').textContent = monthlyStats.totalTrade;
        document.getElementById('tradeprofitMonthly').textContent = monthlyStats.profit;
        document.getElementById('tradelossMonthly').textContent = monthlyStats.loss;
        document.getElementById('trademissedMonthly').textContent = monthlyStats.missed;
        document.getElementById('tradebreakevenMonthly').textContent = monthlyStats.breakEven;
        document.getElementById('profitstreakMonthly').textContent = monthlyStats.maxProfitStreak;
        document.getElementById('lossstreakMonthly').textContent = monthlyStats.maxLossStreak;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const popupMonthly = document.querySelector(".popup-monthly");
    const closeBtn = document.getElementById("closeMonthly");
    const overlay = document.querySelector(".popup-overlay");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeMonthlyPopup);
    }
    if (overlay) {
        overlay.addEventListener("click", closeMonthlyPopup);
    }

    const grid = document.getElementById("monthsGrid");
    if (!grid) return;

    grid.addEventListener("click", async (e) => {
        const card = e.target.closest(".month-card");
        if (!card) return;

        const monthNameText = card.querySelector(".month-name")?.textContent?.trim();
        if (!monthNameText) return;

        const parts = monthNameText.split(" ");
        const monthStr = parts[0];
        const year = parseInt(parts[1], 10);

        const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthStr);
        if (monthIndex === -1 || isNaN(year)) {
            return;
        }

        const matchedEntry = monthlyData.find(
            m => m.month === monthIndex && m.year === year
        );

        if (!matchedEntry) {
            return;
        }

        selectedMonthlyEntry = matchedEntry;

        const fullMonthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const titleEl = popupMonthly?.querySelector("h3");
        if (titleEl) {
            const fullMonthName = fullMonthNames[monthIndex] || monthStr;
            titleEl.textContent = `Monthly Report ${fullMonthName}`;
        }

        await updateMonthlyPopupData(matchedEntry);

        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        overlay?.classList.add("show");
        popupMonthly?.classList.add("show");
    });
});

// ────── COIN DETAIL POPUP ────── //
let selectedPairEntry = null;

function closePairsPopup() {
    const popup = document.querySelector(".popup-pairs");
    const overlay = document.querySelector(".popup-overlay");
    if (!popup || !overlay) return;

    popup.classList.remove("show");
    overlay.classList.remove("show");
    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
    selectedPairEntry = null;
}

async function calculatePairStats(symbol) {
    try {
        let rawData = [];

        if (currentPairsMode === "perpetual") {
        rawData = await getDBPerpetual();
        } else {
        rawData = await getDBSpot();
        }

        if (!Array.isArray(rawData)) {
            return null;
        }

        const pairTrades = rawData.filter(trade => {
            if (!trade.Pairs) return false;
            const base = extractBaseSymbol(trade.Pairs);
            return base === symbol;
        });

        if (pairTrades.length === 0) {
            return null;
        }

        const profitTrades = pairTrades.filter(t => t.Result === "Profit");
        const lossTrades = pairTrades.filter(t => t.Result === "Loss");
        const missedTrades = pairTrades.filter(t => t.Result === "Missed");
        const breakEvenTrades = pairTrades.filter(t => t.Result === "Break Even");

        // Total PnL
        const totalPnL = pairTrades.reduce((sum, t) => {
            return sum + (parseFloat(t.Pnl) || 0);
        }, 0);

        // Average Profit & Loss
        const avgProfit = profitTrades.length
            ? parseFloat((profitTrades.reduce((sum, t) => sum + (t.Pnl || 0), 0) / profitTrades.length).toFixed(2))
            : 0;

        const avgLoss = lossTrades.length
            ? parseFloat((Math.abs(lossTrades.reduce((sum, t) => sum + (t.Pnl || 0), 0)) / lossTrades.length).toFixed(2))
            : 0;

        // Average RR
        const rrProfitTrades = profitTrades.filter(t => typeof t.RR === 'number' && !isNaN(t.RR));
        const avgRR = rrProfitTrades.length
            ? parseFloat((rrProfitTrades.reduce((sum, t) => sum + t.RR, 0) / rrProfitTrades.length).toFixed(2))
            : 0;

        // Hitung berdasarkan Method
        const scalping = pairTrades.filter(t => t.Method === "Scalping").length;
        const intraday = pairTrades.filter(t => t.Method === "Intraday").length;
        const swing = pairTrades.filter(t => t.Method === "Swing").length;

        // Hitung berdasarkan Position
        const buy = pairTrades.filter(t => t.Pos === "Long").length;
        const sell = pairTrades.filter(t => t.Pos === "Short").length;

        // Hitung berdasarkan Behavior
        const continuation = pairTrades.filter(t => t.Behavior === "Continuation").length;
        const reversal = pairTrades.filter(t => t.Behavior === "Reversal").length;

        return {
            totalPnL,
            avgProfit,
            avgLoss,
            avgRR,
            allTrade: pairTrades.length,
            profit: profitTrades.length,
            loss: lossTrades.length,
            missed: missedTrades.length,
            breakEven: breakEvenTrades.length,
            scalping,
            intraday,
            swing,
            buy,
            sell,
            continuation,
            reversal
        };
    } catch (error) {
        console.error('Result:', error, symbol);
        return null;
    }
}

function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = value;
    el.style.color = value === 0 ? 'var(--bg-70)' : '';
}

async function updatePairsPopupData(symbol) {
    const stats = await calculatePairStats(symbol);
    
    if (!stats) {
        document.getElementById("pnlPairsAll").textContent = "$0.00";
        document.getElementById("averageProfitPairs").textContent = "$0.00";
        document.getElementById("averageLossPairs").textContent = "$0.00";
        document.getElementById("averageRRPairs").textContent = "0.00";
        document.getElementById("alltradePairs").textContent = "0";
        document.getElementById("tradeprofitPairs").textContent = "0";
        document.getElementById("tradelossPairs").textContent = "0";
        document.getElementById("trademissedPairs").textContent = "0";
        document.getElementById("tradebreakevenPairs").textContent = "0";
        return;
    }

    // Format & isi PnL
    const pnlEl = document.getElementById("pnlPairsAll");
    if (stats.totalPnL >= 0) {
        pnlEl.textContent = `+${formatUSD(stats.totalPnL)}`;
        pnlEl.style.color = 'var(--green)';
    } else {
        pnlEl.textContent = `-${formatUSD(Math.abs(stats.totalPnL))}`;
        pnlEl.style.color = 'var(--red)';
    }
    pnlEl.style.color = stats.totalPnL >= 0 ? 'var(--green)' : 'var(--red)';

    // Average
    document.getElementById("averageProfitPairs").textContent = formatUSD(stats.avgProfit);
    document.getElementById("averageLossPairs").textContent = formatUSD(stats.avgLoss);
    document.getElementById("averageRRPairs").textContent = stats.avgRR.toFixed(2);

    // Statistik
    setStatValue("alltradePairs", stats.allTrade);
    setStatValue("tradeprofitPairs", stats.profit);
    setStatValue("tradelossPairs", stats.loss);
    setStatValue("trademissedPairs", stats.missed);
    setStatValue("tradebreakevenPairs", stats.breakEven);
    setStatValue("scalpingPairs", stats.scalping);
    setStatValue("intradayPairs", stats.intraday);
    setStatValue("swingPairs", stats.swing);


    // Buy/Sell Progress
    const buySellTotal = stats.buy + stats.sell;
    const buyPercent = buySellTotal > 0 ? (stats.buy / buySellTotal) * 100 : 0;
    const bsFill1 = document.querySelectorAll(".subcolumn-stats .bs-fill")[0];
    if (bsFill1) {
        bsFill1.style.width = `${buyPercent}%`;
    }

    // Continuation/Reversal Progress
    const contRevTotal = stats.continuation + stats.reversal;
    const contPercent = contRevTotal > 0 ? (stats.continuation / contRevTotal) * 100 : 0;
    const bsFill2 = document.querySelectorAll(".subcolumn-stats .bs-fill")[1];
    if (bsFill2) {
        bsFill2.style.width = `${contPercent}%`;
    }

    // Position
    document.getElementById("buyPairs").textContent = `Buy ${stats.buy}`;
    document.getElementById("sellPairs").textContent = `Sell ${stats.sell}`;

    // Behavior
    document.getElementById("continuationPairs").textContent = `Continuasion ${stats.continuation}`;
    document.getElementById("reversalPairs").textContent = `Reversal ${stats.reversal}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const pairsBody = document.querySelector(".pairs-body");
    const closeBtn = document.getElementById("closePairs");
    const overlay = document.querySelector(".popup-overlay");

    if (closeBtn) {
        closeBtn.addEventListener("click", closePairsPopup);
    }
    if (overlay) {
        overlay.addEventListener("click", closePairsPopup);
    }

    if (!pairsBody) return;

    pairsBody.addEventListener("click", async (e) => {
        const row = e.target.closest(".pairs-row");
        if (!row) return;

        const pairItem = row.querySelector(".pair-item");
        if (!pairItem) return;

        let pairName = pairItem.textContent.trim();
        pairName = pairName.replace(/[^A-Z0-9]/g, '');

        if (!pairName) {
            return;
        }

        selectedPairEntry = { symbol: pairName };

        const titleEl = document.querySelector(".popup-pairs h3");
        if (titleEl) {
            titleEl.textContent = `${pairName} Pairs Performance`;
        }

        await updatePairsPopupData(pairName);

        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        overlay?.classList.add("show");
        document.querySelector(".popup-pairs")?.classList.add("show");
    });
});

// ────── FEE ANALYSIS POPUP ────── //
document.addEventListener("DOMContentLoaded", () => {
    const popupFeeAnalysis = document.querySelector(".popup-fee-analysis");
    const popupOverlay = document.querySelector(".popup-overlay");
    const btnFeeInfo = document.getElementById("BtnFee");
    const closeFeeAnalysis = document.getElementById("closeFeeAnalysis");

    if (!popupFeeAnalysis || !btnFeeInfo || !closeFeeAnalysis || !popupOverlay) return;

    function triggerFeeChartResize() {
        setTimeout(() => {
            if (typeof resizeFeeCanvas === 'function') {
                resizeFeeCanvas();
            }
        }, 50);
    }

    function openFeeAnalysis() {
        document.querySelectorAll(".popup-container.show").forEach(p => p.classList.remove("show"));
        document.querySelectorAll(".popup-overlay.show").forEach(o => o.classList.remove("show"));
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";

        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay.classList.add("show");
        popupFeeAnalysis.classList.add("show");

        triggerFeeChartResize();
    }

    function closeFeeAnalysisPopup() {
        popupFeeAnalysis.classList.remove("show");
        popupOverlay.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    btnFeeInfo.addEventListener("click", openFeeAnalysis);
    closeFeeAnalysis.addEventListener("click", closeFeeAnalysisPopup);
    popupOverlay.addEventListener("click", (e) => {
        if (popupFeeAnalysis.classList.contains("show")) {
            closeFeeAnalysisPopup();
        }
    });

    popupFeeAnalysis.addEventListener('transitionend', () => {
        if (popupFeeAnalysis.classList.contains('show')) {
            resizeFeeCanvas?.();
        }
    });
});

// switch mode
const feeModeButtons = document.querySelectorAll('.btn-radio.btn-fee');

feeModeButtons.forEach((btn, index) => {
    const modes = ['perpetual', 'spot', 'all'];
    btn.addEventListener('click', () => {
        feeModeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentFeeMode = modes[index];

        loadFeeData(currentFeeMode);
    });
});

const canvasFee = document.getElementById('chartCanvasFee');
const ctxFee = canvasFee.getContext('2d');
const tooltipFee = document.getElementById('tooltip-fee');
const dateLabelFee = document.getElementById('dateLabelFee');

let feeFullData = [];
let feePoints = [];
let feeChartArea = {};
let feeLastPoint = null;
let currentFeeMode = 'perpetual';

function formatFeeCurrency(value) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFeeTime24(date) {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFeeDateShort(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function loadFeeData(mode = 'perpetual') {
    let rawDataPerp = [];
    let rawDataSpot = [];

    try {
        if (mode === 'spot' || mode === 'all') {
            rawDataSpot = await getDBSpot();
        }
        if (mode === 'perpetual' || mode === 'all') {
            rawDataPerp = await getDBPerpetual();
        }

        const combinedRaw = [...rawDataPerp, ...rawDataSpot];

        if (!Array.isArray(combinedRaw) || combinedRaw.length === 0) {
            feeFullData = [];
            drawFeeChart();
            updateFeeTotalDisplay(0);
            return;
        }

        const sorted = combinedRaw
            .filter(t => t.date)
            .sort((a, b) => Number(a.date) - Number(b.date));

        let cumulativeFee = 0;
        const processed = [];

        for (const entry of sorted) {
            const timestampMs = Number(entry.date) * 1000;
            const tradeDate = new Date(timestampMs);

            let feeIni = 0;

            if (entry.hasOwnProperty("Pnl")) {
                const rr = parseFloat(entry.RR);
                const margin = parseFloat(entry.Margin);
                const actualPnl = parseFloat(entry.Pnl);

                if (!isNaN(rr) && !isNaN(margin) && margin > 0 && !isNaN(actualPnl)) {
                    const expectedPnl = rr * margin;
                    if (actualPnl < expectedPnl) {
                        feeIni = expectedPnl - actualPnl;
                    }
                }
            }

            cumulativeFee += feeIni;

            processed.push({
                date: tradeDate,
                fee: parseFloat(cumulativeFee.toFixed(2))
            });
        }

        const firstValidDate = sorted[0]?.date;
        const firstDate = new Date((Number(firstValidDate) || Math.floor(Date.now() / 1000)) * 1000);
        const zeroPointDate = new Date(firstDate.getTime() - 2000);

        feeFullData = [
            { date: zeroPointDate, fee: 0 },
            ...processed
        ];

        const finalFee = feeFullData[feeFullData.length - 1]?.fee || 0;
        updateFeeTotalDisplay(finalFee);

        drawFeeChart();

    } catch (error) {
        console.error('Result:', error);
        feeFullData = [];
        drawFeeChart();
        updateFeeTotalDisplay(0);
    }
}

function updateFeeTotalDisplay(value) {
    const elValueFilterFee = document.getElementById('valueFilterFee');
    if (elValueFilterFee) {
        elValueFilterFee.textContent = formatFeeCurrency(value);
    }
}

function resizeFeeCanvas() {
    const wrapper = canvasFee.parentElement;
    canvasFee.width = wrapper.clientWidth;
    canvasFee.height = wrapper.clientHeight;
    drawFeeChart();
}

function createDiagonalStripePattern(color = 'rgba(163, 163, 163, 0.7)', gap = 12, thickness = 0.5) {
    const tile = document.createElement('canvas');
    const size = gap;
    tile.width = size;
    tile.height = size;

    const ctx = tile.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-1, 1);
    ctx.lineTo(1, -1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size - 1, size + 1);
    ctx.lineTo(size + 1, size - 1);
    ctx.stroke();

    return ctx.createPattern(tile, 'repeat');
}

function drawFeeChart() {
    ctxFee.clearRect(0, 0, canvasFee.width, canvasFee.height);

    if (feeFullData.length === 0) {
        const circlefee = document.getElementById('circlefee');
        if (circlefee) {
            circlefee.style.display = 'none';
        }

        ctxFee.save();
        ctxFee.font = '700 34px Sansation';
        ctxFee.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctxFee.textAlign = 'center';
        ctxFee.textBaseline = 'middle';
        ctxFee.fillText('NEXION TRADE', canvasFee.width / 2, canvasFee.height / 2.1);
        ctxFee.restore();
        return;
    }

    const allFees = feeFullData.map(d => d.fee);
    const minFee = Math.min(...allFees) * 0.9;
    const maxFee = Math.max(...allFees) * 1.1;
    const rangeFee = maxFee - minFee || 1;

    ctxFee.font = '12px Inter';
    const sampleTexts = [
        formatFeeCurrency(minFee),
        formatFeeCurrency(maxFee),
        formatFeeCurrency((minFee + maxFee) / 2)
    ];
    const widestText = sampleTexts.reduce((a, b) =>
        ctxFee.measureText(a).width > ctxFee.measureText(b).width ? a : b
    );
    const dynamicLeftPadding = ctxFee.measureText(widestText).width + 20;

    const padding = { top: 10, right: 20, bottom: 35, left: dynamicLeftPadding };
    feeChartArea = {
        left: padding.left,
        right: canvasFee.width - padding.right,
        top: padding.top,
        bottom: canvasFee.height - padding.bottom,
        width: canvasFee.width - padding.left - padding.right,
        height: canvasFee.height - padding.top - padding.bottom
    };

    // Sumbu Y
    ctxFee.textBaseline = 'alphabetic'; 
    ctxFee.fillStyle = 'rgb(163, 163, 163)';
    ctxFee.textAlign = 'right';
    const ySteps = 7;
    for (let i = 0; i <= ySteps; i++) {
        const value = minFee + (rangeFee * (i / ySteps));
        const y = feeChartArea.bottom - (feeChartArea.height * i / ySteps);
        ctxFee.fillText(formatFeeCurrency(value), feeChartArea.left - 10, y + 4);
    }

    // Sumbu X
    const sortedData = [...feeFullData].sort((a, b) => a.date - b.date);
    const axisStart = new Date(sortedData[0].date);
    const axisEnd = new Date(sortedData[sortedData.length - 1].date);
    const numLabels = 8;
    const totalDuration = axisEnd.getTime() - axisStart.getTime();
    const fullDates = totalDuration === 0
        ? [new Date(axisStart)]
        : Array.from({ length: numLabels }, (_, i) => {
              const ratio = i / (numLabels - 1);
              return new Date(axisStart.getTime() + totalDuration * ratio);
          });

    let lastFee = feeFullData[0]?.fee || 0;
    feePoints = fullDates.map(d => {
        const match = sortedData
            .filter(t => t.date.getTime() <= d.getTime())
            .pop();

        if (match) lastFee = match.fee;

        const normalizedY = (lastFee - minFee) / rangeFee;
        const y = feeChartArea.bottom - (feeChartArea.height * normalizedY);
        const tRatio = totalDuration !== 0 ? (d.getTime() - axisStart.getTime()) / totalDuration : 0;
        const x = feeChartArea.left + tRatio * feeChartArea.width;

        return {
            x,
            y,
            date: d,
            fee: lastFee,
            isData: !!match
        };
    });

    const lineColor = 'rgb(239, 68, 68)';

    const circlefee = document.getElementById('circlefee');
    if (circlefee) {
        circlefee.style.display = 'block';
        circlefee.style.background = lineColor;
        circlefee.style.setProperty('--circlefee-color', lineColor);
        circlefee.style.setProperty('--circlefee-after-color', 'rgba(239, 68, 68, 0.6)');
    }

    ctxFee.beginPath();
    ctxFee.moveTo(feePoints[0].x, feeChartArea.bottom);
    ctxFee.lineTo(feePoints[0].x, feePoints[0].y);

    for (let i = 0; i < feePoints.length - 1; i++) {
        const p0 = feePoints[i - 1] || feePoints[i];
        const p1 = feePoints[i];
        const p2 = feePoints[i + 1];
        const p3 = feePoints[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        ctxFee.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctxFee.lineTo(feePoints[feePoints.length - 1].x, feeChartArea.bottom);
    ctxFee.closePath();

    ctxFee.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctxFee.fill();

    const stripePattern = createDiagonalStripePattern('rgba(255, 203, 203, 0.5)', 12, 0.5);
    ctxFee.fillStyle = stripePattern;
    ctxFee.fill();

    ctxFee.strokeStyle = lineColor;
    ctxFee.lineWidth = 2;
    ctxFee.lineJoin = 'round';
    ctxFee.lineCap = 'round';
    ctxFee.shadowBlur = 0;

    ctxFee.beginPath();
    ctxFee.moveTo(feePoints[0].x, feePoints[0].y);
    for (let i = 0; i < feePoints.length - 1; i++) {
        const p0 = feePoints[i - 1] || feePoints[i];
        const p1 = feePoints[i];
        const p2 = feePoints[i + 1];
        const p3 = feePoints[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        ctxFee.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctxFee.stroke();

    // Sumbu X
    ctxFee.fillStyle = 'rgb(163, 163, 163)';
    ctxFee.font = '11px Inter';
    ctxFee.textAlign = 'center';

    feePoints.forEach((point, i) => {
        let label;
        if (i === 0 || i === feePoints.length - 1) {
            label = formatFeeDateShort(point.date);
        } else {
            const prev = feePoints[i - 1].date;
            if (prev.toDateString() !== point.date.toDateString()) {
                label = formatFeeDateShort(point.date);
            } else {
                label = formatFeeTime24(point.date);
            }
        }
        ctxFee.fillText(label, point.x, feeChartArea.bottom + 20);
    });

    const last = feePoints[feePoints.length - 1];
    if (last && circlefee) {
        circlefee.style.left = `${last.x}px`;
        circlefee.style.top = `${last.y}px`;
    }
}

canvasFee.addEventListener('mousemove', (e) => {
    if (feeFullData.length === 0) {
        canvasFee.style.cursor = 'default';
        return;
    }

    const rect = canvasFee.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const inChart = (
        mouseX >= feeChartArea.left &&
        mouseX <= feeChartArea.right &&
        mouseY >= feeChartArea.top &&
        mouseY <= feeChartArea.bottom
    );

    if (!inChart) {
        canvasFee.style.cursor = 'default';
        tooltipFee.style.display = 'none';
        dateLabelFee.style.display = 'none';
        drawFeeChart();
        feeLastPoint = null;
        return;
    }

    canvasFee.style.cursor = 'crosshair';

    let closestPoint = null;
    let minDist = Infinity;
    feePoints.forEach(p => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < minDist) {
            minDist = dist;
            closestPoint = p;
        }
    });

    if (!closestPoint) return;

    drawFeeChart();

    ctxFee.lineWidth = 1;
    ctxFee.setLineDash([5, 5]);
    ctxFee.beginPath();
    ctxFee.moveTo(closestPoint.x, feeChartArea.top);
    ctxFee.lineTo(closestPoint.x, feeChartArea.bottom);
    ctxFee.stroke();
    ctxFee.setLineDash([]);

    ctxFee.fillStyle = '#fff';
    ctxFee.beginPath();
    ctxFee.arc(closestPoint.x, closestPoint.y, 2, 0, Math.PI * 2);
    ctxFee.fill();

    tooltipFee.style.display = 'block';
    dateLabelFee.style.display = 'block';

    document.getElementById('feeTooltip').textContent = formatFeeCurrency(closestPoint.fee);

    const date = closestPoint.date;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    let h = date.getHours();
    const min = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hh = h.toString().padStart(2, '0');
    tooltipFee.querySelector('.tooltip-date-fee').textContent = `${d}/${m}/${y} ${hh}:${min} ${ampm}`;

    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    dateLabelFee.textContent = `${monthDay} ${time}`;

    feeLastPoint = closestPoint;

    const tooltipX = mouseX + 20;
    const tooltipY = mouseY - 80;
    const tooltipWidth = tooltipFee.offsetWidth;

    let finalX = tooltipX;
    let finalY = tooltipY;

    if (tooltipX + tooltipWidth > feeChartArea.right) {
        finalX = mouseX - tooltipWidth - 20;
    }
    if (tooltipY < feeChartArea.top) {
        finalY = mouseY + 30;
    }

    tooltipFee.style.left = finalX + 'px';
    tooltipFee.style.top = finalY + 'px';

    const labelWidth = dateLabelFee.offsetWidth || 60;
    const labelTop = feeChartArea.bottom + 10;
    const wrapperRect = canvasFee.parentElement.getBoundingClientRect();
    const offsetLeft = rect.left - wrapperRect.left;
    let labelLeft = offsetLeft + closestPoint.x - (labelWidth / 2);
    labelLeft = Math.max(4, Math.min(wrapperRect.width - labelWidth - 4, labelLeft));
    dateLabelFee.style.left = `${labelLeft}px`;
    dateLabelFee.style.top = `${labelTop}px`;
});

canvasFee.addEventListener('mouseleave', () => {
    canvasFee.style.cursor = 'default';
    tooltipFee.style.display = 'none';
    dateLabelFee.style.display = 'none';
    feeLastPoint = null;
    drawFeeChart();
});

window.addEventListener('load', () => {
    loadFeeData(currentFeeMode);
    window.addEventListener('resize', resizeFeeCanvas);
});

// ────── Delete All Data ────── //
document.addEventListener("DOMContentLoaded", () => {
  const deleteAllBtn = document.getElementById("DeleteDataAll");
  if (!deleteAllBtn) return;

  deleteAllBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const confirmed = await ConfirmDeletePerpetual(
      "This action will permanently delete all Perpetual and Spot data. This cannot be undone."
    );

    if (!confirmed) return;

    await DeleteAllData();
  });
});

async function DeleteAllData() {
  const btn = document.getElementById("DeleteDataAll");
  if (btn) btn.classList.add("loading");

  try {
    // --- User Session ---
    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr || !user) throw new Error("User not authenticated");
    const user_id = user.id;

    // --- Delete From Server ---
    const promises = [
      supabaseClient.from("perpetual").delete().eq("user_id", user_id),
      supabaseClient.from("perpetual_transactions").delete().eq("user_id", user_id),
      supabaseClient.from("spot").delete().eq("user_id", user_id),
      supabaseClient.from("spot_transactions").delete().eq("user_id", user_id),
    ];

    const results = await Promise.all(promises);
    for (const { error } of results) {
      if (error) throw error;
    }

    // --- Hapus dari Local Storage ---
    localStorage.removeItem("dbperpetual");
    localStorage.removeItem("dbspot");

    // --- Reset State Global ---
    if (typeof currentEditingTradeNo !== 'undefined') {
      currentEditingTradeNo = null;
    }

    // --- Refresh UI ---
    if (typeof refreshDBPerpetualCache === "function") refreshDBPerpetualCache();
    if (typeof updateAllUI === "function") await updateAllUI();
    if (typeof restartSOP === "function") restartSOP();
    if (typeof CancelEditPerpetual === "function") CancelEditPerpetual();

    const activePopup = document.querySelector(".popup.active");
    if (activePopup) {
      activePopup.classList.remove("active");
    }

    location.reload()

  } catch (error) {
    console.error('Result:', error);
  } finally {
    if (btn) btn.classList.remove("loading");
  }
}

// ────── Toast ────── //
const MAX_TOAST = 3;
let toastStack = [];

function showToast(message, duration = 2000) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    toastStack.unshift(toast);

    if (toastStack.length > MAX_TOAST) {
        const oldToast = toastStack.pop();
        oldToast.remove();
    }

    updateToastPosition();

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
            toastStack = toastStack.filter(t => t !== toast);
            updateToastPosition();
        }, 250);
    }, duration);
}

function updateToastPosition() {
    toastStack.forEach((toast, index) => {
        toast.style.top = `${70 + index * 52}px`;
    });
}

window.showToast = showToast;
