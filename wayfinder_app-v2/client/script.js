document.getElementById("sendBtn").addEventListener("click", async () => {
  const prompt = document.getElementById("prompt").value;
  const outputDiv = document.getElementById("output");
  outputDiv.textContent = "⚡ Processing...";

  const res = await fetch("/api/wayfinder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  outputDiv.textContent = data.output || "⚠️ No response.";
});
