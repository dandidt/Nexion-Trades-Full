// =======================
// Supabase setup
// =======================
const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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
    const edgeSize = 0.3;
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

function urlToBase64(url) {
    return new Promise((resolve, reject) => {
        console.log("🚀 Memulai konversi URL ke base64:", url);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            console.log("✅ Gambar berhasil dimuat, ukuran:", img.width, "x", img.height);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            console.log("✅ Konversi ke base64 berhasil. Panjang data:", dataURL.length);
            resolve(dataURL);
        };
        img.onerror = (err) => {
            console.error("❌ Gagal memuat gambar dari URL:", url, "| Error:", err);
            reject(new Error("Image load failed"));
        };
        img.src = url;
    });
}

// Form handling - Supabase login (diperbaiki)
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    startLoading();

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        if (!data?.user) throw new Error("Login failed, user not found");

        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError) throw userError;

        const user = userData.user;
        console.log("👤 Data user lengkap:", user);

        console.log("🔍 Mencari avatar_path di tabel profiles...");
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.warn("⚠️ Gagal mengambil data profile:", profileError);
        }

        const avatarPath = profileData?.avatar_url;
        console.log("🖼️ avatar_path dari profiles:", avatarPath);

        if (avatarPath) {
            try {
                console.log("⏳ Memulai download avatar via Supabase client...");
                const { data: fileData, error: downloadError } = await supabaseClient
                    .storage
                    .from('avatars')
                    .download(avatarPath);

                if (downloadError) {
                    throw new Error(`Download gagal: ${downloadError.message}`);
                }

                const arrayBuffer = await fileData.arrayBuffer();
                const base64 = `data:${fileData.type};base64,${btoa(
                    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                )}`;

                localStorage.setItem('avatar', base64);
                console.log("✅ Avatar berhasil disimpan ke localStorage");

                localStorage.removeItem('dbtrade');
            } catch (imgErr) {
                console.warn("⚠️ Gagal menyimpan avatar ke cache:", imgErr);
                localStorage.removeItem('avatar');
            }
        } else {
            localStorage.removeItem('avatar');
            console.log("🗑️ Tidak ada avatar_path — menghapus cache avatar lama");
        }

        // Tunggu sebentar
        await new Promise(resolve => setTimeout(resolve, 100));
        finishLoading();

        setTimeout(() => {
            window.location.href = "/Nexion-Trades-Full/index.html";
        }, 500);

    } catch (err) {
        finishLoading();
        console.error("Login error:", err);
        const errorMsg = err.message?.toLowerCase();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const alertElem = document.querySelector('.altert-text');

        emailInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        passwordInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';

        if (alertElem) {
            if (errorMsg?.includes("invalid login credentials")) {
                emailInput.style.borderColor = '#ff5555';
                passwordInput.style.borderColor = '#ff5555';
                alertElem.textContent = "Incorrect email or password.";
            } else if (errorMsg?.includes("email not confirmed")) {
                emailInput.style.borderColor = '#ff5555';
                alertElem.textContent = "Email not verified. Please check your inbox.";
            } else {
                emailInput.style.borderColor = '#ff5555';
                passwordInput.style.borderColor = '#ff5555';
                alertElem.textContent = "Login failed. Please try again.";
            }
        }
    }
});

// Bersihkan error saat user mulai mengetik
document.getElementById('email').addEventListener('input', function() {
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    document.querySelector('.altert-text').textContent = '';
});

document.getElementById('password').addEventListener('input', function() {
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    document.querySelector('.altert-text').textContent = '';
});

const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateY(0)';
    });
});

// Toggle password visibility
const togglePasswordBtn = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');
const showIcon = togglePasswordBtn?.querySelector('.icon-show');
const hideIcon = togglePasswordBtn?.querySelector('.icon-hide');

if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';

        if (showIcon && hideIcon) {
            if (isPassword) {
                showIcon.style.display = 'none';
                hideIcon.style.display = 'block';
            } else {
                showIcon.style.display = 'block';
                hideIcon.style.display = 'none';
            }
        }
    });
}

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