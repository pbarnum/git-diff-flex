(function(window, document) {

  let tableKey = 'gdfTable'
  let tableHeightKey = 'gdfTableHeight'
  let classes = {
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
    let table = getCurrentTable();
    if (table && handle.classList.contains(classes.drag)) {
      let height = table.getBoundingClientRect().height;
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
    let table = getCurrentTable();
    if (table && handle.classList.contains(classes.drag)) {

      // Set the current position
      let colPos = table.querySelector('td.blob-num-deletion').getBoundingClientRect();
      let col = table.querySelector('colgroup>col:nth-child(2)');
      let rect = handle.getBoundingClientRect();
      let capLeft = colPos.right + colPos.width + 100;
      let capRight = table.querySelector('tbody').getBoundingClientRect().right
        - table.querySelector('td.blob-num-addition').getBoundingClientRect().width
        - 100;

      // Move first... ask questions later!
      handle.style.left = e.clientX + 'px';
      col.style.width = (rect.left - colPos.right + 1) + 'px';

      // Stop moving if over the right cap
      if (e.clientX > capRight) {
        handle.style.left = capRight + 'px';
        col.style.width = (capRight - colPos.left + 1) + 'px';
      }

      // Stop moving if over the left cap
      if (e.clientX < capLeft) {
        handle.style.left = capLeft + 'px';
        col.style.width = (capLeft - colPos.right + 1) + 'px';
      }
    }
  });

  /**
   * Find all diff tables.
   */
  function findTables() {
    return [].map.call(document.querySelectorAll('table.diff-table.file-diff-split'), (table, i) => {
      table.classList.add(classes.table);
      table.dataset[tableKey] = i;
      table.addEventListener('mouseenter', showHandle);
      table.addEventListener('mouseleave', hideHandle);
      return table;
    });
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
    let table = getCurrentTable();
    if (table) {
      let bodyRect = document.body.getBoundingClientRect();
      let tableRect = table.getBoundingClientRect();
      let top = tableRect.top - bodyRect.top;
      let centerColRect = table.querySelector('td.blob-num-addition').getBoundingClientRect();

      handle.style.height = tableRect.height + 'px';
      handle.style.left = (centerColRect.left - 1) + 'px';
      handle.style.top = top + 'px';
    }
  }

  /**
   * Create the handle singleton and append it to the DOM.
   */
  function generateHandle() {
    let handle = document.createElement('div');
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
