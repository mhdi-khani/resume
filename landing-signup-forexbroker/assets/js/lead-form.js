/* Landing form -> existing, UNMODIFIED Google Apps Script endpoint.
 * IMPORTANT: this GAS deployment expects raw JSON in e.postData.contents.
 * text/plain JSON is a CORS "simple" request (no OPTIONS preflight).
 * Some GAS deployments do NOT allow a third-party site to read the response;
 * in that case submission is UNCONFIRMED, never claimed to be saved.
 */
(function () {
  'use strict';
  var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby9WcUxmusBfaUzy7EiFj1cmyXdGEPAHayVRB0rN43SnomdnGDTk12T9lN2F6L6dft6/exec';
  var form = document.getElementById('lead-form');
  if (!form) return;
  var inputName = document.getElementById('input-name');
  var inputPhone = document.getElementById('input-call');
  var inputEmail = document.getElementById('input-email');
  var phoneAlert = document.getElementById('alert-call');
  var submit = document.getElementById('lead-submit');
  var feedback = document.getElementById('lead-feedback');
  var inFlight = false;
  var succeeded = false;

  // Track only event metadata. NEVER put personal data (name, email, phone)
  // in the dataLayer: it would expose PII to analytics tools.
  function track(eventName, extra) {
    var eventData = {
      event: eventName,
      page_language: (document.documentElement.lang || 'fa').toLowerCase()
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) { eventData[key] = extra[key]; });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }

  // Only the very first focusin on any form control counts as form_start.
  form.addEventListener('focusin', function () {
    track('form_start');
  }, {once: true});

  function normalizeDigits(value) {
    return String(value).replace(/[\u06F0-\u06F9\u0660-\u0669]/g, function (digit) {
      var code = digit.charCodeAt(0);
      return String(code >= 0x6F0 ? code - 0x6F0 : code - 0x660);
    });
  }
  function normalizePhone(value) {
    var phone = normalizeDigits(value).replace(/[\s\-().\u200c]/g, '');
    if (phone.indexOf('0098') === 0) phone = '0' + phone.slice(4);
    else if (phone.indexOf('+98') === 0) phone = '0' + phone.slice(3);
    else if (/^98\d+$/.test(phone)) phone = '0' + phone.slice(2);
    else if (/^9\d{9}$/.test(phone)) phone = '0' + phone;
    return phone;
  }
  function setFeedback(state, message) {
    feedback.hidden = !message;
    feedback.textContent = message || '';
    if (state) feedback.dataset.state = state;
    else feedback.removeAttribute('data-state');
  }
  function markInput(input, bad) {
    input.classList.toggle('lead-input-invalid', !!bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }
  function validate() {
    var name = inputName.value.replace(/\s+/g, ' ').trim();
    var phone = normalizePhone(inputPhone.value);
    var email = inputEmail.value.trim();
    var invalidFields = [];
    var firstInvalid = null;
    var firstMessage = '';
    [inputName, inputPhone, inputEmail].forEach(function (item) { markInput(item, false); });
    phoneAlert.classList.add('hidden');

    function requireValid(fieldName, input, isValid, message) {
      if (isValid) return;
      invalidFields.push(fieldName);
      markInput(input, true);
      if (input === inputPhone) phoneAlert.classList.remove('hidden');
      if (!firstInvalid) {
        firstInvalid = input;
        firstMessage = message;
      }
    }

    requireValid('name', inputName, name.length >= 2 && name.length <= 60,
      'لطفاً نام و نام خانوادگی را به‌صورت صحیح وارد کنید (۲ تا ۶۰ کاراکتر).');
    requireValid('email', inputEmail,
      email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
      'لطفاً یک آدرس ایمیل معتبر وارد کنید.');
    requireValid('phone', inputPhone, /^09\d{9}$/.test(phone),
      'شماره موبایل معتبر وارد کنید؛ مثال: 09123456789.');

    if (invalidFields.length) {
      // Report ALL invalid fields once, not one event per field.
      track('form_validation_error', {error_fields: invalidFields.join(',')});
      setFeedback('error', firstMessage);
      firstInvalid.focus();
      return null;
    }
    return {name: name, phone: phone, email: email};
  }
  function utm() {
    var parts = [];
    new URLSearchParams(location.search).forEach(function (value, key) {
      if (/^utm_/i.test(key)) parts.push(key + '=' + value);
    });
    return parts.join('&').slice(0, 1500);
  }
  function getPayload(data) {
    var timezone = '';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (err) { /* optional */ }
    return {
      name: data.name,
      email: data.email,
      message: 'شماره تماس: ' + data.phone,
      country: '',
      country_code: '',
      timezone: timezone,
      local_time: new Date().toLocaleString('en-GB'),
      lang: document.documentElement.lang || 'fa',
      page: location.href.slice(0, 1500),
      referrer: (document.referrer || '').slice(0, 1500),
      utm: utm(),
      locale: navigator.language || '',
      ua: (navigator.userAgent || '').slice(0, 300)
    };
  }
  [inputName, inputPhone, inputEmail].forEach(function (input) {
    input.addEventListener('input', function () {
      markInput(input, false);
      if (input === inputPhone) phoneAlert.classList.add('hidden');
      if (!inFlight && !succeeded) setFeedback('', '');
    });
  });
  inputPhone.addEventListener('blur', function () {
    if (inputPhone.value.trim() && !/^09\d{9}$/.test(normalizePhone(inputPhone.value))) {
      markInput(inputPhone, true);
      phoneAlert.classList.remove('hidden');
    }
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (inFlight || succeeded) return;
    var validated = validate();
    if (!validated) return;

    // Uses the requested event name form_submit.
    // If GA4 Enhanced Measurement tracks form interactions too,
    // configure GTM / GA4 to avoid duplicate tracking.
    // This landing has NO free-text message input; the Apps Script's
    // `message` field is a mapped PHONE number, not a written message.
    track('form_submit', {has_message: false});

    inFlight = true;
    submit.disabled = true;
    submit.textContent = 'در حال ثبت...';
    setFeedback('pending', 'در حال ارسال درخواست...');
    document.dispatchEvent(new Event('lead:submission-start'));
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    try {
      // One POST only. DO NOT retry after a CORS error: GAS might have saved it.
      var response = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify(getPayload(validated)),
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var result = await response.json();
      if (result && result.ok === true) {
        // Fire only after an explicit server confirmation; not after a
        // network request that might have succeeded but whose CORS response
        // cannot be read. This prevents fictitious GA4 leads.
        track('generate_lead', {method: 'google_sheet'});
        succeeded = true;
        form.reset();
        phoneAlert.classList.add('hidden');
        setFeedback('success', 'درخواست شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم.');
        submit.textContent = 'درخواست ثبت شد';
        document.dispatchEvent(new Event('lead:submission-success'));
      } else {
        var detail = result && result.error;
        var message = detail === 'name' ? 'نام و نام خانوادگی معتبر نیست.' :
          detail === 'email' ? 'آدرس ایمیل معتبر نیست.' :
          detail === 'message' ? 'اطلاعات شماره تماس معتبر نیست.' :
          'سرور ثبت درخواست را تأیید نکرد. لطفاً دوباره تلاش کنید.';
        setFeedback('error', message);
        track('form_submit_error');
      }
    } catch (error) {
      track('form_submit_error');
      // CORS and timeouts can happen AFTER a successful POST; no false success,
      // and never auto-post a second time that could duplicate the sheet row.
      console.warn('Lead form: the Apps Script response could not be confirmed.', error);
      if (navigator.onLine === false) {
        setFeedback('error', 'اینترنت شما قطع است. پس از برقراری اتصال، دوباره تلاش کنید.');
      } else {
        setFeedback('uncertain', 'درخواست ارسال شد، اما تأیید نهایی از سرور دریافت نشد. ممکن است اطلاعات ثبت شده باشد؛ برای جلوگیری از ثبت تکراری، لطفاً قبل از تلاش مجدد وضعیت درخواست را بررسی کنید.');
      }
    } finally {
      clearTimeout(timeout);
      inFlight = false;
      if (!succeeded) {
        submit.disabled = false;
        submit.textContent = 'ثبت درخواست';
        document.dispatchEvent(new Event('lead:submission-end'));
      }
    }
  });
})();
