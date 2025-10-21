import OpenAI from 'openai';

// Explicitly define the environment interface
interface WorkerEnv {
  OPENAI_API_KEY: string;
}

type TargetLang = 'en' | 'fr' | 'es' | 'ja' | 'ar';
const langName: Record<TargetLang, string> = { 
  en: 'English', 
  fr: 'French', 
  es: 'Spanish', 
  ja: 'Japanese',
  ar: 'Arabic'
};

const getLanguageInstructions = (targetLang: TargetLang): string => {
  const baseInstructions = `You are a helpful AI assistant. You MUST respond ONLY in ${langName[targetLang]}. Do not use any other language. Always respond in ${langName[targetLang]} regardless of what language the user writes in. Maintain conversational context and handle follow-up questions naturally, but always in ${langName[targetLang]}.`;
  
  const specificInstructions: Record<TargetLang, string> = {
    en: "Respond in English only. Use proper English grammar and vocabulary.",
    fr: "Répondez uniquement en français. Utilisez une grammaire et un vocabulaire français corrects.",
    es: "Responde únicamente en español. Usa gramática y vocabulario español correctos.",
    ja: "日本語でのみ回答してください。正しい日本語の文法と語彙を使用してください。",
    ar: "أجب باللغة العربية فقط. استخدم قواعد اللغة العربية والمفردات الصحيحة."
  };
  
  return `${baseInstructions} ${specificInstructions[targetLang]}`;
};

// In-memory conversation storage
interface Conversation {
  responseIds: string[];
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const conversations = new Map<string, Conversation>();


// Handler functions for each endpoint

const handleStartConversation = async (request: Request, env: WorkerEnv): Promise<Response> => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  conversations.set(sessionId, {
    responseIds: [],
    messages: []
  });
  return new Response(JSON.stringify({ sessionId }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
};

const handleMessage = async (request: Request, env: WorkerEnv): Promise<Response> => {
  const { sessionId, message, targetLang, temperature = 0.3, maxTokens = 128 } = await request.json() as {
    sessionId: string;
    message: string;
    targetLang: TargetLang;
    temperature?: number;
    maxTokens?: number;
  };
  
  if (!sessionId || !message || !targetLang || !(targetLang in langName)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  if (!env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server missing OpenAI API key' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const conversation = conversations.get(sessionId);
  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { 
      status: 404, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  conversation.messages.push({ role: 'user', content: message });

  const previousResponseId = conversation.responseIds[conversation.responseIds.length - 1] || null;

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    temperature,
    max_output_tokens: maxTokens,
    instructions: getLanguageInstructions(targetLang),
    input: `User message: ${message}\n\nPlease respond in ${langName[targetLang as TargetLang]} only.`,
    previous_response_id: previousResponseId,
    store: true
  });
  const assistantMessage = (response as any).output_text?.trim?.() ?? '';
  
  conversation.responseIds.push((response as any).id);
  conversation.messages.push({ role: 'assistant', content: assistantMessage });

  return new Response(JSON.stringify({ message: assistantMessage, responseId: (response as any).id }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
};

const handleStreamMessage = async (request: Request, env: WorkerEnv): Promise<Response> => {
  const { sessionId, message, targetLang, temperature = 0.3, maxTokens = 128 } = await request.json() as {
    sessionId: string;
    message: string;
    targetLang: TargetLang;
    temperature?: number;
    maxTokens?: number;
  };
  
  if (!sessionId || !message || !targetLang || !(targetLang in langName)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  if (!env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server missing OpenAI API key' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const conversation = conversations.get(sessionId);
  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { 
      status: 404, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  conversation.messages.push({ role: 'user', content: message });

  const previousResponseId = conversation.responseIds[conversation.responseIds.length - 1] || null;

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullResponse = '';
      let responseId = '';

      try {
        const openaiStream = await openai.responses.create({
          stream: true,
          model: 'gpt-4o-mini',
          temperature,
          max_output_tokens: maxTokens,
          instructions: getLanguageInstructions(targetLang),
          input: `User message: ${message}\n\nPlease respond in ${langName[targetLang as TargetLang]} only.`,
          previous_response_id: previousResponseId,
          store: true
        });

        for await (const event of openaiStream) {
          if (event.type === 'response.created') {
            responseId = (event as any).response?.id || '';
          }

          if (event.type === 'response.output_text.delta' && event.delta) {
            fullResponse += event.delta;
            controller.enqueue(encoder.encode(event.delta));
          }
          
          if (event.type === 'response.output_text.done') {
            controller.close();
            break;
          }
          
          if ('response' in event && event.response?.error) {
            console.error('Stream error:', event.response.error);
            controller.error(new Error('Stream error'));
            return;
          }
        }

        if (responseId) {
          conversation.responseIds.push(responseId);
          conversation.messages.push({ role: 'assistant', content: fullResponse });
        }
      } catch (error) {
        console.error('Streaming error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(stream, { 
    headers: { 
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    } 
  });
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper function to add CORS headers to responses
const addCorsHeaders = (response: Response): Response => {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    try {
      // Route to appropriate handler
      if (path === '/api/conversation/start' && method === 'POST') {
        return addCorsHeaders(await handleStartConversation(request, env as WorkerEnv));
      }

      if (path === '/api/conversation/message' && method === 'POST') {
        return addCorsHeaders(await handleMessage(request, env as WorkerEnv));
      }

      if (path === '/api/conversation/message/stream' && method === 'POST') {
        return addCorsHeaders(await handleStreamMessage(request, env as WorkerEnv));
      }

      // Default response for unmatched routes
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      }));

    } catch (error) {
      console.error('Worker error:', error);
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Internal server error' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }));
    }
	},
} satisfies ExportedHandler<Env>;
