// public/terminal.js
const consoleEl = document.getElementById("console");
const formEl = document.getElementById("cmdForm");
const inputEl = document.getElementById("cmdInput");

// Keep scroll pinned to bottom
function scrollBottom() {
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function printLine(text, classes = []) {
  const div = document.createElement("div");
  div.classList.add("line", ...classes);
  div.textContent = text;
  consoleEl.appendChild(div);
  scrollBottom();
}

function clearConsole() {
  consoleEl.innerHTML = "";
}

async function sendCommand(cmd) {
  // Local instant behavior
  if (cmd.trim().toLowerCase() === "clear") {
    clearConsole();
    return;
  }

  // Call backend
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: cmd })
  });

  if (!res.ok) {
    printLine("Wayfinder: (service unavailable). Try again.", ["muted"]);
    return;
  }

  const data = await res.json();
  if (data?.text === "__CLEAR__") {
    clearConsole();
    return;
  }
  printLine(data?.text || "(no content)");
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const cmd = inputEl.value.trim();
  if (!cmd) return;

  // echo the command
  printLine(`λ ${cmd}`, ["cmd"]);
  inputEl.value = "";
  sendCommand(cmd).catch(() => {
    printLine("Wayfinder: (network error).", ["muted"]);
  });
});

// focus input on load
window.addEventListener("load", () => {
  inputEl.focus();
});
