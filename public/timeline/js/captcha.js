import query from "./api.js";
import toastQueue from "../../shared/toasts.js";

export async function showCaptchaModal() {
	// Create modal HTML
	const modal = document.createElement("div");
	modal.className = "modal fade show";
	modal.style.display = "block";
	modal.style.backgroundColor = "rgba(0,0,0,0.8)";
	modal.style.zIndex = "9999";
	modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Security Check</h5>
                </div>
                <div class="modal-body">
                    <p>Your account has been flagged for suspicious activity. Please complete this security check to restore full access.</p>
                    <div id="captchaContainer" class="text-center my-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="input-group mb-3">
                        <input type="number" id="captchaInput" class="form-control" placeholder="Enter answer">
                        <button class="btn btn-primary" id="verifyCaptchaBtn">Verify</button>
                    </div>
                    <div id="captchaError" class="text-danger small"></div>
                </div>
            </div>
        </div>
    `;
	document.body.appendChild(modal);

	// Load captcha
	try {
		const data = await query("/captcha");
		const container = modal.querySelector("#captchaContainer");
		container.innerHTML = `<h2 class="display-6 fw-bold">${data.challenge}</h2>`;

		const verifyBtn = modal.querySelector("#verifyCaptchaBtn");
		const input = modal.querySelector("#captchaInput");
		const errorDiv = modal.querySelector("#captchaError");

		input.focus();

		const verify = async () => {
			const answer = input.value.trim();
			if (!answer) return;

			verifyBtn.disabled = true;
			verifyBtn.innerHTML =
				'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

			try {
				const result = await query("/captcha/verify", {
					method: "POST",
					body: JSON.stringify({ id: data.id, answer }),
				});

				if (result.success) {
					modal.remove();
					toastQueue.add(
						"<h1>Security check passed</h1><p>Your account access has been restored.</p>",
					);
					// Reload page to refresh state
					setTimeout(() => window.location.reload(), 1500);
				} else {
					errorDiv.textContent = result.error || "Incorrect answer";
					verifyBtn.disabled = false;
					verifyBtn.textContent = "Verify";
					input.value = "";
					input.focus();
				}
			} catch (e) {
				console.error(e);
				errorDiv.textContent = "Verification failed";
				verifyBtn.disabled = false;
				verifyBtn.textContent = "Verify";
			}
		};

		verifyBtn.addEventListener("click", verify);
		input.addEventListener("keypress", (e) => {
			if (e.key === "Enter") verify();
		});
	} catch (e) {
		console.error("Failed to load captcha:", e);
		modal.querySelector("#captchaContainer").innerHTML =
			"<p class='text-danger'>Failed to load challenge. Please refresh.</p>";
	}
}
