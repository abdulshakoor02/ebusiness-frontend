"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export default function AIChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("ai_chat_history");
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            } catch (error) {
                console.error("Failed to parse chat history:", error);
            }
        }
    }, []);

    // Save to localStorage when messages change
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("ai_chat_history", JSON.stringify(messages));
        }
    }, [messages, isMounted]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleClear = () => {
        setMessages([]);
        localStorage.removeItem("ai_chat_history");
        toast.success("Chat history cleared.");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const currentMsg: ChatMessage = { role: "user", content: trimmed };
        const updatedMessages = [...messages, currentMsg];
        
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await apiClient.post("/ai/chat", {
                message: trimmed,
                history: messages
            });
            
            if (res.data?.data?.answer) {
                const assistantMsg: ChatMessage = { 
                    role: "assistant", 
                    content: res.data.data.answer 
                };
                setMessages((prev) => [...prev, assistantMsg]);
            } else {
                toast.error("Received empty response from AI.");
            }
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            toast.error(error.response?.data?.error || "Failed to communicate with AI.");
            // We can optionally pop the user's message out of history on failure, 
            // but usually it's fine to keep it so they know what they asked.
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        return null; // Avoid hydration mismatch
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        AI Assistant
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Ask natural language questions about your CRM data.
                    </p>
                </div>
                {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Chat
                    </Button>
                )}
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-background/50 border-border/50 backdrop-blur-sm relative">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">How can I help you today?</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Ask me about your sales, recent appointments, active leads, or any other metrics tracked in the CRM.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm w-full max-w-2xl">
                            <Button variant="outline" className="h-auto whitespace-normal p-4 justify-start text-left" onClick={() => setInput("What's the sales this month?")}>
                                What's the sales this month?
                            </Button>
                            <Button variant="outline" className="h-auto whitespace-normal p-4 justify-start text-left" onClick={() => setInput("How many appointments were booked recently?")}>
                                How many appointments were booked recently?
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "assistant" && (
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                    msg.role === "user" 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-muted text-foreground rounded-bl-none border border-border/50"
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                                {msg.role === "user" && (
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary border border-secondary flex items-center justify-center">
                                        <User className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-muted text-foreground rounded-bl-none border border-border/50 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
                
                <div className="p-4 bg-background border-t border-border">
                    <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto relative">
                        <Input
                            placeholder="Ask anything about your data..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 pr-12 rounded-full h-12 bg-muted/50 border-input hover:border-accent focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                    <p className="text-center text-xs text-muted-foreground mt-3">
                        AI answers are generated based on your tenant's data.
                    </p>
                </div>
            </Card>
        </div>
    );
}
