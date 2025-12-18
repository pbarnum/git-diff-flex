(function (document) {
  /**
   * Set up configurations and automatically update when changes are detected.
   */
  const cfg = { toggleButtons: true, wordWrap: true };

  /**
   * Initialize the stored preferences.
   */
  chrome.storage.sync.get().then((items) => {
    Object.assign(cfg, items);
    applyOptions();
  });

  /**
   * Watch for changes to the user's options & apply them.
   */
  chrome.storage.onChanged.addListener((items, area) => {
    if (area === "sync" && items) {
      if (items.toggleButtons) {
        cfg.toggleButtons = items.toggleButtons.newValue;
      }
      if (items.wordWrap) {
        cfg.wordWrap = items.wordWrap.newValue;
      }
      applyOptions();
    }
  });

  /**
   * Apply the user's options to the DOM.
   */
  function applyOptions() {
    const buttons = document.querySelectorAll(`.${classes.toggleButton}`);
    for (let i = 0; i < buttons.length; ++i) {
      if (isToggleButtonsEnabled()) {
        buttons[i].classList.remove(classes.hidden);
      } else {
        buttons[i].classList.add(classes.hidden);
      }
    }

    const tables = document.querySelectorAll(`.${classes.table}`);
    for (let i = 0; i < tables.length; ++i) {
      if (!isWordWrapEnabled()) {
        tables[i].classList.add(classes.clipped);
      } else {
        tables[i].classList.remove(classes.clipped);
      }
    }
  }

  /**
   * Determines if the toggle buttons are enabled.
   */
  function isToggleButtonsEnabled() {
    return cfg.toggleButtons;
  }

  /**
   * Determines if word wrap is enabled.
   */
  function isWordWrapEnabled() {
    return cfg.wordWrap;
  }

  /**
   * Constants and known classes.
   */
  const classes = {
    handle: "gdf-handle",
    hidden: "gdf-hidden",
    file: "gdf-file",
    table: "gdf-table",
    clipped: "gdf-table-clipped",
    drag: "gdf-drag",
    toggleButton: "gdf-btn-toggle",
    toggleSplit: "gdf-btn-toggle-split",
    toggleAdditions: "gdf-btn-toggle-add",
    toggleDeletions: "gdf-btn-toggle-del",
  };

  /**
   * Known selectors within the DOM.
   */
  const selectors = {
    legacyFile: '.file',
    legacyFileHeader: ".file-info",

    file: 'div[role="region"]',
    table: 'table',
    fileHeader: "div[class*=diff-file-header] > div:last-child",
    delLine: "colgroup > col:nth-child(1)",
    delCode: "colgroup > col:nth-child(2)",
    addLine: "colgroup > col:nth-child(3)",
    addCode: "colgroup > col:nth-child(4)",
  }

  /**
   * Cache object to store per-file state.
   *
   * Example:
   *   {
   *     "file_id": {
   *       "splitWidth": "100",                   // Width of the "deletion" column in split view
   *       "buttonState": "gdf-btn-toggle-split", // Current state of the toggle button
   *       "handle": {
   *         "position": {
   *           "height": 0,
   *           "left": 0,
   *           "top": 0
   *         }
   *       }
   *     }
   *   }
   */
  const cache = {};

  /**
   * Updates the width for the "deletion" table column.
   */
  function updateSplitWidth(table, val) {
    table.querySelector(selectors.delCode).style.width = `${val}px`;
  }

  /**
   * Determines the "deletion" number column dimensions depending on the type of diff.
   */
  function getDeletionNumberColumn(table) {
    const delNumCol = table.querySelector(selectors.delLine);
    if (delNumCol) {
      return delNumCol.getBoundingClientRect();
    }

    const rect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const addNumCol = table.querySelector(selectors.addLine);
    if (addNumCol) {
      const colRect = addNumCol.getBoundingClientRect();
      rect.left = tableRect.left;
      rect.right = tableRect.left + colRect.width;
      rect.width = colRect.width;
    } else {
      rect.left = tableRect.left;
      rect.right = tableRect.left + 66;
      rect.width = 66;
    }

    return rect;
  }

  /**
   * Determines the addition column dimensions depending on the type of diff.
   */
  function getAdditionNumberColumn(table) {
    const addNumCol = table.querySelector(selectors.addLine);
    if (addNumCol) {
      return addNumCol.getBoundingClientRect();
    }

    const rect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const delNumCol = table.querySelector(selectors.delLine);
    if (delNumCol) {
      const colRect = delNumCol.getBoundingClientRect();
      rect.left = table.querySelector(selectors.delCode).getBoundingClientRect().right;
      rect.right = rect.left + colRect.width;
      rect.width = colRect.width;
    } else {
      rect.left = tableRect.left;
      rect.right = tableRect.left + 66;
      rect.width = 66;
    }

    return rect;
  }

  /**
   * Find all diff tables that have not been initialized.
   */
  function findTables() {
    const files = document.querySelectorAll(`${selectors.legacyFile},${selectors.file}`);
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];

      // Don't mark this file if it's table does not yet exist
      const table = file.querySelector(`${selectors.table}:not(.${classes.table})`);
      if (!table) {
        continue;
      }

      const handle = generateHandle(file);

      // Generate and append the "toggle" view button
      const btn = generateToggleButton(file, table, handle);

      // Restore cached column width if it exists
      const cached = cache[file.id];
      if (cached?.splitWidth) {
        updateSplitWidth(table, cached.splitWidth);
      }

      // Customize the table element
      table.classList.add(classes.table);
      if (!isWordWrapEnabled()) {
        table.classList.add(classes.clipped);
      }
      table.addEventListener("mouseenter", showHandle(file, table, handle));

      // Observe the table's resize events
      const ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
          calculateHandlePosition(file, entry.target, handle);
        }
      });

      ro.observe(table);

      // Wait for layout to complete before restoring cached position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cached = cache[file.id];
          if (cached?.handle?.position) {
            const { height, left, top } = cached.handle.position;
            if (height && left !== undefined && top !== undefined) {
              handle.style.height = `${height}px`;
              handle.style.left = `${left}px`;
              handle.style.top = `${top}px`;
            }
          } else {
            // First time, calculate default position
            calculateHandlePosition(file, table, handle);
          }
        });
      });

      // Remove the ability to drag the handle when the mouse button is up
      file.addEventListener("mouseup", function () {
        handle.classList.remove(classes.drag);
      });

      // Calculate the handle's position during the mouse move event
      file.addEventListener("mousemove", function (e) {
        // The handle will contain the "drag" class when it detects a mouse down event
        if (handle.classList.contains(classes.drag)) {
          const tableRect = table.getBoundingClientRect();
          const numColDelRect = getDeletionNumberColumn(table);
          const addNumColRect = getAdditionNumberColumn(table);
          const capLeft = numColDelRect.right;
          const capRight = tableRect.right - addNumColRect.width;

          let width = 0;
          let handleLeft = 0;

          if (e.clientX >= capRight) {
            // Stop moving if over the right cap
            handleLeft = capRight - tableRect.left;
            width = capRight - numColDelRect.right;
            toggleButtonDeletions(btn);
          } else if (e.clientX <= capLeft) {
            // Stop moving if over the left cap
            handleLeft = capLeft - tableRect.left;
            width = capLeft - numColDelRect.right;
            toggleButtonAdditions(btn);
          } else {
            handleLeft = e.clientX - tableRect.left;
            width = e.clientX - numColDelRect.right;
            toggleButtonSplit(btn);
          }

          updateSplitWidth(table, width);
          handle.style.left = `${handleLeft}px`;
          cache[file.id].splitWidth = width;

          // Last check to see if handle height is same as table height
          calculateHandlePosition(file, table, handle);
        }
      });
    }
  }

  /**
   * Builds a new toggle button to be added to the "file" element.
   */
  function generateToggleButton(file, table, handle) {
    file.querySelector(`.${classes.toggleButton}`)?.remove();

    const header = file.querySelector(`${selectors.fileHeader},${selectors.legacyFileHeader}`);
    const btn = document.createElement("button");
    btn.innerText = "Split";
    btn.classList.add("btn", "btn-sm", "btn-primary", classes.toggleButton, classes.toggleSplit);
    btn.addEventListener("click", toggleTableView(table, handle));

    const div = document.createElement("div");
    div.append(btn);
    div.classList.add("flex-shrink-0");
    if (header) {
      header.append(div);
    }

    if (!isToggleButtonsEnabled()) {
      btn.classList.add(classes.hidden);
    }

    // Restore cached button state if it exists
    const cached = cache[file.id];
    if (cached?.buttonState) {
      if (cached.buttonState === classes.toggleAdditions) {
        toggleButtonAdditions(btn);
      } else if (cached.buttonState === classes.toggleDeletions) {
        toggleButtonDeletions(btn);
      } else {
        toggleButtonSplit(btn);
      }
    }

    return btn;
  }

  /**
   * Moves the split view depending on the toggle button's state.
   */
  function toggleTableView(table, handle) {
    return (e) => {
      const btn = e.target;

      const tableRect = table.getBoundingClientRect();
      const numColDelRect = getDeletionNumberColumn(table);
      const addNumColRect = getAdditionNumberColumn(table);
      const capLeft = numColDelRect.right;
      const capRight = tableRect.right - addNumColRect.width;

      let handleLeft = 0;
      let width = 0;
      if (btn.classList.contains(classes.toggleSplit)) {
        handleLeft = capLeft - tableRect.left;
        width = capLeft - numColDelRect.right + 1;
        toggleButtonAdditions(btn);
      } else if (btn.classList.contains(classes.toggleAdditions)) {
        handleLeft = capRight - tableRect.left;
        width = capRight - numColDelRect.right + 1;
        toggleButtonDeletions(btn);
      } else if (btn.classList.contains(classes.toggleDeletions)) {
        handleLeft = tableRect.width / 2;
        width = tableRect.width / 2 - numColDelRect.width;
        toggleButtonSplit(btn);
      }

      handle.style.left = `${handleLeft}px`;
      updateSplitWidth(table, width);
      const file = btn.closest(`${selectors.legacyFile},${selectors.file}`);
      if (file && cache[file.id]) {
        cache[file.id].splitWidth = width;
      }
    };
  }

  /**
   * Sets the toggle button to "split" view
   */
  function toggleButtonSplit(btn) {
    btn.innerText = "Split";
    btn.classList.remove(classes.toggleAdditions, classes.toggleDeletions);
    btn.classList.add(classes.toggleSplit);

    // Cache button state
    const file = btn.closest(`${selectors.legacyFile},${selectors.file}`);
    if (file && cache[file.id]) {
      cache[file.id].buttonState = classes.toggleSplit;
    }
  }

  /**
   * Sets the toggle button to "additions" view.
   */
  function toggleButtonAdditions(btn) {
    btn.innerText = "Additions";
    btn.classList.remove(classes.toggleSplit, classes.toggleDeletions);
    btn.classList.add(classes.toggleAdditions);

    // Cache button state
    const file = btn.closest(`${selectors.legacyFile},${selectors.file}`);
    if (file && cache[file.id]) {
      cache[file.id].buttonState = classes.toggleAdditions;
    }
  }

  /**
   * Sets the toggle button to "deletions" view.
   */
  function toggleButtonDeletions(btn) {
    btn.innerText = "Deletions";
    btn.classList.remove(classes.toggleSplit, classes.toggleAdditions);
    btn.classList.add(classes.toggleDeletions);

    // Cache button state
    const file = btn.closest(`${selectors.legacyFile},${selectors.file}`);
    if (file && cache[file.id]) {
      cache[file.id].buttonState = classes.toggleDeletions;
    }
  }

  /**
   * On table enter, mark as current, show the handle to the user, and recalculate position.
   */
  function showHandle(file, table, handle) {
    return () => calculateHandlePosition(file, table, handle);
  }

  /**
   * Calculate the handle's position, relative to the table's center column.
   */
  function calculateHandlePosition(file, table, handle) {
    const bodyRect = file.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    const top = tableRect.top - bodyRect.top;
    const centerRect = getAdditionNumberColumn(table);

    cache[file.id].handle.position = {
      height: tableRect.height,
      left: centerRect.left - tableRect.left - 1,
      top: top,
    };

    handle.style.height = `${tableRect.height}px`;
    handle.style.left = `${centerRect.left - tableRect.left - 1}px`;
    handle.style.top = `${top}px`;
  }

  /**
   * Create the handle singleton and append it to the DOM.
   */
  function generateHandle(file) {
    file.querySelector(`.${classes.handle}`)?.remove();
    if (!cache[file.id]) cache[file.id] = {};
    if (!cache[file.id].handle) cache[file.id].handle = { position: {} };

    const handle = document.createElement("div");
    handle.classList.add(classes.handle);

    handle.onmousedown = function (e) {
      e.preventDefault();
      this.classList.add(classes.drag);
      const btn = file.querySelector(`.${classes.toggleButton}`);
      toggleButtonSplit(btn);
    };

    handle.onmouseup = function () {
      this.classList.remove(classes.drag);
    };

    file.appendChild(handle);

    return handle;
  }

  let tmpobserver;
  tmpobserver = new MutationObserver(() => {
    // In case the page takes longer to load, obtain and observe when the "files"
    // element comes into the DOM.
    const files = document.querySelectorAll(`${selectors.legacyFile},${selectors.file}`);
    if (files) {
      findTables();
    }
  });
  tmpobserver.observe(document.body, { childList: true, subtree: true });

})(document);
