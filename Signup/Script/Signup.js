const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const repeatPasswordInput = document.getElementById('repeatpassword');
const accessInput = document.getElementById('access');
const userNameDisplay = document.querySelector('.user-name');
const userDotsDisplay = document.querySelector('.user-dots');
const avatarInput = document.getElementById('avatarInput');
const avatarPlaceholder = document.querySelector('.avatar-placeholder');

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

// ───────── UI Helpers ───────── //
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

// ───────── Preview & Validation ───────── //
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

// ───────── Edit Username ───────── //
window.tempUsername = '';

userNameDisplay.addEventListener('click', () => {
    const newUsername = prompt('Enter your username:', window.tempUsername || fullnameInput.value);
    if (!newUsername) return;
    userNameDisplay.textContent = newUsername;
    window.tempUsername = newUsername;
    fullnameInput.value = newUsername;
    fullnameInput.dispatchEvent(new Event('input'));
});

// ───────── Form Submission ───────── //
document.getElementById('signupForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = (window.tempUsername || fullnameInput.value).trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const accessCode = accessInput.value.trim();

    let hasError = false;
    if (!accessCode) { accessInput.style.borderColor = '#ff5555'; hasError = true; }
    if (!validateFullname(username)) { fullnameInput.style.borderColor = '#ff5555'; hasError = true; }
    if (!validateEmail(email)) { emailInput.style.borderColor = '#ff5555'; hasError = true; }
    if (!validatePassword(password)) { passwordInput.style.borderColor = '#ff5555'; hasError = true; }

    if (hasError) return;

    startLoading();

    try {
        const response = await fetch(
            "https://olnjccddsquaspnacqyw.supabase.co/functions/v1/Access-Code---Sign-Up",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                    username,
                    email,
                    access_code: accessCode,
                    password,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            finishLoading();

            if (response.status === 401) {
                accessInput.style.borderColor = '#ff5555';
                document.getElementById('accessAlert').textContent = 'Invalid access code';
            } else if (response.status === 402) {
                emailInput.style.borderColor = '#ff5555';
                document.getElementById('emailAlert').textContent = 'Only @gmail.com';
            } else if (response.status === 403) {
                accessInput.style.borderColor = '#ff5555';
                document.getElementById('accessAlert').textContent = 'Quota exhausted';
            } else if (response.status === 404) {
                fullnameInput.style.borderColor = '#ff5555';
                document.getElementById('usernameAlert').textContent = 'Username is already taken';
            } else if (response.status === 405) {
                emailInput.style.borderColor = '#ff5555';
                document.getElementById('emailAlert').textContent = 'Email has been registered';
            }

            return;
        }

        finishLoading();
        document.getElementById('signupEmailDisplay').textContent = email;
        document.getElementById('signupSuccessModal').style.display = 'flex';

        document.getElementById('loginRedirectBtn').onclick = () => {
            const isGithub = window.location.hostname.includes('github.io');
            const target = isGithub
                ? '/Nexion-Trades-Full/index.html'
                : '/index.html';
            window.location.href = target;
        };

    } catch (err) {
        finishLoading();
        console.error('Connection Error:', err);
        alert('Server connection failed. Please try again later.');
    }
});