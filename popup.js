// ============================================
// LC2Git - Popup Script
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // DOM ELEMENTS
    // ========================================

    const statusDot =
        document.getElementById("statusDot");

    const statusText =
        document.getElementById("statusText");

    const connectSection =
        document.getElementById("connectSection");

    const connectedSection =
        document.getElementById("connectedSection");

    const githubToken =
        document.getElementById("githubToken");

    const connectGithub =
        document.getElementById("connectGithub");

    const disconnectGithub =
        document.getElementById("disconnectGithub");

    const githubUsername =
        document.getElementById("githubUsername");

    const repoName =
        document.getElementById("repoName");

    const syncedCount =
        document.getElementById("syncedCount");

    const commitCount =
        document.getElementById("commitCount");

    const historyList =
        document.getElementById("historyList");

    const syncNow =
        document.getElementById("syncNow");

    const message =
        document.getElementById("message");


    // ========================================
    // CONSTANTS
    // ========================================

    const MAX_VISIBLE_HISTORY = 2;


    // ========================================
    // SHOW MESSAGE
    // ========================================

    function showMessage(
        text,
        type = "info"
    ) {

        if (!message) {
            return;
        }


        message.textContent =
            text;


        if (type === "success") {

            message.style.color =
                "#22c55e";

        } else if (type === "error") {

            message.style.color =
                "#ef4444";

        } else {

            message.style.color =
                "#85858b";

        }


        clearTimeout(
            showMessage.timeout
        );


        showMessage.timeout =
            setTimeout(() => {

                if (message) {
                    message.textContent =
                        "";
                }

            }, 4000);

    }


    // ========================================
    // UPDATE CONNECTION UI
    // ========================================

    function updateConnectionUI(
        connected,
        username,
        repository
    ) {

        if (connected) {

            // -------------------------------
            // STATUS
            // -------------------------------

            if (statusDot) {

                statusDot.textContent =
                    "●";

                statusDot.style.color =
                    "#22c55e";

            }


            if (statusText) {

                statusText.textContent =
                    "GitHub Connected";

            }


            // -------------------------------
            // SECTIONS
            // -------------------------------

            if (connectSection) {

                connectSection.style.display =
                    "none";

            }


            if (connectedSection) {

                connectedSection.style.display =
                    "block";

            }


            // -------------------------------
            // USERNAME
            // -------------------------------

            if (githubUsername) {

                githubUsername.textContent =
                    username || "-";

            }


            // -------------------------------
            // REPOSITORY
            // -------------------------------

            if (repoName) {

                repoName.textContent =
                    repository ||
                    "Rudra-AI-2127/leetcode-solutions";

            }


            // -------------------------------
            // SYNC BUTTON
            // -------------------------------

            if (syncNow) {

                syncNow.disabled =
                    false;

            }

        } else {

            // -------------------------------
            // STATUS
            // -------------------------------

            if (statusDot) {

                statusDot.textContent =
                    "●";

                statusDot.style.color =
                    "#f59e0b";

            }


            if (statusText) {

                statusText.textContent =
                    "Not connected";

            }


            // -------------------------------
            // SECTIONS
            // -------------------------------

            if (connectSection) {

                connectSection.style.display =
                    "block";

            }


            if (connectedSection) {

                connectedSection.style.display =
                    "none";

            }


            // -------------------------------
            // SYNC BUTTON
            // -------------------------------

            if (syncNow) {

                syncNow.disabled =
                    true;

            }

        }

    }


    // ========================================
    // LOAD GITHUB STATUS
    // ========================================

    function loadGitHubStatus() {

        chrome.runtime.sendMessage(
            {
                type: "GET_GITHUB_STATUS"
            },

            (response) => {

                if (
                    chrome.runtime.lastError
                ) {

                    console.error(
                        "LC2Git: GitHub status error:",
                        chrome.runtime.lastError
                    );

                    updateConnectionUI(
                        false
                    );

                    return;

                }


                if (
                    !response ||
                    !response.success
                ) {

                    updateConnectionUI(
                        false
                    );

                    return;

                }


                updateConnectionUI(
                    response.connected === true,
                    response.username,
                    response.repository
                );

            }
        );

    }


    // ========================================
    // LOAD STATS + HISTORY
    // ========================================

    async function loadStats() {

        try {

            const data =
                await chrome.storage.local.get([
                    "syncedCount",
                    "commitCount",
                    "syncHistory"
                ]);


            // ==================================
            // STATS
            // ==================================

            if (syncedCount) {

                syncedCount.textContent =
                    data.syncedCount || 0;

            }


            if (commitCount) {

                commitCount.textContent =
                    data.commitCount || 0;

            }


            // ==================================
            // HISTORY
            // ==================================

            renderHistory(
                data.syncHistory
            );

        } catch (error) {

            console.error(
                "LC2Git: Failed to load stats:",
                error
            );

        }

    }


    // ========================================
    // RENDER HISTORY
    // ========================================

    function renderHistory(
        history
    ) {

        if (!historyList) {
            return;
        }


        historyList.innerHTML =
            "";


        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

            const empty =
                document.createElement(
                    "p"
                );


            empty.className =
                "emptyHistory";


            empty.textContent =
                "No synced solutions yet.";


            historyList.appendChild(
                empty
            );


            return;

        }


        // ==================================
        // ONLY SHOW 2 MOST RECENT
        // ==================================

        const recentHistory =
            history.slice(
                0,
                MAX_VISIBLE_HISTORY
            );


        recentHistory.forEach(
            (item) => {

                const historyItem =
                    document.createElement(
                        "div"
                    );


                historyItem.className =
                    "historyItem";


                // --------------------------
                // TITLE
                // --------------------------

                const title =
                    document.createElement(
                        "div"
                    );


                title.className =
                    "historyTitle";


                const number =
                    item.number
                        ? `#${String(item.number).padStart(4, "0")} `
                        : "";


                title.textContent =
                    `${number}${item.problem || "Unknown Problem"}`;


                // --------------------------
                // META
                // --------------------------

                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "historyMeta";


                const language =
                    item.language ||
                    "Unknown";


                const folder =
                    item.folder ||
                    "Other";


                let timeText =
                    "";


                if (item.timestamp) {

                    const date =
                        new Date(
                            item.timestamp
                        );


                    if (
                        !Number.isNaN(
                            date.getTime()
                        )
                    ) {

                        timeText =
                            formatRelativeTime(
                                date
                            );

                    }

                }


                meta.textContent =
                    timeText
                        ? `${language} · ${folder} · ${timeText}`
                        : `${language} · ${folder}`;


                // --------------------------
                // APPEND
                // --------------------------

                historyItem.appendChild(
                    title
                );


                historyItem.appendChild(
                    meta
                );


                historyList.appendChild(
                    historyItem
                );

            }
        );

    }


    // ========================================
    // RELATIVE TIME
    // ========================================

    function formatRelativeTime(
        date
    ) {

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

            return "Just now";

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


        if (days < 7) {

            return `${days}d ago`;

        }


        return date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        );

    }


    // --------------------------------------------
    // Popup Sync Status
    // --------------------------------------------

    function setSyncStatus(type, text) {

        if (!message) {
            return;
        }

        message.textContent = text;

        message.className =
            `message ${type}`;

    }


    // ========================================
    // CONNECT GITHUB
    // ========================================

    if (connectGithub) {

        connectGithub.addEventListener(
            "click",
            () => {

                const token =
                    githubToken?.value.trim();


                if (!token) {

                    showMessage(
                        "Enter your GitHub token.",
                        "error"
                    );

                    return;

                }


                connectGithub.disabled =
                    true;


                connectGithub.textContent =
                    "Connecting...";


                chrome.runtime.sendMessage(
                    {
                        type:
                            "CONNECT_GITHUB",

                        token:
                            token
                    },

                    (response) => {

                        connectGithub.disabled =
                            false;

                        connectGithub.textContent =
                            "Connect GitHub";


                        if (
                            chrome.runtime.lastError
                        ) {

                            console.error(
                                "LC2Git: Connection error:",
                                chrome.runtime.lastError
                            );


                            showMessage(
                                "Connection failed.",
                                "error"
                            );


                            return;

                        }


                        if (
                            !response ||
                            !response.success
                        ) {

                            showMessage(
                                response?.message ||
                                "Failed to connect GitHub.",
                                "error"
                            );


                            return;

                        }


                        githubToken.value =
                            "";


                        updateConnectionUI(
                            true,
                            response.username,
                            response.repository
                        );


                        showMessage(
                            "GitHub connected successfully.",
                            "success"
                        );


                        loadStats();

                    }
                );

            }
        );

    }


    // ========================================
    // DISCONNECT GITHUB
    // ========================================

    if (disconnectGithub) {

        disconnectGithub.addEventListener(
            "click",
            () => {

                disconnectGithub.disabled =
                    true;


                chrome.runtime.sendMessage(
                    {
                        type:
                            "DISCONNECT_GITHUB"
                    },

                    (response) => {

                        disconnectGithub.disabled =
                            false;


                        if (
                            chrome.runtime.lastError
                        ) {

                            console.error(
                                "LC2Git: Disconnect error:",
                                chrome.runtime.lastError
                            );


                            showMessage(
                                "Disconnect failed.",
                                "error"
                            );


                            return;

                        }


                        if (
                            response &&
                            response.success === false
                        ) {

                            showMessage(
                                response.message ||
                                "Disconnect failed.",
                                "error"
                            );


                            return;

                        }


                        updateConnectionUI(
                            false
                        );


                        showMessage(
                            "GitHub disconnected.",
                            "info"
                        );


                        loadStats();

                    }
                );

            }
        );

    }


    // ========================================
    // SYNC CURRENT PROBLEM
    // ========================================

    if (syncNow) {

        syncNow.addEventListener(
            "click",
            async () => {

                syncNow.disabled =
                    true;


                const originalText =
                    syncNow.textContent;


                // ----------------------------------------
                // SYNCING STATE
                // ----------------------------------------

                syncNow.textContent =
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


                    // ----------------------------------------
                    // SUCCESS
                    // ----------------------------------------

                    if (
                        response &&
                        response.success
                    ) {

                        // Already exists on GitHub
                        if (
                            response.alreadySynced
                        ) {

                            syncNow.textContent =
                                "Already synced";

                            setSyncStatus(
                                "duplicate",
                                "Solution is already synced to GitHub."
                            );


                        } else {

                            // Newly synced
                            syncNow.textContent =
                                "✓ Synced";

                            setSyncStatus(
                                "success",
                                "Solution synced successfully."
                            );

                        }


                        // Refresh stats/history
                        await loadStats();


                        // Restore button
                        setTimeout(
                            () => {

                                syncNow.textContent =
                                    originalText;

                                setSyncStatus(
                                    "",
                                    ""
                                );

                            },
                            2000
                        );


                    } else {

                        // ----------------------------------------
                        // FAILURE
                        // ----------------------------------------

                        syncNow.textContent =
                            "Sync failed";

                        setSyncStatus(
                            "error",
                            response?.message ||
                            "Unable to sync solution to GitHub."
                        );


                        setTimeout(
                            () => {

                                syncNow.textContent =
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


                    // ----------------------------------------
                    // ERROR
                    // ----------------------------------------

                    syncNow.textContent =
                        "Sync failed";


                    setSyncStatus(
                        "error",
                        error.message ||
                        "Unable to sync solution to GitHub."
                    );


                    setTimeout(
                        () => {

                            syncNow.textContent =
                                originalText;

                        },
                        2000
                    );


                } finally {

                    syncNow.disabled =
                        false;

                }

            }
        );

    }


    // ========================================
    // INITIAL LOAD
    // ========================================

    loadGitHubStatus();

    loadStats();

});