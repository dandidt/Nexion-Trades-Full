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
// Avatar Upload Preview
// =======================
document.querySelector('.avatar-upload')?.addEventListener('click', function () {
    avatarInput.click();
});

avatarInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
        alert('Please upload a valid image (JPEG, PNG, WEBP, etc.)');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const dataUrl = event.target.result;
        avatarPlaceholder.innerHTML = `<img src="${dataUrl}" alt="Avatar Preview" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;

        try {
            localStorage.setItem('avatar', dataUrl);
        } catch (err) {
            console.warn('Failed to save avatar to localStorage', err);
            if (err.name === 'QuotaExceededError') {
                localStorage.removeItem('avatar');
            }
        }
    };
    reader.readAsDataURL(file);
});

// =======================
// Image Compression
// =======================
async function compressImage(file, maxSizeKB = 50) {
    const imageBitmap = await createImageBitmap(file);
    let quality = 0.7;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    ctx.drawImage(imageBitmap, 0, 0);

    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));

    while (blob.size > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    while (blob.size > maxSizeKB * 1024) {
        canvas.width *= 0.9;
        canvas.height *= 0.9;
        ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
}

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

    // --- CLIENT-SIDE VALIDATION (SEBELUM SERVER) ---
    let hasError = false;

    // Access code required
    if (!accessCode) {
        accessInput.style.borderColor = '#ff5555';
        document.getElementById('accessAlert').textContent = 'Access code is required';
        hasError = true;
    }

    // Username validation
    if (!validateFullname(username)) {
        fullnameInput.style.borderColor = '#ff5555';
        document.getElementById('usernameAlert').textContent = 'Username must be 3–20 letters/numbers';
        hasError = true;
    }

    // Email validation
    if (!validateEmail(email)) {
        emailInput.style.borderColor = '#ff5555';
        document.getElementById('emailAlert').textContent = 'Invalid email format';
        hasError = true;
    }

    // Password validation
    if (!validatePassword(password)) {
        passwordInput.style.borderColor = '#ff5555';
        // Optional: add error message if you have a password alert element
        hasError = true;
    }

    // Repeat password validation
    if (!validateRepeatPassword()) {
        repeatPasswordInput.style.borderColor = '#ff5555';
        // Optional: add message like "Passwords do not match"
        hasError = true;
    }

    // Jika ada error validasi client-side, HENTIKAN di sini
    if (hasError) return;

    // --- SERVER-SIDE LOGIC ---
    startLoading();

    try {
        // Validasi access code
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

        // Periksa username unik
        const { data: existingUsers, error: checkError } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('username', username)
            .limit(1);

        if (checkError) throw new Error('Failed to check username availability');
        if (existingUsers.length > 0) throw new Error('USERNAME_TAKEN');

        // Daftar user
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (authError) throw authError;
        if (!authData?.user) throw new Error('User creation failed');

        await new Promise(r => setTimeout(r, 500));

        // Upload avatar (opsional)
        let avatarUrl = null;
        if (avatarInput.files.length > 0) {
            const compressedFile = await compressImage(avatarInput.files[0], 100);
            const filePath = `public/${authData.user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, compressedFile, { upsert: true });
            if (uploadError) throw uploadError;
            avatarUrl = filePath;

            // Simpan ke localStorage
            const reader = new FileReader();
            const base64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(compressedFile);
            });
            localStorage.setItem('avatar', base64);
            localStorage.removeItem('dbtrade'); // optional cleanup
        }

        // Simpan profil
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({ id: authData.user.id, username, avatar_url: avatarUrl });

        if (profileError) {
            if (profileError.message?.includes('unique')) throw new Error('USERNAME_TAKEN');
            throw profileError;
        }

        // Sukses
        finishLoading();
        document.getElementById('signupSuccessModal').style.display = 'flex';
        document.getElementById('loginRedirectBtn').onclick = () => {
            const isGithub = window.location.hostname.includes('github.io');
            const target = isGithub ? '/Nexion-Trades-Full/index.html' : '/index.html';
            window.location.href = target;
        };

    } catch (err) {
        finishLoading();
        console.error('Signup error:', err);

        if (err.message === 'USERNAME_TAKEN') {
            fullnameInput.style.borderColor = '#ff5555';
            document.getElementById('usernameAlert').textContent = 'Username is already in use';
        } else if (err.message?.toLowerCase().includes('already registered')) {
            emailInput.style.borderColor = '#ff5555';
            document.getElementById('emailAlert').textContent = 'Email has been registered';
        } else {
            alert('Signup failed: ' + (err.message || 'Unknown error'));
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