const saveOptions = () => {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  
  if (apiKeyInput) {
    const key = apiKeyInput.value.trim();
    chrome.storage.sync.set({ apiKey: key }, () => {
      statusElement.textContent = 'Settings saved successfully!';
      setTimeout(() => {
        statusElement.textContent = '';
      }, 2000);
    });
  }
};

const restoreOptions = () => {
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  
  chrome.storage.sync.get(['apiKey'], (result: { apiKey?: string }) => {
    if (result.apiKey && apiKeyInput) {
      apiKeyInput.value = result.apiKey;
    }
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
  saveBtn.addEventListener('click', saveOptions);
}
