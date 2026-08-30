import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = "http://localhost:8000/api";
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> get _headers => {
        "Content-Type": "application/json",
        if (_token != null) "Authorization": "Bearer $_token",
      };

  // Auth API
  Future<bool> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        body: {
          "username": username,
          "password": password,
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data["access_token"];
        return true;
      }
    } catch (_) {}
    return false;
  }

  // Fetch Memories for Timeline
  Future<List<Map<String, dynamic>>> fetchTimeline() async {
    try {
      final response = await http.get(Uri.parse("$baseUrl/memories/timeline"), headers: _headers);
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(jsonDecode(response.body));
      }
    } catch (_) {}
    // Mock data fallback if local server offline
    return [
      {"id": 1, "title": "Wedding Day", "relationship_tag": "Spouse", "year_tag": 1970, "description": "Our wedding in Shillong with all friends.", "image_path": null},
      {"id": 2, "title": "Anjali's Graduation", "relationship_tag": "Daughter", "year_tag": 1995, "description": "Anjali receiving her Master's degree.", "image_path": null},
      {"id": 3, "title": "Grandchildren Picnic", "relationship_tag": "Family", "year_tag": 2012, "description": "Fun weekend picnic in Mizo Hills.", "image_path": null},
    ];
  }

  // Log Game Activity
  Future<void> logGameSession({
    required int elderlyId,
    required String gameType,
    required int difficultyTier,
    required double accuracy,
    required double responseTimeSec,
    required int attempts,
  }) async {
    try {
      await http.post(
        Uri.parse("$baseUrl/games/log"),
        headers: _headers,
        body: jsonEncode({
          "elderly_id": elderlyId,
          "game_type": gameType,
          "difficulty_tier": difficultyTier,
          "accuracy": accuracy,
          "response_time_sec": responseTimeSec,
          "attempts": attempts,
          "completed": true,
        }),
      );
    } catch (_) {}
  }

  // Adjust game difficulty (AI adaptive scale check)
  Future<Map<String, dynamic>> getDifficultyAdjustment({
    required String gameType,
    required int currentTier,
    required double accuracy,
    required double responseTimeSec,
    required int attempts,
    required int elderlyId,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
          "$baseUrl/games/difficulty-adjustment"
          "?game_type=$gameType"
          "&current_tier=$currentTier"
          "&accuracy=$accuracy"
          "&response_time_sec=$responseTimeSec"
          "&attempts=$attempts"
          "&elderly_id=$elderlyId",
        ),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {}
    
    // Core AI offline fallback logic mirroring backend rules
    final isHigh = accuracy > 85.0 && responseTimeSec < (gameType == "memory_match" ? 8.0 : 10.0);
    final isStruggling = accuracy < 50.0 || attempts >= 3;
    int nextTier = currentTier;
    if (isHigh) {
      nextTier = (currentTier + 1).clamp(1, 5);
    } else if (isStruggling) {
      nextTier = (currentTier - 1).clamp(1, 5);
    }

    return {
      "next_difficulty_tier": nextTier,
      "reduce_visual_clues": isHigh,
      "trigger_audio_guidance": isStruggling || nextTier == 1,
      "simplify_layout": isStruggling || nextTier == 1,
    };
  }

  // Routines API
  Future<List<Map<String, dynamic>>> fetchRoutines() async {
    try {
      final response = await http.get(Uri.parse("$baseUrl/routines/my-routines"), headers: _headers);
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(jsonDecode(response.body));
      }
    } catch (_) {}
    return [
      {"id": 1, "title": "Morning Medicine", "description": "Take blue pills after breakfast", "time_of_day": "08:30", "is_completed": false},
      {"id": 2, "title": "Walk in the Garden", "description": "15 minutes slow walk", "time_of_day": "10:30", "is_completed": false},
      {"id": 3, "title": "Call Anjali", "description": "Call daughter Anjali", "time_of_day": "17:00", "is_completed": false},
    ];
  }

  Future<void> markRoutineCompleted(int routineId) async {
    try {
      await http.put(Uri.parse("$baseUrl/routines/complete/$routineId"), headers: _headers);
    } catch (_) {}
  }
}
