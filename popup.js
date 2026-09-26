// ============================================
// LC2Git - Popup Script
// ============================================


// --------------------------------------------
// DOM Elements
// --------------------------------------------

const statusText =
    document.getElementById("statusText");

const statusDot =
    document.getElementById("statusDot");

const connectSection =
    document.getElementById("connectSection");

const connectedSection =
    document.getElementById("connectedSection");

const githubToken =
    document.getElementById("githubToken");

const connectButton =
    document.getElementById("connectGithub");

const disconnectButton =
    document.getElementById("disconnectGithub");

const githubUsername =
    document.getElementById("githubUsername");

const repoName =
    document.getElementById("repoName");

const syncButton =
    document.getElementById("syncNow");

const syncedCountElement =
    document.getElementById("syncedCount");

const commitCountElement =
    document.getElementById("commitCount");

const historyList =
    document.getElementById("historyList");

const messageElement =
    document.getElementById("message");


// --------------------------------------------
// Initialize Popup
// --------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadStatus();

        loadStats();

    }
);


// --------------------------------------------
// Load GitHub Status
// --------------------------------------------

async function loadStatus() {

    try {

        const data =
            await chrome.storage.local.get([
                "githubConnected",
                "githubUsername",
                "githubRepository"
            ]);


        console.log(
            "LC2Git: GitHub status:",
            data
        );


        // ------------------------------------
        // CONNECTED
        // ------------------------------------

        if (data.githubConnected === true) {

            // Status
            if (statusText) {

                statusText.textContent =
                    "Connected";

            }


            if (statusDot) {

                statusDot.textContent =
                    "●";

            }


            // Hide token/connect section
            if (connectSection) {

                connectSection.style.display =
                    "none";

            }


            // Show connected section
            if (connectedSection) {

                connectedSection.style.display =
                    "block";

            }


            // Username
            if (githubUsername) {

                githubUsername.textContent =
                    data.githubUsername ||
                    "GitHub User";

            }


            // Repository
            if (repoName) {

                repoName.textContent =
                    data.githubRepository ||
                    "Rudra-AI-2127/leetcode-solutions";

            }


            // Enable sync
            if (syncButton) {

                syncButton.disabled =
                    false;

            }


        } else {

            // --------------------------------
            // NOT CONNECTED
            // --------------------------------

            if (statusText) {

                statusText.textContent =
                    "Not connected";

            }


            if (statusDot) {

                statusDot.textContent =
                    "●";

            }


            // Show token/connect section
            if (connectSection) {

                connectSection.style.display =
                    "block";

            }


            // Hide connected section
            if (connectedSection) {

                connectedSection.style.display =
                    "none";

            }


            // Disable sync
            if (syncButton) {

                syncButton.disabled =
                    true;

            }

        }


    } catch (error) {

        console.error(
            "LC2Git: Failed to load status:",
            error
        );


        if (statusText) {

            statusText.textContent =
                "Error";

        }

    }

}


// --------------------------------------------
// Load Statistics + History
// --------------------------------------------

async function loadStats() {

    try {

        const data =
            await chrome.storage.local.get([
                "syncedCount",
                "commitCount",
                "syncHistory"
            ]);


        console.log(
            "LC2Git: Stats:",
            data
        );


        // Statistics
        if (syncedCountElement) {

            syncedCountElement.textContent =
                data.syncedCount || 0;

        }


        if (commitCountElement) {

            commitCountElement.textContent =
                data.commitCount || 0;

        }


        // History
        renderSyncHistory(
            data.syncHistory || []
        );


    } catch (error) {

        console.error(
            "LC2Git: Failed to load statistics:",
            error
        );

    }

}


// --------------------------------------------
// Render Sync History
// --------------------------------------------

function renderSyncHistory(history) {

    if (!historyList) {

        return;

    }


    if (
        !history ||
        history.length === 0
    ) {

        historyList.innerHTML = `

            <p class="emptyHistory">
                No synced solutions yet.
            </p>

        `;

        return;

    }


    historyList.innerHTML =

        history
            .slice(0, 20)
            .map(entry => {

                const number =
                    entry.number || "?";

                const problem =
                    entry.problem ||
                    "Unknown Problem";

                const language =
                    formatLanguage(
                        entry.language
                    );

                const folder =
                    entry.folder ||
                    "Other";

                const time =
                    formatRelativeTime(
                        entry.timestamp
                    );


                return `

                    <div class="historyItem">

                        <div class="historyTitle">

                            #${escapeHtml(number)}
                            ${escapeHtml(problem)}

                        </div>

                        <div class="historyMeta">

                            ${escapeHtml(language)}
                            •
                            ${escapeHtml(folder)}
                            •
                            ${escapeHtml(time)}

                        </div>

                    </div>

                `;

            })
            .join("");

}


// --------------------------------------------
// Format Language
// --------------------------------------------

function formatLanguage(language) {

    if (!language) {

        return "Unknown";

    }


    const normalized =
        language
            .toLowerCase()
            .trim();


    const languageMap = {

        javascript: "JavaScript",

        js: "JavaScript",

        typescript: "TypeScript",

        ts: "TypeScript",

        python: "Python",

        python3: "Python",

        java: "Java",

        cpp: "C++",

        "c++": "C++",

        c: "C",

        csharp: "C#",

        "c#": "C#",

        go: "Go",

        golang: "Go",

        rust: "Rust",

        kotlin: "Kotlin",

        swift: "Swift",

        php: "PHP",

        ruby: "Ruby"

    };


    return (
        languageMap[normalized] ||
        language
    );

}


// --------------------------------------------
// Relative Time
// --------------------------------------------

function formatRelativeTime(timestamp) {

    if (!timestamp) {

        return "Unknown time";

    }


    const date =
        new Date(timestamp);


    if (isNaN(date.getTime())) {

        return "Unknown time";

    }


    const seconds =
        Math.floor(
            (Date.now() -
                date.getTime()) / 1000
        );


    if (seconds < 60) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return minutes === 1
            ? "1 minute ago"
            : `${minutes} minutes ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return hours === 1
            ? "1 hour ago"
            : `${hours} hours ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 7) {

        return days === 1
            ? "Yesterday"
            : `${days} days ago`;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// --------------------------------------------
// Escape HTML
// --------------------------------------------

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// --------------------------------------------
// Connect GitHub
// --------------------------------------------

if (connectButton) {

    connectButton.addEventListener(
        "click",
        async () => {

            const token =
                githubToken?.value.trim();


            if (!token) {

                if (messageElement) {

                    messageElement.textContent =
                        "Please enter your GitHub token.";

                }

                return;

            }


            connectButton.disabled =
                true;

            connectButton.textContent =
                "Connecting...";


            try {

                const response =
                    await chrome.runtime.sendMessage({

                        type:
                            "CONNECT_GITHUB",

                        token:
                            token

                    });


                console.log(
                    "LC2Git: Connection response:",
                    response
                );


                if (
                    response &&
                    response.success
                ) {

                    if (githubToken) {

                        githubToken.value =
                            "";

                    }


                    if (messageElement) {

                        messageElement.textContent =
                            "";

                    }


                    await loadStatus();

                } else {

                    if (messageElement) {

                        messageElement.textContent =
                            response?.message ||
                            "GitHub connection failed.";

                    }

                }


            } catch (error) {

                console.error(
                    "LC2Git: GitHub connection error:",
                    error
                );


                if (messageElement) {

                    messageElement.textContent =
                        error.message ||
                        "GitHub connection failed.";

                }


            } finally {

                connectButton.disabled =
                    false;

                connectButton.textContent =
                    "Connect GitHub";

            }

        }
    );

}


// --------------------------------------------
// Disconnect GitHub
// --------------------------------------------

if (disconnectButton) {

    disconnectButton.addEventListener(
        "click",
        async () => {

            try {

                const response =
                    await chrome.runtime.sendMessage({

                        type:
                            "DISCONNECT_GITHUB"

                    });


                console.log(
                    "LC2Git: Disconnect response:",
                    response
                );


                await loadStatus();


            } catch (error) {

                console.error(
                    "LC2Git: Disconnect error:",
                    error
                );

            }

        }
    );

}


// --------------------------------------------
// Sync Current Problem
// --------------------------------------------

if (syncButton) {

    syncButton.addEventListener(
        "click",
        async () => {

            syncButton.disabled =
                true;


            const originalText =
                syncButton.textContent;


            syncButton.textContent =
                "Syncing...";


            try {

                const response =
                    await chrome.runtime.sendMessage({

                        type:
                            "SYNC_SOLUTION"

                    });


                console.log(
                    "LC2Git: Manual sync response:",
                    response
                );


                if (
                    response &&
                    response.success
                ) {

                    syncButton.textContent =
                        "✓ Synced";


                    await loadStats();


                    setTimeout(
                        () => {

                            syncButton.textContent =
                                originalText;

                        },
                        1500
                    );


                } else {

                    if (messageElement) {

                        messageElement.textContent =
                            response?.message ||
                            "Sync failed.";

                    }


                    syncButton.textContent =
                        originalText;

                }


            } catch (error) {

                console.error(
                    "LC2Git: Manual sync error:",
                    error
                );


                if (messageElement) {

                    messageElement.textContent =
                        error.message ||
                        "Sync failed.";

                }


                syncButton.textContent =
                    originalText;


            } finally {

                syncButton.disabled =
                    false;

            }

        }
    );

}