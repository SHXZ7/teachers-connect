import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';

// Simple script to create app icon PNG from our design
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  final size = 1024.0; // High resolution
  
  // Create the app icon design
  await drawAppIcon(canvas, size);
  
  final picture = recorder.endRecording();
  final image = await picture.toImage(size.toInt(), size.toInt());
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  
  final file = File('assets/app_icon.png');
  await file.writeAsBytes(byteData!.buffer.asUint8List());
  
  print('App icon PNG created successfully!');
}

Future<void> drawAppIcon(Canvas canvas, double size) async {
  final center = Offset(size / 2, size / 2);
  final radius = size * 0.45;
  
  // Background gradient
  final bgPaint = Paint()
    ..shader = RadialGradient(
      colors: [
        Color(0xFFFF6B35),
        Color(0xFFE55A2B),
      ],
    ).createShader(Rect.fromCircle(center: center, radius: radius));
  
  // Draw background circle
  canvas.drawCircle(center, radius, bgPaint);
  
  // Draw book
  final bookPaint = Paint()
    ..color = Colors.white
    ..style = PaintingStyle.fill;
  
  // Left book cover
  final leftBook = RRect.fromRectAndRadius(
    Rect.fromCenter(center: center.translate(-size * 0.1, 0), width: size * 0.15, height: size * 0.2),
    Radius.circular(size * 0.01),
  );
  canvas.drawRRect(leftBook, bookPaint);
  
  // Right book cover
  final rightBook = RRect.fromRectAndRadius(
    Rect.fromCenter(center: center.translate(size * 0.1, 0), width: size * 0.15, height: size * 0.2),
    Radius.circular(size * 0.01),
  );
  canvas.drawRRect(rightBook, bookPaint);
  
  // Book spine
  final spinePaint = Paint()
    ..color = Color(0xFFFF8A65);
  
  final spine = Rect.fromCenter(
    center: center,
    width: size * 0.04,
    height: size * 0.2,
  );
  canvas.drawRect(spine, spinePaint);
  
  // Nova star
  final starPaint = Paint()
    ..color = Color(0xFFFFD700)
    ..style = PaintingStyle.fill;
  
  final starCenter = center.translate(size * 0.15, -size * 0.15);
  canvas.drawCircle(starCenter, size * 0.03, starPaint);
}