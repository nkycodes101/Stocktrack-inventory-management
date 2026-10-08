// Simple frontend-only login form logic for the ShopTrack demo.
// This does not create real authentication or connect to any backend.

document.addEventListener('DOMContentLoaded', () => {
  const workspaceSelector = document.getElementById('workspaceSelector');
  if (workspaceSelector) {
    const storageKey = 'shoptrack-workspace';
    const savedWorkspace = localStorage.getItem(storageKey);
    if (savedWorkspace && Array.from(workspaceSelector.options).some((option) => option.value === savedWorkspace)) {
      workspaceSelector.value = savedWorkspace;
    }

    workspaceSelector.addEventListener('change', () => {
      localStorage.setItem(storageKey, workspaceSelector.value);
    });
  }

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordButton = document.getElementById('togglePassword');
  const formMessage = document.getElementById('formMessage');

  // Toggle the password field between hidden and visible text.
  togglePasswordButton.addEventListener('click', () => {
    const isPasswordHidden = passwordInput.type === 'password';

    passwordInput.type = isPasswordHidden ? 'text' : 'password';
    togglePasswordButton.textContent = isPasswordHidden ? 'Hide' : 'Show';
    togglePasswordButton.setAttribute(
      'aria-label',
      isPasswordHidden ? 'Hide password' : 'Show password'
    );
  });

  // Very basic email validation for the frontend demo.
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.trim());
  }

  // Show or hide the message box.
  function showMessage(message, isError = true) {
    formMessage.textContent = message;
    formMessage.classList.remove('success');
    formMessage.classList.toggle('error', isError);
  }

  // Handle the login form submit event.
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Required field checks.
    if (!email) {
      showMessage('Please enter your email address.');
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showMessage('Please enter a valid email address.');
      emailInput.focus();
      return;
    }

    if (!password) {
      showMessage('Please enter your password.');
      passwordInput.focus();
      return;
    }

    // Frontend-only demo behavior.
    // Any valid-looking email and any non-empty password is accepted.
    formMessage.classList.remove('error');
    formMessage.classList.add('success');
    formMessage.textContent = 'Login successful. Redirecting to dashboard...';

    window.location.href = 'dashboard.html';
  });
});
