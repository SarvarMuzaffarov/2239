export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export async function sendAiChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  // Exclude error messages and system greetings from history payload
  const formattedHistory = history
    .filter(item => !item.isError && item.text && !item.text.includes("vaqtinchalik muammo") && !item.text.includes("xatolik yuz berdi"))
    .map(item => ({
      role: item.role,
      text: item.text,
    }));

  const payload = JSON.stringify({
    message,
    history: formattedHistory,
  });

  const makeRequest = async (): Promise<Response> => {
    return fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });
  };

  let res: Response;
  try {
    res = await makeRequest();
  } catch (netErr) {
    // Retry once after 800ms on network hiccup
    await new Promise(r => setTimeout(r, 800));
    res = await makeRequest();
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.reply || errorData?.error || "AI xizmati bilan bog'lanishda xatolik yuz berdi."
    );
  }

  const data = await res.json();
  return data.reply || "Kechirasiz, javob matni qabul qilinmadi.";
}
