const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const STORAGE_KEY = 'saved_accounts';

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

function urlToBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = (err) => {
            console.error("URL:", url, "| Error:", err);
            reject(new Error("Image load failed"));
        };
        img.src = url;
    });
}

async function saveAccountToLocalStorage() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) {
            console.warn('No active session to save');
            return;
        }

        const avatarBase64 = localStorage.getItem('avatar') || null;

        const accountData = {
            user_id: session.user.id,
            email: session.user.email,
            refresh_token: session.refresh_token,
            avatar: avatarBase64
        };

        let savedAccounts = [];
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            savedAccounts = JSON.parse(stored);
        }

        const existingIndex = savedAccounts.findIndex(acc => acc.user_id === accountData.user_id);
        if (existingIndex !== -1) {
            savedAccounts[existingIndex] = accountData;
        } else {
            savedAccounts.push(accountData);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAccounts));
    } catch (err) {
        console.error('Local cache:', err);
    }
}

// ────── Form handling ────── //
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

        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.warn("⚠️ Gagal mengambil data profile:", profileError);
        }

        const avatarPath = profileData?.avatar_url;

        if (avatarPath) {
            try {
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

                localStorage.removeItem('dbperpetual');
                localStorage.removeItem('dbspot');
            } catch (imgErr) {
                localStorage.removeItem('avatar');
            }
        } else {
            localStorage.removeItem('avatar');
        }

        await saveAccountToLocalStorage();

        await new Promise(resolve => setTimeout(resolve, 100));
        finishLoading();

        setTimeout(() => {
            const isGithub = window.location.hostname.includes("github.io");

            const target = isGithub
                ? "/Nexion-Trades-Full"
                : "../";

            window.location.href = target;
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