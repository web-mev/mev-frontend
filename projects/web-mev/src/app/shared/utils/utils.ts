import * as d3 from 'd3';

export class Utils {
  /**
   * Help function to get random color.
   */
  public static getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * Help function to get color scheme for charts
   */
  public static getColorScheme() {
    const colors = [
      '#332288',
      '#88CCEE',
      '#44AA99',
      '#117733',
      '#999933',
      '#DDCC77',
      '#CC6677',
      '#882255',
      '#AA4499',
      '#DDDDDD'
    ];
    return colors;
  }

  /**
   * Help function to calculate basic statistics for Box Plot
   */
  public static getBoxPlotStatistics(numbers: number[]) {
    const q1 = d3.quantile(numbers, 0.25);
    const q3 = d3.quantile(numbers, 0.75);
    return {
      q1: q1,
      median: d3.quantile(numbers, 0.5),
      q3: q3,
      iqr: q3 - q1,
      min: d3.min(numbers), // q1 - 1.5 * interQuantileRange
      max: d3.max(numbers) // q3 + 1.5 * interQuantileRange
    };
  }
}
