export function cleanForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/\$\$([^$]+)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\alpha/g, "alpha")
    .replace(/\\beta/g, "beta")
    .replace(/\\gamma/g, "gamma")
    .replace(/\\delta/g, "delta")
    .replace(/\\sigma/g, "sigma")
    .replace(/\\theta/g, "theta")
    .replace(/\\pi/g, "pi")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    .replace(/\\times/g, "times")
    .replace(/\\div/g, "divided by")
    .replace(/[\\{}]/g, "")
    .replace(/_(\w)/g, " $1")
    .replace(/\^(\w)/g, " $1");
}