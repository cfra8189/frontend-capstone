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
  const input = cmd.trim().toLowerCase();

  // Local instant behavior
  if (input === "clear") {
    clearConsole();
    return;
  }

  if (input === "agreements") {
    try {
      const res = await fetch("data.json");
      const data = await res.json();
      printLine("Available Agreement Templates:", ["cmd"]);
      Object.keys(data.agreements).forEach(key => {
        printLine(`- ${key}: ${data.agreements[key].name}`);
      });
    } catch (err) {
      printLine("Wayfinder: Error loading templates.", ["muted"]);
    }
    return;
  }

  if (input.startsWith("generate ")) {
    const type = input.replace("generate ", "").trim();
    try {
      const res = await fetch("data.json");
      const data = await res.json();
      if (data.agreements[type]) {
        printLine(`--- GENERATING ${data.agreements[type].name.toUpperCase()} ---`, ["cmd"]);
        printLine(data.agreements[type].content);
      } else {
        printLine(`Template '${type}' not found. Type 'agreements' for list.`);
      }
    } catch (err) {
      printLine("Wayfinder: Error loading templates.", ["muted"]);
    }
    return;
  }

  if (input === "framework") {
    try {
      const res = await fetch("data.json");
      const data = await res.json();
      printLine("Creative Identity Framework:", ["cmd"]);
      Object.entries(data.framework).forEach(([layer, desc]) => {
        printLine(`${layer}: ${desc}`);
      });
    } catch (err) {
      printLine("Wayfinder: Error loading framework.");
    }
    return;
  }

  if (input === "login") {
    printLine("Redirecting to login...", ["cmd"]);
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 500);
    return;
  }

  if (input === "register" || input === "signup") {
    printLine("Redirecting to registration...", ["cmd"]);
    setTimeout(() => {
      window.location.href = "/dashboard.html#register";
    }, 500);
    return;
  }

  if (input === "dashboard") {
    printLine("Opening dashboard...", ["cmd"]);
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 500);
    return;
  }

  if (input === "creative" || input === "space" || input === "notes" || input === "journal") {
    printLine("Opening your Creative Space...", ["cmd"]);
    setTimeout(() => {
      window.location.href = "/creative.html";
    }, 500);
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
  
  if (data?.redirect) {
    printLine("Redirecting...", ["muted"]);
    setTimeout(() => {
      window.location.href = data.redirect;
    }, 1000);
  }
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
  printLine("WAYFINDER OS v2.0 READY.", ["cmd"]);
  printLine("Type 'help' to see available commands.", ["muted"]);
});
