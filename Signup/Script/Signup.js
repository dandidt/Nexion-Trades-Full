// =======================
// Supabase setup
// =======================
const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// =======================
// DOM Elements
// =======================
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const repeatPasswordInput = document.getElementById('repeatpassword');
const accessInput = document.getElementById('access');
const userNameDisplay = document.querySelector('.user-name');
const userDotsDisplay = document.querySelector('.user-dots');
const avatarInput = document.getElementById('avatarInput');
const avatarPlaceholder = document.querySelector('.avatar-placeholder');

// =======================
// Validation Functions
// =======================
function validateFullname(value) {
    return /^[a-zA-Z0-9\s]{3,20}$/.test(value.trim());
}

function validatePassword(value) {
    if (value.length < 8 || value.length > 30) return false;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasUpper && hasLower && hasNumber;
}

function validateRepeatPassword() {
    const password = passwordInput.value;
    const repeat = repeatPasswordInput.value;
    return repeat !== '' && password === repeat;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// =======================
// UI Helpers
// =======================
function updateInputBorder(input, isValid) {
    input.style.borderColor = isValid ? '#0eddb0' : '#ff5555';
}

function clearAlert(alertId) {
    const alertElem = document.getElementById(alertId);
    if (alertElem) alertElem.textContent = '';
}

function truncateName(name, maxLength = 20) {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

// =======================
// Real-time Preview & Validation
// =======================
fullnameInput.addEventListener('input', function () {
    clearAlert('usernameAlert');
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    const name = this.value.trim();
    const displayName = name ? truncateName(name) : 'New User';
    userNameDisplay.textContent = displayName;
    userNameDisplay.style.color = name ? '#fff' : '#666';
    window.tempUsername = name;

    if (name !== '') {
        updateInputBorder(this, validateFullname(name));
    }
});

emailInput.addEventListener('input', function () {
    clearAlert('emailAlert');
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    const email = this.value.trim();
    userDotsDisplay.textContent = email || '• • • • •';
    userDotsDisplay.style.color = email ? '#888' : '#333';
    userDotsDisplay.style.fontSize = email ? '14px' : '20px';
    userDotsDisplay.style.letterSpacing = email ? '0px' : '4px';
});

passwordInput.addEventListener('input', function () {
    const isValid = validatePassword(this.value);
    updateInputBorder(this, isValid);
    if (repeatPasswordInput.value !== '') {
        updateInputBorder(repeatPasswordInput, validateRepeatPassword());
    }
});

repeatPasswordInput.addEventListener('input', function () {
    updateInputBorder(this, validateRepeatPassword());
});

accessInput.addEventListener('input', function () {
    clearAlert('accessAlert');
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
});

// =======================
// Edit Username on Click
// =======================
window.tempUsername = '';
userNameDisplay.addEventListener('click', () => {
    const newUsername = prompt('Enter your username:', window.tempUsername || fullnameInput.value);
    if (!newUsername) return;
    userNameDisplay.textContent = newUsername;
    window.tempUsername = newUsername;
    fullnameInput.value = newUsername;
    // Trigger input event for validation
    fullnameInput.dispatchEvent(new Event('input'));
});

// =======================
// Form Submission
// =======================
document.getElementById('signupForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = (window.tempUsername || fullnameInput.value).trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const repeatPassword = repeatPasswordInput.value;
    const accessCode = accessInput.value.trim();

    // --- CLIENT-SIDE VALIDATION ---
    let hasError = false;

    if (!accessCode) {
        accessInput.style.borderColor = '#ff5555';
        document.getElementById('accessAlert').textContent = 'Access code is required';
        hasError = true;
    }

    if (!validateFullname(username)) {
        fullnameInput.style.borderColor = '#ff5555';
        document.getElementById('usernameAlert').textContent = 'Username must be 3–20 letters/numbers';
        hasError = true;
    }

    if (!validateEmail(email)) {
        emailInput.style.borderColor = '#ff5555';
        document.getElementById('emailAlert').textContent = 'Invalid email format';
        hasError = true;
    }

    if (!validatePassword(password)) {
        passwordInput.style.borderColor = '#ff5555';
        hasError = true;
    }

    if (!validateRepeatPassword()) {
        repeatPasswordInput.style.borderColor = '#ff5555';
        hasError = true;
    }

    if (hasError) return;

    startLoading();

    try {
        const accessResponse = await fetch(
            `https://script.google.com/macros/s/AKfycbzB-oRL8sjNXO0P0dcinbAdt5DxGWIp4llHcIQNF6bQ9lVvdUFak4whdiKIxGYNMhbf/exec?code=${encodeURIComponent(accessCode)}`
        );
        const accessData = await accessResponse.json();

        if (!accessData.isValid) {
            finishLoading();
            accessInput.style.borderColor = '#ff5555';
            document.getElementById('accessAlert').textContent = 'Invalid access code';
            return;
        }

        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (authError) throw authError;
        if (!authData?.user) throw new Error('User creation failed');

        finishLoading();
        document.getElementById('signupEmailDisplay').textContent = email;
        document.getElementById('signupSuccessModal').style.display = 'flex';

        document.getElementById('loginRedirectBtn').onclick = () => {
            const isGithub = window.location.hostname.includes('github.io');
            const target = isGithub ? '/Nexion-Trades-Full/index.html' : '/index.html';
            window.location.href = target;
        };

    } catch (err) {
        finishLoading();
        console.error('Signup error:', err);

        if (err.message?.toLowerCase().includes('already registered')) {
            emailInput.style.borderColor = '#ff5555';
            document.getElementById('emailAlert').textContent = 'Email is already registered';
        } else if (err.message?.includes('username')) {
            fullnameInput.style.borderColor = '#ff5555';
            document.getElementById('usernameAlert').textContent = 'Invalid username';
        } else {
            alert('Signup failed: ' + (err.message || 'Please try again'));
        }
    }
});

// =======================
// Loading UI
// =======================
const loader = document.querySelector('.page-loader');

function startLoading() {
    if (!loader) return;
    loader.style.width = '0%';
    loader.style.display = 'block';
    setTimeout(() => loader.style.width = '80%', 100);
}

function finishLoading() {
    if (!loader) return;
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

// =======================
// Smooth Link Transitions
// =======================
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.href && !link.href.startsWith('#') && !link.target) {
            e.preventDefault();
            startLoading();
            setTimeout(() => window.location.href = link.href, 600);
        }
    });
});

// =======================
// Toggle Password Visibility
// =======================
const toggleBtn = document.querySelector('.toggle-password');
const repeatToggleBtn = document.querySelector('.toggle-repeat-password');

toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    const showIcon = toggleBtn.querySelector('.icon-show');
    const hideIcon = toggleBtn.querySelector('.icon-hide');
    if (showIcon && hideIcon) {
        showIcon.style.display = isPassword ? 'none' : 'block';
        hideIcon.style.display = isPassword ? 'block' : 'none';
    }
});

repeatToggleBtn?.addEventListener('click', () => {
    const isPassword = repeatPasswordInput.type === 'password';
    repeatPasswordInput.type = isPassword ? 'text' : 'password';
    const showIcon = repeatToggleBtn.querySelector('.icon-show');
    const hideIcon = repeatToggleBtn.querySelector('.icon-hide');
    if (showIcon && hideIcon) {
        showIcon.style.display = isPassword ? 'none' : 'block';
        hideIcon.style.display = isPassword ? 'block' : 'none';
    }
});

// =======================
// Fade-up Animation
// =======================
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.fade-up');
    elements.forEach((el, index) => {
        setTimeout(() => el.classList.add('show'), index * 100);
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
