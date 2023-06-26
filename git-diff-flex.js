(function (window, document) {
  /**
   * Set up configurations and automatically update when changes are detected.
   */
  const cfg = { toggleButtons: "enabled", wordWrap: "enabled" };

  // Initialize the stored preferences
  chrome.storage.sync.get().then((items) => {
    Object.assign(cfg, items);
    applyOptions();
  });

  // Watch for changes to the user's options & apply them
  chrome.storage.onChanged.addListener((items, area) => {
    console.log(items);
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

  function isToggleButtonsEnabled() {
    return cfg.toggleButtons === "enabled";
  }

  function isWordWrapEnabled() {
    return cfg.wordWrap === "enabled";
  }

  /**
   * Constants and known classes.
   */
  const tableKey = "gdfTable";
  const tableHeightKey = "gdfTableHeight";
  const classes = {
    current: "gdf-current",
    handle: "gdf-handle",
    hidden: "gdf-hidden",
    table: "gdf-table",
    clipped: "gdf-table-clipped",
    drag: "gdf-drag",
    toggleButton: "gdf-btn-toggle",
    toggleSplit: "gdf-btn-toggle-split",
    toggleAdditions: "gdf-btn-toggle-add",
    toggleDeletions: "gdf-btn-toggle-del",
  };

  // The main program... just mark the tables
  findTables();

  // // Find tables when user clicks on the "files" sub-nav tab
  // let subNav = document.querySelector('a.tabnav-tab[href$="files"]');
  // if (subNav) {
  //   subNav.addEventListener("click", () => {
  //     let to = setTimeout(() => {
  //       if (document.getElementById("files_bucket")) {
  //         findTables();
  //         clearTimeout(to);
  //       }
  //     }, 100);
  //   });
  // }

  // window.addEventListener("popstate", function () {
  //   handle.classList.remove(classes.hidden);
  // });
  // window.addEventListener("pushstate", function () {
  //   handle.classList.add(classes.hidden);
  // });

  // /**
  //  * Recalculate the handle on window resize.
  //  */
  // window.addEventListener("resize", calculateHandlePosition);

  // /**
  //  * Mark the handle as 'undraggable' on mouse up.
  //  */
  // document.body.addEventListener("mouseup", function () {
  //   handle.classList.remove(classes.drag);
  // });

  // /**
  //  * Recalculate the handle when the table height changes on click.
  //  */
  // document.body.addEventListener("click", heightChangeEvent);

  // /**
  //  * Move the handle and the table columns on mouse move.
  //  */
  // document.body.addEventListener("mousemove", function (e) {
  //   const table = getCurrentTable();
  //   if (table && handle.classList.contains(classes.drag)) {
  //     // Set the current position
  //     const numColDelRect = getDeletionNumberColumn(table);
  //     const widthNode = getSplitWidthNode(table);
  //     const capLeft = numColDelRect.left + numColDelRect.width + 100;
  //     const capRight = table.getBoundingClientRect().right - numColDelRect.width - 100;
  //     const btn = table.closest(".file").querySelector(`.${classes.toggleButton}`);

  //     if (e.clientX > capRight) {
  //       // Stop moving if over the right cap
  //       handle.style.left = capRight + "px";
  //       updateSplitWidth(widthNode, capRight - numColDelRect.left - numColDelRect.width + 1);
  //       toggleButtonDeletions(btn);
  //     } else if (e.clientX < capLeft) {
  //       // Stop moving if over the left cap
  //       handle.style.left = capLeft + "px";
  //       updateSplitWidth(widthNode, capLeft - numColDelRect.right + 1);
  //       toggleButtonAdditions(btn);
  //     } else {
  //       handle.style.left = e.clientX + "px";
  //       updateSplitWidth(widthNode, handle.getBoundingClientRect().left - numColDelRect.right + 1);
  //       toggleButtonSplit(btn);
  //     }

  //     // Last check to see if handle height is same as table height
  //     heightChangeEvent();
  //   }
  // });

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
   * Recalculates the handle height.
   */
  function heightChangeEvent(file, table, handle) {
    const height = table.getBoundingClientRect().height;
    if (handle.dataset[tableHeightKey] != height) {
      handle.dataset[tableHeightKey] = height;
      calculateHandlePosition(file, table, handle);
    }
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
    const tables = document.querySelectorAll(`table.diff-table.file-diff-split:not(.${classes.table})`);
    if (tables.length > 0) {
      for (let i = 0; i < tables.length; ++i) {
        // Find the parent "file" element
        const file = tables[i].closest(".file");

        // Generate and append the "handle" element
        const handle = generateHandle(file);

        // Generate and append the "toggle" view button
        const btn = constructToggleButton(tables[i], handle);

        // Customize the table element
        tables[i].classList.add(classes.table);
        tables[i].dataset[tableKey] = i;
        tables[i].addEventListener("mouseenter", showHandle(file, tables[i], handle));

        // Observe the table's resize events
        const ro = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const cr = entry.contentRect;
            console.log(handle, cr);
            handle.style.height = `${cr.height}px`;
          }
        });

        ro.observe(tables[i]);

        // Remove the ability to drag the handle when the mouse button is up
        file.addEventListener("mouseup", function () {
          handle.classList.remove(classes.drag);
        });

        // Calculate the handle's position during the mouse move event
        file.addEventListener("mousemove", function (e) {
          // The handle will contain the "drag" class when it detects a mouse down event
          if (handle.classList.contains(classes.drag)) {
            const tableRect = tables[i].getBoundingClientRect();
            const numColDelRect = getDeletionNumberColumn(tables[i]);
            const widthNode = getSplitWidthNode(tables[i]);
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
            heightChangeEvent(file, tables[i], handle);
          }
        });
      }
    }
  }

  /**
   * Builds a new toggle button to be added to the "file" element.
   */
  function constructToggleButton(table, handle) {
    const header = table.closest(".file").querySelector(".file-info");
    const btn = document.createElement("button");
    btn.innerText = "Split";
    btn.classList.add("btn", "btn-sm", "btn-primary", classes.toggleButton, classes.toggleSplit);
    btn.addEventListener("click", toggleTableView(table, handle));

    const div = document.createElement("div");
    div.append(btn);
    div.classList.add("flex-shrink-0");
    header.after(div);

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
   * Get the current table the mouse is over.
   */
  function getCurrentTable() {
    return document.querySelector(`.${classes.current}`);
  }

  /**
   * On table enter, mark as current, show the handle to the user, and recalculate position.
   */
  function showHandle(file, table, handle) {
    table.classList.add(classes.current);
    handle.dataset[tableKey] = table.dataset[tableKey];
    // handle.classList.remove(classes.hidden);
    calculateHandlePosition(file, table, handle);
  }

  /**
   * Calculate the handle's position, relative to the table's center column.
   */
  function calculateHandlePosition(file, table, handle) {
    const bodyRect = file.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    const top = tableRect.top - bodyRect.top;
    const centerRect = getAdditionNumberColumn(table);
    console.log(centerRect);

    handle.style.height = `${tableRect.height}px`;
    handle.style.left = `${centerRect.left - tableRect.left - 1}px`;
    handle.style.top = `${top}px`;
  }

  /**
   * Create the handle singleton and append it to the DOM.
   */
  function generateHandle(file) {
    const handle = document.createElement("div");
    handle.classList.add(classes.handle /*classes.hidden*/);
    handle.dataset[tableHeightKey] = 0;

    handle.onmousedown = function (e) {
      e.preventDefault();
      this.classList.add(classes.drag);
      const table = getCurrentTable();
      if (table) {
        const btn = file.querySelector(`.${classes.toggleButton}`);
        toggleButtonSplit(btn);
      }
    };

    handle.onmouseup = function () {
      this.classList.remove(classes.drag);
    };

    handle.onmouseenter = function () {
      this.classList.remove(classes.hidden);
    };

    file.appendChild(handle);

    return handle;
  }
})(window, document);
