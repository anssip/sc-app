import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import dotenv from "dotenv";
// Load environment variables from .env file - force override any existing vars
dotenv.config({ override: true });
// Initialize Firebase Admin
if (getApps().length === 0) {
    initializeApp();
}
// Connect to Firestore (emulator in local dev, production in deployed environment)
const db = getFirestore();
// Log environment info
if (process.env.FUNCTIONS_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST) {
    console.log("Using Firestore emulator for chat data");
    console.log("Price data will be fetched from REST API");
}
else {
    console.log("Using production Firestore");
}
const apiKey = process.env.OPENAI_API_KEY;
console.log("API Key loaded:", apiKey ? "Yes" : "No");
if (apiKey) {
    console.log("API Key ending:", apiKey.substring(apiKey.length - 4));
}
const app = express();
// Lazy load OpenAI service to avoid initialization errors
let processChat;
const getProcessChat = async () => {
    if (!processChat) {
        const module = await import("./lib/openai-service.js");
        processChat = module.processChat;
    }
    return processChat;
};
// Configure CORS for local development and production
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // Allow localhost for development (including common Vite ports)
        if (origin.startsWith("http://localhost:") ||
            origin.startsWith("https://localhost:") ||
            origin.startsWith("http://127.0.0.1:") ||
            origin.startsWith("https://127.0.0.1:") ||
            origin.includes("spotcanvas-prod.web.app") ||
            origin.includes("spotcanvas-prod.firebaseapp.com")) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
// Configure middleware
app.use(cors(corsOptions));
app.use(express.json());
// Handle preflight requests
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);
});
// Health check endpoint
app.get("/health", (_req, res) => {
    const isEmulator = !!(process.env.FUNCTIONS_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);
    res.json({
        status: "healthy",
        service: "mcp-server",
        emulator: isEmulator,
        firestoreEmulator: process.env.FIRESTORE_EMULATOR_HOST || "not set",
        functionsEmulator: process.env.FUNCTIONS_EMULATOR_HOST || "not set",
    });
});
// Main chat endpoint
app.post("/chat", async (req, res) => {
    try {
        const { message, userId, sessionId, chartContext } = req.body;
        if (!message || !userId) {
            res.status(400).json({
                error: "Missing required fields: message and userId",
            });
            return;
        }
        // Set up SSE for streaming responses
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // Store message in chat history
        const chatRef = db
            .collection("users")
            .doc(userId)
            .collection("chat_history");
        await chatRef.add({
            role: "user",
            content: message,
            sessionId: sessionId || "default",
            timestamp: FieldValue.serverTimestamp(),
        });
        // Process with OpenAI and stream response
        let assistantContent = "";
        const commandsExecuted = [];
        const processChatFn = await getProcessChat();
        await processChatFn({
            message,
            userId,
            sessionId: sessionId || "default",
            chartContext,
            db,
            onStream: (chunk) => {
                // Send streaming chunk to client
                res.write(`data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`);
                assistantContent += chunk;
            },
            onToolCall: async (toolCall) => {
                // Write command to Firestore for chart execution
                const commandRef = db
                    .collection("users")
                    .doc(userId)
                    .collection("chart_commands");
                const commandDoc = await commandRef.add({
                    command: toolCall.function.name,
                    parameters: JSON.parse(toolCall.function.arguments),
                    timestamp: FieldValue.serverTimestamp(),
                    status: "pending",
                    sessionId: sessionId || "default",
                });
                commandsExecuted.push({
                    id: commandDoc.id,
                    command: toolCall.function.name,
                });
                // Send tool execution notification
                res.write(`data: ${JSON.stringify({
                    type: "tool_call",
                    tool: toolCall.function.name,
                    commandId: commandDoc.id,
                })}\n\n`);
            },
        });
        // Store assistant response in chat history
        await chatRef.add({
            role: "assistant",
            content: assistantContent,
            commands: commandsExecuted,
            sessionId: sessionId || "default",
            timestamp: FieldValue.serverTimestamp(),
        });
        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error("Chat processing error:", error);
        // Provide more specific error messages
        let errorMessage = "Failed to process chat";
        if (error.code === "insufficient_quota") {
            errorMessage =
                "OpenAI API quota exceeded. Please check your billing or try again later.";
        }
        else if (error.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again in a moment.";
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        // For SSE, send error as event
        if (!res.headersSent) {
            res.status(500).json({ error: errorMessage });
        }
        else {
            res.write(`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`);
            res.end();
        }
    }
});
// Get chat history endpoint
app.get("/chat/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { sessionId = "default", limit = "50" } = req.query;
        const chatHistory = await db
            .collection("users")
            .doc(userId)
            .collection("chat_history")
            .where("sessionId", "==", sessionId)
            .orderBy("timestamp", "desc")
            .limit(parseInt(limit))
            .get();
        const messages = chatHistory.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
        }));
        res.json({ messages: messages.reverse() });
    }
    catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});
// Clear chat history endpoint
app.delete("/chat/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { sessionId = "default" } = req.body;
        const batch = db.batch();
        const chatHistory = await db
            .collection("users")
            .doc(userId)
            .collection("chat_history")
            .where("sessionId", "==", sessionId)
            .get();
        chatHistory.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        res.json({ success: true, deleted: chatHistory.size });
    }
    catch (error) {
        console.error("Error clearing chat history:", error);
        res.status(500).json({ error: "Failed to clear chat history" });
    }
});
// Export as Firebase Function
export const mcpServer = onRequest({
    memory: "1GiB",
    timeoutSeconds: 300, // 5 minutes for streaming
    maxInstances: 100,
    region: "us-central1",
    // Removed secrets config to use .env file for local dev
}, app);
//# sourceMappingURL=mcp-server.js.map