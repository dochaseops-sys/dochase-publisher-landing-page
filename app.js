const form = document.querySelector("#waitlist-form");
const submitButton = form.querySelector(".submit-button");
const formStatus = document.querySelector("#form-status");
const successView = document.querySelector("#success-view");
const formView = document.querySelector("#form-view");
const endpoint = window.DOCHGAMES_WAITLIST_CONFIG?.endpoint || "";

const fields = {
  fullName: {
    input: document.querySelector("#full-name"),
    error: document.querySelector("#full-name-error"),
    message: "Enter your full name.",
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

function isValidWebsite(value) {
  try {
    const url = new URL(`https://${normalizeWebsite(value)}`);
    return url.hostname.includes(".") && !url.hostname.includes(" ");
  } catch {
    return false;
  }
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

  if (!fields.fullName.input.value.trim()) {
    setError(fields.fullName, fields.fullName.message);
    valid = false;
  }
  if (!fields.email.input.validity.valid || !fields.email.input.value.trim()) {
    setError(fields.email, fields.email.message);
    valid = false;
  }
  if (!fields.publication.input.value.trim()) {
    setError(fields.publication, fields.publication.message);
    valid = false;
  }
  if (!isValidWebsite(fields.website.input.value)) {
    setError(fields.website, fields.website.message);
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
  document.querySelector("#success-name").textContent = fields.fullName.input.value.trim().split(" ")[0];
  document.querySelector("#success-email").textContent = fields.email.input.value.trim();
  successView.querySelector(".success-label").textContent = status === "duplicate" ? "Registration already received" : "Registration received";
  successView.querySelector("h2").textContent = status === "duplicate" ? "We already have your registration." : "Your website is registered.";
  formView.hidden = true;
  successView.hidden = false;
  successView.focus();
}

form.addEventListener("submit", (event) => {
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
  if (data.status === "success" || data.status === "duplicate") showSuccess(data.status);
  else {
    setLoading(false);
    formStatus.textContent = data.message || "We couldn’t save your details. Please check the form and try again.";
  }
});

document.querySelector("#submit-another").addEventListener("click", () => {
  form.reset();
  formView.hidden = false;
  successView.hidden = true;
  formStatus.textContent = "";
  fields.fullName.input.focus();
});

document.querySelector("#year").textContent = new Date().getFullYear();
