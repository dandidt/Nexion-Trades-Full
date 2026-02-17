// ───────── LOGIN ───────── //
const supabaseUrl = "https://olnjccddsquaspnacqyw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
  const { data, error } = await supabaseClient.auth.getUser();
  const user = data?.user;

  const boxNoLogin = document.querySelector(".box-no-loggin");
  const boxLogin = document.querySelector(".box-loggin");
  const profileImg = document.querySelector(".box-profile img");
  const emailAccount = document.getElementById("emailAccount");

  if (user) {
    if (boxLogin) boxLogin.style.display = "flex";
    if (boxNoLogin) boxNoLogin.style.display = "none";

    if (emailAccount) emailAccount.textContent = user.email;

    const cachedAvatar = localStorage.getItem("avatar");
    if (profileImg) {
      profileImg.src = cachedAvatar || "Asset/User.png";
    }
  } else {
    if (boxNoLogin) boxNoLogin.style.display = "flex";
    if (boxLogin) boxLogin.style.display = "none";

    if (emailAccount) emailAccount.textContent = "";

    if (profileImg) {
      profileImg.src = "Asset/User.png";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
});

// ----- Logout ----- //
async function handleLogout() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const currentUserId = session?.user?.id;

    localStorage.removeItem("avatar");
    localStorage.removeItem("dbtrade");
    localStorage.removeItem("dbnotes");

    const savedRaw = localStorage.getItem("saved_accounts");
    let savedAccounts = savedRaw ? JSON.parse(savedRaw) : [];
    savedAccounts = savedAccounts.filter(
      (acc) => acc.user_id !== currentUserId,
    );
    localStorage.setItem("saved_accounts", JSON.stringify(savedAccounts));

    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Gagal logout. Silakan coba lagi.");
  }
}

// ----- Event Modal Logout -----
document.getElementById("logoutAccount")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("logoutConfirm").style.display = "flex";
});

document.getElementById("cancelLogoutBtn")?.addEventListener("click", () => {
  document.getElementById("logoutConfirm").style.display = "none";
});

document.getElementById("confirmLogoutBtn")?.addEventListener("click", () => {
  handleLogout();
});

// ───────── Navbar ───────── //
const navbar = document.querySelector(".navbar");
let lastScrollY = 0;

lenis.on('scroll', (e) => {
  if (e.scroll > 200) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  if (e.scroll > 100) { 
    if (e.direction === 1) {
      navbar.classList.add("nav-hidden");
    } else {
      navbar.classList.remove("nav-hidden"); 
    }
  } else {
    navbar.classList.remove("nav-hidden");
  }
});

const buttons = document.querySelectorAll(".button-section");
const popupNavbar = document.getElementById("popup-container");
const list = document.getElementById("popup-list");
const wrapper = document.querySelector(".wrapper-menu-navbar");

let activeType = null;
let isOpen = false;
let hideTimeout = null;
let isMouseOnPopup = false;
let isMouseOnButton = false;

const content = {
  product: [
    { 
      name: "Statistic Global", 
      url: "/Dashboard/",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z"/></svg>`
    },
    { 
      name: "Dashboard Tabel", 
      url: "/Dashboard/",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z"/></svg>` 
    },
    { 
      name: "Statistic", 
      url: "/Dashboard/#Header-Statistic",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M640-160v-280h160v280H640Zm-240 0v-640h160v640H400Zm-240 0v-440h160v440H160Z"/></svg>` 
    },
    { 
      name: "Chart Balance", 
      url: "/Dashboard/#Chart-Balance-Target",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80H200Zm40-120v-360h160v360H240Zm200 0v-560h160v560H440Zm200 0v-200h160v200H640Z"/></svg>` 
    },
    { 
      name: "Calender Trade", 
      url: "/Dashboard/#Calender-Trade",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm80 240v-80h400v80H280Zm0 160v-80h280v80H280Z"/></svg>` 
    },
    { 
      name: "Pairs Allocation", 
      url: "/Dashboard/#Pairs-Allocation",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M520-520h278q-15-110-91.5-186.5T520-798v278Zm-80 358v-636q-121 15-200.5 105.5T160-480q0 122 79.5 212.5T440-162Zm80 0q110-14 187-91t91-187H520v278Zm-40-318Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Z"/></svg>` 
    },
    { 
      name: "Pars Performance", 
      url: "/Dashboard/#Pairs-Performance",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M521-878q143 14 243.5 114.5T879-520H593q-9-26-27.5-45.5T521-594v-284Zm80 102v136q11 9 21 19t19 21h136q-24-60-70-106t-106-70ZM441-878v284q-36 13-58 44.5T361-480q0 38 22 68.5t58 43.5v286Q287-97 184-211T81-480q0-155 103-269t257-129Zm-80 102q-91 35-145.5 116T161-480q0 99 54.5 180T361-182v-138q-38-29-59-70.5T281-480q0-48 21-89.5t59-70.5v-136Zm232 336h286q-14 143-114.5 243.5T521-82v-286q26-9 44.5-27.5T593-440Zm48 80q-8 11-18.5 21T601-320v136q60-24 106-70t70-106H641ZM281-479Zm360-121Zm0 240Z"/></svg>` 
    },
  ],
  ecosystem: [
    { 
      name: "Jurnaling", 
      url: "https://nexiontrade.xyz/Dashboard/",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M270-80q-45 0-77.5-30.5T160-186v-558q0-38 23.5-68t61.5-38l395-78v640l-379 76q-9 2-15 9.5t-6 16.5q0 11 9 18.5t21 7.5h450v-640h80v720H270Zm90-233 200-39v-478l-200 39v478Zm-80 16v-478l-15 3q-11 2-18 9.5t-7 18.5v457q5-2 10.5-3.5T261-293l19-4Zm-40-472v482-482Z"/></svg>`
    },
    { 
      name: "Directory", 
      url: "https://directory.nexiontrade.xyz",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M543.5-63.5Q520-87 520-120q0-23 11-41t29-29v-221q-18-11-29-28.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 23-11 40.5T640-411v115l160-53v-62q-18-11-29-28.5T760-480q0-33 23.5-56.5T840-560q33 0 56.5 23.5T920-480q0 23-11 40.5T880-411v119l-240 80v22q18 11 29 29t11 41q0 33-23.5 56.5T600-40q-33 0-56.5-23.5ZM160-160v-560 560Zm0 0q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480h280v80H160Z"/></svg>`
    },
  ]
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function updatePopup(btn, type) {
  const rect = btn.getBoundingClientRect();
  const parentRect = btn.parentElement.getBoundingClientRect();

  list.innerHTML = "";

  void list.offsetHeight;

  const titleHTML = `
    <div class="popup-title">
      ${type.toUpperCase()}
    </div>
  `;

  list.innerHTML = titleHTML + content[type]
    .map(
      (item, i) => `
        <li style="transition-delay:${i * 0.08}s">
         <a href="#" class="list-item-content protected-link" data-url="${item.url}">
            <span class="icon-wrapper">${item.icon}</span>
            <span class="text-wrapper">${item.name}</span>
            <svg class="icon-navbar" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="#e3e3e3">
              <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
            </svg>
          </a>
        </li>
      `
    )
    .join("");

  const centerX = rect.left - parentRect.left + rect.width / 2;
  popupNavbar.style.left = `${centerX}px`;

  requestAnimationFrame(() => {
    const contentHeight = list.offsetHeight + 44;
    popupNavbar.style.height = `${contentHeight}px`;

    requestAnimationFrame(() => {
      list.classList.add("animate-in");
    });
  });
}

document.addEventListener("click", async (e) => {
  const link = e.target.closest(".protected-link");
  if (!link) return;

  e.preventDefault();

  const targetUrl = link.dataset.url;

  if (!targetUrl.startsWith("/Dashboard")) {
    window.location.href = targetUrl;
    return;
  }

  const { data } = await supabaseClient.auth.getUser();

  if (data?.user) {
    window.location.href = targetUrl;
  } else {
    window.location.href = "Signin";
  }
});

function showPopup(btn, type) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  buttons.forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');

  if (!isOpen) {
    popupNavbar.classList.add("active");
    updatePopup(btn, type);
    isOpen = true;
  } else if (activeType !== type) {
    list.classList.remove("animate-in");
    void list.offsetHeight;
    updatePopup(btn, type);
  }

  buttons.forEach(b => b.classList.remove('open'));
  btn.classList.add('open');

  activeType = type;
}

function scheduleHidePopup(delay = 100) {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }

  if (!isMouseOnPopup && !isMouseOnButton) {
    hideTimeout = setTimeout(() => {
      hidePopup();
    }, delay);
  }
}

function hidePopup() {
  popupNavbar.classList.remove("active");
  list.classList.remove("animate-in");
  popupNavbar.style.height = "0px";
  
  buttons.forEach(b => {
      b.classList.remove('open');
      b.classList.remove('is-active'); 
  });

  isOpen = false;
  activeType = null;
  isMouseOnPopup = false;
  isMouseOnButton = false;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

buttons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    isMouseOnButton = true;

    const type = btn.dataset.type;

    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    if (!type || !content[type]) {
      return;
    }

    showPopup(btn, type);
  });

  btn.addEventListener("mouseleave", () => {
    isMouseOnButton = false;
    scheduleHidePopup(150);
  });
});

popupNavbar.addEventListener("mouseenter", () => {
  isMouseOnPopup = true;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
});

popupNavbar.addEventListener("mouseleave", () => {
  isMouseOnPopup = false;
  scheduleHidePopup(100);
});

const debouncedWrapperLeave = debounce(() => {
  if (!isMouseOnPopup && !isMouseOnButton) {
    scheduleHidePopup(50);
  }
}, 50);

wrapper.addEventListener("mouseleave", debouncedWrapperLeave);

document.addEventListener("mouseleave", (e) => {
  if (e.relatedTarget === null) {
    hidePopup();
  }
});

let scrollTimeout;
window.addEventListener(
  "scroll",
  () => {
    if (isOpen) {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        hidePopup();
      }, 100);
    }
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  if (isOpen) {
    hidePopup();
  }
});

// ───────── Popup Profile Menu ───────── //
const profileBox = document.querySelector(".box-profile");
const popup = document.querySelector(".container-profile");

function positionPopup() {
  const rect = profileBox.getBoundingClientRect();
  popup.style.top = `${rect.bottom + 6}px`;
  popup.style.left = `${rect.right - popup.offsetWidth}px`;
}

profileBox.addEventListener("click", () => {
  profileBox.classList.toggle("active");

  if (popup.style.display === "block") {
    popup.style.display = "none";
    window.removeEventListener("scroll", positionPopup);
    window.removeEventListener("resize", positionPopup);
  } else {
    popup.style.display = "block";
    positionPopup();
    window.addEventListener("scroll", positionPopup);
    window.addEventListener("resize", positionPopup);
  }
});

// ───────── Introduction ───────── //
async function checkAuthStatusAndRedirectLink() {
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user;

  const link = document.getElementById("dynamicLink");
  if (!link) return;

  if (user) {
    link.href = "../Dashboard";
  } else {
    link.href = "../Signin";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatusAndRedirectLink();
});

// ───────── Features ───────── //
document.addEventListener("DOMContentLoaded", () => {
  const featureBoxes = document.querySelectorAll(".box-features");

  featureBoxes.forEach((boxFeature) => {
    const wrapper = boxFeature.querySelector(".wrapper-ekspor");
    if (!wrapper) return;
    const rows = wrapper.querySelectorAll(".row-ekspor");

    rows.forEach((row) => {
      const firstBox = row.querySelector(".box-files");
      if (!firstBox) return;

      const svgClone = firstBox.innerHTML;

      for (let i = 0; i < 7; i++) {
        const newBox = document.createElement("div");
        newBox.className = "box-files";
        newBox.innerHTML = svgClone;
        row.appendChild(newBox);
      }

      const boxes = Array.from(row.children);
      boxes.forEach((box) => {
        const clone = box.cloneNode(true);
        row.appendChild(clone);
      });
    });

    let isHovered = false;
    let animationId = null;
    let offset = 0;
    const speed = 0.2;

    const animate = () => {
      if (isHovered) {
        offset -= speed;
        rows.forEach((row) => {
          row.style.transform = `translateX(${offset}px)`;
          const totalWidth = row.scrollWidth / 2;
          if (Math.abs(offset) >= totalWidth) {
            offset = 0;
          }
        });
      }
      animationId = requestAnimationFrame(animate);
    };

    boxFeature.addEventListener("mouseenter", () => {
      isHovered = true;
      if (!animationId) animate();
    });

    boxFeature.addEventListener("mouseleave", () => {
      isHovered = false;
    });

    wrapper.style.overflow = "hidden";
    rows.forEach((row) => {
      row.style.display = "flex";
      row.style.flexWrap = "nowrap";
      row.style.gap = "10px";
      row.style.transition = "transform 0s linear";
    });
  });
});

// ───────── Tabel ───────── //
const containerTabel = document.getElementById("boxFeaturesFrist");
const svgWrapperTabel = document.getElementById("svgWrapperTabel");
const canvasTabel = document.getElementById("svgCanvasTabel");
const ctxTabel = canvasTabel.getContext("2d");

const svgPathTabel =
  "m 4.2167657,58.450601 c 0,-0.197952 -0.1384029,-0.241449 -1.3141402,-0.41299 C 2.3999625,57.964291 1.8082284,57.836604 1.5876607,57.753887 1.3670929,57.671177 0.99584509,57.571758 0.76266473,57.532962 0.52948605,57.494162 0.19502661,57.387466 0.01942371,57.29588 c -0.1756016,-0.09161 -0.3964595,-0.167173 -0.4907943,-0.167949 -0.094342,-0.0011 -0.3258819,-0.08429 -0.5145527,-0.185594 C -1.1745917,56.841025 -1.7148713,56.619804 -2.1865429,56.450734 -2.6582158,56.281653 -3.1517359,56.084419 -3.2832568,56.012416 -3.558569,55.861705 -4.3484674,55.566301 -4.9308182,55.396269 -5.1509311,55.331989 -5.6090393,55.14981 -5.9488361,54.99142 -6.2886329,54.833029 -6.8289113,54.611029 -7.149457,54.498079 c -0.7600146,-0.267784 -2.5444199,-0.951188 -3.555773,-1.361835 -1.240571,-0.5037 -3.170598,-1.239385 -3.487517,-1.329354 -0.157222,-0.04463 -0.337316,-0.119355 -0.400207,-0.16606 -0.06289,-0.04669 -0.551713,-0.248327 -1.086274,-0.448063 -0.534564,-0.199735 -1.074842,-0.409748 -1.20062,-0.466697 -0.125772,-0.05694 -0.485966,-0.201763 -0.800414,-0.321812 -0.314449,-0.120048 -0.854728,-0.333323 -1.200622,-0.473944 -0.345892,-0.140618 -1.22063,-0.474408 -1.94386,-0.741752 -0.723231,-0.267346 -1.479639,-0.571379 -1.680909,-0.675632 -0.201268,-0.104251 -0.451613,-0.18955 -0.556326,-0.18955 -0.104707,0 -0.57495,-0.180092 -1.044973,-0.400206 -0.470024,-0.220114 -0.914323,-0.401004 -0.987327,-0.401977 -0.073,-10e-4 -0.593339,-0.206793 -1.156293,-0.457379 -0.562954,-0.250584 -1.092994,-0.455609 -1.177865,-0.455609 -0.08488,0 -0.627647,-0.199462 -1.20617,-0.443249 -0.578522,-0.243789 -1.257681,-0.508131 -1.509238,-0.587432 -0.251559,-0.07931 -0.6632,-0.236362 -0.914758,-0.349026 -0.251559,-0.11266 -0.817566,-0.343394 -1.257792,-0.512737 -0.440229,-0.169342 -0.954781,-0.376551 -1.14345,-0.460464 -0.346463,-0.154097 -1.564817,-0.614081 -3.15115,-1.189703 -0.47534,-0.172484 -0.972199,-0.371376 -1.104129,-0.441984 -0.131926,-0.0706 -0.694936,-0.292031 -1.251123,-0.492052 -0.556188,-0.200021 -1.114161,-0.429134 -1.23994,-0.509139 -0.125773,-0.08001 -0.485965,-0.230779 -0.800413,-0.335058 -6.065409,-2.011444 -12.395379,-9.84764 -13.759477,-17.033563 -0.131326,-0.691785 -0.30404,-1.566524 -0.383821,-1.943861 -0.253685,-1.199847 -0.280998,-43.134125 -0.02926,-44.934115 1.009627,-7.219292 5.959689,-13.392974 12.285875,-15.322856 5.530316,-1.687091 8.617843,-1.444402 15.322202,1.20438 2.607725,1.030267 2.439768,1.181181 2.526595,-2.270241 0.212031,-8.428442 3.745877,-14.32485 10.515491,-17.545657 1.649364,-0.784724 2.075971,-0.930603 4.509841,-1.542148 1.2716161,-0.319511 5.9423626,-0.287269 7.2037227,0.04973 1.97986141,0.528958 2.29966571,0.62356 2.64720991,0.783074 0.1981734,0.09096 0.42972286,0.167122 0.51455149,0.169255 0.0848286,0.0022 0.36005729,0.103291 0.61161503,0.224809 0.25155917,0.12151 0.49879517,0.222676 0.54941157,0.22481 0.050616,0.0022 0.3078942,0.09999 0.5717245,0.217452 0.2638302,0.11746 1.0456991,0.430283 1.7374846,0.695153 0.6917854,0.264871 1.5922506,0.611069 2.0010332,0.769332 0.4087825,0.158261 1.3349759,0.516787 2.0582067,0.796724 3.0922733,1.196908 6.0379603,2.360767 6.4921253,2.565083 0.268963,0.121002 0.539498,0.219997 0.601188,0.219997 0.06169,0 1.616831,0.596058 3.45587,1.324575 1.839039,0.728518 3.678166,1.451354 4.08695,1.606305 0.970211,0.36776 1.241293,0.473118 3.144481,1.222127 1.588334,0.625099 2.557328,1.002854 5.088343,1.983659 0.72323,0.280262 2.627072,1.023877 4.230757,1.652475 1.603687,0.628599 3.327434,1.300482 3.830551,1.493076 7.77421,2.975957 13.978434,9.910999 15.255312,17.052287 0.06531,0.365254 0.144617,0.705977 0.176261,0.757161 0.03164,0.05119 0.136773,0.620813 0.233664,1.265842 0.199497,1.328267 0.216169,1.372139 0.521298,1.372139 0.218924,0 0.221942,0.29874 0.221942,21.95419997 0,21.65545903 -0.0029,21.95419903 -0.221942,21.95419903 -0.304581,0 -0.344601,0.0932 -0.529463,1.232831 -0.317684,1.958512 -1.055722,4.171005 -1.845605,5.532752 -0.20678,0.356476 -0.375955,0.678304 -0.375955,0.715173 0,0.09848 -0.983577,1.503496 -1.608417,2.297595 -0.993378,1.262468 -3.273891,3.282291 -4.566201,4.044227 -4.261417,2.5125 -8.602774,3.290822 -13.53132,2.425904 -0.655341,-0.115001 -4.024916,-1.209854 -4.249294,-1.380687 -0.0629,-0.04788 -0.397348,-0.178102 -0.743242,-0.289378 -0.345892,-0.111282 -0.80899,-0.292163 -1.029103,-0.401967 -0.220114,-0.109806 -0.837576,-0.35581 -1.372137,-0.54668 -0.53457,-0.190869 -1.512218,-0.56175 -2.172558,-0.824179 -1.097742,-0.436256 -2.029415,-0.796228 -3.08731,-1.192842 -1.029934,-0.386133 -3.869153,-1.502245 -4.859654,-1.910358 -0.314448,-0.129557 -0.92847,-0.360368 -1.364493,-0.512909 -0.436023,-0.152541 -0.847665,-0.32193 -0.914758,-0.376421 -0.06709,-0.05449 -0.302082,-0.153761 -0.522196,-0.22059 C 11.498072,30.625778 10.45078,30.23764 10.334211,30.146011 10.271317,30.096585 9.8143137,29.917418 9.3186386,29.747877 8.8229619,29.578335 8.3341377,29.392341 8.2323632,29.334551 8.1305916,29.276763 7.8414949,29.15739 7.5899373,29.069282 7.3383781,28.981178 6.9524653,28.84584 6.7323513,28.768546 6.5122374,28.691251 6.1777781,28.558424 5.9891094,28.473378 5.8004409,28.388334 5.2249256,28.165629 4.7101854,27.978486 4.1954484,27.791342 3.6808958,27.590281 3.5667381,27.531684 3.2350402,27.361424 2.1078272,26.940905 1.9831383,26.940905 c -0.062601,0 -0.2931585,-0.09571 -0.5123416,-0.212699 -0.2191816,-0.116992 -0.8040663,-0.352328 -1.29974189,-0.522985 -0.4956759,-0.170659 -0.9845004,-0.355604 -1.0862768,-0.410988 -0.35002751,-0.190482 -1.30055931,-0.568501 -1.42878721,-0.568217 -0.070612,1.12e-4 -0.4885822,-0.152343 -0.9288081,-0.338885 -1.1482685,-0.486569 -2.1388788,-0.87998 -3.3160005,-1.316919 -0.5660065,-0.210097 -1.3121061,-0.490558 -1.6579997,-0.623247 -0.7400824,-0.283904 -3.4867515,-0.972033 -4.6309645,-1.160203 -1.51948,-0.249887 -6.796765,-0.171434 -8.182732,0.121649 -5.715521,1.208607 -9.798163,3.270401 -11.334288,5.72398 -0.726975,1.16116 -0.737694,4.075159 -0.0181,4.920418 0.08453,0.09927 0.15368,0.245242 0.15368,0.324345 0,0.31379 1.434244,1.637336 2.17255,2.004867 0.785382,0.390965 1.026543,0.489655 3.659034,1.497347 2.250381,0.861428 2.413038,0.924502 5.545723,2.150473 3.017935,1.181062 5.141839,2.008251 6.803515,2.649736 0.597451,0.230645 1.67801,0.651174 2.401241,0.934509 0.72323,0.283334 1.649424,0.641694 2.0582071,0.79635 0.408782,0.154658 0.9747877,0.379922 1.2577921,0.50059 0.2830033,0.120664 1.0805592,0.433661 1.7723438,0.695541 1.3429112,0.508368 2.1497214,0.821204 4.0592401,1.573943 0.6603413,0.260309 1.457896,0.572366 1.77234381,0.69346 0.3144478,0.121094 1.29209686,0.502028 2.17255229,0.846519 3.7040263,1.449256 6.3733583,1.251987 9.3388978,-0.690159 1.015786,-0.665243 2.953166,-2.902203 2.953166,-3.40982 0,-0.03824 0.09708,-0.285393 0.215743,-0.549223 0.118664,-0.26383 0.253758,-0.657732 0.300223,-0.875337 0.369887,-1.732245 0.09689,-1.752446 5.601481,0.414497 4.65666,1.833149 4.361061,1.53804 3.653091,3.647053 -0.314161,0.935866 -1.010152,2.568722 -1.288644,3.023266 -0.940408,1.534901 -1.815214,2.742437 -2.762445,3.813136 -2.179462,2.463548 -6.636973,4.822777 -10.2932398,5.447923 -1.0143923,0.173437 -1.1434474,0.219578 -1.1434474,0.408782 0,0.135573 -0.3253053,0.163812 -1.8866892,0.163812 -1.5613839,0 -1.8866893,-0.02825 -1.8866893,-0.163812 z M 38.324043,28.376134 c 3.134871,-0.973833 5.507525,-3.502407 6.241883,-6.652072 0.387492,-1.66196 0.382502,-35.718867 -0.0054,-36.868424 -0.740825,-2.195438 -2.653476,-3.716545 -4.845135,-3.853277 -4.163591,-0.259759 -11.710316,7.588146 -13.717583,14.265037 -0.08508,0.2830033 -0.20814,0.6689165 -0.273471,0.8575862 -0.351776,1.0159125 -0.582619,1.8498124 -0.583817,2.1089938 -6.86e-4,0.1607353 -0.111233,0.7038869 -0.245527,1.20700425 C 24.633435,0.42084469 24.41033,23.072186 24.64843,24.473913 c 0.101121,0.595288 0.480346,0.908313 1.453152,1.199469 0.195391,0.05848 0.895533,0.319659 1.555875,0.580401 0.66034,0.260741 1.457895,0.568195 1.772344,0.68323 0.314448,0.115036 1.060548,0.401515 1.658,0.636625 2.794342,1.099632 2.630129,1.061197 4.57379,1.070514 1.567512,0.0076 1.875219,-0.02347 2.662461,-0.268018 z M 14.520672,20.807944 C 14.722505,20.564748 14.714476,7.6006796 14.511595,6.2444978 14.441055,5.7728255 14.33516,4.9495429 14.276277,4.4149811 14.135244,3.1346177 13.520014,0.82941014 12.903008,-0.73053455 12.76619,-1.076428 12.586382,-1.5395244 12.503418,-1.7596374 12.378231,-2.0917743 11.776491,-3.2913322 10.756905,-5.2412727 8.468919,-9.6170032 1.400286,-15.470277 -2.899185,-16.549376 c -0.1662238,-0.04172 -0.6353582,-0.230047 -1.0425212,-0.418505 -0.4071607,-0.188455 -0.7784224,-0.34265 -0.8250248,-0.34265 -0.088392,0 -2.3175491,-0.858741 -3.3086237,-1.274581 -0.314449,-0.131943 -1.0413472,-0.408481 -1.6153302,-0.61454 -0.5739831,-0.20606 -1.1521291,-0.432732 -1.2847651,-0.503718 -0.132635,-0.07098 -0.589211,-0.250929 -1.014603,-0.39987 -0.425389,-0.148942 -1.030715,-0.376391 -1.345163,-0.505435 -0.314449,-0.12905 -1.03482,-0.41329 -1.600827,-0.631646 -0.566006,-0.218357 -1.505381,-0.583944 -2.087496,-0.812416 -0.582115,-0.22847 -1.508308,-0.587336 -2.058205,-0.797479 -0.549898,-0.210141 -1.540093,-0.596857 -2.200434,-0.859369 -0.660343,-0.262511 -1.635201,-0.630196 -2.166354,-0.817077 -0.531153,-0.186881 -1.019977,-0.383251 -1.086275,-0.436381 -0.06629,-0.05312 -0.557913,-0.251941 -1.092475,-0.441808 -1.33727,-0.474976 -3.074457,-1.142625 -3.487516,-1.340349 -0.5058,-0.242119 -2.941251,-1.178063 -4.059239,-1.559965 -5.14459,-1.757384 -10.412549,1.033712 -11.902989,6.306498 -0.435925,1.54219 -0.432774,35.996484 0.0034,37.162058 1.20792,3.227897 4.433048,4.604757 7.382971,3.151911 4.512254,-2.222301 9.281302,-8.059655 11.122847,-13.614459 1.358835,-4.09876664 1.311957,-3.6571203 1.389646,-13.092479 0.07684,-9.331612 -0.08843,-8.540213 1.64346,-7.870011 2.165223,0.83789 5.262111,2.03821 6.557692,2.541689 1.971346,0.766087 1.796113,0.3287 1.875239,4.6806868 0.0388,2.1341961 0.116992,3.7977502 0.18629,3.9636345 0.06568,0.1572239 0.156007,0.6654519 0.200719,1.1293965 0.04471,0.4639422 0.129709,0.9708625 0.188872,1.1264861 0.05917,0.1556247 0.178239,0.5993177 0.264601,0.9859831 0.158075,0.7077631 0.745089,2.46735548 1.035607,3.1042702 0.08606,0.1886689 0.292911,0.6517652 0.459671,1.0291032 0.388264,0.8785442 0.725316,1.5269991 1.55836,2.9981352 1.7183951,3.0346457 5.3010569,6.6346084 8.7017888,8.7438094 0.8321196,0.516098 3.7484969,2.036602 3.9062664,2.036602 0.07934,0 2.7590216,1.039677 6.8755473,2.667609 0.8804557,0.348187 2.0124685,0.788876 2.5155855,0.97931 0.503117,0.190433 1.455037,0.55198 2.115379,0.803437 1.379525,0.525309 1.405885,0.529874 1.613728,0.279439 z m 5.875881,-42.819253 c 0.817565,-0.122048 1.949579,-0.367901 2.515584,-0.546327 0.566008,-0.178427 1.17743,-0.359892 1.358719,-0.403258 2.730022,-0.65304 6.711416,-3.133641 7.540087,-4.69784 1.452046,-2.740881 -0.0065,-6.944594 -2.620874,-7.553775 -0.1826,-0.04255 -0.434912,-0.137034 -0.560692,-0.209951 -0.125772,-0.07293 -0.53742,-0.249721 -0.914757,-0.392878 -0.377338,-0.143157 -1.071983,-0.417458 -1.543655,-0.609555 -0.471672,-0.192094 -1.089134,-0.42168 -1.372138,-0.510187 -0.283003,-0.08851 -0.668918,-0.23099 -0.857586,-0.316633 -0.188669,-0.08564 -0.70322,-0.293376 -1.143447,-0.461632 -0.440228,-0.168255 -1.1606,-0.451031 -1.600828,-0.628391 -0.440227,-0.17736 -1.36642,-0.538718 -2.058205,-0.803018 -0.691788,-0.264299 -1.592253,-0.612449 -2.001035,-0.773665 -0.408783,-0.161218 -1.051972,-0.408819 -1.429309,-0.550226 -0.377339,-0.141403 -1.200621,-0.461319 -1.829517,-0.710915 -1.780675,-0.706715 -2.690746,-1.061208 -3.373172,-1.313925 -0.345893,-0.128094 -0.7832609,-0.300321 -0.9719311,-0.382731 -0.1886685,-0.08241 -0.6260362,-0.248898 -0.9719297,-0.369976 -0.345892,-0.121079 -1.3492687,-0.513229 -2.2297227,-0.871451 -0.8804557,-0.358222 -1.9095591,-0.771219 -2.2868963,-0.917771 -1.903405,-0.739254 -3.82336099,-1.464026 -4.23989469,-1.600535 -0.2565841,-0.0841 -0.7968625,-0.306059 -1.20062081,-0.493265 -0.6954652,-0.322458 -1.4051345,-0.566925 -2.8595311,-0.985059 -2.8918681,-0.831401 -6.9257076,0.686154 -8.9933626,3.383358 -1.668595,2.17664 -1.859343,3.035868 -1.859343,8.375405 0,4.586034 0.02597,4.75188 0.744126,4.75188 0.07786,0 0.392515,0.106231 0.699233,0.23608 0.761686,0.322442 0.920015,0.384852 1.643949,0.648024 2.2579041,0.820811 2.5533251,0.935571 3.576334,1.389254 0.3004081,0.133219 0.6091394,0.243975 0.6860694,0.246109 0.076923,0.0022 0.3456932,0.103292 0.5972507,0.224808 0.2515587,0.121511 0.5359775,0.222676 0.6320399,0.22481 0.09607,0.0022 0.2761579,0.07414 0.4002061,0.159996 0.1240495,0.08586 0.3541845,0.193433 0.5114095,0.239047 0.3313967,0.09614 1.6654712,0.596866 2.0010332,0.751059 0.1257877,0.0578 0.8461521,0.341643 1.6008282,0.63077 0.7546749,0.289128 1.68086781,0.645864 2.05820461,0.792746 1.74684699,0.679973 4.11488019,1.609539 5.25986149,2.064747 2.9439731,1.170424 4.4228692,1.620715 6.4033079,1.949665 2.540834,0.42203 6.00512,0.436064 8.690204,0.0352 z";

const scaleTabel = 2.1;
let mouseXTabel = 0,
  mouseYTabel = 0,
  isHoveringTabel = false;
let animationFrameIdTabel = null;

function resizeCanvasTabel() {
  const sizeTabel = Math.min(
    svgWrapperTabel.offsetWidth,
    svgWrapperTabel.offsetHeight,
  );
  canvasTabel.width = sizeTabel;
  canvasTabel.height = sizeTabel;
}
resizeCanvasTabel();
window.addEventListener("resize", resizeCanvasTabel);

function drawSVGTabel() {
  ctxTabel.clearRect(0, 0, canvasTabel.width, canvasTabel.height);

  const wTabel = canvasTabel.width;
  const hTabel = canvasTabel.height;
  const centerXTabel = wTabel / 2;
  const centerYTabel = hTabel / 2;

  ctxTabel.save();
  ctxTabel.translate(centerXTabel, centerYTabel);
  ctxTabel.scale(scaleTabel, scaleTabel);

  const pathTabel = new Path2D(svgPathTabel);

  ctxTabel.fillStyle = "rgba(45, 45, 45, 0.85)";
  ctxTabel.fill(pathTabel);

  ctxTabel.strokeStyle = "#808080";
  ctxTabel.lineWidth = 0.6;
  ctxTabel.stroke(pathTabel);

  if (isHoveringTabel) {
    const localXTabel = (mouseXTabel - centerXTabel) / scaleTabel;
    const localYTabel = (mouseYTabel - centerYTabel) / scaleTabel;

    const gradientRadiusTabel = 100;
    const gradientTabel = ctxTabel.createRadialGradient(
      localXTabel,
      localYTabel,
      0,
      localXTabel,
      localYTabel,
      gradientRadiusTabel,
    );

    gradientTabel.addColorStop(0, "rgba(52, 211, 153, 1)");
    gradientTabel.addColorStop(0.3, "rgba(52, 211, 153, 0.8)");
    gradientTabel.addColorStop(0.6, "rgba(52, 211, 153, 0.4)");
    gradientTabel.addColorStop(0.85, "rgba(52, 211, 153, 0.2)");
    gradientTabel.addColorStop(1, "rgba(52, 211, 153, 0)");

    ctxTabel.strokeStyle = gradientTabel;
    ctxTabel.lineWidth = 0.6;
    ctxTabel.stroke(pathTabel);
  }

  ctxTabel.restore();

  animationFrameIdTabel = requestAnimationFrame(drawSVGTabel);
}

drawSVGTabel();

containerTabel.addEventListener("mousemove", (e) => {
  const rectTabel = canvasTabel.getBoundingClientRect();
  mouseXTabel = e.clientX - rectTabel.left;
  mouseYTabel = e.clientY - rectTabel.top;
  isHoveringTabel = true;
});

containerTabel.addEventListener("mouseleave", () => {
  isHoveringTabel = false;
});

// ───────── Statistical ───────── //
var data = [
  { value: 45, profit: 1200 },
  { value: 52, profit: 1450 },
  { value: 38, profit: 980 },
  { value: 65, profit: 1890 },
  { value: 58, profit: 1650 },
  { value: 70, profit: 2100 },
  { value: 62, profit: 1820 },
];

var canvas = document.getElementById("chart");
var ctx = canvas.getContext("2d");
var tooltip = document.getElementById("tooltip");
var tooltipValue = document.getElementById("tooltipValue");
var tooltipProfit = document.getElementById("tooltipProfit");

var hoverX = null;

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  return { width: rect.width, height: rect.height };
}

function drawChart() {
  const { width, height } = setupCanvas();

  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(...data.map((d) => d.value));
  const paddingTop = height * 0.4;

  const points = data.map((point, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (point.value / maxValue) * (height - paddingTop),
  }));

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(52, 211, 153, 0.25)");
  gradient.addColorStop(1, "rgba(52, 211, 153, 0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, height);
  ctx.lineTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.lineTo(points[points.length - 1].x, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.strokeStyle = "rgb(52, 211, 153)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(52, 211, 153, 0.4)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (hoverX !== null) {
    ctx.beginPath();
    ctx.strokeStyle = "rgb(52, 211, 153)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(hoverX, 0);
    ctx.lineTo(hoverX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const parentRect = canvas.parentElement.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;

  const relativeX = x;
  const index = Math.round((relativeX / width) * (data.length - 1));

  if (index >= 0 && index < data.length) {
    const maxValue = Math.max(...data.map((d) => d.value));
    const pointX = (index / (data.length - 1)) * width;
    const pointY = height - (data[index].value / maxValue) * height;

    hoverX = pointX;

    tooltipValue.textContent = data[index].value + " Users";
    tooltipProfit.textContent = data[index].profit.toLocaleString();

    const offsetX = e.clientX - parentRect.left;
    const offsetY = e.clientY - parentRect.top;

    tooltip.style.left = offsetX + 15 + "px";
    tooltip.style.top = offsetY - 40 + "px";
    tooltip.classList.add("active");

    drawChart();
  } else {
    hoverX = null;
    tooltip.classList.remove("active");
    drawChart();
  }
});

canvas.addEventListener("mouseleave", function () {
  hoverX = null;
  tooltip.classList.remove("active");
  drawChart();
});

window.addEventListener("resize", drawChart);

drawChart();

// ───────── Reports ───────── //
document.querySelectorAll(".card-reports").forEach((cardReports) => {
  const containerReports = cardReports.closest(".card-container-reports");
  const canvasReports = cardReports.querySelector(".card-border-reports");
  const glowReports = cardReports.querySelector(".glow-reports");

  if (!canvasReports || !glowReports) return;

  const ctxReports = canvasReports.getContext("2d");

  function resizeCanvas() {
    canvasReports.width = cardReports.offsetWidth;
    canvasReports.height = cardReports.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let mouseX = 0,
    mouseY = 0,
    isHovering = false;
  let targetRotateX = 0,
    targetRotateY = 0;
  let currentRotateX = 0,
    currentRotateY = 0;
  let animationFrameId = null;
  function drawBorder() {
    ctxReports.clearRect(0, 0, canvasReports.width, canvasReports.height);
    const radius = 16,
      w = canvasReports.width,
      h = canvasReports.height;

    function drawRoundedRect() {
      ctxReports.beginPath();
      ctxReports.moveTo(radius, 0);
      ctxReports.lineTo(w - radius, 0);
      ctxReports.arcTo(w, 0, w, radius, radius);
      ctxReports.lineTo(w, h - radius);
      ctxReports.arcTo(w, h, w - radius, h, radius);
      ctxReports.lineTo(radius, h);
      ctxReports.arcTo(0, h, 0, h - radius, radius);
      ctxReports.lineTo(0, radius);
      ctxReports.arcTo(0, 0, radius, 0, radius);
      ctxReports.closePath();
    }

    drawRoundedRect();
    ctxReports.strokeStyle = "rgba(55, 55, 55, 1)";
    ctxReports.lineWidth = 2;
    ctxReports.stroke();

    if (isHovering) {
      drawRoundedRect();
      const gradientRadius = Math.max(w, h) * 0.8;
      const gradient = ctxReports.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        gradientRadius,
      );
      gradient.addColorStop(0, "rgba(144, 216, 190, 0.9)");
      gradient.addColorStop(0.2, "rgba(144, 216, 190, 0.8)");
      gradient.addColorStop(0.5, "rgba(144, 216, 190, 0.4)");
      gradient.addColorStop(0.8, "rgba(144, 216, 190, 0.2)");
      gradient.addColorStop(1, "rgba(144, 216, 190, 0)");
      ctxReports.strokeStyle = gradient;
      ctxReports.lineWidth = 3;
      ctxReports.stroke();
    }

    animationFrameId = requestAnimationFrame(drawBorder);
  }
  drawBorder();

  function animateRotation() {
    currentRotateX += (targetRotateX - currentRotateX) * 0.1;
    currentRotateY += (targetRotateY - currentRotateY) * 0.1;
    cardReports.style.transform = `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
    requestAnimationFrame(animateRotation);
  }
  animateRotation();

  function handle3DEffect(e, intensity = 1) {
    const rect = cardReports.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX = x;
    mouseY = y;
    isHovering = true;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    targetRotateX = ((y - centerY) / centerY) * -4 * intensity;
    targetRotateY = ((x - centerX) / centerX) * 4 * intensity;

    glowReports.style.left = `${x}px`;
    glowReports.style.top = `${y}px`;
    glowReports.style.transform = "translate(-50%, -50%)";
    glowReports.style.opacity = "1";
  }

  function reset3DEffect() {
    targetRotateX = 0;
    targetRotateY = 0;
    glowReports.style.opacity = "0";
    isHovering = false;
  }

  const parentBox = cardReports.closest(".box-features");
  if (parentBox) {
    parentBox.addEventListener("mousemove", (e) => handle3DEffect(e, 0.6));
    parentBox.addEventListener("mouseleave", reset3DEffect);
  }

  containerReports.addEventListener("mousemove", (e) => handle3DEffect(e, 1));
  containerReports.addEventListener("mouseleave", reset3DEffect);
});

const containerBg = document.getElementById("containerBgCard");
const totalRings = 8;
const duration = 60;
const interval = (duration / totalRings) * 1000;

for (let i = 0; i < totalRings; i++) {
  const ring = document.createElement("div");
  ring.className = "ring";
  ring.style.animation = `ripple ${duration}s linear infinite`;
  ring.style.animationDelay = `-${(i * interval) / 1000}s`;
  containerBg.appendChild(ring);
}

// ───────── Calculator ───────── //
const container = document.querySelector(".wrapper-line");
if (!container) {
  console.error("Element .wrapper-line tidak ditemukan!");
} else {
  const allDots = container.querySelectorAll(".dots");
  let isHovering = false;
  let animationId = null;
  let offsetX = 0;
  const speed = 0.2;

  function animate() {
    if (isHovering) {
      offsetX -= speed;
      allDots.forEach((dot) => {
        dot.style.backgroundPosition = `${-offsetX}px 0`;
      });
      animationId = requestAnimationFrame(animate);
    }
  }

  container.addEventListener("mouseenter", () => {
    isHovering = true;
    if (!animationId) animate();
  });

  container.addEventListener("mouseleave", () => {
    isHovering = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  });
}

// ───────── Preview ───────── //
document.addEventListener("DOMContentLoaded", () => {
  const radioTable = document.getElementById("table-editor");
  const radioSQL = document.getElementById("sql-editor");
  const informasiWrapper = document.querySelector(".wrapper-subinformasi");
  const videoPreview = document.querySelector(".preview-video source");
  const videoElement = document.querySelector(".preview-video");

  const DATA = {
    table: {
      video: "Asset/JURNAL.mp4",
      text: ["Simple Add", "UI Premium", "Automatic Caculate", "Filtering"],
    },
    sql: {
      video: "Asset/STATISTIC.mp4",
      text: [
        "All Data Filter",
        "Balance Chart",
        "Perfrom RR PnL Chart",
        "Pairs",
        "Chart",
        "Other All",
      ],
    },
  };

  function updateUI(type) {
    videoPreview.src = DATA[type].video;
    videoElement.load();
    videoElement.play();

    informasiWrapper.innerHTML = "";

    DATA[type].text.forEach((item) => {
      const row = document.createElement("div");
      row.className = "row-informasi";

      row.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                    <path d="M382-253.85 168.62-467.23 211.38-510 382-339.38 748.62-706l42.76 42.77L382-253.85Z"/>
                </svg>
                <p class="title-informasi">${item}</p>
            `;

      informasiWrapper.appendChild(row);
    });
  }

  radioTable.addEventListener("change", () => updateUI("table"));
  radioSQL.addEventListener("change", () => updateUI("sql"));

  updateUI("table");
});

// ───────── Community ───────── //
const hostname = window.location.hostname;
const protocol = window.location.protocol;

const isLocal =
  hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:";

const isGithub = hostname.includes("github.io");

const localJSON = "./Data/User.json";
const githubJSON =
  "https://raw.githubusercontent.com/dandidt/Nexion-Trades-Full/main/Data/User.json";

let jsonPath;

if (isLocal) {
  jsonPath = localJSON;
} else if (isGithub) {
  jsonPath = githubJSON;
} else {
  jsonPath = githubJSON;
}

fetch(jsonPath)
  .then((res) => res.json())
  .then((users) => {
    const container = document.querySelector(".container-community");
    container.style.display = "flex";
    container.style.gap = "10px";
    container.innerHTML = "";

    const wrappers = [];
    for (let i = 0; i < users.length; i += 3) {
      const wrapper = document.createElement("div");
      wrapper.className = "wrapper-column";
      users.slice(i, i + 3).forEach((user) => {
        const box = document.createElement("div");
        box.className = "box-comment";
        box.innerHTML = `
        <div class="box-row relative">
            <div class="box-discord">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="none" class="sbui-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5447 3.01094C12.5249 2.54302 11.4313 2.19828 10.2879 2.00083C10.2671 1.99702 10.2463 2.00654 10.2356 2.02559C10.0949 2.27573 9.93921 2.60206 9.83011 2.85856C8.60028 2.67444 7.3768 2.67444 6.17222 2.85856C6.06311 2.59636 5.90166 2.27573 5.76038 2.02559C5.74966 2.00717 5.72887 1.99765 5.70803 2.00083C4.56527 2.19764 3.47171 2.54239 2.45129 3.01094C2.44246 3.01475 2.43488 3.0211 2.42986 3.02935C0.355594 6.12826 -0.212633 9.151 0.06612 12.1362C0.067381 12.1508 0.0755799 12.1648 0.0869319 12.1737C1.45547 13.1787 2.78114 13.7889 4.08219 14.1933C4.10301 14.1996 4.12507 14.192 4.13832 14.1749C4.44608 13.7546 4.72043 13.3114 4.95565 12.8454C4.96953 12.8181 4.95628 12.7857 4.92791 12.7749C4.49275 12.6099 4.0784 12.4086 3.67982 12.18C3.64829 12.1616 3.64577 12.1165 3.67477 12.095C3.75865 12.0321 3.84255 11.9667 3.92264 11.9007C3.93713 11.8886 3.95732 11.8861 3.97435 11.8937C6.59287 13.0892 9.42771 13.0892 12.0153 11.8937C12.0323 11.8854 12.0525 11.888 12.0677 11.9C12.1478 11.9661 12.2316 12.0321 12.3161 12.095C12.3451 12.1165 12.3433 12.1616 12.3117 12.18C11.9131 12.413 11.4988 12.6099 11.063 12.7743C11.0346 12.7851 11.022 12.8181 11.0359 12.8454C11.2762 13.3108 11.5505 13.7539 11.8526 14.1742C11.8652 14.192 11.8879 14.1996 11.9087 14.1933C13.2161 13.7889 14.5417 13.1787 15.9103 12.1737C15.9223 12.1648 15.9298 12.1515 15.9311 12.1369C16.2647 8.6856 15.3723 5.68765 13.5655 3.02998C13.5611 3.0211 13.5535 3.01475 13.5447 3.01094ZM5.34668 10.3185C4.55833 10.3185 3.90876 9.59478 3.90876 8.70593C3.90876 7.81707 4.54574 7.09331 5.34668 7.09331C6.15393 7.09331 6.79722 7.82342 6.7846 8.70593C6.7846 9.59478 6.14762 10.3185 5.34668 10.3185ZM10.6632 10.3185C9.87481 10.3185 9.22527 9.59478 9.22527 8.70593C9.22527 7.81707 9.86221 7.09331 10.6632 7.09331C11.4704 7.09331 12.1137 7.82342 12.1011 8.70593C12.1011 9.59478 11.4704 10.3185 10.6632 10.3185Z" fill="currentColor"></path></svg>
            </div>
            <img class="profile-image" src="${user.profile.trim()}" />
            <p class="username">@${user.name}</p>
        </div>
        <div class="text-comment">${user.comment}</div>
        `;
        wrapper.appendChild(box);
      });
      wrappers.push(wrapper);
    }

    wrappers.forEach((w) => container.appendChild(w));
    wrappers.forEach((w) => container.appendChild(w.cloneNode(true)));

    let position = 0;
    const speed = 0.5;
    let isAnimating = true;
    let animationId = null;

    const animate = () => {
      if (!isAnimating) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      position -= speed;
      container.style.transform = `translateX(${position}px)`;

      if (Math.abs(position) >= container.scrollWidth / 2) {
        position = 0;
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    container.addEventListener("mouseenter", () => {
      isAnimating = false;
    });

    container.addEventListener("mouseleave", () => {
      isAnimating = true;
    });

    container.cleanupAnimation = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });

// ───────── Footer ───────── //
document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".subcontainer-menu span");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetClass = item.getAttribute("data-target");
      const targetSection = document.querySelector(`.${targetClass}`);

      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
