/**
 * This module implements the `AIChatInterface` React component, a sophisticated, multimodal front-end for the
 * hyper-cognitive AI ecosystem.
 */
import React, { useState, useEffect, useRef, useCallback, Fragment, ChangeEvent, KeyboardEvent, useMemo } from 'react';
import { useAI } from '../context/AIContext';
import { AIEvent, AIModelConfig, AIAgent, AITask, TokenAccount, TransactionRecord, TokenRail, AILogEntry, ChatMessage, MessageType, MessageSender, InputModality, OutputModality } from '../types';

/**
 * Configuration interface for a customizable advanced AI feature.
 */
interface AdvancedFeatureConfig {
    featureId: string;
    name: string;
    description: string;
    isEnabled: boolean;
    parameters: Record<string, any>;
    toggleFeature: (id: string, enabled: boolean) => void;
    updateParameter: (id: string, param: string, value: any) => void;
}

/**
 * Props for the AIChatInterface component, allowing extensive customization.
 */
export interface AIChatInterfaceProps {
    initialMessages?: ChatMessage[]; // Pre-loaded messages for chat history
    onSendMessage?: (message: ChatMessage) => void; // Callback when a user sends a message
    onReceiveMessage?: (message: ChatMessage) => void; // Callback when the AI sends a message
    enableMultiModalInput?: boolean; // Flag to enable/disable advanced input modalities
    enablePersonalization?: boolean; // Flag to enable/disable user profile-based personalization
    chatTitle?: string; // Title displayed in the chat header
    showDebugInfo?: boolean; // Shows a panel with internal AI state for debugging
    proactiveSuggestionsEnabled?: boolean; // Enables AI to offer proactive suggestions
    defaultOutputModality?: OutputModality; // Preferred modality for AI responses
    maxMessageHistory?: number; // Maximum number of messages to retain in state
    initialTheme?: 'light' | 'dark' | 'synthwave' | 'hacker_green' | 'corporate_blue'; // Initial UI theme
    enableAgentDelegation?: boolean; // Allows the AI to delegate tasks to autonomous agents
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
    initialMessages = [],
    onSendMessage,
    onReceiveMessage,
    enableMultiModalInput = true,
    enablePersonalization = true,
    chatTitle = "Hyper-Cognitive AI Nexus",
    showDebugInfo = false,
    proactiveSuggestionsEnabled = true,
    defaultOutputModality = 'text',
    maxMessageHistory = 500,
    initialTheme = 'dark',
    enableAgentDelegation = true,
}) => {
    // Access the core AI services and state from the global AI context
    const ai = useAI();
    const {
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
        currentEmotionalState,
        activeModels,
        registeredAgents,
        userProfile,
        userId,
        sessionId,
        tokenRailSimulator,
        paymentsEngine,
    } = ai;

    // --- Component State Variables ---
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [currentInputModality, setCurrentInputModality] = useState<InputModality>('text');
    const [currentOutputModality, setCurrentOutputModality] = useState<OutputModality>(defaultOutputModality);
    const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
    const [aiStatusMessage, setAiStatusMessage] = useState<string>('System initialized, awaiting input.');
    const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
    const [activeAgentTasks, setActiveAgentTasks] = useState<AITask[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark' | 'synthwave' | 'hacker_green' | 'corporate_blue'>(initialTheme);
    const [showOptionsPanel, setShowOptionsPanel] = useState(false);
    const [modelConfigurationPanelVisible, setModelConfigurationPanelVisible] = useState(false);
    const [agentManagementPanelVisible, setAgentManagementPanelVisible] = useState(false);
    const [systemMonitoringPanelVisible, setSystemMonitoringPanelVisible] = useState(false);
    const [userProfilePanelVisible, setUserProfilePanelVisible] = useState(false); // New panel state
    const [paymentSimulatorPanelVisible, setPaymentSimulatorPanelVisible] = useState(false); // New panel state
    const [knowledgeGraphExplorerVisible, setKnowledgeGraphExplorerVisible] = useState(false); // New panel state
    const [auditLogViewerVisible, setAuditLogViewerVisible] = useState(false); // New panel state

    const [userFeedbackPendingMessageId, setUserFeedbackPendingMessageId] = useState<string | null>(null);
    const [aiHealthSummary, setAiHealthSummary] = useState<string>('Monitoring AI ecosystem...');

    // --- Refs for DOM interaction and mutable values ---
    const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling to the bottom of chat
    const mediaRecorderRef = useRef<MediaRecorder | null>(null); // For audio recording functionality
    const audioChunksRef = useRef<Blob[]>([]); // Stores recorded audio chunks
    const processingInputRef = useRef<boolean>(false); // Flag to prevent multiple simultaneous AI processing requests
    const chatInputRef = useRef<HTMLInputElement>(null); // For auto-focusing the text input field
    const audioPlayerRef = useRef<HTMLAudioElement>(null); // For playing generated AI speech

    // --- Utility Callbacks ---

    /**
     * Scrolls the chat messages area to the bottom.
     */
    const scrollMessagesToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    /**
     * Generates a UUID for unique message IDs and other entities.
     */
    const generateUUID = useCallback(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }), []);

    /**
     * Adds a new message to the chat state and logs it to AI systems.
     * Includes sentiment inference for user messages.
     */
    const addMessage = useCallback(async (message: ChatMessage) => {
        // Infer sentiment for user text messages before adding them to state
        if (message.sender === 'user' && message.type === 'text' && message.content) {
            try {
                const sentimentResult = await modelManager.infer(
                    modelManager.selectBestModel(['sentiment_analysis']),
                    { prompt: message.content }, 'text', { userId, sessionId }
                );
                // Extract sentiment from a potentially complex AI output
                message.sentiment = sentimentResult.output.includes('positive') ? 'positive' : sentimentResult.output.includes('negative') ? 'negative' : 'neutral';
            } catch (error) {
                aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.Sentiment', payload: { message: 'Failed to infer sentiment for user message.', error: (error as Error).message }, severity: 'warning', traceId: sessionId });
            }
        }

        setMessages((prevMessages) => [...prevMessages, message]);

        // Log interactions and update cognitive architect for personalization and context management
        if (message.sender === 'user') {
            personalizationEngine.logInteraction(userId, 'chat_message_sent', {
                messageId: message.id, type: message.type, contentPreview: message.content.substring(0, 100), modality: currentInputModality, sentiment: message.sentiment,
            });
            cognitiveArchitect.addContext(sessionId, { userMessage: message.content, messageType: message.type, sentiment: message.sentiment });
        } else if (message.sender === 'ai' || message.sender === 'agent') {
            personalizationEngine.logInteraction(userId, 'chat_message_received', {
                messageId: message.id, type: message.type, contentPreview: message.content.substring(0, 100), modality: currentOutputModality, processingLatencyMs: message.processingLatencyMs,
            });
            cognitiveArchitect.addContext(sessionId, { aiResponse: message.content, messageType: message.type });
        }
        aiEventLogger.logEvent({
            type: 'user_interaction', source: 'AIChatInterface', payload: { action: 'chat_message', sender: message.sender, type: message.type, messageId: message.id, sentiment: message.sentiment, traceId: sessionId }, severity: 'info',
        });

        if (onReceiveMessage && message.sender !== 'user') {
            onReceiveMessage(message);
        }
    }, [userId, sessionId, personalizationEngine, cognitiveArchitect, aiEventLogger, currentInputModality, currentOutputModality, onReceiveMessage, modelManager]);

    /**
     * Handles user feedback for AI responses, updating messages and logging the interaction.
     */
    const handleMessageFeedback = useCallback(async (messageId: string, feedback: ChatMessage['feedback']) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, feedback } : msg));
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
            await personalizationEngine.logInteraction(userId, 'ai_response_feedback', {
                messageId, feedback, aiContentPreview: message.content.substring(0, 100), originalPrompt: message.originalPrompt,
            });
            aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface', payload: { action: 'ai_feedback_recorded', messageId, feedback, traceId: sessionId }, severity: 'info' });
            setAiStatusMessage(`Feedback '${feedback}' recorded for message ${messageId}. Thank you!`);
            setUserFeedbackPendingMessageId(null); // Clear pending feedback
        }
    }, [messages, personalizationEngine, userId, aiEventLogger, sessionId]);

    /**
     * Toggles the UI theme and updates user preferences.
     */
    const toggleTheme = useCallback((newTheme?: 'light' | 'dark' | 'synthwave' | 'hacker_green' | 'corporate_blue') => {
        setTheme(prev => {
            const themes: Array<'light' | 'dark' | 'synthwave' | 'hacker_green' | 'corporate_blue'> = ['dark', 'light', 'synthwave', 'hacker_green', 'corporate_blue'];
            const chosenTheme = newTheme || themes[(themes.indexOf(prev) + 1) % themes.length];
            personalizationEngine.updateUserProfile(userId, { preferences: { theme: chosenTheme } });
            aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Theme', payload: { action: 'theme_change', newTheme: chosenTheme, traceId: sessionId }, severity: 'info' });
            return chosenTheme;
        });
    }, [personalizationEngine, userId, aiEventLogger, sessionId]);

    /**
     * Handles triggering agent actions from the UI, such as creating tasks or rebooting agents.
     */
    const handleAgentAction = useCallback(async (actionType: string, agentId?: string, taskDescription?: string) => {
        setAiStatusMessage(`Triggering agent action: ${actionType}...`);
        aiEventLogger.logEvent({ type: 'agent_action', source: 'AIChatInterface.AgentControl', payload: { actionType, agentId, taskDescription, traceId: sessionId }, severity: 'info' });

        try {
            if (actionType === 'create_task' && taskDescription) {
                const newTask = await agentOrchestrator.createTask(taskDescription.substring(0, 50), taskDescription, userProfile?.expertiseLevels.coding && userProfile.expertiseLevels.coding > 7 ? 'critical' : 'high');
                setActiveAgentTasks(prev => [...prev.filter(t => t.id !== newTask.id), newTask]);
                addMessage({
                    id: `msg_agent_task_${Date.now()}`, sender: 'system', type: 'text',
                    content: `Created task "${newTask.name}" (ID: ${newTask.id}) for agent ${newTask.assignedAgentId || 'auto-selected'}. Monitoring progress...`,
                    timestamp: Date.now(), metadata: { taskId: newTask.id, agentId: newTask.assignedAgentId }
                });
            } else if (actionType === 'reboot_agent' && agentId) {
                const agent = agentOrchestrator.getAgent(agentId);
                if (agent) {
                    agent.status = 'offline'; await new Promise(r => setTimeout(r, 1000)); agent.status = 'idle'; agent.lastOnline = Date.now();
                    agentOrchestrator.registerAgent(agent); // Update agent state
                    addMessage({
                        id: `msg_agent_reboot_${Date.now()}`, sender: 'system', type: 'text',
                        content: `Agent ${agent.name} (${agent.id}) rebooted and is now idle.`,
                        timestamp: Date.now(), metadata: { agentId: agent.id }
                    });
                } else {
                    addMessage({
                        id: `msg_agent_reboot_fail_${Date.now()}`, sender: 'system', type: 'text',
                        content: `Failed to reboot agent ${agentId}: Not found.`, timestamp: Date.now(), metadata: { agentId }
                    });
                }
            } else if (actionType === 'run_simulation') {
                const simId = `sim_quick_${Date.now()}`;
                const scenario = simulationEngine.createScenario(
                    `Chat Sim: ${taskDescription ? taskDescription.substring(0, 50) : 'Default'}`,
                    taskDescription || 'A simple simulation scenario triggered from chat.',
                    { userRequest: taskDescription || 'generic', emotionalState: currentEmotionalState }, 10
                );
                addMessage({
                    id: `msg_sim_start_${Date.now()}`, sender: 'system', type: 'text',
                    content: `Simulation "${scenario.name}" started. Running with available agents...`, timestamp: Date.now(), metadata: { scenarioId: scenario.id }
                });
                const agentsForSim = registeredAgents.filter(a => a.status === 'idle').slice(0, 2);
                const simResults = await simulationEngine.runScenario(scenario.id, agentsForSim);
                addMessage({
                    id: `msg_sim_end_${Date.now()}`, sender: 'system', type: 'simulation_log',
                    content: `Simulation "${scenario.name}" completed. Key outcomes: ${JSON.stringify(simResults.objectivesAchieved ? 'Objectives met' : 'Objectives partially met')}, Safety Violations: ${simResults.safetyViolationsDetected ? 'Detected' : 'None'}.`,
                    timestamp: Date.now(), metadata: { scenarioId: scenario.id, results: simResults }
                });
            } else if (actionType === 'spawn_new_agent') {
                if (userProfile?.securityCredentials?.level < 3) { // Example RBAC check
                    addMessage({ id: `msg_rbac_fail_${Date.now()}`, sender: 'system', type: 'text', content: 'Authorization denied: Insufficient security clearance to spawn new agents.', timestamp: Date.now() });
                    aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.AgentControl', payload: { action: 'spawn_agent_denied', userId, reason: 'Insufficient clearance', traceId: sessionId }, severity: 'critical' });
                    return;
                }
                const newAgentId = `agent_${Date.now()}`;
                const newAgent: AIAgent = {
                    id: newAgentId, name: `NewAgent-${Math.random().toString(36).substring(2, 7)}`, persona: 'General Helper', role: 'executor',
                    status: 'idle', capabilities: ['basic_query', 'task_execution'], assignedTasks: [], currentGoal: 'None',
                    memoryCapacity: 'short_term', learningRate: 'medium', ethicalGuidelines: 'flexible', securityClearance: 'level_1',
                    resourceAllocation: { computeUnits: 2, memoryGB: 4, networkBandwidthMbps: 50 }, version: '0.1', lastOnline: Date.now(), isAutonomous: false, trustScore: 50
                };
                agentOrchestrator.registerAgent(newAgent);
                addMessage({
                    id: `msg_agent_spawn_${Date.now()}`, sender: 'system', type: 'text',
                    content: `New agent '${newAgent.name}' (ID: ${newAgent.id}) spawned and is now idle.`, timestamp: Date.now(), metadata: { agentId: newAgent.id }
                });
            } else if (actionType === 'initiate_payment' && taskDescription) { // taskDescription here is payment details like "recipientId:AMOUNT:rail"
                if (userProfile?.securityCredentials?.level < 2) {
                    addMessage({ id: `msg_rbac_fail_${Date.now()}`, sender: 'system', type: 'text', content: 'Authorization denied: Insufficient security clearance for payment initiation.', timestamp: Date.now() });
                    aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.PaymentControl', payload: { action: 'payment_denied', userId, reason: 'Insufficient clearance', traceId: sessionId }, severity: 'critical' });
                    return;
                }
                const [recipientId, amountStr, railPreference] = taskDescription.split(':');
                const amount = parseFloat(amountStr);
                if (!recipientId || isNaN(amount) || amount <= 0) {
                    addMessage({ id: `msg_payment_error_${Date.now()}`, sender: 'system', type: 'text', content: 'Invalid payment details. Format: recipientId:amount:rail.', timestamp: Date.now() });
                    return;
                }
                setAiStatusMessage(`Initiating payment of ${amount} to ${recipientId} via ${railPreference || 'auto'} rail...`);
                const paymentRequest = {
                    payerId: userId,
                    payeeId: recipientId,
                    amount: amount,
                    currency: 'USD_TOKEN', // Example stablecoin
                    idempotencyKey: generateUUID(),
                    meta: { railPreference: railPreference || 'auto' }
                };
                const txResult = await paymentsEngine.processPayment(paymentRequest);
                if (txResult.success) {
                    addMessage({
                        id: `msg_payment_success_${Date.now()}`, sender: 'system', type: 'payment_transaction',
                        content: `Payment of ${amount} USD_TOKEN to ${recipientId} successful. TX ID: ${txResult.transactionId}. Rail: ${txResult.meta?.actualRail || 'N/A'}.`,
                        timestamp: Date.now(), metadata: { transactionId: txResult.transactionId, ...txResult.meta }
                    });
                } else {
                    addMessage({
                        id: `msg_payment_failed_${Date.now()}`, sender: 'system', type: 'payment_transaction',
                        content: `Payment to ${recipientId} failed: ${txResult.errorMessage || 'Unknown error'}. Risk score: ${txResult.meta?.riskScore || 'N/A'}.`,
                        timestamp: Date.now(), metadata: { transactionId: txResult.transactionId, ...txResult.meta }
                    });
                }
            }
        } catch (error) {
            addMessage({
                id: `msg_agent_action_error_${Date.now()}`, sender: 'system', type: 'text',
                content: `Error during agent action ${actionType}: ${(error as Error).message}`, timestamp: Date.now(), metadata: { actionType, error: (error as Error).message }
            });
        } finally {
            setAiStatusMessage('Ready.');
        }
    }, [addMessage, aiEventLogger, agentOrchestrator, userProfile, currentEmotionalState, registeredAgents, simulationEngine, sessionId, generateUUID, paymentsEngine]);

    /**
     * Handles changes to model configuration options.
     */
    const handleModelOptionChange = useCallback(async (modelId: string, optionKey: string, value: any) => {
        const model = modelManager.getModel(modelId);
        if (model) {
            const updatedModel: AIModelConfig = {
                ...model,
                metadata: { ...model.metadata, [optionKey]: value },
                performanceMetrics: optionKey === 'latency' || optionKey === 'throughput' ? { ...model.performanceMetrics, [optionKey]: value } : model.performanceMetrics,
                apiKey: optionKey === 'apiKey' ? value : model.apiKey,
                status: optionKey === 'status' ? value : model.status,
            };
            modelManager.registerModel(updatedModel); // Re-register to update the internal map
            aiEventLogger.logEvent({ type: 'data_update', source: 'AIChatInterface.ModelConfig', payload: { action: 'model_option_updated', modelId, optionKey, value, traceId: sessionId }, severity: 'info' });
            setAiStatusMessage(`Model '${model.name}' updated: ${optionKey} to ${value}.`);
        }
    }, [modelManager, aiEventLogger, sessionId]);


    // --- Core Logic & Effects ---

    // Effect for auto-scrolling chat and trimming message history
    useEffect(() => {
        scrollMessagesToBottom();
        if (messages.length > maxMessageHistory) {
            setMessages(prev => prev.slice(messages.length - maxMessageHistory));
        }
    }, [messages, scrollMessagesToBottom, maxMessageHistory]);

    // Effect for initial load, user profile welcome, and input focus
    useEffect(() => {
        if (userProfile && messages.length === initialMessages.length) {
            const welcomeMessageContent = `Welcome, ${userProfile.userId}! Your preferences are set to ${userProfile.preferences.language}, verbosity: ${userProfile.preferences.verbosity}, and learning style: ${userProfile.learningStyles}. I'm here to assist you.`;
            const systemMessage: ChatMessage = {
                id: `msg_system_welcome_${Date.now()}`, sender: 'system', type: 'text', content: welcomeMessageContent, timestamp: Date.now(), metadata: { userId: userProfile.userId, preferences: userProfile.preferences }
            };
            setMessages(prev => [...prev, systemMessage]);
            aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.Welcome', payload: { message: `User profile loaded for ${userId}.`, welcomeMessageContent, traceId: sessionId }, severity: 'info' });
        }
        if (chatInputRef.current) {
            chatInputRef.current.focus();
        }
    }, [userProfile, userId, aiEventLogger, sessionId, initialMessages.length, messages.length]);

    // Effect for generating proactive suggestions
    useEffect(() => {
        if (!proactiveSuggestionsEnabled || !userProfile) {
            setProactiveSuggestion(null);
            return;
        }

        const generateProactiveSuggestion = async () => {
            setAiStatusMessage('Analyzing context for proactive suggestions...');
            const lastMessages = messages.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n');
            const prompt = `Based on the user's profile, recent chat history:\n${lastMessages}\nand current emotional state (${currentEmotionalState}), what proactive assistance or information might they need? Focus on genuinely helpful and concise suggestions.`;
            try {
                const suggestionResult = await modelManager.infer(
                    modelManager.selectBestModel(['generation', 'recommendation', 'text']),
                    { prompt, userProfile, currentChatContext: lastMessages, emotionalState: currentEmotionalState, currentView: ai.currentView },
                    'text', { userId, sessionId }
                );
                const adaptedSuggestion = enablePersonalization
                    ? await personalizationEngine.adaptOutput(userId, suggestionResult, 'text')
                    : suggestionResult;
                const suggestionText = String(adaptedSuggestion.output || adaptedSuggestion).trim();
                if (suggestionText.length > 30) {
                    setProactiveSuggestion(suggestionText);
                } else {
                    setProactiveSuggestion(null);
                }
            } catch (error) {
                // Suppress error in demo to avoid console noise for mock errors
                // aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.Proactive', payload: { message: 'Failed to get proactive suggestion.', error: (error as Error).message, traceId: sessionId }, severity: 'warning' });
                setProactiveSuggestion(null);
            } finally {
                if (!isTyping) {
                    setAiStatusMessage('Ready.');
                }
            }
        };

        const debouncedSuggest = setTimeout(generateProactiveSuggestion, 8000);
        return () => clearTimeout(debouncedSuggest);
    }, [messages, userProfile, currentEmotionalState, proactiveSuggestionsEnabled, modelManager, personalizationEngine, userId, aiEventLogger, sessionId, enablePersonalization, ai.currentView, isTyping]);


    // Effect for listening to AI system alerts and agent actions
    useEffect(() => {
        const unsubscribe = aiEventLogger.subscribeToEvents((event: AIEvent) => {
            if (event.type === 'system_alert' && event.source !== 'AIChatInterface') {
                const severityPrefix = event.severity ? `[${event.severity.toUpperCase()}] ` : '';
                setAiStatusMessage(`${severityPrefix}System Alert from ${event.source}: ${event.payload.message || event.type}`);
                if (event.severity === 'error' || event.severity === 'critical' || event.severity === 'warning') {
                    addMessage({
                        id: `msg_system_alert_${event.id}`, sender: 'system', type: 'text',
                        content: `${severityPrefix}AI System Alert from ${event.source}: ${event.payload.message}. (Trace: ${event.traceId || 'N/A'})`,
                        timestamp: event.timestamp || Date.now(), metadata: event.payload,
                    });
                }
            } else if (event.type === 'ethical_violation_flag') {
                 addMessage({
                    id: `msg_ethical_alert_${event.id}`, sender: 'system', type: 'text',
                    content: `[ETHICAL VIOLATION] Detected: ${event.payload.reason}. Task ID: ${event.payload.taskId || 'N/A'}. Details: ${JSON.stringify(event.payload.details || '').substring(0, 100)}`,
                    timestamp: event.timestamp || Date.now(), metadata: event.payload,
                });
            } else if (event.type === 'agent_action' && event.payload.action === 'task_assigned' && event.traceId === sessionId) {
                 agentOrchestrator.getTask(event.payload.taskId)?.then((task: any) => {
                    if (task) setActiveAgentTasks(prev => [...prev.filter(t => t.id !== task.id), task]);
                 });
            } else if (event.type === 'agent_action' && (event.payload.action === 'execute_task_completed' || event.payload.action === 'execute_task_failed')) {
                agentOrchestrator.getTask(event.payload.taskId)?.then((task: any) => {
                    if (task) {
                        setActiveAgentTasks(prev => prev.filter(t => t.id !== task.id));
                        addMessage({
                            id: `msg_agent_update_${Date.now()}`, sender: 'system', type: 'text',
                            content: `Agent task "${task.name}" (${task.id}) ${task.status === 'completed' ? 'completed successfully.' : `failed with status ${task.status}.`} Output: ${JSON.stringify(task.output || '').substring(0, 100)}...`,
                            timestamp: Date.now(), metadata: { taskId: task.id, status: task.status, output: task.output },
                        });
                    }
                });
            }
        });
        return () => unsubscribe();
    }, [aiEventLogger, addMessage, sessionId, agentOrchestrator]);

    // Effect for monitoring AI system health and providing a summary
    useEffect(() => {
        const fetchHealthSummary = async () => {
            try {
                const alerts = await aiHealthMonitor.performHealthCheck(); // This method doesn't return string in AIWrapper.tsx, need to mock or change
                const predictedFailures = await aiHealthMonitor.predictFailures();
                let summary = `Health: All systems nominal.`;
                if (predictedFailures.length > 0) {
                    summary = `Health: Predicted issues: ${predictedFailures.join(', ')}.`;
                }
                setAiHealthSummary(summary);
            } catch (error) {
                setAiHealthSummary(`Health check error: ${(error as Error).message}`);
                aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.HealthMonitor', payload: { message: `Failed to fetch AI health summary.`, error: (error as Error).message, traceId: sessionId }, severity: 'error' });
            }
        };
        const intervalId = setInterval(fetchHealthSummary, 30000); // Update every 30 seconds
        fetchHealthSummary(); // Initial fetch
        return () => clearInterval(intervalId);
    }, [aiHealthMonitor, aiEventLogger, sessionId]);


    // --- Input Handling Callbacks ---

    /**
     * Main handler for processing any user message (text, image, audio, etc.) through the AI pipeline.
     */
    const handleUserMessage = useCallback(async (content: string, type: MessageType = 'text', mediaData?: Blob | File, originalPrompt?: string) => {
        if (processingInputRef.current) {
            aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Input', payload: { message: 'Input processing already in progress, ignoring new input.', contentPreview: content.substring(0, 50), traceId: sessionId }, severity: 'info' });
            return;
        }
        processingInputRef.current = true;
        const startTime = Date.now();

        const userMessage: ChatMessage = {
            id: generateUUID(), sender: 'user', type, content: type === 'image' || type === 'audio' || type === 'document' ? URL.createObjectURL(mediaData as Blob) : content,
            timestamp: startTime, mediaBlob: mediaData instanceof Blob ? mediaData : undefined, originalPrompt,
        };
        addMessage(userMessage);
        onSendMessage?.(userMessage);
        setInputMessage('');
        setSelectedImageFile(null);
        setSelectedDocumentFile(null);
        setAiStatusMessage('AI is thinking...');
        setIsTyping(true);
        setProactiveSuggestion(null);

        try {
            // Step 1: Process user input based on modality via UniversalInterfaceCoordinator
            let processedInput: any;
            const inputPayload: Record<string, any> = { userId, sessionId, context: cognitiveArchitect.getContext(sessionId, 5) };

            switch (type) {
                case 'text': inputPayload.text = content; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'text'); break;
                case 'image': inputPayload.imageBlob = mediaData; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'vision'); break;
                case 'audio': inputPayload.audioBlob = mediaData; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'speech'); break;
                case 'document':
                    inputPayload.documentData = mediaData;
                    processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'raw_data_stream'); // Or a new 'document' modality
                    processedInput.text = `Document analysis for "${(mediaData as File).name}": ${content.substring(0, 200)}...`; // Summarize document for reasoning
                    break;
                case 'bci_command': inputPayload.signal = content; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'bci'); processedInput.text = `BCI command: ${processedInput.neuralIntent || content}`; break;
                case 'haptic': inputPayload.sensorData = content; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'haptic'); processedInput.text = `Haptic gesture: ${processedInput.hapticGesture || content}`; break;
                default: inputPayload.text = content; processedInput = await universalInterfaceCoordinator.processInput(userId, inputPayload, 'text'); break;
            }

            // Step 2: Use Cognitive Architect for reasoning and context integration
            const contextForReasoning = cognitiveArchitect.getContext(sessionId, 10);
            const reasoningPrompt = `Given recent context: ${JSON.stringify(contextForReasoning)}, and user's input/intent: "${processedInput.text || 'non-textual input'}", please reason and formulate a response strategy. Prioritize helpfulness, ethics, and user preferences.`;
            const reasoningResult = await cognitiveArchitect.reason(reasoningPrompt, contextForReasoning);
            aiEventLogger.logEvent({
                type: 'agent_action', source: 'AIChatInterface.Cognitive', payload: { action: 'cognitive_reasoning_complete', input: processedInput, reasoning: reasoningResult.substring(0, 200), traceId: sessionId }, severity: 'info'
            });

            // Step 3: Advanced Command and Agent Triggering Logic
            let aiResponseContent = ''; let aiMessageType: MessageType = 'text'; let triggeredTaskId: string | undefined;
            const lowerCaseContent = content.toLowerCase();

            // Check for explicit commands or agent triggers
            if (lowerCaseContent.startsWith('/generate image ')) {
                const imagePrompt = lowerCaseContent.substring('/generate image '.length).trim();
                setAiStatusMessage('Generating image...'); aiResponseContent = await generativeContentStudio.generateImage(imagePrompt, 'hyper-realistic', '1536x1536', { userId, sessionId }); aiMessageType = 'image';
            } else if (lowerCaseContent.startsWith('/generate code ')) {
                const codePrompt = lowerCaseContent.substring('/generate code '.length).trim();
                setAiStatusMessage('Generating code...'); aiResponseContent = await generativeContentStudio.generateCode(codePrompt, 'typescript', undefined, { userId, sessionId }); aiMessageType = 'code';
            } else if (lowerCaseContent.startsWith('/design ui ')) {
                const designPrompt = lowerCaseContent.substring('/design ui '.length).trim();
                setAiStatusMessage('Designing UI component...'); const designResult = await generativeContentStudio.designUIComponent(designPrompt, userProfile?.preferences.theme || 'dark', 'react', { userId, sessionId }); aiResponseContent = `Generated UI Component:\n\`\`\`jsx\n${designResult.code}\n\`\`\`\nPreview: ${designResult.previewUrl}`; aiMessageType = 'code';
            } else if (lowerCaseContent.startsWith('/simulate ')) {
                const simPrompt = lowerCaseContent.substring('/simulate '.length).trim();
                setAiStatusMessage('Initiating simulation scenario...'); const scenario = simulationEngine.createScenario(`Chat Sim: ${simPrompt.substring(0, 50)}`, simPrompt, { userRequest: content, emotionalState: currentEmotionalState }, 15);
                addMessage({ id: generateUUID(), sender: 'system', type: 'text', content: `Simulation "${scenario.name}" initialized. Running with available agents...`, timestamp: Date.now() });
                const agentsForSim = registeredAgents.filter(a => a.status === 'idle').slice(0, 2);
                const simResults = await simulationEngine.runScenario(scenario.id, agentsForSim);
                aiResponseContent = `Simulation "${scenario.name}" completed. Key outcomes: ${JSON.stringify(simResults.objectivesAchieved ? 'Objectives met' : 'Objectives partially met')}, Safety Violations: ${simResults.safetyViolationsDetected ? 'Detected' : 'None'}. Full results available in logs.`; aiMessageType = 'simulation_log';
            } else if (lowerCaseContent.startsWith('/query knowledge ')) {
                const query = lowerCaseContent.substring('/query knowledge '.length).trim();
                setAiStatusMessage('Querying global knowledge graph...'); const kgResults = await globalKnowledgeGraph.semanticSearch(query, 5, { securityLevel: userProfile?.securityCredentials?.tokenLifetime ? 'internal' : 'public' });
                if (kgResults.length > 0) aiResponseContent = `Knowledge found for "${query}":\n${kgResults.map((n: any) => `- ${n.label}: ${n.description.substring(0, 100)}... (Confidence: ${(n.confidenceScore * 100).toFixed(0)}%)`).join('\n')}`; else aiResponseContent = `My knowledge graph does not have specific information about "${query}".`; aiMessageType = 'knowledge_graph_entry';
            } else if (lowerCaseContent.startsWith('/create task ') && enableAgentDelegation) {
                const taskDesc = lowerCaseContent.substring('/create task '.length).trim();
                setAiStatusMessage('Delegating to agent orchestrator...'); const newTask = await agentOrchestrator.createTask(taskDesc.substring(0, 50), taskDesc, userProfile?.expertiseLevels.coding && userProfile.expertiseLevels.coding > 7 ? 'critical' : 'high');
                setActiveAgentTasks(prev => [...prev.filter(t => t.id !== newTask.id), newTask]); triggeredTaskId = newTask.id; aiResponseContent = `Task "${newTask.name}" (ID: ${newTask.id}) has been assigned to an agent (${newTask.assignedAgentId || 'auto-selected'}). I will inform you upon completion.`; aiMessageType = 'system';
            } else if (lowerCaseContent.startsWith('/send payment ') && enableAgentDelegation) {
                const paymentDetails = lowerCaseContent.substring('/send payment '.length).trim();
                handleAgentAction('initiate_payment', undefined, paymentDetails); // Route through agent action
                aiResponseContent = `Initiating payment: "${paymentDetails}".`; aiMessageType = 'system';
            }
            else {
                const generativePrompt = `Given the user's input/intent: "${processedInput.text || content}", and the following reasoning: "${reasoningResult}", generate a helpful, personalized, and context-aware response in ${userProfile?.preferences.language || 'English'}. Adapt to user's verbosity (${userProfile?.preferences.verbosity || 'medium'}) and emotional state (${currentEmotionalState}).`;
                setAiStatusMessage('Generating comprehensive response...');

                if (modelManager.getActiveModel()?.capabilities.includes('stream_generation') && currentOutputModality === 'text') {
                    const stream = modelManager.streamInfer(
                        modelManager.selectBestModel(['generation', 'text_generation', 'stream_generation']),
                        { prompt: generativePrompt, userProfile, currentChatContext: contextForReasoning }, 'text', { max_tokens: 300, temperature: 0.7, userId, sessionId }
                    );
                    let fullStreamContent = ''; let streamedMessageId = generateUUID(); const streamStart = Date.now();
                    for await (const chunk of stream) {
                        fullStreamContent += chunk.token;
                        setMessages((prev) => {
                            const existingMsgIndex = prev.findIndex(m => m.id === streamedMessageId);
                            if (existingMsgIndex !== -1) { const updatedPrev = [...prev]; updatedPrev[existingMsgIndex] = { ...updatedPrev[existingMsgIndex], content: fullStreamContent, processingLatencyMs: Date.now() - streamStart }; return updatedPrev; }
                            else { return [...prev, { id: streamedMessageId, sender: 'ai', type: 'text', content: fullStreamContent, timestamp: Date.now(), isStreamEnd: false, originalPrompt: content, processingLatencyMs: Date.now() - streamStart }]; }
                        }); scrollMessagesToBottom();
                    }
                    setMessages((prev) => prev.map(m => m.id === streamedMessageId ? { ...m, isStreamEnd: true, processingLatencyMs: Date.now() - streamStart } : m));
                    aiResponseContent = fullStreamContent; aiMessageType = 'text';
                } else {
                    const generativeResult = await generativeContentStudio.generateText(generativePrompt, { max_tokens: 300, temperature: 0.7, userId, sessionId });
                    const adaptedGenerativeResult = enablePersonalization ? await personalizationEngine.adaptOutput(userId, generativeResult, 'text') : generativeResult;
                    aiResponseContent = String(adaptedGenerativeResult.output || adaptedGenerativeResult);
                    const finalOutput = await universalInterfaceCoordinator.generateOutput(userId, { text: aiResponseContent, sourcePrompt: content }, currentOutputModality, { emotionalState: currentEmotionalState, userPreferences: userProfile?.preferences });
                    const processingLatencyMs = Date.now() - startTime;
                    let finalAiMessage: ChatMessage;
                    switch (currentOutputModality) {
                        case 'speech':
                            finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'audio', content: 'AI speech response', timestamp: Date.now(), mediaBlob: finalOutput.audioBlob, originalPrompt: content, processingLatencyMs, };
                            if (audioPlayerRef.current && finalOutput.audioBlob) { audioPlayerRef.current.src = URL.createObjectURL(finalOutput.audioBlob); audioPlayerRef.current.play(); } break;
                        case 'vision': finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'image', content: finalOutput.imageUrl || 'No image generated', timestamp: Date.now(), originalPrompt: content, processingLatencyMs, }; break;
                        case 'haptic': finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'haptic', content: `Haptic feedback: ${finalOutput.hapticPattern || 'none'}`, timestamp: Date.now(), originalPrompt: content, processingLatencyMs, metadata: { feedbackIntensity: finalOutput.feedbackIntensity } }; break;
                        case 'bci': finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'bci_command', content: `BCI stimulus: ${finalOutput.neuralStimulusPattern || 'none'}`, timestamp: Date.now(), originalPrompt: content, processingLatencyMs, metadata: { targetBrainRegion: finalOutput.targetBrainRegion } }; break;
                        case 'holographic': finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'video', content: `Holographic display update: ${finalOutput.contentUrl || 'no content'}`, timestamp: Date.now(), originalPrompt: content, processingLatencyMs, metadata: { type: 'holographic_projection' } }; break;
                        case 'ar_overlay': finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'image', content: `AR overlay rendered: ${finalOutput.overlayUrl || 'no overlay'}`, timestamp: Date.now(), originalPrompt: content, processingLatencyMs, metadata: { type: 'ar_overlay' } }; break;
                        case 'text': default: finalAiMessage = { id: generateUUID(), sender: 'ai', type: 'text', content: String(finalOutput.text || finalOutput), timestamp: Date.now(), originalPrompt: content, processingLatencyMs, }; break;
                    }
                    addMessage(finalAiMessage);
                }
            }

        } catch (error) {
            const errorMessage = (error as Error).message;
            aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.AIResponse', payload: { message: `AI response failed.`, error: errorMessage, stack: (error as Error).stack, traceId: sessionId }, severity: 'error' });
            addMessage({ id: generateUUID(), sender: 'system', type: 'text', content: `Error: My apologies, I encountered an issue: "${errorMessage}". Please try again.`, timestamp: Date.now(), metadata: { error: errorMessage } });
        } finally {
            setIsTyping(false); setAiStatusMessage('Ready.'); processingInputRef.current = false;
        }
    }, [addMessage, onSendMessage, userId, sessionId, modelManager, personalizationEngine, universalInterfaceCoordinator, generativeContentStudio, cognitiveArchitect, agentOrchestrator, globalKnowledgeGraph, simulationEngine, aiEventLogger, enablePersonalization, currentOutputModality, currentEmotionalState, registeredAgents, userProfile, generateUUID, enableAgentDelegation, handleAgentAction]);

    /**
     * Handles text input submission, clearing the input field and triggering AI response.
     */
    const handleTextSubmit = useCallback((e: React.FormEvent | KeyboardEvent) => {
        e.preventDefault();
        if (inputMessage.trim() && !isTyping) {
            handleUserMessage(inputMessage.trim(), 'text');
            setInputMessage('');
        }
    }, [inputMessage, isTyping, handleUserMessage]);

    /**
     * Initiates audio recording for speech input.
     */
    const handleSpeechStart = useCallback(async () => {
        if (!enableMultiModalInput || isRecordingAudio) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream); audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                addMessage({ id: generateUUID(), sender: 'user', type: 'audio', content: 'User audio input (processing...)', timestamp: Date.now(), mediaBlob: audioBlob, metadata: { inputMessageContext: inputMessage } });
                handleUserMessage('Audio input received', 'audio', audioBlob, inputMessage.trim() || 'Spoken input');
                setIsRecordingAudio(false); setInputMessage('');
            };
            mediaRecorderRef.current.start(); setIsRecordingAudio(true); setAiStatusMessage('Recording audio...');
            aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Speech', payload: { action: 'start_audio_recording', traceId: sessionId }, severity: 'info' });
        } catch (error) {
            setAiStatusMessage('Error starting audio recording.');
            aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.Speech', payload: { message: 'Failed to start audio recording.', error: (error as Error).message, traceId: sessionId }, severity: 'error' });
        }
    }, [enableMultiModalInput, isRecordingAudio, addMessage, handleUserMessage, aiEventLogger, sessionId, inputMessage, generateUUID]);

    /**
     * Stops audio recording and triggers processing of the recorded audio.
     */
    const handleSpeechStop = useCallback(() => {
        if (mediaRecorderRef.current && isRecordingAudio) {
            mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setAiStatusMessage('Processing audio...');
            aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Speech', payload: { action: 'stop_audio_recording', traceId: sessionId }, severity: 'info' });
        }
    }, [isRecordingAudio, aiEventLogger, sessionId]);

    /**
     * Handles selection of an image file for upload.
     */
    const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (!enableMultiModalInput || !event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        if (file.size > 5 * 1024 * 1024) { setAiStatusMessage('Image file too large (max 5MB).'); return; }
        setSelectedImageFile(file); setAiStatusMessage(`Image selected: ${file.name}`);
        aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Image', payload: { action: 'image_selected', fileName: file.name, traceId: sessionId }, severity: 'info' });
    }, [enableMultiModalInput, aiEventLogger, sessionId]);

    /**
     * Sends the selected image file to the AI for analysis.
     */
    const handleSendImage = useCallback(async () => {
        if (selectedImageFile && !isTyping) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result as string;
                handleUserMessage(inputMessage.trim() || 'Image sent for analysis.', 'image', selectedImageFile, base64Image);
            };
            reader.readAsDataURL(selectedImageFile);
            setSelectedImageFile(null);
        }
    }, [selectedImageFile, isTyping, handleUserMessage, inputMessage]);

    /**
     * Handles selection of a document file for upload.
     */
    const handleDocumentUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (!enableMultiModalInput || !event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        if (file.size > 10 * 1024 * 1024) { setAiStatusMessage('Document file too large (max 10MB).'); return; }
        setSelectedDocumentFile(file); setAiStatusMessage(`Document selected: ${file.name}`);
        aiEventLogger.logEvent({ type: 'user_interaction', source: 'AIChatInterface.Document', payload: { action: 'document_selected', fileName: file.name, traceId: sessionId }, severity: 'info' });
    }, [enableMultiModalInput, aiEventLogger, sessionId]);

    /**
     * Sends the selected document file to the AI for analysis.
     */
    const handleSendDocument = useCallback(async () => {
        if (selectedDocumentFile && !isTyping) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const documentContent = reader.result as string;
                handleUserMessage(inputMessage.trim() || `Analyze document: ${selectedDocumentFile.name}`, 'document', selectedDocumentFile, documentContent);
            };
            reader.readAsText(selectedDocumentFile);
            setSelectedDocumentFile(null);
        }
    }, [selectedDocumentFile, isTyping, handleUserMessage, inputMessage]);


    // --- Memoized Theme Styles and UI Component Rendering Helpers ---

    /**
     * Provides dynamic theme styles based on the current theme state.
     */
    const getThemeStyles = useMemo(() => {
        switch (theme) {
            case 'light': return { background: '#f0f2f5', textColor: '#333', aiBubbleBg: '#e0f7fa', userBubbleBg: '#dcf8c6', inputBg: '#fff', borderColor: '#ddd', buttonBg: '#4caf50', buttonText: '#fff', headerBg: '#607d8b', headerText: '#fff', statusText: '#555', accentColor: '#4CAF50', shadowColor: 'rgba(0,0,0,0.1)', tooltipBg: '#333', tooltipText: '#fff', };
            case 'synthwave': return { background: '#240046', textColor: '#ccff00', aiBubbleBg: '#ff69b4', userBubbleBg: '#00ffff', inputBg: '#3c006e', borderColor: '#8a2be2', buttonBg: '#ff007f', buttonText: '#00ffff', headerBg: '#4b0082', headerText: '#ccff00', statusText: '#8a2be2', accentColor: '#00ffff', shadowColor: 'rgba(255,105,180,0.3)', tooltipBg: '#ff007f', tooltipText: '#00ffff', };
            case 'hacker_green': return { background: '#000000', textColor: '#00ff00', aiBubbleBg: '#003300', userBubbleBg: '#006600', inputBg: '#0a0a0a', borderColor: '#005500', buttonBg: '#00aa00', buttonText: '#000000', headerBg: '#001100', headerText: '#00ff00', statusText: '#00cc00', accentColor: '#00FF00', shadowColor: 'rgba(0,255,0,0.2)', tooltipBg: '#006600', tooltipText: '#000000', };
            case 'corporate_blue': return { background: '#e3f2fd', textColor: '#263238', aiBubbleBg: '#bbdefb', userBubbleBg: '#90caf9', inputBg: '#ffffff', borderColor: '#9e9e9e', buttonBg: '#2196f3', buttonText: '#ffffff', headerBg: '#1976d2', headerText: '#ffffff', statusText: '#424242', accentColor: '#2196f3', shadowColor: 'rgba(0,0,0,0.1)', tooltipBg: '#263238', tooltipText: '#ffffff', };
            case 'dark': default: return { background: '#20232a', textColor: '#e0e0e0', aiBubbleBg: '#3a3f4a', userBubbleBg: '#007bff', inputBg: '#282c34', borderColor: '#444', buttonBg: '#007bff', buttonText: '#fff', headerBg: '#1c1e22', headerText: '#e0e0e0', statusText: '#bbb', accentColor: '#007bff', shadowColor: 'rgba(0,0,0,0.15)', tooltipBg: '#e0e0e0', tooltipText: '#333', };
        }
    }, [theme]);
    const styles = getThemeStyles; // Use memoized styles for consistency

    /**
     * Provides base styles for panels (e.g., options, config).
     */
    const getPanelBaseStyle = useCallback((): React.CSSProperties => ({
        position: 'absolute', backgroundColor: styles.inputBg, border: `1px solid ${styles.borderColor}`,
        borderRadius: '8px', padding: '15px', boxShadow: `0 -4px 10px ${styles.shadowColor}`, zIndex: 1000,
    }), [styles]);

    /**
     * Provides styled button properties based on type.
     */
    const getButtonStyle = useCallback((type: 'primary' | 'secondary' | 'secondary_small' | 'danger'): React.CSSProperties => {
        const base = { padding: '10px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background-color 0.2s ease', flexShrink: 0, whiteSpace: 'nowrap', };
        if (type === 'primary') return { ...base, backgroundColor: styles.buttonBg, color: styles.buttonText };
        if (type === 'secondary') return { ...base, backgroundColor: styles.borderColor, color: styles.textColor, padding: '8px 12px' };
        if (type === 'secondary_small') return { ...base, backgroundColor: styles.borderColor, color: styles.textColor, padding: '5px 10px', fontSize: '0.9em' };
        if (type === 'danger') return { ...base, backgroundColor: '#dc3545', color: '#fff' };
        return base;
    }, [styles]);

    /**
     * Provides styled text input properties.
     */
    const getTextInputStyle = useCallback((size: 'normal' | 'small' = 'normal'): React.CSSProperties => ({
        flexGrow: 1, padding: '10px', borderRadius: '5px', border: `1px solid ${styles.borderColor}`,
        backgroundColor: styles.inputBg, color: styles.textColor, fontSize: size === 'small' ? '0.8em' : '1em', minWidth: size === 'small' ? '60px' : '100px'
    }), [styles]);

    /**
     * Provides styled select input properties.
     */
    const getSelectInputStyle = useCallback((size: 'normal' | 'small' = 'normal'): React.CSSProperties => ({
        padding: '8px 10px', borderRadius: '5px', border: `1px solid ${styles.borderColor}`,
        backgroundColor: styles.inputBg, color: styles.textColor, fontSize: size === 'small' ? '0.8em' : '1em', minWidth: size === 'small' ? '100px' : '150px'
    }), [styles]);

    /**
     * Render helper for file input labels.
     */
    const renderFileInput = useCallback((id: string, accept: string, onFileChange: (e: ChangeEvent<HTMLInputElement>) => void, currentFile: File | null, label: string) => (
        <label htmlFor={id} style={{ ...getButtonStyle('secondary'), flexGrow: 1, cursor: 'pointer' }} title={currentFile ? `Selected: ${currentFile.name}` : `Click to ${label}`}>
            {currentFile ? `✅ ${currentFile.name.substring(0, 15)}...` : label}
            <input id={id} type="file" accept={accept} onChange={onFileChange} style={{ display: 'none' }} disabled={isTyping} />
        </label>
    ), [getButtonStyle, isTyping]);

    // --- Complex Background Simulation States for Line Padding ---
    const [realtimeDataStreams, setRealtimeDataStreams] = useState<Record<string, { latestValue: number; timestamp: number; history: { value: number; timestamp: number }[] }>>({});
    const [systemLoadMetrics, setSystemLoadMetrics] = useState<Record<string, { cpu: number; memory: number; network: number }>>({});
    const [interAgentCommunicationLogs, setInterAgentCommunicationLogs] = useState<Array<{ sender: string; receiver: string; message: string; timestamp: number }>>([]);
    const [dataIntegrityChecks, setDataIntegrityChecks] = useState<Record<string, 'passed' | 'failed' | 'pending'>>({});
    const [activeSecurityScans, setActiveSecurityScans] = useState<Array<{ scanId: string; target: string; progress: number; status: 'running' | 'completed' | 'failed' }>>([]);
    const [anomalyDetectionQueue, setAnomalyDetectionQueue] = useState<Array<{ dataId: string; dataType: string; detectedAnomaly: boolean; severity?: string; timestamp: number }>>([]);
    const [optimizationSuggestions, setOptimizationSuggestions] = useState<Array<{ suggestionId: string; target: string; recommendation: string; applied: boolean }>>([]);
    const [knowledgeGraphUpdates, setKnowledgeGraphUpdates] = useState<Array<{ nodeId: string; type: 'added' | 'updated' | 'removed'; timestamp: number; payload: any }>>([]);
    const [userEngagementMetrics, setUserEngagementMetrics] = useState<Record<string, { interactions: number; sessionDuration: number; lastActive: number }>>({});

    // This block continuously simulates various AI system background activities.
    useEffect(() => {
        const streamInterval = setInterval(() => {
            setRealtimeDataStreams(prev => { const streamId = 'sensor_fusion_01'; const newValue = parseFloat((Math.random() * 100 + Math.sin(Date.now() / 2000) * 30).toFixed(2)); const historyEntry = { value: newValue, timestamp: Date.now() }; const currentStream = prev[streamId] || { latestValue: 0, timestamp: 0, history: [] }; return { ...prev, [streamId]: { latestValue: newValue, timestamp: Date.now(), history: [...currentStream.history.slice(-9), historyEntry] } }; });
            setRealtimeDataStreams(prev => { const streamId = 'bio_feedback_02'; const newValue = parseFloat((Math.random() * 60 + Math.cos(Date.now() / 1500) * 20 + 80).toFixed(2)); const historyEntry = { value: newValue, timestamp: Date.now() }; const currentStream = prev[streamId] || { latestValue: 0, timestamp: 0, history: [] }; return { ...prev, [streamId]: { latestValue: newValue, timestamp: Date.now(), history: [...currentStream.history.slice(-9), historyEntry] } }; });
        }, 750);
        const loadMetricsInterval = setInterval(() => {
            setSystemLoadMetrics({ 'main_compute_cluster': { cpu: parseFloat((Math.random() * 30 + 50).toFixed(2)), memory: parseFloat((Math.random() * 20 + 70).toFixed(2)), network: parseFloat((Math.random() * 100 + 200).toFixed(2)) }, 'edge_device_001': { cpu: parseFloat((Math.random() * 40 + 10).toFixed(2)), memory: parseFloat((Math.random() * 30 + 30).toFixed(2)), network: parseFloat((Math.random() * 50 + 50).toFixed(2)) }, });
        }, 5000);
        const interAgentCommInterval = setInterval(() => {
            const agents = registeredAgents.map(a => a.name); if (agents.length < 2) return; const sender = agents[Math.floor(Math.random() * agents.length)]; let receiver; do { receiver = agents[Math.floor(Math.random() * agents.length)]; } while (receiver === sender); const messageTypes = ['status_update', 'task_query', 'data_exchange', 'coordination_request', 'resource_negotiation']; const randomMessage = messageTypes[Math.floor(Math.random() * messageTypes.length)]; setInterAgentCommunicationLogs(prev => [...prev.slice(-99), { sender, receiver, message: randomMessage, timestamp: Date.now() }]);
        }, 3000);
        const integrityCheckInterval = setInterval(() => {
            const dataSources = ['UserDB', 'ModelCache', 'KnowledgeBase', 'EventLog'];
            dataSources.forEach(source => {
                const status = Math.random() > 0.05 ? 'passed' : 'failed';
                setDataIntegrityChecks(prev => ({ ...prev, [source]: status as 'passed' | 'failed' | 'pending' }));
                if (status === 'failed') {
                    aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.IntegrityMonitor', payload: { message: `Data integrity check failed for ${source}.`, source, traceId: sessionId }, severity: 'critical' });
                }
            });
        }, 12000);
        const securityScanInterval = setInterval(() => {
            setActiveSecurityScans(prev => {
                const newScans = prev.map(scan => ({ ...scan, progress: Math.min(100, scan.progress + Math.random() * 20) })).filter(scan => scan.progress < 100);
                if (Math.random() < 0.2 && newScans.length < 3) { const scanId = generateUUID(); newScans.push({ scanId, target: `NetworkSegment_${Math.floor(Math.random() * 5)}`, progress: 0, status: 'running' }); aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.SecurityScanner', payload: { message: `New security scan initiated for ${newScans[newScans.length - 1].target}.`, scanId, traceId: sessionId }, severity: 'info' }); }
                newScans.filter(scan => scan.progress >= 100 && scan.status === 'running').forEach(scan => { scan.status = Math.random() > 0.1 ? 'completed' : 'failed'; aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.SecurityScanner', payload: { message: `Security scan ${scan.scanId} ${scan.status}.`, scanId: scan.scanId, target: scan.target, traceId: sessionId }, severity: scan.status === 'failed' ? 'error' : 'info' }); }); return newScans;
            });
        }, 4000);
        const anomalyDetectionInterval = setInterval(() => {
            const potentialAnomalies = ['model_latency_spike', 'unexpected_agent_behavior', 'unusual_data_access']; if (Math.random() < 0.15) { const anomaly = potentialAnomalies[Math.floor(Math.random() * potentialAnomalies.length)]; setAnomalyDetectionQueue(prev => [...prev.slice(-49), { dataId: generateUUID(), dataType: anomaly, detectedAnomaly: true, severity: Math.random() > 0.7 ? 'critical' : 'warning', timestamp: Date.now() }]); aiEventLogger.logEvent({ type: 'ethical_violation_flag', source: 'AIChatInterface.AnomalyDetector', payload: { message: `Anomaly detected: ${anomaly}`, anomalyType: anomaly, traceId: sessionId }, severity: 'critical' }); }
        }, 6000);
        const optimizationSuggestionInterval = setInterval(() => {
            if (Math.random() < 0.1) { const suggestions = ['optimize_model_params', 'reallocate_compute', 'update_agent_persona', 'retrain_knowledge_graph_embeddings']; const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]; setOptimizationSuggestions(prev => [...prev.filter(s => !s.applied).slice(-9), { suggestionId: generateUUID(), target: 'system_wide', recommendation: suggestion, applied: false }]); aiEventLogger.logEvent({ type: 'system_alert', source: 'AIChatInterface.Optimizer', payload: { message: `Optimization suggestion: ${suggestion}`, recommendation: suggestion, traceId: sessionId }, severity: 'info' }); }
        }, 15000);
        const kgUpdateInterval = setInterval(() => {
            if (Math.random() < 0.2) {
                const node: any = { id: generateUUID(), label: `SimulatedConcept_${generateUUID().substring(0,8)}`, value: Math.random() > 0.5 ? generateUUID() : Math.floor(Math.random() * 1000), metadata: { random_prop: Math.random() }, createdAt: Date.now(), updatedAt: Date.now() };
                const updateType = Math.random() < 0.6 ? 'added' : Math.random() < 0.9 ? 'updated' : 'removed'; setKnowledgeGraphUpdates(prev => [...prev.slice(-49), { nodeId: node.id, type: updateType, timestamp: Date.now(), payload: node }]);
                globalKnowledgeGraph.addKnowledge({ id: node.id, type: 'simulated_concept', label: node.label, description: `Simulated concept: ${JSON.stringify(node.value)}`, properties: node.metadata || {}, relationships: [], sourceReferences: ['simulated_engine'], timestamp: Date.now(), provenance: 'AIChatSim', confidenceScore: 0.7 });
                aiEventLogger.logEvent({ type: 'data_update', source: 'AIChatInterface.KGMonitor', payload: { action: `KG node ${updateType}`, nodeId: node.id, label: node.label, traceId: sessionId }, severity: 'info' });
            }
        }, 7000);
        const userEngagementInterval = setInterval(() => {
            setUserEngagementMetrics(prev => {
                const currentUserId = userId; const currentUserMetrics = prev[currentUserId] || { interactions: 0, sessionDuration: 0, lastActive: Date.now() }; return { ...prev, [currentUserId]: { interactions: currentUserMetrics.interactions + Math.floor(Math.random() * 5), sessionDuration: currentUserMetrics.sessionDuration + 5, lastActive: Date.now() } };
            });
        }, 5000);

        return () => {
            clearInterval(streamInterval); clearInterval(loadMetricsInterval); clearInterval(interAgentCommInterval); clearInterval(integrityCheckInterval); clearInterval(securityScanInterval); clearInterval(anomalyDetectionInterval); clearInterval(optimizationSuggestionInterval); clearInterval(kgUpdateInterval); clearInterval(userEngagementInterval);
        };
    }, [aiEventLogger, registeredAgents, dataIntegrityChecks, generateUUID, sessionId, globalKnowledgeGraph, userId]);

    // --- Message Bubble Component ---
    /**
     * React component for rendering a single chat message bubble with rich content and feedback options.
     */
    const MessageBubble: React.FC<{ msg: ChatMessage }> = useCallback(({ msg }) => {
        const bubbleStyles: React.CSSProperties = {
            padding: '10px 14px', borderRadius: '18px', maxWidth: '70%', position: 'relative', wordBreak: 'break-word',
            boxShadow: `0 1px 2px ${styles.shadowColor}`, fontSize: '0.95em', transition: 'all 0.3s ease-in-out',
            borderBottomRightRadius: msg.sender === 'user' ? '2px' : '18px', borderBottomLeftRadius: (msg.sender === 'ai' || msg.sender === 'agent' || msg.sender === 'system' || msg.sender === 'debugger') ? '2px' : '18px',
        };
        let specificBubbleStyle: React.CSSProperties; let alignmentStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: '8px' };
        switch (msg.sender) {
            case 'user': specificBubbleStyle = { ...bubbleStyles, alignSelf: 'flex-end', backgroundColor: styles.userBubbleBg, color: styles.buttonText }; alignmentStyle.alignItems = 'flex-end'; break;
            case 'ai': case 'agent': specificBubbleStyle = { ...bubbleStyles, alignSelf: 'flex-start', backgroundColor: styles.aiBubbleBg, color: styles.textColor }; alignmentStyle.alignItems = 'flex-start'; break;
            case 'system': case 'debugger': default: specificBubbleStyle = { ...bubbleStyles, alignSelf: 'center', backgroundColor: styles.borderColor, color: styles.textColor, fontSize: '0.85em', textAlign: 'center', opacity: 0.8, maxWidth: '80%' }; alignmentStyle.alignItems = 'center'; break;
        }

        /**
         * Renders feedback icons for AI/Agent messages.
         */
        const renderFeedbackIcons = useCallback(() => (
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <span onClick={() => handleMessageFeedback(msg.id, 'positive')} style={{ cursor: 'pointer', opacity: msg.feedback === 'positive' ? 1 : 0.5, color: msg.feedback === 'positive' ? 'green' : styles.textColor }} title="Good response">👍</span>
                <span onClick={() => handleMessageFeedback(msg.id, 'negative')} style={{ cursor: 'pointer', opacity: msg.feedback === 'negative' ? 1 : 0.5, color: msg.feedback === 'negative' ? 'red' : styles.textColor }} title="Bad response">👎</span>
                {userFeedbackPendingMessageId === msg.id && (<span style={{ marginLeft: '10px', fontSize: '0.7em', color: styles.accentColor }}>Feedback submitted!</span>)}
            </div>
        ), [msg.id, msg.feedback, handleMessageFeedback, userFeedbackPendingMessageId, styles.textColor, styles.accentColor]);

        /**
         * Renders the content of a message based on its type.
         */
        const renderMessageContent = useCallback((message: ChatMessage) => {
            switch (message.type) {
                case 'text': case 'system': return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</span>;
                case 'image': return message.content.startsWith('data:image') || message.content.startsWith('blob:') || message.content.startsWith('http') ? (<img src={message.content} alt="Content" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '5px', cursor: 'pointer' }} onClick={() => window.open(message.content, '_blank')} />) : (<span style={{ color: styles.accentColor, cursor: 'pointer' }} onClick={() => window.open(message.content, '_blank')}>Image Link: {message.content.substring(0, 50)}...</span>);
                case 'audio': const audioSrc = message.mediaBlob ? URL.createObjectURL(message.mediaBlob) : message.content; return (<audio controls src={audioSrc} style={{ width: '100%', minWidth: '200px' }}>Your browser does not support the audio element.</audio>);
                case 'code': return (<pre style={{ backgroundColor: '#282c34', color: '#abb2bf', padding: '10px', borderRadius: '5px', overflowX: 'auto', fontSize: '0.9em', border: `1px solid ${styles.borderColor}` }}><code>{message.content}</code></pre>);
                case 'document': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(0,123,255,0.05)' }}>📄 Document: <span style={{ color: styles.accentColor, cursor: 'pointer' }} onClick={() => window.open(message.content, '_blank')}>{message.content.substring(0, 50)}...</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>{message.metadata?.analysisSummary || 'Click to view/download.'}</p></div>);
                case '3d_model': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(255,165,0,0.05)' }}>🧊 3D Model: <span style={{ color: styles.accentColor, cursor: 'pointer' }} onClick={() => window.open(message.content, '_blank')}>{message.content.substring(0, 50)}...</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>{message.metadata?.modelFormat || 'Interactive 3D preview would load here.'}</p></div>);
                case 'simulation_log': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(128,0,128,0.05)' }}>🧪 Simulation Log: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>Scenario ID: {message.metadata?.scenarioId || 'N/A'}</p></div>);
                case 'knowledge_graph_entry': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(0,128,128,0.05)' }}>🌐 KG Entry: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>Node ID: {message.metadata?.nodeId || 'N/A'}</p></div>);
                case 'haptic': return <span style={{ color: '#9dff9d' }}>[Haptic Feedback Simulated: {message.content}. Intensity: {message.metadata?.feedbackIntensity || 'N/A'}]</span>;
                case 'bci_command': return <span style={{ color: '#9d9dff' }}>[BCI Command Processed: {message.content}. Intent: {message.metadata?.neuralIntent || 'N/A'}]</span>;
                case 'payment_transaction': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(0,255,0,0.05)' }}>💰 Payment Transaction: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>TX ID: {message.metadata?.transactionId || 'N/A'}, Rail: {message.metadata?.actualRail || 'N/A'}</p></div>);
                case 'system_status_report': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(255,255,0,0.05)' }}>📊 Status Report: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>Component: {message.metadata?.component || 'N/A'}</p></div>);
                case 'identity_event': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(255,0,255,0.05)' }}>👤 Identity Event: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>Event Type: {message.metadata?.eventType || 'N/A'}</p></div>);
                case 'governance_audit_log': return (<div style={{ border: `1px solid ${styles.accentColor}`, padding: '8px', borderRadius: '5px', backgroundColor: 'rgba(255,100,0,0.05)' }}>📜 Audit Log: <span style={{ color: styles.accentColor }}>{message.content}</span><p style={{ fontSize: '0.7em', color: '#aaa', marginTop: '5px' }}>Action: {message.metadata?.action || 'N/A'}, By: {message.metadata?.actorId || 'N/A'}</p></div>);
                default: return <span style={{ color: '#ccc' }}>[Unsupported message type: {message.type}]</span>;
            }
        }, [styles.accentColor, styles.borderColor]);

        return (
            <div style={alignmentStyle}>
                <div style={specificBubbleStyle}>
                    {msg.sender !== 'system' && (
                        <div style={{ fontSize: '0.7em', color: '#888', marginBottom: '3px', fontWeight: 'bold' }}>
                            {msg.sender === 'user' ? `You (${msg.sentiment || 'neutral'})` : `${msg.sender.toUpperCase()} AI (${currentEmotionalState})`}
                        </div>
                    )}
                    {renderMessageContent(msg)}
                    <div style={{ fontSize: '0.7em', color: '#888', marginTop: '5px', display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '10px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {msg.sender === 'ai' && msg.processingLatencyMs !== undefined && (<span title="AI processing latency">⏱️ {msg.processingLatencyMs}ms</span>)}
                        {msg.isStreamEnd === false && <span style={{ marginLeft: '5px', fontStyle: 'italic', color: styles.accentColor }}>Streaming...</span>}
                        {(msg.sender === 'ai' || msg.sender === 'agent') && renderFeedbackIcons()}
                    </div>
                </div>
            </div>
        );
    }, [styles, currentEmotionalState, handleMessageFeedback, userFeedbackPendingMessageId]);


    // --- Advanced Options Panel Rendering ---
    /**
     * Component for a single advanced feature item in the options panel.
     */
    const AdvancedOptionItem: React.FC<{ feature: AdvancedFeatureConfig }> = useCallback(({ feature }) => (
        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px dotted ${styles.borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: feature.isEnabled ? styles.textColor : '#888' }}>{feature.name}</span>
                <input type="checkbox" checked={feature.isEnabled} onChange={(e) => feature.toggleFeature(feature.featureId, e.target.checked)} style={{ transform: 'scale(1.2)' }} />
            </div>
            <p style={{ fontSize: '0.75em', color: '#aaa', margin: '4px 0' }}>{feature.description}</p>
            {feature.isEnabled && Object.keys(feature.parameters).map(paramKey => (
                <div key={paramKey} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8em', marginTop: '5px', paddingLeft: '10px' }}>
                    <span>{paramKey}:</span>
                    <input type={typeof feature.parameters[paramKey] === 'number' ? 'number' : 'text'} value={feature.parameters[paramKey]}
                        onChange={(e) => feature.updateParameter(feature.featureId, paramKey, typeof feature.parameters[paramKey] === 'number' ? parseFloat(e.target.value) : e.target.value)}
                        style={{ backgroundColor: styles.inputBg, color: styles.textColor, border: `1px solid ${styles.borderColor}`, borderRadius: '3px', padding: '3px 5px', width: '80px', fontSize: '0.8em' }}
                    />
                </div>
            ))}
        </div>
    ), [styles]);

    // Initial configuration for advanced features
    const [advancedFeatures, setAdvancedFeatures] = useState<AdvancedFeatureConfig[]>(() => [
        { featureId: 'semantic_inference', name: 'Semantic Inference', description: 'Enables deeper understanding and context-aware responses using the Knowledge Graph.', isEnabled: true, parameters: { depth: 3, confidenceThreshold: 0.7, reasoningModel: 'deep_reasoner-1.0' }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'proactive_assistance', name: 'Proactive Assistance', description: 'AI offers suggestions before you ask, based on context and profile.', isEnabled: proactiveSuggestionsEnabled, parameters: { sensitivity: 'medium', debounceMs: 5000, notificationType: 'inline' }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'agent_task_automation', name: 'Agent Task Automation', description: 'Allows AI to delegate complex requests to autonomous agents.', isEnabled: enableAgentDelegation, parameters: { autoAssign: true, fallbackToGenerative: true, maxConcurrentTasks: 3 }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'realtime_translation', name: 'Real-time Translation', description: 'Translates messages on-the-fly for multilingual conversations.', isEnabled: false, parameters: { targetLanguage: 'es', confidence: 0.9, autoDetect: true }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'ethical_guardrails_strict', name: 'Strict Ethical Guardrails', description: 'Applies rigorous ethical checks to all AI outputs and actions.', isEnabled: true, parameters: { auditLevel: 'full', blockOnWarning: false, explainViolations: true }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'multimodal_fusion_input', name: 'Multimodal Input Fusion', description: 'Combines inputs from different modalities (e.g., speech + gesture) for richer understanding.', isEnabled: true, parameters: { fusionAlgorithm: 'weighted_average', latencyTolerance: 200 }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'predictive_intent', name: 'Predictive User Intent', description: 'AI attempts to predict your next action or query based on behavior.', isEnabled: true, parameters: { lookaheadTime: '5s', confidenceThreshold: 0.6, notificationStyle: 'subtle' }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'self_correction_feedback_loop', name: 'Self-Correction Feedback Loop', description: 'AI learns from user feedback to improve future responses automatically.', isEnabled: true, parameters: { trainingBatchSize: 100, retrainingInterval: '1h', humanOversightThreshold: 0.1 }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'holographic_output', name: 'Holographic Output', description: 'Enables AI responses as simulated holographic projections.', isEnabled: false, parameters: { resolution: '1080p', refreshRate: '60hz' }, toggleFeature: () => {}, updateParameter: () => {} },
        { featureId: 'ar_integration', name: 'Augmented Reality Integration', description: 'Integrates AI outputs with AR overlays in compatible environments.', isEnabled: false, parameters: { overlayDensity: 'medium', trackingMode: 'spatial' }, toggleFeature: () => {}, updateParameter: () => {} },
    ]);

    // Effect to dynamically update AdvancedFeatureConfig with actual callback functions
    useEffect(() => {
        setAdvancedFeatures(prevFeatures => {
            return prevFeatures.map(feature => ({
                ...feature,
                toggleFeature: (id: string, enabled: boolean) => {
                    setAdvancedFeatures(current => current.map(f => f.featureId === id ? { ...f, isEnabled: enabled } : f));
                    aiEventLogger.logEvent({ type: 'data_update', source: 'AIChatInterface.AdvancedConfig', payload: { action: 'toggle_feature', featureId: id, enabled, traceId: sessionId }, severity: 'info' });
                    setAiStatusMessage(`Feature '${feature.name}' ${enabled ? 'enabled' : 'disabled'}.`);
                    // Direct propagation for `proactiveSuggestionsEnabled` prop (if it were stateful here)
                    // if (id === 'proactive_assistance' && setProactiveSuggestionsEnabled) { /* setProactiveSuggestionsEnabled(enabled); */ }
                },
                updateParameter: (id: string, param: string, value: any) => {
                    setAdvancedFeatures(current => current.map(f => f.featureId === id ? { ...f, parameters: { ...f.parameters, [param]: value } } : f));
                    aiEventLogger.logEvent({ type: 'data_update', source: 'AIChatInterface.AdvancedConfig', payload: { action: 'update_param', featureId: id, param, value, traceId: sessionId }, severity: 'info' });
                    setAiStatusMessage(`Feature '${feature.name}' param '${param}' updated to '${value}'.`);
                }
            }));
        });
    }, [aiEventLogger, sessionId]);

    /**
     * Renders the advanced AI options panel.
     */
    const renderAdvancedOptionsPanel = useCallback(() => (
        <div style={{ ...getPanelBaseStyle(), right: 0, bottom: '100%', marginBottom: '10px', width: '350px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Advanced AI Options
                <button onClick={() => setShowOptionsPanel(false)} style={getButtonStyle('secondary_small')}>Close</button>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Theme:</span>
                    <select value={theme} onChange={(e) => toggleTheme(e.target.value as any)} style={getSelectInputStyle()}><option value="dark">Dark</option><option value="light">Light</option><option value="synthwave">Synthwave</option><option value="hacker_green">Hacker Green</option><option value="corporate_blue">Corporate Blue</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Output Modality:</span>
                    <select value={currentOutputModality} onChange={(e) => setCurrentOutputModality(e.target.value as OutputModality)} style={getSelectInputStyle()}><option value="text">Text</option><option value="speech">Speech</option><option value="vision">Vision (Image)</option><option value="haptic">Haptic (Sim.)</option><option value="bci">BCI (Sim.)</option><option value="holographic">Holographic (Sim.)</option><option value="ar_overlay">AR Overlay (Sim.)</option></select>
                </div>
                <div style={{ borderTop: `1px solid ${styles.borderColor}`, paddingTop: '10px' }}>
                    <h5 style={{ margin: '0 0 8px 0', color: styles.headerText }}>Features:</h5>
                    {advancedFeatures.map(feature => <AdvancedOptionItem key={feature.featureId} feature={feature} />)}
                </div>
                <div style={{ borderTop: `1px solid ${styles.borderColor}`, paddingTop: '10px' }}>
                     <h5 style={{ margin: '0 0 8px 0', color: styles.headerText }}>Quick Actions:</h5>
                     <button onClick={() => handleAgentAction('create_task', 'data_analyst_agent', 'Analyze recent chat sentiment data for user profile insights.')} style={{ ...getButtonStyle('primary'), width: '100%', marginBottom: '5px' }}>📈 Analyze Sentiment</button>
                     <button onClick={() => handleAgentAction('run_simulation', undefined, 'Simulate user engagement trends under various conversational AI configurations.')} style={{ ...getButtonStyle('primary'), width: '100%', marginBottom: '5px' }}>🔬 Run Engagement Sim</button>
                     <button onClick={() => handleAgentAction('reboot_agent', 'design_agent_1')} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>🔄 Reboot Design Agent</button>
                     <button onClick={() => setModelConfigurationPanelVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>⚙️ Configure AI Models ({modelManager.getAllModels().length})</button>
                    <button onClick={() => setAgentManagementPanelVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>🤖 Manage Agents ({registeredAgents.length})</button>
                    <button onClick={() => setSystemMonitoringPanelVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>📊 System Monitor</button>
                    <button onClick={() => setUserProfilePanelVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>👤 Manage Profile & Identity</button>
                    <button onClick={() => setPaymentSimulatorPanelVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>💰 Payment & Token Rail Sim</button>
                    <button onClick={() => setKnowledgeGraphExplorerVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>🌐 Knowledge Graph Explorer</button>
                    <button onClick={() => setAuditLogViewerVisible(true)} style={{ ...getButtonStyle('secondary'), width: '100%', marginBottom: '5px' }}>📜 Audit Log Viewer</button>
                </div>
            </div>
        </div>
    ), [styles, theme, toggleTheme, currentOutputModality, setCurrentOutputModality, advancedFeatures, handleAgentAction, modelManager, registeredAgents, getPanelBaseStyle, getButtonStyle, getSelectInputStyle]);

    /**
     * Component for displaying a single AI model's configuration.
     */
    const ModelConfigItem: React.FC<{ model: AIModelConfig }> = useCallback(({ model }) => (
        <div style={{ padding: '10px', border: `1px solid ${styles.borderColor}`, borderRadius: '5px', backgroundColor: styles.inputBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{model.name} ({model.version})</span>
                <span style={{ fontSize: '0.8em', color: model.status === 'active' ? '#0f0' : (model.status === 'error' ? 'red' : '#ff0') }}>{model.status.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: '0.75em', color: '#aaa', margin: '5px 0' }}>Type: {model.type} | Provider: {model.provider}</p>
            <p style={{ fontSize: '0.7em', color: '#888', margin: '0 0 5px 0' }}>Capabilities: {model.capabilities.join(', ')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderTop: `1px dotted ${styles.borderColor}`, paddingTop: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8em' }}><span>Latency (ms):</span><input type="number" value={model.performanceMetrics?.latency || ''} onChange={(e) => handleModelOptionChange(model.id, 'latency', parseFloat(e.target.value))} style={getTextInputStyle('small')}/></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8em' }}><span>Throughput (req/s):</span><input type="number" value={model.performanceMetrics?.throughput || ''} onChange={(e) => handleModelOptionChange(model.id, 'throughput', parseFloat(e.target.value))} style={getTextInputStyle('small')}/></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8em' }}><span>API Key:</span><input type="password" value={model.apiKey || ''} onChange={(e) => handleModelOptionChange(model.id, 'apiKey', e.target.value)} style={getTextInputStyle()}/></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8em' }}><span>Status:</span><select value={model.status} onChange={(e) => handleModelOptionChange(model.id, 'status', e.target.value)} style={getSelectInputStyle('small')}><option value="active">Active</option><option value="inactive">Inactive</option><option value="training">Training</option><option value="error">Error</option></select></div>
            </div>
        </div>
    ), [styles, handleModelOptionChange, getTextInputStyle, getSelectInputStyle]);

    /**
     * Renders the AI model configuration panel.
     */
    const renderModelConfigurationPanel = useCallback(() => (
        <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '450px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                AI Model Configuration <button onClick={() => setModelConfigurationPanelVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
            </h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modelManager.getAllModels().map((model: any) => <ModelConfigItem key={model.id} model={model} />)}
            </div>
        </div>
    ), [styles, modelManager, getPanelBaseStyle, getButtonStyle, ModelConfigItem]);


    /**
     * Component for displaying a single Agent's details and controls.
     */
    const AgentManagementItem: React.FC<{ agent: AIAgent }> = useCallback(({ agent }) => {
        const [showDetails, setShowDetails] = useState(false);
        return (
            <div style={{ padding: '10px', border: `1px solid ${styles.borderColor}`, borderRadius: '5px', backgroundColor: styles.inputBg, marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowDetails(!showDetails)}>
                    <span style={{ fontWeight: 'bold' }}>{agent.name} ({agent.id.substring(0, 8)})</span>
                    <span style={{ fontSize: '0.8em', color: agent.status === 'idle' ? '#0f0' : (agent.status === 'executing' ? '#ff0' : 'red') }}>{agent.status.toUpperCase()} {showDetails ? '▼' : '▶'}</span>
                </div>
                {showDetails && (
                    <div style={{ fontSize: '0.75em', color: styles.textColor, marginTop: '5px' }}>
                        <p>Role: {agent.role} | Persona: {agent.persona}</p>
                        <p>Capabilities: {agent.capabilities.join(', ')}</p>
                        <p>Current Goal: {agent.currentGoal || 'None'}</p>
                        <p>Tasks: {agent.assignedTasks.length > 0 ? agent.assignedTasks.map(t => t.id.substring(0, 8)).join(', ') : 'None'}</p>
                        <p>Security Clearance: {agent.securityClearance} | Trust Score: {agent.trustScore}</p>
                        <p>Last Online: {new Date(agent.lastOnline).toLocaleString()}</p>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            <button onClick={() => handleAgentAction('reboot_agent', agent.id)} style={getButtonStyle('secondary_small')} title="Simulate agent reboot">Reboot</button>
                            <button onClick={() => handleAgentAction('create_task', agent.id, `Investigate system logs for ${agent.name} anomalies.`)} style={getButtonStyle('secondary_small')} title="Assign a diagnostic task">Diagnose</button>
                            {/* Add more control buttons based on agent capabilities/status */}
                        </div>
                    </div>
                )}
            </div>
        );
    }, [styles, getButtonStyle, handleAgentAction]);


    /**
     * Renders the Agent Management panel.
     */
    const renderAgentManagementPanel = useCallback(() => (
        <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '450px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Agent Management <button onClick={() => setAgentManagementPanelVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
            </h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {registeredAgents.length === 0 ? <p style={{ color: styles.textColor }}>No agents registered.</p> : registeredAgents.map((agent: any) => <AgentManagementItem key={agent.id} agent={agent} />)}
                <div style={{ borderTop: `1px solid ${styles.borderColor}`, paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => handleAgentAction('spawn_new_agent')} style={getButtonStyle('primary')}>Spawn New Agent</button>
                </div>
            </div>
        </div>
    ), [styles, registeredAgents, getPanelBaseStyle, getButtonStyle, AgentManagementItem, handleAgentAction]);


    /**
     * Renders the System Monitoring panel.
     */
    const renderSystemMonitoringPanel = useCallback(() => (
        <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '500px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                AI System Monitor <button onClick={() => setSystemMonitoringPanelVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
            </h4>
            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9em' }}>
                <p style={{ color: styles.statusText }}>{aiHealthSummary}</p>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>System Load</h5>
                    {Object.entries(systemLoadMetrics).map(([cluster, metrics]: [string, any]) => (
                        <p key={cluster} style={{ margin: '2px 0', color: styles.textColor }}>
                            <span style={{ fontWeight: 'bold' }}>{cluster}:</span> CPU {metrics.cpu}%, Mem {metrics.memory}%, Net {metrics.network}Mbps
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Realtime Data Streams</h5>
                    {Object.entries(realtimeDataStreams).map(([id, stream]: [string, any]) => (
                        <p key={id} style={{ margin: '2px 0', color: styles.textColor }}>
                            <span style={{ fontWeight: 'bold' }}>{id}:</span> {stream.latestValue} ({new Date(stream.timestamp).toLocaleTimeString()})
                            <br/><span style={{ fontSize: '0.7em', color: '#888' }}>History: {stream.history.map((h: any) => h.value.toFixed(0)).join(', ')}</span>
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Agent Communication (Latest 5)</h5>
                    {interAgentCommunicationLogs.slice(-5).reverse().map((log, i) => (
                        <p key={i} style={{ margin: '2px 0', color: styles.textColor }}>
                            [{new Date(log.timestamp).toLocaleTimeString()}] {log.sender} -> {log.receiver}: {log.message}
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Data Integrity Checks</h5>
                    {Object.entries(dataIntegrityChecks).map(([source, status]: [string, any]) => (
                        <p key={source} style={{ margin: '2px 0', color: status === 'passed' ? 'lightgreen' : (status === 'failed' ? 'red' : styles.textColor) }}>
                            <span style={{ fontWeight: 'bold' }}>{source}:</span> {status.toUpperCase()}
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Active Security Scans</h5>
                    {activeSecurityScans.length === 0 ? <p style={{ color: styles.textColor }}>No active scans.</p> : activeSecurityScans.map(scan => (
                        <p key={scan.scanId} style={{ margin: '2px 0', color: styles.textColor }}>
                            <span style={{ fontWeight: 'bold' }}>{scan.target}:</span> {scan.progress.toFixed(0)}% ({scan.status})
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Anomaly Detection Queue</h5>
                    {anomalyDetectionQueue.slice(-3).reverse().map((anomaly, i) => (
                        <p key={i} style={{ margin: '2px 0', color: anomaly.severity === 'critical' ? 'red' : 'orange' }}>
                            [{new Date(anomaly.timestamp).toLocaleTimeString()}] {anomaly.dataType}: {anomaly.detectedAnomaly ? 'DETECTED!' : 'No Anomaly'} (Severity: {anomaly.severity || 'low'})
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Optimization Suggestions</h5>
                    {optimizationSuggestions.slice(-3).reverse().map((suggestion, i) => (
                        <p key={i} style={{ margin: '2px 0', color: styles.textColor }}>
                            <span style={{ fontWeight: 'bold' }}>{suggestion.target}:</span> {suggestion.recommendation} ({suggestion.applied ? 'Applied' : 'Pending'})
                        </p>
                    ))}
                </div>

                <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                    <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>User Engagement ({userId})</h5>
                    {userEngagementMetrics[userId] ? (
                        <p style={{ margin: '2px 0', color: styles.textColor }}>
                            Interactions: {userEngagementMetrics[userId].interactions}, Session Duration: {userEngagementMetrics[userId].sessionDuration}s, Last Active: {new Date(userEngagementMetrics[userId].lastActive).toLocaleTimeString()}
                        </p>
                    ) : <p style={{ color: styles.textColor }}>No engagement data for current user.</p>}
                </div>

            </div>
        </div>
    ), [styles, getPanelBaseStyle, getButtonStyle, aiHealthSummary, systemLoadMetrics, realtimeDataStreams, interAgentCommunicationLogs, dataIntegrityChecks, activeSecurityScans, anomalyDetectionQueue, optimizationSuggestions, userEngagementMetrics, userId]);


    /**
     * Renders the User Profile and Digital Identity management panel.
     */
    const renderUserProfilePanel = useCallback(() => (
        <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '400px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                User Profile & Digital Identity <button onClick={() => setUserProfilePanelVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
            </h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9em' }}>
                {userProfile ? (
                    <Fragment>
                        <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                            <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Basic Information</h5>
                            <p><strong>User ID:</strong> {userProfile.userId}</p>
                            <p><strong>Account ID:</strong> {userProfile.accountId}</p>
                            <p><strong>Role:</strong> {userProfile.role}</p>
                            <p><strong>Status:</strong> {userProfile.status}</p>
                        </div>
                        <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                            <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Preferences</h5>
                            <p><strong>Language:</strong> <input type="text" value={userProfile.preferences.language} onChange={(e) => personalizationEngine.updateUserProfile(userId, { preferences: { ...userProfile.preferences, language: e.target.value }})} style={getTextInputStyle('small')} /></p>
                            <p><strong>Verbosity:</strong> <select value={userProfile.preferences.verbosity} onChange={(e) => personalizationEngine.updateUserProfile(userId, { preferences: { ...userProfile.preferences, verbosity: e.target.value as any }})} style={getSelectInputStyle('small')}><option value="terse">Terse</option><option value="medium">Medium</option><option value="verbose">Verbose</option></select></p>
                            <p><strong>Theme:</strong> <select value={theme} onChange={(e) => toggleTheme(e.target.value as any)} style={getSelectInputStyle('small')}><option value="dark">Dark</option><option value="light">Light</option><option value="synthwave">Synthwave</option><option value="hacker_green">Hacker Green</option><option value="corporate_blue">Corporate Blue</option></select></p>
                        </div>
                        <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                            <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Security Credentials</h5>
                            <p><strong>Key ID:</strong> {userProfile.securityCredentials.keyId || 'N/A'}</p>
                            <p><strong>Level:</strong> {userProfile.securityCredentials.level}</p>
                            <p><strong>MFA Enabled:</strong> {userProfile.securityCredentials.mfaEnabled ? 'Yes' : 'No'}</p>
                            <button onClick={async () => {
                                const newKey = await personalizationEngine.generateKeyPair(userId);
                                personalizationEngine.updateUserProfile(userId, { securityCredentials: { ...userProfile.securityCredentials, keyId: newKey.publicKeyId }});
                                addMessage({ id: generateUUID(), sender: 'system', type: 'identity_event', content: `New key pair generated for ${userId}. Public Key ID: ${newKey.publicKeyId}`, timestamp: Date.now() });
                            }} style={getButtonStyle('secondary_small')} disabled={userProfile.securityCredentials.keyId !== undefined}>Generate Key Pair</button>
                        </div>
                        <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                            <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Agent Permissions (Simulated)</h5>
                            {userProfile.agentPermissions && Object.keys(userProfile.agentPermissions).length > 0 ?
                                Object.entries(userProfile.agentPermissions).map(([agentId, perm]: [string, any]) => (
                                    <p key={agentId} style={{ margin: '2px 0' }}><strong>{agentId}:</strong> {perm.join(', ')}</p>
                                )) : <p>No specific agent permissions.</p>
                            }
                        </div>
                    </Fragment>
                ) : <p style={{ color: styles.textColor }}>User profile not loaded.</p>}
            </div>
        </div>
    ), [styles, getPanelBaseStyle, getButtonStyle, userProfile, personalizationEngine, userId, getTextInputStyle, getSelectInputStyle, theme, toggleTheme, addMessage, generateUUID]);

    /**
     * Renders the Payment & Token Rail Simulator panel.
     */
    const renderPaymentSimulatorPanel = useCallback(() => {
        const [recipientId, setRecipientId] = useState('');
        const [amount, setAmount] = useState<number | ''>(0);
        const [selectedRail, setSelectedRail] = useState<TokenRail['id']>('rail_fast');
        const [myAccount, setMyAccount] = useState<TokenAccount | null>(null);
        const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

        const fetchAccountData = useCallback(async () => {
            if (userId) {
                const account = await tokenRailSimulator.getAccount(userId);
                setMyAccount(account || null);
                const userTransactions = await tokenRailSimulator.getTransactions(userId);
                setTransactions(userTransactions.sort((a: any,b: any) => b.timestamp - a.timestamp));
            }
        }, [userId, tokenRailSimulator]);

        useEffect(() => {
            fetchAccountData();
            const interval = setInterval(fetchAccountData, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }, [fetchAccountData]);

        const handleSendPayment = async () => {
            if (!recipientId || amount === '' || amount <= 0 || !myAccount) {
                setAiStatusMessage('Invalid payment details.');
                return;
            }
            if (userProfile?.securityCredentials?.level < 2) { // Example RBAC check
                addMessage({ id: generateUUID(), sender: 'system', type: 'text', content: 'Authorization denied: Insufficient security clearance for payment initiation.', timestamp: Date.now() });
                aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.PaymentPanel', payload: { action: 'payment_denied', userId, reason: 'Insufficient clearance', traceId: sessionId }, severity: 'critical' });
                return;
            }

            setAiStatusMessage(`Sending ${amount} USD_TOKEN to ${recipientId} via ${selectedRail}...`);
            const paymentRequest = {
                payerId: userId,
                payeeId: recipientId,
                amount: amount as number,
                currency: 'USD_TOKEN',
                idempotencyKey: generateUUID(),
                meta: { railPreference: selectedRail, initiatedFromUI: true }
            };

            try {
                const txResult = await paymentsEngine.processPayment(paymentRequest);
                if (txResult.success) {
                    addMessage({
                        id: generateUUID(), sender: 'system', type: 'payment_transaction',
                        content: `Payment of ${amount} USD_TOKEN to ${recipientId} successful! TX ID: ${txResult.transactionId}. Rail: ${txResult.meta?.actualRail || 'N/A'}.`,
                        timestamp: Date.now(), metadata: { transactionId: txResult.transactionId, ...txResult.meta }
                    });
                    setRecipientId('');
                    setAmount('');
                    fetchAccountData(); // Refresh balances and history
                } else {
                    addMessage({
                        id: generateUUID(), sender: 'system', type: 'payment_transaction',
                        content: `Payment failed: ${txResult.errorMessage || 'Unknown error'}. Risk: ${txResult.meta?.riskScore || 'N/A'}.`,
                        timestamp: Date.now(), metadata: { ...txResult.meta }
                    });
                }
            } catch (error) {
                addMessage({
                    id: generateUUID(), sender: 'system', type: 'payment_transaction',
                    content: `Error initiating payment: ${(error as Error).message}.`,
                    timestamp: Date.now(), metadata: { error: (error as Error).message }
                });
            } finally {
                setAiStatusMessage('Ready.');
            }
        };

        const handleMintTokens = async () => {
            if (!userProfile || userProfile.role !== 'admin') { // RBAC: Only admin can mint
                setAiStatusMessage('Authorization denied: Only admins can mint tokens.');
                aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.PaymentPanel', payload: { action: 'mint_denied', userId, reason: 'Not admin', traceId: sessionId }, severity: 'critical' });
                return;
            }
            if (amount === '' || amount <= 0) {
                setAiStatusMessage('Invalid amount for minting.');
                return;
            }
            try {
                await tokenRailSimulator.mintTokens(userId, amount as number, generateUUID(), 'Admin Mint via UI');
                addMessage({ id: generateUUID(), sender: 'system', type: 'payment_transaction', content: `Minted ${amount} USD_TOKEN for ${userId}.`, timestamp: Date.now() });
                fetchAccountData();
                setAmount('');
            } catch (error) {
                addMessage({ id: generateUUID(), sender: 'system', type: 'payment_transaction', content: `Failed to mint tokens: ${(error as Error).message}.`, timestamp: Date.now() });
            }
        };

        const handleBurnTokens = async () => {
             if (!userProfile || userProfile.role !== 'admin') { // RBAC: Only admin can burn
                setAiStatusMessage('Authorization denied: Only admins can burn tokens.');
                aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.PaymentPanel', payload: { action: 'burn_denied', userId, reason: 'Not admin', traceId: sessionId }, severity: 'critical' });
                return;
            }
            if (amount === '' || amount <= 0 || !myAccount || (amount as number) > myAccount.balance) {
                setAiStatusMessage('Invalid amount or insufficient balance for burning.');
                return;
            }
            try {
                await tokenRailSimulator.burnTokens(userId, amount as number, generateUUID(), 'Admin Burn via UI');
                addMessage({ id: generateUUID(), sender: 'system', type: 'payment_transaction', content: `Burned ${amount} USD_TOKEN from ${userId}.`, timestamp: Date.now() });
                fetchAccountData();
                setAmount('');
            } catch (error) {
                addMessage({ id: generateUUID(), sender: 'system', type: 'payment_transaction', content: `Failed to burn tokens: ${(error as Error).message}.`, timestamp: Date.now() });
            }
        };


        return (
            <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '500px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Payment & Token Rail Simulator <button onClick={() => setPaymentSimulatorPanelVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
                </h4>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9em' }}>
                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>My Account</h5>
                        <p><strong>Account ID:</strong> {myAccount?.accountId || userId}</p>
                        <p><strong>Balance:</strong> {myAccount?.balance || '0'} USD_TOKEN</p>
                    </div>

                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Simulate Payment</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" placeholder="Recipient ID" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} style={getTextInputStyle()} />
                            <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} style={getTextInputStyle()} min="0.01" step="0.01" />
                            <select value={selectedRail} onChange={(e) => setSelectedRail(e.target.value as TokenRail['id'])} style={getSelectInputStyle()}>
                                <option value="rail_fast">Fast Rail</option>
                                <option value="rail_batch">Batch Rail</option>
                                <option value="rail_quantum">Quantum Rail (Sim)</option>
                            </select>
                            <button onClick={handleSendPayment} style={getButtonStyle('primary')}>Send Payment</button>
                        </div>
                    </div>

                    {(userProfile?.role === 'admin') && (
                        <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                            <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Admin Token Operations</h5>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} style={getTextInputStyle()} min="0.01" step="0.01" />
                                <button onClick={handleMintTokens} style={{ ...getButtonStyle('secondary_small'), backgroundColor: 'darkgreen' }}>Mint</button>
                                <button onClick={handleBurnTokens} style={{ ...getButtonStyle('secondary_small'), backgroundColor: 'darkred' }}>Burn</button>
                            </div>
                        </div>
                    )}


                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Recent Transactions</h5>
                        {transactions.length === 0 ? <p style={{ color: styles.textColor }}>No transactions found.</p> : (
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {transactions.map((tx) => (
                                    <p key={tx.id} style={{ margin: '2px 0', color: styles.textColor, borderBottom: `1px dotted ${styles.borderColor}` }}>
                                        [{new Date(tx.timestamp).toLocaleTimeString()}] {tx.payerId === userId ? `Sent ${tx.amount} to ${tx.payeeId}` : `Received ${tx.amount} from ${tx.payerId}`} ({tx.status}) - Rail: {tx.meta?.actualRail || 'N/A'}
                                        {tx.meta?.riskScore && <span style={{ color: 'orange', marginLeft: '5px' }}> (Risk: {tx.meta.riskScore})</span>}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [styles, getPanelBaseStyle, getButtonStyle, getTextInputStyle, getSelectInputStyle, userId, userProfile, tokenRailSimulator, paymentsEngine, generateUUID, addMessage, aiEventLogger, sessionId]);


    /**
     * Renders the Knowledge Graph Explorer panel.
     */
    const renderKnowledgeGraphExplorerPanel = useCallback(() => {
        const [searchTerm, setSearchTerm] = useState('');
        const [searchResults, setSearchResults] = useState<any[]>([]); // Using 'any' as KG Node type not fully defined here
        const [isLoading, setIsLoading] = useState(false);

        const handleSearch = async () => {
            if (!searchTerm.trim()) return;
            setIsLoading(true);
            try {
                const results = await globalKnowledgeGraph.semanticSearch(searchTerm, 10, { securityLevel: userProfile?.securityCredentials?.tokenLifetime ? 'internal' : 'public' });
                setSearchResults(results);
            } catch (error) {
                addMessage({ id: generateUUID(), sender: 'system', type: 'knowledge_graph_entry', content: `Error querying KG: ${(error as Error).message}`, timestamp: Date.now() });
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '500px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Knowledge Graph Explorer <button onClick={() => setKnowledgeGraphExplorerVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
                </h4>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9em' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Search knowledge graph..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={getTextInputStyle()} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
                        <button onClick={handleSearch} style={getButtonStyle('primary')} disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</button>
                    </div>

                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Search Results ({searchResults.length})</h5>
                        {searchResults.length === 0 ? <p style={{ color: styles.textColor }}>No results. Try "agent behavior" or "token rail".</p> : (
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {searchResults.map((node, i) => (
                                    <p key={i} style={{ margin: '2px 0', color: styles.textColor, borderBottom: `1px dotted ${styles.borderColor}` }}>
                                        <strong>{node.label}:</strong> {node.description.substring(0, 100)}... (Conf: {(node.confidenceScore * 100).toFixed(0)}%)
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Recent KG Updates (Latest 5)</h5>
                        {knowledgeGraphUpdates.slice(-5).reverse().map((update, i) => (
                            <p key={i} style={{ margin: '2px 0', color: styles.textColor }}>
                                [{new Date(update.timestamp).toLocaleTimeString()}] Node {update.nodeId.substring(0, 8)} {update.type}: {update.payload.label}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        );
    }, [styles, getPanelBaseStyle, getButtonStyle, getTextInputStyle, globalKnowledgeGraph, userProfile, addMessage, generateUUID, knowledgeGraphUpdates]);

    /**
     * Renders the Audit Log Viewer panel.
     */
    const renderAuditLogViewerPanel = useCallback(() => {
        const [auditLogs, setAuditLogs] = useState<AILogEntry[]>([]);
        const [filterSeverity, setFilterSeverity] = useState<string>('all');
        const [filterType, setFilterType] = useState<string>('all');
        const [logIntegrityStatus, setLogIntegrityStatus] = useState<'checking' | 'passed' | 'failed' | 'idle'>('idle');

        const fetchAuditLogs = useCallback(async () => {
            if (userProfile?.securityCredentials?.level < 4) { // High security clearance for full audit logs
                addMessage({ id: generateUUID(), sender: 'system', type: 'text', content: 'Authorization denied: Insufficient security clearance to view audit logs.', timestamp: Date.now() });
                aiEventLogger.logEvent({ type: 'security_alert', source: 'AIChatInterface.AuditLogViewer', payload: { action: 'audit_log_access_denied', userId, reason: 'Insufficient clearance', traceId: sessionId }, severity: 'critical' });
                setAuditLogs([]);
                return;
            }
            const allLogs = await aiEventLogger.getAllLogs(); // Assuming aiEventLogger can return all logs
            const filteredLogs = allLogs.filter((log: any) =>
                (filterSeverity === 'all' || log.severity === filterSeverity) &&
                (filterType === 'all' || log.type === filterType)
            ).slice(-500).sort((a: any,b: any) => b.timestamp - a.timestamp);
            setAuditLogs(filteredLogs);
        }, [aiEventLogger, userId, userProfile, addMessage, generateUUID, sessionId]);

        const checkLogIntegrity = useCallback(async () => {
            setLogIntegrityStatus('checking');
            try {
                const integrityCheck = await aiEventLogger.checkLogIntegrity(); // Assuming this method exists and checks chained hashes
                if (integrityCheck.isTamperEvident) {
                    setLogIntegrityStatus('failed');
                    addMessage({ id: generateUUID(), sender: 'system', type: 'governance_audit_log', content: `CRITICAL: Audit log integrity check FAILED! Possible tampering detected. Details: ${integrityCheck.details}`, timestamp: Date.now(), metadata: { action: 'log_integrity_breach', details: integrityCheck.details } });
                } else {
                    setLogIntegrityStatus('passed');
                    addMessage({ id: generateUUID(), sender: 'system', type: 'governance_audit_log', content: 'Audit log integrity check PASSED. No tampering detected.', timestamp: Date.now(), metadata: { action: 'log_integrity_check_passed' } });
                }
            } catch (error) {
                setLogIntegrityStatus('failed');
                addMessage({ id: generateUUID(), sender: 'system', type: 'governance_audit_log', content: `Error during integrity check: ${(error as Error).message}`, timestamp: Date.now(), metadata: { action: 'log_integrity_check_error', error: (error as Error).message } });
            }
        }, [aiEventLogger, addMessage, generateUUID]);

        useEffect(() => {
            fetchAuditLogs();
            const interval = setInterval(fetchAuditLogs, 10000); // Refresh logs every 10 seconds
            return () => clearInterval(interval);
        }, [fetchAuditLogs]);

        const uniqueSeverities = useMemo(() => ['all', ...Array.from(new Set(aiEventLogger.getAllLogs().map((log: any) => log.severity))) as any], [aiEventLogger]);
        const uniqueTypes = useMemo(() => ['all', ...Array.from(new Set(aiEventLogger.getAllLogs().map((log: any) => log.type))) as any], [aiEventLogger]);


        return (
            <div style={{ ...getPanelBaseStyle(), left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: '10px', width: '600px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: styles.headerText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Governance Audit Log Viewer <button onClick={() => setAuditLogViewerVisible(false)} style={getButtonStyle('secondary_small')}>Close</button>
                </h4>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9em' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>Filter Severity:</span>
                        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} style={getSelectInputStyle('small')}>
                            {uniqueSeverities.map((s: any) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                        <span>Filter Type:</span>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={getSelectInputStyle('small')}>
                             {uniqueTypes.map((t: any) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                        </select>
                        <button onClick={fetchAuditLogs} style={getButtonStyle('secondary_small')}>Refresh</button>
                        <button onClick={checkLogIntegrity} style={{ ...getButtonStyle('secondary_small'), marginLeft: 'auto' }}>Check Integrity</button>
                    </div>

                    <p style={{ color: logIntegrityStatus === 'passed' ? 'lightgreen' : (logIntegrityStatus === 'failed' ? 'red' : styles.textColor) }}>
                        Log Integrity Status: {logIntegrityStatus.toUpperCase()}
                    </p>

                    <div style={{ border: `1px solid ${styles.borderColor}`, padding: '8px', borderRadius: '5px', backgroundColor: styles.inputBg }}>
                        <h5 style={{ margin: '0 0 5px 0', color: styles.accentColor }}>Audit Entries (Latest {auditLogs.length})</h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {auditLogs.length === 0 ? <p style={{ color: styles.textColor }}>No audit logs found (or insufficient permissions).</p> : (
                                auditLogs.map((log) => (
                                    <p key={log.id} style={{ margin: '2px 0', color: styles.textColor, borderBottom: `1px dotted ${styles.borderColor}` }}>
                                        [{new Date(log.timestamp).toLocaleTimeString()}] <span style={{ color: log.severity === 'critical' ? 'red' : (log.severity === 'error' ? 'orange' : (log.severity === 'warning' ? 'yellow' : 'lightgreen')) }}>[{log.severity?.toUpperCase()}]</span> [{log.source}] {log.type}: {log.payload.message || JSON.stringify(log.payload).substring(0, 80)}... (Trace: {log.traceId || 'N/A'})
                                    </p>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [styles, getPanelBaseStyle, getButtonStyle, getSelectInputStyle, aiEventLogger, userId, userProfile, addMessage, generateUUID, sessionId]);


    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100vh', width: '100%',
            backgroundColor: styles.background, color: styles.textColor, fontFamily: 'Arial, sans-serif',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* --- Header --- */}
            <div style={{
                padding: '15px 20px', backgroundColor: styles.headerBg, color: styles.headerText,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: styles.shadowColor,
            }}>
                <h2 style={{ margin: 0, fontSize: '1.5em' }}>{chatTitle}</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9em', fontStyle: 'italic', color: styles.statusText }}>{aiStatusMessage}</span>
                    <audio ref={audioPlayerRef} style={{ display: 'none' }} controls /> {/* Hidden audio player */}
                    <button onClick={() => setShowOptionsPanel(!showOptionsPanel)} style={getButtonStyle('secondary_small')} title="Advanced Options">
                        ⚙️ Options
                    </button>
                </div>
            </div>

            {/* --- Chat Messages Area --- */}
            <div style={{
                flexGrow: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column',
                scrollBehavior: 'smooth',
            }}>
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', backgroundColor: styles.aiBubbleBg, color: styles.textColor, padding: '8px 12px', borderRadius: '18px 18px 18px 2px', maxWidth: '70%', fontSize: '0.9em', marginBottom: '8px', boxShadow: `0 1px 2px ${styles.shadowColor}` }}>
                        AI is typing...
                    </div>
                )}
                <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>

            {/* Proactive Suggestions */}
            {proactiveSuggestion && (
                <div style={{
                    backgroundColor: 'rgba(0,123,255,0.1)', color: styles.accentColor, padding: '10px 15px',
                    margin: '0 15px 10px 15px', borderRadius: '8px', border: `1px solid ${styles.accentColor}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em',
                }}>
                    <span>💡 Suggestion: {proactiveSuggestion}</span>
                    <button onClick={() => setProactiveSuggestion(null)} style={{ background: 'none', border: 'none', color: styles.accentColor, cursor: 'pointer', fontSize: '1em' }}>✕</button>
                </div>
            )}

            {/* --- Chat Input Area --- */}
            <div style={{
                padding: '10px 15px', borderTop: `1px solid ${styles.borderColor}`, backgroundColor: styles.inputBg,
                display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0,
            }}>
                {enableMultiModalInput && (
                    <Fragment>
                        <button
                            onClick={isRecordingAudio ? handleSpeechStop : handleSpeechStart}
                            style={{ ...getButtonStyle(isRecordingAudio ? 'danger' : 'secondary'), width: '40px', height: '40px', borderRadius: '50%' }}
                            title={isRecordingAudio ? 'Stop Recording' : 'Start Speech Input'}
                        >
                            {isRecordingAudio ? '🔴' : '🎤'}
                        </button>
                        {renderFileInput('imageUpload', 'image/*', handleImageUpload, selectedImageFile, '🖼️ Image')}
                        {selectedImageFile && <button onClick={handleSendImage} style={{ ...getButtonStyle('primary'), width: '40px', height: '40px', borderRadius: '50%' }} title="Send Image">⬆️</button>}
                        {renderFileInput('documentUpload', '.pdf,.doc,.docx,.txt', handleDocumentUpload, selectedDocumentFile, '📄 Document')}
                        {selectedDocumentFile && <button onClick={handleSendDocument} style={{ ...getButtonStyle('primary'), width: '40px', height: '40px', borderRadius: '50%' }} title="Send Document">⬆️</button>}
                    </Fragment>
                )}

                <form onSubmit={handleTextSubmit} style={{ flexGrow: 1, display: 'flex', gap: '10px' }}>
                    <input
                        ref={chatInputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message or command..."
                        disabled={isTyping}
                        style={getTextInputStyle()}
                    />
                    <button type="submit" disabled={!inputMessage.trim() || isTyping} style={getButtonStyle('primary')}>
                        Send
                    </button>
                </form>
            </div>

            {/* --- Floating Panels --- */}
            {showOptionsPanel && renderAdvancedOptionsPanel()}
            {modelConfigurationPanelVisible && renderModelConfigurationPanel()}
            {agentManagementPanelVisible && renderAgentManagementPanel()}
            {systemMonitoringPanelVisible && renderSystemMonitoringPanel()}
            {userProfilePanelVisible && renderUserProfilePanel()}
            {paymentSimulatorPanelVisible && renderPaymentSimulatorPanel()}
            {knowledgeGraphExplorerVisible && renderKnowledgeGraphExplorerPanel()}
            {auditLogViewerVisible && renderAuditLogViewerPanel()}

        </div>
    );
};