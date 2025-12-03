import { ChatMessageType } from '@/components/chat/ChatMessage';

export interface ChatRequest {
  message: string;
  tenantId: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  debug?: any;
}

class ChatService {
  /**
   * Envía un mensaje al asistente de IA
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include' // Importante para enviar cookies
      });

      const data = await response.json();
      return data;

    } catch (error: any) {
      console.error('Chat service error:', error);

      return {
        success: false,
        message: 'Error de conexión con el servidor',
        error: error.message
      };
    }
  }

  /**
   * Verifica si el servicio de IA está disponible
   */
  async checkHealth(): Promise<{ available: boolean; service: string; model: string | null }> {
    try {
      const response = await fetch('/api/chat');
      return await response.json();
    } catch (error) {
      return {
        available: false,
        service: 'AI Chat Assistant',
        model: null
      };
    }
  }
}

export const chatService = new ChatService();
