"""W04 tests: equipment and experience influence strength variation."""

from __future__ import annotations

import pytest

from engine.weekly_workout_engine import (
    WorkoutDatabase,
    constrain_variation_level_to_equipment,
    strength_experience_initial_level,
)


def database():
    return WorkoutDatabase()


def test_experience_maps_to_starting_levels():
    assert strength_experience_initial_level("new")["squat"] == 1
    assert strength_experience_initial_level("some_experience")["pushup"] == 2
    assert strength_experience_initial_level("regularly_train")["lunge"] == 3
    assert strength_experience_initial_level(None)["squat"] == 1


def test_dumbbells_unlock_loaded_squat_level():
    db = database()
    level = constrain_variation_level_to_equipment(
        db, "squat", 3, ["dumbbells"]
    )
    assert level == 3


def test_no_equipment_lowers_loaded_squat_to_bodyweight():
    db = database()
    level = constrain_variation_level_to_equipment(
        db, "squat", 3, ["no_equipment"]
    )
    assert level == 2


def test_no_equipment_keeps_bodyweight_pushup_level():
    db = database()
    level = constrain_variation_level_to_equipment(
        db, "pushup", 3, ["no_equipment"]
    )
    assert level == 3


def test_missing_resistance_variation_is_explicit_unsupported():
    db = database()
    with pytest.raises(ValueError, match="eligible"):
        constrain_variation_level_to_equipment(
            db, "bicep_curl", 3, ["no_equipment"]
        )
