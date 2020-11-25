/**
 * Represents and controls the information panel element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * T 11/24/20
 */
class InfoPanel {
  static FADE_IN_DURATION = 86.81;

  static MOVE_DURATION = 86.81;

  static FADE_OUT_DURATION = 173.6;

  static PADDING = 12;

  /** @private */
  static elem = d3.select('#info-panel');

  /** @private */
  static isShowing = false;

  /** @private */
  static isCleared = false;

  static clear() {
    InfoPanel.elem.html('');
    InfoPanel.isCleared = false;

    return InfoPanel;
  }

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

  /** @private */
  static append(elemType, text, color, bold, italic) {
    if (InfoPanel.isCleared) InfoPanel.clear();
    let elem = InfoPanel.elem.append(elemType).style('color', color).text(text);
    if (bold) elem.style('font-weight', 'bold');
    if (italic) elem.style('font-style', 'italic');

    return elem;
  }

  static header(text, color = 'black', bold = false, italic = false) {
    InfoPanel.append('h4', text, color, bold, italic);
    return InfoPanel;
  }

  static text(text, color = 'black', bold, italic) {
    InfoPanel.append('span', text, color, bold, italic);
    return InfoPanel;
  }

  static newline() {
    InfoPanel.append('br');

    return InfoPanel;
  }

  /** @param {HTMLElement} target */
  static show(target) {
    if (!(target instanceof HTMLElement)) target = target.node();

    const targetRect = target.getBoundingClientRect(),
          elemRect = InfoPanel.elem.node().getBoundingClientRect();

    let x = targetRect.right - targetRect.width / 2 - elemRect.width / 2,
        y = targetRect.bottom - targetRect.height - InfoPanel.PADDING -
        elemRect.height;
    const rightLimit = window.innerWidth - InfoPanel.PADDING - elemRect.width;
    x = Math.min(Math.max(x, InfoPanel.PADDING), rightLimit);
    if (y < InfoPanel.PADDING) y = targetRect.bottom + InfoPanel.PADDING;

    InfoPanel.elem.transition('move')
        .ease(d3.easeSinOut)
        .duration(
            +InfoPanel.elem.style('opacity') ? InfoPanel.MOVE_DURATION : 0)
        .style('left', x + 'px')
        .style('top', y + 'px');

    if (InfoPanel.isShowing) return;
    InfoPanel.isShowing = true;

    InfoPanel.elem.interrupt('fade')
        .transition('fade')
        .ease(d3.easeSinOut)
        .duration(InfoPanel.FADE_IN_DURATION)
        .style('opacity', 1);
    //console.log('target', targetRect, '\n\nelem', elemRect);
  }
}