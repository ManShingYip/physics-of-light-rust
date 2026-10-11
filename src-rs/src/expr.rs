#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Op {
    Num(f32),
    Var,
    Add,
    Sub,
    Mul,
    Div,
    Pow,
    Sin,
    Cos,
    Exp,
    Sqrt,
    Abs,
    Neg,
}

const MAX_TOKENS: usize = 64;
const MAX_DEPTH: usize = 8;

pub fn parse(src: &str) -> Result<Vec<Op>, &'static str> {
    let toks = tokenize(src)?;
    if toks.len() > MAX_TOKENS {
        return Err("too long");
    }
    let mut out: Vec<Op> = Vec::new();
    let mut stack: Vec<(Tok, usize)> = Vec::new();
    let mut depth = 0usize;
    let mut prev: Option<Tok> = None;
    for t in toks {
        match t {
            Tok::Num(v) => out.push(Op::Num(v)),
            Tok::Var => out.push(Op::Var),
            Tok::Fn(f) => {
                stack.push((Tok::Fn(f), depth));
            }
            Tok::Op(o, prec) => {
                while let Some(&(top, _)) = stack.last() {
                    match top {
                        Tok::Op(_, tp) if tp >= prec => {
                            let (tk, _) = stack.pop().unwrap();
                            push_op(&mut out, tk)?;
                        }
                        _ => break,
                    }
                }
                stack.push((t, depth));
            }
            Tok::Unary => {
                stack.push((Tok::Unary, depth));
            }
            Tok::Open => {
                depth += 1;
                if depth > MAX_DEPTH {
                    return Err("too deep");
                }
                stack.push((Tok::Open, depth));
            }
            Tok::Close => {
                loop {
                    match stack.pop() {
                        Some((Tok::Open, _)) => break,
                        Some((tk, _)) => push_op(&mut out, tk)?,
                        None => return Err("unbalanced"),
                    }
                }
                if let Some(&(Tok::Fn(f), _)) = stack.last() {
                    stack.pop();
                    out.push(f);
                }
                depth = depth.saturating_sub(1);
            }
        }
        let cur_val = matches!(t, Tok::Num(_) | Tok::Var);
        let prev_val = prev.map(|p| matches!(p, Tok::Num(_) | Tok::Var | Tok::Close)).unwrap_or(false);
        if cur_val && prev_val {
            return Err("syntax");
        }
        prev = Some(t);
    }
    while let Some((tk, _)) = stack.pop() {
        if tk == Tok::Open {
            return Err("unbalanced");
        }
        push_op(&mut out, tk)?;
    }
    if out.is_empty() {
        return Err("empty");
    }
    Ok(out)
}

fn push_op(out: &mut Vec<Op>, t: Tok) -> Result<(), &'static str> {
    match t {
        Tok::Op(o, _) => out.push(o),
        Tok::Fn(f) => out.push(f),
        Tok::Unary => out.push(Op::Neg),
        _ => return Err("syntax"),
    }
    Ok(())
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum Tok {
    Num(f32),
    Var,
    Op(Op, u8),
    Fn(Op),
    Unary,
    Open,
    Close,
}

fn tokenize(src: &str) -> Result<Vec<Tok>, &'static str> {
    let mut v = Vec::new();
    let cs: Vec<char> = src.chars().collect();
    let mut i = 0;
    while i < cs.len() {
        let c = cs[i];
        if c.is_whitespace() {
            i += 1;
            continue;
        }
        if c.is_ascii_digit() || c == '.' {
            let mut j = i;
            while j < cs.len() && (cs[j].is_ascii_digit() || cs[j] == '.') {
                j += 1;
            }
            let s: String = cs[i..j].iter().collect();
            let f: f32 = s.parse().map_err(|_| "bad number")?;
            v.push(Tok::Num(f));
            i = j;
            continue;
        }
        if c.is_ascii_alphabetic() {
            let mut j = i;
            while j < cs.len() && cs[j].is_ascii_alphabetic() {
                j += 1;
            }
            let s: String = cs[i..j].iter().collect();
            match s.as_str() {
                "d" | "x" | "r" => v.push(Tok::Var),
                "sin" => v.push(Tok::Fn(Op::Sin)),
                "cos" => v.push(Tok::Fn(Op::Cos)),
                "exp" => v.push(Tok::Fn(Op::Exp)),
                "sqrt" => v.push(Tok::Fn(Op::Sqrt)),
                "abs" => v.push(Tok::Fn(Op::Abs)),
                _ => return Err("unknown ident"),
            }
            i = j;
            continue;
        }
        match c {
            '+' => v.push(Tok::Op(Op::Add, 1)),
            '-' => {
                let unary = v.is_empty()
                    || matches!(v.last(), Some(Tok::Op(_, _)) | Some(Tok::Open) | Some(Tok::Unary));
                if unary {
                    v.push(Tok::Unary);
                } else {
                    v.push(Tok::Op(Op::Sub, 1));
                }
            }
            '*' => v.push(Tok::Op(Op::Mul, 2)),
            '/' => v.push(Tok::Op(Op::Div, 2)),
            '^' => v.push(Tok::Op(Op::Pow, 3)),
            '(' => v.push(Tok::Open),
            ')' => v.push(Tok::Close),
            _ => return Err("bad char"),
        }
        i += 1;
    }
    Ok(v)
}

pub fn eval(prog: &[Op], d: f32) -> f32 {
    let mut st: Vec<f32> = Vec::new();
    for op in prog {
        match op {
            Op::Num(v) => st.push(*v),
            Op::Var => st.push(d),
            Op::Add | Op::Sub | Op::Mul | Op::Div | Op::Pow => {
                if st.len() < 2 {
                    return 0.0;
                }
                let b = st.pop().unwrap();
                let a = st.pop().unwrap();
                st.push(match op {
                    Op::Add => a + b,
                    Op::Sub => a - b,
                    Op::Mul => a * b,
                    Op::Div => {
                        if b.abs() < 1e-9 {
                            0.0
                        } else {
                            a / b
                        }
                    }
                    _ => a.powf(b),
                });
            }
            Op::Sin | Op::Cos | Op::Exp | Op::Sqrt | Op::Abs | Op::Neg => {
                if st.is_empty() {
                    return 0.0;
                }
                let a = st.pop().unwrap();
                st.push(match op {
                    Op::Sin => a.sin(),
                    Op::Cos => a.cos(),
                    Op::Exp => a.exp(),
                    Op::Sqrt => a.abs().sqrt(),
                    Op::Abs => a.abs(),
                    _ => -a,
                });
            }
        }
        if st.len() > 64 {
            return 0.0;
        }
    }
    st.pop().unwrap_or(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eval_basic() {
        let p = parse("2+3*d").unwrap();
        assert!((eval(&p, 2.0) - 8.0).abs() < 1e-5);
    }

    #[test]
    fn precedence_and_parens() {
        let p = parse("(2+3)*d^2").unwrap();
        assert!((eval(&p, 3.0) - 45.0).abs() < 1e-4);
    }

    #[test]
    fn rejects_bad() {
        assert!(parse("1+;(").is_err());
        assert!(parse("foo(d)").is_err());
        assert!(parse("((((((((9)))))))))").is_err());
    }
}
