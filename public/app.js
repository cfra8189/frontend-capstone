const terminal = document.getElementById("terminal");
const form = document.getElementById("terminal-form");
const input = document.getElementById("terminal-input");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const command = input.value.trim();
  if (!command) return;

  // Display user input
  addLine(`> ${command}`, "text-blue-400");

  // Send to backend
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: command }),
  });
  const data = await res.json();

  // Display response
  addLine(data.reply, "text-green-400");

  input.value = "";
  terminal.scrollTop = terminal.scrollHeight;
});

function addLine(text, style = "text-green-400") {
  const line = document.createElement("div");
  line.className = style;
  line.textContent = text;
  terminal.appendChild(line);
}
