'use client';

const STORAGE_KEY = 'cookie_consent';

export function CookieManageButton() {
  function handleReset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponível
    }
    window.location.reload();
  }

  return (
    <button
      type="button"
      data-testid="footer-cookie-manage"
      onClick={handleReset}
      className="text-sm transition-colors duration-150 hover:text-white underline cursor-pointer bg-transparent border-0 p-0"
      style={{ color: '#D1D5DB' }}
    >
      Gerenciar cookies
    </button>
  );
}
