chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'TRANSLATE_BATCH') {
    handleTranslation(message.texts)
      .then((translatedTexts) => {
        sendResponse({ success: true, translations: translatedTexts });
      })
      .catch((error) => {
        console.error('Translation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function handleTranslation(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const data = await chrome.storage.sync.get(['apiKey']);
  const apiKey = data.apiKey;

  if (!apiKey) {
    throw new Error('API Key is not configured.');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: texts,
      target: 'ko'
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed with status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.data && result.data.translations) {
    // API returns array of objects: { translatedText: string, detectedSourceLanguage: string }
    return result.data.translations.map((t: any) => t.translatedText);
  }

  throw new Error('Invalid API response format');
}
