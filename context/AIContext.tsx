import React, { createContext, useContext, useState, useRef, useMemo, useEffect } from 'react';
import { 
    AIEvent, AIModelConfig, AIUserProfile, AIAgent, AITask, TokenAccount, TransactionRecord, AILogEntry, TokenRail 
} from '../types';
import * as geminiService from '../services/geminiService';

// --- Types needed for the Context ---
// We replicate the exact structure the AIChatInterface expects
interface AIContextType {
    modelManager: any;
    personalizationEngine: any;
    universalInterfaceCoordinator: any;
    generativeContentStudio: any;
    cognitiveArchitect: any;
    agentOrchestrator: any;
    globalKnowledgeGraph: any;
    simulationEngine: any;
    aiHealthMonitor: any;
    aiEventLogger: any;
    tokenRailSimulator: any;
    paymentsEngine: any;
    currentEmotionalState: string;
    activeModels: AIModelConfig[];
    registeredAgents: AIAgent[];
    userProfile: AIUserProfile;
    userId: string;
    sessionId: string;
    ai: any; // Self reference if needed
    currentView?: string;
}

const AIContext = createContext<AIContextType | null>(null);

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const userId = "user_alpha_01";
    const sessionId = `session_${Date.now()}`;
    const [emotionalState, setEmotionalState] = useState<string>("curious_and_attentive");
    
    // --- Mock Data & State ---
    const [userProfile, setUserProfile] = useState<AIUserProfile>({
        userId,
        accountId: "acc_882910",
        role: "admin",
        status: "active",
        preferences: { language: "English", verbosity: "medium", theme: "dark" },
        learningStyles: "visual_interactive",
        expertiseLevels: { coding: 8, system_architecture: 7 },
        securityCredentials: { level: 5, mfaEnabled: true, tokenLifetime: 3600 }
    });

    const [agents, setAgents] = useState<AIAgent[]>([
        { id: 'agent_data_01', name: 'DataAnalyst-Alpha', persona: 'Analytical & Precise', role: 'analyst', status: 'idle', capabilities: ['data_mining', 'pattern_recognition'], assignedTasks: [], currentGoal: 'Standby', memoryCapacity: 'high', learningRate: 'high', ethicalGuidelines: 'strict', securityClearance: 'level_3', resourceAllocation: {}, version: '2.1', lastOnline: Date.now(), isAutonomous: true, trustScore: 98 },
        { id: 'agent_design_02', name: 'CreativeSynth-Beta', persona: 'Imaginative & Bold', role: 'creator', status: 'idle', capabilities: ['ui_design', 'asset_generation'], assignedTasks: [], currentGoal: 'Standby', memoryCapacity: 'medium', learningRate: 'extreme', ethicalGuidelines: 'standard', securityClearance: 'level_2', resourceAllocation: {}, version: '1.4', lastOnline: Date.now(), isAutonomous: true, trustScore: 85 }
    ]);
    
    const [logs, setLogs] = useState<AILogEntry[]>([]);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [tasks, setTasks] = useState<AITask[]>([]);
    const subscribers = useRef<((event: AIEvent) => void)[]>([]);

    // --- Sub-Systems Implementations ---

    const aiEventLogger = useMemo(() => ({
        logEvent: (event: AIEvent) => {
            const entry: AILogEntry = { ...event, id: event.id || `evt_${Date.now()}_${Math.random()}` };
            setLogs(prev => [...prev, entry]);
            subscribers.current.forEach(cb => cb(event));
        },
        subscribeToEvents: (callback: (event: AIEvent) => void) => {
            subscribers.current.push(callback);
            return () => {
                subscribers.current = subscribers.current.filter(cb => cb !== callback);
            };
        },
        getAllLogs: () => logs,
        checkLogIntegrity: async () => ({ isTamperEvident: false, details: "Hash chain verified." })
    }), [logs]);

    const modelManager = useMemo(() => ({
        getAllModels: () => [
            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', version: 'Preview', type: 'LLM', provider: 'Google', capabilities: ['text_generation', 'reasoning', 'stream_generation'], status: 'active' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', version: 'Preview', type: 'LLM', provider: 'Google', capabilities: ['complex_reasoning', 'coding'], status: 'active' },
            { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image', version: '2.5', type: 'Vision', provider: 'Google', capabilities: ['image_generation', 'image_analysis'], status: 'active' }
        ],
        getActiveModel: () => ({ id: 'gemini-3-flash-preview', capabilities: ['stream_generation'] }),
        selectBestModel: (capabilities: string[]) => {
             if (capabilities.includes('sentiment_analysis')) return 'gemini-3-flash-preview';
             if (capabilities.includes('generation')) return 'gemini-3-flash-preview';
             return 'gemini-3-flash-preview';
        },
        infer: async (modelId: string, payload: any, type: string) => {
             // Basic inference simulation connecting to real Gemini
             const prompt = typeof payload === 'string' ? payload : payload.prompt;
             const text = await geminiService.generateText(prompt, modelId);
             return { output: text };
        },
        streamInfer: async function* (modelId: string, payload: any) {
            const prompt = typeof payload === 'string' ? payload : payload.prompt;
            const generator = geminiService.streamText(prompt, modelId);
            for await (const text of generator) {
                // Yield character by character to simulate token streaming visually if needed, 
                // but Gemini returns chunks. Let's yield chunks.
                yield { token: text };
            }
        },
        getModel: (id: string) => ({ id, name: id, status: 'active', capabilities: [], metadata: {}, performanceMetrics: { latency: 45, throughput: 120 } }),
        registerModel: (model: AIModelConfig) => console.log("Model registered", model)
    }), []);

    const generativeContentStudio = useMemo(() => ({
        generateImage: async (prompt: string) => {
            return await geminiService.generateImage(prompt);
        },
        generateCode: async (prompt: string, lang: string) => {
            return await geminiService.generateText(`Generate production ready ${lang} code for: ${prompt}. Only output the code.`);
        },
        designUIComponent: async (prompt: string, theme: string) => {
            const code = await geminiService.generateText(`Design a React component using Tailwind CSS for: ${prompt}. Theme: ${theme}. Return only the TSX code.`);
            return { code, previewUrl: "http://localhost:3000/preview/ui_component_x" };
        },
        generateText: async (prompt: string) => {
            return await geminiService.generateText(prompt);
        }
    }), []);

    const universalInterfaceCoordinator = useMemo(() => ({
        processInput: async (uid: string, payload: any, modality: string) => {
            if (modality === 'vision' && payload.imageBlob) {
                const analysis = await geminiService.analyzeImage(payload.imageBlob, "Describe this image in detail for a blind user.");
                return { text: `[Image Analysis]: ${analysis}`, ...payload };
            }
            if (modality === 'text') return payload;
            if (modality === 'speech') return { text: "Audio transcribed: " + (payload.text || "Hello system.") }; // Mock transcription
            return { text: `Processed ${modality} input.` };
        },
        generateOutput: async (uid: string, content: any, modality: string) => {
            if (modality === 'text') return content.text || content;
            if (modality === 'vision') {
                const url = await geminiService.generateImage(content.sourcePrompt || "Abstract visualization");
                return { imageUrl: url };
            }
            if (modality === 'speech') return { audioBlob: new Blob([''], {type: 'audio/mp3'}) }; // Mock audio
            return { text: `Output in ${modality} not fully supported, falling back to text: ${content.text || content}` };
        }
    }), []);

    const cognitiveArchitect = useMemo(() => ({
        getContext: (sid: string, depth: number) => ({ recentSummary: "User is exploring the system.", activeTopics: ["AI", "Infrastructure"] }),
        addContext: (sid: string, data: any) => console.log("Context added", data),
        reason: async (prompt: string, context: any) => {
            return await geminiService.generateText(`Reasoning Request: ${prompt}. Context: ${JSON.stringify(context)}. Provide a strategic thought process.`);
        }
    }), []);

    const personalizationEngine = useMemo(() => ({
        logInteraction: (uid: string, action: string, details: any) => console.log(`[Interaction ${uid}] ${action}`, details),
        updateUserProfile: (uid: string, updates: Partial<AIUserProfile>) => setUserProfile(prev => ({ ...prev, ...updates })),
        adaptOutput: async (uid: string, content: any, modality: string) => content,
        generateKeyPair: async (uid: string) => ({ publicKeyId: `key_${Date.now()}`, privateKey: "***" })
    }), []);

    const agentOrchestrator = useMemo(() => ({
        createTask: async (name: string, desc: string, priority: string) => {
            const newTask: AITask = { id: `task_${Date.now()}`, name, description: desc, priority: priority as any, status: 'pending', assignedAgentId: 'agent_data_01' };
            setTasks(prev => [...prev, newTask]);
            // Simulate agent picking it up
            setTimeout(() => {
                setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, status: 'completed', output: "Task executed successfully by simulated agent." } : t));
                aiEventLogger.logEvent({ type: 'agent_action', source: 'AgentOrchestrator', payload: { action: 'execute_task_completed', taskId: newTask.id }, severity: 'info', timestamp: Date.now(), id: `evt_${Date.now()}` });
            }, 3000);
            return newTask;
        },
        getAgent: (id: string) => agents.find(a => a.id === id),
        registerAgent: (agent: AIAgent) => setAgents(prev => {
            const idx = prev.findIndex(a => a.id === agent.id);
            if (idx >= 0) { const newArr = [...prev]; newArr[idx] = agent; return newArr; }
            return [...prev, agent];
        }),
        getTask: async (id: string) => tasks.find(t => t.id === id)
    }), [agents, tasks, aiEventLogger]);

    const globalKnowledgeGraph = useMemo(() => ({
        semanticSearch: async (query: string) => {
            // Mock KG search results
            return [
                { label: "Token Rail Protocol", description: "Standardized programmable value exchange layer.", confidenceScore: 0.95 },
                { label: "Autonomous Agent Swarm", description: "Coordinated group of AI agents executing complex objectives.", confidenceScore: 0.88 }
            ];
        },
        addKnowledge: (node: any) => console.log("KG Node Added", node)
    }), []);

    const paymentsEngine = useMemo(() => ({
        processPayment: async (req: any) => {
            const txId = `tx_${Date.now()}`;
            const success = Math.random() > 0.1;
            const tx: TransactionRecord = {
                id: txId, payerId: req.payerId, payeeId: req.payeeId, amount: req.amount, currency: req.currency, timestamp: Date.now(), status: success ? 'success' : 'failed',
                meta: { riskScore: Math.floor(Math.random() * 20), actualRail: 'rail_fast_v2' }
            };
            setTransactions(prev => [...prev, tx]);
            return { success, transactionId: txId, meta: tx.meta, errorMessage: success ? undefined : "Simulated network congestion" };
        }
    }), []);

    const tokenRailSimulator = useMemo(() => ({
        getAccount: async (uid: string) => ({ accountId: `acc_${uid}`, balance: 15000.50, currency: 'USD_TOKEN' }),
        getTransactions: async (uid: string) => transactions.filter(t => t.payerId === uid || t.payeeId === uid),
        mintTokens: async () => {},
        burnTokens: async () => {}
    }), [transactions]);

    const simulationEngine = useMemo(() => ({
        createScenario: (name: string, desc: string, params: any, duration: number) => ({ id: `sim_${Date.now()}`, name }),
        runScenario: async (id: string, agents: any[]) => ({ objectivesAchieved: true, safetyViolationsDetected: false })
    }), []);

    const aiHealthMonitor = useMemo(() => ({
        performHealthCheck: async () => ({ status: 'nominal' }),
        predictFailures: async () => []
    }), []);

    // --- Context Value ---
    const value: AIContextType = {
        modelManager,
        personalizationEngine,
        universalInterfaceCoordinator,
        generativeContentStudio,
        cognitiveArchitect,
        agentOrchestrator,
        globalKnowledgeGraph,
        simulationEngine,
        aiHealthMonitor,
        aiEventLogger,
        tokenRailSimulator,
        paymentsEngine,
        currentEmotionalState: emotionalState,
        activeModels: modelManager.getAllModels(),
        registeredAgents: agents,
        userProfile,
        userId,
        sessionId,
        ai: { currentView: 'chat' } // Mock self ref
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
};
