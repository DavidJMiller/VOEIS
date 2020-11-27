/**
 * Provides utility-functions to the VOEIS project that are accessible
 * everywhere.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * T 11/24/20
 */
class Util {
  static GOLDEN_ANGLE_DEG = 137.5077640500379

    /**
     * Generates high-contrasting colors using the golden angle approximation.
     * @param {number} index The index of the current color. Use consecutive
     *     indices for the best contrasts.
     * @param {number} saturation The fixed saturation value for all generated
     *     colors. Defaults to 1.
     * @param {number} lightness The fixed lightness value for all generated
     *     colors. Defaults to 0.5.
     * @param {number} startHue The hue of the zeroth color. Defaults to 210.
     * @returns {string} The HSL-color formatted as `<h-value>, <s-value>,
     *     <v-value>`.
     */
    static generateColor(
      index, saturation = 1, lightness = 0.5, startHue = 210) {
    let hue =
      (Math.round(Util.GOLDEN_ANGLE_DEG * index + startHue) % 360 + 360) % 360;

    return `${hue}, ${saturation * 100}%, ${lightness * 100}%`;
  }

  static SMALL_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'is',
    'in', 'of', 'off', 'on', 'or', 'the', 'to', 'v', 'via', 'vs'
  ]);

  /**
   * Converts a piece of text into title case.
   * @param {string} text The text to convert.
   */
  static toTitleCase(text) {
    return text.split(/([^0-9A-Za-z]+)/)
      .map((x, i) => i > 0 && Util.SMALL_WORDS.has(x)
          ? x
          : x[0].toUpperCase() + x.substr(1))
      .join('');
  }
}
