// ============================================
// LC2Git - Background Service Worker
// ============================================

const GITHUB_API = "https://api.github.com";

const OWNER = "Rudra-AI-2127";
const REPO = "leetcode-solutions";

const API_VERSION = "2026-03-10";


// ============================================
// EXTENSION INSTALLED
// ============================================

chrome.runtime.onInstalled.addListener(() => {

    console.log(
        "LC2Git installed successfully."
    );

});


// ============================================
// GET GITHUB TOKEN
// ============================================

async function getGitHubToken() {

    const data =
        await chrome.storage.local.get([
            "githubToken"
        ]);

    return data.githubToken || null;
}


// ============================================
// GITHUB REQUEST
// ============================================

async function githubRequest(
    endpoint,
    options = {}
) {

    const token =
        await getGitHubToken();


    if (!token) {

        throw new Error(
            "GitHub is not connected."
        );

    }


    const response =
        await fetch(
            `${GITHUB_API}${endpoint}`,
            {

                ...options,

                headers: {

                    "Accept":
                        "application/vnd.github+json",

                    "Authorization":
                        `Bearer ${token}`,

                    "X-GitHub-Api-Version":
                        API_VERSION,

                    ...(options.headers || {})

                }

            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    return {

        ok:
            response.ok,

        status:
            response.status,

        data:
            data

    };

}


// ============================================
// CONNECT GITHUB
// ============================================

async function connectGitHub(token) {

    if (
        !token ||
        token.trim().length === 0
    ) {

        return {

            success: false,

            message:
                "GitHub token is required."

        };

    }


    token =
        token.trim();


    try {

        // ------------------------------------
        // Verify GitHub user
        // ------------------------------------

        const userResult =
            await fetch(
                `${GITHUB_API}/user`,
                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/vnd.github+json",

                        "Authorization":
                            `Bearer ${token}`,

                        "X-GitHub-Api-Version":
                            API_VERSION

                    }

                }
            );


        if (!userResult.ok) {

            return {

                success: false,

                message:
                    "Invalid GitHub token."

            };

        }


        const user =
            await userResult.json();


        // ------------------------------------
        // Verify repository
        // ------------------------------------

        const repoResult =
            await fetch(
                `${GITHUB_API}/repos/${OWNER}/${REPO}`,
                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/vnd.github+json",

                        "Authorization":
                            `Bearer ${token}`,

                        "X-GitHub-Api-Version":
                            API_VERSION

                    }

                }
            );


        if (!repoResult.ok) {

            return {

                success: false,

                message:
                    "Token cannot access the target repository."

            };

        }


        // ------------------------------------
        // Save GitHub connection
        // ------------------------------------

        await chrome.storage.local.set({

            githubToken:
                token,

            githubConnected:
                true,

            githubUsername:
                user.login,

            githubRepository:
                `${OWNER}/${REPO}`

        });


        console.log(
            "LC2Git: GitHub connected successfully."
        );


        return {

            success: true,

            username:
                user.login,

            repository:
                `${OWNER}/${REPO}`,

            message:
                "GitHub connected successfully."

        };

    } catch (error) {

        console.error(
            "LC2Git: GitHub connection error.",
            error
        );


        return {

            success: false,

            message:
                "Could not connect to GitHub."

        };

    }

}


// ============================================
// DISCONNECT GITHUB
// ============================================

async function disconnectGitHub() {

    await chrome.storage.local.remove([

        "githubToken",

        "githubConnected",

        "githubUsername",

        "githubRepository"

    ]);


    return {

        success: true

    };

}


// ============================================
// EXTRACT CODE FROM LEETCODE MONACO
// ============================================

async function extractEditorData(tabId) {

    try {

        const results =
            await chrome.scripting.executeScript({

                target: {
                    tabId:
                        tabId
                },

                world:
                    "MAIN",

                func: () => {

                    // ====================================
                    // ACCESS LEETCODE PAGE MONACO
                    // ====================================

                    if (
                        typeof monaco === "undefined" ||
                        !monaco.editor
                    ) {

                        return {

                            success:
                                false,

                            message:
                                "Monaco is not available in page context."

                        };

                    }


                    const models =
                        monaco.editor.getModels();


                    for (
                        const model of models
                    ) {

                        const language =
                            model.getLanguageId();


                        // Ignore plaintext
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

                            return {

                                success:
                                    true,

                                language:
                                    language,

                                code:
                                    code

                            };

                        }

                    }


                    return {

                        success:
                            false,

                        message:
                            "No usable Monaco model found."

                    };

                }

            });


        if (
            !results ||
            results.length === 0
        ) {

            return {

                success:
                    false,

                message:
                    "No result returned from page."

            };

        }


        return results[0].result;

    } catch (error) {

        console.error(
            "LC2Git: Monaco extraction error:",
            error
        );


        return {

            success:
                false,

            message:
                error.message ||
                "Could not extract editor data."

        };

    }

}


// ============================================
// LANGUAGE → FILE EXTENSION
// ============================================

function getFileExtension(language) {

    const extensions = {

        java:
            "java",

        Java:
            "java",


        python:
            "py",

        Python:
            "py",


        cpp:
            "cpp",

        "C++":
            "cpp",


        c:
            "c",

        C:
            "c",


        javascript:
            "js",

        JavaScript:
            "js",


        typescript:
            "ts",

        TypeScript:
            "ts",


        csharp:
            "cs",

        "C#":
            "cs",


        go:
            "go",

        Go:
            "go",


        rust:
            "rs",

        Rust:
            "rs",


        kotlin:
            "kt",

        Kotlin:
            "kt",


        swift:
            "swift",

        Swift:
            "swift",


        php:
            "php",

        PHP:
            "php"

    };


    return (
        extensions[language] ||
        "txt"
    );

}


// ============================================
// GET LEETCODE PROBLEM METADATA
// ============================================

async function getLeetCodeProblemMetadata(slug) {

    try {

        const query = `
            query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {

                    questionFrontendId

                    topicTags {
                        name
                        slug
                    }

                }
            }
        `;


        const response =
            await fetch(
                "https://leetcode.com/graphql/",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            query:
                                query,

                            variables: {

                                titleSlug:
                                    slug

                            }

                        })

                }
            );


        if (!response.ok) {

            console.error(
                "LC2Git: LeetCode metadata request failed:",
                response.status
            );


            return {

                number:
                    null,

                topics:
                    []

            };

        }


        const data =
            await response.json();


        const question =
            data?.data?.question;


        if (!question) {

            console.error(
                "LC2Git: LeetCode question metadata not found."
            );


            return {

                number:
                    null,

                topics:
                    []

            };

        }


        const number =
            question.questionFrontendId
                ? Number(
                    question.questionFrontendId
                )
                : null;


        const topics =
            question.topicTags || [];


        console.log(
            "LC2Git: LeetCode problem number:",
            number
        );


        console.log(
            "LC2Git: LeetCode topics:",
            topics
        );


        return {

            number:
                number,

            topics:
                topics

        };

    } catch (error) {

        console.error(
            "LC2Git: Could not fetch LeetCode metadata:",
            error
        );


        return {

            number:
                null,

            topics:
                []

        };

    }

}


// ============================================
// LEETCODE TOPICS → REPOSITORY FOLDER
// ============================================

function getTopicFolderFromTopics(topics) {

    const topicNames =
        topics
            .map(
                topic =>
                    (
                        topic.name ||
                        ""
                    ).toLowerCase()
            );


    // ========================================
    // PRIORITY ORDER
    // ========================================

    const rules = [

        // ====================================
        // ARRAYS
        // ====================================

        {
            folder:
                "Arrays",

            keywords: [
                "array"
            ]

        },


        // ====================================
        // LINKED LIST
        // ====================================

        {
            folder:
                "Linked-List",

            keywords: [
                "linked list"
            ]

        },


        // ====================================
        // TREES
        // ====================================

        {
            folder:
                "Trees",

            keywords: [
                "binary tree",
                "binary search tree",
                "tree"
            ]

        },


        // ====================================
        // GRAPHS
        // ====================================

        {
            folder:
                "Graphs",

            keywords: [
                "graph"
            ]

        },


        // ====================================
        // DYNAMIC PROGRAMMING
        // ====================================

        {
            folder:
                "Dynamic-Programming",

            keywords: [
                "dynamic programming"
            ]

        },


        // ====================================
        // BACKTRACKING
        // ====================================

        {
            folder:
                "Backtracking",

            keywords: [
                "backtracking"
            ]

        },


        // ====================================
        // BINARY SEARCH
        // ====================================

        {
            folder:
                "Binary-Search",

            keywords: [
                "binary search"
            ]

        },


        // ====================================
        // HEAP / PRIORITY QUEUE
        // ====================================

        {
            folder:
                "Heap-Priority-Queue",

            keywords: [
                "heap",
                "priority queue"
            ]

        },


        // ====================================
        // STACK / QUEUE
        // ====================================

        {
            folder:
                "Stack-Queue",

            keywords: [
                "stack",
                "queue"
            ]

        },


        // ====================================
        // HASH TABLE
        // ====================================

        {
            folder:
                "Hash-Table",

            keywords: [
                "hash table"
            ]

        },


        // ====================================
        // GREEDY
        // ====================================

        {
            folder:
                "Greedy",

            keywords: [
                "greedy"
            ]

        },


        // ====================================
        // STRING
        // ====================================

        {
            folder:
                "String",

            keywords: [
                "string"
            ]

        },


        // ====================================
        // MATH
        // ====================================

        {
            folder:
                "Math",

            keywords: [
                "math"
            ]

        }

    ];


    // ========================================
    // FIND HIGHEST PRIORITY MATCH
    // ========================================

    for (
        const rule of rules
    ) {

        for (
            const keyword of rule.keywords
        ) {

            if (
                topicNames.includes(
                    keyword
                )
            ) {

                return rule.folder;

            }

        }

    }


    // ========================================
    // DEFAULT
    // ========================================

    return "Other";

}


// ============================================
// CREATE SAFE FILE NAME
// ============================================

function createFileName(problem) {

    const number =
        String(
            problem.number || 0
        ).padStart(
            4,
            "0"
        );


    const slug =
        (
            problem.slug ||
            "solution"
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9-]/g,
            "-"
        );


    return `${number}-${slug}`;

}


// ============================================
// BASE64 ENCODING
// ============================================

function encodeBase64(text) {

    const bytes =
        new TextEncoder()
            .encode(text);


    let binary =
        "";


    const chunkSize =
        0x8000;


    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        const chunk =
            bytes.subarray(
                i,
                i + chunkSize
            );


        binary +=
            String.fromCharCode(
                ...chunk
            );

    }


    return btoa(
        binary
    );

}


// ============================================
// BASE64 DECODING
// ============================================

function decodeBase64(base64) {

    const binary =
        atob(
            base64.replace(
                /\n/g,
                ""
            )
        );


    const bytes =
        Uint8Array.from(
            binary,
            character =>
                character.charCodeAt(0)
        );


    return new TextDecoder()
        .decode(bytes);

}


// ============================================
// GET EXISTING GITHUB FILE
// ============================================

async function getExistingFile(path) {

    const result =
        await githubRequest(
            `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
            {
                method:
                    "GET"
            }
        );


    if (
        result.status === 404
    ) {

        return null;

    }


    if (!result.ok) {

        throw new Error(
            result.data?.message ||
            "Could not check existing GitHub file."
        );

    }


    return result.data;

}


// ============================================
// SYNC SOLUTION TO GITHUB
// ============================================

async function syncSolution() {

    try {

        // ====================================
        // GET STORED SOLUTION
        // ====================================

        const connection =
            await chrome.storage.local.get([

                "githubConnected",

                "currentProblem",

                "language",

                "code",

                "accepted"

            ]);


        // ====================================
        // CHECK GITHUB CONNECTION
        // ====================================

        if (
            connection.githubConnected !== true
        ) {

            return {

                success:
                    false,

                message:
                    "Connect GitHub first."

            };

        }


        // ====================================
        // CHECK ACCEPTED STATUS
        // ====================================

        if (
            connection.accepted !== true
        ) {

            return {

                success:
                    false,

                message:
                    "No accepted solution is ready to sync."

            };

        }


        const problem =
            connection.currentProblem;


        const language =
            connection.language;


        const code =
            connection.code;


        // ====================================
        // CHECK SOLUTION DATA
        // ====================================

        if (
            !problem ||
            !code
        ) {

            return {

                success:
                    false,

                message:
                    "Solution data is missing."

            };

        }


        // ====================================
        // FILE EXTENSION
        // ====================================

        const extension =
            getFileExtension(
                language
            );


        // ====================================
        // GET LEETCODE METADATA
        // ====================================

        const metadata =
            await getLeetCodeProblemMetadata(
                problem.slug
            );


        const topics =
            metadata.topics;


        // ====================================
        // USE CANONICAL LEETCODE NUMBER
        // ====================================

        if (
            metadata.number
        ) {

            problem.number =
                metadata.number;

        }


        // ====================================
        // FILE NAME
        // ====================================

        const fileName =
            createFileName(
                problem
            );


        // ====================================
        // TOPIC FOLDER
        // ====================================

        const folder =
            getTopicFolderFromTopics(
                topics
            );


        // ====================================
        // FINAL GITHUB PATH
        // ====================================

        const path =
            `${folder}/${fileName}.${extension}`;


        // ====================================
        // LOG INFORMATION
        // ====================================

        console.log(
            "LC2Git: Problem:",
            problem.title
        );


        console.log(
            "LC2Git: Problem number:",
            problem.number
        );


        console.log(
            "LC2Git: Language:",
            language
        );


        console.log(
            "LC2Git: Topics:",
            topics.map(
                topic =>
                    topic.name
            )
        );


        console.log(
            "LC2Git: Folder:",
            folder
        );


        console.log(
            "LC2Git: GitHub path:",
            path
        );


        // ====================================
        // SAVE CORRECTED PROBLEM DATA
        // ====================================

        await chrome.storage.local.set({

            currentProblem:
                problem

        });


        // ====================================
        // CHECK EXISTING GITHUB FILE
        // ====================================

        const existingFile =
            await getExistingFile(
                path
            );


        // ====================================
        // DUPLICATE PROTECTION
        // ====================================

        if (
            existingFile &&
            existingFile.content
        ) {

            const existingCode =
                decodeBase64(
                    existingFile.content
                );


            if (
                existingCode === code
            ) {

                console.log(
                    "LC2Git: Solution already exists on GitHub."
                );


                return {

                    success:
                        true,

                    alreadySynced:
                        true,

                    message:
                        "Solution is already synced.",

                    path:
                        path

                };

            }

        }


        // ====================================
        // CREATE GITHUB REQUEST
        // ====================================

        const body = {

            message:
                `feat: add ${problem.number}. ${problem.title}`,

            content:
                encodeBase64(
                    code
                )

        };


        // ====================================
        // EXISTING FILE REQUIRES SHA
        // ====================================

        if (
            existingFile
        ) {

            body.sha =
                existingFile.sha;

        }


        // ====================================
        // SEND TO GITHUB
        // ====================================

        const result =
            await githubRequest(
                `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            body
                        )

                }
            );


        // ====================================
        // HANDLE GITHUB ERROR
        // ====================================

        if (
            !result.ok
        ) {

            console.error(
                "LC2Git: GitHub API error:",
                result.data
            );


            return {

                success:
                    false,

                message:
                    result.data?.message ||
                    `GitHub API error (${result.status}).`

            };

        }


        // ====================================
        // UPDATE LOCAL STATISTICS
        // ====================================

        const stats =
            await chrome.storage.local.get([

                "syncedCount",

                "commitCount"

            ]);


        const syncedCount =
            Number(
                stats.syncedCount || 0
            ) + 1;


        const commitCount =
            Number(
                stats.commitCount || 0
            ) + 1;


        await chrome.storage.local.set({

            syncedCount:
                syncedCount,

            commitCount:
                commitCount

        });


        // ====================================
        // SUCCESS
        // ====================================

        console.log(
            "🎉 LC2Git: Solution synced to GitHub!"
        );


        console.log(
            "LC2Git: GitHub path:",
            path
        );


        console.log(
            "LC2Git: Commit SHA:",
            result.data?.commit?.sha
        );


        return {

            success:
                true,

            alreadySynced:
                false,

            path:
                path,

            commitSha:
                result.data?.commit?.sha ||
                null,

            message:
                "Solution committed to GitHub."

        };

    } catch (error) {

        console.error(
            "LC2Git: Sync error:",
            error
        );


        return {

            success:
                false,

            message:
                error.message ||
                "Could not sync solution."

        };

    }

}


// ============================================
// MESSAGE HANDLER
// ============================================

chrome.runtime.onMessage.addListener(
    (
        message,
        sender,
        sendResponse
    ) => {

        // ====================================
        // CONNECT GITHUB
        // ====================================

        if (
            message.type ===
            "CONNECT_GITHUB"
        ) {

            connectGitHub(
                message.token
            )
            .then(
                sendResponse
            )
            .catch(
                error => {

                    console.error(
                        error
                    );


                    sendResponse({

                        success:
                            false,

                        message:
                            "Unexpected GitHub error."

                    });

                }
            );


            return true;

        }


        // ====================================
        // DISCONNECT GITHUB
        // ====================================

        if (
            message.type ===
            "DISCONNECT_GITHUB"
        ) {

            disconnectGitHub()
                .then(
                    sendResponse
                );


            return true;

        }


        // ====================================
        // GET GITHUB STATUS
        // ====================================

        if (
            message.type ===
            "GET_GITHUB_STATUS"
        ) {

            chrome.storage.local.get([

                "githubConnected",

                "githubUsername",

                "githubRepository"

            ])
            .then(
                data => {

                    sendResponse({

                        success:
                            true,

                        connected:
                            data.githubConnected === true,

                        username:
                            data.githubUsername ||
                            null,

                        repository:
                            data.githubRepository ||
                            null

                    });

                }
            );


            return true;

        }


        // ====================================
        // EXTRACT EDITOR DATA
        // ====================================

        if (
            message.type ===
            "EXTRACT_EDITOR_DATA"
        ) {

            if (
                !sender.tab ||
                !sender.tab.id
            ) {

                sendResponse({

                    success:
                        false,

                    message:
                        "No LeetCode tab found."

                });


                return true;

            }


            extractEditorData(
                sender.tab.id
            )
            .then(
                sendResponse
            )
            .catch(
                error => {

                    console.error(
                        error
                    );


                    sendResponse({

                        success:
                            false,

                        message:
                            error.message

                    });

                }
            );


            return true;

        }


        // ====================================
        // SYNC SOLUTION
        // ====================================

        if (
            message.type ===
            "SYNC_SOLUTION"
        ) {

            syncSolution()
                .then(
                    sendResponse
                )
                .catch(
                    error => {

                        console.error(
                            error
                        );


                        sendResponse({

                            success:
                                false,

                            message:
                                "Unexpected sync error."

                        });

                    }
                );


            return true;

        }

    }
);