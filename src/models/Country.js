export class Country {
  constructor(countryCode = null) {
    this.countryCode = countryCode.toLowerCase();
  }

  flagImg(useEmojiFlag = true, marginLeft = 0, height = 12, width = 16) {
    const img = document.createElement("img");
    img.src = useEmojiFlag
      ? `https://flagcdn.com/${width}x${height}/${this.countryCode}.png`
      : `https://flagcdn.com/h${Country.getClosestFlagHeight(height)}/${this.countryCode}.png`;
    img.alt = this.countryCode;
    img.style.marginLeft = `${marginLeft}px`;
    img.style.verticalAlign = "middle";
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    return img;
  }

  static getClosestFlagHeight(height) {
    const availableHeights = [20, 24, 40, 60, 80, 120, 240];
    return availableHeights.reduce((closestHeight, currentHeight) => {
      const closestDifference = Math.abs(closestHeight - height);
      const currentDifference = Math.abs(currentHeight - height);
      return currentDifference < closestDifference ? currentHeight : closestHeight;
    });
  }
}
