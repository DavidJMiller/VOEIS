/**
 * Represents the menu panel for a plot in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * H 11/26/20
 */
class PlotMenu {
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
    this.itemData = new Map();

    /** @private */
    this.dataItem = new Map();

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
          if (this.itemData.size) this.menuButton.style('display', '');
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

  showData(data) {
    this.dataItem.get(data)?.style('display', '');
    return this;
  }

  showClasses(...classes) {
    this.selectClasses(...classes).style('display', '');
  }

  hide() {
    this.menuElem.style('display', 'none');
    this.isMenuShowing = false;
    if (!this.isMenuButtonShowing) this.menuButton.style('display', 'none');
    d3.select(document).on('mousedown.plot-menu', null);

    return this;
  }

  hideData(data) {
    this.dataItem.get(data)?.style('display', 'none');
    return this;
  }

  hideClasses(...classes) {
    this.selectClasses(...classes).style('display', 'none');
  }

  clear() {
    return this.removeClasses();
  }

  /** @private */
  selectClasses(...classes) {
    return this.plotElem.selectAll(
      `.plot-menu-item${classes.length ? ('.' + classes.join('.')) : ''}`);
  }

  hasData(data) {
    return this.dataItem.has(data);
  }

  hasClasses(...classes) {
    return !this.selectClasses(...classes).empty();
  }

  removeData(data) {
    this.itemData.delete(this.dataItem.get(data));
    this.dataItem.get(data)?.remove();
    this.dataItem.delete(data);
  }

  removeClasses(...classes) {
    this.selectClasses(...classes)
      .each(d => {
        this.itemData.delete(this.dataItem.get(d));
        this.dataItem.delete(d);
      })
      .remove();

    return this;
  }

  /** @private */
  append(elemType, itemType, data, ...classes) {
    let elem = this.menuElem.append(elemType)
                 .attr('class',
                   (`plot-menu-item plot-menu-item-${itemType} ${
                      classes.concat(...this.forcedClasses.keys()).join(' ')}`)
                     .trim())
                 .datum(data);
    this.itemData.set(elem, data);
    this.dataItem.set(data, elem);

    return elem;
  }

  appendDivider(data, ...classes) {
    this.append('div', 'divider', data, 'dropdown-divider', ...classes);
    return this;
  }

  appendLabel(text, data, ...classes) {
    this.append('h6', 'label', data, 'dropdown-header', ...classes).text(text);
    return this;
  }

  setLabel(data, newLabel) {
    this.dataItem.get(data)?.text(newLabel);
  }

  /** @param {function(*, boolean)} callback */
  appendSelectable(label, data, callback, ...classes) {
    let elem = this.append('a', 'selectable', data, 'dropdown-item', ...classes)
                 .text(label);
    elem.on('click', () => callback(data, elem.classed('bg-primary')));

    return this;
  }

  selectSelectable(data) {
    this.dataItem.get(data)?.classed('bg-primary', true);
    return this;
  }

  deselectSelectable(data) {
    this.dataItem.get(data)?.classed('bg-primary', false);
    return this;
  }

  isSelectableSelected(data) {
    return this.dataItem.get(data)?.classed('bg-primary');
  }

  appendContinuousSlider() {
    throw 'TODO: not implemented';
  }

  /** @param {function(*, number, number)} callback */
  appendSteppedSlider(steps, defaultIndex, data, callback, ...classes) {
    let currIndex = defaultIndex,
        elem =
          this.append('input', 'stepped-slider', data, ...classes)
            .attr('type', 'range')
            .attr('min', steps[0])
            .attr('max', steps[steps.length - 1])
            .on('input', function() {
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
              callback(data, newIndex, steps);
            });
    elem.property('value', steps[defaultIndex]).attr('value', defaultIndex);

    return this;
  }

  getSteppedSliderCurrStep(data) {
    return +this.dataItem.get(data)?.attr('value');
  }

  forceClasses(...classes) {
    for (let c of classes) this.forcedClasses.add(c);
    return this;
  }

  releaseClasses(...classes) {
    for (let c of classes) this.forcedClasses.delete(c);
    return this;
  }
}
