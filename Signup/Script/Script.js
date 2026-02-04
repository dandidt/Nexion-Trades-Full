// ───────── Loading UI ───────── //
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

// ───────── Smooth Link Transitions ───────── //
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.href && !link.href.startsWith('#') && !link.target) {
            e.preventDefault();
            startLoading();
            setTimeout(() => window.location.href = link.href, 600);
        }
    });
});

// ───────── Toggle Password Visibility ───────── //
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