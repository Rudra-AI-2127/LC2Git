// ============================================
// LC2Git - LeetCode Content Script
// ============================================

console.log("LC2Git: Content script loaded.");


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
        document.querySelectorAll("span, div, button");

    for (const element of elements) {

        const text =
            element.innerText?.trim();

        if (difficulties.includes(text)) {
            return text;
        }
    }

    return "Unknown";
}


// ============================================
// 2. GET PROBLEM NUMBER
// ============================================

function getProblemNumber() {

    const scripts = [
        ...document.scripts
    ];

    for (const script of scripts) {

        const text =
            script.textContent;

        if (
            !text ||
            !text.includes("questionFrontendId")
        ) {
            continue;
        }

        const match =
            text.match(
                /"questionFrontendId"\s*:\s*"(\d+)"/
            );

        if (match) {
            return Number(match[1]);
        }
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

    const slug = match[1];


    // Try LeetCode's question title element
    const titleElement =
        document.querySelector(
            '[data-cy="question-title"]'
        );


    let title;


    if (titleElement) {

        title =
            titleElement.innerText.trim();

    } else {

        title =
            document.title
                .replace(/^\d+\.\s*/, "")
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


    // Normalize URL
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
// 4. GET LANGUAGE FROM MONACO
// ============================================

function getLanguage() {

    // Monaco isn't available
    if (
        typeof monaco === "undefined" ||
        !monaco.editor
    ) {

        console.log(
            "LC2Git: Monaco is not available."
        );

        return "Unknown";
    }


    const models =
        monaco.editor.getModels();


    for (const model of models) {

        const language =
            model.getLanguageId();


        // Ignore empty/plaintext models
        if (
            language &&
            language !== "plaintext"
        ) {

            return language;
        }
    }


    return "Unknown";
}


// ============================================
// 5. GET REAL EDITOR CODE
// ============================================

function getEditorCode() {

    // Monaco isn't available
    if (
        typeof monaco === "undefined" ||
        !monaco.editor
    ) {

        console.log(
            "LC2Git: Monaco editor is not available."
        );

        return "";
    }


    const models =
        monaco.editor.getModels();


    for (const model of models) {

        const language =
            model.getLanguageId();


        // Ignore plaintext model
        if (
            !language ||
            language === "plaintext"
        ) {
            continue;
        }


        const code =
            model.getValue();


        if (
            code &&
            code.trim().length > 0
        ) {

            console.log(
                "LC2Git: Real editor model found."
            );

            console.log(
                "LC2Git: Language:",
                language
            );

            console.log(
                "LC2Git: Code:",
                code
            );


            return code;
        }
    }


    console.log(
        "LC2Git: No usable editor model found."
    );


    return "";
}


// ============================================
// 6. GET COMPLETE SOLUTION DATA
// ============================================

function getSolutionData() {

    const problem =
        getProblemInfo();


    if (!problem) {

        console.log(
            "LC2Git: Problem information unavailable."
        );

        return null;
    }


    const language =
        getLanguage();


    const code =
        getEditorCode();


    if (!code) {

        console.log(
            "LC2Git: Could not extract code."
        );

        return null;
    }


    return {

        problem:
            problem,

        language:
            language,

        code:
            code
    };
}


// ============================================
// 7. SAVE PROBLEM INFORMATION
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

    console.log(problem);


    chrome.storage.local.set({

        currentProblem:
            problem

    });
}


// Run immediately
saveProblemInfo();


// ============================================
// 8. DETECT PROBLEM NAVIGATION
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
// 9. SUBMISSION VARIABLES
// ============================================

let waitingForSubmission =
    false;


let acceptedCountBeforeSubmit =
    0;


// ============================================
// 10. COUNT ACCEPTED RESULTS
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
// 11. HANDLE SUBMIT CLICK
// ============================================

function handleSubmitClick() {

    if (waitingForSubmission) {

        console.log(
            "LC2Git: Already waiting for submission."
        );

        return;
    }


    // Record current Accepted count
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
// 12. LISTEN FOR SUBMIT BUTTON
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
// 13. CHECK FOR NEW ACCEPTED RESULT
// ============================================

function checkForNewAcceptance() {

    if (!waitingForSubmission) {
        return;
    }


    const currentAcceptedCount =
        getAcceptedCount();


    // A NEW Accepted result appeared
    if (
        currentAcceptedCount >
        acceptedCountBeforeSubmit
    ) {

        waitingForSubmission =
            false;


        console.log(
            "🎉 LC2Git: NEW ACCEPTED submission detected!"
        );


        // Extract actual solution
        const solution =
            getSolutionData();


        if (!solution) {

            console.error(
                "LC2Git: Could not extract solution."
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


        console.log(
            "LC2Git: Solution extracted!"
        );


        console.log(
            solution
        );


        // Save everything
        chrome.storage.local.set({

            currentProblem:
                solution.problem,

            language:
                solution.language,

            code:
                solution.code,

            waitingForSubmission:
                false,

            submissionStatus:
                "Accepted",

            accepted:
                true

        });


        console.log(
            "LC2Git: Solution saved to extension storage."
        );
    }
}


// ============================================
// 14. WATCH LEETCODE DOM
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
// 15. PERIODIC SUBMISSION CHECK
// ============================================

setInterval(() => {

    checkForNewAcceptance();

}, 500);


// ============================================
// 16. READY
// ============================================

console.log(
    "LC2Git: Content script ready."
);