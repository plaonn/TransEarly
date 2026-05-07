// Queue for batching translation requests
let textQueue: { node: Text, text: string }[] = [];
let batchTimeout: number | null = null;
const BATCH_DELAY = 500; // ms

// Tags to ignore during text extraction
const IGNORE_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'CODE', 'PRE']);

function isTranslatingElement(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    return el.classList && el.classList.contains('transearly-translated');
  }
  return false;
}

function processTextNode(node: Text) {
  const text = node.nodeValue?.trim();
  if (!text || text.length < 2) return;
  
  const parent = node.parentElement;
  if (!parent || IGNORE_TAGS.has(parent.tagName) || isTranslatingElement(parent)) {
    return;
  }

  // Prevent processing the same node multiple times
  if ((node as any)._transearlyProcessed) return;
  (node as any)._transearlyProcessed = true;

  textQueue.push({ node, text });

  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  
  batchTimeout = window.setTimeout(() => {
    flushQueue();
  }, BATCH_DELAY);
}

function flushQueue() {
  if (textQueue.length === 0) return;

  const currentBatch = [...textQueue];
  textQueue = [];

  const texts = currentBatch.map(item => item.text);

  chrome.runtime.sendMessage({ type: 'TRANSLATE_BATCH', texts }, (response: any) => {
    if (chrome.runtime.lastError) {
      console.error('TransEarly: Runtime error', chrome.runtime.lastError);
      return;
    }

    if (response && response.success && response.translations) {
      response.translations.forEach((translatedText: string, index: number) => {
        const { node } = currentBatch[index];
        injectTranslatedNode(node, translatedText);
      });
    } else {
      console.error('TransEarly: Translation failed', response?.error);
    }
  });
}

function injectTranslatedNode(originalNode: Text, translatedText: string) {
  const parent = originalNode.parentElement;
  if (!parent) return;

  // Extract original styles
  const computedStyle = window.getComputedStyle(parent);
  
  const span = document.createElement('span');
  span.className = 'transearly-translated';
  // Use innerHTML since Google Translate API might return HTML entities like &#39;
  span.innerHTML = ` ${translatedText} `;
  
  // Apply style cloning and visual distinction
  span.style.fontFamily = computedStyle.fontFamily;
  span.style.fontSize = computedStyle.fontSize;
  span.style.color = computedStyle.color;
  span.style.lineHeight = computedStyle.lineHeight;
  span.style.border = '1px dashed rgba(0,0,0,0.3)';
  span.style.borderRadius = '3px';
  span.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
  span.style.margin = '0 4px';
  span.style.padding = '2px';
  span.style.display = 'inline-block'; // Better layout for border

  // Insert next to original node
  if (originalNode.nextSibling) {
    parent.insertBefore(span, originalNode.nextSibling);
  } else {
    parent.appendChild(span);
  }
}

function traverseDOM(root: Node) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (parent && (IGNORE_TAGS.has(parent.tagName) || isTranslatingElement(parent))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    processTextNode(node as Text);
  }
}

// Initial Run
traverseDOM(document.body);

// Dynamic Content Handling via MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!isTranslatingElement(node)) {
          traverseDOM(node);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node as Text);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
