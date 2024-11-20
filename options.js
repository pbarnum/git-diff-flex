// Saves options to chrome.storage
const saveOptions = () => {
  const toggleEl = document.getElementById("toggle-buttons");
  const toggleButtons = toggleEl.checked;
  const wordWrapEl = document.getElementById("word-wrap");
  let wordWrap = wordWrapEl.checked;

  if (!toggleButtons) {
    wordWrap = false;
    document.getElementById("word-wrap").checked = false;
    document.getElementById("word-wrap").disabled = true;
  } else {
    document.getElementById("word-wrap").disabled = false;
  }

  chrome.storage.sync.set(
    {
      toggleButtons,
      wordWrap,
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Settings updated!";
      status.classList.add("success");
      setTimeout(() => {
        status.textContent = "";
        status.classList.remove("success");
      }, 2000);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { toggleButtons: true, wordWrap: true },
    (items) => {
      if (items.toggleButtons === undefined) {
        items.toggleButtons = true;
        chrome.storage.sync.set({ toggleButtons: items.toggleButtons });
      }

      if (items.wordWrap === undefined) {
        items.wordWrap = true;
        chrome.storage.sync.set({ wordWrap: items.wordWrap });
      }

      document.getElementById("toggle-buttons").checked = items.toggleButtons === true;
      document.getElementById("word-wrap").checked = items.wordWrap === true;
    }
  );
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelectorAll("input").forEach((el) => el.addEventListener("change", saveOptions));
