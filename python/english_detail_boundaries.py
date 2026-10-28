"""Additional original detail and within-sentence boundary structures.

Four authored contexts per family; no count inflation through choice shuffling.
"""
from english_common import make_item

FAMILIES = {
    'central-ideas': ['rw3-explicit-detail'],
    'boundaries': ['rw3-series-elements', 'rw3-conjunctive-adverb'],
}
BLUEPRINTS = {
    'rw3-explicit-detail': {
        'skill':'central-ideas', 'method':'Locate the detail named by the question, preserving who did what, when, and for what stated reason.',
        'formula':'question constraint -> relevant statement -> accurate bounded paraphrase',
        'structure':'A short account gives several related details; the stem singles out one stated reason or procedure.',
        'misconceptions':['neighboring detail substituted for requested detail','reversed agency or sequence','unsupported motive'], 'variants':4,
    },
    'rw3-series-elements': {
        'skill':'boundaries', 'method':'Identify parallel elements in a simple series and separate them without splitting a verb from its objects.',
        'formula':'verb + element 1, element 2, and element 3',
        'structure':'Three short parallel objects or complements form a series within an otherwise complete sentence.',
        'misconceptions':['missing separator between list elements','colon before a completed verb complement','period creating a fragment'], 'variants':4,
    },
    'rw3-conjunctive-adverb': {
        'skill':'boundaries', 'method':'Check both independent clauses; a sentence-level adverb cannot perform a coordinating conjunction’s job.',
        'formula':'independent clause ; however/therefore/moreover/nevertheless , independent clause',
        'structure':'A conjunctive adverb signals a relationship between two complete clauses that require a valid boundary.',
        'misconceptions':['comma splice around a conjunctive adverb','adverb mistaken for a coordinator','punctuation placed on the wrong side of the adverb'], 'variants':4,
    },
}


def case(passage, stem, right, wrong, evidence, steps, difficulty='medium'):
    return dict(passage=passage,stem=stem,right=right,wrong=wrong,evidence=evidence,steps=steps,difficulty=difficulty)


STANDARD='Which choice completes the text so that it conforms to the conventions of Standard English?'
CASES={
'rw3-explicit-detail':[
    case('In an original account of a community exhibition, curator Lina groups photographs by the place where they were taken rather than by the year they were made. She wants visitors to compare different views of a single location before moving to another location. A small label below each photograph still gives its date, and a separate booklet lists the photographers alphabetically.',
         'According to the text, why does Lina group the photographs by location?',
         'To let visitors compare different views of the same place.',
         [('To conceal the dates on which the photographs were made.', 'Dates remain visible on labels; concealment is not the stated purpose.'),
          ('To present every photographer’s work together in alphabetical order.', 'Alphabetical ordering applies to the booklet, not the arrangement of photographs.'),
          ('To show that older photographs are more accurate than newer ones.', 'The text makes no claim about accuracy by age.')],
         ['She wants visitors to compare different views of a single location'],
         ['The question asks for the stated purpose of the location grouping.', 'The second sentence directly gives that purpose: comparing views of one location.']),
    case('In a hypothetical stream survey, observers count floating markers as the markers pass a bridge. They release a new set upstream every hour. To avoid counting the same marker twice, one observer records arrivals while another removes each marker immediately after it passes the bridge. The team uses the hourly totals to compare the numbers arriving during equal intervals.',
         'According to the text, how does the team prevent repeated counts of a marker?',
         'An observer removes each marker after it passes the bridge.',
         [('The team releases only one marker during the entire survey.', 'The team releases a new set every hour, not a single marker overall.'),
          ('Observers record only markers that remain upstream of the bridge.', 'They record arrivals as markers pass the bridge.'),
          ('The team compares hourly totals before releasing any markers.', 'Hourly comparisons do not prevent recounting; removal does.')],
         ['another removes each marker immediately after it passes the bridge'],
         ['Find the procedure associated with avoiding duplicate counts.', 'Removing a passed marker prevents it from being counted again.']),
    case('A fictional poet keeps two notebooks while drafting a collection. In the first, she records overheard phrases without organizing them. In the second, she arranges selected phrases into clusters associated with particular sounds. She says that the second notebook helps her notice connections she missed when the phrases appeared only in the order in which she heard them.',
         'According to the text, what distinguishes the poet’s second notebook from her first?',
         'It groups selected phrases by sound rather than leaving them in the order heard.',
         [('It records only phrases that the poet herself invented.', 'Both notebooks concern overheard phrases; original invention is not the distinction.'),
          ('It eliminates every phrase recorded in the first notebook.', 'Selected phrases are rearranged, not all eliminated.'),
          ('It preserves the exact sequence in which all phrases were heard.', 'That is the arrangement the second notebook changes.')],
         ['clusters associated with particular sounds', 'the order in which she heard them'],
         ['Compare the organizational principles of the two notebooks.', 'The second groups by sound, whereas the initial record preserves encounter order.']),
    case('A hypothetical workshop compares two models of a folding screen. Both models use the same number of panels, but one uses paper hinges and the other uses cloth hinges. The participants fold each model twenty times, then inspect the hinges for tears. They keep the panels’ size and weight identical so that those features will not account for differences in wear.',
         'According to the text, why do the participants keep the panels’ size and weight identical?',
         'To prevent those panel features from explaining differences in wear.',
         [('To ensure that the two models use the same hinge material.', 'The hinge materials deliberately differ: paper and cloth.'),
          ('To make one model receive more folding trials than the other.', 'Each model receives twenty trials.'),
          ('To avoid inspecting the hinges after the trials.', 'The participants explicitly inspect the hinges after folding.')],
         ['so that those features will not account for differences in wear'],
         ['The final sentence states the reason for holding size and weight fixed.', 'The control limits alternative explanations based on those features.']),
],
'rw3-series-elements':[
    case('A fictional archive is preparing a portable display about neighborhood trades. The curator selects _____ carved printing blocks, and handwritten delivery slips for the first case. Each object receives a label explaining its use, while a map beside the case shows where the different workshops once stood.', STANDARD,
         'leather aprons,',
         [('leather aprons', 'Without a comma, aprons and carved printing blocks lack a separator between the first two objects.'),
          ('leather aprons:', 'The colon would split the direct-object series and make aprons appear to introduce the other objects.'),
          ('leather aprons.', 'A period leaves the remaining list elements as a sentence fragment.')],
         ['The curator selects', 'carved printing blocks, and handwritten delivery slips'],
         ['Aprons, blocks, and slips are three parallel objects of selects.', 'Use a comma after the first item to separate it from the second.']),
    case('For a hypothetical model-building exercise, each team must submit three kinds of documentation. The instructions request _____ labeled diagrams, and a brief account of the final test. Teams may use any inexpensive material for the model itself, but every submission must include all three forms of documentation.', STANDARD,
         'dated photographs,',
         [('dated photographs', 'The first and second parallel requested objects need a separator.'),
          ('dated photographs:', 'The diagrams and account are separate requested documents, not an explanation of photographs.'),
          ('dated photographs.', 'The resulting words after the period do not form a complete sentence.')],
         ['three kinds of documentation', 'labeled diagrams, and a brief account'],
         ['The stated count of three confirms three separate document categories.', 'A comma separates dated photographs from labeled diagrams.']),
    case('In a fictional stage workshop, the director assigns a different visual role to each group of students. One group will design _____ the market stalls, and the distant hillside. Another group will test how the lighting changes the appearance of these elements without moving any of them during the scene.', STANDARD,
         'the doorway,',
         [('the doorway', 'Doorway and market stalls are distinct objects in the series and require separation.'),
          ('the doorway:', 'The market stalls and hillside do not specify what the doorway is; they are additional designs.'),
          ('the doorway.', 'A period would leave the remaining objects without a predicate.')],
         ['will design', 'the market stalls, and the distant hillside'],
         ['Identify three parallel noun phrases governed by design.', 'The doorway needs a following comma before the second object begins.']),
    case('A hypothetical field notebook separates observations from explanations. Its first page asks students to record _____ the direction of the breeze, and the amount of shade at the observation point. Later pages invite possible explanations for the patterns students notice, but the opening list concerns only what they can observe directly.', STANDARD,
         'the cloud cover,',
         [('the cloud cover', 'A separator is needed between cloud cover and direction of the breeze.'),
          ('the cloud cover:', 'The breeze and shade are additional observations, not an expansion defining cloud cover.'),
          ('the cloud cover.', 'The following objects would be an incomplete sentence.')],
         ['asks students to record', 'the direction of the breeze, and the amount of shade'],
         ['The three observations are parallel objects of record.', 'A comma separates the first object from the second without ending the sentence.']),
],
'rw3-conjunctive-adverb':[
    case('A fictional design team tests a folding stand made of thin cardboard. The material makes the stand easy to _____ the structure bends when a heavy book rests on it. The team decides to reinforce the central joint before presenting the stand at a workshop.', STANDARD,
         'carry; however,',
         [('carry, however,', 'However is a conjunctive adverb, so commas alone leave a splice between two independent clauses.'),
          ('carry however,', 'The adverb does not provide the required boundary between the complete clauses.'),
          ('carry; however;', 'The isolated adverb however is not a complete clause that can stand between two semicolons.')],
         ['The material makes the stand easy to', 'the structure bends when a heavy book rests on it'],
         ['Both sides can stand as sentences: the material makes the stand easy to carry; the structure bends.', 'A semicolon joins them, and a comma follows however as it introduces the contrasting clause.']),
    case('In a hypothetical archive exercise, the only surviving index lists documents by an obsolete numbering system. A cross-reference sheet connects those numbers to the current shelf _____ researchers consult that sheet before requesting a box. Without it, the number in an old citation would not reveal the box’s present location.', STANDARD,
         'labels; therefore,',
         [('labels, therefore,', 'Therefore does not turn a comma into a valid boundary between these independent clauses.'),
          ('labels therefore,', 'No clause boundary precedes the conjunctive adverb.'),
          ('labels; therefore;', 'Therefore alone is not an independent clause and cannot stand between two semicolons.')],
         ['A cross-reference sheet connects those numbers', 'researchers consult that sheet'],
         ['Each side supplies its own subject and finite verb.', 'The result relationship is signaled by therefore, but the independent clauses still require a semicolon.']),
    case('A fictional theater’s new curtains reduce light leaking onto the stage between scenes. They also muffle the sound of equipment moving _____ they can be opened by one person rather than two. The stage manager notes all three benefits when explaining why the theater will keep the new curtains.', STANDARD,
         'backstage; moreover,',
         [('backstage, moreover,', 'The two full clauses cannot be joined by a comma plus moreover alone.'),
          ('backstage moreover,', 'Moreover signals addition but does not supply grammatical coordination.'),
          ('backstage; moreover;', 'Moreover alone is not an independent clause that can be set between semicolons.')],
         ['They also muffle the sound', 'they can be opened by one person'],
         ['The first clause reports muffled sound; the second adds easier operation.', 'Use a semicolon before the additive adverb and a comma after it.']),
    case('During a hypothetical survey, thick cloud cover reduces the number of clear photographs of a hillside. The team cannot repeat the visit before the season _____ the available photographs still reveal the outline of the old path. The report separates that limited observation from details the cloud cover prevented the team from checking.', STANDARD,
         'ends; nevertheless,',
         [('ends, nevertheless,', 'Commas around nevertheless do not correctly join the two complete clauses.'),
          ('ends nevertheless,', 'The conjunctive adverb needs a valid preceding boundary here.'),
          ('ends; nevertheless;', 'Nevertheless is an adverb, not a complete clause that can be separated by two semicolons.')],
         ['The team cannot repeat the visit', 'the available photographs still reveal'],
         ['The independent clauses express a limitation and a remaining useful result.', 'Nevertheless conveys concession; the semicolon supplies the clause boundary it cannot supply itself.']),
],
}


def make(family,seed):
    return make_item(family=family,seed=seed,blueprint=BLUEPRINTS[family],
                     demands=['track the exact requested detail or grammatical dependency'],
                     topic='original method extension',**CASES[family][seed%4])
