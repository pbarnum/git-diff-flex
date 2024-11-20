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
      if (isWordWrapEnabled()) {
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
   * Gets the "deletion" table column. This is used to apply positioning.
   */
  function getSplitWidthNode(table) {
    return table.querySelector("colgroup>col:nth-child(2)");
  }

  /**
   * Updates the width for the "deletion" table column.
   */
  function updateSplitWidth(node, val) {
    node.style.width = `${val}px`;
  }

  /**
   * Determines the "deletion" number column dimensions depending on the type of diff.
   */
  function getDeletionNumberColumn(table) {
    const delNumCol = table.querySelector("td.blob-num-deletion");
    if (delNumCol) {
      return delNumCol.getBoundingClientRect();
    }

    const rect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const addNumCol = table.querySelector("td.blob-num-addition");
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
    const addNumCol = table.querySelector("td.blob-num-addition");
    if (addNumCol) {
      return addNumCol.getBoundingClientRect();
    }

    const rect = {
      left: 0,
      right: 0,
      width: 0,
    };

    const tableRect = table.getBoundingClientRect();
    const delNumCol = table.querySelector("td.blob-num-deletion");
    if (delNumCol) {
      const colRect = delNumCol.getBoundingClientRect();
      rect.left = table.querySelector("td.blob-code-deletion").getBoundingClientRect().right;
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
    const files = document.querySelectorAll(`.file:not(.${classes.file}`);
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];

      // Don't mark this file if it's table does not yet exist
      const table = file.querySelector(`table.diff-table.file-diff-split:not(.${classes.table})`);
      if (!table) {
        continue;
      }

      file.classList.add(classes.file);

      // Generate and append the "handle" element
      const handle = generateHandle(file);

      // Generate and append the "toggle" view button
      const btn = constructToggleButton(file, table, handle);

      // Customize the table element
      table.classList.add(classes.table);
      if (isWordWrapEnabled()) {
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
          const widthNode = getSplitWidthNode(table);
          const capLeft = numColDelRect.left + numColDelRect.width + 100;
          const capRight = tableRect.right - numColDelRect.width - 100;

          if (e.clientX > capRight) {
            // Stop moving if over the right cap
            handle.style.left = `${capRight - tableRect.left}px`;
            updateSplitWidth(widthNode, capRight - numColDelRect.left - numColDelRect.width + 1);
            toggleButtonDeletions(btn);
          } else if (e.clientX < capLeft) {
            // Stop moving if over the left cap
            handle.style.left = `${capLeft - numColDelRect.left}px`;
            updateSplitWidth(widthNode, capLeft - numColDelRect.right + 1);
            toggleButtonAdditions(btn);
          } else {
            handle.style.left = `${e.clientX - tableRect.left}px`;
            updateSplitWidth(widthNode, handle.getBoundingClientRect().left - numColDelRect.right + 1);
            toggleButtonSplit(btn);
          }

          // Last check to see if handle height is same as table height
          calculateHandlePosition(file, table, handle);
        }
      });
    }
  }

  /**
   * Builds a new toggle button to be added to the "file" element.
   */
  function constructToggleButton(file, table, handle) {
    const header = file.querySelector(".file-info");
    const btn = document.createElement("button");
    btn.innerText = "Split";
    btn.classList.add("btn", "btn-sm", "btn-primary", classes.toggleButton, classes.toggleSplit);
    btn.addEventListener("click", toggleTableView(table, handle));

    const div = document.createElement("div");
    div.append(btn);
    div.classList.add("flex-shrink-0");
    header.after(div);

    if (!isToggleButtonsEnabled()) {
      btn.classList.add(classes.hidden);
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
      const widthNode = getSplitWidthNode(table);
      const capLeft = numColDelRect.left + numColDelRect.width + 100;
      const capRight = tableRect.right - numColDelRect.width - 100;

      if (btn.classList.contains(classes.toggleSplit)) {
        handle.style.left = `${capLeft - tableRect.left}px`;
        toggleButtonAdditions(btn);
        updateSplitWidth(widthNode, capLeft - numColDelRect.right + 1);
      } else if (btn.classList.contains(classes.toggleAdditions)) {
        handle.style.left = `${capRight - tableRect.left}px`;
        toggleButtonDeletions(btn);
        updateSplitWidth(widthNode, capRight - numColDelRect.left - numColDelRect.width + 1);
      } else if (btn.classList.contains(classes.toggleDeletions)) {
        handle.style.left = `${tableRect.width / 2}px`;
        toggleButtonSplit(btn);
        updateSplitWidth(widthNode, tableRect.width / 2 - numColDelRect.width);
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
  }

  /**
   * Sets the toggle button to "additions" view.
   */
  function toggleButtonAdditions(btn) {
    btn.innerText = "Additions";
    btn.classList.remove(classes.toggleSplit, classes.toggleDeletions);
    btn.classList.add(classes.toggleAdditions);
  }

  /**
   * Sets the toggle button to "deletions" view.
   */
  function toggleButtonDeletions(btn) {
    btn.innerText = "Deletions";
    btn.classList.remove(classes.toggleSplit, classes.toggleAdditions);
    btn.classList.add(classes.toggleDeletions);
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

    handle.style.height = `${tableRect.height}px`;
    handle.style.left = `${centerRect.left - tableRect.left - 1}px`;
    handle.style.top = `${top}px`;
  }

  /**
   * Create the handle singleton and append it to the DOM.
   */
  function generateHandle(file) {
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
    const files = document.getElementById('files');
    if (files) {
      findTables();
      const observer = new MutationObserver(findTables);
      observer.observe(files, { childList: true, subtree: true });
      tmpobserver.disconnect();
    }
  });
  tmpobserver.observe(document.body, { childList: true, subtree: true });

  // Find existing tables and initialize the script.
  findTables();

})(document);
