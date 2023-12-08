export const random = {
  number(options: {min?: number, max?: number} = {}): number {
    const {min, max} = {min: 0, max: 1, ...options}
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
    return randomNumber;
  }
}