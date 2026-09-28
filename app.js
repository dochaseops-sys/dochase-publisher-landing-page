const form = document.querySelector("#waitlist-form");
const submitButton = form.querySelector(".submit-button");
const formStatus = document.querySelector("#form-status");
const successView = document.querySelector("#success-view");
const formView = document.querySelector("#form-view");
const endpoint = window.DOCHGAMES_WAITLIST_CONFIG?.endpoint || "";

const fields = {
  firstName: {
    input: document.querySelector("#first-name"),
    error: document.querySelector("#first-name-error"),
    message: "Enter your first name.",
  },
  lastName: {
    input: document.querySelector("#last-name"),
    error: document.querySelector("#last-name-error"),
    message: "Enter your last name.",
  },
  email: {
    input: document.querySelector("#work-email"),
    error: document.querySelector("#work-email-error"),
    message: "Enter a valid work email.",
  },
  publication: {
    input: document.querySelector("#publication"),
    error: document.querySelector("#publication-error"),
    message: "Enter your publication or company name.",
  },
  website: {
    input: document.querySelector("#website"),
    error: document.querySelector("#website-error"),
    message: "Enter a valid website address.",
  },
  consent: {
    input: document.querySelector("#consent"),
    error: document.querySelector("#consent-error"),
    message: "Please confirm that we may contact you about your widget registration.",
  },
};

function isConfigured() {
  return endpoint.startsWith("https://script.google.com/macros/s/") && endpoint.endsWith("/exec");
}

function normalizeWebsite(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

// Keep these domain rules identical in app.js and google-apps-script/Code.gs.
function websiteHost(value) {
  const address = String(value || "").trim();
  if (!address || /[\s\\\u0000-\u001F\u007F]/.test(address)) return "";
  const match = address.match(/^(?:https?:\/\/)?([^/?#]+)(?:[/?#].*)?$/i);
  if (!match) return "";
  const authority = match[1].match(/^([a-z0-9.-]+)(?::([0-9]{1,5}))?$/i);
  if (!authority || (authority[2] && (+authority[2] < 1 || +authority[2] > 65535))) return "";
  const host = authority[1].toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (host.length > 253 || labels.length < 2 || !/^[a-z]{2,}$/.test(labels[labels.length - 1])) return "";
  if (!labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return "";
  return host.replace(/^www\./, "");
}

function isBlockedWebsite(value) {
  const host = websiteHost(value);
  return ["dochase.com", "dochaseadx.com", "facebook.com", "instagram.com", "google.com"].some((domain) => host === domain || host.endsWith("." + domain));
}

function isBlockedPublication(value) {
  const name = String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
  return /\b(?:dochase(?:\s*adx)?|face\s*book|insta\s*gram|google)\b/.test(name);
}

function isValidWebsite(value) {
  return Boolean(websiteHost(value));
}

function setError(field, message = "") {
  field.error.textContent = message;
  field.input.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) field.input.setAttribute("aria-describedby", field.error.id);
  else field.input.removeAttribute("aria-describedby");
}

function validate() {
  let valid = true;
  for (const field of Object.values(fields)) setError(field);

  for (const field of [fields.firstName, fields.lastName]) {
    if (!field.input.value.trim()) {
      setError(field, field.message);
      valid = false;
    }
  }
  if (!fields.email.input.validity.valid || !fields.email.input.value.trim()) {
    setError(fields.email, fields.email.message);
    valid = false;
  }
  if (!fields.publication.input.value.trim()) {
    setError(fields.publication, fields.publication.message);
    valid = false;
  } else if (isBlockedPublication(fields.publication.input.value)) {
    setError(fields.publication, "Enter your own publication or company name. Dochase, Facebook, Instagram and Google cannot be used.");
    valid = false;
  }
  if (!isValidWebsite(fields.website.input.value)) {
    setError(fields.website, fields.website.message);
    valid = false;
  } else if (isBlockedWebsite(fields.website.input.value)) {
    setError(fields.website, "Enter your own publication’s website. Dochase, Facebook, Instagram and Google URLs cannot be registered.");
    valid = false;
  }
  if (!fields.consent.input.checked) {
    setError(fields.consent, fields.consent.message);
    valid = false;
  }

  if (!valid) document.querySelector('[aria-invalid="true"]')?.focus();
  return valid;
}

function setLoading(loading) {
  submitButton.disabled = loading;
  submitButton.classList.toggle("is-loading", loading);
  submitButton.querySelector("span:first-child").textContent = loading ? "Sending…" : "Register my website";
}

function showSuccess(status) {
  setLoading(false);
  document.querySelector("#success-name").textContent = fields.firstName.input.value.trim();
  document.querySelector("#success-email").textContent = fields.email.input.value.trim();
  successView.querySelector(".success-label").textContent = status === "duplicate" ? "Registration already received" : "Registration received";
  successView.querySelector("h2").textContent = status === "duplicate" ? "We already have your registration." : "Your website is registered.";
  formView.hidden = true;
  successView.hidden = false;
  successView.focus();
}

form.addEventListener("submit", (event) => {
  if (submitButton.disabled) {
    event.preventDefault();
    return;
  }
  formStatus.textContent = "";
  if (!validate()) {
    event.preventDefault();
    return;
  }

  if (!isConfigured()) {
    event.preventDefault();
    formStatus.textContent = "Submissions are being connected. Please try again shortly.";
    return;
  }

  // Retain fullName for compatibility while the Apps Script deployment is updated.
  document.querySelector("#full-name").value = fields.firstName.input.value.trim() + " " + fields.lastName.input.value.trim();
  fields.website.input.value = normalizeWebsite(fields.website.input.value);
  form.action = endpoint;
  setLoading(true);

  window.setTimeout(() => {
    if (submitButton.disabled) {
      setLoading(false);
      formStatus.textContent = "We couldn’t confirm your submission. Please try again.";
    }
  }, 12000);
});

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.source !== "dochgames-publisher-waitlist") return;
  if (data.status === "success") showSuccess(data.status);
  else if (data.status === "duplicate") {
    setLoading(false);
    formStatus.textContent = data.message || "A registration already exists for this email or website. If you need to update it, contact the DochGames team.";
  } else {
    setLoading(false);
    formStatus.textContent = data.message || "We couldn’t save your details. Please check the form and try again.";
  }
});

document.querySelector("#submit-another").addEventListener("click", () => {
  form.reset();
  formView.hidden = false;
  successView.hidden = true;
  formStatus.textContent = "";
  fields.firstName.input.focus();
});

document.querySelector("#year").textContent = new Date().getFullYear();
