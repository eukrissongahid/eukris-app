class TrackProductWidget extends HTMLElement {
  constructor() {
    super();

    this.emailAttribute = null;
    this.modalEl = null;
    this.formEl = null;
    this.spinnerEl = null;
    this.submitBtnEl = null;
    this.untrackBtnEl = null;
    this.emailInputEl = null;
    this.inputListeners = [];

    this.handleClick = this.handleClick.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleNumberInput = this.handleNumberInput.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  connectedCallback() {
    this.emailAttribute = this.getAttribute('data-customer-email');
    this.modalEl = this.querySelector('#track-widget-template');
    this.formEl = this.querySelector('#track-form');
    this.spinnerEl = this.modalEl?.querySelector('#ttp-loading-spinner');
    this.submitBtnEl = this.formEl?.querySelector('.ttp-submit-button');
    this.untrackBtnEl = this.formEl?.querySelector('.ttp-untrack-button');
    this.emailInputEl = this.formEl?.querySelector('input[name="email"]');

    if (this.emailAttribute && this.emailInputEl) {
      this.emailInputEl.value = this.emailAttribute;
      this.emailInputEl.setAttribute('readonly', 'true');
      this.emailInputEl.classList.add('bg-gray-100', 'cursor-not-allowed');
    }

    this.formEl?.querySelectorAll('.ttp-inline-group').forEach((group) => {
      const checkbox = group.querySelector('input[type="checkbox"]');
      const input = group.querySelector('input[type="number"]');
      if (checkbox && input) {
        input.disabled = !checkbox.checked;
      }
    });

    this.addEventListener('click', this.handleClick);

    const checkboxes = this.formEl?.querySelectorAll('.ttp-checkbox') || [];
    checkboxes.forEach((cb) => cb.addEventListener('change', this.handleCheckboxChange));

    this.formEl?.querySelectorAll('.ttp-input-number')?.forEach((input) => {
      input.addEventListener('input', this.handleNumberInput);
      this.inputListeners.push(input);
    });

    this.formEl?.addEventListener('submit', this.handleFormSubmit);

    this.updateSubmitButtonState();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);

    const checkboxes = this.formEl?.querySelectorAll('.ttp-checkbox') || [];
    checkboxes.forEach((cb) => cb.removeEventListener('change', this.handleCheckboxChange));

    this.inputListeners.forEach((input) => {
      input.removeEventListener('input', this.handleNumberInput);
    });
    this.inputListeners = [];

    this.formEl?.removeEventListener('submit', this.handleFormSubmit);
  }

  updateSubmitButtonState() {
    const checkboxes = this.formEl?.querySelectorAll('.ttp-checkbox') || [];
    const anyChecked = Array.from(checkboxes).some((cb) => cb.checked);
    if (this.submitBtnEl) {
      this.submitBtnEl.disabled = !anyChecked;
    }
  }

  handleCheckboxChange() {
    this.updateSubmitButtonState();

    this.formEl?.querySelectorAll('.ttp-inline-group').forEach((group) => {
      const checkbox = group.querySelector('input[type="checkbox"]');
      const input = group.querySelector('input[type="number"]');
      if (checkbox && input) {
        input.disabled = !checkbox.checked;
        if (!checkbox.checked) input.value = '0';
      }
    });
  }

  handleNumberInput(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }

  async handleClick(event) {
    const target = event.target;

    if (target.classList.contains('open-track-widget')) {
      this.modalEl?.classList.remove('ttp-hidden');
      this.spinnerEl?.classList.remove('ttp-hidden');

      const userId = this.formEl.querySelector('input[name="userId"]')?.value;
      const productId = this.formEl.querySelector('input[name="productId"]')?.value;

      const urlParams = new URLSearchParams(window.location.search);
      let currentVariantId = urlParams.get('variant');

      if (!currentVariantId) {
        currentVariantId = this.formEl.querySelector('input[name="variantId"]')?.value || '';
      }

      const variantInput = this.formEl.querySelector('input[name="variantId"]');
      if (variantInput && currentVariantId) {
        variantInput.value = currentVariantId;
      }

      const variantId = variantInput?.value;

      if (userId && productId && variantId) {
        try {
          const res = await fetch(
            `/apps/proxytest?userId=${userId}&productId=${productId}&variantId=${variantId}`,
          );
          const result = await res.json();

          if (result.success && result.tracker) {
            const t = result.tracker;
            this.formEl.trackInStock.checked = t.trackInStock;
            this.formEl.trackOnSale.checked = t.trackOnSale;
            this.formEl.trackBelowThreshold.checked = t.trackBelowThreshold;
            this.formEl.saleThreshold.value = t.saleThreshold ?? '';
            this.formEl.trackLowStock.checked = t.trackLowStock;
            this.formEl.lowStockLevel.value = t.lowStockLevel ?? '';
            this.formEl.trackNewVariant.checked = t.trackNewVariant;

            this.untrackBtnEl.disabled = false;
          } else {
            this.untrackBtnEl.disabled = true;
          }
        } catch (error) {
          this.untrackBtnEl.disabled = true;
        }
      } else {
        this.untrackBtnEl.disabled = true;
      }

      this.formEl?.querySelectorAll('.ttp-inline-group').forEach((group) => {
        const checkbox = group.querySelector('input[type="checkbox"]');
        const input = group.querySelector('input[type="number"]');
        if (checkbox && input) {
          input.disabled = !checkbox.checked;
        }
      });

      this.spinnerEl?.classList.add('ttp-hidden');
      this.updateSubmitButtonState();
    }

    if (target.classList.contains('ttp-close-button')) {
      this.modalEl?.classList.add('ttp-hidden');
      this.spinnerEl?.classList.add('ttp-hidden');
      this.formEl?.reset();
    }

    if (target.classList.contains('ttp-untrack-button')) {
      event.preventDefault();
      this.untrackBtnEl.disabled = true;

      const userId = this.formEl.querySelector('input[name="userId"]')?.value;
      const productId = this.formEl.querySelector('input[name="productId"]')?.value;
      const variantId = this.formEl.querySelector('input[name="variantId"]')?.value;

      if (userId && productId && variantId) {
        try {
          const res = await fetch('/apps/proxytest', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, variantId }),
          });
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.message);
          alert('🗑️ Successfully untracked product.');
          this.modalEl?.classList.add('ttp-hidden');
          this.formEl.reset();
        } catch (error) {
          alert(`❌ Failed to untrack product: ${error.message}`);
        } finally {
          this.untrackBtnEl.disabled = false;
        }
      }
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    this.submitBtnEl.disabled = true;

    const priceCheckbox = this.formEl.querySelector('input[name="trackBelowThreshold"]');
    const priceInput = this.formEl.querySelector('input[name="saleThreshold"]');
    const stockCheckbox = this.formEl.querySelector('input[name="trackLowStock"]');
    const stockInput = this.formEl.querySelector('input[name="lowStockLevel"]');

    const priceValue = parseFloat(priceInput?.value || '0');
    const stockValue = parseInt(stockInput?.value || '0', 10);

    if (priceCheckbox?.checked && priceValue <= 0) {
      alert('⚠️ Please enter a price threshold greater than 0.');
      this.submitBtnEl.disabled = false;
      priceInput?.focus();
      return;
    }

    if (stockCheckbox?.checked && stockValue <= 0) {
      alert('⚠️ Please enter a stock level greater than 0.');
      this.submitBtnEl.disabled = false;
      stockInput?.focus();
      return;
    }

    const formData = new FormData(this.formEl);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/apps/proxytest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unknown error');

      alert(`✅ ${result.message}`);
      this.modalEl?.classList.add('ttp-hidden');
      this.formEl.reset();
    } catch (error) {
      alert(`❌ ${error.message || 'Something went wrong. Please try again.'}`);
    } finally {
      this.submitBtnEl.disabled = false;
    }
  }
}

customElements.define('track-product-widget', TrackProductWidget);
