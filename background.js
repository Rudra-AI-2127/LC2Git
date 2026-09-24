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
        await chrome.storage.local.get(
            ["githubToken"]
        );

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
                    tabId: tabId
                },

                world: "MAIN",

                func: () => {

                    // ====================================
                    // MAIN WORLD
                    // ====================================

                    if (
                        typeof monaco === "undefined" ||
                        !monaco.editor
                    ) {

                        return {

                            success: false,

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

                                success: true,

                                language:
                                    language,

                                code:
                                    code

                            };

                        }

                    }


                    return {

                        success: false,

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

                success: false,

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

            success: false,

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

        java: "java",
        Java: "java",

        javascript: "js",
        JavaScript: "js",

        typescript: "ts",
        TypeScript: "ts",

        python: "py",
        Python: "py",

        cpp: "cpp",
        "C++": "cpp",

        c: "c",
        C: "c",

        csharp: "cs",
        "C#": "cs",

        go: "go",
        Go: "go",

        rust: "rs",
        Rust: "rs",

        kotlin: "kt",
        Kotlin: "kt",

        swift: "swift",
        Swift: "swift",

        php: "php",
        PHP: "php"

    };


    return (
        extensions[language] ||
        "txt"
    );

}


// ============================================
// CREATE SAFE FILE NAME
// ============================================

function createFileName(problem) {

    const number =
        String(
            problem.number || 0
        ).padStart(4, "0");


    const slug =
        (problem.slug || "solution")
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
        new TextEncoder().encode(text);


    let binary = "";


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


    return btoa(binary);

}


// ============================================
// BASE64 DECODING
// ============================================

function decodeBase64(base64) {

    const binary =
        atob(
            base64.replace(/\n/g, "")
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
// GET EXISTING FILE
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

        const connection =
            await chrome.storage.local.get([

                "githubConnected",

                "currentProblem",

                "language",

                "code",

                "accepted"

            ]);


        if (
            connection.githubConnected !== true
        ) {

            return {

                success: false,

                message:
                    "Connect GitHub first."

            };

        }


        if (
            connection.accepted !== true
        ) {

            return {

                success: false,

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


        if (
            !problem ||
            !code
        ) {

            return {

                success: false,

                message:
                    "Solution data is missing."

            };

        }


        const extension =
            getFileExtension(
                language
            );


        const fileName =
            createFileName(
                problem
            );


        const languageFolders = {
            java: "Java",
            Java: "Java",

            python: "Python",
            Python: "Python",

            cpp: "C++",
            "C++": "C++",

            c: "C",
            C: "C",

            javascript: "JavaScript",
            JavaScript: "JavaScript",

            typescript: "TypeScript",
            TypeScript: "TypeScript",

            csharp: "CSharp",
            "C#": "CSharp",

            go: "Go",
            Go: "Go",

            rust: "Rust",
            Rust: "Rust",

            kotlin: "Kotlin",
            Kotlin: "Kotlin",

            swift: "Swift",
            Swift: "Swift",

            php: "PHP",
            PHP: "PHP"
        };


        const folder =
            languageFolders[language] || "Other";


        const path =
            `${folder}/${fileName}.${extension}`;


        console.log(
            "LC2Git: GitHub path:",
            path
        );


        const existingFile =
            await getExistingFile(
                path
            );


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

                return {

                    success: true,

                    alreadySynced:
                        true,

                    message:
                        "Solution is already synced.",

                    path:
                        path

                };

            }

        }


        const body = {

            message:
                `feat: add ${problem.number}. ${problem.title}`,

            content:
                encodeBase64(code)

        };


        if (existingFile) {

            body.sha =
                existingFile.sha;

        }


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
                        JSON.stringify(body)

                }
            );


        if (!result.ok) {

            console.error(
                "LC2Git: GitHub API error:",
                result.data
            );


            return {

                success: false,

                message:
                    result.data?.message ||
                    `GitHub API error (${result.status}).`

            };

        }


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


        console.log(
            "🎉 LC2Git: Solution synced to GitHub!"
        );


        console.log(
            "LC2Git: Path:",
            path
        );


        console.log(
            "LC2Git: Commit:",
            result.data?.commit?.sha
        );


        return {

            success: true,

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

            success: false,

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
    (message, sender, sendResponse) => {

        // ------------------------------------
        // CONNECT
        // ------------------------------------

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
            .catch(error => {

                console.error(error);

                sendResponse({

                    success: false,

                    message:
                        "Unexpected GitHub error."

                });

            });


            return true;

        }


        // ------------------------------------
        // DISCONNECT
        // ------------------------------------

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


        // ------------------------------------
        // STATUS
        // ------------------------------------

        if (
            message.type ===
            "GET_GITHUB_STATUS"
        ) {

            chrome.storage.local.get([

                "githubConnected",

                "githubUsername",

                "githubRepository"

            ])
            .then(data => {

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

            });


            return true;

        }


        // ------------------------------------
        // EXTRACT EDITOR DATA
        // ------------------------------------

        if (
            message.type ===
            "EXTRACT_EDITOR_DATA"
        ) {

            if (
                !sender.tab ||
                !sender.tab.id
            ) {

                sendResponse({

                    success: false,

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
            .catch(error => {

                console.error(error);

                sendResponse({

                    success: false,

                    message:
                        error.message

                });

            });


            return true;

        }


        // ------------------------------------
        // SYNC SOLUTION
        // ------------------------------------

        if (
            message.type ===
            "SYNC_SOLUTION"
        ) {

            syncSolution()
                .then(
                    sendResponse
                )
                .catch(error => {

                    console.error(error);

                    sendResponse({

                        success:
                            false,

                        message:
                            "Unexpected sync error."

                    });

                });


            return true;

        }

    }
);