/* Existing FOMO dialog, shown ONCE after 10 seconds with no clicks/scrolls.
 * Also considers typing/touch/keyboard activity; avoids interrupting submissions.
 */
(function () {
  'use strict';
  var popup = document.getElementById('fomo-modal');
  if (!popup) return;
  var closeButton = popup.querySelector('.icon-close');
  var cta = document.getElementById('fomo-cta');
  var timer = null;
  var opened = false;
  var submitting = false;
  var priorOverflow = '';
  var priorFocus = null;

  function clear() { if (timer !== null) { clearTimeout(timer); timer = null; } }
  function openPopup() {
    if (opened || submitting || document.hidden) return;
    opened = true;
    priorOverflow = document.body.style.overflow;
    priorFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    popup.hidden = false;
    closeButton.focus({preventScroll: true});
  }
  function schedule() {
    clear();
    if (opened || submitting || document.hidden) return;
    timer = setTimeout(openPopup, 10000);
  }
  function closePopup() {
    if (popup.hidden) return;
    popup.hidden = true;
    document.body.style.overflow = priorOverflow;
    if (priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus({preventScroll: true});
  }
  closeButton.addEventListener('click', closePopup);
  if (cta) cta.addEventListener('click', closePopup);
  popup.addEventListener('click', function (event) {
    if (event.target === popup) closePopup();
  });
  document.addEventListener('keydown', function (event) {
    if (!popup.hidden && event.key === 'Escape') closePopup();
    if (popup.hidden) schedule();
  });
  ['click', 'input', 'touchstart'].forEach(function (event) {
    document.addEventListener(event, function () { if (popup.hidden) schedule(); }, {passive: true});
  });
  window.addEventListener('scroll', function () { if (popup.hidden) schedule(); }, {passive: true});
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('lead:submission-start', function () { submitting = true; clear(); });
  document.addEventListener('lead:submission-end', function () { submitting = false; schedule(); });
  document.addEventListener('lead:submission-success', function () { submitting = false; opened = true; clear(); });
  schedule();
})();
