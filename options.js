// Saves options to chrome.storage
const saveOptions = () => {
  const toggleButtons = document.getElementById("toggle-buttons").value;
  const wordWrap = document.getElementById("word-wrap").value;

  chrome.storage.sync.set(
    {
      toggleButtons,
      wordWrap,
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 750);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    { toggleButtons: "enabled", wordWrap: "enabled" },
    (items) => {
      if (items.toggleButtons === "") {
        items.toggleButtons = "enabled";
        chrome.storage.sync.set({ toggleButtons: items.toggleButtons });
      }

      if (items.wordWrap === "") {
        items.wordWrap = "enabled";
        chrome.storage.sync.set({ wordWrap: items.wordWrap });
      }

      document.getElementById("toggle-buttons").value = items.toggleButtons;
      document.getElementById("word-wrap").value = items.wordWrap;
    }
  );
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
