import unittest
import sys
import os

# Adjust path to import backend app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.ai.difficulty_engine import AdaptiveDifficultyEngine

class TestAdaptiveDifficultyEngine(unittest.TestCase):

    def test_difficulty_increment(self):
        # Accuracy is high (90%), response time (5.0s) is below baseline (8.0s)
        # Should increment difficulty tier from 2 to 3
        result = AdaptiveDifficultyEngine.calculate_next_difficulty(
            game_type="memory_match",
            current_tier=2,
            accuracy=90.0,
            response_time=5.0,
            attempts=1
        )
        self.assertEqual(result["next_difficulty_tier"], 3)
        self.assertTrue(result["reduce_visual_clues"])

    def test_difficulty_decrement_low_accuracy(self):
        # Accuracy is low (40%)
        # Should decrement difficulty tier from 3 to 2, and prompt visual/audio support
        result = AdaptiveDifficultyEngine.calculate_next_difficulty(
            game_type="photo_recall",
            current_tier=3,
            accuracy=40.0,
            response_time=12.0,
            attempts=1
        )
        self.assertEqual(result["next_difficulty_tier"], 2)
        self.assertTrue(result["trigger_audio_guidance"])
        self.assertTrue(result["simplify_layout"])

    def test_difficulty_decrement_too_many_attempts(self):
        # Attempts >= 3
        # Should decrement difficulty tier from 2 to 1 and trigger support
        result = AdaptiveDifficultyEngine.calculate_next_difficulty(
            game_type="routine_ordering",
            current_tier=2,
            accuracy=80.0,
            response_time=10.0,
            attempts=3
        )
        self.assertEqual(result["next_difficulty_tier"], 1)
        self.assertTrue(result["trigger_audio_guidance"])
        self.assertTrue(result["simplify_layout"])

    def test_difficulty_bound_checks(self):
        # Check boundary ceiling (Tier 5)
        result_max = AdaptiveDifficultyEngine.calculate_next_difficulty(
            game_type="memory_match",
            current_tier=5,
            accuracy=95.0,
            response_time=2.0,
            attempts=1
        )
        self.assertEqual(result_max["next_difficulty_tier"], 5)

        # Check boundary floor (Tier 1)
        result_min = AdaptiveDifficultyEngine.calculate_next_difficulty(
            game_type="photo_recall",
            current_tier=1,
            accuracy=30.0,
            response_time=20.0,
            attempts=4
        )
        self.assertEqual(result_min["next_difficulty_tier"], 1)

if __name__ == "__main__":
    unittest.main()
