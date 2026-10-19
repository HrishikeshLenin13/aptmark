"""Additional structural families with exact, independent verification.
These are original provisional candidates, never automatic editorial approvals.
"""
import random
from fractions import Fraction as F
import sympy as sp
X = sp.Symbol('x', real=True)
FAMILIES = {
 'linear-systems':['m2-inconsistent-system'],
 'linear-inequalities':['m2-negative-coefficient-bound'],
 'equivalent':['m2-rational-domain'],
 'nonlinear-equations':['m2-discriminant-parameter'],
 'nonlinear-functions':['m2-exponential-initial'],
 'linear-functions':['m2-shifted-intercept'],
 'ratios':['m2-area-unit-conversion'],
 'one-variable':['m2-spread-scaling'],
 'inference':['m2-sample-size-margin'],
 'area-volume':['m2-similar-solid-volume'],
 'circles':['m2-arc-coefficient'],
 'trigonometry':['m2-complementary-ratios'],
}
SOURCE='https://satsuite.collegeboard.org/practice/student-question-bank/math'

def make(family, seed):
    r=random.Random(f'{family}:{seed}'); a=r.randint(2,9); b=r.randint(2,20); c=r.randint(2,12)
    difficulty='hard'; domain=[]
    if family=='m2-inconsistent-system':
        factor=r.randint(2,6); rhs=r.randint(10,60)
        stem=f'The system ${a}x+{b}y={rhs}$ and $kx+{factor*b}y={factor*rhs+1}$ has no solution. What is the value of $k$?'
        answer=factor*a
        matrix=sp.Matrix([[a,b],[answer,factor*b]])
        augmented=matrix.row_join(sp.Matrix([rhs,factor*rhs+1]))
        assert matrix.det()==0 and matrix.rank()==1 and augmented.rank()==2
        steps=[f'For parallel distinct lines, the coefficients of $x$ and $y$ must have the same scale factor: ${factor*b}/{b}={factor}$.',f'Thus $k={factor}({a})={answer}$. The constants do not have this ratio, since ${factor*rhs+1}\\ne {factor}({rhs})$, so the lines are distinct.']
        wrong=[(a,'Uses the first x coefficient without applying the common scale factor.'),(factor,'Reports the coefficient ratio instead of the requested coefficient.'),(answer+1,'Adjusts the x coefficient as if the difference between constants should be added to it.')]
        domain=['classify solution counts','compare coefficient and constant ratios']
    elif family=='m2-negative-coefficient-bound':
        threshold=r.randint(3,35); k=r.randint(2,8); offset=r.randint(50,150)
        stem=f'What is the least integer $x$ satisfying ${offset}-{k}x<{offset-k*threshold}$?'
        answer=threshold+1
        assert offset-k*answer<offset-k*threshold and not offset-k*(answer-1)<offset-k*threshold
        solution=sp.solve_univariate_inequality(offset-k*X<offset-k*threshold,X)
        assert solution.as_set() == sp.Interval.open(threshold,sp.oo)
        steps=[f'Subtract {offset} to obtain $-{k}x<-{k*threshold}$.',f'Dividing by $-{k}$ reverses the inequality, giving $x>{threshold}$.',f'The least integer greater than {threshold} is {answer}.']
        wrong=[(threshold,'Includes the excluded endpoint of a strict inequality.'),(threshold-1,'Reverses the direction incorrectly when dividing by a negative coefficient.'),(-threshold,'Changes the sign of the endpoint instead of the inequality direction.')]
        domain=['reverse inequality for negative divisor','interpret strict integer bound']
    elif family=='m2-rational-domain':
        k=r.randint(2,30); t=k+r.randint(2,15)
        stem=f'For $x\\ne {k}$, $f(x)=\\frac{{x^2-{k*k}}}{{x-{k}}}$. What is $f({t})$?'
        answer=t+k
        expression=(X**2-k*k)/(X-k)
        assert sp.cancel(expression)==X+k and expression.subs(X,t)==answer and t!=k
        assert F(t*t-k*k,t-k)==answer
        steps=[f'Factor the numerator: $x^2-{k*k}=(x-{k})(x+{k})$.',f'Cancel $x-{k}$ only on the stated domain $x\\ne {k}$.',f'$f({t})={t}+{k}={answer}$.']
        wrong=[(t-k,'Subtracts the root instead of retaining the other factor.'),(t*t-k*k,'Evaluates only the numerator and omits division.'),(t,'Treats cancellation as removing both appearances of the constant.')]
        domain=['factor difference of squares','retain excluded input'];difficulty='medium'
    elif family=='m2-discriminant-parameter':
        root=r.randint(3,35); leading=r.randint(2,7); coefficient=2*leading*root
        stem=f'The equation ${leading}x^2-{coefficient}x+k=0$ has exactly one distinct real solution. What is $k$?'
        answer=leading*root*root
        poly=leading*X**2-coefficient*X+answer
        assert sp.discriminant(poly,X)==0 and sp.solve(poly,X)==[root]
        assert sp.expand(leading*(X-root)**2)==poly
        steps=['A quadratic with exactly one distinct real solution has discriminant zero.',f'${coefficient}^2-4({leading})k=0$, so $k={coefficient**2}/{4*leading}={answer}$.',f'The resulting polynomial is ${leading}(x-{root})^2$, confirming the repeated root.']
        wrong=[(root,'Reports the repeated root rather than the constant k.'),(root*root,'Omits the leading coefficient when forming the perfect square.'),(2*answer,'Uses an incorrect denominator in the discriminant equation.')]
        domain=['discriminant condition','interpret requested parameter']
    elif family=='m2-exponential-initial':
        start=r.randint(4,25); factor=r.choice([2,3,4]); delay=r.randint(2,4); observed=start*factor**delay
        stem=f'The model $P(t)={observed}({factor})^{{t-{delay}}}$ gives a quantity $t$ hours after observation began. What is $P(0)$?'
        answer=start
        assert sp.Integer(observed)*sp.Integer(factor)**(-delay)==answer
        check=answer
        for _ in range(delay): check*=factor
        assert check==observed
        steps=[f'Substitute $t=0$, so $P(0)={observed}({factor})^{{-{delay}}}$.',f'A negative exponent means division: $P(0)={observed}/{factor**delay}={answer}$.']
        wrong=[(observed,'Treats the coefficient as the initial value despite the shifted exponent.'),(observed*factor**delay,'Changes the negative exponent to positive.'),(F(observed,factor),'Moves back just one period instead of the stated number of periods.')]
        domain=['interpret shifted exponential model','evaluate negative exponent']
    elif family=='m2-shifted-intercept':
        slope=r.randint(2,15); shift=r.randint(3,25); value=r.randint(20,90)
        stem=f'The linear function $f$ satisfies $f(x+{shift})={slope}x+{value}$ for all real $x$. What is $f(0)$?'
        answer=value-slope*shift
        u=sp.Symbol('u'); expression=slope*(u-shift)+value
        assert sp.expand(expression.subs(u,X+shift))==slope*X+value
        assert expression.subs(u,0)==answer
        steps=[f'To obtain $f(0)$, set $x+{shift}=0$, so $x=-{shift}$.',f'$f(0)={slope}(-{shift})+{value}={answer}$.']
        wrong=[(value,'Uses x=0, which gives f(shift) rather than f(0).'),(value+slope*shift,'Shifts the input in the wrong direction.'),(slope,'Reports the slope instead of the output at zero.')]
        domain=['change input representation','distinguish intercept from shifted value']
    elif family=='m2-area-unit-conversion':
        length=r.randint(4,40); width=r.randint(3,25); scale=r.choice([10,100]); area=length*width
        stem=f'A rectangular panel has area {area} square units. One unit of length equals {scale} centimeters. What is the panel’s area in square centimeters?'
        answer=area*scale**2
        assert (length*scale)*(width*scale)==answer
        steps=[f'Each square unit has area ${scale}^2={scale**2}$ square centimeters.',f'Multiply the given area by {scale**2}: ${area}({scale**2})={answer}$.']
        wrong=[(area*scale,'Applies the linear conversion once instead of squaring it.'),(F(area,scale**2),'Divides by the conversion factor in the wrong direction.'),(area,'Leaves the area in the original units.')]
        domain=['convert squared units'];difficulty='medium'
    elif family=='m2-spread-scaling':
        values=sorted(r.sample(range(1,40),5)); multiplier=r.randint(2,7); shift=r.randint(4,30)
        stem=f'Data set A contains {", ".join(map(str,values))}. Each value in A is multiplied by {multiplier} and then increased by {shift} to form data set B. If A has standard deviation $s$, what is the standard deviation of B in terms of $s$?'
        answer=str(multiplier)+'s'
        mean=sp.Rational(sum(values),len(values)); transformed=[multiplier*v+shift for v in values]; mean2=sp.Rational(sum(transformed),len(values))
        variance=sum((sp.Integer(v)-mean)**2 for v in values)/len(values)
        variance2=sum((sp.Integer(v)-mean2)**2 for v in transformed)/len(values)
        assert variance>0 and sp.simplify(variance2/variance)==multiplier**2
        steps=[f'Adding {shift} moves every value and the mean equally, leaving deviations unchanged.',f'Multiplication by {multiplier} multiplies every deviation by {multiplier}, so standard deviation is ${multiplier}s$.']
        wrong=[(f'{multiplier}s+{shift}','Adds the location shift to a measure of spread.'),(f'{multiplier**2}s','Scales standard deviation as if it were variance.'),('s','Ignores the multiplicative change in spread.')]
        domain=['distinguish center from spread','distinguish variance from standard deviation']
    elif family=='m2-sample-size-margin':
        sample=r.choice([100,144,196,256,400]); factor=r.choice([2,3,4]); margin=r.randint(3,9)
        stem=f'For a hypothetical survey design, the estimated margin of error is modeled as inversely proportional to the square root of sample size. A sample of {sample} gives a margin of error of {margin} percentage points. Under this model, what margin, in percentage points, corresponds to a sample of {sample*factor**2}?'
        answer=F(margin,factor)
        assert sp.simplify(sp.sqrt(sp.Rational(sample,sample*factor**2))*margin)==sp.Rational(answer.numerator,answer.denominator)
        steps=[f'The sample size increases by a factor of {factor**2}.',f'Under the stated model, divide the margin by $\\sqrt{{{factor**2}}}={factor}$: ${margin}/{factor}={answer}$.']
        wrong=[(F(margin,factor**2),'Divides by the sample-size ratio instead of its square root.'),(margin*factor,'Increases the margin when the model predicts a decrease.'),(margin,'Ignores the change in sample size.')]
        domain=['interpret inverse square-root model','separate model from empirical guarantee']
    elif family=='m2-similar-solid-volume':
        small=r.randint(3,35); scale=r.randint(2,7)
        stem=f'Two geometrically similar solids have corresponding lengths in a ratio of $1:{scale}$. The smaller solid has volume {small} cubic units. What is the larger solid’s volume, in cubic units?'
        answer=small*scale**3
        assert sp.expand((scale*X)**3/X**3)==scale**3
        steps=[f'For similar solids, the volume ratio is the cube of the length ratio: $1:{scale**3}$.',f'The larger volume is ${small}({scale**3})={answer}$ cubic units.']
        wrong=[(small*scale,'Applies the linear scale factor to volume.'),(small*scale**2,'Uses the area scale factor rather than the volume scale factor.'),(F(small,scale**3),'Scales in the opposite direction.')]
        domain=['model cubic scaling'];difficulty='medium'
    elif family=='m2-arc-coefficient':
        radius=r.randint(3,50); angle=r.choice([30,45,60,90,120,135,150])
        stem=f'An arc of a circle with radius {radius} has central angle ${angle}^\\circ$. Its length is $k\\pi$. What is $k$?'
        answer=F(radius*angle,180)
        assert sp.simplify(2*sp.pi*radius*sp.Rational(angle,360)/sp.pi)==sp.Rational(answer.numerator,answer.denominator)
        steps=[f'The arc is ${angle}/360$ of the circumference $2\\pi({radius})$.',f'Its length is $({angle}/360)(2\\pi)({radius})={answer}\\pi$, so $k={answer}$.']
        wrong=[(F(radius*angle,360),'Omits the factor of 2 in circumference.'),(F(radius*radius*angle,360),'Uses the sector-area formula instead of arc length.'),(2*radius,'Reports the coefficient of the full circumference.')]
        domain=['distinguish sector area and arc length'];difficulty='medium'
    elif family=='m2-complementary-ratios':
        scale=r.randint(2,50); triple=r.choice([(3,4,5),(5,12,13),(8,15,17),(7,24,25)]); u,v,h=triple
        stem=f'In right triangle ABC, angle C is $90^\\circ$, BC is {u*scale}, AC is {v*scale}, and AB is {h*scale}. What is $\\cos(90^\\circ-A)$?'
        answer=F(u,h)
        assert u*u+v*v==h*h and F(u*scale,h*scale)==answer
        steps=['The acute angles are complementary, so $\\cos(90^\\circ-A)=\\sin A$.',f'The opposite side to A is BC and the hypotenuse is AB: $\\sin A={u*scale}/{h*scale}={answer}$.']
        wrong=[(F(v,h),'Computes cosine of A instead of cosine of its complement.'),(F(u,v),'Uses tangent of A.'),(F(h,u),'Inverts the required sine ratio.')]
        domain=['use complementary-angle identity','identify opposite side and hypotenuse'];difficulty='medium'
    else:
        raise ValueError(family)
    answer=str(answer); explanations={answer:' '.join(steps)}
    for value,reason in wrong:
        value=str(value)
        if value==answer or value in explanations:
            # An unlucky parameter collision is rejected, not silently patched.
            return None
        explanations[value]=reason
    options=list(explanations);r.shuffle(options)
    assert len(options)==4
    return dict(stem=stem,passage=None,options=options,correctAnswer=answer,
        steps=steps,explanation=' '.join(steps),difficulty=difficulty,
        verification='sympy+independent-domain-check',diagram=None,table=None,
        generatorVersion='2.0.0',distractorExplanations=explanations,
        alignment={'source':SOURCE,'basis':'public skill specifications; independently authored','frameworkVersion':'4 (September 2026)'},
        qualityMetadata={'difficultyBasis':domain,'reviewFlags':['SAT-complexity','distractor-plausibility']},
        forceMCQ=(family in ('m2-spread-scaling','m2-area-unit-conversion')))
