/** Whitelisted arithmetic parser. Never evals user input. */
export function calculate(source: string): number {
  const input = source.replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/√/g, "sqrt").replace(/\s/g, "");
  if (!input || input.length > 160 || /[^\d.+\-*/()^%sqrt]/.test(input))
    throw Error("Use numbers, parentheses, and + − × ÷.");
  const tokens = input.match(/sqrt|(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()^%sqrt]/g) ?? [];
  if (tokens.join("") !== input) throw Error("Enter a complete number or expression.");
  let i = 0;
  function atom(): number {
    if (tokens[i] === "sqrt") {
      i++;
      if (tokens[i++] !== "(") throw Error("Use sqrt(expression).");
      const value = expression();
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return percent(Math.sqrt(value));
    }
    if (tokens[i] === "(") {
      i++;
      const v = expression();
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return percent(v);
    }
    const t = tokens[i++];
    if (!t || !/^\d|^\./.test(t)) throw Error("Enter a complete expression.");
    return percent(Number(t));
  }
  function percent(value: number): number {
    while (tokens[i] === "%") { i++; value /= 100; }
    return value;
  }
  function power(): number {
    const base = atom();
    if (tokens[i] !== "^") return base;
    i++;
    return base ** unary();
  }
  function unary(): number {
    if (tokens[i] === "+") { i++; return unary(); }
    if (tokens[i] === "-") { i++; return -unary(); }
    return power();
  }
  function product(): number {
    let v = unary();
    while (["*", "/"].includes(tokens[i])) {
      const op = tokens[i++],
        n = unary();
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
