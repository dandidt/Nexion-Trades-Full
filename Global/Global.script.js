// ────── Animation Up ────── //
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.fade-up');
    elements.forEach((el, index) => {
        setTimeout(() => el.classList.add('show'), index * 100);
    });
});

// ────── Block 1000px ────── //
function checkDeviceWidth() {
    const minWidth = 999;
    let overlay = document.getElementById("Block");

    if (window.innerWidth < minWidth) {
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "Block";

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