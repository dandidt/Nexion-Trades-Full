
// =======================
// Supabase setup
// =======================
const supabaseUrl = 'https://olnjccddsquaspnacqyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// =======================
// Real-time user preview updates
// =======================
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const userNameDisplay = document.querySelector('.user-name');
const userDotsDisplay = document.querySelector('.user-dots');

// Fungsi validasi username (full name)
function validateFullname(value) {
    return /^[a-zA-Z\s]{3,25}$/.test(value.trim());
}

// Fungsi validasi password
function validatePassword(value) {
    if (value.length < 8 || value.length > 30) return false;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasUpper && hasLower && hasNumber;
}

// Update border berdasarkan validasi
function updateInputBorder(input, isValid) {
if (isValid) {
    input.style.borderColor = '#0eddb0';
} else {
    input.style.borderColor = '#ff5555';
}
}

// Event listener untuk fullname
fullnameInput.addEventListener('input', function () {
    clearAlert('usernameAltert');
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    const isValid = validateFullname(this.value);
    if (this.value.trim() !== '') {
        this.style.borderColor = isValid ? '#0eddb0' : '#ff5555';
    }
});

emailInput.addEventListener('input', function () {
    clearAlert('emailAltert');
    this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
});

// Event listener untuk password
passwordInput.addEventListener('input', function () {
const isValid = validatePassword(this.value);
updateInputBorder(this, isValid);
});

fullnameInput.addEventListener('input', function() {
    const name = this.value.trim();
    userNameDisplay.textContent = name || 'New User';
    userNameDisplay.style.color = name ? '#fff' : '#666';
    window.tempUsername = name;
});

emailInput.addEventListener('input', function() {
    const email = this.value.trim();
    userDotsDisplay.textContent = email || '• • • • •';
    userDotsDisplay.style.color = email ? '#888' : '#333';
    userDotsDisplay.style.fontSize = email ? '14px' : '20px';
    userDotsDisplay.style.letterSpacing = email ? '0px' : '4px';
});

// =======================
// Klik username untuk edit
// =======================
window.tempUsername = '';
userNameDisplay.addEventListener('click', () => {
    const newUsername = prompt('Enter your username:', window.tempUsername || fullnameInput.value);
    if (!newUsername) return;
    userNameDisplay.textContent = newUsername;
    window.tempUsername = newUsername;
});

// =======================
// Avatar upload preview
// =======================
const avatarInput = document.getElementById('avatarInput');
const avatarPlaceholder = document.querySelector('.avatar-placeholder');

document.querySelector('.avatar-upload').addEventListener('click', function() {
    avatarInput.click();
});

avatarInput.addEventListener('change', function(e) {
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
    reader.onload = function(event) {
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
// Compress avatar sebelum upload
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
    
    // Loop sampai size < maxSizeKB
    while (blob.size > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1; // turunin kualitas bertahap
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    // Jika masih besar, kecilkan resolusi juga
    while (blob.size > maxSizeKB * 1024) {
        canvas.width *= 0.9;
        canvas.height *= 0.9;

        ctx = canvas.getContext('2d');
        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
        
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
}

// =======================
// Form handling — ✅ DIPERBAIKI DI SINI
// =======================
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const username = (window.tempUsername || fullnameInput.value).trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validasi dasar
    if (!validateFullname(username)) {
        fullnameInput.style.borderColor = '#ff5555';
        document.getElementById('usernameAltert').textContent = 'Username must be 3–25 letters';
        return;
    }
    if (!validatePassword(password)) {
        passwordInput.style.borderColor = '#ff5555';
        return;
    }

    // Reset tampilan error
    fullnameInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    emailInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    clearAlert('usernameAltert');
    clearAlert('emailAltert');

    startLoading();

    try {
        // 🔍 Cek apakah username sudah dipakai — gunakan cara aman tanpa .single()
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('username', username)
            .limit(1);

        if (error) {
            console.error('Error checking username:', error);
            throw new Error('Unable to verify username. Please try again.');
        }

        if (data.length > 0) {
            throw new Error('USERNAME_TAKEN');
        }

        // ✅ Baru lakukan signup jika username tersedia
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });

        if (authError) throw authError;
        if (!authData?.user) throw new Error('User creation failed');

        // Tunggu session aktif
        await new Promise(r => setTimeout(r, 500));

        // 🖼️ Upload avatar (opsional)
        let avatarUrl = null;
        if (avatarInput.files.length > 0) {
            const compressedFile = await compressImage(avatarInput.files[0], 100);
            const filePath = `public/${authData.user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, compressedFile, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
            avatarUrl = urlData.publicUrl;
        }

        // 👤 Simpan ke tabel profiles
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                username: username,
                avatar_url: avatarUrl
            });

        if (profileError) {
            // Harusnya tidak terjadi, tapi antisipasi
            if (profileError.message?.includes('unique')) {
                throw new Error('USERNAME_TAKEN');
            }
            throw profileError;
        }

        finishLoading();
        document.getElementById('signupSuccessModal').style.display = 'flex';
        document.getElementById('loginRedirectBtn').onclick = () => {
            window.location.href = 'signin.html';
        };

    } catch (err) {
        finishLoading();
        console.error('Signup error:', err);

        if (err.message === 'USERNAME_TAKEN') {
            fullnameInput.style.borderColor = '#ff5555';
            document.getElementById('usernameAltert').textContent = 'Username is already in use';
        } else if (err.message?.toLowerCase().includes('already registered')) {
            emailInput.style.borderColor = '#ff5555';
            document.getElementById('emailAltert').textContent = 'Email has been registered';
        } else {
            alert('Signup failed: ' + (err.message || 'Unknown error'));
        }
    }
});

// Altert
function clearAlert(alertId) {
    const alertElem = document.getElementById(alertId);
    if (alertElem) {
        alertElem.textContent = '';
    }
}

// =======================
// Page loader
// =======================
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

// =======================
// Smooth link transitions
// =======================
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

// Toggle password visibility
const toggleBtn = document.querySelector('.toggle-password');
const showIcon = toggleBtn.querySelector('.icon-show');
const hideIcon = toggleBtn.querySelector('.icon-hide');

toggleBtn.addEventListener('click', () => {
const isPassword = passwordInput.type === 'password';
passwordInput.type = isPassword ? 'text' : 'password';

// Tukar ikon
if (isPassword) {
    showIcon.style.display = 'none';
    hideIcon.style.display = 'block';
} else {
    showIcon.style.display = 'block';
    hideIcon.style.display = 'none';
}
});

// =======================
// Fade-up animation
// =======================
document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".fade-up");
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add("show");
        }, index * 100);
    });
});