"""Original, evidence-mapped reading candidates. Versioned separately from pilot items.
No official question text or passage is stored. Templates are review candidates,
not validated educational products; variations share a reported family cluster.
"""
import random

FAMILIES = {
 'central-ideas': ['rw2-competing-explanations', 'rw2-character-tension'],
 'textual-evidence': ['rw2-control-evidence', 'rw2-counterevidence'],
 'quantitative-evidence': ['rw2-rate-comparison', 'rw2-table-exception'],
 'inferences': ['rw2-sampling-limit', 'rw2-constraint-inference'],
 'words-context': ['rw2-context-blank', 'rw2-context-nuance'],
 'text-purpose': ['rw2-counterargument-role', 'rw2-example-role'],
 'cross-text': ['rw2-qualified-agreement', 'rw2-evidence-response'],
 'synthesis': ['rw2-notes-contrast', 'rw2-notes-method'],
 'transitions': ['rw2-concession', 'rw2-specific-example'],
 'boundaries': ['rw2-appositive', 'rw2-list-colon'],
 'form-structure': ['rw2-finite-verb', 'rw2-modifier-attachment'],
}
# Topic/context variations are not represented as distinct structural families.
TOPICS = [
 ('ceramics', 'a pottery collection', 'a curator', 'glaze patterns'),
 ('textiles', 'a textile exhibition', 'a conservator', 'weaving patterns'),
 ('maps', 'a map archive', 'a cartographer', 'route markings'),
 ('music', 'a chamber-music program', 'a composer', 'rhythmic patterns'),
 ('gardens', 'a seed exchange', 'a gardener', 'planting schedules'),
 ('theater', 'a theater workshop', 'a director', 'stage arrangements'),
 ('photography', 'a photograph collection', 'an archivist', 'lighting choices'),
 ('architecture', 'a building survey', 'a designer', 'entrance layouts'),
 ('printing', 'a printmaking workshop', 'a printer', 'ink textures'),
 ('oral history', 'an oral-history project', 'an interviewer', 'narrative details'),
 ('sculpture', 'a sculpture exhibition', 'an artist', 'surface textures'),
 ('bookbinding', 'a bookbinding workshop', 'a bookbinder', 'binding techniques'),
 ('restoration', 'a restoration project', 'a restorer', 'repair methods'),
 ('translation', 'a translation workshop', 'a translator', 'word choices'),
 ('dance', 'a dance program', 'a choreographer', 'movement sequences'),
 ('drawing', 'a drawing collection', 'an illustrator', 'line weights'),
 ('mosaics', 'a mosaic exhibition', 'a mosaicist', 'tile arrangements'),
 ('astronomy', 'a model-observation project', 'an observer', 'recording intervals'),
 ('acoustics', 'a sound-modeling workshop', 'a technician', 'panel arrangements'),
 ('ecology', 'a fictional habitat model', 'a modeler', 'sampling locations'),
 ('navigation', 'a navigation exercise', 'a navigator', 'landmark positions'),
 ('robotics', 'a robotics workshop', 'an engineer', 'sensor placements'),
 ('lighting', 'a lighting demonstration', 'a technician', 'lamp placements'),
 ('design', 'a design workshop', 'a researcher', 'interface layouts'),
 ('materials', 'a materials demonstration', 'a facilitator', 'surface treatments'),
]
SOURCE = 'https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing'

def make(family, seed):
    r=random.Random(f'{family}:{seed}')
    topic,collection,role,detail=TOPICS[seed % len(TOPICS)]
    n=r.randint(24,80); m=r.randint(5,16); table=None
    difficulty='medium'; demands=[]
    if family=='rw2-competing-explanations':
        passage=f'In a fictional account of {collection}, a change in {detail} initially seems to indicate that a new creator had taken over the work. Records from the same period, however, show that the original creator remained responsible. The records also describe a change in the materials available. Rather than abandon the visual evidence, {role} interprets it alongside the records: the altered technique may reflect a practical adjustment, not a change in authorship.'
        stem='Which choice best expresses the central idea of the text?'
        right='An apparent change in authorship may instead be explained by a change in working conditions.'
        wrong=[('The records prove that materials never influence creative decisions.','The records suggest the opposite: materials may explain the change.'),('Visual evidence is always less useful than written evidence.','The account combines evidence; it does not rank every instance of one source above another.'),('The creator deliberately falsified the surviving records.','The passage gives no evidence of falsification.')]
        evidence='the altered technique may reflect a practical adjustment, not a change in authorship.'
        reason='The account revises an initial interpretation by integrating two kinds of evidence. The keyed summary retains both the observed change and its alternative explanation.'
        difficulty='hard';demands=['reconcile conflicting evidence','distinguish observation from explanation']
    elif family=='rw2-character-tension':
        name=r.choice(['Mira','Ren','Inez','Noor','Dara'])
        passage=f'The following is an original fictional scene. {name} paused outside {collection}, holding the invitation flat between both hands. At home, the prospect of discussing {detail} with strangers had seemed exhausting. Now, through the open door, came a conversation that made {name} lean forward. One step brought the threshold closer; a second restored the old distance. The invitation was still uncreased when the host appeared.'
        stem='Which choice best describes the character’s situation in the text?'
        right='Curiosity draws the character toward an activity that still causes hesitation.'
        wrong=[('The character is certain that attending will be unpleasant.','Leaning toward the conversation indicates interest, so certainty about displeasure overstates the evidence.'),('The character has forgotten the reason for receiving an invitation.','The character anticipates discussing the topic and shows no confusion about the invitation.'),('The host has already rejected the character’s request to enter.','The host only appears at the end; no rejection is described.')]
        evidence='One step brought the threshold closer; a second restored the old distance.'
        reason='The advance and retreat embody hesitation, while leaning toward the conversation indicates interest. The text sustains both impulses rather than resolving them.'
        demands=['interpret behavior','integrate contrasting details']
    elif family=='rw2-control-evidence':
        passage=f'In a hypothetical study of labels used in {collection}, a team predicts that adding a short explanation of {detail} will improve readers’ understanding. The team assigns volunteers at random to view either the original labels or revised labels; both groups see the same objects for the same amount of time. A test then asks readers to interpret an unfamiliar example, rather than recall wording from a label.'
        stem='Which finding would most directly support the team’s prediction?'
        right='Readers assigned the revised labels interpret the unfamiliar example more accurately than readers assigned the original labels.'
        wrong=[('Readers in both groups remember the labels’ background color equally well.','Remembering color does not measure the predicted improvement in understanding.'),('Readers assigned the original labels spend as long in the room as the other readers.','Time is controlled but equal exposure alone does not demonstrate greater understanding.'),('Readers assigned the revised labels prefer the objects that were easiest to describe.','Preference is not performance on the interpretation task.')]
        evidence='A test then asks readers to interpret an unfamiliar example, rather than recall wording from a label.'
        reason='The prediction concerns understanding, operationalized here as interpreting a new example. A comparison of that outcome between the randomly assigned groups directly bears on the prediction.'
        demands=['match evidence to hypothesis','distinguish outcome from preference']
    elif family=='rw2-counterevidence':
        passage=f'In a fictional discussion of {collection}, an administrator attributes an increase in visits entirely to a new display about {detail}. The display opened in the same month that the venue removed its admission charge. The administrator argues that the charge could not have mattered because visitors had previously described it as modest. An evaluator seeks evidence that would challenge the administrator’s exclusive explanation, without claiming that the display had no effect.'
        stem='Which finding would most directly challenge the administrator’s explanation?'
        right='A comparable venue with no new display experienced a similar increase in visits after removing the same admission charge.'
        wrong=[('Several new visitors say they found the display interesting.','Interest is compatible with the display contributing; it does not challenge the exclusive explanation.'),('The new display occupies more space than the old display.','Space does not isolate the effect of removing a charge.'),('The venue’s lighting remained unchanged during the month.','Unchanged lighting provides no evidence that the admission charge mattered.')]
        evidence='The display opened in the same month that the venue removed its admission charge.'
        reason='The comparison offers evidence for the competing price-related explanation while leaving open the possibility that the display also contributed. It does not by itself prove a causal effect.'
        difficulty='hard';demands=['evaluate competing cause','avoid exclusive causal inference']
    elif family=='rw2-rate-comparison':
        a=n; b=n*2; ca=r.randint(3,9)*2; cb=ca+2
        table={'headers':['Group','Invitations sent','Visitors attending'],'rows':[['A',a,ca],['B',b,cb]]}
        passage=f'A hypothetical outreach project for {collection} sent invitations to two groups. The table records invitations and attendance. A coordinator observes that more members of Group B attended but argues that Group A had the higher attendance rate. Attendance rate is defined as the number attending divided by the number of invitations sent.'
        stem='Which choice best supports the coordinator’s argument?'
        right=f'Group A’s attendance rate was {ca}/{a}, whereas Group B’s was {cb}/{b}, a smaller fraction.'
        wrong=[(f'Group B had {cb} visitors attending, compared with {ca} from Group A.','These absolute counts are true but do not support a higher rate for A.'),(f'Group A received {a} invitations.','One denominator alone cannot establish the comparison.'),('Group B’s larger attendance count necessarily means its attendance rate was higher.','A larger denominator can reverse the rate comparison.')]
        assert ca*b>cb*a and cb>ca
        evidence='Attendance rate is defined as the number attending divided by the number of invitations sent.'
        reason=f'Compare rates rather than counts: {ca}×{b} > {cb}×{a}. The higher count for B does not offset its larger invitation pool.'
        difficulty='hard';demands=['distinguish rate from count','cross multiply fractions']
    elif family=='rw2-table-exception':
        a=n; b=n+m; c=n+2*m; d=n+m//2
        table={'headers':['Site','Before','After'],'rows':[['East',a,b],['West',c,d],['Central',a+m,c+m]]}
        passage=f'A fictional program supporting {collection} tested a revised opening schedule at three sites. The table shows the number of visits in equally long periods before and after the change. A report initially stated that visits increased at every site. An editor asks for a correction that identifies the exception accurately without suggesting that the pattern at one site applies to all sites.'
        stem='Which choice most accurately corrects the report?'
        right=f'Visits at West declined from {c} to {d}, although visits at East and Central increased.'
        wrong=[(f'Visits at East declined from {b} to {a}.','The choice reverses the Before and After columns.'),('All three sites experienced declining visits.','East and Central increased.'),(f'West had {c} visits before the schedule changed.','This true initial count omits the decline needed to correct the claim.')]
        evidence='A report initially stated that visits increased at every site.'
        reason='Read each row from Before to After. West is the sole decreasing row; the correction must identify it without generalizing the decline.'
        demands=['find counterexample','read table direction']
    elif family=='rw2-sampling-limit':
        passage=f'For a hypothetical project about {collection}, {role} surveyed {n} people who had attended an optional talk on {detail}. Most respondents favored expanding the program. The report accurately records those responses but notes that people who skipped the talk were not surveyed. The report therefore distinguishes its description of respondents from any estimate of opinion among all residents.'
        stem='Which conclusion is most strongly supported by the text?'
        right='The responses describe attendees’ views but may not represent the views of residents who did not attend.'
        wrong=[('Residents who did not attend definitely oppose expanding the program.','The unsurveyed residents’ opinions are unknown.'),('The recorded responses must be inaccurate because attendance was optional.','Selection can limit generalizability without making recorded responses inaccurate.'),('Surveying more attendees would necessarily remove every source of selection bias.','More responses from the same selected group do not ensure representation of nonattendees.')]
        evidence='people who skipped the talk were not surveyed.'
        reason='The sampling frame excludes nonattendees. The passage supports a limitation on generalization, not a claim about the direction of excluded residents’ views.'
        difficulty='hard';demands=['bound inference by sampling frame','distinguish accuracy from representativeness']
    elif family=='rw2-constraint-inference':
        passage=f'In a fictional catalog for {collection}, every item selected for the traveling display must have both a stable surface and a complete condition record. Item K has a complete record, but its surface is still being stabilized. The curator explains that meeting one requirement cannot compensate for failing the other. Items may be reconsidered after conservation work, but selection is based on their condition at the time of review.'
        stem='Which inference about Item K is most strongly supported?'
        right='Item K does not yet satisfy all the requirements for the traveling display.'
        wrong=[('Item K can never be selected, even after conservation.','The text explicitly permits reconsideration after work.'),('Item K must have an incomplete condition record.','Its record is explicitly complete.'),('Item K is eligible now because its record is complete.','Eligibility requires both conditions, not either one.')]
        evidence='every item selected for the traveling display must have both a stable surface and a complete condition record.'
        reason='The two requirements form a conjunction. One is met and the other is not, so current eligibility is unsupported; future eligibility remains possible.'
        demands=['combine necessary conditions','separate present from future']
    elif family=='rw2-context-blank':
        passage=f'Although a new catalog of {collection} offers useful descriptions of {detail}, the reviewer’s endorsement is _____. She praises its careful entries but points out that several items remain undated and that the index omits alternative names. Her final recommendation is to consult the catalog alongside, rather than in place of, the older records.'
        stem='Which choice completes the text with the most logical and precise word?'
        right='qualified';wrong=[('unreserved','The reviewer explicitly identifies limitations.'),('irrelevant','The critique directly concerns the catalog being evaluated.'),('conclusive','The endorsement is conditional, not a decisive resolution of the missing information.')]
        evidence='She praises its careful entries but points out that several items remain undated'
        reason='The praise is limited by explicit reservations, so qualified has its contextual sense of conditional or restricted. It does not refer to professional credentials.'
        demands=['resolve concessive contrast','select contextual sense']
    elif family=='rw2-context-nuance':
        passage=f'In a fictional account of {collection}, {role} describes a new approach to {detail} as a departure, not a repudiation. The approach changes how the material is presented while retaining the earlier project’s central purpose. The accompanying essay emphasizes that revising a method need not amount to rejecting the aim that originally motivated it.'
        stem='As used in the text, what does “repudiation” most nearly mean?'
        right='rejection';wrong=[('expansion','Expansion adds scope rather than rejecting an underlying aim.'),('imitation','Imitation copies a method; the text contrasts methodological change with rejecting an aim.'),('measurement','No measurement of the aim or method is described.')]
        evidence='revising a method need not amount to rejecting the aim'
        reason='The final sentence restates the contrast: departure concerns a change of method, while repudiation would entail rejection of the underlying aim.'
        demands=['track contrast','use explanatory restatement']
    elif family=='rw2-counterargument-role':
        passage=f'A fictional proposal for {collection} recommends grouping objects by {detail}. Critics argue that thematic grouping can obscure chronology. The proposal acknowledges this concern and requires a visible date on every label. It nevertheless maintains that grouping can reveal relationships a purely chronological arrangement might hide. The revised proposal thus preserves the organizing idea while changing a feature of its presentation.'
        stem='What is the main function of the statement about critics in the text as a whole?'
        right='It introduces an objection that leads to a modification rather than abandonment of the proposal.'
        wrong=[('It demonstrates that the proposal has no possible advantages.','The text retains an advantage after acknowledging the objection.'),('It announces that critics designed the final grouping system.','Critics raise a concern; authorship of the system is not attributed to them.'),('It supplies an unrelated historical anecdote.','The criticism directly motivates the requirement for dated labels.')]
        evidence='The proposal acknowledges this concern and requires a visible date on every label.'
        reason='The sequence is recommendation, objection, and responsive adjustment. The objection explains why the labeling requirement is added.'
        difficulty='hard';demands=['trace argumentative structure','identify concession and response']
    elif family=='rw2-example-role':
        passage=f'An original essay about {collection} argues that documentation can preserve decisions as well as finished results. In one example, notes about {detail} record an option that was considered and then rejected. The finished object alone would not reveal that alternative. The essay uses such records to show why a collection of process materials can illuminate the choices behind a completed work.'
        stem='Why does the author include the example of the rejected option?'
        right='To illustrate information about a creative process that a finished object alone would not provide.'
        wrong=[('To prove that rejected options are always better than chosen ones.','The passage compares available information, not the quality of alternatives.'),('To establish that the finished object has been lost.','No loss of the finished object is stated.'),('To contradict the essay’s claim that documentation is useful.','The example supports that claim.')]
        evidence='The finished object alone would not reveal that alternative.'
        reason='The example supplies a concrete case of the essay’s general claim about process records; the distinction is between decision history and finished result.'
        demands=['connect example to claim']
    elif family=='rw2-qualified-agreement':
        passage=f'Text 1\nFor {collection}, consistency in recording {detail} allows users to compare entries. A shared vocabulary should therefore guide cataloging, though it need not dictate every sentence.\n\nText 2\nA catalog is useful only if its entries can be compared, but rigid wording can conceal differences between objects. Shared terms should anchor entries without eliminating descriptions specific to each object.'
        stem='Based on the texts, both authors would most likely agree with which statement?'
        right='Comparable entries are valuable, and some flexibility can coexist with shared terminology.'
        wrong=[('Every catalog entry should use exactly the same complete wording.','Both texts permit flexibility in phrasing or object-specific description.'),('A common vocabulary prevents any useful comparison.','Both texts say shared terms help comparison.'),('Details specific to individual objects should always be omitted.','Text 2 explicitly preserves these details; Text 1 does not demand omission.')]
        evidence='A shared vocabulary should therefore guide cataloging, though it need not dictate every sentence.'
        reason='Both authors support comparability without complete uniformity. The shared position is narrower than unrestricted freedom and less rigid than identical wording.'
        difficulty='hard';demands=['find intersection of qualified claims']
    elif family=='rw2-evidence-response':
        passage=f'Text 1\nA fictional analyst argues that changes in {detail} within {collection} indicate changes in authorship. Different makers, the analyst reasons, tend to use different techniques.\n\nText 2\nRecords show that the same maker sometimes used several techniques as available materials changed. This does not make technique irrelevant, but it means a difference in technique need not identify a different maker.'
        stem='How would the author of Text 2 most likely respond to the reasoning in Text 1?'
        right='By offering another explanation for technical variation that weakens its use as decisive evidence of authorship.'
        wrong=[('By asserting that all objects must have been made by one person.','Text 2 limits a particular inference; it does not establish universal single authorship.'),('By denying that techniques ever vary.','Text 2 explicitly describes several techniques.'),('By accepting that every technical change proves a new maker.','That inference is the one Text 2 qualifies.')]
        evidence='a difference in technique need not identify a different maker.'
        reason='Text 2 supplies a materials-based explanation for variation within one maker’s work. It weakens an inference without making technique wholly irrelevant.'
        difficulty='hard';demands=['evaluate alternative explanation across texts']
    elif family in ('rw2-notes-contrast','rw2-notes-method'):
        passage=f'While preparing a report on a fictional {topic} project, a student takes these notes:\n• Team A examined {n} objects.\n• Team B examined {n+m} objects.\n• Both teams recorded {detail} using the same checklist.\n• Team A used photographs; Team B examined the objects in person.\n• Neither team ranked the objects by quality.'
        if family=='rw2-notes-contrast':
            stem='The student wants to emphasize a difference in how the teams examined the objects. Which choice best uses the notes to accomplish this goal?'
            right='Team A examined photographs, whereas Team B examined the objects in person.'
            wrong=[('Both teams used the same checklist.','This is a similarity, not the requested difference in examination method.'),(f'Team B examined {n+m} objects, more than Team A.','This contrasts sample size, not how the objects were examined.'),('Team B established that its objects were better than Team A’s.','Neither team ranked quality; the comparison is unsupported.')]
            evidence='Team A used photographs; Team B examined the objects in person.'
        else:
            stem='The student wants to emphasize a methodological similarity between the teams. Which choice best uses the notes to accomplish this goal?'
            right=f'Both teams used the same checklist to record {detail}.'
            wrong=[('Team A used photographs, whereas Team B examined objects in person.','This states a methodological difference rather than a similarity.'),(f'Team B examined {n+m} objects.','A sample count for one team does not identify a shared procedure.'),('Both teams ranked objects by quality.','The notes explicitly state that neither team ranked quality.')]
            evidence=f'Both teams recorded {detail} using the same checklist.'
        reason='Match the requested rhetorical goal to the relevant notes rather than choosing an accurate but off-goal detail.'
        demands=['distinguish rhetorical goal from factual accuracy']
    elif family=='rw2-concession':
        passage=f'The organizers of {collection} expected a simplified guide to {detail} to make the material accessible to every visitor. _____ several visitors still requested an explanation from a staff member, even though they had read the guide carefully. The organizers retained the guide but added a short demonstration for those who wanted one.'
        stem='Which choice completes the text with the most logical transition?'
        right='Nevertheless,';wrong=[('Consequently,','Continued requests run against the expectation rather than follow as its expected consequence.'),('For instance,','The requests do not exemplify universal independent accessibility.'),('Likewise,','The second sentence contrasts with the expectation; it does not present a parallel result.')]
        evidence='several visitors still requested an explanation'
        reason='The second sentence presents a result contrary to the organizers’ expectation, so a concessive transition is required.'
        demands=['contrast expectation with outcome']
    elif family=='rw2-specific-example':
        passage=f'The staff of {collection} documents more than the final appearance of each item. _____ its records describe the sequence of decisions about {detail}, including alternatives that were rejected before completion. Such records make it possible to reconstruct parts of a process that would otherwise remain invisible.'
        stem='Which choice completes the text with the most logical transition?'
        right='For example,';wrong=[('In contrast,','The records illustrate the preceding statement rather than contradict it.'),('As a result,','The relationship here is general claim to instance, not event to consequence.'),('Instead,','The records are not a replacement for documenting the final appearance.')]
        evidence=f'its records describe the sequence of decisions about {detail}'
        reason='The specific process information exemplifies documentation beyond the final appearance. An example transition names that relationship.'
        demands=['link generalization to specific illustration']
    elif family=='rw2-appositive':
        passage=f'Working on {collection}, {role} prepared a revised checklist. The checklist_____ was tested before it was distributed. Staff members used the trial version to record an unfamiliar object and noted any instruction that needed clarification before the workshop.'
        stem='Which choice completes the text so that it conforms to Standard English?'
        right=f', a guide to recording {detail},';wrong=[(f'; a guide to recording {detail},','A semicolon cannot separate the subject from its nonessential description.'),(f', a guide to recording {detail};','The closing semicolon improperly separates the subject phrase from its finite verb.'),(f': a guide to recording {detail},','A colon after The checklist would follow a subject, not a complete introducing clause.')]
        evidence='The checklist_____ was tested before it was distributed.'
        reason='The nonessential appositive renames the checklist and must be enclosed by a matching pair of commas. Removing it leaves The checklist was tested before it was distributed.'
        demands=['identify nonessential appositive','preserve subject-verb connection']
    elif family=='rw2-list-colon':
        passage=f'The team responsible for {collection} changed its system for recording {detail}. Its new checklist requires three kinds of information_____ a description of the object, a record of its condition, and a note on its origin. Each entry must include all three before a staff member can mark the record complete.'
        stem='Which choice completes the text so that it conforms to Standard English?'
        right=':';wrong=[(';','The list after the blank is not an independent clause, so a semicolon is inappropriate.'),('.','A period would turn the noun list into a sentence fragment.'),('[no punctuation]','The complete introducing clause requires punctuation to introduce the explanatory list.')]
        evidence='Its new checklist requires three kinds of information'
        reason='A colon follows the complete clause and introduces the list that specifies the three kinds of information.'
        demands=['distinguish complete clause from list']
    elif family=='rw2-finite-verb':
        passage=f'The methods used in {collection} have changed over time. The guide to {detail}, revised by several specialists before the workshop began, _____ a clear sequence of steps. This sequence remains the document’s main organizing feature, even though the examples and illustrations have been updated.'
        stem='Which choice completes the text so that it conforms to Standard English?'
        right='provides';wrong=[('providing','The participle leaves the main clause without a finite verb.'),('to provide','An infinitive cannot serve as the main clause’s finite verb.'),('having provided','This participial phrase also fails to supply a finite verb.')]
        evidence='The guide to'
        reason='Revised by several specialists is a modifying phrase. The main subject, The guide, still needs a finite predicate; provides supplies one and agrees with the singular subject.'
        demands=['distinguish finite verb from participle','track subject across modifier']
    elif family=='rw2-modifier-attachment':
        passage=f'A fictional report describes a workshop on {topic}. After comparing two approaches to {detail}, _____. The report then explains why the instructor recommended testing the alternatives on a small sample before selecting an approach for the complete project.'
        stem='Which choice completes the text so that it conforms to Standard English?'
        right='the instructor identified a limitation shared by both approaches'
        wrong=[('a limitation shared by both approaches was identified by the instructor','The introductory action would attach to a limitation, which cannot compare approaches.'),('both approaches had a limitation identified by the instructor','The introductory action would attach to the approaches rather than to the person comparing them.'),('there was a limitation identified by the instructor','The expletive there supplies no actor for the introductory modifier.')]
        evidence='After comparing two approaches'
        reason='The subject immediately following the introductory modifier must be the person who compared the approaches. Only the instructor supplies that actor without a dangling modifier.'
        demands=['attach modifier to logical subject']
    else:
        raise ValueError(family)
    options=[right]+[x[0] for x in wrong]
    explanations={right:reason, **dict(wrong)}
    r.shuffle(options)
    return dict(stem=stem, passage=passage, options=options, correctAnswer=right,
        steps=[reason], explanation=reason, difficulty=difficulty,
        verification='evidence-mapped-editorial-required', diagram=None, table=table,
        generatorVersion='2.0.0', distractorExplanations=explanations,
        answerEvidence={'quotes':[evidence], 'reasoning':reason},
        alignment={'source':SOURCE, 'basis':'public task descriptions; independently authored', 'frameworkVersion':'4 (September 2026)'},
        qualityMetadata={'difficultyBasis':demands, 'passageOrigin':'original-self-contained-fiction', 'reviewFlags':['answer-unambiguity','distractor-plausibility','SAT-complexity']})
