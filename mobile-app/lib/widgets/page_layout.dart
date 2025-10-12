import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

class PageLayout extends StatelessWidget {
  final Widget child;
  final String title;
  final String subtitle;
  final List<Widget>? headerTabs;
  final double headerHeight;

  const PageLayout({
    Key? key,
    required this.child,
    this.title = '',
    this.subtitle = '',
    this.headerTabs,
    this.headerHeight = 220,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Enhanced header gradient with wave pattern
            Container(
              width: double.infinity,
              height: headerHeight,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7F00FF), Color(0xFFE100FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: SafeArea(
                child: Stack(
                  children: [
                    // Decorative circles in background
                    Positioned(
                      right: -50,
                      top: -30,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      left: -60,
                      bottom: -40,
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    // Content
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 8),
                          SvgPicture.asset('assets/logo.svg', 
                            width: 64, 
                            height: 64, 
                            color: Colors.white,
                          ),
                          const SizedBox(height: 14),
                          if (title.isNotEmpty)
                            Text(
                              title, 
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                color: Colors.white, 
                                fontSize: 24, 
                                fontWeight: FontWeight.bold,
                                shadows: [
                                  Shadow(
                                    color: Colors.black.withOpacity(0.3),
                                    blurRadius: 2,
                                    offset: const Offset(0, 1),
                                  ),
                                ],
                              )
                            ),
                          if (subtitle.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: Text(
                                subtitle, 
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                  color: Colors.white.withOpacity(0.9), 
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                          if (headerTabs != null) ...[
                            const SizedBox(height: 16),
                            Row(mainAxisAlignment: MainAxisAlignment.center, children: headerTabs!),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Enhanced themed rounded content container
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark 
                  ? const Color(0xFF1A1A1A)
                  : Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                border: Theme.of(context).brightness == Brightness.dark 
                  ? Border.all(color: const Color(0xFF333333).withOpacity(0.3), width: 1)
                  : null,
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? Colors.black.withOpacity(0.3)
                      : Colors.black.withOpacity(0.05),
                    blurRadius: Theme.of(context).brightness == Brightness.dark ? 15 : 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: child,
            ),
          ],
        ),
      ),
    );
  }
}
