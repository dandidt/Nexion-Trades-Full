function validatePassword(value) {
    if (value.length < 8 || value.length > 30) return false;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasUpper && hasLower && hasNumber;
}

const newPasswordForm = document.getElementById('newPasswordForm');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

newPasswordInput.addEventListener('input', () => {
    const valid = validatePassword(newPasswordInput.value);
    newPasswordInput.style.borderColor = valid ? '#0eddb0' : '#ff5555';

    if (confirmPasswordInput.value !== '') {
        confirmPasswordInput.style.borderColor =
            newPasswordInput.value === confirmPasswordInput.value
                ? '#0eddb0'
                : '#ff5555';
    }
});

confirmPasswordInput.addEventListener('input', () => {
    confirmPasswordInput.style.borderColor =
        newPasswordInput.value === confirmPasswordInput.value
            ? '#0eddb0'
            : '#ff5555';
});

let resetUser = null;

(async () => {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = '../Signin';
        return;
    }

    resetUser = data.session.user;
})();

newPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pass = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    newPasswordInput.style.borderColor = 'rgba(255,255,255,0.1)';
    confirmPasswordInput.style.borderColor = 'rgba(255,255,255,0.1)';

    if (!validatePassword(pass)) {
        newPasswordInput.style.borderColor = '#ff5555';
        return;
    }

    if (pass !== confirm) {
        confirmPasswordInput.style.borderColor = '#ff5555';
        return;
    }

    startLoading();

    const { error } = await supabaseClient.auth.updateUser({
        password: pass
    });

    finishLoading();

    if (error) {
        newPasswordInput.style.borderColor = '#ff5555';
        confirmPasswordInput.style.borderColor = '#ff5555';
        return;
    }

    document.getElementById('signupSuccess').style.display = 'flex';
});

document.getElementById('loginRedirectBtn')?.addEventListener('click', () => {
    window.location.href = '../Signin';
});

const modal = document.getElementById('signupSuccess');
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.location.href = '../Signin';
        }
    });
}

const canvas = document.getElementById('dotCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let mouseX = -1000;
    let mouseY = -1000;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function drawDot(x, y, size, cx, cy, maxDist, glowRadius) {
        const distCenter = Math.hypot(x - cx, y - cy);
        let opacity = 1 - distCenter / maxDist;
        opacity = Math.max(0.03, Math.min(0.35, opacity));

        const distMouse = Math.hypot(x - mouseX, y - mouseY);
        const glow = distMouse < glowRadius ? (1 - distMouse / glowRadius) * 0.4 : 0;

        const finalOpacity = Math.min(0.85, opacity + glow);
        if (finalOpacity < 0.01) return;

        ctx.beginPath();
        ctx.arc(x, y, size + glow * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,100,100,${finalOpacity})`;
        ctx.fill();
    }

    function drawDots() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const grid = 20;
        const baseSize = 0.7;
        const glowRadius = 180;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let x = 0; x <= canvas.width + grid; x += grid) {
            for (let y = 0; y <= canvas.height + grid; y += grid) {
                drawDot(x, y, baseSize, cx, cy, maxDist, glowRadius);
            }
        }

        requestAnimationFrame(drawDots);
    }

    drawDots();
}

document.querySelectorAll('.toggle-password, .toggle-repeat-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const wrapper = btn.closest('.password-wrapper');
        const input = wrapper.querySelector('input');
        const show = btn.querySelector('.icon-show');
        const hide = btn.querySelector('.icon-hide');

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        show.style.display = isPassword ? 'none' : 'block';
        hide.style.display = isPassword ? 'block' : 'none';
    });
});