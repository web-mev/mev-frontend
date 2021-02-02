export class Utils {
  public static getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

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
}
