// ============================================
// LC2Git - LeetCode Content Script
// ============================================

console.log(
    "LC2Git: Content script loaded."
);


// ============================================
// 1. GET PROBLEM DIFFICULTY
// ============================================

function getDifficulty() {

    const difficulties = [
        "Easy",
        "Medium",
        "Hard"
    ];

    const elements =
        document.querySelectorAll(
            "span, div, button"
        );

    for (
        const element of elements
    ) {

        const text =
            element.innerText?.trim();

        if (
            difficulties.includes(text)
        ) {

            return text;

        }

    }

    return "Unknown";

}


// ============================================
// 2. GET PROBLEM NUMBER
// ============================================

function getProblemNumber() {

    // ========================================
    // METHOD 1
    // QUESTION TITLE
    // ========================================

    const titleElement =
        document.querySelector(
            '[data-cy="question-title"]'
        );

    if (titleElement) {

        const titleText =
            titleElement.innerText?.trim();

        if (titleText) {

            const titleMatch =
                titleText.match(
                    /^(\d+)\s*\./
                );

            if (titleMatch) {

                return Number(
                    titleMatch[1]
                );

            }

        }

    }


    // ========================================
    // METHOD 2
    // PAGE TITLE
    // ========================================

    const pageTitle =
        document.title?.trim();

    if (pageTitle) {

        const pageTitleMatch =
            pageTitle.match(
                /^(\d+)\s*\./
            );

        if (pageTitleMatch) {

            return Number(
                pageTitleMatch[1]
            );

        }

    }


    // ========================================
    // METHOD 3
    // LEETCODE SCRIPT DATA
    // ========================================

    const scripts = [
        ...document.scripts
    ];

    const candidates = [];

    for (
        const script of scripts
    ) {

        const text =
            script.textContent;

        if (
            !text ||
            !text.includes(
                "questionFrontendId"
            )
        ) {

            continue;

        }

        const matches =
            [
                ...text.matchAll(
                    /"questionFrontendId"\s*:\s*"(\d+)"/g
                )
            ];

        for (
            const match of matches
        ) {

            candidates.push(
                Number(
                    match[1]
                )
            );

        }

    }

    if (
        candidates.length > 0
    ) {

        return candidates[
            candidates.length - 1
        ];

    }

    return null;

}


// ============================================
// 3. GET PROBLEM INFORMATION
// ============================================

function getProblemInfo() {

    const url =
        window.location.href;

    const match =
        url.match(
            /leetcode\.com\/problems\/([^/]+)/
        );

    if (!match) {

        return null;

    }

    const slug =
        match[1];

    const titleElement =
        document.querySelector(
            '[data-cy="question-title"]'
        );

    let title;

    if (titleElement) {

        title =
            titleElement.innerText.trim();

        title =
            title.replace(
                /^\d+\.\s*/,
                ""
            );

    } else {

        title =
            document.title
                .replace(
                    /^\d+\.\s*/,
                    ""
                )
                .replace(
                    /\s*-\s*LeetCode.*$/i,
                    ""
                )
                .trim();

    }

    const difficulty =
        getDifficulty();

    const problemNumber =
        getProblemNumber();

    const cleanUrl =
        `https://leetcode.com/problems/${slug}/`;

    return {

        number:
            problemNumber,

        slug:
            slug,

        title:
            title,

        difficulty:
            difficulty,

        url:
            cleanUrl

    };

}


// ============================================
// 4. SAVE PROBLEM INFORMATION
// ============================================

function saveProblemInfo() {

    const problem =
        getProblemInfo();

    if (!problem) {

        console.log(
            "LC2Git: Not a LeetCode problem page."
        );

        return;

    }

    console.log(
        "LC2Git: Problem detected!"
    );

    console.log(
        problem
    );

    chrome.storage.local.set({

        currentProblem:
            problem

    });

}

saveProblemInfo();


// ============================================
// 5. DETECT PROBLEM NAVIGATION
// ============================================

let lastSlug = null;

const problemObserver =
    new MutationObserver(() => {

        const problem =
            getProblemInfo();

        if (!problem) {

            return;

        }

        if (
            problem.slug !== lastSlug
        ) {

            lastSlug =
                problem.slug;

            chrome.storage.local.set({

                currentProblem:
                    problem

            });

            console.log(
                "LC2Git: New problem detected!",
                problem
            );

        }

    });

problemObserver.observe(
    document.body,
    {
        childList:
            true,

        subtree:
            true
    }
);


// ============================================
// 6. SUBMISSION VARIABLES
// ============================================

let waitingForSubmission =
    false;

let acceptedCountBeforeSubmit =
    0;


// ============================================
// DUPLICATE PROCESSING LOCK
// ============================================

let processingAcceptedSubmission =
    false;


// ============================================
// CURRENT SUBMISSION FINGERPRINT
// ============================================

let currentSubmissionFingerprint =
    null;


// ============================================
// PENDING SYNC RETRY CONFIGURATION
// ============================================

const MAX_SYNC_RETRIES =
    3;

const SYNC_RETRY_DELAY =
    30000;

let syncRetryCount =
    0;

let retryTimerId =
    null;


// ============================================
// 7. COUNT ACCEPTED RESULTS
// ============================================

function getAcceptedCount() {

    const pageText =
        document.body.innerText;

    const matches =
        pageText.match(
            /Accepted/g
        );

    return matches
        ? matches.length
        : 0;

}


// ============================================
// 8. CREATE NORMALIZED SOLUTION FINGERPRINT
// ============================================

async function createSolutionFingerprint(
    problem,
    language,
    code
) {

    // ========================================
    // NORMALIZE CODE
    // ========================================

    const normalizedCode =
        String(code || "")
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            )
            .split("\n")
            .map(
                line =>
                    line.trimEnd()
            )
            .join("\n")
            .trim();


    // ========================================
    // NORMALIZE LANGUAGE
    // ========================================

    const normalizedLanguage =
        String(
            language || ""
        )
            .trim()
            .toLowerCase();


    // ========================================
    // NORMALIZE PROBLEM SLUG
    // ========================================

    const normalizedSlug =
        String(
            problem?.slug || ""
        )
            .trim()
            .toLowerCase();


    // ========================================
    // CREATE RAW FINGERPRINT DATA
    // ========================================

    const rawData =
        `${normalizedSlug}|${normalizedLanguage}|${normalizedCode}`;


    // ========================================
    // ENCODE
    // ========================================

    const encoded =
        new TextEncoder().encode(
            rawData
        );


    // ========================================
    // SHA-256
    // ========================================

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            encoded
        );


    // ========================================
    // CONVERT TO HEX
    // ========================================

    const hashArray =
        Array.from(
            new Uint8Array(
                hashBuffer
            )
        );


    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");

}


// ============================================
// 9. HANDLE SUBMIT CLICK
// ============================================

function handleSubmitClick() {

    if (
        waitingForSubmission
    ) {

        console.log(
            "LC2Git: Already waiting for submission."
        );

        return;

    }


    // Reset processing state
    // for a new submission.

    processingAcceptedSubmission =
        false;

    currentSubmissionFingerprint =
        null;


    acceptedCountBeforeSubmit =
        getAcceptedCount();

    waitingForSubmission =
        true;


    console.log(
        "LC2Git: Submit detected."
    );

    console.log(
        "LC2Git: Accepted count before submission:",
        acceptedCountBeforeSubmit
    );


    chrome.storage.local.set({

        waitingForSubmission:
            true,

        submissionStatus:
            "Submitting",

        accepted:
            false

    });

}


// ============================================
// 10. LISTEN FOR SUBMIT BUTTON
// ============================================

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "button"
            );

        if (!button) {

            return;

        }

        const text =
            button.innerText?.trim();

        const aria =
            button.getAttribute(
                "aria-label"
            );


        if (
            text === "Submit" ||
            aria === "Submit"
        ) {

            handleSubmitClick();

        }

    }
);


// ============================================
// 11. SAVE PROCESSED FINGERPRINT
// ============================================

async function saveProcessedFingerprint(
    fingerprint
) {

    if (!fingerprint) {

        return;

    }


    try {

        const existingData =
            await chrome.storage.local.get([
                "processedSubmissionFingerprints"
            ]);


        const fingerprints =
            Array.isArray(
                existingData.processedSubmissionFingerprints
            )
                ? existingData.processedSubmissionFingerprints
                : [];


        if (
            !fingerprints.includes(
                fingerprint
            )
        ) {

            fingerprints.unshift(
                fingerprint
            );


            await chrome.storage.local.set({

                processedSubmissionFingerprints:
                    fingerprints.slice(
                        0,
                        50
                    )

            });


            console.log(
                "LC2Git: Submission fingerprint saved locally."
            );

        }

    } catch (error) {

        console.error(
            "LC2Git: Failed to save submission fingerprint:",
            error
        );

    }

}


// ============================================
// 12. CLEAR PENDING SYNC
// ============================================

async function clearPendingSync() {

    try {

        await chrome.storage.local.set({

            pendingSync:
                false,

            pendingSyncFingerprint:
                null

        });


        console.log(
            "LC2Git: Pending sync cleared."
        );

    } catch (error) {

        console.error(
            "LC2Git: Failed to clear pending sync:",
            error
        );

    }

}


// ============================================
// 13. RETRY PENDING SYNC
// ============================================

async function retryPendingSync() {

    // ========================================
    // MAX RETRIES
    // ========================================

    if (
        syncRetryCount >=
        MAX_SYNC_RETRIES
    ) {

        console.log(
            "LC2Git: Maximum sync retries reached."
        );

        return;

    }


    // ========================================
    // GET PENDING DATA
    // ========================================

    let pendingData;


    try {

        pendingData =
            await chrome.storage.local.get([
                "pendingSync",
                "pendingSyncFingerprint",
                "currentProblem",
                "code",
                "language"
            ]);

    } catch (error) {

        console.error(
            "LC2Git: Could not read pending sync data:",
            error
        );

        return;

    }


    // ========================================
    // NO PENDING SYNC
    // ========================================

    if (
        pendingData.pendingSync !== true
    ) {

        return;

    }


    // ========================================
    // VALIDATE PENDING DATA
    // ========================================

    if (
        !pendingData.currentProblem ||
        !pendingData.code ||
        !pendingData.language
    ) {

        console.error(
            "LC2Git: Pending sync data is incomplete."
        );

        return;

    }


    // ========================================
    // INCREMENT RETRY COUNT
    // ========================================

    syncRetryCount += 1;


    console.log(
        `LC2Git: Retrying pending sync (${syncRetryCount}/${MAX_SYNC_RETRIES})...`
    );


    // ========================================
    // SEND SYNC REQUEST
    // ========================================

    chrome.runtime.sendMessage(
        {
            type:
                "SYNC_SOLUTION"
        },

        async (response) => {

            // ====================================
            // SERVICE WORKER ERROR
            // ====================================

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "LC2Git: Pending sync retry failed:",
                    chrome.runtime.lastError
                );


                scheduleNextRetry();

                return;

            }


            // ====================================
            // SUCCESS
            // ====================================

            if (
                response &&
                response.success
            ) {

                console.log(
                    "LC2Git: Pending sync retry succeeded."
                );


                // --------------------------------
                // SAVE FINGERPRINT
                // --------------------------------

                await saveProcessedFingerprint(
                    pendingData.pendingSyncFingerprint
                );


                // --------------------------------
                // CLEAR PENDING STATE
                // --------------------------------

                await clearPendingSync();


                // --------------------------------
                // RESET RETRY COUNT
                // --------------------------------

                syncRetryCount =
                    0;


                if (
                    response.alreadySynced
                ) {

                    console.log(
                        "LC2Git: Pending solution was already synced."
                    );

                } else {

                    console.log(
                        "🎉 LC2Git: Pending solution automatically committed to GitHub!"
                    );


                    console.log(
                        "LC2Git: GitHub path:",
                        response.path
                    );


                    console.log(
                        "LC2Git: Commit SHA:",
                        response.commitSha
                    );

                }


                return;

            }


            // ====================================
            // SYNC FAILED
            // ====================================

            console.error(
                "LC2Git: Pending sync retry failed:",
                response?.message
            );


            scheduleNextRetry();

        }

    );

}


// ============================================
// 14. SCHEDULE NEXT RETRY
// ============================================

function scheduleNextRetry() {

    if (
        syncRetryCount >=
        MAX_SYNC_RETRIES
    ) {

        console.log(
            "LC2Git: No more pending sync retries."
        );

        return;

    }


    // Prevent multiple retry timers.

    if (
        retryTimerId !== null
    ) {

        return;

    }


    console.log(
        `LC2Git: Next retry in ${SYNC_RETRY_DELAY / 1000} seconds.`
    );


    retryTimerId =
        setTimeout(
            () => {

                retryTimerId =
                    null;


                retryPendingSync();

            },

            SYNC_RETRY_DELAY
        );

}


// ============================================
// 15. HANDLE ACCEPTED SUBMISSION
// ============================================

async function handleAcceptedSubmission() {

    // ========================================
    // DUPLICATE PROCESSING PROTECTION
    // ========================================

    if (
        processingAcceptedSubmission
    ) {

        console.log(
            "LC2Git: Accepted submission is already being processed."
        );

        return;

    }


    processingAcceptedSubmission =
        true;

    waitingForSubmission =
        false;


    console.log(
        "🎉 LC2Git: NEW ACCEPTED submission detected!"
    );


    // ========================================
    // EXTRACT MONACO EDITOR DATA
    // ========================================

    chrome.runtime.sendMessage(
        {
            type:
                "EXTRACT_EDITOR_DATA"
        },

        async (editorData) => {

            // ====================================
            // RUNTIME ERROR
            // ====================================

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "LC2Git: Editor extraction error:",
                    chrome.runtime.lastError
                );


                processingAcceptedSubmission =
                    false;


                chrome.storage.local.set({

                    waitingForSubmission:
                        false,

                    submissionStatus:
                        "Accepted",

                    accepted:
                        false

                });


                return;

            }


            // ====================================
            // INVALID EDITOR DATA
            // ====================================

            if (
                !editorData ||
                !editorData.success
            ) {

                console.error(
                    "LC2Git: Could not extract solution.",
                    editorData?.message
                );


                processingAcceptedSubmission =
                    false;


                chrome.storage.local.set({

                    waitingForSubmission:
                        false,

                    submissionStatus:
                        "Accepted",

                    accepted:
                        false

                });


                return;

            }


            // ====================================
            // GET CURRENT PROBLEM
            // ====================================

            const problem =
                getProblemInfo();


            if (!problem) {

                console.error(
                    "LC2Git: Problem information unavailable."
                );


                processingAcceptedSubmission =
                    false;


                return;

            }


            const language =
                editorData.language;


            const code =
                editorData.code;


            // ====================================
            // LOG EXTRACTED DATA
            // ====================================

            console.log(
                "LC2Git: Monaco code extracted."
            );


            console.log(
                "LC2Git: Language:",
                language
            );


            console.log(
                "LC2Git: Problem number:",
                problem.number
            );


            console.log(
                "LC2Git: Problem title:",
                problem.title
            );


            console.log(
                "LC2Git: Code:",
                code
            );


            // ====================================
            // CREATE SOLUTION FINGERPRINT
            // ====================================

            try {

                currentSubmissionFingerprint =
                    await createSolutionFingerprint(
                        problem,
                        language,
                        code
                    );


                console.log(
                    "LC2Git: Submission fingerprint:",
                    currentSubmissionFingerprint
                );

            } catch (error) {

                console.error(
                    "LC2Git: Failed to create submission fingerprint:",
                    error
                );


                processingAcceptedSubmission =
                    false;


                return;

            }


            // ====================================
            // CHECK LOCAL DUPLICATE
            // ====================================

            const duplicateData =
                await chrome.storage.local.get([
                    "processedSubmissionFingerprints"
                ]);


            const processedFingerprints =
                Array.isArray(
                    duplicateData.processedSubmissionFingerprints
                )
                    ? duplicateData.processedSubmissionFingerprints
                    : [];


            console.log(
                "LC2Git: Stored fingerprints:",
                processedFingerprints.length
            );


            console.log(
                "LC2Git: Current fingerprint:",
                currentSubmissionFingerprint
            );


            // ====================================
            // DUPLICATE FOUND
            // ====================================

            if (
                processedFingerprints.includes(
                    currentSubmissionFingerprint
                )
            ) {

                console.log(
                    "🔁 LC2Git: Duplicate submission detected locally. Skipping GitHub sync."
                );


                processingAcceptedSubmission =
                    false;


                return;

            }


            // ====================================
            // SAVE ACCEPTED SOLUTION
            // ====================================

            try {

                await chrome.storage.local.set({

                    currentProblem:
                        problem,

                    language:
                        language,

                    code:
                        code,

                    waitingForSubmission:
                        false,

                    submissionStatus:
                        "Accepted",

                    accepted:
                        true,

                    // ====================================
                    // PENDING SYNC STATE
                    // ====================================

                    pendingSync:
                        true,

                    pendingSyncFingerprint:
                        currentSubmissionFingerprint

                });


                console.log(
                    "LC2Git: Solution saved to extension storage."
                );


                console.log(
                    "LC2Git: Pending sync state saved."
                );

            } catch (error) {

                console.error(
                    "LC2Git: Failed to save solution:",
                    error
                );


                processingAcceptedSubmission =
                    false;


                return;

            }


            // ====================================
            // AUTOMATIC GITHUB SYNC
            // ====================================

            console.log(
                "LC2Git: Starting automatic GitHub sync..."
            );


            chrome.runtime.sendMessage(
                {
                    type:
                        "SYNC_SOLUTION"
                },

                async (response) => {

                    // ====================================
                    // SYNC RUNTIME ERROR
                    // ====================================

                    if (
                        chrome.runtime.lastError
                    ) {

                        console.error(
                            "LC2Git: GitHub sync error:",
                            chrome.runtime.lastError
                        );


                        console.log(
                            "LC2Git: Pending sync retained for retry."
                        );


                        processingAcceptedSubmission =
                            false;


                        scheduleNextRetry();


                        return;

                    }


                    // ====================================
                    // SUCCESSFUL RESPONSE
                    // ====================================

                    if (
                        response &&
                        response.success
                    ) {

                        // ====================================
                        // SAVE PROCESSED FINGERPRINT
                        // ====================================

                        await saveProcessedFingerprint(
                            currentSubmissionFingerprint
                        );


                        // ====================================
                        // CLEAR PENDING SYNC
                        // ====================================

                        await clearPendingSync();


                        // ====================================
                        // RESET RETRY COUNT
                        // ====================================

                        syncRetryCount =
                            0;


                        // ====================================
                        // ALREADY SYNCED
                        // ====================================

                        if (
                            response.alreadySynced
                        ) {

                            console.log(
                                "LC2Git: Solution was already synced."
                            );

                        } else {

                            // ====================================
                            // NEW GITHUB COMMIT
                            // ====================================

                            console.log(
                                "🎉 LC2Git: Solution automatically committed to GitHub!"
                            );


                            console.log(
                                "LC2Git: GitHub path:",
                                response.path
                            );


                            console.log(
                                "LC2Git: Commit SHA:",
                                response.commitSha
                            );

                        }

                    } else {

                        // ====================================
                        // SYNC FAILED
                        // ====================================

                        console.error(
                            "LC2Git: Automatic GitHub sync failed:",
                            response?.message
                        );


                        console.log(
                            "LC2Git: Pending sync retained for retry."
                        );


                        scheduleNextRetry();

                    }


                    // ====================================
                    // RELEASE PROCESSING LOCK
                    // ====================================

                    processingAcceptedSubmission =
                        false;

                }

            );

        }

    );

}


// ============================================
// 16. CHECK FOR NEW ACCEPTED RESULT
// ============================================

function checkForNewAcceptance() {

    if (
        !waitingForSubmission
    ) {

        return;

    }


    const currentAcceptedCount =
        getAcceptedCount();


    if (
        currentAcceptedCount >
        acceptedCountBeforeSubmit
    ) {

        handleAcceptedSubmission();

    }

}


// ============================================
// 17. WATCH LEETCODE DOM
// ============================================

const submissionObserver =
    new MutationObserver(() => {

        checkForNewAcceptance();

    });


submissionObserver.observe(
    document.body,
    {
        childList:
            true,

        subtree:
            true
    }
);


// ============================================
// 18. PERIODIC SUBMISSION CHECK
// ============================================

setInterval(() => {

    checkForNewAcceptance();

}, 500);


// ============================================
// 19. CHECK FOR EXISTING PENDING SYNC
// ============================================

setTimeout(
    () => {

        console.log(
            "LC2Git: Checking for pending sync..."
        );


        retryPendingSync();

    },
    5000
);


// ============================================
// 20. READY
// ============================================

console.log(
    "LC2Git: Content script ready."
);