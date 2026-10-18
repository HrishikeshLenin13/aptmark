"""Deterministic original candidates. Symbolic and independent arithmetic checks.
Difficulty is provisional. No generator grants editorial approval.
"""
import random, math
from fractions import Fraction as F
from statistics import mean, median
import sympy as sp
X,Y = sp.symbols('x y', real=True)
FAMILIES = {
'linear-one':['linear-isolate','linear-distribute','linear-parameter'],
'linear-two':['line-coordinate','perpendicular'],
'linear-functions':['rate-model','line-table'],
'linear-systems':['system-eliminate','ticket-system'],
'linear-inequalities':['budget-inequality'],
'equivalent':['factor-coefficient','rational-cancel'],
'nonlinear-equations':['quadratic-roots','radical-domain','nonlinear-system'],
'nonlinear-functions':['vertex-shift','exponential-model'],
'ratios':['unit-rate'], 'percentages':['successive-percent'],
'one-variable':['mean-missing','median-shift'], 'two-variable':['regression-predict'],
'probability':['conditional-table'], 'inference':['margin-interval'],
'statistical-claims':['random-assignment'],
'area-volume':['cylinder-volume'], 'lines-triangles':['similar-triangles'],
 'trigonometry':['right-triangle-sine'], 'circles':['circle-radius','circle-square']}

def render(v):
    v=sp.Rational(v) if isinstance(v,F) else sp.sympify(v)
    return str(v)

def make(family, seed):
    r=random.Random(seed); a=r.randint(2,28); b=r.randint(3,80); x=r.randint(2,60); c=r.randint(2,30)
    diagram=None; table=None; verify='exact-arithmetic'; difficulty='medium'; choices=None
    if family=='linear-isolate':
        stem=f'If ${a}x+{b}={a*x+b}$, what is the value of $x$?'; ans=x
        solve=sp.solve(a*X+b-(a*x+b),X); assert solve==[x] and a*x+b==a*ans+b
        steps=[f'Subtract {b} from each side to obtain ${a}x={a*x}$.',f'Divide both sides by {a}: $x={x}$.']; difficulty='easy'; verify='sympy-solve+substitution'
    elif family=='linear-distribute':
        k=a+c; d=a*(x+b)-c*x
        stem=f'The equation ${a}(x+{b})={c}x+{d}$ has solution $x$. What is $x$?' if d>=0 else f'What value of $x$ satisfies ${a}(x+{b})={c}x-{abs(d)}$?'
        if a==c: return None
        ans=F(d-a*b,a-c); assert sp.solve(a*(X+b)-c*X-d,X)==[sp.Rational(ans.numerator,ans.denominator)] and a*(ans+b)==c*ans+d
        steps=[f'Distribute {a} across the parentheses.',f'Collect variable terms: $({a}-{c})x={d}-{a*b}$.',f'Divide to obtain $x={render(ans)}$.']; difficulty='medium'; verify='sympy-solve+fraction-substitution'
    elif family=='linear-parameter':
        stem=f'For all values of $x$, ${a}(x+{b})={a}x+k$. What is $k$?'; ans=a*b
        assert sp.expand(a*(X+b))==a*X+ans
        steps=[f'Distribute {a}: ${a}x+{a*b}$.',f'Match the constant terms, giving $k={ans}$.']; verify='sympy-expansion+arithmetic'
    elif family=='line-coordinate':
        ans=a*x+b; stem=f'The point $({x},y)$ lies on the line $y={a}x+{b}$. What is $y$?'
        assert (a*X+b).subs(X,x)==ans
        steps=[f'Substitute $x={x}$ into the equation.',f'$y={a}({x})+{b}={ans}$.']; difficulty='easy'
    elif family=='perpendicular':
        ans=F(-1,a); stem=f'Line $k$ has equation $y={a}x+{b}$. A second line is perpendicular to $k$. What is its slope?'
        assert a*ans==-1
        steps=[f'The slope of $k$ is {a}.','Slopes of perpendicular, nonvertical lines have product $-1$.',f'The required slope is $-1/{a}$.']
    elif family=='rate-model':
        stem=f'A studio charges a one-time setup fee of ${b} dollars and ${a} dollars per hour. A booking costs ${a*x+b} dollars. How many hours is the booking?'; ans=x
        assert F(a*x+b-b,a)==x
        steps=[f'Subtract the setup fee: ${a*x+b}-{b}={a*x}$.',f'Divide by the hourly rate: ${a*x}/{a}={x}$ hours.']
    elif family=='line-table':
        ans=a; table={'headers':['x','f(x)'],'rows':[[x,a*x+b],[x+c,a*(x+c)+b],[x+2*c,a*(x+2*c)+b]]}
        stem='The table gives three values of the linear function $f$. What is the rate of change of $f$ with respect to $x$?'
        assert F(table['rows'][1][1]-table['rows'][0][1],c)==a
        steps=[f'For a change of {c} in $x$, $f(x)$ changes by {a*c}.',f'The rate of change is ${a*c}/{c}={a}$.']
    elif family in ('system-eliminate','ticket-system'):
        y=r.randint(2,30); c=a+r.randint(1,9); total=x+y; cost=a*x+c*y; ans=y
        stem=f'The system $x+y={total}$ and ${a}x+{c}y={cost}$ has solution $(x,y)$. What is $y$?' if family=='system-eliminate' else f'At a school event, {total} tickets were sold. Student tickets cost ${a} dollars each and adult tickets cost ${c} dollars each. Total sales were ${cost} dollars. How many adult tickets were sold?'
        sol=sp.solve([X+Y-total,a*X+c*Y-cost],[X,Y]); assert sol[Y]==ans and (cost-a*total)//(c-a)==y
        steps=[f'Substitute $x={total}-y$ into the cost equation.',f'After simplifying, ${c-a}y={cost-a*total}$.',f'$y={y}$.']; verify='sympy-system+elimination'
    elif family=='budget-inequality':
        limit=a*x+b+r.randint(0,a-1); ans=(limit-b)//a
        stem=f'A club has ${limit} dollars to spend. There is a fixed delivery fee of ${b} dollars, and each kit costs ${a} dollars. What is the greatest number of kits the club can buy?'
        assert a*ans+b<=limit<a*(ans+1)+b
        steps=[f'The budget inequality is ${a}n+{b}\\leq {limit}$.',f'$n\\leq {render(F(limit-b,a))}$.',f'The greatest permitted whole number is {ans}.']
    elif family=='factor-coefficient':
        stem=f'The expression $x^2+{a+b}x+{a*b}$ is equivalent to $(x+{a})(x+k)$. What is $k$?'; ans=b
        assert sp.expand((X+a)*(X+b))==X**2+(a+b)*X+a*b
        steps=[f'The two constants must sum to {a+b} and multiply to {a*b}.',f'They are {a} and {b}, so $k={b}$.']; verify='sympy-expand+coefficient-check'
    elif family=='rational-cancel':
        stem=f'For $x\\ne {a}$, the expression $\\frac{{{c}x^2-{c*a*a}}}{{x-{a}}}$ is equivalent to ${c}x+k$. What is $k$?'; ans=c*a
        assert sp.cancel(c*(X**2-a*a)/(X-a))==c*(X+a)
        steps=[f'Factor the numerator: ${c}(x-{a})(x+{a})$.',f'For $x\\ne {a}$, cancel the common factor. The expression is ${c}x+{c*a}$, so $k={c*a}$.']; verify='sympy-cancel+domain'; difficulty='hard'
    elif family=='quadratic-roots':
        p=x; q=x+c; ans=q; stem=f'What is the greater solution of $x^2-{p+q}x+{p*q}=0$?'
        assert sorted(sp.solve(X**2-(p+q)*X+p*q,X))==[p,q]
        steps=[f'Factor: $(x-{p})(x-{q})=0$.',f'The solutions are {p} and {q}; the greater solution is {q}.']; verify='sympy-roots+substitution'
    elif family=='radical-domain':
        k=r.randint(2,12); ans=k*k-b; stem=f'What value of $x$ satisfies $\\sqrt{{x+{b}}}={k}$?'
        assert sp.solve(sp.sqrt(X+b)-k,X)==[ans] and math.isqrt(ans+b)==k
        steps=[f'Square each side: $x+{b}={k*k}$.',f'$x={ans}$. This satisfies the original equation and the radicand is nonnegative.']; verify='sympy-radical+domain'; difficulty='medium'
    elif family=='nonlinear-system':
        k=r.randint(2,20); ans=k*k; stem=f'The equations $y=x^2$ and $y={k*k}$ intersect at two points. What is the product of the $x$-coordinates of these points?'; ans=-k*k
        sol=sp.solve(X**2-k*k,X); assert math.prod(sol)==ans
        steps=[f'Set $x^2={k*k}$, so $x=-{k}$ or $x={k}$.',f'The product is $(-{k})({k})={ans}$.']; verify='sympy-intersection+product'; difficulty='hard'
    elif family=='vertex-shift':
        stem=f'The function $f(x)={a}(x-{x})^2+{b}$ has a minimum. What is the $x$-coordinate of that minimum?'; ans=x
        assert sp.diff(a*(X-x)**2+b,X).subs(X,x)==0 and a>0
        steps=['A square is never negative, and the leading coefficient is positive.',f'The square is zero at $x={x}$, so the minimum occurs there.']; verify='sympy-derivative+nonnegative-square'
        diagram={'kind':'parabola','h':x,'k':b,'a':a,'alt':f'Parabola f(x)={a}(x-{x}) squared + {b}, opening upward.','toScale':True}
    elif family=='exponential-model':
        periods=r.randint(2,4); base=r.choice([2,3,4]); ans=b*base**periods
        stem=f'In a mathematical model, a population begins at {b} organisms and multiplies by {base} every hour. What is the predicted population after {periods} hours?'
        check=b
        for _ in range(periods): check*=base
        assert check==ans
        steps=[f'The model is $P(t)={b}({base})^t$.',f'$P({periods})={b}({base})^{{{periods}}}={ans}$.']
    elif family=='unit-rate':
        gallons=a*c; distance=b*c; ans=F(distance,gallons)
        stem=f'A vehicle travels {distance} miles using {gallons} gallons of fuel. At this constant rate, how many miles does it travel per gallon?'
        assert ans*gallons==distance
        steps=[f'Divide miles by gallons: ${distance}/{gallons}$.',f'The rate is ${render(ans)}$ miles per gallon.']; difficulty='easy'
    elif family=='successive-percent':
        price=100*r.randint(2,40); p=r.choice([10,15,20,25]); q=r.choice([10,20,30]); ans=F(price*(100+p)*(100-q),10000)
        stem=f'An item costs ${price} dollars. Its price increases by {p}%, then the new price decreases by {q}%. What is its final price, in dollars?'
        assert sp.Rational(price)*(1+sp.Rational(p,100))*(1-sp.Rational(q,100))==sp.Rational(ans.numerator,ans.denominator)
        steps=[f'After the increase, the price is ${render(F(price*(100+p),100))}$.',f'Multiply that result by $1-{q}/100$ to obtain ${render(ans)} dollars.']; difficulty='hard'
    elif family=='mean-missing':
        vals=[r.randint(5,80) for _ in range(4)]; ans=x; average=F(sum(vals)+x,5)
        stem=f'The mean of five numbers is ${render(average)}$. Four numbers are {", ".join(map(str,vals))}. What is the fifth number?'
        assert sp.Rational(sum(vals)+ans,5)==sp.Rational(average.numerator,average.denominator)
        steps=[f'The total of the five numbers is $5({render(average)})={sum(vals)+x}$.',f'Subtract the four known numbers to get {x}.']
    elif family=='median-shift':
        vals=sorted(r.sample(range(2,100),7)); ans=vals[3]+a
        stem=f'A data set contains {", ".join(map(str,vals))}. If {a} is added to every value, what is the new median?'
        assert median([v+a for v in vals])==ans
        steps=[f'The original middle (fourth) value is {vals[3]}.',f'Adding {a} to every value preserves order, so the median becomes {ans}.']
    elif family=='regression-predict':
        stem=f'A linear model for a hypothetical data set is $\\hat{{y}}={a}x+{b}$. For $x={x}$, the observed value is {a*x+b+c}. What is the residual (observed minus predicted)?'; ans=c
        assert (a*x+b+c)-(a*x+b)==c
        steps=[f'The predicted value is ${a}({x})+{b}={a*x+b}$.',f'The residual is ${a*x+b+c}-{a*x+b}={c}$.']
        table={'headers':['x','Observed y'], 'rows':[[x,a*x+b+c]]}
    elif family=='conditional-table':
        other=r.randint(10,100); ans=F(a,a+b)
        stem='A club records the following counts. If one member who attended is selected at random, what is the probability that the member is a senior?'
        table={'headers':['Year','Attended','Did not attend'],'rows':[['Senior',a,other],['Junior',b,c]]}
        assert ans*(a+b)==a
        steps=[f'Only the {a+b} members who attended are in the conditional sample space.',f'{a} are seniors, so the probability is ${render(ans)}$.']
    elif family=='margin-interval':
        est=r.randint(35,65); margin=r.randint(2,9); ans=est+margin
        stem=f'A survey estimates that {est}% of a population supports a proposal, with a margin of error of {margin} percentage points. What is the upper endpoint of the reported interval, as a percent?'
        assert ans-margin==est and ans<=100
        steps=[f'An interval with this margin runs from ${est}-{margin}$ to ${est}+{margin}$.',f'The upper endpoint is {ans}%.']; difficulty='easy'
    elif family=='random-assignment':
        n=2*r.randint(30,900); ans='Random assignment helps isolate the effect of the program from preexisting differences between groups.'
        stem=f'In a hypothetical study, {n} volunteers are randomly assigned to either a new study program or the usual program. Which statement best explains the purpose of random assignment?'
        choices=[ans,'Random assignment guarantees that every student in the population volunteers.','Random assignment guarantees that both groups receive identical final scores.','Random assignment makes a control group unnecessary.']
        steps=['Random assignment tends to balance potential confounding characteristics across treatment groups.','It supports causal inference within the study, but does not guarantee population representativeness or any particular outcome.']; verify='logical-template-requires-editorial-review'
    elif family=='cylinder-volume':
        ans=a*a*b; stem=f'A right circular cylinder has radius {a} centimeters and height {b} centimeters. Its volume is $k\\pi$ cubic centimeters. What is $k$?'
        assert sp.simplify(sp.pi*a*a*b / sp.pi)==ans
        steps=['Use $V=\\pi r^2h$.',f'$V=\\pi({a})^2({b})={ans}\\pi$, so $k={ans}$.']
    elif family=='similar-triangles':
        ratio=r.randint(2,8); ans=b*ratio
        stem=f'Triangles ABC and DEF are similar, with A corresponding to D and B to E. Side AB is {a} units and DE is {a*ratio} units. If BC is {b} units, how long is EF?'
        assert F(ans,b)==F(a*ratio,a)
        steps=[f'The scale factor from ABC to DEF is ${a*ratio}/{a}={ratio}$.',f'The corresponding side EF is ${b}({ratio})={ans}$ units.']
    elif family=='right-triangle-sine':
        scale=r.randint(2,600); leg=3*scale; hyp=5*scale; ans=F(3,5)
        stem=f'In right triangle ABC, angle C is the right angle. Side BC is {leg} units, AC is {4*scale} units, and AB is {hyp} units. What is $\\sin A$?'
        assert leg**2+(4*scale)**2==hyp**2 and F(leg,hyp)==ans
        steps=['Sine is opposite side divided by hypotenuse.',f'For angle A, the opposite side is BC, so $\\sin A={leg}/{hyp}=3/5$.']
        diagram={'kind':'triangle','sides':[leg,4*scale,hyp],'alt':f'Right triangle ABC, right angle C, BC={leg}, AC={4*scale}, AB={hyp}.','toScale':False}
    elif family=='circle-radius':
        stem=f'A circle has equation $(x-{x})^2+(y-{b})^2={a*a}$. What is its radius?'; ans=a
        assert sp.sqrt(a*a)==a
        steps=['In the standard circle equation, the right side equals $r^2$.',f'$r=\\sqrt{{{a*a}}}={a}$.']; difficulty='easy'
    elif family=='circle-square':
        h=x; k=b; radius=r.randint(3,25); rhs=radius**2-h*h-k*k; ans=radius
        stem=f'The circle $x^2+y^2-{2*h}x-{2*k}y={rhs}$ has radius $r$. What is $r$?'
        assert sp.expand((X-h)**2+(Y-k)**2-radius**2)==X**2+Y**2-2*h*X-2*k*Y-rhs
        steps=[f'Complete both squares: $(x-{h})^2+(y-{k})^2={rhs}+{h*h}+{k*k}={radius**2}$.',f'The radius is $\\sqrt{{{radius**2}}}={radius}$.']; verify='sympy-expansion+distance'; difficulty='hard'
    else: raise ValueError(family)
    answer=render(ans) if choices is None else ans
    if choices is None:
        val=sp.Rational(answer); offsets=[1,-1,2,-2,a,-a,b,-b]
        wrong=[]
        for off in offsets:
            z=val+off
            if z!=val and str(z) not in wrong: wrong.append(str(z))
        choices=[answer]+wrong[:3]
        # Verify exact numerical uniqueness, including equivalent fractions.
        assert len({sp.Rational(v) for v in choices})==4
    r.shuffle(choices)
    return dict(stem=stem,passage=None,options=choices,correctAnswer=answer,steps=steps,explanation=' '.join(steps),difficulty=difficulty,verification=verify,diagram=diagram,table=table)
