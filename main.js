// Everlight Foundation — shared front-end behaviour
// No secrets, keys, or credentials belong in this file.

document.addEventListener('DOMContentLoaded', function () {

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* Donation amount selector (Donate page) */
  var amountButtons = document.querySelectorAll('.amount-btn');
  var customAmountInput = document.getElementById('custom-amount');
  if (amountButtons.length) {
    amountButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        amountButtons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (customAmountInput) customAmountInput.value = '';
      });
    });
  }
  if (customAmountInput) {
    customAmountInput.addEventListener('input', function () {
      if (customAmountInput.value) {
        amountButtons.forEach(function (b) { b.classList.remove('is-active'); });
      }
    });
  }

  /*
   * Donate flow (3 steps): amount -> payment method -> payment details.
   * Wallet addresses and networks are fixed, real data — nothing here is
   * generated or invented; this function only controls which step is
   * visible and fills in the amount/coin the visitor already chose.
   */
  var CRYPTO_DATA = {
    btc: { name: 'Bitcoin', network: 'Network: Bitcoin', badge: 'BTC', address: '12H8gtx2khMyoyoCpNSaGxBc7EmyMVxddF' },
    eth: { name: 'Ethereum', network: 'Network: Ethereum (ERC-20)', badge: 'ETH', address: '0xaf3f88242dbe503f8517041a234d80aaafbf9939' },
    usdt: { name: 'USDT (Tether)', network: 'Network: TRON (TRC-20)', badge: 'USDT', address: 'TJehPqEtp7xAGQbp8ekVsuS8Hxd9CFudQg' }
  };
  var STEP_ORDER = ['amount', 'method', 'details'];

  function wireDonateFlow() {
    var amountPanel = document.getElementById('donate-step-amount');
    var methodPanel = document.getElementById('donate-step-method');
    var detailsPanel = document.getElementById('donate-step-details');
    if (!amountPanel || !methodPanel || !detailsPanel) return;

    var continueBtn = document.getElementById('donate-continue-btn');
    var amountError = document.getElementById('donate-amount-error');
    var methodAmountDisplay = document.getElementById('donate-method-amount-display');
    var detailsTitle = document.getElementById('donate-details-title');
    var detailsAmount = document.getElementById('donate-details-amount');
    var detailsBadge = document.getElementById('donate-details-badge');
    var detailsName = document.getElementById('donate-details-name');
    var detailsNetwork = document.getElementById('donate-details-network');
    var detailsQrBox = document.getElementById('donate-details-qr');
    var detailsAddress = document.getElementById('donate-details-address');
    var paymentCards = document.querySelectorAll('.payment-method-card[data-crypto]');
    var backLinks = document.querySelectorAll('.donate-back-link[data-back-to]');
    var stepIndicators = document.querySelectorAll('.donate-step[data-step-indicator]');

    var selectedAmount = null;

    function showStep(stepName) {
      amountPanel.hidden = stepName !== 'amount';
      methodPanel.hidden = stepName !== 'method';
      detailsPanel.hidden = stepName !== 'details';

      stepIndicators.forEach(function (el) {
        var key = el.getAttribute('data-step-indicator');
        el.classList.remove('is-active', 'is-done');
        if (key === stepName) {
          el.classList.add('is-active');
        } else if (STEP_ORDER.indexOf(key) < STEP_ORDER.indexOf(stepName)) {
          el.classList.add('is-done');
        }
      });

      var visiblePanel = stepName === 'amount' ? amountPanel : (stepName === 'method' ? methodPanel : detailsPanel);
      if (visiblePanel && visiblePanel.scrollIntoView) {
        visiblePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function getEnteredAmount() {
      var activeBtn = document.querySelector('.amount-btn.is-active');
      if (activeBtn && activeBtn.textContent.trim() !== 'Other') {
        return parseFloat(activeBtn.textContent.replace('£', ''));
      }
      if (customAmountInput && customAmountInput.value !== '') {
        return parseFloat(customAmountInput.value);
      }
      return NaN;
    }

    function clearAmountError() {
      if (!amountError) return;
      amountError.textContent = '';
      amountError.classList.remove('is-visible');
    }

    amountButtons.forEach(function (btn) { btn.addEventListener('click', clearAmountError); });
    if (customAmountInput) customAmountInput.addEventListener('input', clearAmountError);

    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        var amount = getEnteredAmount();
        if (!amount || isNaN(amount) || amount <= 0) {
          if (amountError) {
            amountError.textContent = 'Please enter a donation amount greater than zero.';
            amountError.classList.add('is-visible');
          }
          return;
        }
        clearAmountError();
        selectedAmount = amount;
        if (methodAmountDisplay) methodAmountDisplay.textContent = '£' + amount;
        showStep('method');
      });
    }

    paymentCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var coin = card.getAttribute('data-crypto');
        var data = CRYPTO_DATA[coin];
        if (!data) return;

        if (detailsTitle) detailsTitle.textContent = 'Pay with ' + data.name;
        if (detailsAmount) detailsAmount.textContent = selectedAmount !== null ? '£' + selectedAmount : '£0';
        if (detailsBadge) detailsBadge.textContent = data.badge;
        if (detailsName) detailsName.textContent = data.name;
        if (detailsNetwork) detailsNetwork.textContent = data.network;
        if (detailsAddress) detailsAddress.textContent = data.address;

        if (detailsQrBox) {
          detailsQrBox.innerHTML = '';
          var template = document.getElementById('qr-template-' + coin);
          if (template && template.content) {
            detailsQrBox.appendChild(template.content.cloneNode(true));
          }
        }

        showStep('details');
      });
    });

    backLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var target = link.getAttribute('data-back-to');
        if (target) showStep(target);
      });
    });
  }

  wireDonateFlow();

  /*
   * Form submission handling.
   *
   * IMPORTANT: There is no backend connected yet. These handlers only
   * validate the form in the browser and show a confirmation message —
   * nothing is sent, stored, or emailed anywhere. This is intentional
   * for this first version. See README.md for how to connect a real,
   * secure backend (form service or database) so submissions are
   * actually captured.
   */
  function wireFormStub(formId, statusId, successMessage) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Placeholder behaviour only — replace with a real API call once
      // a secure backend endpoint exists. Example:
      //
      // fetch('/api/sponsor', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(Object.fromEntries(new FormData(form)))
      // });

      status.textContent = successMessage;
      status.classList.remove('error');
      status.classList.add('success', 'is-visible');
      form.reset();
      amountButtons.forEach(function (b) { b.classList.remove('is-active'); });
    });
  }

  /*
   * Sponsor Registration form — connects directly to the Everlight
   * Foundation Google Apps Script Web App, which appends each
   * submission as a new row in the linked Google Sheet.
   *
   * Note on the request format: Google Apps Script Web Apps generally
   * only handle "simple" cross-origin requests without extra CORS
   * configuration. Sending the body with Content-Type: text/plain
   * (instead of application/json) avoids a CORS preflight request
   * that Apps Script doesn't handle by default — the Apps Script side
   * still receives the exact same JSON text and parses it normally
   * with JSON.parse(e.postData.contents).
   */
  var SPONSOR_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzHXsY2_EnCaEHCvDaGPhfCeNsXh6F50-9pAmuPH9IaWj08f-UJ72s9wnbh_jReYbxU/exec';

  function wireSponsorForm() {
    var form = document.getElementById('sponsor-form');
    var resultEl = document.getElementById('sponsor-result');
    var submitBtn = document.getElementById('sponsor-submit-btn');
    var formCard = document.getElementById('sponsor-form-card');
    var successScreen = document.getElementById('sponsor-success-screen');
    var successEmailNote = document.getElementById('sponsor-success-email-note');
    var successResetBtn = document.getElementById('sponsor-success-reset-btn');
    if (!form || !resultEl || !submitBtn) return;

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }

    function showResult(type, text) {
      resultEl.textContent = text;
      resultEl.className = 'form-result is-visible ' + type;
    }

    function hideResult() {
      resultEl.className = 'form-result';
      resultEl.textContent = '';
    }

    /*
     * Showing the dedicated success screen after a submission that the
     * browser could send without a network error. Because of the CORS
     * limitation explained below, this code cannot actually confirm Apps
     * Script wrote the row or sent the email — so the email line is
     * worded as "will be sent if your registration was received", not as
     * a confirmed fact, to avoid claiming something that isn't verified.
     */
    function showSuccessScreen(email) {
      if (!formCard || !successScreen) {
        // Fallback if the success-screen markup isn't present for some reason
        showResult('success', 'Thank you — your sponsorship registration has been submitted to Everlight Foundation.');
        return;
      }
      formCard.hidden = true;
      if (successEmailNote) {
        successEmailNote.textContent = email
          ? 'A confirmation email will be sent to ' + email + ' if your registration was received successfully.'
          : 'A confirmation email will be sent to the address you provided if your registration was received successfully.';
      }
      successScreen.classList.add('is-visible');
      successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (successResetBtn && formCard && successScreen) {
      successResetBtn.addEventListener('click', function () {
        successScreen.classList.remove('is-visible');
        formCard.hidden = false;
        hideResult();
        form.reset();
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (typeof validateSponsorPassword === 'function' && !validateSponsorPassword()) {
        return;
      }

      var payload = {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        country: form.country.value.trim(),
        support: form.support.value.trim(),
        message: form.message.value.trim(),
        password: form.password ? form.password.value : ''
      };

      hideResult();
      setLoading(true);

      /*
       * The Apps Script Web App doesn't return an Access-Control-Allow-Origin
       * header on its response, so a normal (CORS) fetch can send the
       * request but the browser blocks JavaScript from reading anything
       * back — that's the exact failure confirmed during testing ("No
       * 'Access-Control-Allow-Origin' header is present"). This is a
       * response-reading restriction, not a delivery restriction: the
       * POST request itself still reaches the server.
       *
       * mode: 'no-cors' tells the browser we don't need to read the
       * response, which avoids the block and lets the request go through.
       * The tradeoff (a browser security restriction, not something this
       * page's code can work around) is that we get back an opaque
       * response with no readable status or body — so this code can only
       * confirm the request was sent without a network error, not that
       * Apps Script successfully wrote the row or sent the email. Getting
       * a true read-confirmation would require the Apps Script itself to
       * return an Access-Control-Allow-Origin header, which is a
       * server-side change outside this file.
       */
      fetch(SPONSOR_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function () {
          showSuccessScreen(payload.email);
          form.reset();
        })
        .catch(function () {
          showResult('error', 'Something went wrong and your registration could not be submitted. Please check your connection and try again, or contact us directly.');
        })
        .finally(function () {
          setLoading(false);
        });
    });
  }

  wireSponsorForm();
  wireFormStub('contact-form', 'contact-status', 'Thank you for reaching out. (This form is not yet connected to a backend — see README.md.)');

  /* Footer year */
  var yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /*
   * Crypto wallet address copy buttons (Donate page).
   * Copies whatever text currently sits in the wallet address box —
   * right now that's a placeholder, but this becomes fully functional
   * the moment a real address replaces the placeholder text.
   */
  var copyButtons = document.querySelectorAll('.copy-btn[data-copy-target]');
  copyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetEl = document.getElementById(btn.getAttribute('data-copy-target'));
      if (!targetEl) return;
      var text = targetEl.textContent.trim();

      function showCopied() {
        var original = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('is-copied');
        }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(function () {});
      } else {
        // Fallback for older browsers without the Clipboard API
        var temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); showCopied(); } catch (err) {}
        document.body.removeChild(temp);
      }
    });
  });

  // ============================================================
  // Sponsor authentication — shared helpers
  // ============================================================
  //
  // This section implements the client side of the login/session
  // protocol described in the Apps Script. Nothing here can read or
  // guess another sponsor's password or session: the server is always
  // the one deciding which account a token or proof belongs to.
  //
  // Transport note: login/dashboard/logout use JSONP (a dynamically
  // inserted <script> tag), not fetch(). Script-tag loading isn't
  // subject to CORS at all, which sidesteps the same CORS uncertainty
  // already documented for the registration form — this endpoint's
  // response headers can't be relied on to satisfy a normal fetch().

  function sha256Hex(str) {
    var enc = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      var bytes = Array.from(new Uint8Array(buf));
      return bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  // Must match the Apps Script's kdf() exactly:
  // sha256Hex(password + ':' + salt), then (iterations - 1) more
  // rounds of sha256Hex(h + ':' + salt).
  function kdf(password, salt, iterations) {
    return sha256Hex(password + ':' + salt).then(function chain(h) {
      iterations -= 1;
      if (iterations <= 0) return h;
      return sha256Hex(h + ':' + salt).then(chain);
    });
  }

  function jsonpRequest(url, params, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var callbackName = 'everlightJsonp_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var timeoutId;

      function cleanup() {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        clearTimeout(timeoutId);
      }

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      timeoutId = setTimeout(function () {
        cleanup();
        reject(new Error('Request timed out.'));
      }, timeoutMs || 12000);

      var query = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');

      script.onerror = function () {
        cleanup();
        reject(new Error('Network error.'));
      };
      script.src = url + '?' + query + '&callback=' + callbackName;
      document.body.appendChild(script);
    });
  }

  var SPONSOR_SESSION_KEY = 'everlightSponsorToken';

  function getSponsorToken() {
    try { return sessionStorage.getItem(SPONSOR_SESSION_KEY); } catch (e) { return null; }
  }
  function setSponsorToken(token) {
    try { sessionStorage.setItem(SPONSOR_SESSION_KEY, token); } catch (e) {}
  }
  function clearSponsorToken() {
    try { sessionStorage.removeItem(SPONSOR_SESSION_KEY); } catch (e) {}
  }

  // Works for both website builds: the single-file build has a
  // '#page-home' element and uses hash routing; the multi-page build
  // does not, and uses real page navigation instead.
  function navigateToRoute(routeName) {
    var routes = {
      login: { hash: '#login', page: 'sponsor-login.html' },
      dashboard: { hash: '#dashboard', page: 'sponsor-dashboard.html' },
      home: { hash: '#home', page: 'index.html' }
    };
    var route = routes[routeName];
    if (!route) return;
    if (document.getElementById('page-home')) {
      window.location.hash = route.hash;
    } else {
      window.location.href = route.page;
    }
  }

  // ============================================================
  // Sponsor Registration — password strength + confirmation
  // ============================================================

  function wireSponsorPasswordValidation() {
    var passwordInput = document.getElementById('sponsor-password');
    var confirmInput = document.getElementById('sponsor-password-confirm');
    var errorEl = document.getElementById('sponsor-password-error');
    if (!passwordInput || !confirmInput || !errorEl) return null;

    function validate() {
      var password = passwordInput.value;
      var confirm = confirmInput.value;

      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        errorEl.textContent = 'Password must be at least 8 characters and include both letters and numbers.';
        errorEl.classList.add('is-visible');
        return false;
      }
      if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.classList.add('is-visible');
        return false;
      }
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
      return true;
    }

    passwordInput.addEventListener('input', validate);
    confirmInput.addEventListener('input', validate);

    return validate;
  }

  var validateSponsorPassword = wireSponsorPasswordValidation();

  // ============================================================
  // Sponsor Login
  // ============================================================

  function wireSponsorLogin() {
    var form = document.getElementById('login-form');
    var resultEl = document.getElementById('login-result');
    var submitBtn = document.getElementById('login-submit-btn');
    if (!form || !resultEl || !submitBtn) return;

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }
    function showError(text) {
      resultEl.textContent = text;
      resultEl.className = 'form-result is-visible error';
    }
    function hideResult() {
      resultEl.className = 'form-result';
      resultEl.textContent = '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var email = form.email.value.trim().toLowerCase();
      var password = form.password.value;

      hideResult();
      setLoading(true);

      jsonpRequest(SPONSOR_ENDPOINT, { action: 'nonce', email: email })
        .then(function (nonceRes) {
          if (!nonceRes || !nonceRes.ok) throw new Error('login-failed');
          return kdf(password, nonceRes.salt, 2000).then(function (localHash) {
            return sha256Hex(localHash + ':' + nonceRes.nonce);
          });
        })
        .then(function (proof) {
          return jsonpRequest(SPONSOR_ENDPOINT, { action: 'login', email: email, proof: proof });
        })
        .then(function (loginRes) {
          if (!loginRes || !loginRes.ok || !loginRes.token) {
            showError((loginRes && loginRes.error) || 'Incorrect email or password.');
            return;
          }
          setSponsorToken(loginRes.token);
          navigateToRoute('dashboard');
        })
        .catch(function () {
          showError('Incorrect email or password.');
        })
        .finally(function () {
          setLoading(false);
        });
    });
  }

  // ============================================================
  // Sponsor Dashboard
  // ============================================================

  function wireSponsorDashboard() {
    var logoutBtn = document.getElementById('dashboard-logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var t = getSponsorToken();
      clearSponsorToken();
      if (t) {
        jsonpRequest(SPONSOR_ENDPOINT, { action: 'logout', token: t }).catch(function () {});
      }
      navigateToRoute('login');
    });
  }

  // Fetches and renders the logged-in sponsor's own dashboard data.
  // Safe to call at any time — it no-ops if the dashboard isn't the
  // page/section currently being shown, so it won't fire a login
  // redirect just because a visitor is somewhere else on the site.
  function loadSponsorDashboardData() {
    var root = document.getElementById('dashboard-root');
    if (!root) return;

    // Single-file build: only proceed if #page-dashboard is the
    // currently visible route. Multi-page build has no such element,
    // so this check is skipped there (the whole page IS the dashboard).
    var pageDashboardEl = document.getElementById('page-dashboard');
    if (pageDashboardEl && pageDashboardEl.hidden) return;

    var loadingEl = document.getElementById('dashboard-loading');
    var contentEl = document.getElementById('dashboard-content');
    var errorEl = document.getElementById('dashboard-error');
    var nameEl = document.getElementById('dashboard-welcome-name');
    var infoNameEl = document.getElementById('dashboard-info-name');
    var infoCountryEl = document.getElementById('dashboard-info-country');
    var infoRegDateEl = document.getElementById('dashboard-info-regdate');
    var infoNowDateEl = document.getElementById('dashboard-info-now');

    function showError(message) {
      if (loadingEl) loadingEl.hidden = true;
      if (contentEl) contentEl.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = message;
      }
    }

    if (loadingEl) loadingEl.hidden = false;
    if (contentEl) contentEl.hidden = true;
    if (errorEl) errorEl.hidden = true;

    var token = getSponsorToken();
    if (!token) {
      navigateToRoute('login');
      return;
    }

    jsonpRequest(SPONSOR_ENDPOINT, { action: 'dashboard', token: token })
      .then(function (res) {
        if (!res || !res.ok) {
          clearSponsorToken();
          showError('Your session has expired. Please log in again.');
          setTimeout(function () { navigateToRoute('login'); }, 1800);
          return;
        }

        if (loadingEl) loadingEl.hidden = true;
        if (contentEl) contentEl.hidden = false;

        var firstName = (res.fullName || '').split(' ')[0] || res.fullName || 'Sponsor';
        if (nameEl) nameEl.textContent = firstName;
        if (infoNameEl) infoNameEl.textContent = res.fullName || '—';
        if (infoCountryEl) infoCountryEl.textContent = res.country || '—';

        if (infoRegDateEl) {
          infoRegDateEl.textContent = res.registrationDate
            ? new Date(res.registrationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            : '—';
        }

        function updateNow() {
          if (!infoNowDateEl) return;
          var now = new Date();
          var tz = 'your device';
          try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
          } catch (e) {}
          infoNowDateEl.textContent = now.toLocaleString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }) + ' (' + tz + ')';
        }
        updateNow();
        setInterval(updateNow, 30000);
      })
      .catch(function () {
        showError('Could not reach the server. Please check your connection and try again.');
      });
  }

  wireSponsorLogin();
  wireSponsorDashboard();
  loadSponsorDashboardData();

});

