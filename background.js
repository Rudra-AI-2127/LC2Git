// ============================================
// LC2Git - Background Service Worker
// ============================================


// ============================================
// GITHUB CONFIGURATION
// ============================================

const GITHUB_API =
    "https://api.github.com";

const DEFAULT_REPOSITORY =
    "Rudra-AI-2127/leetcode-solutions";

// ============================================
// SHOW BROWSER NOTIFICATION
// ============================================

function showNotification(title, message) {

    try {

        chrome.notifications.create({

            type: "basic",

            iconUrl: "icon128.png",

            title: title,

            message: message

        });

    } catch (error) {

        console.error(
            "LC2Git: Notification failed:",
            error
        );

    }

}



// ============================================
// GET GITHUB TOKEN
// ============================================

async function getGitHubToken() {

    const data =
        await chrome.storage.local.get(
            ["githubToken"]
        );

    return data.githubToken || null;
}


// ============================================
// GITHUB API REQUEST
// ============================================

async function githubRequest(
    endpoint,
    options = {}
) {

    const token =
        await getGitHubToken();


    if (!token) {

        throw new Error(
            "GitHub token not found."
        );

    }


    const response =
        await fetch(
            `${GITHUB_API}${endpoint}`,
            {

                ...options,

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Accept":
                        "application/vnd.github+json",

                    "Content-Type":
                        "application/json",

                    "X-GitHub-Api-Version":
                        "2022-11-28",

                    ...(options.headers || {})

                }

            }
        );


    const text =
        await response.text();


    let data = null;


    try {

        data =
            text
                ? JSON.parse(text)
                : null;

    } catch {

        data = text;

    }


    if (!response.ok) {

        throw new Error(

            data?.message ||
            `GitHub API error: ${response.status}`

        );

    }


    return {

        response,
        data

    };

}


// ============================================
// CONNECT GITHUB
// ============================================

async function connectGitHub(token) {

    try {

        const result =
            await githubRequest(
                "/user"
            );


        const username =
            result.data.login;


        await chrome.storage.local.set({

            githubToken:
                token,

            githubConnected:
                true,

            githubUsername:
                username,

            githubRepository:
                DEFAULT_REPOSITORY

        });


        console.log(
            "LC2Git: GitHub connected as",
            username
        );


        return {

            success:
                true,

            username:
                username,

            repository:
                DEFAULT_REPOSITORY

        };

    } catch (error) {

        console.error(
            "LC2Git: GitHub connection failed:",
            error
        );


        return {

            success:
                false,

            message:
                error.message

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


    console.log(
        "LC2Git: GitHub disconnected."
    );


    return {

        success:
            true

    };

}


// ============================================
// EXTRACT EDITOR DATA
// ============================================

async function extractEditorData(
    tabId
) {

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

                    // ============================================
                    // CHECK MONACO
                    // ============================================

                    if (
                        typeof monaco ===
                        "undefined"
                    ) {

                        return {

                            success:
                                false,

                            message:
                                "Monaco editor not found."

                        };

                    }


                    // ============================================
                    // GET MONACO MODELS
                    // ============================================

                    const models =
                        monaco
                            .editor
                            .getModels();


                    if (
                        !models ||
                        models.length === 0
                    ) {

                        return {

                            success:
                                false,

                            message:
                                "No Monaco editor models found."

                        };

                    }


                    // ============================================
                    // FIND CODE MODEL
                    // ============================================

                    let selectedModel =
                        null;


                    for (
                        const model of models
                    ) {

                        const value =
                            model.getValue();


                        if (
                            value &&
                            value.trim().length > 0
                        ) {

                            selectedModel =
                                model;

                            break;

                        }

                    }


                    if (!selectedModel) {

                        return {

                            success:
                                false,

                            message:
                                "No code found in Monaco editor."

                        };

                    }


                    // ============================================
                    // GET CODE
                    // ============================================

                    const code =
                        selectedModel.getValue();


                    // ============================================
                    // DETECT LANGUAGE
                    // ============================================

                    let language =
                        selectedModel
                            .getLanguageId();


                    if (
                        !language ||
                        language === "plaintext"
                    ) {

                        language =
                            "unknown";

                    }


                    return {

                        success:
                            true,

                        code:
                            code,

                        language:
                            language

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
                    "Could not extract editor data."

            };

        }


        return results[0].result;

    } catch (error) {

        console.error(
            "LC2Git: Editor extraction failed:",
            error
        );


        return {

            success:
                false,

            message:
                error.message

        };

    }

}
// ============================================
// GET FILE EXTENSION
// ============================================

function getFileExtension(language) {

    const lang =
        String(
            language || ""
        ).toLowerCase();


    const extensions = {

        javascript:
            "js",

        typescript:
            "ts",

        python:
            "py",

        java:
            "java",

        cpp:
            "cpp",

        c:
            "c",

        csharp:
            "cs",

        "c++":
            "cpp",

        "c#":
            "cs",

        go:
            "go",

        rust:
            "rs",

        kotlin:
            "kt",

        swift:
            "swift",

        php:
            "php",

        ruby:
            "rb",

        scala:
            "scala",

        dart:
            "dart",

        sql:
            "sql",

        bash:
            "sh",

        shell:
            "sh",

        plaintext:
            "txt"

    };


    return (
        extensions[lang] ||
        "txt"
    );

}


// ============================================
// GET LEETCODE PROBLEM METADATA
// ============================================

async function getLeetCodeProblemMetadata(
    slug
) {

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


    try {

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

            throw new Error(
                `LeetCode API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        const question =
            data?.data?.question;


        if (!question) {

            throw new Error(
                "LeetCode problem metadata not found."
            );

        }


        const number =
            Number(
                question.questionFrontendId
            );


        const topics =
            Array.isArray(
                question.topicTags
            )
                ? question.topicTags.map(
                    topic =>
                        topic.name
                )
                : [];


        return {

            number:
                number,

            topics:
                topics

        };

    } catch (error) {

        console.error(
            "LC2Git: Failed to get LeetCode metadata:",
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
// GET TOPIC FOLDER
// ============================================

function getTopicFolderFromTopics(
    topics
) {

    const topicSet =
        new Set(
            topics.map(
                topic =>
                    String(topic)
                        .toLowerCase()
            )
        );


    // ============================================
    // ARRAYS
    // ============================================

    if (
        topicSet.has("array")
    ) {

        return "Arrays";

    }


    // ============================================
    // LINKED LIST
    // ============================================

    if (
        topicSet.has("linked list")
    ) {

        return "Linked-List";

    }


    // ============================================
    // TREES
    // ============================================

    if (
        topicSet.has("tree") ||
        topicSet.has("binary tree") ||
        topicSet.has("binary search tree")
    ) {

        return "Trees";

    }


    // ============================================
    // GRAPHS
    // ============================================

    if (
        topicSet.has("graph")
    ) {

        return "Graphs";

    }


    // ============================================
    // DYNAMIC PROGRAMMING
    // ============================================

    if (
        topicSet.has("dynamic programming")
    ) {

        return "Dynamic-Programming";

    }


    // ============================================
    // BACKTRACKING
    // ============================================

    if (
        topicSet.has("backtracking")
    ) {

        return "Backtracking";

    }


    // ============================================
    // BINARY SEARCH
    // ============================================

    if (
        topicSet.has("binary search")
    ) {

        return "Binary-Search";

    }


    // ============================================
    // HEAP / PRIORITY QUEUE
    // ============================================

    if (
        topicSet.has("heap") ||
        topicSet.has("priority queue")
    ) {

        return "Heap-Priority-Queue";

    }


    // ============================================
    // STACK / QUEUE
    // ============================================

    if (
        topicSet.has("stack") ||
        topicSet.has("queue")
    ) {

        return "Stack-Queue";

    }


    // ============================================
    // HASH TABLE
    // ============================================

    if (
        topicSet.has("hash table")
    ) {

        return "Hash-Table";

    }


    // ============================================
    // GREEDY
    // ============================================

    if (
        topicSet.has("greedy")
    ) {

        return "Greedy";

    }


    // ============================================
    // STRING
    // ============================================

    if (
        topicSet.has("string")
    ) {

        return "String";

    }


    // ============================================
    // MATH
    // ============================================

    if (
        topicSet.has("math")
    ) {

        return "Math";

    }


    // ============================================
    // DEFAULT
    // ============================================

    return "Other";

}


// ============================================
// CREATE FILE NAME
// ============================================

function createFileName(problem) {

    const number =
        String(
            problem.number
        ).padStart(
            4,
            "0"
        );


    const slug =
        String(
            problem.slug || "solution"
        )
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    return `${number}-${slug}`;

}


// ============================================
// BASE64 ENCODE
// ============================================

function encodeBase64(text) {

    const bytes =
        new TextEncoder()
            .encode(text);


    let binary = "";

    for (
        const byte of bytes
    ) {

        binary +=
            String.fromCharCode(
                byte
            );

    }


    return btoa(binary);

}


// ============================================
// BASE64 DECODE
// ============================================

function decodeBase64(base64) {

    try {

        const binary =
            atob(base64);


        const bytes =
            Uint8Array.from(
                binary,
                char =>
                    char.charCodeAt(0)
            );


        return new TextDecoder()
            .decode(bytes);

    } catch (error) {

        console.error(
            "LC2Git: Base64 decode failed:",
            error
        );


        return "";

    }

}


// ============================================
// GET EXISTING GITHUB FILE
// ============================================

async function getExistingFile(
    path
) {

    try {

        const connection =
            await chrome.storage.local.get(
                [
                    "githubRepository"
                ]
            );


        const repository =
            connection.githubRepository ||
            DEFAULT_REPOSITORY;


        const result =
            await githubRequest(
                `/repos/${repository}/contents/${encodeURIComponent(path)}`
            );


        return result.data;

    } catch (error) {

        if (
            error.message.includes(
                "Not Found"
            )
        ) {

            return null;

        }


        console.error(
            "LC2Git: Failed to check existing file:",
            error
        );


        return null;

    }

}


// ============================================
// SYNC SOLUTION
// ============================================

async function syncSolution(
    problem,
    code,
    language
) {

    try {

        // ============================================
        // GET CONNECTION STATE
        // ============================================

        const connection =
            await chrome.storage.local.get(
                [
                    "githubConnected",
                    "githubRepository",
                    "accepted"
                ]
            );


        if (
            connection.githubConnected !==
            true
        ) {

            return {

                success:
                    false,

                message:
                    "GitHub is not connected."

            };

        }


        if (
            connection.accepted !==
            true
        ) {

            return {

                success:
                    false,

                message:
                    "Solution has not been accepted."

            };

        }


        if (
            !problem ||
            !code
        ) {

            return {

                success:
                    false,

                message:
                    "Problem or solution code is missing."

            };

        }


        // ============================================
        // GET LEETCODE METADATA
        // ============================================

        const metadata =
            await getLeetCodeProblemMetadata(
                problem.slug
            );


        const topics =
            metadata.topics;


        // ============================================
        // USE CANONICAL PROBLEM NUMBER
        // ============================================

        if (
            metadata.number
        ) {

            problem.number =
                metadata.number;

        }


        console.log(
            "LC2Git: LeetCode problem number:",
            problem.number
        );


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
            topics
        );


        // ============================================
        // GET FOLDER
        // ============================================

        const folder =
            getTopicFolderFromTopics(
                topics
            );


        console.log(
            "LC2Git: Folder:",
            folder
        );


        // ============================================
        // GET FILE EXTENSION
        // ============================================

        const extension =
            getFileExtension(
                language
            );


        // ============================================
        // CREATE FILE NAME
        // ============================================

        const fileName =
            createFileName(
                problem
            );


        // ============================================
        // CREATE GITHUB PATH
        // ============================================

        const path =
            `${folder}/${fileName}.${extension}`;


        console.log(
            "LC2Git: GitHub path:",
            path
        );


        // ============================================
        // GET EXISTING FILE
        // ============================================

        const existingFile =
            await getExistingFile(
                path
            );


        // ============================================
        // DUPLICATE PROTECTION
        // ============================================

        if (
            existingFile &&
            existingFile.content
        ) {

            const existingCode =
                decodeBase64(
                    existingFile.content
                        .replace(
                            /\n/g,
                            ""
                        )
                );


            if (
                existingCode ===
                code
            ) {

                console.log(
                    "LC2Git: Solution already exists on GitHub."
                );


                showNotification(
                    "LC2Git",
                    `${problem.title} is already synced to GitHub.`
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


        // ============================================
        // GET REPOSITORY
        // ============================================

        const repository =
            connection.githubRepository ||
            DEFAULT_REPOSITORY;


        // ============================================
        // CREATE COMMIT MESSAGE
        // ============================================

        const commitMessage =
            `feat: add ${problem.number}. ${problem.title}`;


        // ============================================
        // PREPARE GITHUB REQUEST
        // ============================================

        const requestBody = {

            message:
                commitMessage,

            content:
                encodeBase64(code)

        };


        // ============================================
        // UPDATE EXISTING FILE
        // ============================================

        if (
            existingFile &&
            existingFile.sha
        ) {

            requestBody.sha =
                existingFile.sha;

        }


        // ============================================
        // PUSH TO GITHUB
        // ============================================

        const result =
            await githubRequest(
                `/repos/${repository}/contents/${encodeURIComponent(path)}`,
                {

                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            requestBody
                        )

                }
            );


        // ============================================
        // UPDATE LOCAL STATISTICS
        // ============================================

        const stats =
            await chrome.storage.local.get([
                "syncedCount",
                "commitCount",
                "syncHistory"
            ]);


        const syncedCount =
            Number(
                stats.syncedCount || 0
            ) + 1;


        const commitCount =
            Number(
                stats.commitCount || 0
            ) + 1;


        // ============================================
        // CREATE SYNC HISTORY ENTRY
        // ============================================

        const historyEntry = {

            problem:
                problem.title,

            number:
                problem.number,

            language:
                language,

            folder:

                folder,

            path:
                path,

            commitSha:
                result.data?.commit?.sha ||
                null,

            timestamp:
                new Date().toISOString()

        };


        // ============================================
        // GET EXISTING HISTORY
        // ============================================

        const syncHistory =
            Array.isArray(
                stats.syncHistory
            )
                ? stats.syncHistory
                : [];


        // ============================================
        // ADD NEW ENTRY TO FRONT
        // ============================================

        syncHistory.unshift(
            historyEntry
        );


        // ============================================
        // KEEP LAST 20 SYNCS
        // ============================================

        const limitedHistory =
            syncHistory.slice(
                0,
                20
            );


        // ============================================
        // SAVE STATISTICS + HISTORY
        // ============================================

        await chrome.storage.local.set({

            syncedCount:
                syncedCount,

            commitCount:
                commitCount,

            syncHistory:
                limitedHistory

        });


        // ============================================
        // SUCCESS
        // ============================================

        console.log(
            "🎉 LC2Git: Solution synced to GitHub!"
        );


        showNotification(
            "LC2Git — Solution synced",
            `${problem.title} was synced to GitHub.`
        );


        console.log(
            "LC2Git: GitHub path:",
            path
        );


        console.log(
            "LC2Git: Commit SHA:",
            result.data?.commit?.sha
        );


        console.log(
            "LC2Git: Sync history saved."
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
            "LC2Git: Sync failed:",
            error
        );


        showNotification(
            "LC2Git — Sync failed",
            error.message || "Unable to sync solution to GitHub."
        );


        return {

            success:
                false,

            message:
                error.message

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

        // ============================================
        // CONNECT GITHUB
        // ============================================

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


        // ============================================
        // DISCONNECT GITHUB
        // ============================================

        if (
            message.type ===
            "DISCONNECT_GITHUB"
        ) {

            disconnectGitHub()
                .then(
                    sendResponse
                )
                .catch(
                    error => {

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


        // ============================================
        // GET GITHUB STATUS
        // ============================================

        if (
            message.type ===
            "GET_GITHUB_STATUS"
        ) {

            chrome.storage.local
                .get([
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
                                data.githubConnected ===
                                true,

                            username:
                                data.githubUsername ||
                                null,

                            repository:
                                data.githubRepository ||
                                DEFAULT_REPOSITORY

                        });

                    }
                )
                .catch(
                    error => {

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


        // ============================================
        // EXTRACT EDITOR DATA
        // ============================================

        if (
            message.type ===
            "EXTRACT_EDITOR_DATA"
        ) {

            const tabId =
                sender.tab?.id;


            if (!tabId) {

                sendResponse({

                    success:
                        false,

                    message:
                        "Tab ID not available."

                });


                return false;

            }


            extractEditorData(
                tabId
            )
                .then(
                    sendResponse
                )
                .catch(
                    error => {

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


        // ============================================
        // SHOW NOTIFICATION
        // ============================================

        if (
            message.type ===
            "SHOW_NOTIFICATION"
        ) {

            console.log(
                "LC2Git: SHOW_NOTIFICATION received:",
                message
            );

            showNotification(
                message.title ||
                    "LC2Git",

                message.message ||
                    ""
            );

            console.log(
                "LC2Git: showNotification() called."
            );

            sendResponse({
                success:
                    true
            });

            return false;
        }


        // ============================================
        // SYNC SOLUTION
        // ============================================

        if (
            message.type ===
            "SYNC_SOLUTION"
        ) {

            chrome.storage.local.get(
                [
                    "currentProblem",
                    "code",
                    "language"
                ]
            )
                .then(
                    async (storedData) => {

                        const problem =
                            message.problem ||
                            storedData.currentProblem;


                        const code =
                            message.code ||
                            storedData.code;


                        const language =
                            message.language ||
                            storedData.language;


                        console.log(
                            "LC2Git: Preparing solution sync..."
                        );


                        console.log(
                            "LC2Git: Problem:",
                            problem
                        );


                        console.log(
                            "LC2Git: Language:",
                            language
                        );


                        console.log(
                            "LC2Git: Code available:",
                            !!code
                        );


                        const result =
                            await syncSolution(
                                problem,
                                code,
                                language
                            );


                        sendResponse(
                            result
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "LC2Git: Sync message failed:",
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


        // ============================================
        // UNKNOWN MESSAGE
        // ============================================

        sendResponse({

            success:
                false,

            message:
                "Unknown message type."

        });


        return false;

    }
);


// ============================================
// SERVICE WORKER STARTED
// ============================================

console.log(
    "🚀 LC2Git background service worker started."
);