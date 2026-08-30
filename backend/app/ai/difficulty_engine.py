import numpy as np
from typing import List, Dict, Any

class AdaptiveDifficultyEngine:
    """
    MINDNER Adaptive Difficulty Engine
    Calculates difficulty tiers and UI accommodations for elderly users based on game engagement metrics.
    """

    # Baselines for response times in seconds based on game types
    GAME_BASELINES = {
        "memory_match": 8.0,
        "photo_recall": 10.0,
        "routine_ordering": 12.0
    }

    MIN_TIER = 1
    MAX_TIER = 5

    @classmethod
    def calculate_next_difficulty(
        cls, 
        game_type: str, 
        current_tier: int, 
        accuracy: float, 
        response_time: float, 
        attempts: int,
        past_sessions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes the adaptive scaling logic:
        - INCREMENT (+1): Accuracy > 85% AND response_time < Baseline. Reduces clues.
        - DECREMENT (-1): Accuracy < 50% OR attempts >= 3. Triggers audio guidance, simplifies layout.
        - REMAINS SAME: Otherwise.
        """
        baseline = cls.GAME_BASELINES.get(game_type, 10.0)

        # Baseline adjustment if history exists (dynamic patient baseline adaptation)
        if past_sessions and len(past_sessions) >= 3:
            times = [s["response_time"] for s in past_sessions[-5:] if s.get("completed", True)]
            if times:
                # Set baseline to the median of recent successful runs
                baseline = float(np.median(times))

        next_tier = current_tier
        reduce_visual_clues = False
        trigger_audio_guidance = False
        simplify_layout = False

        # Conditions
        is_high_performer = accuracy > 85.0 and response_time < baseline
        is_struggling = accuracy < 50.0 or attempts >= 3

        if is_high_performer:
            # Upgrade tier
            next_tier = min(cls.MAX_TIER, current_tier + 1)
            reduce_visual_clues = True
        elif is_struggling:
            # Downgrade tier and offer accommodations
            next_tier = max(cls.MIN_TIER, current_tier - 1)
            trigger_audio_guidance = True
            simplify_layout = True
        else:
            # Middle-ground: Keep tier, adjust layout slightly if accuracy is borderline
            if accuracy < 70.0:
                trigger_audio_guidance = True
            if accuracy > 80.0:
                reduce_visual_clues = False

        # If we are at tier 1, layout is always simplified and audio guidance is available
        if next_tier == 1:
            simplify_layout = True
            trigger_audio_guidance = True

        return {
            "next_difficulty_tier": next_tier,
            "reduce_visual_clues": reduce_visual_clues,
            "trigger_audio_guidance": trigger_audio_guidance,
            "simplify_layout": simplify_layout
        }
