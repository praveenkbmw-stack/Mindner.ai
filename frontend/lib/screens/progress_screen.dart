import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../constants/theme.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Performance Progress"),
        backgroundColor: MindnerTheme.primaryBlue,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: "Categories"),
            Tab(text: "Weekly Trends"),
            Tab(text: "Monthly Trends"),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildCategoriesTab(),
            _buildWeeklyTab(),
            _buildMonthlyTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoriesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Cognitive Activity & Engagement", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text(
            "Tracking scores based solely on game performance metrics.",
            style: TextStyle(fontSize: 15, color: Colors.grey, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 32),
          
          _buildProgressBar("Memory", 0.8),
          const SizedBox(height: 20),
          _buildProgressBar("Attention", 0.7),
          const SizedBox(height: 20),
          _buildProgressBar("Pattern Recognition", 0.9),
          const SizedBox(height: 20),
          _buildProgressBar("Reaction", 0.6),
          
          const SizedBox(height: 40),
          Card(
            color: MindnerTheme.primaryBlue.withOpacity(0.05),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Text(
                "Notice: These metrics reflect cognitive gaming engagement levels to support mental activities, and are not medical diagnostics.",
                style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: Colors.blueGrey, fontWeight: FontWeight.w600),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProgressBar(String label, double value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text("${(value * 100).toInt()}%", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: value,
            minHeight: 18,
            backgroundColor: Colors.grey.shade200,
            valueColor: const AlwaysStoppedAnimation<Color>(MindnerTheme.primaryBlue),
          ),
        )
      ],
    );
  }

  Widget _buildWeeklyTab() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Weekly Accuracy Progression", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22)),
                ),
                borderData: FlBorderData(show: true, border: Border.all(color: Colors.grey.shade300)),
                minX: 0, maxX: 4,
                minY: 0, maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: const [
                      FlSpot(0, 60), FlSpot(1, 65), FlSpot(2, 75),
                      FlSpot(3, 70), FlSpot(4, 85),
                    ],
                    isCurved: true,
                    color: MindnerTheme.accentGreen,
                    barWidth: 5,
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildMonthlyTab() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Monthly Cognitive Activity Accuracy", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Expanded(
            child: BarChart(
              BarChartData(
                maxY: 100,
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36)),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 22)),
                ),
                borderData: FlBorderData(show: false),
                barGroups: [
                  BarChartGroupData(x: 0, barRods: [BarChartRodData(toY: 65, color: MindnerTheme.primaryBlue, width: 22)]),
                  BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 78, color: MindnerTheme.primaryBlue, width: 22)]),
                  BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 82, color: MindnerTheme.primaryBlue, width: 22)]),
                  BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 89, color: MindnerTheme.primaryBlue, width: 22)]),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
