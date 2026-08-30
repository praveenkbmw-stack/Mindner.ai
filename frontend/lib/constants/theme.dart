import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MindnerTheme {
  // Calming Warm Pastel Color Palette
  static const Color primaryBlue = Color(0xFF4A90E2);
  static const Color accentGreen = Color(0xFF66BB6A);
  static const Color backgroundCream = Color(0xFFF7F9FB);
  static const Color textDark = Color(0xFF2C3E50);
  static const Color cardShadowColor = Color(0x1F000000);
  
  // Accessibility Design System standards
  static const double minTouchTarget = 64.0;
  static const double baseFontSize = 22.0;
  static const double titleFontSize = 32.0;

  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: primaryBlue,
      scaffoldBackgroundColor: backgroundCream,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        secondary: accentGreen,
        background: backgroundCream,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onBackground: textDark,
      ),
      textTheme: TextTheme(
        headlineMedium: GoogleFonts.outfit(
          fontSize: titleFontSize,
          fontWeight: FontWeight.bold,
          color: textDark,
        ),
        bodyLarge: GoogleFonts.outfit(
          fontSize: baseFontSize,
          color: textDark,
          height: 1.5,
        ),
        labelLarge: GoogleFonts.outfit(
          fontSize: baseFontSize,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 4.0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24.0),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          minimumSize: const Size(minTouchTarget, minTouchTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20.0),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          textStyle: GoogleFonts.outfit(
            fontSize: baseFontSize,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
