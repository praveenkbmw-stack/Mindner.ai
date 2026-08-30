import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants/theme.dart';
import 'screens/home_screen.dart';
import 'screens/games_screen.dart';
import 'screens/memories_timeline_screen.dart';
import 'screens/routine_screen.dart';
import 'screens/assistant_screen.dart';
import 'screens/family_voices_screen.dart';
import 'screens/progress_screen.dart';
import 'screens/caregiver/login_screen.dart';
import 'screens/caregiver/register_screen.dart';
import 'screens/caregiver_dashboard_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
      ],
      child: const MindnerApp(),
    ),
  );
}

class MindnerApp extends StatelessWidget {
  const MindnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MINDNER',
      theme: MindnerTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const HomeScreen(),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/games': (context) => const GamesScreen(),
        '/timeline': (context) => const MemoriesTimelineScreen(),
        '/routine': (context) => const RoutineScreen(),
        '/assistant': (context) => const AssistantScreen(),
        '/family-voices': (context) => const FamilyVoicesScreen(),
        '/progress': (context) => const ProgressScreen(),
        '/caregiver-login': (context) => const CaregiverLoginScreen(),
        '/caregiver-register': (context) => const CaregiverRegisterScreen(),
        '/caregiver-dashboard': (context) => const CaregiverDashboardScreen(),
      },
    );
  }
}
