/** Whitelisted arithmetic parser. Never evals user input. */
export function calculate(source: string): number {
  if (/[\d.]\s+(?=[\d.eE])|[eE]\s+(?=[+\-\d])/.test(source)) throw Error("Separate numbers with an operator.");
  const brackets: string[] = [];
  for (const char of source) {
    if (char === "(" || char === "[") brackets.push(char);
    else if (char === ")" || char === "]") {
      if (brackets.pop() !== (char === ")" ? "(" : "[")) throw Error("Match each grouping bracket.");
    }
  }
  if (brackets.length) throw Error("Close each grouping bracket.");
  const input = source.replace(/\[/g,"(").replace(/\]/g,")").replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/√/g, "sqrt").replace(/\s/g, "");
  if (!input || input.length > 160 || /[^\d.+\-*/()^%sqrtpieEabcflound]/.test(input))
    throw Error("Use numbers, pi/e, grouping, supported functions, and arithmetic operators.");
  const tokens = input.match(/sqrt|cbrt|abs|floor|ceil|round|pi|e|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?|[+\-*/()^%sqrteE]/g) ?? [];
  if (tokens.join("") !== input) throw Error("Enter a complete number or expression.");
  const finite = (value: number): number => {
    if (!Number.isFinite(value)) throw Error("Every calculation step must have a finite real result.");
    return value;
  };
  let i = 0;
  function atom(): number {
    if (["sqrt", "cbrt", "abs", "floor", "ceil", "round"].includes(tokens[i])) {
      const fn = tokens[i++];
      if (tokens[i++] !== "(") throw Error("Use a supported function followed by (expression).");
      const value = expression();
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return percent(finite(fn === "sqrt" ? Math.sqrt(value) : fn === "cbrt" ? Math.cbrt(value) : fn === "abs" ? Math.abs(value) : fn === "floor" ? Math.floor(value) : fn === "ceil" ? Math.ceil(value) : Math.round(value)));
    }
    if (tokens[i] === "(") {
      i++;
      const v = expression();
      if (tokens[i++] !== ")") throw Error("Close each parenthesis.");
      return percent(v);
    }
    const t = tokens[i++];
    if (t === "pi" || t === "e") return percent(t === "pi" ? Math.PI : Math.E);
    if (!t || !/^\d|^\./.test(t)) throw Error("Enter a complete expression.");
    return percent(finite(Number(t)));
  }
  function percent(value: number): number {
    while (tokens[i] === "%") { i++; value /= 100; }
    return value;
  }
  function power(): number {
    const base = atom();
    if (tokens[i] !== "^") return base;
    i++;
    return finite(base ** unary());
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
      v = finite(op === "*" ? v * n : v / n);
    }
    return v;
  }
  function expression(): number {
    let v = product();
    while (["+", "-"].includes(tokens[i])) {
      const op = tokens[i++],
        n = product();
      v = finite(op === "+" ? v + n : v - n);
    }
    return v;
  }
  const result = expression();
  if (i !== tokens.length || !Number.isFinite(result))
    throw Error("Check the expression and avoid division by zero.");
  return result;
}
