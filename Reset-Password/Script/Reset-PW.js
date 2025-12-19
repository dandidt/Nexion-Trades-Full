// =======================
// Supabase setup
// =======================
const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl.trim(), supabaseKey.trim());

// =======================
// Canvas
// =======================
const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

let mouseX = -1000;
let mouseY = -1000;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function drawDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gridSpacing = 20;
    const cornerSize = 0.7;
    const glowRadius = 180;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let x = 0; x <= canvas.width + gridSpacing; x += gridSpacing) {
        for (let y = 0; y <= canvas.height + gridSpacing; y += gridSpacing) {
            const corners = [
                {x: x, y: y},
                {x: x + gridSpacing, y: y},
                {x: x, y: y + gridSpacing},
                {x: x + gridSpacing, y: y + gridSpacing}
            ];
            corners.forEach(pt => {
                drawDot(pt.x, pt.y, cornerSize, centerX, centerY, maxDistance, glowRadius);
            });
        }
    }
    
    requestAnimationFrame(drawDots);
}

function drawDot(x, y, baseSize, centerX, centerY, maxDistance, glowRadius) {
    const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    let baseOpacity = 1 - distFromCenter / maxDistance;
    baseOpacity = Math.max(0.03, Math.min(0.35, baseOpacity));
    
    const distFromMouse = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
    const glowIntensity = distFromMouse < glowRadius ? (1 - distFromMouse / glowRadius) * 0.4 : 0;
    
    const finalOpacity = Math.min(0.85, baseOpacity + glowIntensity);
    if (finalOpacity < 0.01) return;
    
    const finalSize = baseSize + glowIntensity * 1.5;
    
    ctx.beginPath();
    ctx.arc(x, y, finalSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 100, 100, ${finalOpacity})`;
    ctx.fill();
}

drawDots();

// Form handling
const form = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    emailInput.classList.remove('error');

    if (!isValidEmail(email)) {
        emailInput.classList.add('error');
        errorMessage.textContent = 'Please enter a valid email address';
        errorMessage.classList.add('show');
        return;
    }

    startLoading();

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/New-Password'
        });

        if (error) throw error;

        finishLoading();

        resetBtn.style.display = 'none';
        successMessage.classList.add('show');

        setTimeout(() => {
            form.reset();
            resetBtn.style.display = 'block';
            successMessage.classList.remove('show');
        }, 5000);

    } catch (err) {
        finishLoading();

        emailInput.classList.add('error');
        errorMessage.textContent = err.message || 'Failed to send reset email. Please try again.';
        errorMessage.classList.add('show');
    }
});

// Remove error state saat user mulai mengetik
emailInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        this.classList.remove('error');
        errorMessage.classList.remove('show');
    }
});

const loader = document.querySelector('.page-loader');

function startLoading() {
    loader.style.width = '0%';
    loader.style.display = 'block';
    setTimeout(() => loader.style.width = '80%', 100);
}

function finishLoading() {
    loader.style.width = '100%';
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.width = '0%';
            loader.style.opacity = '1';
            loader.style.display = 'none';
        }, 300);
    }, 400);
}

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.href && !link.href.startsWith('#')) {
            e.preventDefault();
            startLoading();
            setTimeout(() => {
                window.location = link.href;
            }, 600);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".fade-up");

    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add("show");
        }, index * 150);
    });
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
