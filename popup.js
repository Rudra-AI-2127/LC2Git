// ============================================
// LC2Git - Popup
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const connectButton =
            document.getElementById(
                "connectGithub"
            );

        const disconnectButton =
            document.getElementById(
                "disconnectGithub"
            );

        const syncButton =
            document.getElementById(
                "syncNow"
            );

        const tokenInput =
            document.getElementById(
                "githubToken"
            );

        const statusDot =
            document.getElementById(
                "statusDot"
            );

        const statusText =
            document.getElementById(
                "statusText"
            );

        const message =
            document.getElementById(
                "message"
            );

        const connectSection =
            document.getElementById(
                "connectSection"
            );

        const connectedSection =
            document.getElementById(
                "connectedSection"
            );

        const githubUsername =
            document.getElementById(
                "githubUsername"
            );

        const syncedCount =
            document.getElementById(
                "syncedCount"
            );

        const commitCount =
            document.getElementById(
                "commitCount"
            );


        // ====================================
        // MESSAGE
        // ====================================

        function showMessage(text) {

            message.textContent =
                text;

        }


        // ====================================
        // CONNECTED STATE
        // ====================================

        function showConnected(username) {

            statusDot.textContent =
                "●";

            statusText.textContent =
                "Connected";

            connectSection.style.display =
                "none";

            connectedSection.style.display =
                "block";

            githubUsername.textContent =
                username || "GitHub user";

            syncButton.disabled =
                false;

        }


        // ====================================
        // DISCONNECTED STATE
        // ====================================

        function showDisconnected() {

            statusDot.textContent =
                "●";

            statusText.textContent =
                "Not connected";

            connectSection.style.display =
                "block";

            connectedSection.style.display =
                "none";

            syncButton.disabled =
                true;

        }


        // ====================================
        // LOAD STATS
        // ====================================

        function loadStats() {

            chrome.storage.local.get(
                [
                    "syncedCount",
                    "commitCount"
                ],
                (data) => {

                    syncedCount.textContent =
                        data.syncedCount || 0;

                    commitCount.textContent =
                        data.commitCount || 0;

                }
            );

        }


        // ====================================
        // CHECK STATUS
        // ====================================

        chrome.runtime.sendMessage(
            {
                type:
                    "GET_GITHUB_STATUS"
            },
            (response) => {

                if (
                    chrome.runtime.lastError
                ) {

                    console.error(
                        chrome.runtime.lastError
                    );

                    return;

                }


                if (
                    response &&
                    response.connected
                ) {

                    showConnected(
                        response.username
                    );

                } else {

                    showDisconnected();

                }

            }
        );


        loadStats();


        // ====================================
        // CONNECT
        // ====================================

        connectButton.addEventListener(
            "click",
            () => {

                const token =
                    tokenInput.value.trim();


                if (!token) {

                    showMessage(
                        "Please enter your GitHub token."
                    );

                    return;

                }


                connectButton.disabled =
                    true;


                showMessage(
                    "Connecting to GitHub..."
                );


                chrome.runtime.sendMessage(
                    {

                        type:
                            "CONNECT_GITHUB",

                        token:
                            token

                    },
                    (response) => {

                        connectButton.disabled =
                            false;


                        if (
                            chrome.runtime.lastError
                        ) {

                            showMessage(
                                "Extension error. Check service worker."
                            );

                            return;

                        }


                        if (
                            response &&
                            response.success
                        ) {

                            tokenInput.value =
                                "";

                            showConnected(
                                response.username
                            );

                            showMessage(
                                "GitHub connected successfully!"
                            );

                        } else {

                            showMessage(
                                response?.message ||
                                "GitHub connection failed."
                            );

                        }

                    }
                );

            }
        );


        // ====================================
        // DISCONNECT
        // ====================================

        disconnectButton.addEventListener(
            "click",
            () => {

                chrome.runtime.sendMessage(
                    {

                        type:
                            "DISCONNECT_GITHUB"

                    },
                    (response) => {

                        if (
                            response &&
                            response.success
                        ) {

                            showDisconnected();

                            showMessage(
                                "GitHub disconnected."
                            );

                        }

                    }
                );

            }
        );


        // ====================================
        // SYNC CURRENT PROBLEM
        // ====================================

        syncButton.addEventListener(
            "click",
            () => {

                syncButton.disabled =
                    true;


                showMessage(
                    "Syncing solution to GitHub..."
                );


                chrome.runtime.sendMessage(
                    {

                        type:
                            "SYNC_SOLUTION"

                    },
                    (response) => {

                        syncButton.disabled =
                            false;


                        if (
                            chrome.runtime.lastError
                        ) {

                            console.error(
                                chrome.runtime.lastError
                            );


                            showMessage(
                                "Extension error. Check service worker."
                            );


                            return;

                        }


                        if (
                            response &&
                            response.success
                        ) {

                            if (
                                response.alreadySynced
                            ) {

                                showMessage(
                                    "Already synced to GitHub."
                                );

                            } else {

                                showMessage(
                                    "🎉 Solution committed to GitHub!"
                                );

                            }


                            loadStats();

                        } else {

                            showMessage(
                                response?.message ||
                                "Sync failed."
                            );

                        }

                    }
                );

            }
        );

    }
);