/**
 * Represents and controls the information panel element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/25/20
 */
class InfoPanel {
  static FADE_IN_DURATION = 86.81;

  static MOVE_DURATION = 86.81;

  static FADE_OUT_DURATION = 173.6;

  static PADDING = 24;

  /** @private */
  static elem = d3.select('#info-panel');

  /** @private */
  static isShowing = false;

  /** @private */
  static isCleared = false;

  /** Clears the contents of the info-panel, possibly while it's visible. */
  static clear() {
    InfoPanel.elem.html('');
    InfoPanel.isCleared = false;

    return InfoPanel;
  }

  /**
   * Hides the info-panel and optionally clears its contents.
   * @param {boolean} clear Whether it should clear the info-panel's contents
   *     after it's finished fading out. Defaults to `true`.
   */
  static hide(clear = true) {
    if (!InfoPanel.isShowing) return InfoPanel;
    InfoPanel.isShowing = false;
    InfoPanel.isCleared = clear;

    InfoPanel.elem.interrupt('fade')
        .transition('fade')
        .ease(d3.easeSinIn)
        .duration(InfoPanel.FADE_OUT_DURATION)
        .style('opacity', 0)
        .on('end', () => clear && InfoPanel.clear());

    return InfoPanel;
  }

  /**
   * Appends header-sized text, followed by a newline, to the contents of the
   * info-box.
   * @param {string} text The text to append.
   * @param {string} color The color of the text in any CSS-acceptable color
   *     format. Defaults to `"black"`.
   * @param {boolean} bold Whether to show the appended text in bold. Defaults
   *     to `false`.
   * @param {boolean} italic Whether to show the appended text in italics.
   *     Defaults to `false`.
   */
  static header(text, color = 'black', bold = false, italic = false) {
    InfoPanel.append('h5', text, color, bold, italic);
    return InfoPanel;
  }

  /**
   * Appends normal-sized text to the contents of the info-box.
   * @param {string} text The text to append.
   * @param {string} color The color of the text in any CSS-acceptable color
   *     format. Defaults to `"black"`.
   * @param {boolean} bold Whether to show the appended text in bold. Defaults
   *     to `false`.
   * @param {boolean} italic Whether to show the appended text in italics.
   *     Defaults to `false`.
   */
  static text(text, color = 'black', bold = false, italic = false) {
    InfoPanel.append('span', text, color, bold, italic);
    return InfoPanel;
  }

  /**
   * Appends footer-sized text to the contents of the info-box.
   * @param {string} text The text to append.
   * @param {string} color The color of the text in any CSS-acceptable color
   *     format. Defaults to `"black"`.
   * @param {boolean} bold Whether to show the appended text in bold. Defaults
   *     to `false`.
   * @param {boolean} italic Whether to show the appended text in italics.
   *     Defaults to `false`.
   */
  static footer(text, color = 'black', bold = false, italic = false) {
    InfoPanel.append('em', text, color, bold, italic);
    return InfoPanel;
  }

  /**
   * Appends a newline to the contents of the info-box. Note that the
   * `InfoPanel.header()` function already automatically appends a newline after
   * the text.
   */
  static newline() {
    InfoPanel.append('br');
    return InfoPanel;
  }

  /** @private */
  static append(elemType, text, color, bold, italic) {
    if (InfoPanel.isCleared) InfoPanel.clear();
    let elem = InfoPanel.elem.append(elemType).style('color', color).text(text);
    if (bold) elem.style('font-weight', 'bold');
    if (italic) elem.style('font-style', 'italic');

    return elem;
  }

  /**
   * Shows the info-panel with location relative to a display target. The
   * location will be adaptive and never go outside of the browser window.
   * @param {(HTMLElement | Selection)} target A display element (or a D3-
   *     selection to one) used to locate the info-panel.
   * @param {number} relativeX The X-location relative to the `target` to locate
   *     the info-panel. For example, setting `relativeX` to `1` (meaning
   *     "right") and `relativeY` to `-1` (meaning "above") would put the
   *     info-panel to the top-right of `target`. Defaults to `0` (center).
   * @param {number} relativeY The Y-location relative to the `target`, similar
   *     to `relativeX`. Defaults to `-1` (above).
   * @param {number} delay The time in milliseconds to wait before fading in the
   *     info-panel; unless the info-panel is already visible, in which case
   *     there would be no delay. Defaults to `0`.
   */
  static show(target, relativeX = 0, relativeY = -1, delay = 0) {
    if (!(target instanceof HTMLElement)) target = target?.node();
    if (!target) {
      throw 'The argument `target` must be either an HTML element or a non' +
          '-empty D3 selection.';
    }

    if (InfoPanel.isCleared || !InfoPanel.elem.html().length)
      return InfoPanel.hide(!InfoPanel.isCleared);

    const targetRect = target.getBoundingClientRect(),
          targetBRect = target.getBBox ? target.getBBox() : null,
          targetWidth = targetBRect?.width || targetRect.width,
          targetX = targetRect.right - targetWidth,
          targetHeight = targetBRect?.height || targetRect.height,
          targetY = targetRect.bottom - targetHeight,
          elemRect = InfoPanel.elem.node().getBoundingClientRect(),
          elemWidth = elemRect.width, elemHeight = elemRect.height,
          padding = InfoPanel.PADDING;

    let x = targetX + (relativeX + 1) / 2 * targetWidth + relativeX * padding +
        (relativeX - 1) / 2 * elemWidth,
        y = targetY + (relativeY + 1) / 2 * targetHeight + relativeY * padding +
        (relativeY - 1) / 2 * elemHeight;

    const rightLimit = window.innerWidth - padding - elemWidth;
    if (relativeX) {
      if (x < padding || x > rightLimit)
        x -= relativeX * (2 * padding + targetWidth + elemWidth);
    } else {
      x = Math.min(Math.max(x, padding), rightLimit);
    }
    const bottomLimit = window.innerHeight - padding - elemHeight;
    if (relativeY) {
      if (y < padding || y > bottomLimit)
        y -= relativeY * (2 * padding + targetHeight + elemHeight);
    } else {
      y = Math.min(Math.max(y, InfoPanel.PADDING), bottomLimit);
    }

    InfoPanel.elem.transition('move')
        .ease(d3.easeSinOut)
        .duration(
            +InfoPanel.elem.style('opacity') ? InfoPanel.MOVE_DURATION : 0)
        .style('left', x + 'px')
        .style('top', y + 'px');

    if (InfoPanel.isShowing) return InfoPanel;
    InfoPanel.isShowing = true;

    InfoPanel.elem.interrupt('fade')
        .transition('fade')
        .delay(+InfoPanel.elem.style('opacity') ? 0 : delay)
        .ease(d3.easeSinOut)
        .duration(InfoPanel.FADE_IN_DURATION)
        .style('opacity', 1);

    return InfoPanel;
  }
}