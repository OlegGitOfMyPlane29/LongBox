"use strict";

const lengthRange  = document.getElementById("length-range");
const lengthNumber = document.getElementById("length");
const uppercaseCb  = document.getElementById("uppercase");
const digitsCb     = document.getElementById("digits");
const symbolsCb    = document.getElementById("symbols");
const generateBtn  = document.getElementById("generate-btn");
const resultBlock  = document.getElementById("result-block");
const passwordOut  = document.getElementById("password-output");
const errorBlock   = document.getElementById("error-block");
const copyBtn      = document.getElementById("copy-btn");
const copyHint     = document.getElementById("copy-hint");
const strengthBar  = document.getElementById("strength-bar");
const strengthText = document.getElementById("strength-text");
const returnBtn    = document.getElementById("return-btn");
const prevBlock    = document.getElementById("prev-block");
const prevOut      = document.getElementById("prev-password-output");

let previousPassword = null;

// Strength calculation
function calcStrength(length, uppercase, digits, symbols) {
    let lengthScore = 0;
    if (length >= 16)     lengthScore = 3;
    else if (length >= 12) lengthScore = 2;
    else if (length >= 8)  lengthScore = 1;

    let typesScore = 0;
    if (uppercase) typesScore++;
    if (digits)    typesScore++;
    if (symbols)   typesScore++;

    const total = lengthScore + typesScore; // 0–6
    if (total <= 2) return "weak";
    if (total <= 4) return "normal";
    return "strong";
}

function updateStrength() {
    const length = parseInt(lengthNumber.value) || 4;
    const level  = calcStrength(length, uppercaseCb.checked, digitsCb.checked, symbolsCb.checked);
    const labels = { weak: "Weak", normal: "Normal", strong: "Strong" };

    strengthBar.className  = "strength-bar " + level;
    strengthText.className = "strength-text " + level;
    strengthText.textContent = labels[level];
}

// Sync slider <-> number input
lengthRange.addEventListener("input", () => {
    lengthNumber.value = lengthRange.value;
    updateStrength();
});

lengthNumber.addEventListener("input", () => {
    const val = Math.min(128, Math.max(4, parseInt(lengthNumber.value) || 4));
    lengthNumber.value = val;
    lengthRange.value  = val;
    updateStrength();
});

[uppercaseCb, digitsCb, symbolsCb].forEach(cb => cb.addEventListener("change", updateStrength));

// Init on load
updateStrength();

// Generate
generateBtn.addEventListener("click", async () => {
    hideError();
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";

    const payload = {
        length:    parseInt(lengthNumber.value),
        uppercase: uppercaseCb.checked,
        digits:    digitsCb.checked,
        symbols:   symbolsCb.checked,
    };

    try {
        const response = await fetch("/api/generate", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || "Unknown server error");
            return;
        }

        showResult(data.password);

    } catch (err) {
        showError("Network error: could not reach the server.");
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate";
    }
});

// Copy to clipboard
copyBtn.addEventListener("click", () => {
    const text = passwordOut.textContent;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showCopyHint);
    } else {
        // Fallback for non-secure context (plain http)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity  = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showCopyHint();
    }
});

function showResult(password) {
    if (passwordOut.textContent) {
        previousPassword = passwordOut.textContent;
        returnBtn.disabled = false;
    }
    prevBlock.classList.add("hidden");
    passwordOut.textContent = password;
    resultBlock.classList.remove("hidden");
    errorBlock.classList.add("hidden");
    copyHint.classList.add("hidden");
}

returnBtn.addEventListener("click", () => {
    if (previousPassword === null) return;
    prevOut.textContent = previousPassword;
    prevBlock.classList.remove("hidden");
});

function showError(message) {
    errorBlock.textContent = message;
    errorBlock.classList.remove("hidden");
    resultBlock.classList.add("hidden");
}

function hideError() {
    errorBlock.classList.add("hidden");
}

function showCopyHint() {
    copyHint.classList.remove("hidden");
    setTimeout(() => copyHint.classList.add("hidden"), 1800);
}
