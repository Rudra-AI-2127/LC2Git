const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const connectSection = document.getElementById("connectSection");
const connectedSection = document.getElementById("connectedSection");

const githubToken = document.getElementById("githubToken");
const connectGithub = document.getElementById("connectGithub");
const disconnectGithub = document.getElementById("disconnectGithub");

const githubUsername = document.getElementById("githubUsername");
const repoName = document.getElementById("repoName");

const syncNow = document.getElementById("syncNow");

const syncedCount = document.getElementById("syncedCount");
const commitCount = document.getElementById("commitCount");

const historyList = document.getElementById("historyList");
const message = document.getElementById("message");

const autoSyncToggle = document.getElementById("autoSyncToggle");


// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
    await loadStatus();
    await loadStats();
    await loadCurrentProblem();
    await loadAutoSyncSetting();
});


// --------------------------------------------------
// AUTO SYNC SETTING
// --------------------------------------------------

async function loadAutoSyncSetting() {
    if (!autoSyncToggle) {
        return;
    }

    try {
        const result = await chrome.storage.local.get([
            "autoSyncEnabled"
        ]);

        if (typeof result.autoSyncEnabled === "undefined") {
            await chrome.storage.local.set({
                autoSyncEnabled: true
            });

            autoSyncToggle.checked = true;
        } else {
            autoSyncToggle.checked =
                Boolean(result.autoSyncEnabled);
        }

    } catch (error) {
        console.error(
            "LC2Git: Failed to load Auto Sync setting:",
            error
        );

        autoSyncToggle.checked = true;
    }
}


if (autoSyncToggle) {
    autoSyncToggle.addEventListener(
        "change",
        async () => {

            const enabled =
                autoSyncToggle.checked;

            try {
                await chrome.storage.local.set({
                    autoSyncEnabled: enabled
                });

                showMessage(
                    enabled
                        ? "Auto Sync enabled"
                        : "Auto Sync disabled",
                    "success"
                );

            } catch (error) {
                console.error(
                    "LC2Git: Failed to save Auto Sync setting:",
                    error
                );

                showMessage(
                    "Failed to save Auto Sync setting",
                    "error"
                );
            }
        }
    );
}


// --------------------------------------------------
// GITHUB STATUS
// --------------------------------------------------

async function loadStatus() {
    try {
        const result =
            await chrome.storage.local.get([
                "githubConnected",
                "githubUsername",
                "githubRepository"
            ]);

        const connected =
            Boolean(result.githubConnected);

        if (connected) {
            showConnectedState(
                result.githubUsername ||
                "GitHub User",
                result.githubRepository ||
                "Repository"
            );
        } else {
            showDisconnectedState();
        }

    } catch (error) {
        console.error(
            "LC2Git: Failed to load GitHub status:",
            error
        );

        showDisconnectedState();
    }
}


function showConnectedState(
    username,
    repository
) {
    if (connectSection) {
        connectSection.style.display = "none";
    }

    if (connectedSection) {
        connectedSection.style.display = "block";
    }

    if (githubUsername) {
        githubUsername.textContent =
            username;
    }

    if (repoName) {
        repoName.textContent =
            repository;
    }

    if (statusText) {
        statusText.textContent =
            "Connected";
    }

    if (statusDot) {
        statusDot.classList.add("connected");
    }

    if (syncNow) {
        syncNow.disabled = false;
    }
}


function showDisconnectedState() {
    if (connectSection) {
        connectSection.style.display = "block";
    }

    if (connectedSection) {
        connectedSection.style.display = "none";
    }

    if (statusText) {
        statusText.textContent =
            "Not connected";
    }

    if (statusDot) {
        statusDot.classList.remove("connected");
    }

    if (syncNow) {
        syncNow.disabled = true;
    }
}


// --------------------------------------------------
// STATS
// --------------------------------------------------

async function loadStats() {
    try {
        const result =
            await chrome.storage.local.get([
                "syncedCount",
                "syncHistory"
            ]);

        const synced =
            Number(result.syncedCount || 0);

        if (syncedCount) {
            syncedCount.textContent =
                synced;
        }

        renderSyncHistory(
            result.syncHistory || []
        );

    } catch (error) {
        console.error(
            "LC2Git: Failed to load local stats:",
            error
        );
    }

    await loadGitHubCommitCount();
}


// --------------------------------------------------
// GITHUB COMMIT COUNT
// --------------------------------------------------

async function loadGitHubCommitCount() {
    if (!commitCount) {
        return;
    }

    try {
        const result =
            await chrome.runtime.sendMessage({
                type: "GET_GITHUB_STATS"
            });

        if (
            result &&
            result.success
        ) {
            commitCount.textContent =
                result.commitCount;
        } else {
            commitCount.textContent = "—";
        }

    } catch (error) {
        console.error(
            "LC2Git: Failed to load GitHub commit count:",
            error
        );

        commitCount.textContent = "—";
    }
}


// --------------------------------------------------
// CURRENT PROBLEM
// --------------------------------------------------

async function loadCurrentProblem() {
    try {
        const result =
            await chrome.storage.local.get([
                "currentProblem",
                "language"
            ]);

        const problem =
            result.currentProblem;

        const problemEmpty =
            document.getElementById(
                "problemEmpty"
            );

        const problemDetails =
            document.getElementById(
                "problemDetails"
            );

        const problemNumber =
            document.getElementById(
                "problemNumber"
            );

        const problemTitle =
            document.getElementById(
                "problemTitle"
            );

        const problemDifficulty =
            document.getElementById(
                "problemDifficulty"
            );

        const problemLanguage =
            document.getElementById(
                "problemLanguage"
            );

        if (!problem) {
            if (problemEmpty) {
                problemEmpty.style.display =
                    "block";
            }

            if (problemDetails) {
                problemDetails.style.display =
                    "none";
            }

            return;
        }

        if (problemEmpty) {
            problemEmpty.style.display =
                "none";
        }

        if (problemDetails) {
            problemDetails.style.display =
                "block";
        }

        if (problemNumber) {
            problemNumber.textContent =
                problem.number
                    ? `#${problem.number}`
                    : "#--";
        }

        if (problemTitle) {
            problemTitle.textContent =
                problem.title ||
                "Unknown Problem";
        }

        if (problemDifficulty) {
            const difficulty =
                problem.difficulty ||
                "Unknown";

            problemDifficulty.textContent =
                difficulty;

            problemDifficulty.className =
                "problemDifficulty";

            const difficultyClass =
                difficulty
                    .toLowerCase();

            if (
                difficultyClass ===
                "easy"
            ) {
                problemDifficulty.classList.add(
                    "easy"
                );
            } else if (
                difficultyClass ===
                "medium"
            ) {
                problemDifficulty.classList.add(
                    "medium"
                );
            } else if (
                difficultyClass ===
                "hard"
            ) {
                problemDifficulty.classList.add(
                    "hard"
                );
            }
        }

        if (problemLanguage) {
            problemLanguage.textContent =
                formatLanguage(
                    result.language ||
                    problem.language ||
                    ""
                );
        }

    } catch (error) {
        console.error(
            "LC2Git: Failed to load current problem:",
            error
        );
    }
}


// --------------------------------------------------
// LANGUAGE FORMAT
// --------------------------------------------------

function formatLanguage(language) {
    if (!language) {
        return "Language not detected";
    }

    const map = {
        cpp: "C++",
        "c++": "C++",
        java: "Java",
        python: "Python",
        python3: "Python",
        javascript: "JavaScript",
        typescript: "TypeScript",
        c: "C",
        csharp: "C#",
        "c#": "C#",
        kotlin: "Kotlin",
        swift: "Swift",
        rust: "Rust",
        go: "Go",
        ruby: "Ruby",
        php: "PHP",
        scala: "Scala",
        dart: "Dart"
    };

    const normalized =
        String(language)
            .trim()
            .toLowerCase();

    return (
        map[normalized] ||
        language
    );
}


// --------------------------------------------------
// HISTORY
// --------------------------------------------------

function renderSyncHistory(history) {
    if (!historyList) {
        return;
    }

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {
        historyList.innerHTML = `
            <div class="historyEmpty">
                No synced solutions yet
            </div>
        `;

        return;
    }

    historyList.innerHTML =
        history
            .slice(0, 20)
            .map(item => {

                const title =
                    escapeHtml(
                        item.title ||
                        item.problemTitle ||
                        "Unknown Problem"
                    );

                const language =
                    escapeHtml(
                        formatLanguage(
                            item.language ||
                            ""
                        )
                    );

                const number =
                    item.number ||
                    item.problemNumber ||
                    "";

                const time =
                    formatRelativeTime(
                        item.timestamp ||
                        item.syncedAt ||
                        item.createdAt
                    );

                return `
                    <div class="historyItem">
                        <div class="historyMain">
                            <div class="historyTitle">
                                ${
                                    number
                                        ? `#${escapeHtml(String(number))} `
                                        : ""
                                }${title}
                            </div>

                            <div class="historyMeta">
                                ${language}
                            </div>
                        </div>

                        <div class="historyTime">
                            ${escapeHtml(time)}
                        </div>
                    </div>
                `;
            })
            .join("");
}


// --------------------------------------------------
// RELATIVE TIME
// --------------------------------------------------

function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return "";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const now =
        Date.now();

    const diff =
        Math.max(
            0,
            now - date.getTime()
        );

    const seconds =
        Math.floor(
            diff / 1000
        );

    if (seconds < 60) {
        return "just now";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (days < 30) {
        return `${days}d ago`;
    }

    const months =
        Math.floor(
            days / 30
        );

    if (months < 12) {
        return `${months}mo ago`;
    }

    const years =
        Math.floor(
            months / 12
        );

    return `${years}y ago`;
}


// --------------------------------------------------
// ESCAPE HTML
// --------------------------------------------------

function escapeHtml(value) {
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// --------------------------------------------------
// CONNECT GITHUB
// --------------------------------------------------

if (connectGithub) {
    connectGithub.addEventListener(
        "click",
        async () => {

            const token =
                githubToken
                    ? githubToken.value.trim()
                    : "";

            if (!token) {
                showMessage(
                    "Enter your GitHub token",
                    "error"
                );

                return;
            }

            connectGithub.disabled =
                true;

            connectGithub.textContent =
                "Connecting...";

            try {
                const result =
                    await chrome.runtime.sendMessage({
                        type: "CONNECT_GITHUB",
                        token: token
                    });

                if (
                    result &&
                    result.success
                ) {
                    showMessage(
                        "GitHub connected",
                        "success"
                    );

                    if (githubToken) {
                        githubToken.value =
                            "";
                    }

                    await loadStatus();
                    await loadStats();

                } else {
                    showMessage(
                        result?.message ||
                        "Failed to connect GitHub",
                        "error"
                    );
                }

            } catch (error) {
                console.error(
                    "LC2Git: GitHub connection error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Failed to connect GitHub",
                    "error"
                );

            } finally {
                connectGithub.disabled =
                    false;

                connectGithub.textContent =
                    "Connect GitHub";
            }
        }
    );
}


// --------------------------------------------------
// DISCONNECT GITHUB
// --------------------------------------------------

if (disconnectGithub) {
    disconnectGithub.addEventListener(
        "click",
        async () => {

            disconnectGithub.disabled =
                true;

            try {
                const result =
                    await chrome.runtime.sendMessage({
                        type: "DISCONNECT_GITHUB"
                    });

                if (
                    result &&
                    result.success
                ) {
                    showMessage(
                        "GitHub disconnected",
                        "success"
                    );

                    await loadStatus();
                    await loadStats();

                } else {
                    showMessage(
                        result?.message ||
                        "Failed to disconnect GitHub",
                        "error"
                    );
                }

            } catch (error) {
                console.error(
                    "LC2Git: Disconnect error:",
                    error
                );

                showMessage(
                    error.message ||
                    "Failed to disconnect GitHub",
                    "error"
                );

            } finally {
                disconnectGithub.disabled =
                    false;
            }
        }
    );
}


// --------------------------------------------------
// MANUAL SYNC
// --------------------------------------------------

if (syncNow) {
    syncNow.addEventListener(
        "click",
        async () => {

            syncNow.disabled =
                true;

            const originalText =
                syncNow.textContent;

            syncNow.textContent =
                "Syncing...";

            clearMessage();

            try {
                const data =
                    await chrome.storage.local.get([
                        "currentProblem",
                        "language",
                        "code"
                    ]);

                if (
                    !data.currentProblem ||
                    !data.code
                ) {
                    showMessage(
                        "No solution available to sync",
                        "error"
                    );

                    return;
                }

                const result =
                    await chrome.runtime.sendMessage({
                        type: "SYNC_SOLUTION",
                        problem:
                            data.currentProblem,
                        language:
                            data.language,
                        code:
                            data.code
                    });

                if (
                    result &&
                    result.success
                ) {
                    if (
                        result.alreadyExists
                    ) {
                        syncNow.textContent =
                            "Already synced";

                        showMessage(
                            "Solution already exists in GitHub",
                            "success"
                        );

                    } else {
                        syncNow.textContent =
                            "✓ Synced";

                        showMessage(
                            "Solution synced to GitHub",
                            "success"
                        );
                    }

                    await loadStats();
                    await loadCurrentProblem();

                } else {
                    showMessage(
                        result?.message ||
                        "Sync failed",
                        "error"
                    );

                    syncNow.textContent =
                        originalText;
                }

            } catch (error) {
                console.error(
                    "LC2Git: Manual sync failed:",
                    error
                );

                showMessage(
                    error.message ||
                    "Sync failed",
                    "error"
                );

                syncNow.textContent =
                    originalText;

            } finally {
                setTimeout(
                    () => {
                        if (syncNow) {
                            syncNow.disabled =
                                false;

                            syncNow.textContent =
                                originalText;
                        }
                    },
                    1500
                );
            }
        }
    );
}


// --------------------------------------------------
// MESSAGE UI
// --------------------------------------------------

function showMessage(
    text,
    type = "info"
) {
    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `message ${type}`;

    message.style.display =
        "block";
}


function clearMessage() {
    if (!message) {
        return;
    }

    message.textContent =
        "";

    message.className =
        "message";

    message.style.display =
        "none";
}