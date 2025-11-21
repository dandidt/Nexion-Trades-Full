// Global state
let isEditMode = false;
let currentEditingTradeNo = null;
const dropdownData = {};

// Konversi Unix timestamp WIB
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

// ======================= POPUP & DROPDOWN SETUP ======================= //
function closeAllPopups() {
    document.querySelector(".popup-add")?.classList.remove("show");
    document.querySelector(".popup-edit")?.classList.remove("show");
    document.querySelector(".popup-caculate")?.classList.remove("show");
    document.querySelector(".popup-overlay")?.classList.remove("show");
    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupAdd = document.querySelector(".popup-add");
    const popupEditTrade = document.querySelector(".popup-edit-trade");
    const popupEditTransfer = document.querySelector(".popup-edit-transfer");
    const popupCaculate = document.querySelector(".popup-caculate");

    const btnAdd = document.getElementById("btnAdd");
    const btnEdit = document.getElementById("btnEdit");
    const btnCaculate = document.getElementById("btnCaculate");
    const tableBody = document.querySelector(".tabel-trade tbody");

    function hasAnyPopupOpen() {
        return (
            popupAdd?.classList.contains("show") ||
            popupEditTrade?.classList.contains("show") ||
            popupEditTransfer?.classList.contains("show") ||
            popupCaculate?.classList.contains("show")
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
        [popupAdd, popupEditTrade, popupEditTransfer, popupCaculate].forEach(p => p?.classList.remove("show"));
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    // ------ Trade ------ //
    btnAdd?.addEventListener("click", () => {
        closeAllPopups();
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupAdd?.classList.add("show");

        const dateInput = document.getElementById("dateTransfer");
        if (dateInput) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, "0");
            const d = String(now.getDate()).padStart(2, "0");
            const h = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            dateInput.value = `${y}-${m}-${d}T${h}:${min}`;
        }
    });

    // ------ Transfer ------ //
    btnAdd?.addEventListener("click", () => {
        closeAllPopups();
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupAdd?.classList.add("show");

        const dateInput = document.getElementById("dateTrade");
        if (dateInput) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, "0");
            const d = String(now.getDate()).padStart(2, "0");
            const h = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            dateInput.value = `${y}-${m}-${d}T${h}:${min}`;
        }
    });

    // ------ Calculate ------ //
    btnCaculate?.addEventListener("click", () => {
        closeAllPopups();
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupCaculate?.classList.add("show");
    });

    // ------ Edit Mode ------ //
    btnEdit?.addEventListener("click", () => {
        isEditMode = !isEditMode;
        document.querySelectorAll(".tabel-trade tbody tr").forEach(row => {
            row.style.cursor = isEditMode ? "pointer" : "default";
            row.classList.toggle("editable", isEditMode);
        });
        btnEdit.classList.toggle("active", isEditMode);
    });

    tableBody?.addEventListener("click", async (e) => {
        if (!isEditMode) return;
        const row = e.target.closest("tr");
        if (!row) return;

        const tradeNumber = parseInt(row.querySelector(".no")?.textContent);
        if (!tradeNumber) return;

        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const tradeData = dbTrade.find(t => t.tradeNumber === tradeNumber);
        if (!tradeData) return;

        if (tradeData.action === "Deposit" || tradeData.action === "Withdraw") {
            openEditTransferPopup(tradeData);
        } else {
            openEditTradePopup(tradeData);
        }
    });

    // ------ Overlay ------ //
    popupOverlay?.addEventListener("click", closeAllPopups);

    // ------ Cancel ------ //
    document.getElementById("closeAdd")?.addEventListener("click", () => closePopup(popupAdd));
    document.getElementById("closeEditTrade")?.addEventListener("click", () => closePopup(popupEditTrade));
    document.getElementById("closeEditTransfer")?.addEventListener("click", () => closePopup(popupEditTransfer));
    document.getElementById("closeCaculate")?.addEventListener("click", () => closePopup(popupCaculate));

    // ------ Custom Dropdowns ------ //
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const optionElements = dropdown.querySelectorAll('.dropdown-option');
        const name = dropdown.getAttribute('data-dropdown');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();

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
                const selectedSpan = selected.querySelector('span');

                if (value === 'clear') {
                    selectedSpan.textContent = 'Method';
                    selectedSpan.classList.add('placeholder');

                    if (window.dropdownData) delete window.dropdownData[name];
                } else {
                    selectedSpan.textContent = opt.textContent;
                    selectedSpan.classList.remove('placeholder');

                    window.dropdownData = window.dropdownData || {};
                    window.dropdownData[name] = value;
                }

                optionElements.forEach(o => o.classList.remove('selected'));
                if (value !== 'clear') opt.classList.add('selected');

                options.classList.remove('show');
                selected.classList.remove('active');
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-options.show').forEach(o => o.classList.remove('show'));
        document.querySelectorAll('.dropdown-selected.active').forEach(s => s.classList.remove('active'));
    });


    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-options').forEach(o => o.classList.remove('show'));
    });
});

// ======================= Serch Data ======================= //
function fillEditFormTrade(trade) {
    document.getElementById("edit-date-trade").value = unixToWIBDatetimeLocal(trade.date);
    document.getElementById("edit-pairs").value = trade.Pairs || "";
    document.getElementById("edit-rr").value = trade.RR || "";
    document.getElementById("edit-margin").value = trade.Margin || "";
    document.getElementById("edit-pnl").value = trade.Pnl || "";
    document.getElementById("edit-causes").value = trade.Causes || "";
    document.getElementById("edit-bias-url").value = trade.Files?.Bias || "";
    document.getElementById("edit-execution-url").value = trade.Files?.Last || "";

    setDropdownValue("edit-method", trade.Method);
    setDropdownValue("edit-behavior", trade.Behavior);
    setDropdownValue("edit-psychology", trade.Psychology);
    setDropdownValue("edit-class", trade.Class);
    const posVal = trade.Pos === "B" ? "Long" : trade.Pos === "S" ? "Short" : "";
    setDropdownValue("edit-position", posVal);
    setDropdownValue("edit-result", trade.Result);
    setDropdownValue("edit-timeframe", trade.Confluance?.TimeFrame || "");
    setDropdownValue("edit-entry", trade.Confluance?.Entry || "");

    currentEditingTradeNo = trade.tradeNumber;
}

function fillEditFormTransfer(trade) {
    document.getElementById("edit-date-financial").value = unixToWIBDatetimeLocal(trade.date);
    setDropdownValue("edit-action", trade.action);
    document.getElementById("edit-value").value = Math.abs(trade.value) || "";

    currentEditingTradeNo = trade.tradeNumber;
}

// ======================= DROPDOWN ======================= //
function setDropdownValue(dropdownName, value) {
    const dropdown = document.querySelector(`.custom-dropdown[data-dropdown="${dropdownName}"]`);
    if (!dropdown) return;

    const selectedSpan = dropdown.querySelector(".dropdown-selected span");
    const options = dropdown.querySelectorAll(".dropdown-option");

    options.forEach(opt => opt.classList.remove("selected"));

    const matched = Array.from(options).find(opt => opt.dataset.value === value);
    if (matched) {
        matched.classList.add("selected");
        selectedSpan.textContent = matched.textContent;
        selectedSpan.classList.remove("placeholder");
    } else {
        selectedSpan.textContent = selectedSpan.getAttribute("data-placeholder") || "Select";
        selectedSpan.classList.add("placeholder");
    }
}

// ------ HELPER FUNCTIONS ------ //
function getDropdownValue(dropdownName) {
    const dropdown = document.querySelector(`.custom-dropdown[data-dropdown="${dropdownName}"]`);
    if (!dropdown) {
        console.warn(`[getDropdownValue] Dropdown dengan name "${dropdownName}" tidak ditemukan.`);
        return null;
    }
    const selectedOption = dropdown.querySelector('.dropdown-option.selected');
    if (selectedOption) {
        return selectedOption.getAttribute('data-value');
    } else {
        console.warn(`[getDropdownValue] Tidak ada opsi yang dipilih untuk "${dropdownName}".`);
        return null;
    }
}

// ------ Number Trade Add ------ //
function getNextLocalIds() {
    const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];

    const lastId = dbTrade.length > 0
        ? Math.max(...dbTrade.map(t => t.id || 0))
        : 0;
    const newId = lastId + 1;

    const lastTradeNumber = dbTrade.length > 0
        ? dbTrade[dbTrade.length - 1].tradeNumber
        : 0;
    const nextTradeNumber = lastTradeNumber + 1;

    return { newId, nextTradeNumber };
}

// ======================= POPUP ADD ======================= //
//  BTN RADIO ADD  //
document.querySelectorAll('.btn-radio-add').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-radio-add').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const formTrade = document.getElementById('addDataTrade');
        const formDW = document.getElementById('addDataTransfer');
        const btnTrade = document.getElementById('addTrade');
        const btnDW = document.getElementById('addTransfer');

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

//  ADD TRADE  //
async function handleAddTrade() {
    const btn = document.getElementById("addTrade");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        
        const user_id = user.id;

        // --- Load local ---
        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];

        const { newId, nextTradeNumber } = getNextLocalIds();

        // --- Date ---
        const dateInputValue = document.getElementById("dateTrade").value;
        const correctedDate = new Date(dateInputValue);

        // --- Dropdown values ---
        const methodValue = getDropdownValue("method");
        const behaviorValue = getDropdownValue("behavior");
        const psychologyValue = getDropdownValue("psychology");
        const classValue = getDropdownValue("class");
        const positionValue = getDropdownValue("position");
        const entryValue = getDropdownValue("entry");
        const timeframeValue = getDropdownValue("timeframe");

        // --- Server --- 
        const serverData = {
            id: newId,
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: document.getElementById("pairs").value.trim(),
            method: methodValue,
            entry: entryValue || "",
            timeframe: timeframeValue || "",
            rr: parseFloat(document.getElementById("rr").value) || 0,
            behavior: behaviorValue,
            causes: document.getElementById("causes").value.trim(),
            psychology: psychologyValue,
            class: classValue,
            bias: document.getElementById("bias-url").value.trim(),
            last: document.getElementById("execution-url").value.trim(),
            pos:
                positionValue === "Long" ? "B" :
                positionValue === "Short" ? "S" : "",
            margin: parseFloat(document.getElementById("margin").value) || 0,
            result: getDropdownValue("result") || "",
            pnl: parseFloat(document.getElementById("pnl").value) || 0
        };

        const { data: insertData, error: insertErr } = await supabaseClient
            .from("trades")
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
                Bias: serverData.bias,
                Last: serverData.last
            },
            Pos: serverData.pos,
            Margin: serverData.margin,
            Result: serverData.result,
            Pnl: serverData.pnl
        };

        dbTrade.push(localData);
        localStorage.setItem("dbtrade", JSON.stringify(dbTrade));

        // Update UI & Data
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        document.querySelectorAll("#addDataTrade input, #addDataTrade textarea")
            .forEach(i => i.value = "");

    } catch (err) {
        console.error("❌ Error:", err);
    }
    finally {
        btn.classList.remove("loading");
    }
}

//  ADD TRANSFER  //
async function handleAddTransfer() {
    const btn = document.getElementById("addTransfer");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        // --- ID lokal ---
        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const lastId = dbTrade.length > 0
            ? Math.max(...dbTrade.map(t => t.id || 0))
            : 0;
        const newId = lastId + 1;

        const lastTradeNumber = dbTrade.length > 0
            ? dbTrade[dbTrade.length - 1].tradeNumber
            : 0;
        const nextTradeNumber = lastTradeNumber + 1;

        // --- Date ---
        const dateInputValue = document.getElementById("dateTransfer").value;
        const correctedDate = new Date(dateInputValue);

        // --- Action & Value ---
        const selectedActionEl = document.querySelector('[data-dropdown="transfer"] .dropdown-selected span');
        const selectedAction = selectedActionEl?.innerText.trim();
        const valueInput = parseFloat(document.getElementById("valueTransfer").value);

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
            .from("transactions")
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

        dbTrade.push(localData);
        localStorage.setItem("dbtrade", JSON.stringify(dbTrade));

        // --- Refresh ---
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        document.getElementById("dateTransfer").value = "";
        document.getElementById("valueTransfer").value = "";
        document.querySelectorAll("#addDataTransfer .custom-dropdown .dropdown-selected span")
            .forEach(el => {
                el.textContent = "Select option";
                el.classList.add("placeholder");
            });

    } catch (err) {
        console.error("❌ Gagal menambahkan transfer:", err);
    } finally {
        btn.classList.remove("loading");
    }
}

// ======================= POPUP EDIT ======================= //
//  POPUP TRADE  //
function openEditTradePopup(trade) {
    closeAllPopups();

    const popup = document.querySelector(".popup-edit-trade");
    const overlay = document.querySelector(".popup-overlay");

    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => fillEditFormTrade(trade), 50);
}

//  POPUP TRANSFER  //
function openEditTransferPopup(trade) {
    closeAllPopups();

    const popup = document.querySelector(".popup-edit-transfer");
    const overlay = document.querySelector(".popup-overlay");

    overlay.classList.add("show");
    popup.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";

    setTimeout(() => fillEditFormTransfer(trade), 50);
}

//  EDIT TRADE  //
async function handleSaveEditTrade() {
    const btn = document.getElementById("updateTrade");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-edit-trade .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        // --- Id lokal ---
        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const item = dbTrade.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Trade tidak ditemukan di cache lokal!");
        
        const recordId = item.id;

        // --- Date ---
        const dateInputValue = getVal("edit-date-trade");
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
        const correctedDate = new Date(dateInputValue);

        // --- Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: getVal("edit-pairs"),
            method: getDropdown("edit-method"),
            entry: getDropdown("edit-entry"),
            timeframe: getDropdown("edit-timeframe"),
            rr: parseFloat(getVal("edit-rr")) || 0,
            behavior: getDropdown("edit-behavior"),
            causes: getVal("edit-causes"),
            psychology: getDropdown("edit-psychology"),
            class: getDropdown("edit-class"),
            bias: getVal("edit-bias-url"),
            last: getVal("edit-execution-url"),
            pos: getDropdown("edit-position") === "Long" ? "B" :
                getDropdown("edit-position") === "Short" ? "S" : "",
            margin: parseFloat(getVal("edit-margin")) || 0,
            result: getDropdown("edit-result"),
            pnl: parseFloat(getVal("edit-pnl")) || 0
        };

        const { error: updateErr } = await supabaseClient
            .from("trades")
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
                Bias: serverUpdate.bias,
                Last: serverUpdate.last
            },
            Pos: serverUpdate.pos,
            Margin: serverUpdate.margin,
            Result: serverUpdate.result,
            Pnl: serverUpdate.pnl
        };

        const idx = dbTrade.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbTrade[idx] = updatedLocal;
            localStorage.setItem("dbtrade", JSON.stringify(dbTrade));
        }
        
        // --- Refresh ---
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();
        handleCancelEdit();

        document.getElementById("dateTransfer").value = "";
        document.getElementById("valueTransfer").value = "";
        document.querySelectorAll("#addDataTransfer .custom-dropdown .dropdown-selected span")
            .forEach(el => {
                el.textContent = "Select option";
                el.classList.add("placeholder");
            });

    } catch (err) {
        console.error("❌ Error update trade:", err);
        alert("Gagal memperbarui trade:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

//  EDIT TRANSFER  //
async function handleSaveEditTransfer() {
    const btn = document.getElementById("updateTransfer");
    btn.classList.add("loading");

    try {
        // --- User Session ---
        const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
        if (authErr || !user) throw new Error("User tidak login!");
        const user_id = user.id;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
        const getDropdown = (name) =>
            document.querySelector(`.popup-edit-transfer .custom-dropdown[data-dropdown="${name}"] .dropdown-option.selected`)
                ?.getAttribute("data-value") || "";

        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const item = dbTrade.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!item) throw new Error("Transfer tidak ditemukan di cache lokal!");
        
        const recordId = item.id;

        const dateInputValue = getVal("edit-date-financial");
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
        const correctedDate = new Date(dateInputValue);

        const action = getDropdownValue("edit-action");
        if (!action || !["Deposit", "Withdraw"].includes(action)) {
            throw new Error("Pilih action yang valid (Deposit/Withdraw)!");
        }
        let value = parseFloat(getVal("edit-value"));
        if (isNaN(value) || value === 0) throw new Error("Nilai harus valid dan tidak nol!");
        value = action === "Withdraw" ? -Math.abs(value) : Math.abs(value);

        // --- Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            action: action,
            value: value
        };

        const { error: updateErr } = await supabaseClient
            .from("transactions")
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

        const idx = dbTrade.findIndex(t => t.id === recordId);
        if (idx !== -1) {
            dbTrade[idx] = updatedLocal;
            localStorage.setItem("dbtrade", JSON.stringify(dbTrade));
        }

        // --- Refresh ---
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();
        handleCancelEdit();

        document.getElementById("dateTransfer").value = "";
        document.getElementById("valueTransfer").value = "";
        document.querySelectorAll("#addDataTransfer .custom-dropdown .dropdown-selected span")
            .forEach(el => {
                el.textContent = "Select option";
                el.classList.add("placeholder");
            });

    } catch (err) {
        console.error("❌ Error update transfer:", err);
        alert("Gagal memperbarui transfer:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

//  CANCLE EDIT  //
function handleCancelEdit() {
    try {
        currentEditingTradeNo = null;

        const popupEditTrade = document.querySelector(".popup-edit-trade");
        const popupEditTransfer = document.querySelector(".popup-edit-transfer");
        const overlay = document.querySelector(".popup-overlay");

        [popupEditTrade, popupEditTransfer].forEach(p => p?.classList.remove("show"));
        overlay?.classList.remove("show");

        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";

        document.querySelectorAll(".btn-main.loading, .btn-delete.loading").forEach(b => b.classList.remove("loading"));

        [popupEditTrade, popupEditTransfer].forEach(popup => {
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

        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        if (typeof renderTradingTable === "function") {
            renderTradingTable(dbTrade);
        }

        console.log("[UI] Edit popup closed & state reset");
    } catch (err) {
        console.error("handleCancelEdit error:", err);
    }
}

// POPUP CONFIRMASI DELETE //
function showConfirmPopup(message) {
    return new Promise((resolve) => {
        const popup = document.getElementById("confirmPopup");
        const msg = document.getElementById("confirmMessage");
        const yes = document.getElementById("confirmYes");
        const no = document.getElementById("confirmNo");

        msg.textContent = message;

        popup.style.zIndex = "99999";

        popup.classList.remove("hidden");

        popup.offsetHeight;

        const cleanup = (result) => {
            popup.style.animation = "fadeOut 0.2s ease-out";

            setTimeout(() => {
                popup.classList.add("hidden");
                popup.style.animation = "";
                yes.removeEventListener("click", onYes);
                no.removeEventListener("click", onNo);
                document.removeEventListener("keydown", onEscKey);
                resolve(result);
            }, 200);
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
            if (e.key === "Escape") {
                cleanup(false);
            }
        };

        yes.addEventListener("click", onYes);
        no.addEventListener("click", onNo);
        document.addEventListener("keydown", onEscKey);
    });
}

//  DELETE TRADE  //
async function handleDeleteTrade() {
    const btn = document.getElementById("deleteTrade");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada trade yang dipilih untuk dihapus!");
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await showConfirmPopup(`Delete Trade #${currentEditingTradeNo}?`);
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
        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const itemToDelete = dbTrade.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Trade tidak ditemukan di cache lokal!");

        const recordId = itemToDelete.id;

        // --- Server ---
        const { error: deleteErr } = await supabaseClient
            .from("trades")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        // --- Local ---
        const newDb = dbTrade.filter(t => t.id !== recordId);
        localStorage.setItem("dbtrade", JSON.stringify(newDb));

        // --- Refresh UI ---
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        handleCancelEdit();

    } catch (err) {
        console.error("❌ Gagal menghapus trade:", err);
        alert("Gagal menghapus trade:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

//  DELETE TRANSFER  //
async function handleDeleteTransfer() {

    const btn = document.getElementById("deleteTransfer");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada transfer yang dipilih untuk dihapus!");
        btn.classList.remove("loading");
        return;
    }

    const confirmDelete = await showConfirmPopup(`Delete Transfer #${currentEditingTradeNo}?`);
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
        const dbTrade = JSON.parse(localStorage.getItem("dbtrade")) || [];
        const itemToDelete = dbTrade.find(t => t.tradeNumber === currentEditingTradeNo);
        if (!itemToDelete) throw new Error("Transfer tidak ditemukan di cache lokal!");

        const recordId = itemToDelete.id;

        // --- Server ---
        const { error: deleteErr } = await supabaseClient
            .from("transactions")
            .delete()
            .eq("id", recordId)
            .eq("user_id", user_id);

        if (deleteErr) throw deleteErr;

        // --- Local ---
        const newDb = dbTrade.filter(t => t.id !== recordId);
        localStorage.setItem("dbtrade", JSON.stringify(newDb));

        // --- Refresh UI ---
        refreshDBCache();
        if (typeof updateAllUI === "function") await updateAllUI();
        restartSOP();
        handleCancelEdit();

    } catch (err) {
        console.error("❌ Gagal menghapus transfer:", err);
        alert("Gagal menghapus transfer:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}
// ======================= AUTO CALC  ======================= //
document.getElementById("btnAuto")?.addEventListener("click", () => {
    try {
            window.dropdownData = window.dropdownData || {};
            const resultValue = window.dropdownData["edit-result"];

            if (!resultValue || !["Profit", "Loss"].includes(resultValue)) {
                return;
            }

            const dbtrade = JSON.parse(localStorage.getItem("dbtrade") || "[]");
            const setting = JSON.parse(localStorage.getItem("setting") || "{}");
            const calc = JSON.parse(localStorage.getItem("calculate") || "{}");

            const rrInput = document.getElementById("edit-rr");
            const rr = parseFloat(rrInput?.value || "0");

            const risk = parseFloat(setting.risk) || 0;
            const feePercent = parseFloat(setting.fee) || 0;
            const fee = feePercent / 100;
            const leverage = parseFloat(calc.leverage) || 1;
            const riskFactor = parseFloat(setting.riskFactor) || 1;

            // === Hitung total balance ===
            const totalPNL = dbtrade.reduce((sum, item) => sum + (parseFloat(item.Pnl ?? item.pnl ?? 0) || 0), 0);
            const totalDeposit = dbtrade.reduce((sum, item) => item.action?.toLowerCase() === "deposit" ? sum + (parseFloat(item.value ?? 0) || 0) : sum, 0);
            const finalBalance = totalPNL + totalDeposit;
            const margin = finalBalance * (risk / 100) * riskFactor;
            const positionSize = margin * leverage;
            const feeValue = positionSize * fee * 2;

            let pnlFinal = 0;
            let rrUsed = rr;

            if (resultValue === "Profit") {
            if (isNaN(rr) || rr <= 0) {
                return;
            }
            pnlFinal = margin * rrUsed - feeValue;
            } else if (resultValue === "Loss") {
                rrUsed = -1;
                pnlFinal = -(margin + feeValue);
            }

            // === Update ke input ===
            document.getElementById("edit-margin").value = margin.toFixed(2);
            document.getElementById("edit-pnl").value = pnlFinal.toFixed(2);
            document.getElementById("edit-rr").value = rrUsed.toFixed(2);

        } catch (err) {
            console.error("❌ Auto calc error:", err);
        }
});

// ======================= Popup SOP  ======================= //
document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupSop = document.querySelector(".popup-sop");
    const btnSopTrading = document.getElementById("sopTrading");

    function closePopupSop() {
        popupSop?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    function openPopupSop() {
        closePopupSop(); 
        
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupOverlay?.classList.add("show");
        popupSop?.classList.add("show");
    }

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
        maxDD: 10
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
    const raw = localStorage.getItem('dbtrade');
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
    
    // Update display rules
    document.getElementById('maxWinDisplay').textContent = `${maxWin}x`;
    document.getElementById('maxLossDisplay').textContent = `${maxLoss}x`;
    document.getElementById('maxEntryDisplay').textContent = `${maxEntry}x`;
    document.getElementById('maxDDDisplay').textContent = `${maxDD}%`;
    
    // Update counts
    document.getElementById('winCount').textContent = `${wins}/${maxWin}`;
    document.getElementById('lossCount').textContent = `${losses}/${maxLoss}`;
    document.getElementById('entryCount').textContent = `${entries}/${maxEntry}`;
    document.getElementById('ddCount').textContent = `${drawdown}%`;
    
    // Update progress bars
    const winBar = document.getElementById('winBar');
    const lossBar = document.getElementById('lossBar');
    const entryBar = document.getElementById('entryBar');
    const ddBar = document.getElementById('ddBar');
    
    winBar.style.width = `${(wins/maxWin)*100}%`;
    lossBar.style.width = `${(losses/maxLoss)*100}%`;
    entryBar.style.width = `${(entries/maxEntry)*100}%`;
    ddBar.style.width = `${(drawdown/maxDD)*100}%`;
    
    // Set colors
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
    
    // Update info cards
    const statusEntry = document.getElementById('statusEntry');
    const statusTrading = document.getElementById('statusTrading');
    const statusWin = document.getElementById('statusWin');
    const statusLoss = document.getElementById('statusLoss');
    
    const canTrade = wins < maxWin && losses < maxLoss && entries < maxEntry && drawdown < maxDD;
    const canEntry = entries < maxEntry && canTrade;
    
    // Entry status
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
    
    // Trading status
    if (!canTrade) {
        statusTrading.className = 'info-card danger';
        statusTrading.querySelector('.info-value').textContent = 'STOPPED';
        statusTrading.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M288-444h384v-72H288v72ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>';
    } else if (wins >= maxWin - 1 || losses >= maxLoss - 1 || entries >= maxEntry - 1) {
        statusTrading.className = 'info-card warning';
        statusTrading.querySelector('.info-value').textContent = 'CAUTION';
        statusTrading.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M341-144 144-342v-277l197-197h278l197 197v278L618-144H341Zm32-179 107-106 107 106 50-50-106-107 106-107-50-50-107 106-107-106-50 50 106 107-106 107 50 50Zm-2 107h218l155-155v-218L588-744H371L216-589v218l155 155Zm109-264Z"/></svg>';
    } else {
        statusTrading.className = 'info-card active';
        statusTrading.querySelector('.info-value').textContent = 'ACTIVE';
        statusTrading.querySelector('.info-icon').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="M444-144v-80q-51-11-87.5-46T305-357l74-30q8 36 40.5 64.5T487-294q39 0 64-20t25-52q0-30-22.5-50T474-456q-78-28-114-61.5T324-604q0-50 32.5-86t87.5-47v-79h72v79q72 12 96.5 55t25.5 45l-70 29q-8-26-32-43t-53-17q-35 0-58 18t-23 44q0 26 25 44.5t93 41.5q70 23 102 60t32 94q0 57-37 96t-101 49v77h-72Z"/></svg>';
    }
    
    // Win status
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
    
    // Loss status
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
}

document.querySelectorAll('.editable').forEach(el => {
    el.addEventListener('click', function() {
        const ruleName = this.getAttribute('data-rule');
        const currentValue = sopRules[ruleName];
        const label = this.parentElement.querySelector('.rule-label').textContent;
        
        const newValue = prompt(`Edit ${label}\nMasukkan nilai baru:`, currentValue);
        
        if (newValue !== null && !isNaN(newValue) && newValue > 0) {
            sopRules[ruleName] = parseInt(newValue);
            saveSOP(sopRules);
            updateUI();
        }
    });
});

updateUI();

function restartSOP() {
    sopRules = loadSOP();

    const todaySop = getTodaySOPData();

    Object.assign(tradingDataSop, todaySop);

    updateUI();

    console.log('🔄 SOP UI Restarted:', tradingDataSop);
}

// ======================= Edit Profile ======================= //
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
                alert("Username tidak valid! Harus 3–20 huruf, tanpa angka/spasi.");
                return;
            }
            shouldUpdate = true;
        }

        if (isUploadingNewImage) {
            shouldUpdate = true;

            localStorage.setItem('avatar', currentPreviewSrc);

            if (oldAvatar) {
                await supabaseClient.storage
                    .from('avatars')
                    .remove([oldAvatar])
                    .catch(err => console.warn("Gagal hapus avatar lama:", err));
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

    } catch (err) {
        console.error("❌ Error:", err);
        alert("Gagal menyimpan: " + err.message);
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

// ======================= POPUP SHARE ======================= //
document.addEventListener("DOMContentLoaded", () => {
    const popupOverlay = document.querySelector(".popup-overlay");
    const popupShare = document.querySelector(".popup-share");
    const btnShare = document.getElementById("btnShare");

    function hasAnyPopupOpen() {
        return popupShare?.classList.contains("show");
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
        popupShare?.classList.remove("show");
        popupOverlay?.classList.remove("show");
        document.body.classList.remove("popup-open");
        document.body.style.overflow = "";
    }

    btnShare.addEventListener("click", async () => {
        try {
            const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();

            if (authErr || !user) {
                TEXT_CONTENT_SHARE.username = 'User';
            } else {
                const { data: profile, error: profileErr } = await supabaseClient
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();

                TEXT_CONTENT_SHARE.username = profile?.username || 'User';
            }

            updateDataShare();

            const currentAvatar = getCurrentAvatarPath();
            profileImageShare = null;

            closeAllPopups();
            document.body.classList.add("popup-open");
            document.body.style.overflow = "hidden";
            popupOverlay?.classList.add("show");
            popupShare?.classList.add("show");

            const img = new Image();
            img.onload = () => {
                profileImageShare = img;
                drawCanvasShare();
            };
            img.onerror = () => {
                profileImageShare = null;
                drawCanvasShare();
            };
            img.src = currentAvatar;

        } catch (err) {
            console.error("Error saat ambil user:", err);
            TEXT_CONTENT_SHARE.username = 'User';

            const currentAvatar = getCurrentAvatarPath();
            profileImageShare = null;

            closeAllPopups();
            document.body.classList.add("popup-open");
            document.body.style.overflow = "hidden";
            popupOverlay?.classList.add("show");
            popupShare?.classList.add("show");

            const img = new Image();
            img.onload = () => {
                profileImageShare = img;
                drawCanvasShare();
            };
            img.onerror = () => {
                profileImageShare = null;
                drawCanvasShare();
            };
            img.src = currentAvatar;
        }
    });

    popupOverlay?.addEventListener("click", closeAllPopups);
    document.getElementById("closeShare")?.addEventListener("click", () => closePopup(popupShare));
});

// EVENT UNTUK TOMBOL RANGE
document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.share-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRangeShare = btn.textContent.trim();
        updateDataShare();
        drawCanvasShare();
    });
});

const canvasShare = document.getElementById('canvasShare');
const ctxShare = canvasShare.getContext('2d');
let templateImageShare = null;
let profileImageShare = null;

// TEMPLATE SWITCHER
const TEMPLATE_LIST_SHARE = [
    'Asset/Card-Default.png',
    'Asset/Card-Loss.png',
    'Asset/Card-Gold.png'
];

let currentTemplateIndexShare = 0;

function getCurrentAvatarPath() {
    return localStorage.getItem('avatar') || 'Asset/dhanntara.jpg';
}

const TEXT_CONTENT_SHARE = {
    title: 'ALL-Time Realized',
    profit: '$0.00',
    persentase: '+0.00%',
    divestasi: '$0.00',
    trade: '0',
    winrate: '0.00%',
    invested: '$0.00',
    username: 'Dhanntara',
    timestamp: getCurrentTimestamp()
};

const TEXT_POSITIONS_SHARE = {
    title: [190, 232],
    profit: [430, 545],
    persentase: [175, 425],
    divestasi: [652, 697],
    trade: [208, 830],
    winrate: [584, 830],
    invested: [278, 697],
    username: [1553, 120],
    profilePhoto: [1500, 108],
    timestamp: [1560, 168]
};

// STYLE TEKS
const STYLE_TITLE_SHARE = {
    font: `800 60px Inter`,
    color: '#ffffff',
    letterSpacing: 1.4,
    align: 'left'
};

const STYLE_TIMESTAMP_SHARE = {
    font: `500 25px Inter`,
    color: '#cccccc',
    letterSpacing: 0.5,
    align: 'left'
};

const STYLE_PROFIT_SHARE = {
    font: `800 70px Inter`,
    color: '#ffffff',
    letterSpacing: -1,
    align: 'left'
};

const STYLE_PERSENTASE_SHARE = {
    font: `800 195px Inter`,
    gradient: null,
    letterSpacing: -1,
    align: 'left'
};

const STYLE_DIVESTASI_SHARE = {
    font: `800 60px Inter`,
    color: '#ffffff',
    letterSpacing: -1,
    align: 'left'
};

const STYLE_TRADE_SHARE = {
    font: `800 60px Inter`,
    color: '#ffffff',
    letterSpacing: -1,
    align: 'left'
};

const STYLE_WINRATE_SHARE = {
    font: `800 60px Inter`,
    color: '#ffffff',
    letterSpacing: -1,
    align: 'left'
};

const STYLE_INVESTED_SHARE = {
    font: `800 60px Inter`,
    color: '#ffffff',
    letterSpacing: -1,
    align: 'left'
};

const STYLE_USERNAME_SHARE = {
    font: `700 40px Inter`,
    color: '#ffffff',
    letterSpacing: 1,
    align: 'left'
};

function determineTemplateIndex(persentaseText) {
    const clean = persentaseText.replace(/[+\-%]/g, '');
    const value = parseFloat(clean);
    
    if (isNaN(value)) return 0;

    if (persentaseText.startsWith('-')) {
        return 1;
    } else if (value === 0) {
        return 0;
    } else {
        return value >= 10 ? 2 : 0;
    }
}

function getCurrentTimestamp() {
    const now = new Date();
    return now.getFullYear() +
           '-' +
           String(now.getMonth() + 1).padStart(2, '0') +
           '-' +
           String(now.getDate()).padStart(2, '0') +
           ' ' +
           String(now.getHours()).padStart(2, '0') +
           ':' +
           String(now.getMinutes()).padStart(2, '0');
}

function getPersentaseGradientShare() {
    if (currentTemplateIndexShare === 1) {
        return ['#ffffff', '#ffebee', '#f28b82'];
    } else if (currentTemplateIndexShare === 2) {
        return ['#ffffff', '#ebf1ef', '#eddf83'];
    } else {
        return ['#ffffff', '#ebf1ef', '#71ecbf'];
    }
}

function getUsernameBorderColorShare() {
    if (currentTemplateIndexShare === 1) {
        return 'rgba(211, 47, 47, 0.25)';
    } else if (currentTemplateIndexShare === 2) {
        return 'rgba(163, 152, 0, 0.25)';
    } else {
        return 'rgba(0, 144, 163, 0.25)';
    }
}

function getUsernameBgColorShare() {
    if (currentTemplateIndexShare === 1) {
        return 'rgba(255, 205, 210, 0.05)';
    } else if (currentTemplateIndexShare === 2) {
        return 'rgba(211, 200, 52, 0.05)';
    } else {
        return 'rgba(52, 211, 153, 0.05)';
    }
}

// FORMAT
function formatNumberShare(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';

    const abs = Math.abs(num);
    let sign = num < 0 ? '-' : '';

    let value = abs;
    let suffix = '';

    if (abs >= 1e9) {
        value = abs / 1e9;
        suffix = 'B';
    } else if (abs >= 1e6) {
        value = abs / 1e6;
        suffix = 'M';
    } else if (abs >= 1e3) {
        value = abs / 1e3;
        suffix = 'K';
    }

    let formattedValue;
    if (Number.isInteger(value)) {
        formattedValue = value.toString();
    } else {
        let str = value.toFixed(2);
        if (str.includes('.')) {
            str = str.replace(/\.?0+$/, '');
        }
        formattedValue = str;
    }

    return formattedValue + suffix;
}

function formatPersenShare(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return '0%';

    const sign = pct < 0 ? '-' : (pct > 0 ? '+' : '');
    const abs = Math.abs(pct);

    let value = abs;
    let suffix = '';

    if (abs >= 1e9) {
        value = abs / 1e9;
        suffix = 'B';
    } else if (abs >= 1e6) {
        value = abs / 1e6;
        suffix = 'M';
    } else if (abs >= 1e3) {
        value = abs / 1e3;
        suffix = 'K';
    }

    let formattedValue;
    if (Number.isFinite(value) && !Number.isInteger(value)) {
        let str = value.toFixed(2);
        str = str.replace(/\.?0+$/, ''); 
        formattedValue = str;
    } else {
        formattedValue = value.toString();
    }

    return `${sign}${formattedValue}${suffix}%`;
}

function parseFormattedNumber(str) {
    if (typeof str !== 'string') return NaN;

    let clean = str.trim().toLowerCase();
    let multiplier = 1;

    if (clean.endsWith('k')) {
        multiplier = 1e3;
        clean = clean.slice(0, -1);
    } else if (clean.endsWith('m')) {
        multiplier = 1e6;
        clean = clean.slice(0, -1);
    } else if (clean.endsWith('b')) {
        multiplier = 1e9;
        clean = clean.slice(0, -1);
    }

    const num = parseFloat(clean);
    return isNaN(num) ? NaN : num * multiplier;
}

// FILTER & HITUNG DATA
let selectedRangeShare = '24H';

function filterByRangeShare(data, range) {
    if (range === 'ALL') return data;
    const now = Date.now();
    let cutoff = 0;
    if (range === '24H') cutoff = now - 24 * 60 * 60 * 1000;
    else if (range === '1W') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30D') cutoff = now - 30 * 24 * 60 * 60 * 1000;

    return data.filter(item => {
        let tDate;
        if (typeof item.date === 'string') {
            tDate = new Date(item.date).getTime();
        } else if (typeof item.date === 'number') {
            tDate = item.date * 1000;
        } else {
            tDate = NaN;
        }
        return !isNaN(tDate) && tDate >= cutoff;
    });
}

function getTitleByRangeShare(range) {
    switch (range) {
        case '30D': return '30D Performance';
        case '1W': return '1W Performance';
        case '24H': return '24H Performance';
        default: return 'ALL-Time Performance';
    }
}

function calculateBalanceAtTime(trades, targetTime) {
    let balance = 0;
    trades.forEach(t => {
        let tDate;
        if (typeof t.date === 'string') {
            tDate = new Date(t.date).getTime();
        } else if (typeof t.date === 'number') {
            tDate = t.date * 1000;
        } else {
            tDate = NaN;
        }
        
        if (!tDate || tDate > targetTime) return;

        if (t.action?.toLowerCase() === 'deposit') {
            balance += parseFloat(t.value) || 0;
        } else if (t.action?.toLowerCase() === 'withdraw') {
            balance -= parseFloat(t.value) || 0;
        } else if ((t.Result === 'Profit' || t.Result === 'Loss') && typeof t.Pnl === 'number') {
            balance += parseFloat(t.Pnl) || 0;
        }
    });
    return balance;
}

// UPDATE DATA DARI LOCAL STORAGE
function updateDataShare() {
    const trades = JSON.parse(localStorage.getItem('dbtrade') || '[]');
    const allDates = trades.map(t => {
        let d;
        if (typeof t.date === 'string') {
            d = new Date(t.date).getTime();
        } else if (typeof t.date === 'number') {
            d = t.date * 1000;
        } else {
            d = NaN;
        }
        return isNaN(d) ? 0 : d;
    }).filter(d => d > 0);

    const now = Date.now();

    const filteredTrades = filterByRangeShare(trades, selectedRangeShare);

    const depositData = filteredTrades.filter(t => t.action?.toLowerCase() === 'deposit');
    const withdrawData = filteredTrades.filter(t => t.action?.toLowerCase() === 'withdraw');
    const executedTrades = filteredTrades.filter(
        t => (t.Result === 'Profit' || t.Result === 'Loss') && typeof t.Pnl === 'number'
    );

    const totalDeposit = depositData.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);
    const totalWithdraw = withdrawData.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);
    const totalPnL = executedTrades.reduce((sum, t) => sum + (parseFloat(t.Pnl) || 0), 0);

    let roiPercent = 0;

    if (['24H', '1W', '30D'].includes(selectedRangeShare)) {
        let cutoff = 0;
        if (selectedRangeShare === '24H') cutoff = now - 24 * 60 * 60 * 1000;
        else if (selectedRangeShare === '1W') cutoff = now - 7 * 24 * 60 * 60 * 1000;
        else if (selectedRangeShare === '30D') cutoff = now - 30 * 24 * 60 * 60 * 1000;

        const balanceBefore = calculateBalanceAtTime(trades, cutoff - 1);
        roiPercent = balanceBefore !== 0 ? (totalPnL / balanceBefore) * 100 : 0;
        TEXT_CONTENT_SHARE.profit = formatNumberShare(totalPnL);

    } else {
        const allDeposits = trades.filter(t => t.action?.toLowerCase() === 'deposit');
        const totalDepositAll = allDeposits.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

        const allExecutedTrades = trades.filter(
            t => (t.Result === 'Profit' || t.Result === 'Loss') && typeof t.Pnl === 'number'
        );
        const totalPnLAll = allExecutedTrades.reduce((sum, t) => sum + (parseFloat(t.Pnl) || 0), 0);

        roiPercent = totalDepositAll !== 0 ? (totalPnLAll / totalDepositAll) * 100 : 0;
        TEXT_CONTENT_SHARE.profit = formatNumberShare(totalPnLAll);
    }

    TEXT_CONTENT_SHARE.persentase = formatPersenShare(roiPercent);
    TEXT_CONTENT_SHARE.invested = formatNumberShare(totalDeposit);
    TEXT_CONTENT_SHARE.divestasi = formatNumberShare(totalWithdraw);
    TEXT_CONTENT_SHARE.trade = executedTrades.length.toString();
    TEXT_CONTENT_SHARE.winrate = formatPersenShare(
        executedTrades.length > 0 ? (executedTrades.filter(t => t.Pnl > 0).length / executedTrades.length) * 100 : 0
    ).replace('+', '');
    TEXT_CONTENT_SHARE.title = getTitleByRangeShare(selectedRangeShare);

    const persenStr = TEXT_CONTENT_SHARE.persentase;
    let newTemplateIndex = 0;

    if (persenStr.startsWith('-')) {
        newTemplateIndex = 1;
    } else {
        const cleanStr = persenStr.replace(/[+\-%]/g, '').trim();
        const value = parseFormattedNumber(cleanStr);

        newTemplateIndex = (!isNaN(value) && value >= 100) ? 2 : 0;
    }

    if (newTemplateIndex !== currentTemplateIndexShare) {
        currentTemplateIndexShare = newTemplateIndex;
        loadTemplateShare();
    } else {
        drawCanvasShare();
    }
}

// LOAD IMAGES
function loadTemplateShare() {
    const img = new Image();
    img.onload = function() {
        templateImageShare = img;
        canvasShare.width = img.width;
        canvasShare.height = img.height;
        drawCanvasShare();
    };
    img.onerror = function() {
        canvasShare.width = 800;
        canvasShare.height = 600;
        ctxShare.fillStyle = '#ff0000';
        ctxShare.font = '20px Inter';
        ctxShare.textAlign = 'center';
        ctxShare.fillText('Error: template.png tidak ditemukan!', canvasShare.width / 2, canvasShare.height / 2);
        ctxShare.fillText('Pastikan file template.png ada di folder yang sama', canvasShare.width / 2, canvasShare.height / 2 + 30);
    };
    img.src = TEMPLATE_LIST_SHARE[currentTemplateIndexShare];
}

function loadProfileImageShare() {
    const img = new Image();
    img.onload = function() {
        profileImageShare = img;
        drawCanvasShare();
    };
    img.onerror = function() {
        drawCanvasShare();
    };
    img.src = getCurrentAvatarPath();
}

// DRAWING FUNCTIONS
function drawTextWithLetterSpacingShare(ctx, text, x, y, letterSpacing = 0, style) {
    ctx.font = style.font;
    ctx.textAlign = 'left';

    let fillStyle = style.color || '#fff';
    if (style.gradient) {
        const fontSizeMatch = style.font.match(/(\d+)px/);
        const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 50;
        const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
        style.gradient.forEach((c, i, arr) => gradient.addColorStop(i / (arr.length - 1), c));
        fillStyle = gradient;
    }
    ctx.fillStyle = fillStyle;

    const charWidths = Array.from(text).map(ch => ctx.measureText(ch).width);
    const totalWidth = charWidths.reduce((sum, w) => sum + w, 0) + letterSpacing * (text.length - 1);

    let currentX = x;
    if (style.align === 'center') currentX -= totalWidth / 2;
    else if (style.align === 'right') currentX -= totalWidth;

    for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], currentX, y);
        currentX += charWidths[i] + letterSpacing;
    }
}

function drawProfilePhotoShare() {
    const [centerX, centerY] = TEXT_POSITIONS_SHARE.profilePhoto;
    const radius = 40;
    const strokeWidth = 2;

    ctxShare.save();
    ctxShare.beginPath();
    ctxShare.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctxShare.closePath();
    ctxShare.clip();

    if (profileImageShare) {
        ctxShare.drawImage(profileImageShare, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } else {
        ctxShare.fillStyle = '#666';
        ctxShare.fill();
    }

    ctxShare.restore();

    ctxShare.beginPath();
    ctxShare.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctxShare.strokeStyle = '#ffffff';
    ctxShare.lineWidth = strokeWidth;
    ctxShare.stroke();
}

function drawCanvasShare() {
    if (!templateImageShare) return;

    ctxShare.clearRect(0, 0, canvasShare.width, canvasShare.height);
    ctxShare.drawImage(templateImageShare, 0, 0);

    const usernameText = TEXT_CONTENT_SHARE.username;
    const [x, y] = TEXT_POSITIONS_SHARE.username;
    const style = STYLE_USERNAME_SHARE;

    ctxShare.font = style.font;
    const letterSpacing = style.letterSpacing;
    const charWidths = Array.from(usernameText).map(ch => ctxShare.measureText(ch).width);
    const totalWidth = charWidths.reduce((sum, w) => sum + w, 0) + letterSpacing * (usernameText.length - 1);
    const fontSize = parseInt(style.font.match(/(\d+)px/)[1]);
    const ascent = ctxShare.measureText('M').fontBoundingBoxAscent || fontSize * 0.8;
    const paddingX = 35, paddingY = 8, borderRadius = 15;
    const boxW = totalWidth + 2 * paddingX;
    const boxH = (ascent + (fontSize * 0.2)) + 2 * paddingY;
    const boxX = x - paddingX;
    const boxY = y - ascent - paddingY;

    ctxShare.fillStyle = getUsernameBgColorShare();
    ctxShare.beginPath();
    if (ctxShare.roundRect) ctxShare.roundRect(boxX, boxY, boxW, boxH, borderRadius);
    else ctxShare.rect(boxX, boxY, boxW, boxH);
    ctxShare.fill();

    ctxShare.strokeStyle = getUsernameBorderColorShare();
    ctxShare.lineWidth = 1;
    ctxShare.stroke();

    const textY = boxY + paddingY + ascent;
    drawTextWithLetterSpacingShare(ctxShare, usernameText, boxX + paddingX, textY, letterSpacing, style);

    drawProfilePhotoShare();

    const keys = ['title', 'profit', 'persentase', 'divestasi', 'trade', 'winrate', 'invested'];
    keys.forEach(key => {
        const text = TEXT_CONTENT_SHARE[key];
        if (!text) return;
        const [x, y] = TEXT_POSITIONS_SHARE[key];
        let style;
        switch (key) {
            case 'title': style = STYLE_TITLE_SHARE; break;
            case 'profit': style = STYLE_PROFIT_SHARE; break;
            case 'persentase': style = STYLE_PERSENTASE_SHARE; style.gradient = getPersentaseGradientShare(); break;
            case 'divestasi': style = STYLE_DIVESTASI_SHARE; break;
            case 'trade': style = STYLE_TRADE_SHARE; break;
            case 'winrate': style = STYLE_WINRATE_SHARE; break;
            case 'invested': style = STYLE_INVESTED_SHARE; break;
            default: style = STYLE_DIVESTASI_SHARE;
        }
        drawTextWithLetterSpacingShare(ctxShare, text, x, y, style.letterSpacing, style);
    });

    // Gambar timestamp secara manual
    const timestampText = TEXT_CONTENT_SHARE.timestamp;
    const [timestampX, timestampY] = TEXT_POSITIONS_SHARE.timestamp;
    drawTextWithLetterSpacingShare(
        ctxShare,
        timestampText,
        timestampX,
        timestampY,
        STYLE_TIMESTAMP_SHARE.letterSpacing,
        STYLE_TIMESTAMP_SHARE
    );
}

// UTILITAS
async function copyImageShare() {
    try {
        const blob = await new Promise(resolve => canvasShare.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (err) {
        console.error('Gagal copy image:', err);
    }
}

function downloadImageShare() {
    const link = document.createElement('a');
    link.download = 'Nexion Trade.png';
    link.href = canvasShare.toDataURL('image/png');
    link.click();
}

// EVENT UNTUK GANTI RANGE
document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedRangeShare = btn.dataset.range;
        updateDataShare();
        drawCanvasShare();
    });
});

// INIT
canvasShare.width = 800;
canvasShare.height = 600;
ctxShare.fillStyle = '#f0f0f0';
ctxShare.fillRect(0, 0, canvasShare.width, canvasShare.height);
ctxShare.fillStyle = '#999';
ctxShare.font = '20px Inter';
ctxShare.textAlign = 'center';
ctxShare.fillText('Loading template.png...', canvasShare.width / 2, canvasShare.height / 2);

updateDataShare();
loadTemplateShare();
loadProfileImageShare();

const shareButtons = document.querySelectorAll('.box-btn-share[data-platform]');

shareButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {

        try {
            const blob = await new Promise(resolve => canvasShare.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch (err) {
            console.warn('Gagal copy gambar, mungkin izin clipboard belum diberikan.');
        }

        const platform = btn.dataset.platform;

        const shareText = `My ${TEXT_CONTENT_SHARE.title}: ${TEXT_CONTENT_SHARE.profit} (${TEXT_CONTENT_SHARE.persentase}) — via Nexion Trade`;

        let url;
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                break;
            case 'discord':
                url = 'https://discord.com/channels/@me';
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
                break;
        }

        window.open(url, '_blank');
    });
});