/**
 * Agent-to-Agent Communication System
 * Enables persistent conversations between Mene Portal agents
 */

class AgentCommunicationSystem {
    constructor(ltmBridge) {
        this.ltmBridge = ltmBridge;
        this.activeConversations = new Map();
        this.communicationHistory = [];
    }

    /**
     * Route message between agents
     */
    async routeAgentMessage(fromAgent, toAgent, message, context = {}) {
        console.log(`📨 Agent Communication: ${fromAgent} → ${toAgent}`);
        
        try {
            // Create communication context
            const commContext = {
                ...context,
                fromAgent: fromAgent,
                toAgent: toAgent,
                timestamp: new Date().toISOString(),
                communicationId: this.generateCommId()
            };

            // Process message through target agent
            const response = await this.ltmBridge.processAgentQuery(
                toAgent,
                `Message from ${fromAgent}: ${message}`,
                commContext
            );

            // Save the communication to memory
            await this.saveCommunication(fromAgent, toAgent, message, response, commContext);

            // Track active conversation
            this.trackConversation(fromAgent, toAgent, message, response);

            return {
                status: 'ok',
                fromAgent: fromAgent,
                toAgent: toAgent,
                originalMessage: message,
                response: response,
                communicationId: commContext.communicationId
            };

        } catch (error) {
            console.error('Agent communication error:', error);
            return {
                status: 'error',
                error: error.message,
                fromAgent: fromAgent,
                toAgent: toAgent
            };
        }
    }

    /**
     * Orchestrate multi-agent conversation
     */
    async orchestrateMultiAgentDiscussion(topic, participants, moderator = 'mene') {
        console.log(`🎭 Multi-Agent Discussion: ${topic}`);
        console.log(`👥 Participants: ${participants.join(', ')}`);
        console.log(`🎯 Moderator: ${moderator}`);

        const discussion = {
            id: this.generateCommId(),
            topic: topic,
            participants: participants,
            moderator: moderator,
            exchanges: [],
            startTime: new Date().toISOString()
        };

        try {
            // Moderator initiates discussion
            const initMessage = `Let's discuss: ${topic}. I'd like each of you to share your perspective based on your specialties.`;
            
            // Get initial responses from each participant
            for (const participant of participants) {
                if (participant !== moderator) {
                    const response = await this.routeAgentMessage(
                        moderator,
                        participant,
                        initMessage,
                        { 
                            discussionId: discussion.id,
                            phase: 'initial_response',
                            topic: topic
                        }
                    );
                    
                    discussion.exchanges.push({
                        phase: 'initial_response',
                        from: moderator,
                        to: participant,
                        message: initMessage,
                        response: response.response,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Allow agents to respond to each other
            for (let round = 0; round < 2; round++) {
                console.log(`🔄 Discussion Round ${round + 1}`);
                
                for (let i = 0; i < participants.length; i++) {
                    const currentAgent = participants[i];
                    const nextAgent = participants[(i + 1) % participants.length];
                    
                    if (currentAgent !== nextAgent) {
                        // Get the latest context from discussion
                        const contextMessage = this.buildDiscussionContext(discussion, currentAgent, nextAgent);
                        
                        const response = await this.routeAgentMessage(
                            currentAgent,
                            nextAgent,
                            contextMessage,
                            {
                                discussionId: discussion.id,
                                phase: `round_${round + 1}`,
                                topic: topic
                            }
                        );

                        discussion.exchanges.push({
                            phase: `round_${round + 1}`,
                            from: currentAgent,
                            to: nextAgent,
                            message: contextMessage,
                            response: response.response,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // Moderator synthesizes final summary
            const summaryContext = this.buildDiscussionSummary(discussion);
            const finalSummary = await this.ltmBridge.processAgentQuery(
                moderator,
                `Please provide a comprehensive summary of our discussion about ${topic}, incorporating the insights from all participants.`,
                {
                    discussionId: discussion.id,
                    phase: 'final_summary',
                    fullContext: summaryContext
                }
            );

            discussion.finalSummary = finalSummary.response;
            discussion.endTime = new Date().toISOString();

            // Save complete discussion to memory
            await this.saveDiscussion(discussion);

            return {
                status: 'ok',
                discussion: discussion,
                summary: finalSummary.response
            };

        } catch (error) {
            console.error('Multi-agent discussion error:', error);
            return {
                status: 'error',
                error: error.message,
                discussion: discussion
            };
        }
    }

    /**
     * Get agent communication history
     */
    async getAgentCommunicationHistory(agent1, agent2 = null, limit = 10) {
        try {
            let history;
            
            if (agent2) {
                // Get specific agent-to-agent history
                history = this.communicationHistory.filter(comm => 
                    (comm.fromAgent === agent1 && comm.toAgent === agent2) ||
                    (comm.fromAgent === agent2 && comm.toAgent === agent1)
                );
            } else {
                // Get all communications involving agent1
                history = this.communicationHistory.filter(comm =>
                    comm.fromAgent === agent1 || comm.toAgent === agent1
                );
            }

            return {
                status: 'ok',
                history: history.slice(-limit).reverse(),
                totalCount: history.length
            };

        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Helper methods
     */
    generateCommId() {
        return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    trackConversation(fromAgent, toAgent, message, response) {
        const conversation = {
            fromAgent: fromAgent,
            toAgent: toAgent,
            message: message,
            response: response.response || response.message,
            timestamp: new Date().toISOString()
        };

        this.communicationHistory.push(conversation);

        // Keep only last 1000 communications in memory
        if (this.communicationHistory.length > 1000) {
            this.communicationHistory = this.communicationHistory.slice(-1000);
        }
    }

    async saveCommunication(fromAgent, toAgent, message, response, context) {
        // This would integrate with the memory system
        console.log(`💾 Saving communication: ${fromAgent} → ${toAgent}`);
        
        // TODO: Integrate with RAG memory system when available
        return { status: 'ok', message: 'Communication saved' };
    }

    buildDiscussionContext(discussion, fromAgent, toAgent) {
        const recentExchanges = discussion.exchanges.slice(-3);
        const contextSummary = recentExchanges.map(ex => 
            `${ex.from} to ${ex.to}: ${ex.response?.substring(0, 200) || 'No response'}...`
        ).join('\\n');

        return `Continuing our discussion about ${discussion.topic}. Recent context:\\n${contextSummary}\\n\\nWhat are your thoughts on this, and how does it relate to your expertise?`;
    }

    buildDiscussionSummary(discussion) {
        return {
            topic: discussion.topic,
            participants: discussion.participants,
            exchangeCount: discussion.exchanges.length,
            keyPoints: discussion.exchanges.map(ex => ({
                agent: ex.to,
                insight: ex.response?.substring(0, 150) || 'No response'
            }))
        };
    }

    async saveDiscussion(discussion) {
        console.log(`💾 Saving complete discussion: ${discussion.id}`);
        
        // TODO: Save to persistent storage/RAG system
        return { status: 'ok', message: 'Discussion saved' };
    }
}

module.exports = AgentCommunicationSystem;