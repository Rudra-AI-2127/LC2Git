document.addEventListener("DOMContentLoaded", () => {

    const connectButton = document.getElementById("connectGithub");
    const syncButton = document.getElementById("syncNow");
    const message = document.getElementById("message");

    connectButton.addEventListener("click", () => {
        message.textContent = "GitHub connection coming next...";
    });

    syncButton.addEventListener("click", () => {
        message.textContent = "Sync system coming next...";
    });

});