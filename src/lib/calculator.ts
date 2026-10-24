/** Whitelisted arithmetic parser. Never evals user input. */
export function calculate(source: string): number {
  const input = source.replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s/g, "");
  if (!input || input.length > 160 || /[^\d.+\-*/()]/.test(input))
    throw Error("Use numbers, parentheses, and + − × ÷.");
  const tokens = input.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()]/g) ?? [];
  let i = 0;
  function atom(): number {
    if (tokens[i] === "-") {
      i++;
      return -atom();
    }
    if (tokens[i] === "+") {
      i++;
      return atom();
    }
    if (tokens[i] === "(") {
      i++;
      const v = expression();
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return v;
    }
    const t = tokens[i++];
    if (!t || !/^\d|^\./.test(t)) throw Error("Enter a complete expression.");
    return Number(t);
  }
  function product(): number {
    let v = atom();
    while (["*", "/"].includes(tokens[i])) {
      const op = tokens[i++],
        n = atom();
      v = op === "*" ? v * n : v / n;
    }
    return v;
  }
  function expression(): number {
    let v = product();
    while (["+", "-"].includes(tokens[i])) {
      const op = tokens[i++],
        n = product();
      v = op === "+" ? v + n : v - n;
    }
    return v;
  }
  const result = expression();
  if (i !== tokens.length || !Number.isFinite(result))
    throw Error("Check the expression and avoid division by zero.");
  return result;
}
