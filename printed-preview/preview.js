"use strict";
// Original customer fields, with local-only interaction for the portfolio embed.
const $ = (s) => document.querySelector(s);
const form = $("#request-form");
const show = (id) => {
  for (const name of ["storefront", "order-view", "receipt"])
    $("#" + name).hidden = name !== id;
  window.scrollTo(0, 0);
  const heading = $("#" + id + " h1");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
};
const error = (field, message) => {
  $("#form-error").hidden = false;
  $("#form-error").textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", "form-error");
  field.focus();
};
function updateModelFields() {
  const custom = $("#customModelAddon").value === "yes";
  for (const id of [
    "customModelQuestions",
    "customModelQuestions3",
    "customModelQuestions4",
  ])
    $("#" + id).hidden = !custom;
  $("#customModelQuestions2").hidden = custom;
  for (const name of ["modelDetails", "modelSize", "modelImage"])
    form.elements[name].required = custom;
  form.elements.thingiverseUrl.required = !custom;
}
$("#customModelAddon").addEventListener("change", updateModelFields);
updateModelFields();
document.querySelectorAll("[data-open-order]").forEach((button) => {
  button.disabled = false;
  button.addEventListener("click", () => show("order-view"));
});
$(".preview-nav>a").addEventListener("click", (event) => {
  event.preventDefault();
  show("storefront");
});
$("#cancel-order").addEventListener("click", () => show("storefront"));
$("#edit-request").addEventListener("click", () => show("order-view"));
$("#new-request").addEventListener("click", () => {
  form.reset();
  updateModelFields();
  show("storefront");
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  $("#form-error").hidden = true;
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  });
  const fields = Array.from(form.elements).filter(
    (field) => field.required && field.type !== "submit",
  );
  for (const field of fields) {
    if (!field.value.trim()) {
      error(
        field,
        "Complete the required fields before previewing your request.",
      );
      return;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) {
    error(
      form.elements.email,
      "Enter an email address such as name@example.com.",
    );
    return;
  }
  if (!/^\d+$/.test(form.elements.budget.value.trim())) {
    error(
      form.elements.budget,
      "Enter the budget as a whole number of dollars, such as 25.",
    );
    return;
  }
  const custom = form.elements.printStuff.value === "yes";
  if (!custom && !/^\d+$/.test(form.elements.thingiverseUrl.value.trim())) {
    error(
      form.elements.thingiverseUrl,
      "Enter the numeric Thingiverse model ID.",
    );
    return;
  }
  if (custom) {
    try {
      const url = new URL(form.elements.modelImage.value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      error(form.elements.modelImage, "Enter an http or https image URL.");
      return;
    }
  }
  const entries = [
    ["Name", form.elements.fullName.value],
    ["Email", form.elements.email.value],
    [
      "Model",
      custom
        ? form.elements.modelDetails.value
        : "Thingiverse #" + form.elements.thingiverseUrl.value,
    ],
    ["Budget", "$" + form.elements.budget.value],
    ["Payment preference", form.elements.Payment.value],
  ];
  if (custom)
    entries.push(
      ["Size", form.elements.modelSize.value],
      ["Notes", form.elements.additionalNotes.value || "None"],
    );
  const list = $("#receipt-fields");
  list.replaceChildren();
  for (const [label, value] of entries) {
    const row = document.createElement("div"),
      dt = document.createElement("dt"),
      dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    list.append(row);
  }
  show("receipt");
});

for (const button of document.querySelectorAll("button"))
  button.disabled = false;
