import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../constants/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FlutterTts _tts = FlutterTts();

  @override
  void initState() {
    super.initState();
    _speakWelcome();
  }

  void _speakWelcome() async {
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.4);
    await _tts.speak("Welcome back. Please select from the six options on your screen.");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top Header App Bar
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "MINDNER",
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: MindnerTheme.primaryBlue,
                          fontWeight: FontWeight.bold
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        "Cognitive Companion for Supportive Care",
                        style: TextStyle(fontSize: 15, color: Colors.grey, fontWeight: FontWeight.w600),
                      )
                    ],
                  ),
                  // Caregiver security portal link
                  TextButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/caregiver-login'),
                    icon: const Icon(Icons.lock_outline, size: 28, color: MindnerTheme.primaryBlue),
                    label: const Text("Caregiver Portal", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  )
                ],
              ),
            ),

            // Grid of 6 primary actions (Accommmodating the new layout demands)
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.25,
                children: [
                  _buildMenuCard(
                    context,
                    title: "🧠 Cognitive Games",
                    description: "Play matching & puzzles",
                    color: const Color(0xFFE3F2FD),
                    route: '/games',
                  ),
                  _buildMenuCard(
                    context,
                    title: "📖 My Memories",
                    description: "Your custom photo timeline",
                    color: const Color(0xFFE8F5E9),
                    route: '/timeline',
                  ),
                  _buildMenuCard(
                    context,
                    title: "🎙️ Family Voices",
                    description: "Listen to loved ones",
                    color: const Color(0xFFFFF3E0),
                    route: '/family-voices',
                  ),
                  _buildMenuCard(
                    context,
                    title: "🗣️ Talk to Assistant",
                    description: "Vocal assistant buddy",
                    color: const Color(0xFFF3E5F5),
                    route: '/assistant',
                  ),
                  _buildMenuCard(
                    context,
                    title: "📅 Today's Routine",
                    description: "Medication & schedules",
                    color: const Color(0xFFFFFDE7),
                    route: '/routine',
                  ),
                  _buildMenuCard(
                    context,
                    title: "📊 My Progress",
                    description: "Track performance levels",
                    color: const Color(0xFFE0F7FA),
                    route: '/progress',
                  ),
                ],
              ),
            ),

            // Footing medical protection notice
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12.0),
              child: Text(
                "Cognitive Engagement & Activity Tracking (Non-Diagnostic Platform)",
                style: TextStyle(fontSize: 13, color: Colors.grey, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context, {
    required String title,
    required String description,
    required Color color,
    required String route,
  }) {
    return Card(
      color: color,
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, route),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(18.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: MindnerTheme.textDark,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: TextStyle(
                  fontSize: 15,
                  color: MindnerTheme.textDark.withOpacity(0.7),
                  fontWeight: FontWeight.w600
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
