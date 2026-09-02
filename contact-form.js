(function () {
  'use strict';

  function getConfig() {
    return (window.AQBAR_CONTACT_CONFIG && window.AQBAR_CONTACT_CONFIG.webAppUrl) || '';
  }

  function getSource() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return file === 'index-mobile.html' ? 'mobile' : 'desktop';
  }

  function getFormData(form, inquiryType) {
    return {
      inquiryType: inquiryType,
      name: (form.querySelector('[name="name"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      company: (form.querySelector('[name="company"]') || {}).value || '',
      source: getSource()
    };
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = '전송 중...';
      button.disabled = true;
      button.style.opacity = '0.7';
      return;
    }
    button.textContent = button.dataset.originalText || button.textContent;
    button.style.opacity = '';
  }

  function markSubmitted(button) {
    button.textContent = '전송되었습니다 ✓';
    button.disabled = true;
    button.dataset.submitted = 'true';
    button.style.background = '#1fae6b';
    button.style.color = '#fff';
    button.style.opacity = '1';
    if (button.classList.contains('m-btn--ghost')) {
      button.style.borderColor = '#1fae6b';
    }
  }

  function markSubmitError(button) {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.style.background = '';
    button.style.color = '';
    button.style.borderColor = '';
    button.style.opacity = '1';
  }

  function submitToSheet(form, activeBtn, inquiryType) {
    if (activeBtn.dataset.submitted === 'true') return;

    var webAppUrl = getConfig();
    if (!webAppUrl) {
      console.warn('[AQbar] contact-config.js에 webAppUrl을 설정해 주세요.');
      markSubmitted(activeBtn);
      return;
    }

    setButtonLoading(activeBtn, true);

    fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormData(form, inquiryType))
    })
      .then(function () {
        markSubmitted(activeBtn);
      })
      .catch(function (error) {
        console.error('[AQbar] 문의 전송 실패:', error);
        markSubmitError(activeBtn);
      });
  }

  function bindForm(form) {
    if (!form || form.dataset.contactBound === 'true') return;

    var submitBtn = form.querySelector('[type="submit"]');
    var pricingBtn = form.querySelector('[data-pricing-inquiry], [data-scroll-pricing]');

    function isFormValid() {
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        if (typeof form.reportValidity === 'function') form.reportValidity();
        return false;
      }
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isFormValid()) return;
      submitToSheet(form, submitBtn, 'poc');
    });

    if (pricingBtn) {
      pricingBtn.addEventListener('click', function () {
        if (!isFormValid()) return;
        submitToSheet(form, pricingBtn, 'pricing');
      });
    }

    form.dataset.contactBound = 'true';
  }

  function init() {
    document.querySelectorAll('.aq-contact-form, .m-form').forEach(bindForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
