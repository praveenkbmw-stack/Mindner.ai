import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import '../../constants/theme.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _isListening = false;
  String _spokenText = "Press the microphone button and start speaking...";
  String _assistantReply = "I am listening. How can I help you today?";
  String _permissionStatusText = "";

  @override
  void initState() {
    super.initState();
    _speakText(_assistantReply);
  }

  @override
  void dispose() {
    _speech.stop();
    _tts.stop();
    super.dispose();
  }

  void _speakText(String text) async {
    await _tts.stop();
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.38); // slow pace for comfortable listening
    await _tts.speak(text);
  }

  void _toggleListening() async {
    if (!_isListening) {
      bool available = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done') {
            setState(() => _isListening = false);
          }
        },
        onError: (errorNotification) {
          setState(() {
            _isListening = false;
            _permissionStatusText = "Microphone error: ${errorNotification.errorMsg}";
          });
        },
      );

      if (available) {
        setState(() {
          _isListening = true;
          _permissionStatusText = "";
          _spokenText = "Listening...";
        });
        _speech.listen(
          onResult: (result) {
            setState(() {
              _spokenText = result.recognizedWords;
              if (result.finalResult) {
                _isListening = false;
                _processCommand(result.recognizedWords);
              }
            });
          },
        );
      } else {
        setState(() {
          _permissionStatusText = "Microphone permission denied or not available.";
        });
      }
    } else {
      _stopListening();
    }
  }

  void _stopListening() {
    setState(() {
      _isListening = false;
      _spokenText = "Listening stopped.";
    });
    _speech.stop();
  }

  void _processCommand(String query) {
    if (query.trim().isEmpty) return;
    
    final lower = query.toLowerCase();
    String response = "";

    if (lower.contains("schedule") || lower.contains("routine") || lower.contains("today")) {
      response = "You have a family call at 6 PM today.";
    } else if (lower.contains("memory") || lower.contains("photo") || lower.contains("past")) {
      response = "Opening your personal timeline photo memory book.";
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pushReplacementNamed(context, '/timeline');
      });
    } else if (lower.contains("hello") || lower.contains("hi")) {
      response = "Hello! I am right here with you. What would you like to do?";
    } else {
      response = "I hear you. We can play games or look at family photos.";
    }

    setState(() {
      _assistantReply = response;
    });
    _speakText(response);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Voice Companion"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 16),
              if (_permissionStatusText.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    _permissionStatusText,
                    style: const TextStyle(fontSize: 16, color: Colors.red, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              
              // Pulsing circle assistant UI
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: _isListening ? Colors.red.shade100 : MindnerTheme.primaryBlue.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            _isListening ? Icons.hearing : Icons.face,
                            size: 72,
                            color: _isListening ? Colors.red : MindnerTheme.primaryBlue,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Spoken Transcript (What user said)
                      Text(
                        "You said:",
                        style: TextStyle(fontSize: 16, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "\"$_spokenText\"",
                        style: const TextStyle(fontSize: 22, fontStyle: FontStyle.italic, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      
                      // Assistant Reply (What AI responded)
                      Text(
                        "Assistant:",
                        style: TextStyle(fontSize: 16, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _assistantReply,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: MindnerTheme.primaryBlue),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),

              // Mic Controls
              Column(
                children: [
                  if (_isListening)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton(
                          onPressed: _stopListening,
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade300, foregroundColor: Colors.black87),
                          child: const Text("Stop Listening"),
                        ),
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    height: 80,
                    child: ElevatedButton(
                      onPressed: _toggleListening,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isListening ? Colors.red : MindnerTheme.primaryBlue,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(_isListening ? Icons.mic_none_outlined : Icons.mic_none, size: 36),
                          const SizedBox(width: 12),
                          Text(
                            _isListening ? "Listening..." : "🎙️ SPEAK",
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
