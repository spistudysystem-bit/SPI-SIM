export async function askPhysicsAI(
  question: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Uplink to academic core failed.");
  }

  const data = await response.json();
  return data.text;
}
