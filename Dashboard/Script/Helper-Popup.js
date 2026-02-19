function CloseAllPopups() {
    document.querySelectorAll('[class*="popup-"].show').forEach(el => {
        if (el.classList.contains('popup-overlay')) return;
        el.classList.remove('show');
    });

    document.querySelector('.popup-overlay')?.classList.remove('show');

    document.body.classList.remove('popup-open');
    document.body.style.overflow = '';
}

if (typeof window !== 'undefined') {
    window.CloseAllPopups = CloseAllPopups;
}