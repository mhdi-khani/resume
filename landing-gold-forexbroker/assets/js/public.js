/*
 * Landing lead form -> Existing Google Apps Script Web App.
 * Google Apps Script is NOT modified.
 * A cross-origin Apps Script ContentService response is opaque with no-cors;
 * therefore successful fetch completion means "request sent", NOT a
 * verified write to Google Sheets.
 */
(function () {
    'use strict';

    var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby9WcUxmusBfaUzy7EiFj1cmyXdGEPAHayVRB0rN43SnomdnGDTk12T9lN2F6L6dft6/exec';
    var REQUEST_TIMEOUT_MS = 25000;

    document.addEventListener('DOMContentLoaded', function () {
        var form = document.getElementById('lead-form');
        var submitButton = document.getElementById('submit-lead');
        var status = document.getElementById('form-status');
        var modal = document.getElementById('lead-modal');
        if (!form || !submitButton || !status || !modal) return;

        var fields = {
            name: {
                input: document.getElementById('i-1'),
                group: document.getElementById('name-input-group'),
                error: document.getElementById('alert-name')
            },
            email: {
                input: document.getElementById('i-2'),
                group: document.getElementById('email-input-group'),
                error: document.getElementById('alert-email')
            },
            phone: {
                input: document.getElementById('i-3'),
                group: document.getElementById('call-input-group'),
                error: document.getElementById('alert-call')
            }
        };
        // Only form events from events.docx are pushed. No PII is included:
        // never send name, email, phone or the synthetic Message to dataLayer.
        // Persian landing is at /; unlike the English reference site's /.
        var formStarted = false;
        function pageLanguage() {
            var path = (window.location.pathname || '/').split('/').filter(Boolean);
            var routeLang = (path[0] || '').toLowerCase();
            if (/^(fa|en|de)$/.test(routeLang)) return routeLang;
            var htmlLang = (document.documentElement.lang || 'fa').toLowerCase().split('-')[0];
            return /^(fa|en|de)$/.test(htmlLang) ? htmlLang : 'fa';
        }
        function pushFormEvent(eventName, properties) {
            var eventData = { event: eventName, page_language: pageLanguage() };
            Object.keys(properties || {}).forEach(function (key) {
                eventData[key] = properties[key];
            });
            (window.dataLayer = window.dataLayer || []).push(eventData);
        }
        // Match the reference site's first focusin behavior, once per page.
        form.addEventListener('focusin', function () {
            if (formStarted) return;
            formStarted = true;
            pushFormEvent('form_start');
        });

        var pending = false;
        var sentFingerprint = '';
        var oldBodyOverflow = '';
        var lastFocusedElement = null;

        function digitsToEnglish(value) {
            return String(value || '')
                .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 1776); })
                .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 1632); });
        }

        // Accept 0912..., 912..., +98912..., 98912..., and 0098912...
        // Always save in the familiar Iranian 09xxxxxxxxx format.
        function normalizePhone(value) {
            var phone = digitsToEnglish(value).trim().replace(/[\s\u200c\u200e\u200f().-]/g, '');
            if (/^09\d{9}$/.test(phone)) return phone;
            if (/^9\d{9}$/.test(phone)) return '0' + phone;
            if (/^(?:\+98|0098|98)9\d{9}$/.test(phone)) return '0' + phone.slice(-10);
            return '';
        }

        function normalizedName() {
            return fields.name.input.value.trim().replace(/\s+/g, ' ');
        }

        function normalizedEmail() {
            return fields.email.input.value.trim();
        }

        function validationError(fieldName) {
            if (fieldName === 'name') {
                var name = normalizedName();
                return name.length >= 2 && name.length <= 60
                    ? '' : 'نام و نام خانوادگی باید بین ۲ تا ۶۰ کاراکتر باشد.';
            }
            if (fieldName === 'email') {
                var email = normalizedEmail();
                return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
                    ? '' : 'لطفاً یک ایمیل معتبر وارد کنید.';
            }
            return normalizePhone(fields.phone.input.value)
                ? '' : 'شماره تماس معتبر وارد کنید (مثلاً 09123456789).';
        }

        function showError(fieldName, message) {
            var field = fields[fieldName];
            field.error.textContent = message;
            field.error.classList.toggle('hidden', !message);
            field.group.classList.toggle('error', !!message);
            field.input.setAttribute('aria-invalid', message ? 'true' : 'false');

            // Keep the existing CSS file untouched.
            var frame = field.group.querySelector('.border');
            if (frame) frame.style.borderColor = message ? '#D8696F' : '';
            field.group.querySelectorAll('label, i').forEach(function (element) {
                element.style.color = message ? '#D8696F' : '';
            });
        }

        function setStatus(message, isError) {
            status.textContent = message;
            status.classList.toggle('hidden', !message);
            status.classList.toggle('text-danger', !!message);
            status.classList.toggle('text-primary', !!message && !isError);
        }

        function fingerprint() {
            return [normalizedName(), normalizedEmail(), normalizePhone(fields.phone.input.value)].join('\u0000');
        }

        Object.keys(fields).forEach(function (fieldName) {
            var field = fields[fieldName];
            field.input.addEventListener('input', function () {
                if (field.input.getAttribute('aria-invalid') === 'true') {
                    showError(fieldName, validationError(fieldName));
                }
                if (!pending && sentFingerprint && fingerprint() !== sentFingerprint) {
                    sentFingerprint = '';
                    submitButton.disabled = false;
                    submitButton.textContent = 'ثبت درخواست';
                    submitButton.style.opacity = '';
                    setStatus('', false);
                }
            });
            field.input.addEventListener('blur', function () {
                if (field.input.value.trim()) showError(fieldName, validationError(fieldName));
            });
        });

        function openModal() {
            lastFocusedElement = document.activeElement;
            oldBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            modal.style.display = 'block';
            var closeButton = modal.querySelector('.icon-close');
            if (closeButton) closeButton.focus();
        }

        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = oldBodyOverflow;
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }

        modal.querySelectorAll('.icon-close, .modal-close').forEach(function (button) {
            button.addEventListener('click', closeModal);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && modal.style.display !== 'none') closeModal();
        });

        function buildPayload(name, email, phone) {
            var urlParams = new URLSearchParams(window.location.search);
            var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
                .filter(function (key) { return urlParams.has(key); })
                .map(function (key) { return key + '=' + urlParams.get(key); })
                .join('&');
            var timezone = '';
            try {
                timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            } catch (error) { /* Optional metadata, never block lead submission. */ }
            return {
                name: name,
                email: email,
                message: 'شماره تماس: ' + phone,
                timezone: timezone,
                local_time: new Date().toLocaleString('sv-SE'),
                lang: document.documentElement.lang || 'fa',
                page: window.location.href,
                referrer: document.referrer,
                utm: utm,
                locale: navigator.language || '',
                ua: navigator.userAgent || ''
            };
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (pending) return;
            if (sentFingerprint && fingerprint() === sentFingerprint) {
                openModal();
                return;
            }

            var firstInvalid = null;
            var errorFields = [];
            Object.keys(fields).forEach(function (fieldName) {
                var message = validationError(fieldName);
                showError(fieldName, message);
                if (message) {
                    errorFields.push(fieldName);
                    if (!firstInvalid) firstInvalid = fields[fieldName].input;
                }
            });
            if (firstInvalid) {
                pushFormEvent('form_validation_error', { error_fields: errorFields.join(',') });
                setStatus('لطفاً موارد مشخص‌شده را اصلاح کنید.', true);
                firstInvalid.focus();
                return;
            }

            var name = normalizedName();
            var email = normalizedEmail();
            var phone = normalizePhone(fields.phone.input.value);
            var payload = buildPayload(name, email, phone);

            // After valid form submission, before sending the webhook.
            // This landing has no free-text message field. The Apps Script
            // Message column is populated with a phone number, not a message.
            pushFormEvent('form_submit', { has_message: false });
            pending = true;
            submitButton.disabled = true;
            submitButton.textContent = 'در حال ارسال...';
            submitButton.style.opacity = '0.65';
            submitButton.setAttribute('aria-busy', 'true');
            setStatus('', false);

            var controller = new AbortController();
            var timeout = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
            try {
                // text/plain + no-cors avoids a CORS preflight with an unmodified
                // Google Apps Script endpoint. Its doPost(e) parses this JSON body.
                // The response is opaque: it CANNOT prove the row was stored.
                await fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    credentials: 'omit',
                    redirect: 'follow',
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                sentFingerprint = fingerprint();
                // The request was sent without a browser network error.
                // IMPORTANT: an opaque no-cors response cannot confirm that
                // the Apps Script wrote the row into Google Sheets.
                pushFormEvent('generate_lead', { method: 'google_sheet' });
                submitButton.textContent = 'درخواست ارسال شد';
                setStatus('درخواست شما ارسال شد.', false);
                openModal();
            } catch (error) {
                pushFormEvent('form_submit_error');
                submitButton.disabled = false;
                submitButton.textContent = 'ثبت درخواست';
                submitButton.style.opacity = '';
                if (error && error.name === 'AbortError') {
                    setStatus('زمان ارتباط به پایان رسید؛ وضعیت ثبت قطعی نیست. پیش از تلاش دوباره وضعیت درخواست را بررسی کنید.', true);
                } else {
                    setStatus('ارتباط با سامانه برقرار نشد یا وضعیت ارسال مشخص نیست. اتصال اینترنت را بررسی کنید.', true);
                }
            } finally {
                clearTimeout(timeout);
                pending = false;
                submitButton.removeAttribute('aria-busy');
            }
        });
    });
})();
