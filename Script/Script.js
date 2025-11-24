// ============== LOGGIN ============== //
const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
    const { data, error } = await supabaseClient.auth.getUser();
    const user = data?.user;

    const boxNoLogin = document.querySelector('.box-no-loggin');
    const boxLogin = document.querySelector('.box-loggin');
    const profileImg = document.querySelector('.box-profile img');
    const svgIcon = document.querySelector('.box-profile svg');
    const emailAccount = document.getElementById('emailAccount');

    if (user) {
        if (boxLogin) boxLogin.style.display = 'flex';
        if (boxNoLogin) boxNoLogin.style.display = 'none';

        if (emailAccount) emailAccount.textContent = user.email;

        const cachedAvatar = localStorage.getItem('avatar');
        if (cachedAvatar) {
            if (profileImg) {
                profileImg.src = cachedAvatar;
                profileImg.style.display = 'block';
            }
            if (svgIcon) svgIcon.style.display = 'none';
        } else {
            if (profileImg) profileImg.style.display = 'none';
            if (svgIcon) svgIcon.style.display = 'block';
        }
    } else {
        if (boxNoLogin) boxNoLogin.style.display = 'flex';
        if (boxLogin) boxLogin.style.display = 'none';
        if (emailAccount) emailAccount.textContent = '';
        if (profileImg) profileImg.style.display = 'none';
        if (svgIcon) svgIcon.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// ----- Logout ----- //
async function handleLogout() {
    try {
        localStorage.removeItem('avatar');
        localStorage.removeItem('dbtrade');

        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        window.location.href = "index.html";

    } catch (err) {
        console.error('Logout error:', err);
        alert('Gagal logout. Silakan coba lagi.');
    }
}


document.getElementById('logoutAccount')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('logoutModal').style.display = 'flex';
});

document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
});

document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
    handleLogout();
});

// ============== Navbar ============== //
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");

    if (window.scrollY > 0) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

// ============== Popup Profile Menu ============== //
const profileBox = document.querySelector('.box-profile');
const popup = document.querySelector('.container-profile');

function positionPopup() {
    const rect = profileBox.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 6}px`;
    popup.style.left = `${rect.right - popup.offsetWidth}px`;
}

profileBox.addEventListener('click', () => {
    profileBox.classList.toggle('active');

    if (popup.style.display === 'block') {
        popup.style.display = 'none';
        window.removeEventListener('scroll', positionPopup);
        window.removeEventListener('resize', positionPopup);
    } else {
        popup.style.display = 'block';
        positionPopup();
        window.addEventListener('scroll', positionPopup);
        window.addEventListener('resize', positionPopup);
    }
});


// ============== Introduction ============== //
async function checkAuthStatusAndRedirectLink() {
    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user;

    const link = document.getElementById('dynamicLink');
    if (!link) return;

    if (user) {
        // Sudah login
        link.href = 'Dashboard/dashboard.html';
    } else {
        // Belum login
        link.href = 'Html/signin.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatusAndRedirectLink();
});

// ============== Features ============== //
document.addEventListener('DOMContentLoaded', () => {
    const featureBoxes = document.querySelectorAll('.box-features');

    featureBoxes.forEach(boxFeature => {
        const wrapper = boxFeature.querySelector('.wrapper-ekspor');
        if (!wrapper) return;
        const rows = wrapper.querySelectorAll('.row-ekspor');

        // ==== 1. Isi tiap row ====
        rows.forEach(row => {
            const firstBox = row.querySelector('.box-files');
            if (!firstBox) return;

            const svgClone = firstBox.innerHTML;

            // Tambah beberapa box baru
            for (let i = 0; i < 7; i++) {
                const newBox = document.createElement('div');
                newBox.className = 'box-files';
                newBox.innerHTML = svgClone;
                row.appendChild(newBox);
            }

            // Duplikat isi row biar bisa infinite scroll
            const boxes = Array.from(row.children);
            boxes.forEach(box => {
                const clone = box.cloneNode(true);
                row.appendChild(clone);
            });
        });

        // ==== 2. Setup animasi untuk wrapper ini ====
        let isHovered = false;
        let animationId = null;
        let offset = 0;
        const speed = 0.2;

        const animate = () => {
            if (isHovered) {
                offset -= speed;
                rows.forEach(row => {
                    row.style.transform = `translateX(${offset}px)`;
                    const totalWidth = row.scrollWidth / 2;
                    if (Math.abs(offset) >= totalWidth) {
                        offset = 0;
                    }
                });
            }
            animationId = requestAnimationFrame(animate);
        };

        // ==== 3. Hover hanya berlaku untuk box ini ====
        boxFeature.addEventListener('mouseenter', () => {
            isHovered = true;
            if (!animationId) animate();
        });

        boxFeature.addEventListener('mouseleave', () => {
            isHovered = false;
        });

        // ==== 4. Inline style basic (aman tanpa CSS tambahan) ====
        wrapper.style.overflow = 'hidden';
        rows.forEach(row => {
            row.style.display = 'flex';
            row.style.flexWrap = 'nowrap';
            row.style.gap = '10px';
            row.style.transition = 'transform 0s linear';
        });
    });
});

// ============== Tabel ============== //
const containerTabel = document.getElementById('boxFeaturesFrist');
const svgWrapperTabel = document.getElementById('svgWrapperTabel');
const canvasTabel = document.getElementById('svgCanvasTabel');
const ctxTabel = canvasTabel.getContext('2d');

const svgPathTabel = "m23.04 975.87l25.95-40.19c.59-.92 59.63-92.3 88.3-132.72 9.96-14.04 20.14-28.28 29.99-42.04 10.01-14 20.37-28.48 30.49-42.75 5.76-8.13 11.54-16.24 17.32-24.36 18.75-26.34 38.13-53.58 56.7-80.65 18.74-27.33 31-59.44 36.44-95.43 5.51-36.44 2.87-72.81-7.83-108.11-8.37-27.6-22.15-53.86-42.13-80.3-13.8-18.26-27.49-37.02-40.73-55.17-7.33-10.05-14.91-20.44-22.41-30.61-16.05-21.76-32.12-43.49-48.2-65.22-13.62-18.41-27.24-36.83-40.84-55.25-12.62-17.1-40.17-56.79-41.34-58.47l-16.81-24.23 28.08 9.01c.22.07 22.24 7.13 32.38 10.5l14.44 4.79c68.95 22.87 140.24 46.52 210.31 69.96 5.21 1.74 10.37 5.43 13.8 9.88 57.55 74.44 115.96 150.21 172.44 223.48l13.59 17.63-29.92-110.78L983.06 28.25l-105.59 123.83c-.74.8-74.72 80.52-111.38 120.14-5.17 5.59-10.46 11.21-15.58 16.65-13.21 14.03-26.87 28.54-39.34 43.43-27.9 33.3-45.45 72.5-52.16 116.54-10.4 68.19 5.99 131.42 48.72 187.94 20.97 27.75 42.48 55.84 63.28 83 12.47 16.28 24.93 32.56 37.36 48.87 25.03 32.83 50.43 66.24 75 98.55l27.85 36.62c2.57 3.38 8.58 11.42 8.58 11.42l17.3 23.14-27.9-7.49c-2.2-.59-54.11-14.54-76.71-21.74-28.84-9.19-57.68-18.38-86.52-27.58-24.07-7.67-48.14-15.36-72.21-23.04-.36-.11-.68-.24-.97-.36-17.66-2.3-27.28-15.29-33.71-23.97-16.65-22.49-33.88-45.18-50.53-67.12-8.53-11.24-17.06-22.47-25.55-33.73-14.77-19.59-29.52-39.2-44.27-58.8-14.15-18.81-28.29-37.62-42.47-56.42-10.4-13.8-20.97-27.74-31.39-41.48 7.12 29.08 14.2 57.95 21.45 87.2 1.28 5.18 1.08 12.52-7.19 18.08-18.77 12.62-37.81 25.53-56.23 38.01-8.93 6.05-17.86 12.1-26.79 18.14l-17.42 11.79c-31.18 21.1-63.42 42.91-95.17 64.32-15.91 10.73-31.84 21.42-47.77 32.12-16.76 11.25-34.09 22.88-51.11 34.36-18.09 12.2-36.45 24.67-54.2 36.73-10.19 6.92-20.37 13.83-30.57 20.74-5.57 3.78-16.48 11.01-16.95 11.32l-39.88 26.43zm75.18-898.31c8.41 11.98 18.01 25.54 23.98 33.62 13.6 18.42 27.21 36.83 40.83 55.24 16.08 21.74 32.16 43.48 48.21 65.24 7.53 10.21 15.13 20.62 22.47 30.69 13.19 18.08 26.83 36.78 40.52 54.9 21.43 28.35 36.25 56.66 45.31 86.56 11.57 38.17 14.42 77.5 8.46 116.9-5.89 39-19.26 73.91-39.72 103.75-18.67 27.22-38.1 54.53-56.9 80.94-5.77 8.11-11.54 16.22-17.3 24.33-10.15 14.3-20.51 28.8-30.54 42.82-9.83 13.75-20 27.97-29.94 41.98-15.97 22.5-41.52 61.09-60.95 90.75 2.18-1.48 4.36-2.96 6.54-4.44 17.77-12.06 36.14-24.54 54.25-36.76 17.03-11.49 34.38-23.13 51.15-34.39 15.92-10.69 31.84-21.37 47.74-32.09 31.74-21.4 63.97-43.21 95.15-64.3l17.42-11.79c8.93-6.04 17.85-12.09 26.78-18.14 17.9-12.13 36.4-24.67 54.67-36.96-9.78-39.53-19.29-78.38-28.98-118.01-.58-2.35-.98-4.62-1.44-7.24-.23-1.27-.47-2.66-.77-4.21l-5.45-28.73 21.9 19.38c.61.54 1.06.92 1.41 1.21.84.7 1.78 1.5 2.7 2.71l12.63 16.65c14.4 18.97 29.28 38.58 43.87 57.92 14.18 18.8 28.33 37.62 42.48 56.44 14.74 19.6 29.48 39.2 44.25 58.78 8.48 11.24 17 22.46 25.52 33.68 16.69 21.99 33.95 44.73 50.68 67.32 7.64 10.32 12.73 15.36 21.01 16.13 1.93.18 3.41.82 4.22 1.22 23.88 7.63 47.77 15.25 71.65 22.87 28.84 9.2 57.67 18.39 86.51 27.57 11.43 3.64 31.1 9.2 47.55 13.76l-18.66-24.54c-24.56-32.31-49.97-65.71-74.99-98.53-12.42-16.3-24.88-32.57-37.34-48.84-20.82-27.19-42.35-55.31-63.36-83.1-46.1-60.98-63.78-129.29-52.53-203.01 7.28-47.7 26.32-90.22 56.6-126.36 12.84-15.33 26.7-30.05 40.11-44.29 5.09-5.41 10.35-11 15.47-16.52 35.91-38.8 107.58-116.04 111.26-120.01l39.51-46.34-375.57 192.94 44.63 165.22-21.51-13.32c-3.79-2.35-6.19-5.11-8.04-7.51l-38.1-49.43c-56.48-73.27-114.88-149.03-172.42-223.46-1.01-1.3-2.87-2.65-4.32-3.14-70.04-23.44-141.32-47.08-210.26-69.94l-14.44-4.79c-1.16-.38-2.48-.82-3.9-1.29z";

const scaleTabel = 0.25;
let mouseXTabel = 0, mouseYTabel = 0, isHoveringTabel = false;
let animationFrameIdTabel = null;

// Resize canvas
function resizeCanvasTabel() {
    const sizeTabel = Math.min(svgWrapperTabel.offsetWidth, svgWrapperTabel.offsetHeight);
    canvasTabel.width = sizeTabel;
    canvasTabel.height = sizeTabel;
}
resizeCanvasTabel();
window.addEventListener('resize', resizeCanvasTabel);

// Draw SVG
function drawSVGTabel() {
    ctxTabel.clearRect(0, 0, canvasTabel.width, canvasTabel.height);
    
    const wTabel = canvasTabel.width;
    const hTabel = canvasTabel.height;
    const centerXTabel = wTabel / 2;
    const centerYTabel = hTabel / 2;
    
    ctxTabel.save();
    ctxTabel.translate(centerXTabel, centerYTabel);
    ctxTabel.scale(scaleTabel, scaleTabel);
    ctxTabel.translate(-500, -500);
    
    const pathTabel = new Path2D(svgPathTabel);
    
    // Fill
    ctxTabel.fillStyle = '#2a2a2a';
    ctxTabel.fill(pathTabel);
    
    // Stroke dasar (abu-abu)
    ctxTabel.strokeStyle = '#808080';
    ctxTabel.lineWidth = 4;
    ctxTabel.stroke(pathTabel);
    
    // Stroke dengan gradient proximity saat hover
    if (isHoveringTabel) {
        const localXTabel = (mouseXTabel - centerXTabel) / scaleTabel + 500;
        const localYTabel = (mouseYTabel - centerYTabel) / scaleTabel + 500;
        
        const gradientRadiusTabel = 1000;
        const gradientTabel = ctxTabel.createRadialGradient(
            localXTabel, localYTabel, 0,
            localXTabel, localYTabel, gradientRadiusTabel
        );
        
        gradientTabel.addColorStop(0, 'rgba(52, 211, 153, 1)');
        gradientTabel.addColorStop(0.3, 'rgba(52, 211, 153, 0.8)');
        gradientTabel.addColorStop(0.6, 'rgba(52, 211, 153, 0.4)');
        gradientTabel.addColorStop(0.85, 'rgba(52, 211, 153, 0.2)');
        gradientTabel.addColorStop(1, 'rgba(52, 211, 153, 0)');
        
        ctxTabel.strokeStyle = gradientTabel;
        ctxTabel.lineWidth = 5;
        ctxTabel.stroke(pathTabel);
    }
    
    ctxTabel.restore();
    
    animationFrameIdTabel = requestAnimationFrame(drawSVGTabel);
}
drawSVGTabel();

// Mouse handlers
containerTabel.addEventListener('mousemove', (e) => {
    const rectTabel = canvasTabel.getBoundingClientRect();
    mouseXTabel = e.clientX - rectTabel.left;
    mouseYTabel = e.clientY - rectTabel.top;
    isHoveringTabel = true;
});

containerTabel.addEventListener('mouseleave', () => {
    isHoveringTabel = false;
});

// ============== Statistical ============== //
var data = [
    {value: 45, profit: 1200 },
    {value: 52, profit: 1450 },
    {value: 38, profit: 980 },
    {value: 65, profit: 1890 },
    {value: 58, profit: 1650 },
    {value: 70, profit: 2100 },
    {value: 62, profit: 1820 }
];

var canvas = document.getElementById('chart');
var ctx = canvas.getContext('2d');
var tooltip = document.getElementById('tooltip');
var tooltipValue = document.getElementById('tooltipValue');
var tooltipProfit = document.getElementById('tooltipProfit');

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

    const maxValue = Math.max(...data.map(d => d.value));
    const paddingTop = height * 0.4;

    const points = data.map((point, i) => ({
        x: (i / (data.length - 1)) * width,
        // tambahin paddingTop di sini:
        y: height - (point.value / maxValue) * (height - paddingTop)
    }));

    // === Area Gradient ===
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');

    // === Area Fill Smooth ===
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

    // === Line Smooth ===
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

    ctx.strokeStyle = 'rgb(52, 211, 153)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(52, 211, 153, 0.4)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === Hover Line ===
    if (hoverX !== null) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgb(52, 211, 153)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

canvas.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    const parentRect = canvas.parentElement.getBoundingClientRect(); // 🔥 ambil area parent
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const relativeX = x;
    const index = Math.round((relativeX / width) * (data.length - 1));

    if (index >= 0 && index < data.length) {
        const maxValue = Math.max(...data.map(d => d.value));
        const pointX = (index / (data.length - 1)) * width;
        const pointY = height - (data[index].value / maxValue) * height;

        hoverX = pointX;

        tooltipValue.textContent = data[index].value + ' Users';
        tooltipProfit.textContent = data[index].profit.toLocaleString();

        const offsetX = e.clientX - parentRect.left;
        const offsetY = e.clientY - parentRect.top;

        tooltip.style.left = offsetX + 15 + 'px';
        tooltip.style.top = offsetY - 40 + 'px';
        tooltip.classList.add('active');

        drawChart();
    } else {
        hoverX = null;
        tooltip.classList.remove('active');
        drawChart();
    }
});

canvas.addEventListener('mouseleave', function () {
    hoverX = null;
    tooltip.classList.remove('active');
    drawChart();
});

window.addEventListener('resize', drawChart);

drawChart();

// ============== Reports ============== //
document.querySelectorAll('.card-reports').forEach((cardReports) => {
    const containerReports = cardReports.closest('.card-container-reports');
    const canvasReports = cardReports.querySelector('.card-border-reports');
    const glowReports = cardReports.querySelector('.glow-reports');

    if (!canvasReports || !glowReports) return;

    const ctxReports = canvasReports.getContext('2d');

    // Resize canvas
    function resizeCanvas() {
        canvasReports.width = cardReports.offsetWidth;
        canvasReports.height = cardReports.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // State
    let mouseX = 0, mouseY = 0, isHovering = false;
    let targetRotateX = 0, targetRotateY = 0;
    let currentRotateX = 0, currentRotateY = 0;
    let animationFrameId = null;

    // Draw border (dengan perbaikan sebelumnya)
    function drawBorder() {
        ctxReports.clearRect(0, 0, canvasReports.width, canvasReports.height);
        const radius = 16, w = canvasReports.width, h = canvasReports.height;

        // Path rounded rectangle
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

        // Border dasar
        drawRoundedRect();
        ctxReports.strokeStyle = 'rgba(55, 55, 55, 1)';
        ctxReports.lineWidth = 2;
        ctxReports.stroke();

        // Glow saat hover
        if (isHovering) {
            drawRoundedRect();
            const gradientRadius = Math.max(w, h) * 0.8;
            const gradient = ctxReports.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, gradientRadius);
            gradient.addColorStop(0, 'rgba(144, 216, 190, 0.9)');
            gradient.addColorStop(0.2, 'rgba(144, 216, 190, 0.8)');
            gradient.addColorStop(0.5, 'rgba(144, 216, 190, 0.4)');
            gradient.addColorStop(0.8, 'rgba(144, 216, 190, 0.2)');
            gradient.addColorStop(1, 'rgba(144, 216, 190, 0)');
            ctxReports.strokeStyle = gradient;
            ctxReports.lineWidth = 3;
            ctxReports.stroke();
        }

        animationFrameId = requestAnimationFrame(drawBorder);
    }
    drawBorder();

    // Animasi rotasi
    function animateRotation() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.1;
        currentRotateY += (targetRotateY - currentRotateY) * 0.1;
        cardReports.style.transform = `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
        requestAnimationFrame(animateRotation);
    }
    animateRotation();

    // Handler efek 3D
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
        glowReports.style.transform = 'translate(-50%, -50%)';
        glowReports.style.opacity = '1';
    }

    function reset3DEffect() {
        targetRotateX = 0;
        targetRotateY = 0;
        glowReports.style.opacity = '0';
        isHovering = false;
    }

    // Event listeners per card
    const parentBox = cardReports.closest('.box-features');
    if (parentBox) {
        parentBox.addEventListener('mousemove', (e) => handle3DEffect(e, 0.6));
        parentBox.addEventListener('mouseleave', reset3DEffect);
    }

    containerReports.addEventListener('mousemove', (e) => handle3DEffect(e, 1));
    containerReports.addEventListener('mouseleave', reset3DEffect);
});

// Baground
const containerBg = document.getElementById('containerBgCard');
const totalRings = 8;
const duration = 60;
const interval = (duration / totalRings) * 1000;

// Buat ring secara dinamis
for (let i = 0; i < totalRings; i++) {
    const ring = document.createElement('div');
    ring.className = 'ring';
    ring.style.animation = `ripple ${duration}s linear infinite`;
    ring.style.animationDelay = `-${(i * interval) / 1000}s`;
    containerBg.appendChild(ring);
}

// ============== Calculator ============== //
const container = document.querySelector('.wrapper-line');
if (!container) {
    console.error("Element .wrapper-line tidak ditemukan!");
} else {
    const allDots = container.querySelectorAll('.dots');
    let isHovering = false;
    let animationId = null;
    let offsetX = 0;
    const speed = 0.2;

    function animate() {
        if (isHovering) {
            offsetX -= speed;
            allDots.forEach(dot => {
                dot.style.backgroundPosition = `${-offsetX}px 0`;
            });
            animationId = requestAnimationFrame(animate);
        }
    }

    container.addEventListener('mouseenter', () => {
        isHovering = true;
        if (!animationId) animate();
    });

    container.addEventListener('mouseleave', () => {
        isHovering = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    });
}

// ============== Preview ============== //
document.addEventListener("DOMContentLoaded", () => {

    const radioTable = document.getElementById("table-editor");
    const radioSQL = document.getElementById("sql-editor");
    const informasiWrapper = document.querySelector(".wrapper-subinformasi");
    const videoPreview = document.querySelector(".preview-video source");
    const videoElement = document.querySelector(".preview-video");

    // DATA TEXT
    const DATA = {
        table: {
            video: "Asset/JURNAL.mp4",
            text: [
                "Simple Add",
                "UI Premium",
                "Automatic Caculate",
                "Filtering"
            ]
        },
        sql: {
            video: "Asset/STATISTIC.mp4",
            text: [
                "All Data Filter",
                "Balance Chart",
                "Perfrom RR PnL Chart",
                "Pairs",
                "Chart",
                "Other All"
            ]
        }
    };

    function updateUI(type) {
        // ======= UPDATE VIDEO =======
        videoPreview.src = DATA[type].video;
        videoElement.load();
        videoElement.play();

        // ======= CLEAR LIST =======
        informasiWrapper.innerHTML = "";

        // ======= GENERATE LIST BARU =======
        DATA[type].text.forEach(item => {
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

    // EVENT LISTENER RADIO
    radioTable.addEventListener("change", () => updateUI("table"));
    radioSQL.addEventListener("change", () => updateUI("sql"));

    // DEFAULT LOAD
    updateUI("table");
});

// ============== Footer ============== //
// --- Ambil data dan bangun elemen ---
fetch('./data/user.json')
.then(res => res.json())
.then(users => {
    const container = document.querySelector('.container-community');
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.innerHTML = '';

    // Buat semua wrapper-column (3 user per wrapper)
    const wrappers = [];
    for (let i = 0; i < users.length; i += 3) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper-column';
    users.slice(i, i + 3).forEach(user => {
        const box = document.createElement('div');
        box.className = 'box-comment';
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

    // Tambahkan semua wrapper + duplikat untuk loop
    wrappers.forEach(w => container.appendChild(w));
    wrappers.forEach(w => container.appendChild(w.cloneNode(true))); // duplikat

    // --- Animasi scroll full JS ---
    let position = 0;
    const speed = 0.5; // pixel per frame
    let isAnimating = true;
    let animationId = null;

    const animate = () => {
    if (!isAnimating) {
        animationId = requestAnimationFrame(animate);
        return;
    }
    
    position -= speed;
    container.style.transform = `translateX(${position}px)`;

    // Reset posisi saat melewati setengah konten (karena sudah diduplikat)
    if (Math.abs(position) >= container.scrollWidth / 2) {
        position = 0;
    }
    animationId = requestAnimationFrame(animate);
    };

    // Mulai animasi
    animate();

    // Event listeners untuk hover pada container
    container.addEventListener('mouseenter', () => {
    isAnimating = false;
    });
    
    container.addEventListener('mouseleave', () => {
    isAnimating = true;
    });

    // Cleanup function (optional)
    container.cleanupAnimation = () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    };
});

// ============== Footer ============== //
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.subcontainer-menu span');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetClass = item.getAttribute('data-target');
            const targetSection = document.querySelector(`.${targetClass}`);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
