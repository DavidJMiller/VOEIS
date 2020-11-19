/**
 * Provides utility-functions to the VOEIS project that are accessible
 * everywhere.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/18/20
 */
class Util {
  /**
   * Generates high-contrasting colors using the golden angle approximation.
   * @param {number} index The index of the current color. Use consecutive
   *     indices for the best contrasts.
   * @param {number} startHue The hue of the zeroth color. Defaults to 210.
   * @param {number} saturation The fixed saturation value for all generated
   *     colors. Defaults to 1.
   * @param {number} lightness The fixed lightness value for all generated
   *     colors. Default to 0.5.
   * @returns {string} The HSL-color formatted as `<h-value>, <s-value>,
   *     <v-value>`.
   */
  static generateColor(index, startHue = 210, saturation = 1, lightness = 0.5) {
    const GOLDEN_ANGLE_DEG = 137.5077640500379;
    let hue = Math.round((GOLDEN_ANGLE_DEG * index + startHue) % 360 + 360);

    return `${hue}, ${saturation * 100}%, ${lightness * 100}%`;
  }
}
