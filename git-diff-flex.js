(function(window, document) {

  const tableKey = 'gdfTable'
  const tableHeightKey = 'gdfTableHeight'
  const classes = {
    current: 'gdf-current',
    handle: 'gdf-handle',
    hidden: 'gdf-hidden',
    table: 'gdf-table',
    drag: 'gdf-drag'
  };

  const handle = generateHandle();

  // The main program... just mark the tables
  findTables();

  /**
   * Recalculate the handle on window resize.
   */
  window.addEventListener('resize', calculateHandlePosition);
  window.addEventListener('scroll', findTables);

  /**
   * Mark the handle as 'undraggable' on mouse up.
   */
  document.body.addEventListener('mouseup', function () {
    handle.classList.remove(classes.drag);
  });

  /**
   * Recalculate the handle when the table height changes on mouse move.
   */
  document.body.addEventListener('mousemove', function () {
    const table = getCurrentTable();
    if (table && handle.classList.contains(classes.drag)) {
      const height = table.getBoundingClientRect().height;
      if (this.dataset[tableHeightKey] != height) {
        this.dataset[tableHeightKey] = height;
        calculateHandlePosition();
      }
    }
  });

  /**
   * Move the handle and the table columns on mouse move.
   */
  document.body.addEventListener('mousemove', function (e) {
    const table = getCurrentTable();
    if (table && handle.classList.contains(classes.drag)) {

      // Set the current position
      const numColRect = getDeletionColumn(table);
      const delDiffCol = table.querySelector('colgroup>col:nth-child(2)');
      const capLeft = numColRect.left + numColRect.width + 100;
      const capRight = table.getBoundingClientRect().right - numColRect.width - 100;

      // Move first... ask questions later!
      handle.style.left = e.clientX + 'px';
      delDiffCol.style.width = (handle.getBoundingClientRect().left - numColRect.right + 1) + 'px';

      // Stop moving if over the right cap
      if (e.clientX > capRight) {
        handle.style.left = capRight + 'px';
        delDiffCol.style.width = (capRight - numColRect.left + 1) + 'px';
      }

      // Stop moving if over the left cap
      if (e.clientX < capLeft) {
        handle.style.left = capLeft + 'px';
        delDiffCol.style.width = (capLeft - numColRect.right + 1) + 'px';
      }
    }
  });

  /**
   * Determines the deletion column dimensions depending on the type of diff.
   */
  function getDeletionColumn(table) {
    const delNumCol = table.querySelector('td.blob-num-deletion');
    const addNumCol = table.querySelector('td.blob-num-addition');
    const rect = {
      left: 0,
      right: 0,
      width: 0
    };

    if (delNumCol) {
      const colRect = delNumCol.getBoundingClientRect();
      rect.left = colRect.left;
      rect.right = colRect.right;
      rect.width = colRect.width;
    } else if (addNumCol) {
      const colRect = addNumCol.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      rect.left = tableRect.left;
      rect.right = tableRect.left + colRect.width;
      rect.width = colRect.width;
    } else {
      const tableRect = table.getBoundingClientRect();
      rect.left = tableRect.left;
      rect.right = tableRect.left + 66;
      rect.width = 66;
    }

    return rect;
  }

  /**
   * Find all diff tables.
   */
  function findTables() {
    const tables = document.querySelectorAll(`table.diff-table.file-diff-split:not(.${classes.table})`);
    for (let i = 0; i < tables.length; ++i) {
      tables[i].classList.add(classes.table);
      tables[i].dataset[tableKey] = i;
      tables[i].addEventListener('mouseenter', showHandle);
      tables[i].addEventListener('mouseleave', hideHandle);
    }
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
  function showHandle() {
    this.classList.add(classes.current);
    handle.dataset[tableKey] = this.dataset[tableKey];
    handle.classList.remove(classes.hidden);
    calculateHandlePosition();
  }

  /**
   * On table leave, remove the current class and hide the handle from the user.
   */
  function hideHandle() {
    this.classList.remove(classes.current);
    handle.classList.add(classes.hidden);
  }

  /**
   * Calculate the handle's position, relative to the table's center column.
   */
  function calculateHandlePosition() {
    const table = getCurrentTable();
    if (table) {
      const bodyRect = document.body.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const top = tableRect.top - bodyRect.top;
      const centerColRect = table.querySelector('td.blob-num-addition').getBoundingClientRect();

      handle.style.height = tableRect.height + 'px';
      handle.style.left = (centerColRect.left - 1) + 'px';
      handle.style.top = top + 'px';
    }
  }

  /**
   * Create the handle singleton and append it to the DOM.
   */
  function generateHandle() {
    const handle = document.createElement('div');
    handle.classList.add(classes.handle);
    handle.classList.add(classes.hidden);
    handle.dataset[tableHeightKey] = 0;

    handle.onmousedown = function (e) {
      e.preventDefault();
      this.classList.add(classes.drag);
    };

    handle.onmouseup = function () {
      this.classList.remove(classes.drag);
    };

    handle.onmouseenter = function () {
      this.classList.remove(classes.hidden);
    };

    handle.onmouseleave = function () {
      this.classList.add(classes.hidden);
    };

    document.body.appendChild(handle);

    return handle;
  }

})(window, document);
