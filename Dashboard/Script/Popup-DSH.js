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

// ======================= Navbar Popup Menu ======================= //
// ------ Popup Account Menu ------ //
const profileBox = document.querySelector('#navbarAccountIcon');
const popupAccount = document.querySelector('#popupAccount');

if (profileBox && popupAccount) {
    function positionPopup() {
        const rect = profileBox.getBoundingClientRect();
        popupAccount.style.top = `${rect.bottom + 6}px`;
        popupAccount.style.left = `${rect.right - popupAccount.offsetWidth}px`;
    }

    profileBox.addEventListener('click', (e) => {
        e.stopPropagation();
        profileBox.classList.toggle('active');

        if (popupAccount.style.display === 'block') {
            popupAccount.style.display = 'none';
            window.removeEventListener('scroll', positionPopup);
            window.removeEventListener('resize', positionPopup);
            forceCloseLogoutPopup();
        } else {
            popupAccount.style.display = 'block';
            positionPopup();
            window.addEventListener('scroll', positionPopup);
            window.addEventListener('resize', positionPopup);
        }
    });

    document.addEventListener('click', (e) => {
        if (!popupAccount.contains(e.target) && e.target !== profileBox) {
            popupAccount.style.display = 'none';
            profileBox.classList.remove('active');
            window.removeEventListener('scroll', positionPopup);
            window.removeEventListener('resize', positionPopup);
        }
    });
}

// ------ Unified Logout Popup ------ //
let activeLogoutPopup = {
    anchor: null,
    accountId: null,
    isOpen: false
};

function showLogoutPopup(anchor, accountId = null) {
    const popup = document.querySelector(".container-logout");
    if (!popup) return;

    if (activeLogoutPopup.isOpen) {
        hideLogoutPopup();
    }

    activeLogoutPopup.anchor = anchor;
    activeLogoutPopup.accountId = accountId;
    activeLogoutPopup.isOpen = true;

    const rect = anchor.getBoundingClientRect();

    let top = rect.bottom;
    let left = rect.left + 40;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popupWidth = 200;
    const popupHeight = 80;

    if (left + popupWidth > viewportWidth) {
        left = viewportWidth - popupWidth - 10;
    }

    if (top + popupHeight > viewportHeight) {
        top = rect.top - popupHeight - 10;
    }

    if (top < 0) {
        top = 10;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.display = "block";

    setTimeout(() => {
        document.addEventListener("click", handleLogoutPopupClick);
    }, 10);
}

function handleLogoutPopupClick(e) {
    const popup = document.querySelector(".container-logout");
    const isClickInsidePopup = popup && popup.contains(e.target);
    const isClickOnAnchor = e.target === activeLogoutPopup.anchor;

    if (!isClickInsidePopup && !isClickOnAnchor) {
        hideLogoutPopup();
    }
}

function hideLogoutPopup() {
    const popup = document.querySelector(".container-logout");
    if (popup) {
        popup.style.display = "none";
    }

    document.removeEventListener("click", handleLogoutPopupClick);
    activeLogoutPopup = {
        anchor: null,
        accountId: null,
        isOpen: false
    };
}

function forceCloseLogoutPopup() {
    hideLogoutPopup();
}

document.getElementById("logoutAccount")?.addEventListener("click", function (e) {
    e.stopPropagation();
    showLogoutPopup(this, null);
});

// ------ Account Icon ------ //
function renderNavbarAvatar() {
    const imgEl = document.getElementById("navbarAccountIcon");
    if (!imgEl) return;

    const avatar = localStorage.getItem("avatar");
    if (avatar) {
        imgEl.src = avatar;
    }
}

// ------ Popup Account Switch (Manage Account) ------ //
document.addEventListener("DOMContentLoaded", () => {
    renderNavbarAvatar();

    const btnAccountManage = document.getElementById("accountManage");
    const popupAccount = document.querySelector(".popup-account");
    const popupOverlay = document.querySelector(".popup-overlay");
    const closeAccountBtn = document.getElementById("closeAccount");

    if (!btnAccountManage || !popupAccount) return;

    function isAnyOtherPopupOpen() {
        const otherPopups = [
            ".popup-perpetual-add",
            ".popup-perpetual-edit",
            ".popup-perpetual-transactions-edit",
            ".popup-caculate"
        ];
        return otherPopups.some(selector => {
            const el = document.querySelector(selector);
            return el && el.classList.contains("show");
        });
    }

    function closeAccountPopup() {
        popupAccount.classList.remove("show");
        forceCloseLogoutPopup();

        if (!isAnyOtherPopupOpen()) {
            if (popupOverlay) popupOverlay.classList.remove("show");
            document.body.classList.remove("popup-open");
            document.body.style.overflow = "";
        }
    }

    btnAccountManage.addEventListener("click", (e) => {
        e.stopPropagation();
        if (popupOverlay) popupOverlay.classList.add("show");
        document.body.classList.add("popup-open");
        document.body.style.overflow = "hidden";
        popupAccount.classList.add("show");
    });

    if (closeAccountBtn) {
        closeAccountBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAccountPopup();
        });
    }

    if (popupOverlay) {
        popupOverlay.addEventListener("click", (e) => {
            if (popupAccount.classList.contains("show") && !popupAccount.contains(e.target)) {
                closeAccountPopup();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && popupAccount.classList.contains("show")) {
            closeAccountPopup();
        }
    });
});

// ------ Render Account List ------ //
async function renderAccountList() {
    const wrapper = document.querySelector('.wrapper-account');
    if (!wrapper) return;

    const savedRaw = localStorage.getItem('saved_accounts');
    const accounts = savedRaw ? JSON.parse(savedRaw) : [];

    if (accounts.length === 0) {
        wrapper.innerHTML = '<p class="no-accounts">No saved accounts.</p>';
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    const activeUserId = session?.user?.id;

    let html = '';
    accounts.forEach((acc, index) => {
        const isActive = acc.user_id === activeUserId;
        const avatarSrc = acc.avatar || '../Asset/User.png';
        const email = acc.email;

        html += `
            <div class="column-account">
                <div class="column-box-account">
                    <img src="${avatarSrc}" onerror="this.src='Asset/Nexion.png'" />
                    <div class="wrapper-active-account">
                        <p class="usernmae-account">${email}</p>
                        ${isActive ? '<p class="text-account-active">Active account</p>' : ''}
                    </div>
                </div>
                <div class="column-box-account">
                    ${isActive 
                        ? '' 
                        : `<button class="btn btn-switch" data-refresh="${acc.refresh_token}">Switch</button>`
                    }
                    <div class="btn btn-logout logout-account" data-id="${acc.user_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 860" width="20px" fill="#e3e3e3">
                            <path d="M263.79-408Q234-408 213-429.21t-21-51Q192-510 213.21-531t51-21Q294-552 315-530.79t21 51Q336-450 314.79-429t-51 21Zm216 0Q450-408 429-429.21t-21-51Q408-510 429.21-531t51-21Q510-552 531-530.79t21 51Q552-450 530.79-429t-51 21Zm216 0Q666-408 645-429.21t-21-51Q624-510 645.21-531t51-21Q726-552 747-530.79t21 51Q768-450 746.79-429t-51 21Z"/>
                        </svg>
                    </div>
                </div>
            </div>
            ${index < accounts.length - 1 ? '<div class="line-gap"></div>' : ''}
        `;
    });

    wrapper.innerHTML = html;

    document.querySelectorAll('.btn-switch').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const refreshToken = e.currentTarget.dataset.refresh;
            switchToAccount(refreshToken);
        });
    });

    document.querySelectorAll('.logout-account').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.id;
            removeAccount(userId, e.currentTarget);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient !== 'undefined') {
        renderAccountList();
    }
});

// ------ Switch Akun ------ //
async function switchToAccount(refreshToken) {
    const savedRaw = localStorage.getItem('saved_accounts');
    const savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];
    const account = savedAccounts.find(acc => acc.refresh_token === refreshToken);

    if (!account) {
        alert('Account not found.');
        return;
    }

    try {
        localStorage.removeItem('avatar');
        localStorage.removeItem('dbperpetual');
        localStorage.removeItem('dbnotes');

        const { data, error } = await supabaseClient.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (error) throw error;
        if (!data.session) throw new Error("No session returned after refresh!");

        console.log("🔄 Switched to:", data.session.user.email);

        if (account.avatar) {
            localStorage.setItem('avatar', account.avatar);
            console.log("✅ Avatar akun baru disimpan ke localStorage");
        } else {
            localStorage.removeItem('avatar');
        }

        const isGithub = window.location.hostname.includes("github.io");
        const target = isGithub ? "/Nexion-Trades-Full/Dashboard" : "/Dashboard";
        window.location.href = target;

    } catch (err) {
        alert("Failed to switch account. Please log in again.");
        const isGithub = window.location.hostname.includes("github.io");
        const signinTarget = isGithub ? "/Nexion-Trades-Full/Signin" : "/Signin";
        window.location.href = signinTarget;
    }
}

// ------ Logout Akun (Single & Manage) ------ //
function removeAccount(accountId, anchorBtn) {
    showLogoutPopup(anchorBtn, accountId);
}

document.querySelector(".signout-btn-universal")?.addEventListener("click", async () => {
    const savedRaw = localStorage.getItem('saved_accounts');
    let savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];

    const { data: { session } } = await supabaseClient.auth.getSession();
    const activeUserId = session?.user?.id;

    const accountIdToLogout = activeLogoutPopup.accountId || activeUserId;
    const isActiveAccount = activeUserId === accountIdToLogout;

    savedAccounts = savedAccounts.filter(acc => acc.user_id !== accountIdToLogout);
    localStorage.setItem('saved_accounts', JSON.stringify(savedAccounts));

    if (isActiveAccount) {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('avatar');
        localStorage.removeItem('dbperpetual');
        localStorage.removeItem('dbnotes');

        const isGithub = window.location.hostname.includes("github.io");
        const target = isGithub ? "/Nexion-Trades-Full" : "/";
        window.location.href = target;
    } else {
        hideLogoutPopup();
        renderAccountList(); 
    }
});

// ------ Add Account ------ //
document.querySelector('.btn-add-account')?.addEventListener('click', () => {
    const isGithub = window.location.hostname.includes('github.io');
    const loginPage = isGithub ? '/Nexion-Trades-Full/Signin' : '/Signin';
    window.location.href = loginPage;
});

// ======================= POPUP & DROPDOWN SETUP ======================= //
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

    // ------ ADD BUTTON (DINAMIS BERDASARKAN TAB AKTIF) ------
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
        document.querySelectorAll(".tabel-trade tbody tr").forEach(row => {
            row.style.cursor = isEditMode ? "pointer" : "default";
            row.classList.toggle("editable", isEditMode);
        });
        btnEdit.classList.toggle("active", isEditMode);
    });
    
    // ------ EDIT MODE (SPOT & PERPETUAL) ------
    document.querySelectorAll(".tabel-trade tbody").forEach(tableBody => {
        tableBody.addEventListener("click", async (e) => {
            if (!isEditMode) return;
            const row = e.target.closest("tr");
            if (!row) return;

            const isSpotTable = row.closest("#tabel-spot") !== null;
            const tradeNumber = parseInt(row.querySelector(".no")?.textContent);
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
        const closeIcon = selected.querySelector('.close-icon');
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
            if (input.value.trim()) {
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

// ======================= Show UI Remove Inptu ======================= //
function refreshClearButtons() {
    document.querySelectorAll('.input-with-clear').forEach(container => {
        const input = container.querySelector('input, textarea');
        if (input) {
            container.classList.toggle('has-value', input.value.trim() !== '');
        }
    });
}

// ======================= Serch Data ======================= //
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
    const posVal = trade.Pos === "B" ? "Long" : trade.Pos === "S" ? "Short" : "";
    setDropdownValue("PerpetualEditPosition", posVal);
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
    document.getElementById("EditSpotDate").value = unixToWIBDatetimeLocal(trade.date);
    document.getElementById("EditSpotPairs").value = trade.Pairs || "";
    document.getElementById("EditSpotRr").value = trade.RR || "";
    document.getElementById("EditSpotMargin").value = trade.Margin || "";
    document.getElementById("EditSpotPnl").value = trade.Pnl || "";
    document.getElementById("EditSpotCauses").value = trade.Causes || "";
    document.getElementById("EditSpotBefore-url").value = trade.Files?.Before || "";
    document.getElementById("EditSpotAfter-url").value = trade.Files?.After || "";

    setDropdownValue("EditSpotMethod", trade.Method);
    setDropdownValue("EditSpotPsychology", trade.Psychology);
    setDropdownValue("EditSpotClass", trade.Class);
    setDropdownValue("EditSpotResult", trade.Result);
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

// ======================= DROPDOWN ======================= //
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
            SpotTimeframe: ["1M", "5M", "15M", "1H", "4H", "1D"],
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
        return null;
    }
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
    const dbPerpetual = JSON.parse(localStorage.getItem("dbspot")) || [];

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

// ======================= POPUP JURNAL ======================= //

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
            pos:
                positionValue === "Long" ? "B" :
                positionValue === "Short" ? "S" : "",
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

        // Update UI & Data
        refreshDBPerpetualCache();
        if (typeof updateAllUI === "function") await updateAllUI();

        restartSOP();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups();

        document.querySelectorAll("#addDataPerpetual input, #addDataPerpetual textarea")
            .forEach(i => i.value = "");

    } catch (err) {
        console.error("❌ Error:", err);
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

        document.getElementById("PerpetualDateTransaction").value = "";
        document.getElementById("PerpetualValueTransaction").value = "";
        document.querySelectorAll("#addDataPerpetualTransactions .custom-dropdown .dropdown-selected span")
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
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
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
            pos: getDropdown("PerpetualEditPosition") === "Long" ? "B" :
                getDropdown("PerpetualEditPosition") === "Short" ? "S" : "",
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
        CancleEditPerpetual();

        document.getElementById("PerpetualDateTransaction").value = "";
        document.getElementById("PerpetualValueTransaction").value = "";
        document.querySelectorAll("#addDataPerpetualTransactions .custom-dropdown .dropdown-selected span")
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
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
        const correctedDate = new Date(dateInputValue);

        const action = getDropdownValue("PerpetualTransactionEditAction");
        if (!action || !["Deposit", "Withdraw"].includes(action)) {
            throw new Error("Pilih action yang valid (Deposit/Withdraw)!");
        }
        let value = parseFloat(getVal("PerpetualTransactionEditValue"));
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
        CancleEditPerpetual();

        document.getElementById("PerpetualDateTransaction").value = "";
        document.getElementById("PerpetualValueTransaction").value = "";
        document.querySelectorAll("#addDataPerpetualTransactions .custom-dropdown .dropdown-selected span")
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

//  Cancle  //
function CancleEditPerpetual() {
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

        console.log("[UI] Edit popup closed & state reset");
    } catch (err) {
        console.error("CancleEditPerpetual error:", err);
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
        CancleEditPerpetual();

    } catch (err) {
        console.error("❌ Gagal menghapus trade:", err);
        alert("Gagal menghapus trade:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Delete Transaction  //
async function DeletePerpetualTransaction() {

    const btn = document.getElementById("deletePerpetualTransaction");
    btn.classList.add("loading");

    if (!currentEditingTradeNo) {
        alert("⚠️ Tidak ada transfer yang dipilih untuk dihapus!");
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
        CancleEditPerpetual();

    } catch (err) {
        console.error("❌ Gagal menghapus transfer:", err);
        alert("Gagal menghapus transfer:\n" + err.message);
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
        if (typeof updateAllUI === "function") {
        await updateAllUI();
        }

        restartSOP?.();
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups?.();

        // --- Clear form ---
        document.querySelectorAll("#addDataSpot input, #addDataSpot textarea")
            .forEach(el => {
                if (el.type !== "datetime-local") el.value = "";
                else el.value = "";
            });
        document.querySelectorAll("#addDataSpot .custom-dropdown .dropdown-selected span")
            .forEach(span => {
                span.textContent = span.closest(".custom-dropdown").dataset.dropdown.includes("Timeframe") ||
                                   span.closest(".custom-dropdown").dataset.dropdown.includes("Entry")
                    ? "Select"
                    : span.closest(".custom-dropdown").dataset.dropdown.replace("Spot", "");
                span.classList.add("placeholder");
            });

    } catch (err) {
        console.error("❌ Error saat menambahkan Spot Trade:", err);
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
        
        if (typeof updateAllUI === "function") {
        await updateAllUI();
        }
        
        window.dispatchEvent(new CustomEvent("tradeDataUpdated"));
        closeAllPopups?.();

        // --- Clear form ---
        document.getElementById("SpotTransactionDate").value = "";
        document.getElementById("SpotTransactionValue").value = "";
        const placeholderSpan = document.querySelector('[data-dropdown="SpotTransactionAction"] .dropdown-selected span');
        if (placeholderSpan) {
            placeholderSpan.textContent = "Transaction";
            placeholderSpan.classList.add("placeholder");
        }

    } catch (err) {
        console.error("❌ Gagal menambahkan Spot Transaction:", err);
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
        const dateInputValue = getVal("EditSpotDate");
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
        const correctedDate = new Date(dateInputValue);

        // --- Data untuk Server ---
        const serverUpdate = {
            user_id: user_id,
            date: Math.floor(correctedDate.getTime() / 1000),
            pairs: getVal("EditSpotPairs"),
            method: getDropdown("EditSpotRr"),
            entry: getDropdown("EditSpotEntry"),
            timeframe: getDropdown("EditSpotEditTimeframe"),
            rr: parseFloat(getVal("EditSpotRr")) || 0,
            causes: getVal("EditSpotCauses"),
            psychology: getDropdown("EditSpotPsychology"),
            class: getDropdown("EditSpotClass"),
            before: getVal("EditSpotBefore-url"),
            after: getVal("EditSpotAfter-url"),
            margin: parseFloat(getVal("EditSpotMargin")) || 0,
            result: getDropdown("EditSpotResult"),
            pnl: parseFloat(getVal("EditSpotPnl")) || 0
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
        CancleEditSpot();

    } catch (err) {
        console.error("❌ Error update spot trade:", err);
        alert("Gagal memperbarui trade Spot:\n" + err.message);
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
        if (!dateInputValue) throw new Error("Tanggal wajib diisi!");
        const correctedDate = new Date(dateInputValue);

        const action = getDropdown("EditSpotTransactionAction");
        if (!action || !["Deposit", "Withdraw"].includes(action)) {
            throw new Error("Pilih action yang valid (Deposit/Withdraw)!");
        }

        let value = parseFloat(getVal("EditSpotTransactionValue"));
        if (isNaN(value) || value === 0) throw new Error("Nilai harus valid dan tidak nol!");
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
        CancleEditSpot();

    } catch (err) {
        console.error("❌ Error update spot transaction:", err);
        alert("Gagal memperbarui transfer Spot:\n" + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

//  Cancle  //
function CancleEditSpot() {
    currentEditingTradeNo = null;

    const popupEdit = document.querySelector(".popup-spot-edit");
    const popupTrans = document.querySelector(".popup-spot-transactions-edit");
    const overlay = document.querySelector(".popup-overlay");

    [popupEdit, popupTrans].forEach(p => p?.classList.remove("show"));
    overlay?.classList.remove("show");

    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";

    // Reset form fields & dropdown
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
        CancleEditSpot();

    } catch (err) {
        console.error("❌ Gagal menghapus Spot trade:", err);
        alert("Gagal menghapus trade Spot:\n" + err.message);
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
        CancleEditSpot();

    } catch (err) {
        console.error("❌ Gagal menghapus Spot transfer:", err);
        alert("Gagal menghapus transfer Spot:\n" + err.message);
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
        const popupContent = document.querySelector(".confirm-popup-content");

        msg.textContent = message;

        popup.style.zIndex = "99999";
        popup.classList.remove("hidden");
        popup.offsetHeight;

        const cleanup = (result) => {
            setTimeout(() => {
                popup.classList.add("hidden");
                yes.removeEventListener("click", onYes);
                no.removeEventListener("click", onNo);
                document.removeEventListener("keydown", onEscKey);
                document.removeEventListener("click", onOutsideClick);
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

// ======================= CALCULATE POPUP ======================= //
document.addEventListener("DOMContentLoaded", () => {
    const popupCaculate = document.querySelector(".popup-caculate");
    const popupOverlay = document.querySelector(".popup-overlay");
    const btnCaculate = document.getElementById("btnCaculate");
    const closeBtn = document.getElementById("closeCaculate");

    function openCaculate() {
        closeAllPopups();
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
});

// ======================= Automation PnL  ======================= //
document.getElementById("AutomationPnL")?.addEventListener("click", () => {
    try {
            window.dropdownData = window.dropdownData || {};
            const resultValue = window.dropdownData["edit-result"];

            if (!resultValue || !["Profit", "Loss"].includes(resultValue)) {
                return;
            }

            const dbPerpetual = JSON.parse(localStorage.getItem("dbperpetual") || "[]");
            const setting = JSON.parse(localStorage.getItem("setting") || "{}");
            const calc = JSON.parse(localStorage.getItem("calculate") || "{}");

            const rrInput = document.getElementById("edit-rr");
            const rr = parseFloat(rrInput?.value || "0");

            const risk = parseFloat(setting.risk) || 0;
            const feePercent = parseFloat(setting.fee) || 0;
            const fee = feePercent / 100;
            const leverage = parseFloat(calc.leverage) || 1;
            const riskFactor = parseFloat(setting.riskFactor) || 1;

            const totalPNL = dbPerpetual.reduce((sum, item) => sum + (parseFloat(item.Pnl ?? item.pnl ?? 0) || 0), 0);
            const totalDeposit = dbPerpetual.reduce((sum, item) => item.action?.toLowerCase() === "deposit" ? sum + (parseFloat(item.value ?? 0) || 0) : sum, 0);
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

            document.getElementById("edit-margin").value = margin.toFixed(2);
            document.getElementById("edit-pnl").value = pnlFinal.toFixed(2);
            document.getElementById("edit-rr").value = rrUsed.toFixed(2);

        } catch (err) {
            console.error("❌ Auto calc error:", err);
        }
});

// ======================= Popup SOP  ======================= //
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
    const btnSopTrading = document.getElementById("sopTrading");

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
    const statusTrading = document.getElementById('statusTrading');
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

    } catch (err) {
        console.error("❌ Error:", err);
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
        console.log('✅ Avatar di saved_accounts diperbarui untuk user:', user_id);
    }
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
const TEMPLATE_SHARE_VERSION = "1.0";

let currentTemplateIndexShare = 0;

function getCurrentAvatarPath() {
    return localStorage.getItem('avatar') || '../Asset/User.png';
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
    const trades = JSON.parse(localStorage.getItem('dbperpetual') || '[]');
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

// ------ CACHE UTILS ------
function getTemplateCache() {
    try {
        const cached = JSON.parse(localStorage.getItem("templateShareCache"));
        if (cached && cached.version === TEMPLATE_SHARE_VERSION) {
            return cached.images;
        }
    } catch (e) {
        console.warn("Gagal baca cache template:", e);
    }
    return null;
}

function setTemplateCache(imagesObj) {
    try {
        localStorage.setItem("templateShareCache", JSON.stringify({
            version: TEMPLATE_SHARE_VERSION,
            images: imagesObj
        }));
    } catch (e) {
        console.error("Gagal simpan cache template:", e);
    }
}

// ------ LOAD ALL TEMPLATES ONCE ------
async function preloadAllTemplates() {
    const cached = getTemplateCache();
    if (cached) {
        return cached;
    }

    console.log("📥 Memuat template dari server... (versi:", TEMPLATE_SHARE_VERSION, ")");

    const images = {};
    const promises = TEMPLATE_LIST_SHARE.map(url =>
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Gagal load: ${url}`);
                return res.blob();
            })
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .then(base64 => {
                images[url] = base64;
            })
    );

    try {
        await Promise.all(promises);
        setTemplateCache(images);
        console.log("💾 Template berhasil disimpan ke cache");
        return images;
    } catch (err) {
        console.error("❌ Gagal preload template:", err);
        return {};
    }
}

// ------ LOAD SINGLE TEMPLATE ------
async function loadTemplateShare() {
    const cached = getTemplateCache();
    const targetUrl = TEMPLATE_LIST_SHARE[currentTemplateIndexShare];

    let imgSrc = null;

    if (cached && cached[targetUrl]) {
        imgSrc = cached[targetUrl];
    } else {
        console.warn("Template tidak ada di cache, load dari server:", targetUrl);
        try {
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error("File tidak ditemukan");
            const blob = await res.blob();
            imgSrc = URL.createObjectURL(blob);
        } catch (err) {
            console.error("Gagal load template:", err);
            drawErrorCanvas();
            return;
        }
    }

    const img = new Image();
    img.onload = () => {
        templateImageShare = img;
        canvasShare.width = img.width;
        canvasShare.height = img.height;
        drawCanvasShare();

        if (!cached || !cached[targetUrl]) {
            const reader = new FileReader();
            reader.onload = () => {
                const fullCache = getTemplateCache() || {};
                const newImages = { ...(fullCache || {}), [targetUrl]: reader.result };
                setTemplateCache(newImages);
            };
            fetch(imgSrc).then(r => r.blob()).then(b => reader.readAsDataURL(b));
        }
    };
    img.onerror = () => {
        drawErrorCanvas();
    };
    img.src = imgSrc;
}

function drawErrorCanvas() {
    canvasShare.width = 800;
    canvasShare.height = 600;
    ctxShare.fillStyle = '#ff0000';
    ctxShare.font = '20px Inter';
    ctxShare.textAlign = 'center';
    ctxShare.fillText('Error: template tidak bisa dimuat!', canvasShare.width / 2, canvasShare.height / 2);
}

// ------ INIT ON PAGE LOAD ------
document.addEventListener("DOMContentLoaded", async () => {
    const allCached = await preloadAllTemplates();

    currentTemplateIndexShare = 0;

    loadTemplateShare();
});

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

document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedRangeShare = btn.dataset.range;
        updateDataShare();
        drawCanvasShare();
    });
});

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

// ======================= MONTHLY DETAIL POPUP TRIGGER ======================= //
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
        console.error('Error calculating monthly stats:', error);
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
            console.warn("Invalid month format:", monthNameText);
            return;
        }

        const matchedEntry = monthlyData.find(
            m => m.month === monthIndex && m.year === year
        );

        if (!matchedEntry) {
            console.warn("No monthly data found for", monthStr, year);
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

// ======================= COIN DETAIL POPUP ======================= //
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
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData)) {
            console.warn("Raw data tidak valid untuk pair:", symbol);
            return null;
        }

        const pairTrades = rawData.filter(trade => {
            if (!trade.Pairs) return false;
            const base = extractBaseSymbol(trade.Pairs);
            return base === symbol;
        });

        if (pairTrades.length === 0) {
            console.warn("Tidak ada trade ditemukan untuk pair:", symbol);
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

        // Hitung berdasarkan Position (Buy/Sell)
        const buy = pairTrades.filter(t => t.Pos === "B").length;
        const sell = pairTrades.filter(t => t.Pos === "S").length;

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
        console.error("Error menghitung statistik pair:", symbol, error);
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


    // === Update Buy/Sell Progress Bar ===
    const buySellTotal = stats.buy + stats.sell;
    const buyPercent = buySellTotal > 0 ? (stats.buy / buySellTotal) * 100 : 0;
    const bsFill1 = document.querySelectorAll(".subcolumn-stats .bs-fill")[0];
    if (bsFill1) {
        bsFill1.style.width = `${buyPercent}%`;
    }

    // === Update Continuation/Reversal Progress Bar ===
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
            console.warn("Pair name tidak valid:", pairItem.textContent);
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

// ======================= FEE ANALYSIS POPUP ======================= //
document.addEventListener("DOMContentLoaded", () => {
    const popupFeeAnalysis = document.querySelector(".popup-fee-analysis");
    const popupOverlay = document.querySelector(".popup-overlay");
    const btnFeeInfo = document.getElementById("btnFeeInfo");
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

const canvasFee = document.getElementById('chartCanvasFee');
const ctxFee = canvasFee.getContext('2d');
const tooltipFee = document.getElementById('tooltip-fee');
const dateLabelFee = document.getElementById('dateLabelFee');

let feeFullData = [];
let feePoints = [];
let feeChartArea = {};
let feeLastPoint = null;

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

async function loadFeeData() {
    try {
        const rawData = await getDBPerpetual();
        if (!Array.isArray(rawData) || rawData.length === 0) {
            feeFullData = [];
            drawFeeChart();
            return;
        }

        const sorted = rawData
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
        const elValueFilterFee = document.getElementById('valueFilterFee');
        if (elValueFilterFee) {
            elValueFilterFee.textContent = formatFeeCurrency(finalFee); 
        }

        drawFeeChart();

    } catch (error) {
        console.error('Error loading fee data:', error);
        feeFullData = [];
        drawFeeChart();
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

    // Garis utama diagonal
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();

    // Penutup ujung kiri atas
    ctx.beginPath();
    ctx.moveTo(-1, 1);
    ctx.lineTo(1, -1);
    ctx.stroke();

    // Penutup ujung kanan bawah
    ctx.beginPath();
    ctx.moveTo(size - 1, size + 1);
    ctx.lineTo(size + 1, size - 1);
    ctx.stroke();

    return ctx.createPattern(tile, 'repeat');
}

function drawFeeChart() {
    ctxFee.clearRect(0, 0, canvasFee.width, canvasFee.height);

    if (feeFullData.length === 0) {
        ctxFee.save();
        ctxFee.font = '700 34px Sansation';
        ctxFee.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctxFee.textAlign = 'center';
        ctxFee.textBaseline = 'middle';
        ctxFee.fillText('NEXION TRADE', canvasFee.width / 2, canvasFee.height / 2);
        ctxFee.restore();
        return;
    }

    // Hitung rentang nilai Y
    const allFees = feeFullData.map(d => d.fee);
    const minFee = Math.min(...allFees) * 0.9;
    const maxFee = Math.max(...allFees) * 1.1;
    const rangeFee = maxFee - minFee || 1;

    // Padding kiri dinamis
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

    // Label sumbu Y
    ctxFee.textBaseline = 'alphabetic'; 
    ctxFee.fillStyle = 'rgb(163, 163, 163)';
    ctxFee.textAlign = 'right';
    const ySteps = 7;
    for (let i = 0; i <= ySteps; i++) {
        const value = minFee + (rangeFee * (i / ySteps));
        const y = feeChartArea.bottom - (feeChartArea.height * i / ySteps);
        ctxFee.fillText(formatFeeCurrency(value), feeChartArea.left - 10, y + 4);
    }

    // Sumbu X: 8 label
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

    ctxFee.font = '600 30px TASA Explorer';
    ctxFee.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctxFee.textAlign = 'center';
    ctxFee.textBaseline = 'middle';
    ctxFee.fillText('Fee Analysis', canvasFee.width / 2, canvasFee.height / 2.5);
    ctxFee.restore();

    // Bangun titik chart
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

    // Update circle akhir
    const circlefee = document.getElementById('circlefee');
    if (circlefee) {
        circlefee.style.display = 'block';
        circlefee.style.background = lineColor;
        circlefee.style.setProperty('--circlefee-color', lineColor);
        circlefee.style.setProperty('--circlefee-after-color', 'rgba(239, 68, 68, 0.6)');
    }

    // Gradient fill
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

    // Garis utama
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

    // Label sumbu X
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

    // Posisi circle akhir
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

    // Cari titik terdekat
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

    // Garis vertikal dashed
    ctxFee.lineWidth = 1;
    ctxFee.setLineDash([5, 5]);
    ctxFee.beginPath();
    ctxFee.moveTo(closestPoint.x, feeChartArea.top);
    ctxFee.lineTo(closestPoint.x, feeChartArea.bottom);
    ctxFee.stroke();
    ctxFee.setLineDash([]);

    // Titik highlight
    ctxFee.fillStyle = '#fff';
    ctxFee.beginPath();
    ctxFee.arc(closestPoint.x, closestPoint.y, 2, 0, Math.PI * 2);
    ctxFee.fill();

    // Tooltip
    tooltipFee.style.display = 'block';
    dateLabelFee.style.display = 'block';

    document.getElementById('feeTooltip').textContent = formatFeeCurrency(closestPoint.fee);

    // Format tanggal tooltip
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

    // Label di bawah chart
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    dateLabelFee.textContent = `${monthDay} ${time}`;

    feeLastPoint = closestPoint;

    // Posisi tooltip
    const tooltipX = mouseX + 20;
    const tooltipY = mouseY - 80;
    const tooltipWidth = tooltipFee.offsetWidth;
    const tooltipHeight = tooltipFee.offsetHeight;

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

    // Posisi label bawah
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

// Init
window.addEventListener('load', () => {
    loadFeeData();
    window.addEventListener('resize', resizeFeeCanvas);
});

// ======================= Block 1000px ======================= //
function checkDeviceWidth() {
    const minWidth = 999;
    let overlay = document.getElementById("deviceBlocker");

    if (window.innerWidth < minWidth) {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "deviceBlocker";

            overlay.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e3e3e3"><path d="M0-160v-60h141v-42q-24 0-42-18t-18-42v-458q0-24 18-42t42-18h678q24 0 42 18t18 42v458q0 24-18 42t-42 18v42h141v60H0Zm141-162h678v-458H141v458Zm0 0v-458 458Z"/></svg>
                <h1>Desktop Required</h1>
                <p>This website is optimized for desktop computers only. Your device screen is too small to display this site properly.</p>
            `;

            document.body.appendChild(overlay);
            document.body.style.overflow = "hidden";
        }
    } else {
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = "";
        }
    }
}

window.addEventListener("load", checkDeviceWidth);
window.addEventListener("resize", checkDeviceWidth);
