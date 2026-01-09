const STORAGE_KEY = 'focusExtensionEnabled';

const toggleButton = document.getElementById('toggleButton');
const statusText = document.getElementById('statusText');

// Initialize the UI with current state
async function initializeUI() {
  try {
    const isEnabled = await getExtensionState();
    updateUI(isEnabled);
  } catch (error) {
    console.error('Failed to initialize UI:', error);
    // Default to enabled if there's an error
    updateUI(true);
  }
}

// Get the extension state from storage
async function getExtensionState() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        // Default to enabled if not set
        const isEnabled = result[STORAGE_KEY] !== false;
        resolve(isEnabled);
      });
    } catch (error) {
      console.error('Error accessing storage:', error);
      reject(error);
    }
  });
}

// Update the UI to reflect the current state
function updateUI(isEnabled) {
  if (isEnabled) {
    toggleButton.classList.add('active');
    statusText.textContent = 'Enabled';
    statusText.classList.remove('disabled');
    statusText.classList.add('enabled');
  } else {
    toggleButton.classList.remove('active');
    statusText.textContent = 'Disabled';
    statusText.classList.remove('enabled');
    statusText.classList.add('disabled');
  }
}

// Handle toggle button click
toggleButton.addEventListener('click', async () => {
  const currentState = await getExtensionState();
  const newState = !currentState;
  
  // Save the new state
  chrome.storage.local.set({ [STORAGE_KEY]: newState }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to save state:', chrome.runtime.lastError);
      return;
    }
    updateUI(newState);
    // Notify content scripts about the state change
    chrome.tabs.query({ url: ['https://www.youtube.com/*', 'https://www.youtube.com/shorts/*'] }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'extensionStateChanged',
          enabled: newState
        }).catch(() => {
          // Ignore errors if content script is not ready
        });
      });
    });
  });
});

// Initialize when popup opens
initializeUI();
