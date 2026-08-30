import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../../constants/theme.dart';

class FamilyVoicesScreen extends StatefulWidget {
  const FamilyVoicesScreen({super.key});

  @override
  State<FamilyVoicesScreen> createState() => _FamilyVoicesScreenState();
}

class _FamilyVoicesScreenState extends State<FamilyVoicesScreen> {
  final FlutterTts _tts = FlutterTts();
  bool _isRecording = false;

  // New family member details controllers
  final _nameController = TextEditingController();
  final _relationController = TextEditingController();

  // Stored family voices list
  final List<Map<String, dynamic>> _familyMembers = [
    {
      "name": "Arun",
      "relationship": "Son",
      "audio_path": "Hi Mom, this is Arun. I hope you are doing well. I will call you this evening.",
      "emoji": "🧑‍🦱"
    },
    {
      "name": "Priya",
      "relationship": "Daughter",
      "audio_path": "Hello Mom, it's Priya. I love you so much. Have a beautiful day today!",
      "emoji": "👩"
    },
    {
      "name": "Kumar",
      "relationship": "Brother",
      "audio_path": "Hey sister, Kumar here. Thinking of you today. Hope the weather is nice there.",
      "emoji": "👨"
    }
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _relationController.dispose();
    _tts.stop();
    super.dispose();
  }

  void _speakText(String text) async {
    await _tts.stop();
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.38);
    await _tts.speak(text);
  }

  void _addFamilyMember() {
    if (_nameController.text.isEmpty || _relationController.text.isEmpty) return;

    setState(() {
      _familyMembers.add({
        "name": _nameController.text,
        "relationship": _relationController.text,
        "audio_path": "Hi, this is ${_nameController.text} speaking! I'm thinking of you.",
        "emoji": "💖"
      });
      _nameController.clear();
      _relationController.clear();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Family voice record added successfully!")),
    );
  }

  void _openVoiceRecordDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text("🎙️ Record Family Voice"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Record a short greeting message for your loved one.", style: TextStyle(fontSize: 18)),
              const SizedBox(height: 24),
              Icon(
                _isRecording ? Icons.mic : Icons.mic_none,
                size: 64,
                color: _isRecording ? Colors.red : MindnerTheme.primaryBlue,
              ),
              const SizedBox(height: 12),
              Text(_isRecording ? "Recording..." : "Tap below to start")
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ElevatedButton(
              onPressed: () {
                if (!_isRecording) {
                  setDialogState(() => _isRecording = true);
                } else {
                  setDialogState(() => _isRecording = false);
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Audio recorded successfully.")),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: _isRecording ? Colors.red : MindnerTheme.primaryBlue),
              child: Text(_isRecording ? "Stop & Save" : "Start Recording"),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Family Voices"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Row(
          children: [
            // Left adding Form Panel
            Expanded(
              flex: 4,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("➕ ADD FAMILY VOICE", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.portrait),
                      label: const Text("📷 Upload Person's Image"),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey, minimumSize: const Size(double.infinity, 54)),
                    ),
                    const SizedBox(height: 20),
                    TextField(controller: _nameController, decoration: const InputDecoration(labelText: "Person Name", border: OutlineInputBorder())),
                    const SizedBox(height: 16),
                    TextField(controller: _relationController, decoration: const InputDecoration(labelText: "Relationship", border: OutlineInputBorder())),
                    const SizedBox(height: 24),
                    
                    ElevatedButton.icon(
                      onPressed: _openVoiceRecordDialog,
                      icon: const Icon(Icons.mic),
                      label: const Text("🎙️ Record Voice"),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700, minimumSize: const Size(double.infinity, 60)),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 60,
                      child: ElevatedButton(
                        onPressed: _addFamilyMember,
                        child: const Text("💾 SAVE VOICE"),
                      ),
                    )
                  ],
                ),
              ),
            ),
            
            const VerticalDivider(width: 1),

            // Right scroll list
            Expanded(
              flex: 6,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Listen to Family Greetings", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _familyMembers.length,
                        itemBuilder: (context, index) {
                          final member = _familyMembers[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 20),
                            child: Padding(
                              padding: const EdgeInsets.all(18.0),
                              child: Row(
                                children: [
                                  // Person avatar image mock
                                  Container(
                                    width: 80,
                                    height: 80,
                                    decoration: BoxDecoration(
                                      color: MindnerTheme.primaryBlue.withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Text(member['emoji'], style: const TextStyle(fontSize: 40)),
                                    ),
                                  ),
                                  const SizedBox(width: 20),
                                  
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(member['name'], style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 4),
                                        Text(member['relationship'], style: const TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            ElevatedButton.icon(
                                              onPressed: () => _speakText(member['audio_path']),
                                              icon: const Icon(Icons.play_arrow),
                                              label: const Text("Play Voice"),
                                              style: ElevatedButton.styleFrom(backgroundColor: MindnerTheme.accentGreen),
                                            ),
                                            const SizedBox(width: 10),
                                            IconButton(
                                              icon: const Icon(Icons.stop, color: Colors.red, size: 28),
                                              onPressed: () => _tts.stop(),
                                            )
                                          ],
                                        )
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
