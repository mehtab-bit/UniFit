from __future__ import annotations

from pathlib import Path
import csv

DATA_DIR = Path('data/workouts')
EXERCISE_VARIATIONS_PATH = DATA_DIR / 'exercise_variations.csv'

OUTPUTS = {
    'profiles': DATA_DIR / 'accessibility_profiles.csv',
    'resources': DATA_DIR / 'accessibility_resources.csv',
    'templates': DATA_DIR / 'accessibility_workout_templates.csv',
    'guidance': DATA_DIR / 'accessibility_exercise_guidance.csv',
    'progression': DATA_DIR / 'accessibility_progression_rules.csv',
}


def write_csv(path: Path, rows: list[dict], columns: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f'Missing required file: {path}')
    with path.open('r', encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


accessibility_profiles = [
    {
        'accessibility_id': 'none',
        'display_name': 'No accessibility adaptation',
        'automatic_workout_adaptation': False,
        'audio_guidance': False,
        'visual_captions': False,
        'haptic_cues': False,
        'notes': 'Use the standard workout experience.',
    },
    {
        'accessibility_id': 'blind_low_vision',
        'display_name': 'Blind or low vision',
        'automatic_workout_adaptation': True,
        'audio_guidance': True,
        'visual_captions': False,
        'haptic_cues': True,
        'notes': (
            'Prefer workouts that do not depend on visual navigation. '
            'Route-based activities are selected only when the required '
            'guide or accessible setup is available.'
        ),
    },
    {
        'accessibility_id': 'deaf_hard_of_hearing',
        'display_name': 'Deaf or hard of hearing',
        'automatic_workout_adaptation': False,
        'audio_guidance': False,
        'visual_captions': True,
        'haptic_cues': True,
        'notes': (
            'The workout can normally remain unchanged. Present instructions, '
            'timers and interval changes visually and/or with haptics.'
        ),
    },
    {
        'accessibility_id': 'other',
        'display_name': 'Other accessibility need',
        'automatic_workout_adaptation': False,
        'audio_guidance': False,
        'visual_captions': True,
        'haptic_cues': True,
        'notes': (
            'Store an optional user note. Do not infer a medical condition '
            'or automatically prescribe a different exercise plan.'
        ),
    },
]


accessibility_resources = [
    {
        'resource_id': 'safe_indoor_space',
        'display_name': 'Clear familiar indoor workout space',
        'accessibility_id': 'blind_low_vision',
        'description': 'A familiar obstacle-free area suitable for stationary exercise.',
    },
    {
        'resource_id': 'stable_support',
        'display_name': 'Stable chair, wall or support',
        'accessibility_id': 'blind_low_vision',
        'description': 'A fixed support that can be used as a tactile reference when needed.',
    },
    {
        'resource_id': 'guide',
        'display_name': 'Exercise partner or guide',
        'accessibility_id': 'blind_low_vision',
        'description': 'A suitable guide/support person for route-based walking or running.',
    },
    {
        'resource_id': 'stationary_bike',
        'display_name': 'Stationary exercise bike',
        'accessibility_id': 'blind_low_vision',
        'description': 'A stable stationary bike with a familiar setup and controls.',
    },
    {
        'resource_id': 'accessible_pool_support',
        'display_name': 'Accessible pool and support arrangement',
        'accessibility_id': 'blind_low_vision',
        'description': 'A familiar/accessibly supported pool environment for swimming.',
    },
]


accessibility_workout_templates = [
    {
        'template_id': 'BLV_HOME_MARCH',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'walking',
        'eligible_preference': 'any',
        'session_type': 'indoor_march',
        'title': 'Indoor March',
        'required_resource': 'safe_indoor_space',
        'requires_guide': False,
        'use_distance': False,
        'use_duration': True,
        'intensity_default': 'easy',
        'warmup_audio': (
            'Stand in a familiar clear area. Keep a stable chair or wall within '
            'easy reach if you want a reference point. Begin with slow controlled marching.'
        ),
        'main_audio': (
            'March in place at the prescribed effort. Keep each step controlled '
            'and stay within the same clear area.'
        ),
        'cooldown_audio': (
            'Gradually slow the marching pace and finish with relaxed easy movement.'
        ),
        'safety_note': (
            'Use a familiar obstacle-free space. Stop if you feel pain, dizziness '
            'or unsafe balance.'
        ),
    },
    {
        'template_id': 'BLV_HOME_STEP_TOUCH',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'walking',
        'eligible_preference': 'any',
        'session_type': 'step_touch',
        'title': 'Supported Step-Touch Cardio',
        'required_resource': 'safe_indoor_space',
        'requires_guide': False,
        'use_distance': False,
        'use_duration': True,
        'intensity_default': 'moderate',
        'warmup_audio': (
            'Stand in a clear familiar area. Keep a stable chair or wall close '
            'if you want a reference point. Begin with small slow side steps.'
        ),
        'main_audio': (
            'Step gently to one side and bring the other foot toward it, then '
            'repeat in the opposite direction. Keep the movement small and controlled.'
        ),
        'cooldown_audio': (
            'Make the side steps smaller and slower, then return to relaxed easy movement.'
        ),
        'safety_note': (
            'Keep the floor clear and dry. Use stable support if needed. '
            'If side stepping feels uncertain, use Indoor March instead.'
        ),
    },
    {
        'template_id': 'BLV_GUIDED_WALK',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'walking',
        'eligible_preference': 'walking',
        'session_type': 'guided_walk',
        'title': 'Guided Walk',
        'required_resource': 'guide',
        'requires_guide': True,
        'use_distance': True,
        'use_duration': True,
        'intensity_default': 'easy',
        'warmup_audio': 'Begin at an easy pace using the established guiding/support method.',
        'main_audio': (
            'Walk at the prescribed effort using the agreed guiding method. '
            'Changes in direction, surface or pace should be communicated before they happen.'
        ),
        'cooldown_audio': 'Reduce the pace gradually for several minutes before finishing.',
        'safety_note': (
            'Do not direct the user onto an unsupported unfamiliar route.'
        ),
    },
    {
        'template_id': 'BLV_GUIDED_RUN',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'running',
        'eligible_preference': 'running',
        'session_type': 'guided_run',
        'title': 'Guided Run',
        'required_resource': 'guide',
        'requires_guide': True,
        'use_distance': True,
        'use_duration': True,
        'intensity_default': 'easy',
        'warmup_audio': (
            'Start with easy walking and gentle jogging using the established guiding method.'
        ),
        'main_audio': (
            'Run at the prescribed controlled effort with the agreed guiding method. '
            'Pace changes should be gradual and communicated before they happen.'
        ),
        'cooldown_audio': 'Return to easy jogging and then walking for several minutes.',
        'safety_note': (
            'Only use this session when a suitable guide/support arrangement is available.'
        ),
    },
    {
        'template_id': 'BLV_STATIONARY_CYCLE',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'cycling',
        'eligible_preference': 'cycling',
        'session_type': 'stationary_cycle',
        'title': 'Stationary Cycling',
        'required_resource': 'stationary_bike',
        'requires_guide': False,
        'use_distance': False,
        'use_duration': True,
        'intensity_default': 'easy',
        'warmup_audio': 'Begin with very easy pedalling for several minutes.',
        'main_audio': (
            'Continue for the prescribed duration and effort. Change resistance '
            'gradually and keep the pedalling rhythm controlled.'
        ),
        'cooldown_audio': 'Reduce resistance and pedal easily for several minutes before stopping.',
        'safety_note': (
            'Use a stable stationary bike whose mounting setup and controls are familiar.'
        ),
    },
    {
        'template_id': 'BLV_GUIDED_SWIM',
        'accessibility_id': 'blind_low_vision',
        'activity_id': 'swimming',
        'eligible_preference': 'swimming',
        'session_type': 'guided_swim',
        'title': 'Supported Accessible Swim',
        'required_resource': 'accessible_pool_support',
        'requires_guide': True,
        'use_distance': True,
        'use_duration': True,
        'intensity_default': 'easy',
        'warmup_audio': (
            'Begin with relaxed swimming using the support arrangements already '
            'established with the pool or guide.'
        ),
        'main_audio': (
            'Swim at the prescribed controlled effort using the established '
            'orientation and support method.'
        ),
        'cooldown_audio': 'Finish with relaxed easy swimming using the same support arrangement.',
        'safety_note': (
            'Only prescribe this option when an appropriate accessible pool and '
            'support arrangement are available.'
        ),
    },
]


GUIDANCE = {
    'SQUAT_L1': (
        'Stand directly in front of a stable chair with the chair close behind you. '
        'Place your feet about shoulder-width apart. Move your hips back and bend '
        'your knees slowly until you lightly touch the chair, then press through '
        'your feet to stand.',
        'Use the chair behind you as a fixed tactile reference.',
        'Make sure the chair cannot slide.'
    ),
    'SQUAT_L2': (
        'Stand in a clear area with feet about shoulder-width apart. Keep a stable '
        'chair or wall within easy reach if desired. Move your hips back, bend your '
        'knees through a comfortable range, then stand smoothly.',
        'Stay in one fixed clear position throughout the set.',
        'Use stable support if balance feels uncertain.'
    ),
    'SQUAT_L3': (
        'Place the secure weight in a known location before starting. Hold the load '
        'close to your body, establish your stance, then squat slowly through a '
        'comfortable range before standing again.',
        'Keep the load and any support point in consistent known locations.',
        'Only use a secure load that can be controlled without losing balance.'
    ),
    'LUNGE_L1': (
        'Stand beside a stable chair or support and keep one hand in light contact '
        'with it. Step one foot backward, lower under control, then return that foot '
        'to the starting position before changing sides.',
        'Use the stable support as a fixed position reference.',
        'Keep the step length comfortable and the floor clear.'
    ),
    'LUNGE_L2': (
        'Begin from a fixed standing position in a clear area. Step one foot backward, '
        'lower with control, then push through the front foot to return to the same '
        'starting position.',
        'Use a nearby stable support if needed for orientation.',
        'If balance is uncertain, use the supported variation instead.'
    ),
    'LUNGE_L3': (
        'Hold the secure resistance close to your body and establish your fixed '
        'starting position. Step backward into the lunge, lower slowly, then return '
        'to the same starting position before changing sides.',
        'Keep weights and support in consistent known positions.',
        'Do not add load until the unloaded movement feels controlled.'
    ),
    'PUSHUP_L1': (
        'Face a clear wall. Place both palms on the wall around chest height and about '
        'shoulder-width apart. Step back to a comfortable position. Bend your elbows '
        'to bring your chest toward the wall, then press away.',
        'The wall provides a fixed tactile reference for both hands.',
        'Keep the floor around your feet clear and dry.'
    ),
    'PUSHUP_L2': (
        'Locate the stable raised surface with both hands before starting. Place your '
        'hands securely, step your feet back, keep your body aligned, lower toward '
        'the surface, then press back up.',
        'Keep both hands on the same stable surface throughout the set.',
        'Do not use furniture that can move or tip.'
    ),
    'PUSHUP_L3': (
        'Use a clear floor area. Place both hands securely on the floor, move into a '
        'stable plank position, lower your chest under control, then press back to '
        'the starting position.',
        'Use the same clear floor position for the full set.',
        'Use an easier push-up variation if the floor setup feels uncertain.'
    ),
    'CURL_L1': (
        'Place the light bottles or dumbbells in a consistent location before starting. '
        'Hold one securely in each hand, keep your elbows near your sides, curl the '
        'weights upward, then lower them slowly.',
        'Return the weights to the same known location after the set.',
        'Use containers or weights that are closed, secure and easy to grip.'
    ),
    'CURL_L2': (
        'Hold the secure resistance with your arms by your sides. Keep your upper arms '
        'still, bend your elbows to raise the load, then lower it slowly without swinging.',
        'Keep your stance fixed and the exercise area clear.',
        'Choose a load that can be controlled without body swinging.'
    ),
    'CURL_L3': (
        'Use the same controlled curl setup with a slightly greater secure resistance. '
        'Raise and lower the load smoothly while keeping your upper arms close to your body.',
        'Keep all equipment in consistent known positions.',
        'Increase resistance only when the previous load is controlled.'
    ),
    'ROW_L1': (
        'Locate a stable support with one hand and place the light weight in the opposite '
        'hand. Keep your trunk controlled, pull the weight toward the side of your rib cage, '
        'then lower it slowly. Change sides after completing the prescribed work.',
        'Keep one hand in contact with the fixed support.',
        'Use a support that cannot slide or tip.'
    ),
    'ROW_L2': (
        'Establish the supported position with one hand on a stable surface. Hold the '
        'resistance securely in the other hand, pull the elbow backward toward the torso, '
        'then lower the load under control.',
        'Keep the support and weight in consistent known locations.',
        'Keep the trunk stable and avoid twisting to move the load.'
    ),
    'ROW_L3': (
        'Use the familiar supported rowing position with a greater but manageable secure '
        'resistance. Pull the load toward the torso and lower it slowly while maintaining '
        'the same stable body position.',
        'Maintain hand contact with the fixed support during the set.',
        'Do not increase load if it changes your stable body position.'
    ),
}

accessibility_exercise_guidance = [
    {
        'variation_id': variation_id,
        'accessibility_id': 'blind_low_vision',
        'audio_instruction': values[0],
        'orientation_cue': values[1],
        'safety_note': values[2],
    }
    for variation_id, values in GUIDANCE.items()
]


BASE_DURATION = {
    'sedentary': 10,
    'light': 15,
    'moderate': 20,
    'very_active': 25,
}

WEEK_MULTIPLIERS = {
    1: 1.00,
    2: 1.10,
    3: 1.20,
    4: 0.95,
    5: 1.20,
    6: 1.30,
    7: 1.40,
    8: 1.50,
}

accessibility_progression_rules = []
rule_counter = 1

for lifestyle, base_duration in BASE_DURATION.items():
    for week_number in range(1, 9):
        duration = round(base_duration * WEEK_MULTIPLIERS[week_number])

        if week_number == 4:
            template_id = 'BLV_HOME_MARCH'
            intensity = 'easy'
            interval_count = None
            work_interval_sec = None
            recovery_interval_sec = None
            note = 'Consolidation week: easier controlled indoor movement and recovery.'
        elif week_number <= 2:
            template_id = 'BLV_HOME_MARCH'
            intensity = 'easy'
            interval_count = None
            work_interval_sec = None
            recovery_interval_sec = None
            note = 'Controlled continuous indoor movement in a familiar clear area.'
        elif week_number <= 5:
            template_id = 'BLV_HOME_STEP_TOUCH'
            intensity = 'moderate'
            interval_count = 4
            work_interval_sec = 60
            recovery_interval_sec = 60
            note = 'Controlled step-touch work periods with easy marching recovery.'
        else:
            template_id = 'BLV_HOME_STEP_TOUCH'
            intensity = 'moderate'
            interval_count = 5 if week_number == 6 else 6
            work_interval_sec = 75 if week_number == 6 else 90
            recovery_interval_sec = 60
            note = (
                'Controlled home-cardio intervals. Advance only when the previous '
                'rule week meets the completion threshold.'
            )

        accessibility_progression_rules.append({
            'rule_id': f'APR{rule_counter:03d}',
            'accessibility_id': 'blind_low_vision',
            'lifestyle': lifestyle,
            'week_number': week_number,
            'template_id': template_id,
            'duration_min': duration,
            'interval_count': interval_count,
            'work_interval_sec': work_interval_sec,
            'recovery_interval_sec': recovery_interval_sec,
            'intensity': intensity,
            'is_consolidation_week': week_number == 4,
            'advance_if_completion_pct': 80,
            'progression_note': note,
        })
        rule_counter += 1


# Validation against the existing strength library.
existing_variations = read_csv(EXERCISE_VARIATIONS_PATH)
existing_variation_ids = {row['variation_id'] for row in existing_variations}
assert set(GUIDANCE) <= existing_variation_ids, 'Accessibility guidance references unknown variation IDs.'

assert {row['accessibility_id'] for row in accessibility_profiles} == {
    'none', 'blind_low_vision', 'deaf_hard_of_hearing', 'other'
}
assert len(accessibility_resources) == 5
assert len(accessibility_workout_templates) == 6
assert len({row['template_id'] for row in accessibility_workout_templates}) == 6
assert len(accessibility_exercise_guidance) == 15
assert len(accessibility_progression_rules) == 32

for lifestyle in BASE_DURATION:
    weeks = {
        row['week_number']
        for row in accessibility_progression_rules
        if row['lifestyle'] == lifestyle
    }
    assert weeks == set(range(1, 9))


write_csv(
    OUTPUTS['profiles'],
    accessibility_profiles,
    [
        'accessibility_id', 'display_name', 'automatic_workout_adaptation',
        'audio_guidance', 'visual_captions', 'haptic_cues', 'notes'
    ],
)

write_csv(
    OUTPUTS['resources'],
    accessibility_resources,
    ['resource_id', 'display_name', 'accessibility_id', 'description'],
)

write_csv(
    OUTPUTS['templates'],
    accessibility_workout_templates,
    [
        'template_id', 'accessibility_id', 'activity_id', 'eligible_preference',
        'session_type', 'title', 'required_resource', 'requires_guide',
        'use_distance', 'use_duration', 'intensity_default', 'warmup_audio',
        'main_audio', 'cooldown_audio', 'safety_note'
    ],
)

write_csv(
    OUTPUTS['guidance'],
    accessibility_exercise_guidance,
    ['variation_id', 'accessibility_id', 'audio_instruction', 'orientation_cue', 'safety_note'],
)

write_csv(
    OUTPUTS['progression'],
    accessibility_progression_rules,
    [
        'rule_id', 'accessibility_id', 'lifestyle', 'week_number', 'template_id',
        'duration_min', 'interval_count', 'work_interval_sec',
        'recovery_interval_sec', 'intensity', 'is_consolidation_week',
        'advance_if_completion_pct', 'progression_note'
    ],
)

print()
print('=' * 76)
print('ACCESSIBILITY WORKOUT DATA CREATED')
print('=' * 76)
print('Accessibility profiles:', len(accessibility_profiles))
print('Accessibility resources:', len(accessibility_resources))
print('Accessible workout templates:', len(accessibility_workout_templates))
print('Strength guidance rows:', len(accessibility_exercise_guidance))
print('Accessible progression rules:', len(accessibility_progression_rules))
print('Rep-counter/CV assumptions: none')
print()
for path in OUTPUTS.values():
    print('-', path)
print('=' * 76)
print('ACCESSIBILITY DATA LAYER READY')
print('=' * 76)
