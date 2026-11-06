#!/usr/bin/env python3
"""Builds src/domain/trainingPlan.json for Fit Mamma.

Five gym days (body-part split), beginner-friendly machines first, 3 working sets.
Keys reuse the engine's session slots:
  push = Chest & Triceps · pull = Back & Biceps · legs = Legs · upper = Shoulders & Abs
  lower = Full body & Glutes · arms = Saturday walk + light toning (optional)
Demo links open a Hindi YouTube search. `media` is a Gym visual animation id (credited in-app).
"""
import json
import pathlib
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
MEDIA = json.loads(pathlib.Path(sys.argv[1]).read_text()) if len(sys.argv) > 1 else {}


def demo(q):
    return 'https://www.youtube.com/results?search_query=' + urllib.parse.quote_plus(f'{q} kaise kare hindi')


def sets(kind):
    if kind == 'main':
        return [
            ['Warm-up', '12', 'Very light, learn the move'],
            ['Set 1', '10-12', 'Light: 3-4 reps left in the tank'],
            ['Set 2', '10-12', 'Same weight, or one step up'],
            ['Top set', '10-12, 2 short', 'Heaviest you can do with good form'],
        ]
    if kind == 'core':
        return [['Set 1', '12-15', 'Slow and controlled'], ['Set 2', '12-15', 'Same'], ['Set 3', '12-15', 'Same']]
    return [
        ['Set 1', '12-15', 'Light'],
        ['Set 2', '12-15', 'Same weight'],
        ['Top set', '12-15, 2 short', 'Last reps feel hard, form stays clean'],
    ]


def ex(code, name, muscle, kind, rest, cues, why, alts, gif=None, demo_q=None, pair=None, note=None):
    return {
        'code': code,
        'name': name,
        'muscle': muscle,
        'sets': sets(kind),
        'rest': rest,
        'cues': cues,
        'why': why,
        'alts': alts,
        'advanced': 'Top set: pause 1 second at the hardest point of every rep.',
        'blockB': None,
        'demo': demo(demo_q or name),
        'media': MEDIA.get(gif or name),
        'warmupSet': kind == 'main',
        'note': note,
        'pair': pair,
    }


R_MAIN = '90 sec.'
R_ACC = '60 sec.'

days = {
    'push': [
        ex('1', 'Chest press machine', 'Chest, triceps', 'main', R_MAIN,
           ['Seat so handles are at mid-chest', 'Push out, do not lock elbows hard', 'Slow on the way back'],
           'The safest way to build chest strength. Goes first while you are fresh.',
           ['Dumbbell bench press', 'Push-ups on a bench'], gif='Machine Chest Press', demo_q='chest press machine'),
        ex('2', 'Incline dumbbell press', 'Upper chest, front delts', 'acc', R_MAIN,
           ['Bench at 30 degrees', 'Dumbbells over the chest at the top', 'Elbows slightly in, not flared'],
           'Upper chest gives a lifted look and helps posture.',
           ['Incline chest press machine', 'Smith incline press'], gif='Incline Dumbbell Press'),
        ex('3', 'Pec deck', 'Chest', 'acc', R_ACC,
           ['Slight bend in the elbows', 'Squeeze 1 sec in the middle', 'Shoulders down'],
           'Works the chest without loading the shoulders or wrists.',
           ['Cable fly', 'Dumbbell fly'], gif='Pec Deck', demo_q='pec deck fly'),
        ex('4', 'Rope triceps pushdown', 'Triceps', 'acc', R_ACC,
           ['Elbows pinned to your sides', 'Split the rope at the bottom', 'Control up'],
           'Firms the back of the upper arm.',
           ['Straight bar pushdown', 'Bench dip, knees bent'], gif='Cable Tricep Pushdown — Rope', demo_q='tricep rope pushdown',
           pair='Pair 1 (with 5)'),
        ex('5', 'Overhead cable triceps extension', 'Triceps', 'acc', R_ACC,
           ['Face away from the cable', 'Elbows near your head', 'Full stretch, then straighten'],
           'Long-head triceps: the part that tightens the arm most.',
           ['Seated dumbbell overhead extension'], gif='Overhead Tricep Extension — Cable', demo_q='overhead tricep extension',
           pair='Pair 1 (with 4)'),
        ex('6', 'Dumbbell kickback', 'Triceps', 'acc', R_ACC,
           ['Hand on a bench, back flat', 'Upper arm still, only the forearm moves'],
           'A light finisher for the arms.',
           ['Cable kickback'], gif='Tricep Kickback', demo_q='dumbbell tricep kickback'),
    ],
    'pull': [
        ex('1', 'Lat pulldown', 'Lats, biceps', 'main', R_MAIN,
           ['Hands a little wider than shoulders', 'Pull to upper chest', 'Chest up, no swinging'],
           'Builds the back muscles that pull the shoulders back and slim the waist look.',
           ['Assisted pull-up machine', 'Band pulldown'], gif='Lat Pulldown'),
        ex('2', 'Seated cable row', 'Mid back, lats', 'acc', R_MAIN,
           ['Sit tall', 'Pull handle to your belly', 'Squeeze shoulder blades together'],
           'Fixes rounded shoulders from phone and kitchen work.',
           ['Seated row machine', 'Dumbbell row'], gif='Seated Cable Row'),
        ex('3', 'Seated row machine', 'Mid back', 'acc', R_ACC,
           ['Chest on the pad', 'Elbows back, close to the body'],
           'Chest support means no strain on the lower back.',
           ['One-arm dumbbell row'], gif='Seated Machine Row'),
        ex('4', 'Rear delt fly machine', 'Rear delts, upper back', 'acc', R_ACC,
           ['Arms nearly straight', 'Open wide, squeeze 1 sec'],
           'Small muscle, big effect on posture.',
           ['Band pull-apart'], gif='Rear Delt Fly', demo_q='reverse pec deck rear delt'),
        ex('5', 'Dumbbell curl', 'Biceps', 'acc', R_ACC,
           ['Elbows by your sides', 'No swinging', '3 sec down'],
           'Strong arms for carrying shopping and grandchildren.',
           ['Cable curl', 'Preacher curl machine'], gif='Dumbbell Curl', pair='Pair 1 (with 6)'),
        ex('6', 'Hammer curl', 'Biceps, brachialis, forearm', 'acc', R_ACC,
           ['Palms face each other', 'Slow and steady'],
           'Builds forearm and grip strength too.',
           ['Rope cable hammer curl'], gif='Hammer Curl', pair='Pair 1 (with 5)'),
    ],
    'legs': [
        ex('1', 'Leg press', 'Quads, glutes', 'main', R_MAIN,
           ['Feet shoulder-width, middle of the plate', 'Knees follow toes', 'Lower until knees are near 90 degrees, no lower back lift'],
           'Big leg muscles burn the most energy. The machine keeps the back safe.',
           ['Goblet squat to a bench', 'Smith machine squat'], gif='Leg Press'),
        ex('2', 'Goblet squat to bench', 'Quads, glutes', 'acc', R_MAIN,
           ['Hold one dumbbell at the chest', 'Sit back to touch the bench', 'Stand up through the heels'],
           'Teaches a safe squat for daily life: chairs, floor, stairs.',
           ['Bodyweight box squat'], gif='Goblet Squat', demo_q='goblet squat'),
        ex('3', 'Leg extension', 'Quads', 'acc', R_ACC,
           ['Pad on the lower shin', 'Straighten slowly, squeeze 1 sec'],
           'Strong quads protect the knees.',
           ['Spanish squat with band'], gif='Leg Extension'),
        ex('4', 'Seated leg curl', 'Hamstrings', 'acc', R_ACC,
           ['Pad just above the heels', 'Curl down, slow up'],
           'Balances the front of the leg and protects the knees.',
           ['Lying leg curl'], gif='Seated Leg Curl'),
        ex('5', 'Hip adductor machine', 'Inner thigh', 'acc', R_ACC,
           ['Sit tall', 'Squeeze legs together, slow open'],
           'Tones the inner thigh and helps hip stability.',
           ['Cable hip adduction'], gif='Hip Adduction Machine', demo_q='hip adductor machine'),
        ex('6', 'Standing calf raise', 'Calves', 'acc', R_ACC,
           ['Hold a rail for balance', 'Up on toes, 1 sec pause, slow down'],
           'Helps balance and circulation.',
           ['Seated calf raise', 'Calf raise on a step'], gif='Standing Calf Raise'),
    ],
    'upper': [
        ex('1', 'Shoulder press machine', 'Front delts, triceps', 'main', R_MAIN,
           ['Handles at shoulder height', 'Press up, do not shrug', 'Stop if the shoulder pinches'],
           'Strong shoulders make lifting things overhead easy and safe.',
           ['Seated dumbbell press'], gif='Machine Shoulder Press', demo_q='shoulder press machine'),
        ex('2', 'Dumbbell lateral raise', 'Side delts', 'acc', R_ACC,
           ['Light weight', 'Lift to shoulder height, elbows soft', 'Lead with the elbows'],
           'Gives the shoulders shape so the waist looks smaller.',
           ['Cable lateral raise'], gif='Dumbbell Lateral Raise'),
        ex('3', 'Cable front raise', 'Front delts', 'acc', R_ACC,
           ['Arm straight, lift to eye level', 'Slow down'],
           'Rounds out the shoulder.',
           ['Plate front raise'], gif='Cable Front Raise'),
        ex('4', 'Cable crunch', 'Abs', 'core', R_ACC,
           ['Kneel, rope by your head', 'Curl the ribs to the hips', 'Hips stay still'],
           'Tightens the belly from the inside out.',
           ['Crunch on a mat'], gif='Cable Crunch', pair='Pair 1 (with 5)'),
        ex('5', 'Dead bug', 'Core', 'core', R_ACC,
           ['Lie on your back, lower back pressed down', 'Opposite arm and leg out slowly'],
           'Safe core strength for the lower back.',
           ['Plank on knees'], gif='Dead Bug', demo_q='dead bug exercise', pair='Pair 1 (with 4)'),
        ex('6', 'Side bend with dumbbell', 'Obliques', 'core', R_ACC,
           ['Stand tall, one dumbbell', 'Bend sideways only, no twisting'],
           'Works the sides of the waist.',
           ['Side plank on knees'], gif='45° Side Bend', demo_q='dumbbell side bend'),
    ],
    'lower': [
        ex('1', 'Hip thrust machine', 'Glutes, hamstrings', 'main', R_MAIN,
           ['Upper back on the bench', 'Drive hips up, squeeze 1 sec', 'Chin tucked'],
           'Strongest glute builder. Helps the lower back and posture.',
           ['Barbell glute bridge', 'Glute bridge on the floor'], gif='Barbell Glute Bridge', demo_q='hip thrust'),
        ex('2', 'Dumbbell Romanian deadlift', 'Hamstrings, glutes', 'acc', R_MAIN,
           ['Soft knees', 'Push hips back, dumbbells slide down the legs', 'Back stays flat'],
           'Teaches safe bending to pick things up.',
           ['Cable pull-through'], gif='Romanian Deadlift — DB', demo_q='dumbbell romanian deadlift'),
        ex('3', 'Lat pulldown, close grip', 'Lats, biceps', 'acc', R_ACC,
           ['Neutral handle', 'Pull to upper chest'],
           'Full-body day keeps the back working too.',
           ['Seated cable row'], gif='Close-Grip Lat Pulldown', demo_q='close grip lat pulldown'),
        ex('4', 'Chest press machine, light', 'Chest, triceps', 'acc', R_ACC,
           ['Lighter than Monday', 'Smooth reps'],
           'A second, lighter chest hit for the week.',
           ['Push-ups on a bench'], gif='Machine Chest Press', demo_q='chest press machine'),
        ex('5', 'Hip abductor machine', 'Glute medius', 'acc', R_ACC,
           ['Sit tall', 'Push knees out, slow back'],
           'Side glutes keep the knees and hips stable when walking.',
           ['Band side walk'], gif='Seated Hip Abduction', demo_q='hip abductor machine'),
        ex('6', 'Cable glute kickback', 'Glutes', 'acc', R_ACC,
           ['Hold the frame', 'Kick back, squeeze, no back arch'],
           'Shapes the glutes.',
           ['Donkey kick on a mat'], gif='Cable Kickback', demo_q='cable glute kickback'),
        ex('7', 'Farmer walk', 'Grip, core', 'core', R_ACC,
           ['Two dumbbells, stand tall', 'Walk 30 metres, slow steps'],
           'Real-life strength: carrying bags.',
           ['Suitcase carry, one hand'], gif="Farmer's Walk", demo_q='farmer walk'),
    ],
    'arms': [
        ex('1', 'Brisk walk', 'Heart, legs', 'core', '60 sec.',
           ['30-45 min, outside or treadmill', 'Pace where you can talk but not sing'],
           'Saturday is walking day: fat loss without tiring the muscles.',
           ['Treadmill incline walk', 'Elliptical'], gif='Treadmill Incline Walk', demo_q='brisk walking'),
        ex('2', 'Glute bridge', 'Glutes', 'core', R_ACC,
           ['On a mat, feet flat', 'Squeeze up, 2 sec hold'],
           'Easy home toning after the walk.',
           ['Single-leg bridge'], gif='Glute Bridge'),
        ex('3', 'Wall push-up', 'Chest, triceps', 'core', R_ACC,
           ['Hands on a wall at chest height', 'Body straight'],
           'Gentle arm and chest work at home.',
           ['Push-up on a bench'], gif='Wall Push-Up'),
    ],
}

cardio_walk = lambda mins: {
    'title': f'Incline walk, {mins} min',
    'how': ['Treadmill 4.5-5.0 km/h, incline 5-8%', 'You can talk, but not sing', 'Or bike / elliptical, same time'],
}

src = ROOT / 'src/domain/trainingPlan.json'
plan = json.loads(src.read_text())
plan['days'] = days
plan['cardio'] = {k: cardio_walk(m) for k, m in {'push': 15, 'pull': 15, 'legs': 10, 'upper': 15, 'lower': 10, 'arms': 0}.items()}
plan['cardio']['arms'] = {'title': 'Walk is the session today', 'how': ['30-45 min brisk walk counts as cardio']}
plan['warmupBase'] = [
    ['Treadmill or bike', '5 min', 'Easy pace, just get warm.'],
    ['Arm circles', '10 each way', 'Small to big.'],
    ['Cat-cow', '8 reps', 'Round your back up, then let it sag.'],
]
plan['warmupUpper'] = [
    ['Band pull-apart', '15 reps', 'Arms straight, pull to the chest.'],
    ['Wall push-up', '10 reps', 'Slow.'],
]
plan['warmupLower'] = [
    ['Leg swings', '10 each leg', 'Hold the wall.'],
    ['Bodyweight squat to a bench', '10 reps', 'Sit back, stand up.'],
    ['Glute bridge', '12 reps', 'Squeeze at the top.'],
]
plan['satOption2'] = {
    'title': 'Walk + stretch',
    'blocks': [
        ['Walk, 30-45 min', 'Brisk pace, outside early morning or treadmill.'],
        ['Stretch, 10 min', "Hamstring stretch 30 sec/side · Calf stretch 30 sec/side · Child's pose 60 sec · Neck side stretch 30 sec/side."],
    ],
}
plan['pdf'] = {}
plan['birthdayPump'] = {
    'title': 'Eid week: light and happy',
    'when': 'From 1 Ramadan to Eid: train after iftar, 30-40 min, lighter weights.',
    'moves': [['Treadmill walk', '15 min'], ['Chest press machine', '2 x 12'], ['Lat pulldown', '2 x 12'], ['Leg press', '2 x 12'], ['Glute bridge', '2 x 15']],
    'after': 'Water and a protein snack after the session. Eid photos on the day!',
}
src.write_text(json.dumps(plan, indent=1, ensure_ascii=False) + '\n')
missing = [e['name'] for d in days.values() for e in d if not e['media']]
print('days', {k: len(v) for k, v in days.items()}, 'no gif:', missing)
