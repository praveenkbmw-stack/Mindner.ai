import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'dart:io';
import '../../constants/theme.dart';
import '../../services/api_service.dart';

class MemoriesTimelineScreen extends StatefulWidget {
  const MemoriesTimelineScreen({super.key});

  @override
  State<MemoriesTimelineScreen> createState() => _MemoriesTimelineScreenState();
}

class _MemoriesTimelineScreenState extends State<MemoriesTimelineScreen> {
  final FlutterTts _tts = FlutterTts();
  List<Map<String, dynamic>> _memories = [];
  bool _isLoading = true;
  bool _isRecordingVoice = false;

  // New Memory Form controller keys
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _yearController = TextEditingController();
  final _peopleController = TextEditingController();
  
  String? _recordedAudioPath; // simulated file path for local recordings

  @override
  void initState() {
    super.initState();
    _loadMemories();
  }

  void _loadMemories() async {
    final api = Provider.of<ApiService>(context, listen: false);
    final data = await api.fetchTimeline();
    setState(() {
      _memories = data;
      _isLoading = false;
    });
    _speakText("Welcome to your Memory Journey timeline.");
  }

  void _speakText(String text) async {
    await _tts.stop();
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.4);
    await _tts.speak(text);
  }

  void _playRecordedVoice(String? audioPath) {
    if (audioPath == null) {
      _speakText("There is no recorded personal voice for this memory.");
      return;
    }
    // In a real device setup, we'd use audioplayers. Here we trigger fallback TTS reading to simulate playback.
    _speakText("Playing your personal recorded memory voice message: " + audioPath);
  }

  void _openLockMemoryDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text("🔒 LOCK YOUR MEMORY", style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                "Record your own voice describing this special memory.",
                style: TextStyle(fontSize: 18),
              ),
              const SizedBox(height: 24),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _isRecordingVoice ? Colors.red.shade50 : Colors.grey.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isRecordingVoice ? Icons.mic : Icons.mic_none,
                  size: 64,
                  color: _isRecordingVoice ? Colors.red : MindnerTheme.primaryBlue,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _isRecordingVoice ? "Listening... Speak now" : "Ready to record",
                style: const TextStyle(fontWeight: FontWeight.bold),
              )
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                setDialogState(() => _isRecordingVoice = false);
                Navigator.pop(context);
              },
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                if (!_isRecordingVoice) {
                  setDialogState(() => _isRecordingVoice = true);
                  // Start simulated recorder
                } else {
                  setDialogState(() {
                    _isRecordingVoice = false;
                    _recordedAudioPath = "user_memory_recording_01.wav";
                  });
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Voice recording locked to memory successfully!")),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _isRecordingVoice ? Colors.red : MindnerTheme.primaryBlue,
              ),
              child: Text(_isRecordingVoice ? "Lock Recording" : "Start Recording"),
            )
          ],
        ),
      ),
    );
  }

  void _handleSaveMemory() {
    if (_titleController.text.isEmpty || _descController.text.isEmpty) return;

    final newMem = {
      "id": DateTime.now().millisecondsSinceEpoch,
      "title": _titleController.text,
      "description": _descController.text,
      "year_tag": int.tryParse(_yearController.text) ?? DateTime.now().year,
      "relationship_tag": _peopleController.text.isEmpty ? "Family" : _peopleController.text,
      "audio_note_path": _recordedAudioPath, // Attached recorded voice path
      "image_path": null
    };

    setState(() {
      _memories.add(newMem);
      // Reset form
      _titleController.clear();
      _descController.clear();
      _yearController.clear();
      _peopleController.clear();
      _recordedAudioPath = null;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Memory successfully locked and added!")),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Memory Timeline"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Row(
                children: [
                  // Left side Form Panel (For additions/locks)
                  Expanded(
                    flex: 4,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Upload a New Memory", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          
                          // File selector mock
                          ElevatedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.photo_camera_back),
                            label: const Text("📷 UPLOAD IMAGE"),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey, minimumSize: const Size(double.infinity, 54)),
                          ),
                          const SizedBox(height: 16),
                          
                          TextField(controller: _titleController, decoration: const InputDecoration(labelText: "Memory Title", border: OutlineInputBorder())),
                          const SizedBox(height: 12),
                          TextField(controller: _descController, maxLines: 2, decoration: const InputDecoration(labelText: "Memory Description", border: OutlineInputBorder())),
                          const SizedBox(height: 12),
                          TextField(controller: _yearController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Date/Year", border: OutlineInputBorder())),
                          const SizedBox(height: 12),
                          TextField(controller: _peopleController, decoration: const InputDecoration(labelText: "People in the Memory", border: OutlineInputBorder())),
                          const SizedBox(height: 20),
                          
                          ElevatedButton.icon(
                            onPressed: _openLockMemoryDialog,
                            icon: const Icon(Icons.lock),
                            label: const Text("🔒 LOCK YOUR MEMORY"),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700, minimumSize: const Size(double.infinity, 60)),
                          ),
                          const SizedBox(height: 16),
                          
                          ElevatedButton(
                            onPressed: _handleSaveMemory,
                            style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 60)),
                            child: const Text("Save Memory Entry"),
                          )
                        ],
                      ),
                    ),
                  ),
                  
                  // Vertical divider
                  const VerticalDivider(width: 1),

                  // Right side Timeline scroll
                  Expanded(
                    flex: 6,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: ListView.builder(
                        itemCount: _memories.length,
                        itemBuilder: (context, index) {
                          final mem = _memories[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 20),
                            child: Padding(
                              padding: const EdgeInsets.all(18.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        "${mem['year_tag']} — ${mem['title']}",
                                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_forever, color: Colors.red),
                                        onPressed: () {
                                          setState(() => _memories.removeAt(index));
                                        },
                                      )
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text("People: " + (mem['relationship_tag'] ?? "Family"), style: const TextStyle(fontSize: 16, fontStyle: FontStyle.italic)),
                                  const SizedBox(height: 8),
                                  Text(mem['description'] ?? "", style: const TextStyle(fontSize: 18)),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      // AI Reader
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () => _speakText(mem['description']),
                                          icon: const Icon(Icons.volume_up),
                                          label: const Text("Read Description"),
                                          style: ElevatedButton.styleFrom(backgroundColor: MindnerTheme.accentGreen, minimumSize: const Size(0, 54)),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      // Recorded Voice Playback
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () => _playRecordedVoice(mem['audio_note_path']),
                                          icon: const Icon(Icons.play_arrow),
                                          label: const Text("Play My Voice"),
                                          style: ElevatedButton.styleFrom(backgroundColor: MindnerTheme.primaryBlue, minimumSize: const Size(0, 54)),
                                        ),
                                      )
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  const Align(
                                    alignment: Alignment.centerRight,
                                    child: Text("🔒 Memory Locked", style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  )
                ],
              ),
            ),
    );
  }
}
