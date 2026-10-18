"""SAT taxonomy 2026-10-18; official skill labels, local prerequisite graph."""
DOMAINS = {
 'Information and Ideas': ('rw', .26, [('central-ideas','Central Ideas and Details'),('textual-evidence','Command of Evidence: Textual'),('quantitative-evidence','Command of Evidence: Quantitative'),('inferences','Inferences')]),
 'Craft and Structure': ('rw', .28, [('words-context','Words in Context'),('text-purpose','Text Structure and Purpose'),('cross-text','Cross-Text Connections')]),
 'Expression of Ideas': ('rw', .20, [('synthesis','Rhetorical Synthesis'),('transitions','Transitions')]),
 'Standard English Conventions': ('rw', .26, [('boundaries','Boundaries'),('form-structure','Form, Structure, and Sense')]),
 'Algebra': ('math', .35, [('linear-one','Linear equations in one variable'),('linear-two','Linear equations in two variables'),('linear-functions','Linear functions'),('linear-systems','Systems of two linear equations'),('linear-inequalities','Linear inequalities')]),
 'Advanced Math': ('math', .35, [('equivalent','Equivalent expressions'),('nonlinear-equations','Nonlinear equations and systems'),('nonlinear-functions','Nonlinear functions')]),
 'Problem-Solving and Data Analysis': ('math', .15, [('ratios','Ratios, rates, proportions, and units'),('percentages','Percentages'),('one-variable','One-variable data'),('two-variable','Two-variable data'),('probability','Probability and conditional probability'),('inference','Inference and margin of error'),('statistical-claims','Evaluating statistical claims')]),
 'Geometry and Trigonometry': ('math', .15, [('area-volume','Area and volume'),('lines-triangles','Lines, angles, and triangles'),('trigonometry','Right triangles and trigonometry'),('circles','Circles')])
}
PREREQS = {'linear-two':['linear-one'],'linear-functions':['linear-two'],'linear-systems':['linear-one','linear-two'],'linear-inequalities':['linear-one'],'equivalent':['linear-one'],'nonlinear-equations':['equivalent'],'nonlinear-functions':['equivalent','linear-functions'],'percentages':['ratios'],'two-variable':['linear-functions','one-variable'],'inference':['one-variable'],'trigonometry':['lines-triangles'],'circles':['area-volume']}
SKILLS = [dict(id=sid,name=name,domain=domain,section=section,weight=weight/len(skills),prerequisites=PREREQS.get(sid,[])) for domain,(section,weight,skills) in DOMAINS.items() for sid,name in skills]
BY_ID = {s['id']:s for s in SKILLS}

def coverage_plan(total, section, inventory=None):
    """Largest-remainder allocation per official domain; local equal allocation per skill."""
    inventory = inventory or {}
    selected=[s for s in SKILLS if s['section']==section]
    quotas={s['id']:int(total*s['weight']) for s in selected}
    remainder=total-sum(quotas.values())
    for s in sorted(selected,key=lambda s:(-(total*s['weight']%1),s['id']))[:remainder]: quotas[s['id']]+=1
    return {k:max(0,v-inventory.get(k,0)) for k,v in quotas.items()}
