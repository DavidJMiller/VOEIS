
/**
 * Represents and provides data ready to be plotted.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/25/20
 */
class Plottable {
  /**
   * Creates a new `Plottable` instance.
   * @param {object} rawData The raw JSON data that's used to generate this
   *   plottable data.
   * @param {number[]} xExtent The extent of the X-values, in the form of `[min,
   *   max]`.
   * @param {number[]} yExtent The extent of the Y-values, in the form of `[min,
   *   max]`.
   * @param {number[]} x The actual X-values ready to be scaled and plotted.
   * @param {number[]} y The actual Y-values ready to be scaled and plotted.
   *   Must have the same length as `x`.
   * @param {number[]} magnitudes The attached "magnitude" value for each data
   *   point. Must have the same length as `x` or be `null`. Defaults to
   *   `null`.
   */
  constructor(rawData, xExtent, yExtent, x, y, magnitudes = null) {
    this.rawData = rawData;
    this.xExtent = xExtent;
    this.yExtent = yExtent;
    this.x = x;
    this.y = y;
    this.magnitudes = magnitudes;

    if (y.length != x.length || magnitudes && magnitudes.length != x.length)
      throw 'Lengths of data points do not match.';

    this.length = x.length;
  }
}
