// ────── Navbar Popup Menu ────── //

// ------ Popup Account Menu ------ //
const profileBox = document.querySelector("#NavAccount");
const popupAccount = document.querySelector("#popupAccount");

if (profileBox && popupAccount) {
  function positionPopup() {
    const rect = profileBox.getBoundingClientRect();
    popupAccount.style.top = `${rect.bottom + 6}px`;
    popupAccount.style.left = `${rect.right - popupAccount.offsetWidth}px`;
  }

  profileBox.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBox.classList.toggle("active");

    if (popupAccount.style.display === "block") {
      popupAccount.style.display = "none";
      window.removeEventListener("scroll", positionPopup);
      window.removeEventListener("resize", positionPopup);
      forceCloseLogoutPopup();
    } else {
      popupAccount.style.display = "block";
      positionPopup();
      window.addEventListener("scroll", positionPopup);
      window.addEventListener("resize", positionPopup);
    }
  });

  document.addEventListener("click", (e) => {
    if (!popupAccount.contains(e.target) && e.target !== profileBox) {
      popupAccount.style.display = "none";
      profileBox.classList.remove("active");
      window.removeEventListener("scroll", positionPopup);
      window.removeEventListener("resize", positionPopup);
    }
  });
}

// ------ Unified Logout Popup ------ //
let activeLogoutPopup = {
  anchor: null,
  accountId: null,
  isOpen: false,
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
    isOpen: false,
  };
}

function forceCloseLogoutPopup() {
  hideLogoutPopup();
}

document
  .getElementById("logoutAccount")
  ?.addEventListener("click", function (e) {
    e.stopPropagation();
    showLogoutPopup(this, null);
  });

// ------ Account Icon ------ //
function renderNavbarAvatar() {
  const imgEl = document.getElementById("NavAccount");
  if (!imgEl) return;

  const avatar = localStorage.getItem("avatar");

  if (avatar) {
    imgEl.src = avatar;
  }
}

// ------ Popup Account Switch ------ //
document.addEventListener("DOMContentLoaded", () => {
  renderNavbarAvatar();

  const btnAccountManage = document.getElementById("accountManage");
  const popupAccount = document.querySelector(".popup-account");
  const popupOverlay = document.querySelector(".popup-overlay");
  const closeAccountBtn = document.getElementById("closeAccount");

  if (!btnAccountManage || !popupAccount) return;

  btnAccountManage.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllPopups();

    if (popupOverlay) popupOverlay.classList.add("show");
    document.body.classList.add("popup-open");
    document.body.style.overflow = "hidden";
    popupAccount.classList.add("show");
  });

  function handleClose() {
    popupAccount.classList.remove("show");

    if (popupOverlay) popupOverlay.classList.remove("show");

    document.body.classList.remove("popup-open");
    document.body.style.overflow = "";
  }

  if (closeAccountBtn) {
    closeAccountBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleClose();
    });
  }

  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      handleClose();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popupAccount.classList.contains("show")) {
      handleClose();
    }
  });
});

// ------ Render Account List ------ //
async function renderAccountList() {
  const wrapper = document.querySelector(".wrapper-account");
  if (!wrapper) return;

  const savedRaw = localStorage.getItem("saved_accounts");
  const accounts = savedRaw ? JSON.parse(savedRaw) : [];

  if (accounts.length === 0) {
    wrapper.innerHTML = '<p class="no-accounts">No saved accounts.</p>';
    return;
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const activeUserId = session?.user?.id;

  let html = "";
  accounts.forEach((acc, index) => {
    const isActive = acc.user_id === activeUserId;
    const avatarSrc = acc.avatar || "../Asset/User.png";
    const email = acc.email;

    html += `
            <div class="column-account">
                <div class="column-box-account">
                    <img src="${avatarSrc}" onerror="this.src='Asset/Nexion.png'" />
                    <div class="wrapper-active-account">
                        <p class="usernmae-account">${email}</p>
                        ${isActive ? '<p class="text-account-active">Active account</p>' : ""}
                    </div>
                </div>
                <div class="column-box-account">
                    ${
                      isActive
                        ? ""
                        : `<button class="btn btn-switch" data-refresh="${acc.refresh_token}">Switch</button>`
                    }
                    <div class="btn btn-logout logout-account" data-id="${acc.user_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 860" width="20px" fill="#e3e3e3">
                            <path d="M263.79-408Q234-408 213-429.21t-21-51Q192-510 213.21-531t51-21Q294-552 315-530.79t21 51Q336-450 314.79-429t-51 21Zm216 0Q450-408 429-429.21t-21-51Q408-510 429.21-531t51-21Q510-552 531-530.79t21 51Q552-450 530.79-429t-51 21Zm216 0Q666-408 645-429.21t-21-51Q624-510 645.21-531t51-21Q726-552 747-530.79t21 51Q768-450 746.79-429t-51 21Z"/>
                        </svg>
                    </div>
                </div>
            </div>
            ${index < accounts.length - 1 ? '<div class="line-gap"></div>' : ""}
        `;
  });

  wrapper.innerHTML = html;

  document.querySelectorAll(".btn-switch").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const refreshToken = e.currentTarget.dataset.refresh;
      switchToAccount(refreshToken);
    });
  });

  document.querySelectorAll(".logout-account").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const userId = e.currentTarget.dataset.id;
      removeAccount(userId, e.currentTarget);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof supabaseClient !== "undefined") {
    renderAccountList();
  }
});

// ------ Switch Akun ------ //
async function switchToAccount(refreshToken) {
  const savedRaw = localStorage.getItem("saved_accounts");
  const savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];
  const account = savedAccounts.find(
    (acc) => acc.refresh_token === refreshToken,
  );

  if (!account) {
    showToast("Account not found");
    renderAccountList();
    return;
  }

  try {
    localStorage.removeItem("avatar");
    localStorage.removeItem("dbperpetual");
    localStorage.removeItem("dbspot");

    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw error;
    if (!data.session) throw new Error("No session returned after refresh!");

    console.log("Switched to:", data.session.user.email);

    if (account.avatar) {
      localStorage.setItem("avatar", account.avatar);
      console.log("Avatar new save LS");
    } else {
      localStorage.removeItem("avatar");
    }

    const isGithub = window.location.hostname.includes("github.io");
    const target = isGithub ? "/Nexion-Trades-Full/Dashboard" : "/Dashboard";
    window.location.href = target;
  } catch (err) {
    console.warn("Refresh token expired, removing account");

    const savedRaw = localStorage.getItem("saved_accounts");
    let savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];

    savedAccounts = savedAccounts.filter(
      (acc) => acc.refresh_token !== refreshToken,
    );

    localStorage.setItem("saved_accounts", JSON.stringify(savedAccounts));

    showToast("Session expired");
    window.location.href = signinTarget;
  }
}

// ------ Logout Akun ------ //
function removeAccount(accountId, anchorBtn) {
  showLogoutPopup(anchorBtn, accountId);
}

document
  .querySelector(".signout-btn-universal")
  ?.addEventListener("click", async () => {
    const savedRaw = localStorage.getItem("saved_accounts");
    let savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const activeUserId = session?.user?.id;

    const accountIdToLogout = activeLogoutPopup.accountId || activeUserId;
    const isActiveAccount = activeUserId === accountIdToLogout;

    savedAccounts = savedAccounts.filter(
      (acc) => acc.user_id !== accountIdToLogout,
    );
    localStorage.setItem("saved_accounts", JSON.stringify(savedAccounts));

    if (isActiveAccount) {
      await supabaseClient.auth.signOut();
      localStorage.removeItem("avatar");
      localStorage.removeItem("dbperpetual");
      localStorage.removeItem("dbspot");

      const isGithub = window.location.hostname.includes("github.io");
      const target = isGithub ? "/Nexion-Trades-Full" : "/";
      window.location.href = target;
    } else {
      hideLogoutPopup();
      renderAccountList();
    }
  });

// ------ Add Account ------ //
document.querySelector(".btn-add-account")?.addEventListener("click", () => {
  const isGithub = window.location.hostname.includes("github.io");
  const loginPage = isGithub ? "/Nexion-Trades-Full/Signin" : "/Signin";
  window.location.href = loginPage;
});
