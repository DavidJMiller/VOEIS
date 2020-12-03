/**
 * Represents the menu panel for a plot in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * F 11/27/20
 */
class PlotMenu {
  /**
   * Creates a new `PlotMenu` instance.
   * @param {Selection} plotElem A D3-selection containing the plot's
   *   div-container in which the menu should be created.
   */
  constructor(plotElem) {
    /** @private */
    this.plotElem = plotElem;

    /** @private */
    this.menuButton = plotElem.append('span')
                        .attr('class', 'mini-button plot-menu-button')
                        .style('display', 'none')
                        .html('<i class="fas fa-cog"></i>');
    /** @private */
    this.menuElem = plotElem.append('div')
                      .attr('class', 'plot-menu')
                      .style('display', 'none');

    /** @private */
    this.isMenuButtonShowing = false;

    /** @private */
    this.isMenuShowing = false;

    /** @private */
    this.itemIds = new Map();

    /** @private */
    this.idItems = new Map();

    /** @private */
    this.forcedClasses = new Set();

    this.initEvents();
  }

  /** @private */
  initEvents() {
    this.plotElem
      .on('mouseenter',
        () => {
          this.isMenuButtonShowing = true;
          if (this.itemIds.size) this.menuButton.style('display', '');
        })
      .on('mouseleave', () => {
        this.isMenuButtonShowing = false;
        if (!this.isMenuShowing) this.menuButton.style('display', 'none');
      });
    this.menuButton.on('click', () => {
      if (this.isMenuShowing)
        this.hide();
      else
        this.show();
    });
  }

  /** Shows the menu. */
  show() {
    this.menuElem.style('display', '');
    this.isMenuShowing = true;
    this.menuButton.style('display', '');
    d3.select(document).on('mousedown.plot-menu', e => {
      if (this.menuButton.node().contains(e.target) ||
        this.menuElem.node().contains(e.target))
        return;

      this.hide();
    });

    return this;
  }

  /**
   * Un-hides an item bound to some id.
   * @param {*} id The ID whose corresponding item is to be un-hidden.
   */
  showId(id) {
    this.idItems.get(id)?.style('display', '');
    return this;
  }

  /**
   * Un-hides all items with some classes.
   * @param  {...string} classes The classes any items having all of which are
   *   to be un-hidden.
   */
  showClasses(...classes) {
    this.selectClasses(...classes).style('display', '');
    return this;
  }

  /** Hides the menu. */
  hide() {
    this.menuElem.style('display', 'none');
    this.isMenuShowing = false;
    if (!this.isMenuButtonShowing) this.menuButton.style('display', 'none');
    d3.select(document).on('mousedown.plot-menu', null);

    return this;
  }

  /**
   * Hides an item bound to some id.
   * @param {*} id The ID whose corresponding item is to be hidden.
   */
  hideId(id) {
    this.idItems.get(id)?.style('display', 'none');
    return this;
  }

  /**
   * Hides all items with some classes.
   * @param  {...string} classes The classes any items having all of which are
   *   to be hidden.
   */
  hideClasses(...classes) {
    this.selectClasses(...classes).style('display', 'none');
    return this;
  }

  /** Removes all items from the menu. */
  clear() {
    return this.removeClasses();
  }

  /** @private */
  selectClasses(...classes) {
    return this.plotElem.selectAll(
      `.plot-menu-item${classes.length ? ('.' + classes.join('.')) : ''}`);
  }

  /**
   * Checks whether the menu contains an item bound to some id.
   * @param {*} id The ID to check.
   */
  hasId(id) {
    return this.idItems.has(id);
  }

  /**
   * Checks whether the menu contains an item with some classes.
   * @param  {...string} classes The classes to check. There needs to be an
   *   item with all these classes for this method to return `true`.
   */
  hasClasses(...classes) {
    return !this.selectClasses(...classes).empty();
  }

  /**
   * Removes the item bound to some id.
   * @param {*} id The ID whose corresponding item is to be removed.
   */
  removeId(id) {
    this.itemIds.delete(this.idItems.get(id));
    this.idItems.get(id)?.remove();
    this.idItems.delete(id);

    return this;
  }

  /**
   * Removes all items with some classes.
   * @param  {...string} classes The classes any items having all of which are
   *   to be removed.
   */
  removeClasses(...classes) {
    this.selectClasses(...classes)
      .each(d => {
        this.itemIds.delete(this.idItems.get(d));
        this.idItems.delete(d);
      })
      .remove();

    return this;
  }

  /** @private */
  append(elemType, itemType, id, ...classes) {
    let elem = this.menuElem.append(elemType)
                 .attr('class',
                   (`plot-menu-item plot-menu-item-${itemType} ${
                      classes.concat(...this.forcedClasses.keys()).join(' ')}`)
                     .trim())
                 .datum(id);
    this.itemIds.set(elem, id);
    this.idItems.set(id, elem);

    return elem;
  }

  /**
   * Appends an HTML divider (horizontal line) to the end of the menu.
   * @param {*} id The ID to bind the new item to.
   * @param  {...string} classes The classes the new item should have, which may
   *   be none.
   */
  appendDivider(id, ...classes) {
    this.append('div', 'divider', id, 'dropdown-divider', ...classes);
    return this;
  }

  /**
   * Appends a non-interactive label to the end of the menu.
   * @param {string} text The text to display in the label.
   * @param {*} id The ID to bind the new item to.
   * @param  {...string} classes The classes the new item should have, which may
   *   be none.
   */
  appendLabel(text, id, ...classes) {
    this.append('h6', 'label', id, 'dropdown-header', ...classes).text(text);
    return this;
  }

  /**
   * Changes the label-text of an item with some id.
   * @param {*} id The ID whose corresponding item should have its label
   *   text changed.
   * @param {string} newLabel The text to display in the item.
   */
  setText(id, newLabel) {
    this.idItems.get(id)?.text(newLabel);
    return this;
  }

  /**
   * Appends a selectable item to the end of the menu.
   * @param {string} label The text to display in the selectable item.
   * @param {*} id The ID to bind the new item to.
   * @param {function(*, boolean)} onClick The function to call when the
   *   selectable item is clicked. Will be called with two arguments: the id
   * bound to the item and whether the item is selected before the click. (Note
   *   that a selectable item does not automatically flip its selected-state
   *   when clicked.)
   * @param  {...string} classes The classes the new item should have, which may
   *   be none.
   */
  appendSelectable(label, id, onClick, ...classes) {
    let elem = this.append('a', 'selectable', id, 'dropdown-item', ...classes)
                 .text(label);
    elem.on('click', () => onClick(id, elem.classed('bg-primary')));

    return this;
  }

  /**
   * Selects and highlights a selectable item bound to some ID (and leaves all
   * other items in their original states).
   * @param {*} id The ID whose corresponding selectable item is to be
   *   selected.
   */
  selectSelectable(id) {
    this.idItems.get(id)?.classed('bg-primary', true);
    return this;
  }

  /**
   * Deselects and un-highlights a selectable item bound to some ID (and
   * leaves all other items in their original states).
   * @param {*} id The ID whose corresponding selectable item is to be
   *   deselected.
   */
  deselectSelectable(id) {
    this.idItems.get(id)?.classed('bg-primary', false);
    return this;
  }

  /**
   * Checks whether the selectable item bound to some ID is currently
   * selected.
   * @param {*} id The ID to check.
   */
  isSelectableSelected(id) {
    return this.idItems.get(id)?.classed('bg-primary');
  }

  /**
   * Appends a stepped-slider to the end of the menu.
   * @param {number[]} steps The numerical values of the steps the slider should
   *   have.
   * @param {number} defaultIndex The index (into `steps`) of the value to
   *   display as soon as the slider is created.
   * @param {*} id The ID to bound the new item to.
   * @param {function(*, number, number[], boolean)} onChange The function to
   *   call when the slider's value changes. Will be called with four arguments:
   *   the ID bound to the item, the index (into `steps`) of the value the
   *   slider has changed to, the steps, and whether the user has released the
   *   mouse button yet.
   * @param  {...string} classes The classes the new item should have, which may
   *   be none.
   */
  appendSteppedSlider(steps, defaultIndex, id, onChange, ...classes) {
    let currIndex = defaultIndex,
        elem =
          this.append('input', 'stepped-slider', id, ...classes)
            .attr('type', 'range')
            .attr('min', steps[0])
            .attr('max', steps[steps.length - 1])
            .on('input',
              function() {
                if (steps.length < 2) return;

                let newIndex;
                if (this.value <= (steps[0] + steps[1]) / 2) {
                  newIndex = 0;
                } else {
                  newIndex = steps.findIndex((x, i) => i == steps.length - 1 ||
                      this.value < (x + steps[i + 1]) / 2);
                }
                elem.property('value', steps[newIndex]).attr('value', newIndex);

                if (newIndex == currIndex) return;

                currIndex = newIndex;
                onChange(id, newIndex, steps, false);
              })
            .on('change', () => onChange(id, +elem.attr('value'), steps, true));
    elem.property('value', steps[defaultIndex]).attr('value', defaultIndex);

    return this;
  }

  /**
   * Retrieves the index of step a stepped-slider is currently in.
   * @param {*} id The ID whose corresponding slider is to be checked.
   */
  getSteppedSliderCurrStep(id) {
    return +this.idItems.get(id)?.attr('value');
  }

  /**
   * Forces every newly-added item from this point on to have some classes,
   * until `releaseClasses` is called with the same arguments. (Calling this
   * method does not affect any item that's already in the menu.)
   * @param  {...string} classes The classes every newly-added item should have.
   */
  forceClasses(...classes) {
    for (let c of classes) this.forcedClasses.add(c);
    return this;
  }

  /**
   * Undoes `forceClasses` for some classes. (Calling this method does not
   * affect any item that's already in the menu.)
   * @param  {...string} classes The classes every newly-added item is no longer
   *   forced to have.
   */
  releaseClasses(...classes) {
    for (let c of classes) this.forcedClasses.delete(c);
    return this;
  }
}
