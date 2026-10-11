const status = document.getElementById("status");
const started = new Date();

status.textContent = `Served at ${started.toLocaleTimeString()} on this machine.`;
