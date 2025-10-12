import 'package:flutter/material.dart';
import 'dart:math' as math;

class AppIconWidget extends StatelessWidget {
  final double size;
  
  const AppIconWidget({Key? key, this.size = 192}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            Color(0xFFFF6B35),
            Color(0xFFE55A2B),
          ],
          stops: [0.0, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            offset: Offset(2, 4),
            blurRadius: 8,
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background rays
          for (int i = 0; i < 12; i++)
            Transform.rotate(
              angle: (i * math.pi * 2) / 12,
              child: Container(
                width: 2,
                height: size * 0.15,
                margin: EdgeInsets.only(bottom: size * 0.4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          
          // Main book icon
          Container(
            width: size * 0.35,
            height: size * 0.25,
            child: Stack(
              children: [
                // Left book cover
                Positioned(
                  left: 0,
                  child: Container(
                    width: size * 0.15,
                    height: size * 0.25,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(size * 0.01),
                      border: Border.all(
                        color: Color(0xFFDEE2E6),
                        width: 0.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          offset: Offset(1, 2),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(height: size * 0.03),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                        SizedBox(height: size * 0.01),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                        SizedBox(height: size * 0.01),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          width: size * 0.08,
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Book spine
                Positioned(
                  left: size * 0.15,
                  child: Container(
                    width: size * 0.05,
                    height: size * 0.25,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF8A65), Color(0xFFFF6B35)],
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Container(height: 0.5, color: Color(0xFFFF8A65)),
                        Container(height: 0.5, color: Color(0xFFFF8A65)),
                        Container(height: 0.5, color: Color(0xFFFF8A65)),
                        Container(height: 0.5, color: Color(0xFFFF8A65)),
                      ],
                    ),
                  ),
                ),
                
                // Right book cover
                Positioned(
                  right: 0,
                  child: Container(
                    width: size * 0.15,
                    height: size * 0.25,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(size * 0.01),
                      border: Border.all(
                        color: Color(0xFFDEE2E6),
                        width: 0.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          offset: Offset(1, 2),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(height: size * 0.03),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                        SizedBox(height: size * 0.01),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                        SizedBox(height: size * 0.01),
                        Container(
                          margin: EdgeInsets.symmetric(horizontal: size * 0.01),
                          width: size * 0.1,
                          height: 1,
                          color: Color(0xFF6C757D).withOpacity(0.6),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Nova star
          Positioned(
            top: size * 0.2,
            right: size * 0.25,
            child: Container(
              width: size * 0.08,
              height: size * 0.08,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0xFFFFD700),
                    Color(0xFFFF8C00),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFFFFD700).withOpacity(0.3),
                    blurRadius: size * 0.02,
                    spreadRadius: size * 0.005,
                  ),
                ],
              ),
              child: Icon(
                Icons.star,
                color: Colors.white,
                size: size * 0.04,
              ),
            ),
          ),
          
          // Knowledge rays from book
          for (int i = 0; i < 5; i++)
            Transform.rotate(
              angle: (i * math.pi * 0.5) / 4 - math.pi * 0.25,
              child: Container(
                width: 1.5,
                height: size * 0.1,
                margin: EdgeInsets.only(bottom: size * 0.25),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          
          // Subtle "E" branding
          Positioned(
            bottom: size * 0.15,
            child: Text(
              'E',
              style: TextStyle(
                color: Colors.white.withOpacity(0.3),
                fontSize: size * 0.08,
                fontWeight: FontWeight.bold,
                fontFamily: 'Inter',
              ),
            ),
          ),
        ],
      ),
    );
  }
}