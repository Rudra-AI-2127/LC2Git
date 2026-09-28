// ============================================
// LC2Git - Popup Script
// ============================================


// ============================================
// DOM ELEMENTS
// ============================================

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


// ============================================
// CURRENT PROBLEM ELEMENTS
// ============================================

const problemEmpty =
    document.getElementById("problemEmpty");

const problemDetails =
    document.getElementById("problemDetails");

const problemNumber =
    document.getElementById("problemNumber");

const problemTitle =
    document.getElementById("problemTitle");

const problemDifficulty =
    document.getElementById("problemDifficulty");

const problemLanguage =
    document.getElementById("problemLanguage");


// ============================================
// CONSTANTS
// ============================================

const MAX_VISIBLE_HISTORY = 2;


// ============================================
// INITIALIZE POPUP
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadStatus();

        loadStats();

        loadCurrentProblem();

    }
);


// ============================================
// SYNC STATUS MESSAGE
// ============================================

function setSyncStatus(
    type,
    message
) {

    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message || "";


    messageElement.className =
        type
            ? `message ${type}`
            : "message";

}


// ============================================
// LOAD GITHUB STATUS
// ============================================

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


        // ========================================
        // CONNECTED
        // ========================================

        if (
            data.githubConnected === true
        ) {

            if (statusText) {

                statusText.textContent =
                    "Connected";

            }


            if (statusDot) {

                statusDot.textContent =
                    "●";

            }


            if (connectSection) {

                connectSection.style.display =
                    "none";

            }


            if (connectedSection) {

                connectedSection.style.display =
                    "block";

            }


            if (githubUsername) {

                githubUsername.textContent =
                    data.githubUsername ||
                    "GitHub User";

            }


            if (repoName) {

                repoName.textContent =
                    data.githubRepository ||
                    "Rudra-AI-2127/leetcode-solutions";

            }


            if (syncButton) {

                syncButton.disabled =
                    false;

            }


        }

        // ========================================
        // NOT CONNECTED
        // ========================================

        else {

            if (statusText) {

                statusText.textContent =
                    "Not connected";

            }


            if (statusDot) {

                statusDot.textContent =
                    "●";

            }


            if (connectSection) {

                connectSection.style.display =
                    "block";

            }


            if (connectedSection) {

                connectedSection.style.display =
                    "none";

            }


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


// ============================================
// LOAD STATISTICS + HISTORY
// ============================================

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


        // ========================================
        // STATISTICS
        // ========================================

        if (syncedCountElement) {

            syncedCountElement.textContent =
                data.syncedCount || 0;

        }


        if (commitCountElement) {

            commitCountElement.textContent =
                data.commitCount || 0;

        }


        // ========================================
        // HISTORY
        // ========================================

        renderSyncHistory(
            Array.isArray(data.syncHistory)
                ? data.syncHistory
                : []
        );


    } catch (error) {

        console.error(
            "LC2Git: Failed to load statistics:",
            error
        );


        if (syncedCountElement) {

            syncedCountElement.textContent =
                "0";

        }


        if (commitCountElement) {

            commitCountElement.textContent =
                "0";

        }


        renderSyncHistory([]);

    }

}


// ============================================
// RENDER SYNC HISTORY
// ============================================

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


    // Only display latest 2
    const recentHistory =
        history.slice(
            0,
            MAX_VISIBLE_HISTORY
        );


    historyList.innerHTML =
        recentHistory
            .map(
                entry => {

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

                }
            )
            .join("");

}


// ============================================
// LOAD CURRENT LEETCODE PROBLEM
// ============================================

async function loadCurrentProblem() {

    try {

        const data =
            await chrome.storage.local.get([
                "currentProblem",
                "language"
            ]);


        const problem =
            data.currentProblem;


        console.log(
            "LC2Git: Current problem:",
            problem
        );


        // ========================================
        // NO PROBLEM
        // ========================================

        if (
            !problem ||
            !problem.title
        ) {

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


        // ========================================
        // SHOW PROBLEM
        // ========================================

        if (problemEmpty) {

            problemEmpty.style.display =
                "none";

        }


        if (problemDetails) {

            problemDetails.style.display =
                "block";

        }


        // ========================================
        // NUMBER
        // ========================================

        if (problemNumber) {

            problemNumber.textContent =
                problem.number
                    ? `#${problem.number}`
                    : "#--";

        }


        // ========================================
        // TITLE
        // ========================================

        if (problemTitle) {

            problemTitle.textContent =
                problem.title ||
                "Unknown Problem";

        }


        // ========================================
        // DIFFICULTY
        // ========================================

        if (problemDifficulty) {

            const difficulty =
                problem.difficulty ||
                "Unknown";


            problemDifficulty.textContent =
                difficulty;


            problemDifficulty.className =
                "problemDifficulty";


            const normalizedDifficulty =
                String(
                    difficulty
                )
                    .toLowerCase()
                    .trim();


            if (
                normalizedDifficulty ===
                "easy"
            ) {

                problemDifficulty.classList.add(
                    "easy"
                );

            }


            if (
                normalizedDifficulty ===
                "medium"
            ) {

                problemDifficulty.classList.add(
                    "medium"
                );

            }


            if (
                normalizedDifficulty ===
                "hard"
            ) {

                problemDifficulty.classList.add(
                    "hard"
                );

            }

        }


        // ========================================
        // LANGUAGE
        // ========================================

        if (problemLanguage) {

            problemLanguage.textContent =
                data.language
                    ? formatLanguage(
                        data.language
                    )
                    : "Language not detected";

        }


    } catch (error) {

        console.error(
            "LC2Git: Failed to load current problem:",
            error
        );


    }

}


// ============================================
// FORMAT LANGUAGE
// ============================================

function formatLanguage(language) {

    if (!language) {

        return "Unknown";

    }


    const normalized =
        String(language)
            .toLowerCase()
            .trim();


    const languageMap = {

        javascript:
            "JavaScript",

        js:
            "JavaScript",

        typescript:
            "TypeScript",

        ts:
            "TypeScript",

        python:
            "Python",

        python3:
            "Python",

        java:
            "Java",

        cpp:
            "C++",

        "c++":
            "C++",

        c:
            "C",

        csharp:
            "C#",

        "c#":
            "C#",

        go:
            "Go",

        golang:
            "Go",

        rust:
            "Rust",

        kotlin:
            "Kotlin",

        swift:
            "Swift",

        php:
            "PHP",

        ruby:
            "Ruby",

        scala:
            "Scala",

        dart:
            "Dart",

        sql:
            "SQL",

        bash:
            "Bash",

        shell:
            "Shell"

    };


    return (
        languageMap[normalized] ||
        language
    );

}


// ============================================
// RELATIVE TIME
// ============================================

function formatRelativeTime(timestamp) {

    if (!timestamp) {

        return "Unknown time";

    }


    const date =
        new Date(timestamp);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "Unknown time";

    }


    const seconds =
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) / 1000
        );


    if (
        seconds < 60
    ) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return minutes === 1
            ? "1 minute ago"
            : `${minutes} minutes ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return hours === 1
            ? "1 hour ago"
            : `${hours} hours ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (
        days < 7
    ) {

        return days === 1
            ? "Yesterday"
            : `${days} days ago`;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


// ============================================
// ESCAPE HTML
// ============================================

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


// ============================================
// CONNECT GITHUB
// ============================================

if (connectButton) {

    connectButton.addEventListener(
        "click",
        async () => {

            const token =
                githubToken?.value.trim();


            if (!token) {

                setSyncStatus(
                    "error",
                    "Please enter your GitHub token."
                );

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


                    setSyncStatus(
                        "success",
                        "GitHub connected successfully."
                    );


                    await loadStatus();


                } else {

                    setSyncStatus(
                        "error",
                        response?.message ||
                        "GitHub connection failed."
                    );

                }


            } catch (error) {

                console.error(
                    "LC2Git: GitHub connection error:",
                    error
                );


                setSyncStatus(
                    "error",
                    error.message ||
                    "GitHub connection failed."
                );


            } finally {

                connectButton.disabled =
                    false;


                connectButton.textContent =
                    "Connect GitHub";

            }

        }
    );

}


// ============================================
// DISCONNECT GITHUB
// ============================================

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


                if (
                    response &&
                    response.success
                ) {

                    setSyncStatus(
                        "success",
                        "GitHub disconnected."
                    );

                }


                await loadStatus();


            } catch (error) {

                console.error(
                    "LC2Git: Disconnect error:",
                    error
                );


                setSyncStatus(
                    "error",
                    error.message ||
                    "Failed to disconnect GitHub."
                );

            }

        }
    );

}


// ============================================
// SYNC CURRENT PROBLEM
// ============================================

if (syncButton) {

    syncButton.addEventListener(
        "click",
        async () => {

            syncButton.disabled =
                true;


            const originalText =
                "Sync Current Problem";


            // ========================================
            // SYNCING STATE
            // ========================================

            syncButton.textContent =
                "Syncing...";


            setSyncStatus(
                "loading",
                "Syncing solution to GitHub..."
            );


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


                // ========================================
                // SUCCESS
                // ========================================

                if (
                    response &&
                    response.success
                ) {

                    // ------------------------------------
                    // ALREADY SYNCED
                    // ------------------------------------

                    if (
                        response.alreadySynced
                    ) {

                        syncButton.textContent =
                            "Already synced";


                        setSyncStatus(
                            "duplicate",
                            "Solution is already synced to GitHub."
                        );

                    }


                    // ------------------------------------
                    // NEWLY SYNCED
                    // ------------------------------------

                    else {

                        syncButton.textContent =
                            "✓ Synced";


                        setSyncStatus(
                            "success",
                            "Solution synced successfully."
                        );

                    }


                    // Refresh statistics
                    await loadStats();


                    setTimeout(
                        () => {

                            syncButton.textContent =
                                originalText;

                        },
                        2000
                    );


                }

                // ========================================
                // FAILURE
                // ========================================

                else {

                    syncButton.textContent =
                        "Sync failed";


                    setSyncStatus(
                        "error",
                        response?.message ||
                        "Unable to sync solution to GitHub."
                    );


                    setTimeout(
                        () => {

                            syncButton.textContent =
                                originalText;

                        },
                        2000
                    );

                }


            } catch (error) {

                console.error(
                    "LC2Git: Manual sync error:",
                    error
                );


                syncButton.textContent =
                    "Sync failed";


                setSyncStatus(
                    "error",
                    error.message ||
                    "Unable to sync solution to GitHub."
                );


                setTimeout(
                    () => {

                        syncButton.textContent =
                            originalText;

                    },
                    2000
                );


            } finally {

                syncButton.disabled =
                    false;

            }

        }
    );

}