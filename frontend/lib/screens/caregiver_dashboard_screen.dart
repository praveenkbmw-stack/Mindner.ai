import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../constants/theme.dart';

class CaregiverDashboardScreen extends StatefulWidget {
  const CaregiverDashboardScreen({super.key});

  @override
  State<CaregiverDashboardScreen> createState() => _CaregiverDashboardScreenState();
}

class _CaregiverDashboardScreenState extends State<CaregiverDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // New Memory upload inputs
  final _titleController = TextEditingController();
  final _yearController = TextEditingController();
  final _relationshipController = TextEditingController();
  final _descriptionController = TextEditingController();

  // New Routine inputs
  final _routineTitleController = TextEditingController();
  final _routineTimeController = TextEditingController();
  final _routineDescController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _yearController.dispose();
    _relationshipController.dispose();
    _descriptionController.dispose();
    _routineTitleController.dispose();
    _routineTimeController.dispose();
    _routineDescController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _saveMemory() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Memory Journey entry added successfully!")),
    );
    _titleController.clear();
    _yearController.clear();
    _relationshipController.clear();
    _descriptionController.clear();
  }

  void _saveRoutine() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Daily routine schedule updated!")),
    );
    _routineTitleController.clear();
    _routineTimeController.clear();
    _routineDescController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Caregiver Management Console"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(icon: Icon(Icons.analytics_outlined), text: "Analytics"),
            Tab(icon: Icon(Icons.photo_album_outlined), text: "Add Memory"),
            Tab(icon: Icon(Icons.schedule_outlined), text: "Update Routine"),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildAnalyticsTab(),
            _buildAddMemoryTab(),
            _buildUpdateRoutineTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Cognitive Activity & Engagement Tracker", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text(
            "Supportive Activity Trends (Non-Diagnostic Reports)",
            style: TextStyle(fontSize: 14, color: Colors.red, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
          ),
          const SizedBox(height: 32),
          
          // Accuracy Trend Chart Card
          const Text("Game Match Accuracy (Last 7 Days)", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            height: 240,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 32)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22)),
                ),
                borderData: FlBorderData(show: true, border: Border.all(color: Colors.grey.shade300)),
                minX: 0, maxX: 6,
                minY: 0, maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 50), FlSpot(1, 60), FlSpot(2, 55),
                      FlSpot(3, 75), FlSpot(4, 70), FlSpot(5, 85), FlSpot(6, 90),
                    ],
                    isCurved: true,
                    color: MindnerTheme.primaryBlue,
                    barWidth: 4,
                  )
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Completion compliance Summary card
          Card(
            color: MindnerTheme.accentGreen.withOpacity(0.1),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline, size: 48, color: MindnerTheme.accentGreen),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text("Routine Compliance Rate: 92.5%", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        SizedBox(height: 4),
                        Text("Elderly user has completed 25 of 27 scheduled routines this week.", style: TextStyle(fontSize: 15)),
                      ],
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildAddMemoryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Upload to Memories Timeline", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          TextField(controller: _titleController, decoration: const InputDecoration(labelText: "Memory Title", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: _yearController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Year (e.g. 1978)", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: _relationshipController, decoration: const InputDecoration(labelText: "Relationship Tag (e.g. Spouse, Son)", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: _descriptionController, maxLines: 3, decoration: const InputDecoration(labelText: "Short Memory Description", border: OutlineInputBorder())),
          const SizedBox(height: 24),
          
          // Image / Audio placeholders
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.image),
                  label: const Text("Select Photo"),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.mic),
                  label: const Text("Record Audio"),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: _saveMemory,
              child: const Text("Add to Timeline Memory Book"),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpdateRoutineTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Add Reminder / Scheduled task", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          TextField(controller: _routineTitleController, decoration: const InputDecoration(labelText: "Task / Event Title", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: _routineTimeController, decoration: const InputDecoration(labelText: "Scheduled Time (e.g. 08:30)", border: OutlineInputBorder())),
          const SizedBox(height: 16),
          TextField(controller: _routineDescController, maxLines: 3, decoration: const InputDecoration(labelText: "Task Instructions", border: OutlineInputBorder())),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: _saveRoutine,
              child: const Text("Update Routine Schedule"),
            ),
          ),
        ],
      ),
    );
  }
}
