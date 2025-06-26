class TrackProductWidget extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const modal = this.querySelector("#track-widget-template");
    const form = this.querySelector("#track-form");
    const openBtn = this.querySelector(".open-track-widget");
    const cancelBtn = this.querySelector(".cancel-track-widget");
    const spinner = modal.querySelector("#ttp-loading-spinner");
    const submitBtn = form?.querySelector('.ttp-submit-button');

    const email = this.getAttribute("data-customer-email");
    const emailInput = form?.querySelector('input[name="email"]');

    if (email && emailInput) {
      emailInput.value = email;
      emailInput.setAttribute("readonly", "true");
      emailInput.classList.add("bg-gray-100", "cursor-not-allowed");
    }

    openBtn?.addEventListener("click", async () => {
      console.log("Opening track widget modal");
      modal?.classList.remove("ttp-hidden");
      spinner?.classList.remove("ttp-hidden");

      const inputs = form?.querySelectorAll("input, button");
      inputs?.forEach((el) => el.setAttribute("disabled", "true"));

      const userId = form.querySelector('input[name="userId"]')?.value;
      const productId = form.querySelector('input[name="productId"]')?.value;
      const variantId = form.querySelector('input[name="variantId"]')?.value;

      if (userId && userId !== "guest") {
        try {
          const res = await fetch(
            `/apps/proxytest?userId=${userId}&productId=${productId}&variantId=${variantId}`,
          );
          const result = await res.json();
          console.log("Track data fetched:", result);
          if (result.success && result.tracker) {
            const t = result.tracker;

            form.trackInStock.checked = t.trackInStock;
            form.trackOnSale.checked = t.trackOnSale;
            form.trackBelowThreshold.checked = t.trackLowStock;
            form.saleThreshold.value = t.saleThreshold ?? "";
            form.trackLowStock.checked = t.trackLowStock;
            form.lowStockLevel.value = t.lowStockLevel ?? "";
            form.trackNewVariant.checked = t.trackNewVariant;
          }
        } catch (error) {
          console.warn("⚠️ Failed to fetch tracking data", error);
        }
      } else {
        console.log("⚠️ No userId found, skipping pre-fill");
      }

      spinner?.classList.add("ttp-hidden");
      inputs?.forEach((el) => el.removeAttribute("disabled"));
      submitBtn.disabled = false;
    });

    cancelBtn?.addEventListener("click", () => {
      modal?.classList.add("ttp-hidden");
      spinner?.classList.add("ttp-hidden");
      form?.reset();
    });

    form?.querySelectorAll(".ttp-input-number")?.forEach((input) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9]/g, "");
      });
    });

    if (form) {
      form.addEventListener("submit", async (e) => {
        console.log("submitting track form");
        e.preventDefault();
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
          const response = await fetch("/apps/proxytest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || "Unknown error");
          }

          alert(`✅ ${result.message}`);
          modal?.classList.add("ttp-hidden");
          form.reset();
        } catch (error) {
          console.log("Track request failed:", error);
          alert(
            `❌ ${error.message || "Something went wrong. Please try again."}`,
          );
        }
      });
    }
  }
}

customElements.define("track-product-widget", TrackProductWidget);
