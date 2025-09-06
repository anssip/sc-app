import { Firestore } from "firebase-admin/firestore";
interface ProcessChatOptions {
    message: string;
    userId: string;
    sessionId: string;
    chartContext?: any;
    db: Firestore;
    onStream: (chunk: string) => void;
    onToolCall: (toolCall: any) => Promise<void>;
}
export declare function processChat({ message, userId, sessionId, chartContext, db, onStream, onToolCall, }: ProcessChatOptions): Promise<string>;
export {};
//# sourceMappingURL=openai-service.d.ts.map