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
    // READ NUMBER FROM QUESTION TITLE
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
    // FALLBACK TO PAGE TITLE
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
    // FALLBACK TO LEETCODE SCRIPT DATA
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


    // ========================================
    // USE LAST SCRIPT CANDIDATE
    // ========================================

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

        // ------------------------------------
        // Remove problem number if present
        // Example:
        // "1. Two Sum"
        // becomes:
        // "Two Sum"
        // ------------------------------------

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
// 8. HANDLE SUBMIT CLICK
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
// 9. LISTEN FOR SUBMIT BUTTON
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
// 10. EXTRACT + SYNC ACCEPTED SOLUTION
// ============================================

function handleAcceptedSubmission() {

    waitingForSubmission =
        false;


    console.log(
        "🎉 LC2Git: NEW ACCEPTED submission detected!"
    );


    // ========================================
    // ASK BACKGROUND TO ACCESS MONACO
    // ========================================

    chrome.runtime.sendMessage(
        {
            type:
                "EXTRACT_EDITOR_DATA"
        },

        (editorData) => {

            if (
                chrome.runtime.lastError
            ) {

                console.error(
                    "LC2Git: Editor extraction error:",
                    chrome.runtime.lastError
                );


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


            if (
                !editorData ||
                !editorData.success
            ) {

                console.error(
                    "LC2Git: Could not extract solution.",
                    editorData?.message
                );


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
            // SAVE SOLUTION
            // ====================================

            chrome.storage.local.set({

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
                    true

            })
            .then(() => {

                console.log(
                    "LC2Git: Solution saved to extension storage."
                );


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

                    (response) => {

                        if (
                            chrome.runtime.lastError
                        ) {

                            console.error(
                                "LC2Git: GitHub sync error:",
                                chrome.runtime.lastError
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

                            console.error(
                                "LC2Git: Automatic GitHub sync failed:",
                                response?.message
                            );

                        }

                    }
                );

            });

        }
    );

}


// ============================================
// 11. CHECK FOR NEW ACCEPTED RESULT
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
// 12. WATCH LEETCODE DOM
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
// 13. PERIODIC SUBMISSION CHECK
// ============================================

setInterval(() => {

    checkForNewAcceptance();

}, 500);


// ============================================
// 14. READY
// ============================================

console.log(
    "LC2Git: Content script ready."
);