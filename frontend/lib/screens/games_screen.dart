import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  String? _activeGame; // null, 'memory_match', 'photo_recall', 'routine_ordering'
  int _difficultyTier = 1;
  bool _reduceVisualClues = false;
  bool _triggerAudioGuidance = true;
  bool _simplifyLayout = true;

  // Game specific variables
  List<String> _cards = [];
  List<bool> _cardFlips = [];
  int? _prevFlippedIndex;
  int _matchesFound = 0;
  DateTime? _gameStartTime;
  int _attemptsCount = 0;

  final FlutterTts _tts = FlutterTts();

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  void _speak(String text) async {
    if (_triggerAudioGuidance) {
      await _tts.stop();
      await _tts.setLanguage("en-US");
      await _tts.setSpeechRate(0.4);
      await _tts.speak(text);
    }
  }

  // Starts Memory Card Matching Game
  void _startMemoryMatch() {
    setState(() {
      _activeGame = "memory_match";
      _gameStartTime = DateTime.now();
      _attemptsCount = 0;
      _matchesFound = 0;

      // Card count scales with difficulty tier
      int pairsCount = _simplifyLayout ? 3 : (_difficultyTier <= 2 ? 4 : 6);
      List<String> icons = ["🍎", "🐶", "☀️", "🚗", "🏠", "🌸", "🍌", "🐈"].take(pairsCount).toList();
      _cards = [...icons, ...icons];
      _cards.shuffle();
      _cardFlips = List.filled(_cards.length, false);
      _prevFlippedIndex = null;
    });
    _speak("Let's play Memory Card Match. Tap cards to find matching pairs.");
  }

  void _handleCardTap(int index) {
    if (_cardFlips[index] || _matchesFound == _cards.length ~/ 2) return;

    setState(() {
      _cardFlips[index] = true;
      _attemptsCount++;
    });

    if (_prevFlippedIndex == null) {
      _prevFlippedIndex = index;
    } else {
      int prev = _prevFlippedIndex!;
      if (_cards[prev] == _cards[index]) {
        _matchesFound++;
        _prevFlippedIndex = null;
        _speak("You found a match!");

        if (_matchesFound == _cards.length ~/ 2) {
          _endGameSession();
        }
      } else {
        // Mismatch
        _speak("Not a match. Try again.");
        Future.delayed(const Duration(milliseconds: 1000), () {
          if (mounted) {
            setState(() {
              _cardFlips[prev] = false;
              _cardFlips[index] = false;
              _prevFlippedIndex = null;
            });
          }
        });
      }
    }
  }

  void _endGameSession() async {
    final endTime = DateTime.now();
    final elapsedSec = endTime.difference(_gameStartTime!).inSeconds.toDouble();
    final accuracy = (_cards.length / 2) / _attemptsCount * 100.0;

    _speak("Excellent job! You completed the game.");

    // Retrieve API Service
    final api = Provider.of<ApiService>(context, listen: false);
    
    // Log performance on server
    await api.logGameSession(
      elderlyId: 1, // Elderly demo user
      gameType: _activeGame!,
      difficultyTier: _difficultyTier,
      accuracy: accuracy,
      responseTimeSec: elapsedSec,
      attempts: _attemptsCount,
    );

    // AI Difficulty Engine scales parameters
    final adjustment = await api.getDifficultyAdjustment(
      gameType: _activeGame!,
      currentTier: _difficultyTier,
      accuracy: accuracy,
      responseTimeSec: elapsedSec,
      attempts: _attemptsCount,
      elderlyId: 1,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("Game Completed!", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
          "Great job!\nAccuracy: ${accuracy.toStringAsFixed(1)}%\nTime: ${elapsedSec.toStringAsFixed(1)} seconds.",
          style: const TextStyle(fontSize: 20),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _difficultyTier = adjustment["next_difficulty_tier"];
                _reduceVisualClues = adjustment["reduce_visual_clues"];
                _triggerAudioGuidance = adjustment["trigger_audio_guidance"];
                _simplifyLayout = adjustment["simplify_layout"];
                _activeGame = null;
              });
            },
            child: const Text("Return to Menu"),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Cognitive Games"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _activeGame == null ? _buildGamesSelector() : _buildActiveGameScreen(),
        ),
      ),
    );
  }

  Widget _buildGamesSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Choose a game to play:",
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text(
          "Current Difficulty Tier: $_difficultyTier (Adaptive Engine Enabled)",
          style: const TextStyle(fontSize: 18, color: Colors.blueGrey, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        _buildGameCard(
          "Memory Card Match",
          "Test visual memory by matching pairs of symbols.",
          Icons.grid_view_rounded,
          Colors.blue.shade100,
          _startMemoryMatch,
        ),
        const SizedBox(height: 16),
        _buildGameCard(
          "Photo Recall",
          "Identify family members and recall memories.",
          Icons.face_retouching_natural,
          Colors.green.shade100,
          () {
            setState(() => _activeGame = "photo_recall");
            _speak("Let's remember your family. Who is in this photo?");
          },
        ),
        const SizedBox(height: 16),
        _buildGameCard(
          "Daily Routine Ordering",
          "Order routine activities in the correct timing sequence.",
          Icons.sort_rounded,
          Colors.orange.shade100,
          () {
            setState(() => _activeGame = "routine_ordering");
            _speak("Order these routine tasks sequentially. What happens first?");
          },
        ),
      ],
    );
  }

  Widget _buildGameCard(String title, String description, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      color: color,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Row(
            children: [
              Icon(icon, size: 54, color: MindnerTheme.textDark),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(description, style: const TextStyle(fontSize: 16, color: Colors.black87)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveGameScreen() {
    if (_activeGame == "memory_match") {
      return _buildMemoryMatchGame();
    } else if (_activeGame == "photo_recall") {
      return _buildPhotoRecallGame();
    } else {
      return _buildRoutineOrderingGame();
    }
  }

  Widget _buildMemoryMatchGame() {
    int crossAxis = _simplifyLayout ? 3 : 4;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Memory Card Match", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            IconButton(
              icon: const Icon(Icons.close, size: 36),
              onPressed: () => setState(() => _activeGame = null),
            )
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: GridView.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxis,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: _cards.length,
            itemBuilder: (context, index) {
              final isFlipped = _cardFlips[index];
              return InkWell(
                onTap: () => _handleCardTap(index),
                child: Card(
                  color: isFlipped ? Colors.white : MindnerTheme.primaryBlue.withOpacity(0.8),
                  child: Center(
                    child: Text(
                      isFlipped ? _cards[index] : "?",
                      style: TextStyle(
                        fontSize: isFlipped ? 40 : 28,
                        fontWeight: FontWeight.bold,
                        color: isFlipped ? Colors.black : Colors.white,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoRecallGame() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Who is in this photo?", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            IconButton(
              icon: const Icon(Icons.close, size: 36),
              onPressed: () => setState(() => _activeGame = null),
            )
          ],
        ),
        const SizedBox(height: 24),
        // Beautiful simulated picture frame
        Container(
          height: 280,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.grey.shade300, width: 4),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.face, size: 100, color: Colors.blueGrey),
                SizedBox(height: 8),
                Text("Anjali (Daughter)", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        // Choice selection buttons (large accessible buttons)
        Column(
          children: [
            SizedBox(
              width: double.infinity,
              height: 72,
              child: ElevatedButton(
                onPressed: () {
                  _speak("That is correct! It is your daughter Anjali.");
                  _activeGame = null;
                  setState(() {});
                },
                child: const Text("Anjali (Daughter)"),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 72,
              child: ElevatedButton(
                onPressed: () {
                  _speak("No, that is not Sunita. Try again.");
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey.shade100, foregroundColor: Colors.black87),
                child: const Text("Sunita (Sister)"),
              ),
            )
          ],
        )
      ],
    );
  }

  Widget _buildRoutineOrderingGame() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Order the Morning Steps", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            IconButton(
              icon: const Icon(Icons.close, size: 36),
              onPressed: () => setState(() => _activeGame = null),
            )
          ],
        ),
        const SizedBox(height: 24),
        Expanded(
          child: ListView(
            children: [
              Card(
                color: Colors.grey.shade100,
                child: const ListTile(
                  leading: CircleAvatar(child: Text("1")),
                  title: Text("Brush Teeth", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ),
              ),
              Card(
                color: Colors.grey.shade100,
                child: const ListTile(
                  leading: CircleAvatar(child: Text("2")),
                  title: Text("Eat Breakfast", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ),
              ),
              Card(
                color: Colors.grey.shade100,
                child: const ListTile(
                  leading: CircleAvatar(child: Text("3")),
                  title: Text("Take Morning Pills", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                height: 72,
                child: ElevatedButton(
                  onPressed: () {
                    _speak("Correct sequence completed!");
                    _activeGame = null;
                    setState(() {});
                  },
                  child: const Text("Done / Check Sequence"),
                ),
              )
            ],
          ),
        )
      ],
    );
  }
}
