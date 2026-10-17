// ShopTrack authentication logic for login and registration pages.
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
  const registerForm = document.getElementById('registerForm');
  const formMessage = document.getElementById('formMessage');

  // Toggle password visibility
  function setupPasswordToggle(toggleId, inputId) {
    const toggleButton = document.getElementById(toggleId);
    const passwordInput = document.getElementById(inputId);
    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isPasswordHidden = passwordInput.type === 'password';
        passwordInput.type = isPasswordHidden ? 'text' : 'password';
        toggleButton.textContent = isPasswordHidden ? 'Hide' : 'Show';
        toggleButton.setAttribute('aria-label', isPasswordHidden ? 'Hide password' : 'Show password');
      });
    }
  }

  setupPasswordToggle('togglePassword', 'password');
  setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.trim());
  }

  function showMessage(message, isError = true) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.classList.remove('success');
    formMessage.classList.toggle('error', isError);
  }

  function setLoading(button, loading) {
    if (!button) return;
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Please wait...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  async function handleApiRequest(url, payload, submitButton) {
    setLoading(submitButton, true);
    showMessage('', false);

    try {
      const response = await window.ShopTrackApi.request(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setLoading(submitButton, false);
      return { success: true, data: response };
    } catch (error) {
      setLoading(submitButton, false);
      return { success: false, error: error.message };
    }
  }

  // Handle login form
  if (loginForm) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

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

      const result = await handleApiRequest('/api/auth/login', { email, password }, submitButton);

      if (result.success) {
        showMessage('Login successful. Redirecting...', false);
        localStorage.setItem('shoptrack-user', JSON.stringify(result.data.user));
        window.location.href = 'dashboard.html';
      } else {
        showMessage(result.error || 'Login failed. Please try again.');
      }
    });
  }

  // Handle registration form
  if (registerForm) {
    const businessNameInput = document.getElementById('businessName');
    const ownerNameInput = document.getElementById('ownerName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = registerForm.querySelector('button[type="submit"]');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const businessName = businessNameInput.value.trim();
      const ownerName = ownerNameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const phone = phoneInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!businessName) {
        showMessage('Please enter your business name.');
        businessNameInput.focus();
        return;
      }

      if (!ownerName) {
        showMessage("Please enter the owner's full name.");
        ownerNameInput.focus();
        return;
      }

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
        showMessage('Please enter a password.');
        passwordInput.focus();
        return;
      }

      if (password.length < 8) {
        showMessage('Password must be at least 8 characters.');
        passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        showMessage('Passwords do not match.');
        confirmPasswordInput.focus();
        return;
      }

      const result = await handleApiRequest('/api/auth/register', {
        businessName,
        ownerName,
        email,
        phone,
        password,
        confirmPassword,
      }, submitButton);

      if (result.success) {
        showMessage('Account created successfully! Redirecting to login...', false);
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        showMessage(result.error || 'Registration failed. Please try again.');
      }
    });
  }
});