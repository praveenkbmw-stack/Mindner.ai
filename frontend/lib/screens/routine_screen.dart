import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../constants/theme.dart';
import '../services/api_service.dart';

class RoutineScreen extends StatefulWidget {
  const RoutineScreen({super.key});

  @override
  State<RoutineScreen> createState() => _RoutineScreenState();
}

class _RoutineScreenState extends State<RoutineScreen> {
  final FlutterTts _tts = FlutterTts();
  List<Map<String, dynamic>> _routines = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRoutines();
  }

  void _loadRoutines() async {
    final api = Provider.of<ApiService>(context, listen: false);
    final data = await api.fetchRoutines();
    setState(() {
      _routines = data;
      _isLoading = false;
    });
    _speakText("Here is your schedule for today. Tap on any item to read it aloud, or tap the checkmark to mark it done.");
  }

  void _speakText(String text) async {
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.4);
    await _tts.speak(text);
  }

  void _toggleRoutine(int index) async {
    final routine = _routines[index];
    if (routine['is_completed']) return;

    setState(() {
      _routines[index]['is_completed'] = true;
    });

    final api = Provider.of<ApiService>(context, listen: false);
    await api.markRoutineCompleted(routine['id']);

    _speakText("Fantastic job completing ${routine['title']}!");
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text("Routine Completed!", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
          "You completed: ${routine['title']}.\nGreat job following your routine!",
          style: const TextStyle(fontSize: 20),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Excellent"),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Routine"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Your Daily Schedule",
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Check off tasks as you finish them today.",
                      style: TextStyle(fontSize: 18, color: Colors.blueGrey, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 32),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _routines.length,
                        itemBuilder: (context, index) {
                          final routine = _routines[index];
                          final isDone = routine['is_completed'];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 20.0),
                            child: Card(
                              color: isDone ? Colors.green.shade50 : Colors.white,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
                                child: Row(
                                  children: [
                                    // Big accessible checkbox button
                                    SizedBox(
                                      width: 64,
                                      height: 64,
                                      child: ElevatedButton(
                                        onPressed: () => _toggleRoutine(index),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: isDone ? Colors.green : Colors.grey.shade200,
                                          foregroundColor: isDone ? Colors.white : Colors.black,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                        ),
                                        child: Icon(
                                          isDone ? Icons.check : Icons.circle_outlined,
                                          size: 36,
                                          color: isDone ? Colors.white : Colors.blueGrey,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 24),
                                    // Time and Details
                                    Expanded(
                                      child: GestureDetector(
                                        onTap: () => _speakText("${routine['title']} scheduled at ${routine['time_of_day']}. Description: ${routine['description']}"),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              "[${routine['time_of_day']}]  ${routine['title']}",
                                              style: TextStyle(
                                                fontSize: 22,
                                                fontWeight: FontWeight.bold,
                                                decoration: isDone ? TextDecoration.lineThrough : null,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              routine['description'],
                                              style: TextStyle(
                                                fontSize: 16,
                                                color: Colors.grey.shade600,
                                                decoration: isDone ? TextDecoration.lineThrough : null,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    // Play instruction button
                                    IconButton(
                                      icon: const Icon(Icons.volume_up, size: 36, color: MindnerTheme.primaryBlue),
                                      onPressed: () => _speakText(routine['title'] + ". " + routine['description']),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
