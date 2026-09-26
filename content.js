// ============================================
// LC2Git - LeetCode Content Script
// ============================================

console.log("LC2Git: Content script loaded.");


// ============================================
// EXTENSION CONTEXT SAFETY
// ============================================

function isExtensionContextValid() {
    try {
        return Boolean(
            chrome &&
            chrome.runtime &&
            chrome.runtime.id
        );
    } catch (error) {
        return false;
    }
}


function handleInvalidExtensionContext() {

    console.warn(
        "LC2Git: Extension context was invalidated. Please refresh LeetCode."
    );

    return false;
}


// ============================================
// SAFE STORAGE SET
// ============================================

async function safeStorageSet(data) {

    if (!isExtensionContextValid()) {
        handleInvalidExtensionContext();
        return false;
    }

    try {

        await chrome.storage.local.set(data);

        return true;

    } catch (error) {

        if (
            String(error?.message || "")
                .toLowerCase()
                .includes("extension context")
        ) {

            handleInvalidExtensionContext();

        } else {

            console.error(
                "LC2Git: Storage error:",
                error
            );

        }

        return false;
    }
}


// ============================================
// SAFE STORAGE GET
// ============================================

async function safeStorageGet(keys) {

    if (!isExtensionContextValid()) {
        handleInvalidExtensionContext();
        return null;
    }

    try {

        return await chrome.storage.local.get(keys);

    } catch (error) {

        if (
            String(error?.message || "")
                .toLowerCase()
                .includes("extension context")
        ) {

            handleInvalidExtensionContext();

        } else {

            console.error(
                "LC2Git: Storage error:",
                error
            );

        }

        return null;
    }
}


// ============================================
// SAFE RUNTIME MESSAGE
// ============================================

function safeRuntimeMessage(
    message,
    callback
) {

    if (!isExtensionContextValid()) {

        handleInvalidExtensionContext();

        if (callback) {
            callback(null);
        }

        return false;
    }


    try {

        chrome.runtime.sendMessage(
            message,
            (response) => {

                if (
                    chrome.runtime.lastError
                ) {

                    const errorMessage =
                        chrome.runtime.lastError.message ||
                        "";

                    if (
                        errorMessage
                            .toLowerCase()
                            .includes(
                                "extension context"
                            )
                    ) {

                        handleInvalidExtensionContext();

                    } else {

                        console.error(
                            "LC2Git: Runtime message error:",
                            chrome.runtime.lastError
                        );

                    }

                    if (callback) {
                        callback(null);
                    }

                    return;
                }


                if (callback) {
                    callback(response);
                }

            }
        );

        return true;

    } catch (error) {

        if (
            String(error?.message || "")
                .toLowerCase()
                .includes("extension context")
        ) {

            handleInvalidExtensionContext();

        } else {

            console.error(
                "LC2Git: Runtime message error:",
                error
            );

        }

        if (callback) {
            callback(null);
        }

        return false;
    }
}


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
    // METHOD 1 - QUESTION TITLE
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
    // METHOD 2 - PAGE TITLE
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
    // METHOD 3 - LEETCODE SCRIPT DATA
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

async function saveProblemInfo() {

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


    await safeStorageSet({

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


            safeStorageSet({

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


let processingAcceptedSubmission =
    false;


let currentSubmissionFingerprint =
    null;


// ============================================
// 7. PENDING SYNC RETRY CONFIGURATION
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
// 8. COUNT ACCEPTED RESULTS
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
// 9. CREATE SOLUTION FINGERPRINT
// ============================================

async function createSolutionFingerprint(
    problem,
    language,
    code
) {

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


    const normalizedLanguage =
        String(
            language || ""
        )
            .trim()
            .toLowerCase();


    const normalizedSlug =
        String(
            problem?.slug || ""
        )
            .trim()
            .toLowerCase();


    const rawData =
        `${normalizedSlug}|${normalizedLanguage}|${normalizedCode}`;


    const encoded =
        new TextEncoder().encode(
            rawData
        );


    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            encoded
        );


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
// 10. HANDLE SUBMIT CLICK
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


    safeStorageSet({

        waitingForSubmission:
            true,

        submissionStatus:
            "Submitting",

        accepted:
            false

    });

}


// ============================================
// 11. LISTEN FOR SUBMIT BUTTON
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
// 12. SAVE PROCESSED FINGERPRINT
// ============================================

async function saveProcessedFingerprint(
    fingerprint
) {

    if (!fingerprint) {

        return;

    }


    const existingData =
        await safeStorageGet([
            "processedSubmissionFingerprints"
        ]);


    if (!existingData) {

        return;

    }


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


        await safeStorageSet({

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

}


// ============================================
// 13. CLEAR PENDING SYNC
// ============================================

async function clearPendingSync() {

    const success =
        await safeStorageSet({

            pendingSync:
                false,

            pendingSyncFingerprint:
                null

        });


    if (success) {

        console.log(
            "LC2Git: Pending sync cleared."
        );

    }

}


// ============================================
// 14. RETRY PENDING SYNC
// ============================================

async function retryPendingSync() {

    if (
        !isExtensionContextValid()
    ) {

        handleInvalidExtensionContext();

        return;

    }


    if (
        syncRetryCount >=
        MAX_SYNC_RETRIES
    ) {

        console.log(
            "LC2Git: Maximum sync retries reached."
        );

        return;

    }


    const pendingData =
        await safeStorageGet([
            "pendingSync",
            "pendingSyncFingerprint",
            "currentProblem",
            "code",
            "language"
        ]);


    if (!pendingData) {

        return;

    }


    if (
        pendingData.pendingSync !== true
    ) {

        return;

    }


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


    syncRetryCount += 1;


    console.log(
        `LC2Git: Retrying pending sync (${syncRetryCount}/${MAX_SYNC_RETRIES})...`
    );


    safeRuntimeMessage(
        {
            type:
                "SYNC_SOLUTION"
        },

        async (response) => {

            if (!response) {

                scheduleNextRetry();

                return;

            }


            if (
                response.success
            ) {

                console.log(
                    "LC2Git: Pending sync retry succeeded."
                );


                await saveProcessedFingerprint(
                    pendingData.pendingSyncFingerprint
                );


                await clearPendingSync();


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


            console.error(
                "LC2Git: Pending sync retry failed:",
                response.message
            );


            scheduleNextRetry();

        }
    );

}


// ============================================
// 15. SCHEDULE NEXT RETRY
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
// 16. HANDLE ACCEPTED SUBMISSION
// ============================================

async function handleAcceptedSubmission() {

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


    if (
        !isExtensionContextValid()
    ) {

        handleInvalidExtensionContext();

        processingAcceptedSubmission =
            false;

        return;

    }


    safeRuntimeMessage(
        {
            type:
                "EXTRACT_EDITOR_DATA"
        },

        async (editorData) => {

            if (!editorData) {

                processingAcceptedSubmission =
                    false;

                return;

            }


            if (
                !editorData.success
            ) {

                console.error(
                    "LC2Git: Could not extract solution.",
                    editorData.message
                );


                processingAcceptedSubmission =
                    false;


                await safeStorageSet({

                    waitingForSubmission:
                        false,

                    submissionStatus:
                        "Accepted",

                    accepted:
                        false

                });


                return;

            }


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
            // CREATE FINGERPRINT
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
            // CHECK DUPLICATE
            // ====================================

            const duplicateData =
                await safeStorageGet([
                    "processedSubmissionFingerprints"
                ]);


            if (!duplicateData) {

                processingAcceptedSubmission =
                    false;

                return;

            }


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

            const saved =
                await safeStorageSet({

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

                    pendingSync:
                        true,

                    pendingSyncFingerprint:
                        currentSubmissionFingerprint

                });


            if (!saved) {

                processingAcceptedSubmission =
                    false;

                return;

            }


            console.log(
                "LC2Git: Solution saved to extension storage."
            );


            console.log(
                "LC2Git: Pending sync state saved."
            );


            // ====================================
            // START GITHUB SYNC
            // ====================================

            console.log(
                "LC2Git: Starting automatic GitHub sync..."
            );


            safeRuntimeMessage(
                {
                    type:
                        "SYNC_SOLUTION"
                },

                async (response) => {

                    // ==================================
                    // RUNTIME / CONTEXT ERROR
                    // ==================================

                    if (!response) {

                        console.log(
                            "LC2Git: Pending sync retained for retry."
                        );


                        processingAcceptedSubmission =
                            false;


                        scheduleNextRetry();

                        return;

                    }


                    // ==================================
                    // SUCCESS
                    // ==================================

                    if (
                        response.success
                    ) {

                        await saveProcessedFingerprint(
                            currentSubmissionFingerprint
                        );


                        await clearPendingSync();


                        syncRetryCount =
                            0;


                        if (
                            response.alreadySynced
                        ) {

                            console.log(
                                "LC2Git: Solution was already synced."
                            );

                        } else {

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

                        // ==================================
                        // SYNC FAILED
                        // ==================================

                        console.error(
                            "LC2Git: Automatic GitHub sync failed:",
                            response.message
                        );


                        console.log(
                            "LC2Git: Pending sync retained for retry."
                        );


                        scheduleNextRetry();

                    }


                    processingAcceptedSubmission =
                        false;

                }
            );

        }
    );

}


// ============================================
// 17. CHECK FOR NEW ACCEPTED RESULT
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
// 18. WATCH LEETCODE DOM
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
// 19. PERIODIC SUBMISSION CHECK
// ============================================

setInterval(() => {

    checkForNewAcceptance();

}, 500);


// ============================================
// 20. CHECK EXISTING PENDING SYNC
// ============================================

setTimeout(
    () => {

        if (
            !isExtensionContextValid()
        ) {

            handleInvalidExtensionContext();

            return;

        }


        console.log(
            "LC2Git: Checking for pending sync..."
        );


        retryPendingSync();

    },

    5000
);


// ============================================
// 21. READY
// ============================================

console.log(
    "LC2Git: Content script ready."
);