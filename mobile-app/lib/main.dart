import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'widgets/page_layout.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await Hive.openBox('appBox');
  runApp(const MyApp());
}

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  final Box _box = Hive.box('appBox');

  ThemeProvider() {
    _isDarkMode = _box.get('isDarkMode', defaultValue: false);
  }

  bool get isDarkMode => _isDarkMode;

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    _box.put('isDarkMode', _isDarkMode);
    notifyListeners();
  }

  ThemeData get lightTheme => ThemeData(
    primarySwatch: Colors.deepPurple,
    primaryColor: const Color(0xFF7C3AED),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF7C3AED),
      secondary: Color(0xFF059669),
      tertiary: Color(0xFFF59E0B),
      surface: Color(0xFFFFFFFF),
      background: Color(0xFFF8FAFC),
      onPrimary: Color(0xFFFFFFFF),
      onSecondary: Color(0xFFFFFFFF),
      onSurface: Color(0xFF1F2937),
      onBackground: Color(0xFF1F2937),
    ),
    textTheme: GoogleFonts.interTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold, fontSize: 32),
        displayMedium: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold, fontSize: 28),
        displaySmall: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold, fontSize: 24),
        headlineLarge: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.bold, fontSize: 22),
        headlineMedium: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.w600, fontSize: 20),
        headlineSmall: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.w600, fontSize: 18),
        titleLarge: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.w600, fontSize: 16),
        titleMedium: TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.w500, fontSize: 14),
        titleSmall: TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.w500, fontSize: 12),
        bodyLarge: TextStyle(color: Color(0xFF374151), fontSize: 16, height: 1.6),
        bodyMedium: TextStyle(color: Color(0xFF6B7280), fontSize: 14, height: 1.5),
        bodySmall: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, height: 1.4),
        labelLarge: TextStyle(color: Color(0xFF1F2937), fontWeight: FontWeight.w600, fontSize: 14),
        labelMedium: TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.w500, fontSize: 12),
        labelSmall: TextStyle(color: Color(0xFF6B7280), fontWeight: FontWeight.w400, fontSize: 11),
      ),
    ),
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    brightness: Brightness.light,
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF7C3AED),
      foregroundColor: Color(0xFFFFFFFF),
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: Color(0xFFFFFFFF),
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
      iconTheme: IconThemeData(color: Color(0xFFFFFFFF)),
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFFFFFFFF),
      elevation: 4,
      shadowColor: const Color(0xFF7C3AED).withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF7C3AED),
        foregroundColor: const Color(0xFFFFFFFF),
        elevation: 2,
        shadowColor: const Color(0xFF7C3AED).withOpacity(0.3),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.5,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF7C3AED),
        side: const BorderSide(color: Color(0xFF7C3AED), width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.5,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
      labelStyle: const TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.w500),
      floatingLabelStyle: const TextStyle(color: Color(0xFF7C3AED), fontWeight: FontWeight.w600),
      prefixIconColor: const Color(0xFF7C3AED),
      suffixIconColor: const Color(0xFF7C3AED),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB), width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
  );

  ThemeData get darkTheme => ThemeData(
    primarySwatch: Colors.deepPurple,
    primaryColor: const Color(0xFF8B5CF6),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF8B5CF6),
      secondary: Color(0xFF10B981),
      tertiary: Color(0xFFFFA726),
      surface: Color(0xFF1F2937),
      background: Color(0xFF111827),
      onPrimary: Color(0xFFFFFFFF),
      onSecondary: Color(0xFFFFFFFF),
      onSurface: Color(0xFFF9FAFB),
      onBackground: Color(0xFFF9FAFB),
    ),
    textTheme: GoogleFonts.interTextTheme(
      const TextTheme(
        displayLarge: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.bold, fontSize: 32),
        displayMedium: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.bold, fontSize: 28),
        displaySmall: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.bold, fontSize: 24),
        headlineLarge: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.bold, fontSize: 22),
        headlineMedium: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 20),
        headlineSmall: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 18),
        titleLarge: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 16),
        titleMedium: TextStyle(color: Color(0xFFE5E7EB), fontWeight: FontWeight.w500, fontSize: 14),
        titleSmall: TextStyle(color: Color(0xFFE5E7EB), fontWeight: FontWeight.w500, fontSize: 12),
        bodyLarge: TextStyle(color: Color(0xFFD1D5DB), fontSize: 16, height: 1.6),
        bodyMedium: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14, height: 1.5),
        bodySmall: TextStyle(color: Color(0xFF6B7280), fontSize: 12, height: 1.4),
        labelLarge: TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w600, fontSize: 14),
        labelMedium: TextStyle(color: Color(0xFFE5E7EB), fontWeight: FontWeight.w500, fontSize: 12),
        labelSmall: TextStyle(color: Color(0xFF9CA3AF), fontWeight: FontWeight.w400, fontSize: 11),
      ),
    ),
    scaffoldBackgroundColor: const Color(0xFF111827),
    brightness: Brightness.dark,
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1F2937),
      foregroundColor: Color(0xFFF9FAFB),
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: Color(0xFFF9FAFB),
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
      iconTheme: IconThemeData(color: Color(0xFFF9FAFB)),
    ),
    drawerTheme: const DrawerThemeData(
      backgroundColor: Color(0xFF1F2937),
      surfaceTintColor: Color(0xFF374151),
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF1F2937),
      elevation: 8,
      shadowColor: const Color(0xFF8B5CF6).withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: const Color(0xFF374151).withOpacity(0.5)),
      ),
    ),
    listTileTheme: const ListTileThemeData(
      textColor: Color(0xFFF9FAFB),
      iconColor: Color(0xFF8B5CF6),
      titleTextStyle: TextStyle(
        color: Color(0xFFF9FAFB),
        fontWeight: FontWeight.w500,
        fontSize: 16,
        letterSpacing: 0.3,
      ),
      subtitleTextStyle: TextStyle(
        color: Color(0xFF9CA3AF),
        fontSize: 14,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: const TextStyle(color: Color(0xFF6B7280), fontSize: 14),
      labelStyle: const TextStyle(color: Color(0xFFF9FAFB), fontWeight: FontWeight.w500),
      floatingLabelStyle: const TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.w600),
      prefixIconColor: const Color(0xFF8B5CF6),
      suffixIconColor: const Color(0xFF8B5CF6),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF374151), width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF374151), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: Color(0xFF8B5CF6),
      selectionColor: Color(0xFF8B5CF6),
      selectionHandleColor: Color(0xFF8B5CF6),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF8B5CF6),
        foregroundColor: const Color(0xFFFFFFFF),
        elevation: 3,
        shadowColor: const Color(0xFF8B5CF6).withOpacity(0.3),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.5,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF8B5CF6),
        side: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.5,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: const Color(0xFF8B5CF6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
          letterSpacing: 0.3,
        ),
      ),
    ),
    iconTheme: const IconThemeData(
      color: Color(0xFF8B5CF6),
      size: 24,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0xFF374151),
      labelStyle: const TextStyle(color: Color(0xFFF9FAFB)),
      side: const BorderSide(color: Color(0xFF4B5563)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const Color(0xFF8B5CF6);
        }
        return const Color(0xFF9CA3AF);
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const Color(0xFF8B5CF6).withOpacity(0.5);
        }
        return const Color(0xFF4B5563);
      }),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const Color(0xFF8B5CF6);
        }
        return Colors.transparent;
      }),
      checkColor: MaterialStateProperty.all(const Color(0xFFFFFFFF)),
      side: const BorderSide(color: Color(0xFF4B5563), width: 2),
    ),
    radioTheme: RadioThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return const Color(0xFF8B5CF6);
        }
        return const Color(0xFF4B5563);
      }),
    ),
    dividerColor: const Color(0xFF374151),
    hintColor: const Color(0xFF9CA3AF),
    disabledColor: const Color(0xFF6B7280),
    highlightColor: const Color(0xFF8B5CF6).withOpacity(0.2),
    splashColor: const Color(0xFF8B5CF6).withOpacity(0.3),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late ThemeProvider _themeProvider;

  @override
  void initState() {
    super.initState();
    _themeProvider = ThemeProvider();
    _themeProvider.addListener(() {
      setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EduNova',
      theme: _themeProvider.lightTheme,
      darkTheme: _themeProvider.darkTheme,
      themeMode: _themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: LoginScreen(themeProvider: _themeProvider),
    );
  }
}

class LoginScreen extends StatefulWidget {
  final ThemeProvider themeProvider;
  const LoginScreen({super.key, required this.themeProvider});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  Future<void> _signIn() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate login process
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    // Navigate to HomePage on successful login
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomePage(themeProvider: widget.themeProvider),
        ),
      );
    }
  }

  Future<void> _signInWithGitHub() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate GitHub login
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    // Navigate to HomePage
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomePage(themeProvider: widget.themeProvider),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF6366F1),
              Color(0xFF8B5CF6),
              Color(0xFFA855F7),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                
                // Logo and app name
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.school,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Teachers',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          TextSpan(
                            text: 'Connect',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFFBBF24),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 60),
                
                // Character illustration
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.person_4,
                      size: 50,
                      color: Colors.white,
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Welcome Back title
                const Text(
                  'Welcome Back!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Subtitle
                const Text(
                  'Continue your journey in transforming rural education with AI-powered tools',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                    height: 1.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 48),
                
                // Login Form Container
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Email field
                      const Text(
                        'Email Address',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: 'teacher@example.com',
                          prefixIcon: const Icon(
                            Icons.email_outlined,
                            color: Color(0xFF6366F1),
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // Password field
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Password',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Forgot password feature coming soon!'),
                                ),
                              );
                            },
                            child: const Text(
                              'Forgot password?',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6366F1),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _passwordController,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          hintText: 'Enter your password',
                          prefixIcon: const Icon(
                            Icons.lock_outline,
                            color: Color(0xFF6366F1),
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                              color: const Color(0xFF6366F1),
                            ),
                            onPressed: () {
                              setState(() {
                                _isPasswordVisible = !_isPasswordVisible;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Sign In button
                      ElevatedButton(
                        onPressed: _isLoading ? null : _signIn,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Sign In',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Or continue with
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'Or continue with',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
                        ],
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // GitHub button
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : _signInWithGitHub,
                        icon: const Icon(Icons.code, color: Colors.black87),
                        label: const Text(
                          'Continue with GitHub',
                          style: TextStyle(
                            color: Colors.black87,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Create account
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Don\'t have an account? ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => SignupScreen(themeProvider: widget.themeProvider),
                          ),
                        );
                      },
                      child: const Text(
                        'Create account',
                        style: TextStyle(
                          color: Color(0xFFFBBF24),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 40),
                
                // App tagline
                const Column(
                  children: [
                    Text(
                      'Empowering Rural Education',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFFBBF24),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Connect • Collaborate • Transform',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }



  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

class SignupScreen extends StatefulWidget {
  final ThemeProvider themeProvider;
  const SignupScreen({super.key, required this.themeProvider});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;
  bool _agreeToTerms = false;

  Future<void> _signUp() async {
    if (_fullNameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to terms and conditions'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate signup process
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    // Navigate to HomePage on successful signup
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomePage(themeProvider: widget.themeProvider),
        ),
      );
    }
  }

  Future<void> _signUpWithGitHub() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate GitHub signup
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    // Navigate to HomePage
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => HomePage(themeProvider: widget.themeProvider),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF6366F1),
              Color(0xFF8B5CF6),
              Color(0xFFA855F7),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                
                // Back button and Logo
                Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.arrow_back,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.school,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Teachers',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          TextSpan(
                            text: 'Connect',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFFBBF24),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 40),
                
                // Character illustration
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.person_add,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Join EduNova title
                const Text(
                  'Join EduNova',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Subtitle
                const Text(
                  'Create your account and start building the future of rural education with AI-powered tools and global collaboration.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                    height: 1.5,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 32),
                
                // Signup Form Container
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Full Name field
                      const Text(
                        'Full Name',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _fullNameController,
                        keyboardType: TextInputType.name,
                        decoration: InputDecoration(
                          hintText: 'John Doe',
                          prefixIcon: const Icon(
                            Icons.person_outline,
                            color: Color(0xFF6366F1),
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Email field
                      const Text(
                        'Email Address',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: 'teacher@example.com',
                          prefixIcon: const Icon(
                            Icons.email_outlined,
                            color: Color(0xFF6366F1),
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Password field
                      const Text(
                        'Password',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _passwordController,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          hintText: 'Create a strong password',
                          prefixIcon: const Icon(
                            Icons.lock_outline,
                            color: Color(0xFF6366F1),
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                              color: const Color(0xFF6366F1),
                            ),
                            onPressed: () {
                              setState(() {
                                _isPasswordVisible = !_isPasswordVisible;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Confirm Password field
                      const Text(
                        'Confirm Password',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _confirmPasswordController,
                        obscureText: !_isConfirmPasswordVisible,
                        decoration: InputDecoration(
                          hintText: 'Confirm your password',
                          prefixIcon: const Icon(
                            Icons.lock_outline,
                            color: Color(0xFF6366F1),
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isConfirmPasswordVisible ? Icons.visibility : Icons.visibility_off,
                              color: const Color(0xFF6366F1),
                            ),
                            onPressed: () {
                              setState(() {
                                _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // Terms and Conditions
                      Row(
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: Checkbox(
                              value: _agreeToTerms,
                              onChanged: (value) {
                                setState(() {
                                  _agreeToTerms = value ?? false;
                                });
                              },
                              activeColor: const Color(0xFF6366F1),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: RichText(
                              text: TextSpan(
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.black87,
                                ),
                                children: [
                                  const TextSpan(text: 'I agree to the '),
                                  TextSpan(
                                    text: 'Terms of Service',
                                    style: TextStyle(
                                      color: const Color(0xFF6366F1),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const TextSpan(text: ' and '),
                                  TextSpan(
                                    text: 'Privacy Policy',
                                    style: TextStyle(
                                      color: const Color(0xFF6366F1),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Create Account button
                      ElevatedButton(
                        onPressed: _isLoading ? null : _signUp,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text(
                                'Create Account',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // Or continue with
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'Or continue with',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
                        ],
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // GitHub button
                      OutlinedButton.icon(
                        onPressed: _isLoading ? null : _signUpWithGitHub,
                        icon: const Icon(Icons.code, color: Colors.black87),
                        label: const Text(
                          'Continue with GitHub',
                          style: TextStyle(
                            color: Colors.black87,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Already have account
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Already have an account? ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          color: Color(0xFFFBBF24),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 20),
                
                // App tagline
                const Column(
                  children: [
                    Text(
                      'Empowering Rural Education',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFFBBF24),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Connect • Collaborate • Transform',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}

class HomePage extends StatefulWidget {
  final ThemeProvider themeProvider;
  const HomePage({super.key, required this.themeProvider});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  List<Widget> get _screens => <Widget>[
    const DashboardScreen(),
    const ResourcesScreen(),
    const AIAssistantScreen(),
    const MultilingualScreen(),
    const CommunityScreen(),
    const OfflineModeScreen(),
    const ProfileScreen(),
    SettingsScreen(themeProvider: widget.themeProvider),
  ];

  static const List<String> _titles = <String>[
    'Dashboard',
    'Resources',
    'AI Assistant',
    'Multilingual',
    'Community',
    'Offline Mode',
    'Profile',
    'Settings',
  ];

  void _onSelect(int index) {
    setState(() {
      _selectedIndex = index;
      Navigator.of(context).pop();
    });
  }

  Widget _buildDrawerItem(String title, String assetPath, int index) {
    return ListTile(
      leading: SvgPicture.asset(assetPath, width: 22, height: 22),
      title: Text(title),
      onTap: () => _onSelect(index),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_titles[_selectedIndex])),
      drawer: Drawer(
        child: ListView(padding: EdgeInsets.zero, children: <Widget>[
          DrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF2B6CB0)),
            child: Row(
              children: [
                SvgPicture.asset('assets/logo.svg', width: 56, height: 56), 
                const SizedBox(width: 12), 
                Expanded(
                  child: const Text(
                    'EduNova', 
                    style: TextStyle(
                      color: Colors.white, 
                      fontSize: 20, 
                      fontWeight: FontWeight.bold, 
                      letterSpacing: 1.2
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          _buildDrawerItem('Dashboard', 'assets/icons/home.svg', 0),
          _buildDrawerItem('Resources', 'assets/icons/resources.svg', 1),
          _buildDrawerItem('AI Assistant', 'assets/icons/ai.svg', 2),
          _buildDrawerItem('Multilingual', 'assets/icons/lang.svg', 3),
          _buildDrawerItem('Community', 'assets/icons/community.svg', 4),
          _buildDrawerItem('Offline Mode', 'assets/icons/offline.svg', 5),
          const Divider(),
          _buildDrawerItem('Profile', 'assets/icons/profile.svg', 6),
          _buildDrawerItem('Settings', 'assets/icons/settings.svg', 7),
        ]),
      ),
      body: Center(child: _screens[_selectedIndex]),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return PageLayout(
      title: 'Dashboard',
      subtitle: 'Your teaching hub awaits',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Welcome Hero Card
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Color(0xFF374151),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.school,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Welcome back, Teacher!',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Ready to transform education today?',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Color(0xFF374151),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.auto_awesome, size: 16, color: Color(0xFFFBBF24)),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            'AI-Powered • Offline Ready • Community Driven',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.95),
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Stats Overview
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Impact',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  GridView(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.3,
                    ),
                    children: [
                      _EnhancedStatCard(
                        title: 'Resources',
                        value: '12',
                        subtitle: 'Shared with community',
                        icon: Icons.description,
                        color: Color(0xFF059669),
                      ),
                      _EnhancedStatCard(
                        title: 'Downloads',
                        value: '248',
                        subtitle: 'Times downloaded',
                        icon: Icons.download,
                        color: Color(0xFF2563EB),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Quick Actions
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Actions',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                    children: [
                      _ActionTile(
                        title: 'Browse Resources',
                        subtitle: 'Discover materials',
                        icon: Icons.explore,
                        color: Color(0xFF1F2937),
                      ),
                      _ActionTile(
                        title: 'AI Assistant',
                        subtitle: 'Generate lessons',
                        icon: Icons.smart_toy,
                        color: Color(0xFF1F2937),
                      ),
                      _ActionTile(
                        title: 'Upload Resource',
                        subtitle: 'Share knowledge',
                        icon: Icons.cloud_upload,
                        color: Color(0xFF1F2937),
                      ),
                      _ActionTile(
                        title: 'Translate',
                        subtitle: 'Break barriers',
                        icon: Icons.translate,
                        color: Color(0xFF1F2937),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _BigStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  const _BigStatCard({required this.title, required this.value, required this.subtitle, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).brightness == Brightness.dark 
        ? const Color(0xFF2A2A2A)
        : Colors.white,
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Container(
            width: 48, 
            height: 48, 
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark 
                ? const Color(0xFF4FC3F7).withOpacity(0.2)
                : Colors.blue.shade50, 
              borderRadius: BorderRadius.circular(12)
            ), 
            child: Icon(
              Icons.insert_drive_file, 
              color: Theme.of(context).brightness == Brightness.dark 
                ? const Color(0xFF4FC3F7)
                : const Color(0xFF2B6CB0)
            )
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 20, fontWeight: FontWeight.bold)), const SizedBox(height: 4), Text(title, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12))]))
        ]),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  
  const _ActionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Color(0xFF374151),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}

class _EnhancedStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  
  const _EnhancedStatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[300],
              letterSpacing: 0.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[400],
              height: 1.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _EnhancedFeatureTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradient;
  
  const _EnhancedFeatureTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark ? [
            const Color(0xFF1F2937),
            const Color(0xFF374151),
          ] : gradient,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isDark ? const Color(0xFF374151) : gradient.first).withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(isDark ? 0.1 : 0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final String title;
  final String icon;
  const _FeatureTile({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark 
          ? const Color(0xFF2A2A2A)
          : Colors.white, 
        borderRadius: BorderRadius.circular(10)
      ), 
      padding: const EdgeInsets.symmetric(horizontal: 10), 
      child: Row(children: [
        SvgPicture.asset(
          icon, 
          width: 22, 
          height: 22,
          color: Theme.of(context).brightness == Brightness.dark 
            ? const Color(0xFF4FC3F7)
            : null,
        ), 
        const SizedBox(width: 10), 
        Expanded(child: Text(
          title, 
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).brightness == Brightness.dark 
              ? const Color(0xFFFFFFFF)
              : Colors.black,
          )
        ))
      ])
    );
  }
}

class _ResourceStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String? tag;

  const _ResourceStatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    this.tag,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: 190,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark ? [
            const Color(0xFF1F2937),
            const Color(0xFF374151),
          ] : [
            Colors.white,
            const Color(0xFFF8FAFC),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isDark 
              ? Colors.black.withOpacity(0.3)
              : Colors.black.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark 
                    ? iconColor.withOpacity(0.2)
                    : iconBgColor,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  icon,
                  color: isDark ? iconColor.withOpacity(0.9) : iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                value,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFE5E7EB) : const Color(0xFF374151),
                  letterSpacing: 0.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          if (tag != null)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [iconColor, iconColor.withOpacity(0.8)],
                  ),
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
                child: Text(
                  tag!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ResourceActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool isActive;

  const _ResourceActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        decoration: BoxDecoration(
          gradient: isActive ? LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark 
              ? [
                  const Color(0xFF8B5CF6),
                  const Color(0xFF7C3AED),
                ]
              : [
                  const Color(0xFF7C3AED),
                  const Color(0xFF6D28D9),
                ],
          ) : null,
          color: !isActive ? (isDark 
            ? const Color(0xFF374151)
            : const Color(0xFFF8FAFC)) : null,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isActive ? [
            BoxShadow(
              color: (isDark ? const Color(0xFF8B5CF6) : const Color(0xFF7C3AED)).withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ] : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isActive 
                  ? Colors.white.withOpacity(0.2)
                  : (isDark ? const Color(0xFF4B5563) : const Color(0xFFE5E7EB)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 20,
                color: isActive 
                  ? Colors.white
                  : (isDark ? const Color(0xFFD1D5DB) : const Color(0xFF6B7280)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isActive 
                    ? Colors.white
                    : (isDark ? const Color(0xFFE5E7EB) : const Color(0xFF1F2937)),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  letterSpacing: 0.3,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ResourcesScreen extends StatelessWidget {
  const ResourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResourcesHome();
  }
}

class ResourcesHome extends StatefulWidget {
  const ResourcesHome({super.key});

  @override
  State<ResourcesHome> createState() => _ResourcesHomeState();
}

class _ResourcesHomeState extends State<ResourcesHome> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, String>> _resources = [];

  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    final box = Hive.box('appBox');
    final stored = box.get('resources', defaultValue: []);
    try {
      _resources = List<Map<String, String>>.from(stored.map<Map<String, String>>((e) => Map<String, String>.from(e)));
    } catch (_) {
      _resources = [];
    }
    
    // Add sample resources if the list is empty
    if (_resources.isEmpty) {
      _resources = [
        {
          "title": "Mathematics Grade 5 - Fractions Made Easy",
          "description": "Comprehensive lesson plan with visual aids and interactive exercises to help students understand fractions. Includes worksheets, practice problems, and assessment rubrics."
        },
        {
          "title": "Science Project: Solar System Model",
          "description": "Step-by-step guide to create an interactive solar system model using recyclable materials. Perfect for grade 4-6 students to learn about planets, orbits, and space."
        },
        {
          "title": "English Grammar - Storytelling Techniques",
          "description": "Creative writing workshop materials focusing on narrative structure, character development, and dialogue. Includes story prompts and peer review activities."
        },
        {
          "title": "Social Studies: Community Heroes",
          "description": "Interactive lesson about local community workers and their contributions. Features role-play activities, interview templates, and presentation guidelines."
        },
        {
          "title": "Art & Craft: Traditional Indian Patterns",
          "description": "Explore geometric patterns in Indian art through hands-on activities. Includes templates for rangoli designs, mandala creation, and cultural context lessons."
        }
      ];
      // Save sample resources to storage
      box.put('resources', _resources);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _addResource() {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _resources.add({"title": _titleCtrl.text, "description": _descCtrl.text});
        _titleCtrl.clear();
        _descCtrl.clear();
        _tabController.index = 0; // switch to Browse
        Hive.box('appBox').put('resources', _resources);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageLayout(
      title: 'Educational Resources',
      subtitle: 'Share, discover, and collaborate on educational materials',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome banner
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: Theme.of(context).brightness == Brightness.dark 
                  ? [
                      const Color(0xFF1F2937),
                      const Color(0xFF374151),
                    ]
                  : [
                      const Color(0xFF7C3AED),
                      const Color(0xFF8B5CF6),
                    ],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Theme.of(context).brightness == Brightness.dark 
                    ? Colors.black.withOpacity(0.3)
                    : const Color(0xFF7C3AED).withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome to the EduNova Resource Hub!',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: Colors.white,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Upload your teaching materials, discover resources from educators worldwide, and build a collaborative learning community for rural education.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.9),
                          height: 1.5,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '🌟 EduNova - Education Reimagined',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.school, color: Colors.white, size: 32),
                      const SizedBox(height: 8),
                      Text(
                        'Resources',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Stats row
          SizedBox(
            height: 120,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _ResourceStatCard(
                  title: 'Total Resources',
                  value: '${_resources.length}',
                  subtitle: 'Available resources',
                  icon: Icons.folder_open,
                  iconColor: Colors.blue,
                  iconBgColor: Colors.blue.shade50,
                ),
                const SizedBox(width: 12),
                _ResourceStatCard(
                  title: 'Downloads',
                  value: '0',
                  subtitle: 'Total downloads',
                  icon: Icons.download,
                  iconColor: Colors.green,
                  iconBgColor: Colors.green.shade50,
                ),
                const SizedBox(width: 12),
                _ResourceStatCard(
                  title: 'Community Likes',
                  value: '0',
                  subtitle: 'Community appreciation',
                  icon: Icons.favorite,
                  iconColor: Colors.red,
                  iconBgColor: Colors.red.shade50,
                ),
                const SizedBox(width: 12),
                _ResourceStatCard(
                  title: 'Recent Uploads',
                  value: '${_resources.length}',
                  subtitle: 'In the last 7 days',
                  icon: Icons.upload_file,
                  iconColor: Colors.orange,
                  iconBgColor: Colors.orange.shade50,
                  tag: 'NEW',
                ),
              ],
            ),
          ),
          
          // Action buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            child: Row(
              children: [
                Expanded(
                  child: _ResourceActionButton(
                    icon: Icons.search,
                    label: 'Browse Resources',
                    onTap: () => _tabController.animateTo(0),
                    isActive: _tabController.index == 0,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _ResourceActionButton(
                    icon: Icons.upload_file,
                    label: 'Upload Resource',
                    onTap: () => _tabController.animateTo(1),
                    isActive: _tabController.index == 1,
                  ),
                ),
              ],
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Expanded(
                  child: _ResourceActionButton(
                    icon: Icons.folder_shared,
                    label: 'My Resources',
                    onTap: () => _tabController.animateTo(2),
                    isActive: _tabController.index == 2,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: _ResourceActionButton(
                    icon: Icons.analytics,
                    label: 'Analytics',
                    onTap: null,
                    isActive: false,
                  ),
                ),
              ],
            ),
          ),
          
          // Section title
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 24, 12, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.search, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Discover Educational Resources',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Browse through thousands of educational materials shared by teachers worldwide',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 12,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.only(top: 16, bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          style: TextStyle(
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? const Color(0xFF000000)
                              : Colors.black,
                            fontSize: 16,
                            fontWeight: Theme.of(context).brightness == Brightness.dark 
                              ? FontWeight.w900
                              : FontWeight.normal,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search resources...',
                            prefixIcon: const Icon(Icons.search, size: 20),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white
                              : Colors.grey.shade100,
                            contentPadding: const EdgeInsets.symmetric(vertical: 0),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark 
                            ? Colors.white
                            : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Theme.of(context).brightness == Brightness.dark 
                            ? Border.all(color: const Color(0xFF999999))
                            : null,
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: 'All Subjects',
                            style: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF000000)
                                : Colors.black,
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                            ),
                            items: ['All Subjects', 'Math', 'Science', 'Language']
                                .map((String value) => DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value, style: TextStyle(
                                        color: Colors.black,
                                        fontSize: 14,
                                      )),
                                    ))
                                .toList(),
                            onChanged: (_) {},
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Resource list with expandable tabs
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Browse tab
                _resources.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Theme.of(context).brightness == Brightness.dark 
                                  ? const Color(0xFF374151).withOpacity(0.5)
                                  : const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Icon(
                                Icons.folder_open_outlined,
                                size: 48,
                                color: Theme.of(context).brightness == Brightness.dark 
                                  ? const Color(0xFF9CA3AF)
                                  : const Color(0xFF6B7280),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No resources found',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Theme.of(context).brightness == Brightness.dark 
                                  ? const Color(0xFFE5E7EB)
                                  : const Color(0xFF1F2937),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Start sharing educational resources with the community',
                              style: TextStyle(
                                color: Theme.of(context).brightness == Brightness.dark 
                                  ? const Color(0xFF9CA3AF)
                                  : const Color(0xFF6B7280),
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _resources.length,
                        itemBuilder: (context, i) {
                          final r = _resources[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: Theme.of(context).brightness == Brightness.dark 
                                  ? [
                                      const Color(0xFF1F2937),
                                      const Color(0xFF374151),
                                    ]
                                  : [
                                      Colors.white,
                                      const Color(0xFFF8FAFC),
                                    ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Theme.of(context).brightness == Brightness.dark 
                                    ? Colors.black.withOpacity(0.3)
                                    : Colors.black.withOpacity(0.06),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF059669).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Icon(
                                        Icons.description,
                                        color: const Color(0xFF059669),
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            r['title']!,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 18,
                                              color: Theme.of(context).brightness == Brightness.dark 
                                                ? Colors.white
                                                : const Color(0xFF1F2937),
                                              letterSpacing: 0.3,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF8B5CF6).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              'Educational Resource',
                                              style: TextStyle(
                                                color: const Color(0xFF8B5CF6),
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  r['description']!,
                                  style: TextStyle(
                                    color: Theme.of(context).brightness == Brightness.dark 
                                      ? const Color(0xFFD1D5DB)
                                      : const Color(0xFF4B5563),
                                    fontSize: 14,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF059669), Color(0xFF10B981)],
                                          ),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.download, size: 18, color: Colors.white),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Download',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).brightness == Brightness.dark 
                                          ? const Color(0xFF4B5563)
                                          : const Color(0xFFF3F4F6),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        Icons.favorite_border,
                                        size: 18,
                                        color: Theme.of(context).brightness == Brightness.dark 
                                          ? const Color(0xFFD1D5DB)
                                          : const Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      
                // Upload tab
                SingleChildScrollView(
                  padding: const EdgeInsets.all(12),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Share your teaching materials',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Help other teachers by sharing your best classroom resources',
                                  style: TextStyle(
                                    color: Colors.black.withOpacity(0.7),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _titleCtrl,
                                  style: TextStyle(
                                    color: Theme.of(context).brightness == Brightness.dark 
                                      ? const Color(0xFF000000)
                                      : Colors.black,
                                    fontSize: 16,
                                    fontWeight: Theme.of(context).brightness == Brightness.dark 
                                      ? FontWeight.w900
                                      : FontWeight.normal,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: 'Resource Title',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  validator: (v) => (v == null || v.isEmpty) ? 'Enter a title' : null,
                                ),
                                const SizedBox(height: 12),
                                TextFormField(
                                  controller: _descCtrl,
                                  style: TextStyle(
                                    color: Theme.of(context).brightness == Brightness.dark 
                                      ? const Color(0xFF000000)
                                      : Colors.black,
                                    fontSize: 16,
                                    fontWeight: Theme.of(context).brightness == Brightness.dark 
                                      ? FontWeight.w900
                                      : FontWeight.normal,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: 'Resource Description',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  maxLines: 4,
                                  validator: (v) => (v == null || v.isEmpty) ? 'Enter a description' : null,
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: _addResource,
                                  icon: const Icon(Icons.upload_file),
                                  label: const Text('Upload Resource'),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // My Resources tab
                _resources.isEmpty
                    ? const Center(child: Text('You have not uploaded resources yet'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _resources.length,
                        itemBuilder: (context, i) {
                          final r = _resources[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          r['title']!,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                                        onPressed: () {
                                          setState(() {
                                            _resources.removeAt(i);
                                            Hive.box('appBox').put('resources', _resources);
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    r['description']!,
                                    style: TextStyle(
                                      color: Colors.black.withOpacity(0.7),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade50,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '0 Downloads',
                                          style: TextStyle(
                                            color: Colors.blue.shade700,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.red.shade50,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          '0 Likes',
                                          style: TextStyle(
                                            color: Colors.red.shade700,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ],
            ),
          ),
          
          // Resource count indicator
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              '${_resources.length} resources found',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class AIAssistantScreen extends StatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  State<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends State<AIAssistantScreen> {
  final _topicController = TextEditingController();
  String _selectedGradeLevel = 'Select Grade Level';
  List<Map<String, dynamic>> _resources = [];
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _loadResources();
  }

  void _loadResources() {
    final box = Hive.box('appBox');
    final stored = box.get('resources', defaultValue: []);
    try {
      _resources = List<Map<String, dynamic>>.from(stored.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e)));
    } catch (_) {
      _resources = [];
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return PageLayout(
      title: 'Comprehensive AI Teaching Assistant',
      subtitle: 'Powered by Real AI. Using OpenRouter with Claude 3, GPT-4, and other advanced models to create comprehensive lesson plans from your uploaded resources, and provide intelligent teaching support. 🧠',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // AI Feature Buttons
            Container(
              margin: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: _AIFeatureButton(
                      icon: Icons.auto_awesome,
                      label: 'AI Lesson Generator',
                      isActive: true,
                      color: Colors.blue,
                      onTap: () {},
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _AIFeatureButton(
                      icon: Icons.note_add,
                      label: 'Smart Notes Generator',
                      isActive: false,
                      color: Colors.grey,
                      onTap: () {},
                    ),
                  ),
                ],
              ),
            ),
            
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _AIFeatureButton(
                      icon: Icons.school,
                      label: 'My AI Lessons',
                      isActive: false,
                      color: Colors.grey,
                      onTap: () {},
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _AIFeatureButton(
                      icon: Icons.chat,
                      label: 'AI Chat Assistant',
                      isActive: false,
                      color: Colors.grey,
                      onTap: () {},
                    ),
                  ),
                ],
              ),
            ),

            // Select Resources Section
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark 
                  ? const Color(0xFF2A2A2A)
                  : Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? Colors.black.withOpacity(0.3)
                      : Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.library_books, color: Colors.green, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Select Resources for AI Lesson Generation',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  if (_resources.isNotEmpty) ...[
                    Container(
                      height: 120,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Theme.of(context).brightness == Brightness.dark 
                            ? const Color(0xFF555555)
                            : Colors.grey.shade300
                        ),
                        borderRadius: BorderRadius.circular(8),
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF1E1E1E)
                          : null,
                      ),
                      child: ListView.builder(
                        itemCount: _resources.length,
                        itemBuilder: (context, index) {
                          final resource = _resources[index];
                          return ListTile(
                            dense: true,
                            leading: Checkbox(
                              value: false,
                              onChanged: (value) {},
                            ),
                            title: Text(
                              resource['title'] ?? 'Untitled',
                              style: const TextStyle(fontSize: 14),
                            ),
                            subtitle: Text(
                              '${resource['description'] ?? 'No description'} • grade_10',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.create, size: 16),
                          label: const Text('Generate Notes'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.visibility, size: 16),
                          label: const Text('View'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Selected 0 resource(s) for AI lesson generation',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ] else ...[
                    Container(
                      height: 60,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Theme.of(context).brightness == Brightness.dark 
                            ? const Color(0xFF555555)
                            : Colors.grey.shade300
                        ),
                        borderRadius: BorderRadius.circular(8),
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF1E1E1E)
                          : Colors.grey.shade50,
                      ),
                      child: const Center(
                        child: Text(
                          'No resources available. Upload resources first to generate AI lessons.',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Lesson Configuration
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark 
                  ? const Color(0xFF2A2A2A)
                  : Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? Colors.black.withOpacity(0.3)
                      : Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.settings, color: const Color(0xFF7C3AED), size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Lesson Configuration',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Lesson Topic *',
                              style: TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _topicController,
                              style: TextStyle(
                                color: Theme.of(context).brightness == Brightness.dark 
                                  ? const Color(0xFF000000)
                                  : Colors.black,
                                fontSize: 16,
                                fontWeight: Theme.of(context).brightness == Brightness.dark 
                                  ? FontWeight.w900
                                  : FontWeight.normal,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Enter the main topic for your lesson',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Grade Level',
                              style: TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade400),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedGradeLevel,
                                  isExpanded: true,
                                  items: [
                                    'Select Grade Level',
                                    'Grade 1',
                                    'Grade 2',
                                    'Grade 3',
                                    'Grade 4',
                                    'Grade 5',
                                    'Grade 6',
                                    'Grade 7',
                                    'Grade 8',
                                    'Grade 9',
                                    'Grade 10',
                                    'Grade 11',
                                    'Grade 12',
                                  ].map((String value) {
                                    return DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(
                                        value,
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: value == 'Select Grade Level' 
                                              ? Colors.grey.shade600 
                                              : Colors.black,
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (String? newValue) {
                                    if (newValue != null) {
                                      setState(() {
                                        _selectedGradeLevel = newValue;
                                      });
                                    }
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isGenerating ? null : _generateLesson,
                      icon: _isGenerating 
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(Icons.auto_awesome),
                      label: Text(_isGenerating ? 'Generating...' : 'Generate AI Lesson Plan'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _generateLesson() {
    if (_topicController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a lesson topic')),
      );
      return;
    }

    setState(() {
      _isGenerating = true;
    });

    // Simulate AI generation
    Future.delayed(const Duration(seconds: 3), () {
      setState(() {
        _isGenerating = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('AI Lesson Plan generated successfully!')),
      );
    });
  }

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }
}

class _AIFeatureButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color color;
  final VoidCallback onTap;

  const _AIFeatureButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isActive 
            ? color 
            : Theme.of(context).brightness == Brightness.dark 
              ? const Color(0xFF2A2A2A)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive 
              ? color 
              : Theme.of(context).brightness == Brightness.dark 
                ? const Color(0xFF555555)
                : Colors.grey.shade300,
            width: 1,
          ),
          boxShadow: isActive ? [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : [],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isActive 
                ? Colors.white 
                : Theme.of(context).brightness == Brightness.dark 
                  ? const Color(0xFF4FC3F7)
                  : color,
              size: 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isActive 
                  ? Colors.white 
                  : Theme.of(context).brightness == Brightness.dark 
                    ? const Color(0xFFFFFFFF)
                    : Colors.black87,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MultilingualScreen extends StatefulWidget {
  const MultilingualScreen({super.key});

  @override
  State<MultilingualScreen> createState() => _MultilingualScreenState();
}

class _MultilingualScreenState extends State<MultilingualScreen> {
  final _sourceTextController = TextEditingController();
  final _translationController = TextEditingController();
  String _sourceLanguage = 'Auto Detect';
  String _targetLanguage = 'English';
  bool _isTranslating = false;

  final List<String> _languages = [
    'Auto Detect',
    'English',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Korean',
    'Hindi',
    'Arabic',
    'Portuguese',
    'Russian',
    'Italian',
    'Dutch',
    'Swedish',
    'Norwegian',
    'Danish',
    'Finnish',
  ];

  @override
  Widget build(BuildContext context) {
    return PageLayout(
      title: 'Multilingual Translator',
      subtitle: 'Translate educational content using Meta\'s NLLB AI model',
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Status indicator
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 16),
                  const SizedBox(width: 6),
                  const Text(
                    'NLLB Model Ready',
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.w500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            // Language selection row
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  // Source Language
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Source Language',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF999999) 
                                : Colors.grey.shade300
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? const Color(0xFF2A2A2A) 
                              : Colors.white,
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _sourceLanguage,
                              isExpanded: true,
                              dropdownColor: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF2A2A2A) 
                                : Colors.white,
                              items: _languages.map((String language) {
                                return DropdownMenuItem<String>(
                                  value: language,
                                  child: Text(
                                    language,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Theme.of(context).brightness == Brightness.dark 
                                        ? Colors.white 
                                        : Colors.black,
                                    ),
                                  ),
                                );
                              }).toList(),
                              onChanged: (String? newValue) {
                                if (newValue != null) {
                                  setState(() {
                                    _sourceLanguage = newValue;
                                  });
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Swap button
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    child: IconButton(
                      onPressed: _swapLanguages,
                      icon: Icon(
                        Icons.swap_horiz,
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF4FC3F7) 
                          : Colors.blue,
                        size: 28,
                      ),
                      style: IconButton.styleFrom(
                        backgroundColor: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF2A2A2A) 
                          : Colors.blue.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  
                  // Target Language
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Target Language',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF999999) 
                                : Colors.grey.shade300
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? const Color(0xFF2A2A2A) 
                              : Colors.white,
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _targetLanguage,
                              isExpanded: true,
                              dropdownColor: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF2A2A2A) 
                                : Colors.white,
                              items: _languages.where((lang) => lang != 'Auto Detect').map((String language) {
                                return DropdownMenuItem<String>(
                                  value: language,
                                  child: Text(
                                    language,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Theme.of(context).brightness == Brightness.dark 
                                        ? Colors.white 
                                        : Colors.black,
                                    ),
                                  ),
                                );
                              }).toList(),
                              onChanged: (String? newValue) {
                                if (newValue != null) {
                                  setState(() {
                                    _targetLanguage = newValue;
                                  });
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Translation input/output area
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Source text input
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Text to Translate',
                              style: TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                            TextButton(
                              onPressed: _detectLanguage,
                              child: Text(
                                'Detect Language',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context).brightness == Brightness.dark 
                                    ? const Color(0xFF4FC3F7) 
                                    : Colors.blue,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Container(
                          height: 200,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF999999) 
                                : Colors.grey.shade300
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white 
                              : Colors.white,
                          ),
                          child: TextField(
                            controller: _sourceTextController,
                            maxLines: null,
                            expands: true,
                            style: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF000000)
                                : Colors.black,
                              fontSize: 16,
                              fontWeight: Theme.of(context).brightness == Brightness.dark 
                                ? FontWeight.w900
                                : FontWeight.normal,
                            ),
                            decoration: const InputDecoration(
                              hintText: 'Enter text to translate...',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.all(12),
                            ),
                            onChanged: (text) {
                              setState(() {});
                            },
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${_sourceTextController.text.length}/5000 characters',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.grey.shade400 
                              : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Translation output
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Translation',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 32), // Extra space to align with the "Detect Language" button height
                        Container(
                          height: 200,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF999999) 
                                : Colors.grey.shade300
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white 
                              : Colors.grey.shade50,
                          ),
                          child: TextField(
                            controller: _translationController,
                            maxLines: null,
                            expands: true,
                            readOnly: true,
                            style: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? const Color(0xFF000000)
                                : Colors.black,
                              fontSize: 16,
                              fontWeight: Theme.of(context).brightness == Brightness.dark 
                                ? FontWeight.w900
                                : FontWeight.normal,
                            ),
                            decoration: const InputDecoration(
                              hintText: 'Translation will appear here...',
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.all(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _translationController.text.isEmpty ? '' : '${_translationController.text.length} characters',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.grey.shade400 
                              : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Action buttons
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _sourceTextController.text.isEmpty || _isTranslating
                          ? null
                          : _translateText,
                      icon: _isTranslating
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(Icons.translate),
                      label: Text(_isTranslating ? 'Translating...' : 'Translate'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF4FC3F7) 
                          : Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: _clearAll,
                    icon: const Icon(Icons.clear_all),
                    label: const Text('Clear All'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF4FC3F7) 
                        : Colors.blue,
                      side: BorderSide(
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF4FC3F7) 
                          : Colors.blue,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _swapLanguages() {
    if (_sourceLanguage != 'Auto Detect') {
      setState(() {
        final temp = _sourceLanguage;
        _sourceLanguage = _targetLanguage;
        _targetLanguage = temp;
        
        // Swap text content too
        final tempText = _sourceTextController.text;
        _sourceTextController.text = _translationController.text;
        _translationController.text = tempText;
      });
    }
  }

  void _detectLanguage() {
    if (_sourceTextController.text.isNotEmpty) {
      // Simulate language detection
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Language detected: English')),
      );
    }
  }

  void _translateText() {
    if (_sourceTextController.text.isEmpty) return;

    setState(() {
      _isTranslating = true;
    });

    // Simulate translation API call
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isTranslating = false;
        _translationController.text = 'This is a simulated translation of: "${_sourceTextController.text}" from $_sourceLanguage to $_targetLanguage using Meta\'s NLLB AI model.';
      });
    });
  }

  void _clearAll() {
    setState(() {
      _sourceTextController.clear();
      _translationController.clear();
    });
  }

  @override
  void dispose() {
    _sourceTextController.dispose();
    _translationController.dispose();
    super.dispose();
  }
}

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageLayout(title: 'Community', subtitle: 'Connect with teachers', child: Center(child: Text('Community screen placeholder')));
  }
}

class OfflineModeScreen extends StatefulWidget {
  const OfflineModeScreen({super.key});

  @override
  State<OfflineModeScreen> createState() => _OfflineModeScreenState();
}

class _OfflineModeScreenState extends State<OfflineModeScreen> {
  bool _isOnline = true;
  int _pendingSync = 0;
  int _completedSync = 0;  
  int _failedSync = 0;
  int _totalSync = 0;
  
  final List<Map<String, dynamic>> _cachedData = [
    {
      'id': 'like-status-68e917a012fd07efc194a87c',
      'timestamp': '10/11/2025, 2:40:18 AM',
      'size': '34 B',
    },
    {
      'id': 'like-status-68e94ddb534e6c67efd1fd82',
      'timestamp': '10/11/2025, 2:40:18 AM', 
      'size': '34 B',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return PageLayout(
      title: 'Offline Mode',
      subtitle: 'Manage your offline experience and sync status',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Connection Status Card
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _isOnline 
                  ? const Color(0xFFE8F5E8) 
                  : Theme.of(context).brightness == Brightness.dark 
                    ? const Color(0xFF2A2A2A)
                    : const Color(0xFFFFF3E0),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _isOnline 
                    ? const Color(0xFF4CAF50) 
                    : const Color(0xFFFF9800),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _isOnline 
                        ? const Color(0xFF4CAF50) 
                        : const Color(0xFFFF9800),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _isOnline ? Icons.check_circle : Icons.wifi_off,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isOnline ? 'Connected' : 'Offline',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white 
                              : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _isOnline 
                            ? 'You\'re Online — all data will sync automatically'
                            : 'You\'re Offline — data will sync when connection is restored',
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.grey.shade300 
                              : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Sync Control Section
            const Text(
              'Sync Control',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),

            // Sync Stats Row
            Row(
              children: [
                Expanded(
                  child: _SyncStatCard(
                    value: _pendingSync.toString(),
                    label: 'Pending',
                    color: const Color(0xFF2196F3),
                    isDark: Theme.of(context).brightness == Brightness.dark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SyncStatCard(
                    value: _completedSync.toString(),
                    label: 'Completed',
                    color: const Color(0xFF4CAF50),
                    isDark: Theme.of(context).brightness == Brightness.dark,
                  ),
                ),
                const SizedBox(width: 12),  
                Expanded(
                  child: _SyncStatCard(
                    value: _failedSync.toString(),
                    label: 'Failed',
                    color: const Color(0xFFF44336),
                    isDark: Theme.of(context).brightness == Brightness.dark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SyncStatCard(
                    value: _totalSync.toString(),
                    label: 'Total',
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? Colors.grey.shade400 
                      : Colors.grey.shade600,
                    isDark: Theme.of(context).brightness == Brightness.dark,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _syncNow,
                    icon: const Icon(Icons.sync),
                    label: const Text('Sync Now'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF4FC3F7) 
                        : const Color(0xFF2196F3),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _refreshData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF4FC3F7) 
                      : const Color(0xFF2196F3),
                    side: BorderSide(
                      color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF4FC3F7) 
                        : const Color(0xFF2196F3),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Cached Data Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Cached Data',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: _refreshCachedData,
                  child: Text(
                    'Refresh',
                    style: TextStyle(
                      color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF4FC3F7) 
                        : const Color(0xFF2196F3),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Cached Data List
            if (_cachedData.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark 
                    ? const Color(0xFF2A2A2A) 
                    : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF404040) 
                      : Colors.grey.shade200,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.storage_outlined,
                      size: 48,
                      color: Theme.of(context).brightness == Brightness.dark 
                        ? Colors.grey.shade400 
                        : Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No cached data available',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.grey.shade300 
                          : Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Data will appear here when you go offline',
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.grey.shade400 
                          : Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              )
            else
              ..._cachedData.map((data) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark 
                    ? const Color(0xFF2A2A2A) 
                    : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Theme.of(context).brightness == Brightness.dark 
                      ? const Color(0xFF404040) 
                      : Colors.grey.shade200,
                  ),
                  boxShadow: Theme.of(context).brightness == Brightness.dark 
                    ? []
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF4FC3F7).withOpacity(0.2) 
                          : const Color(0xFF2196F3).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(
                        Icons.storage,
                        size: 20,
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF4FC3F7) 
                          : const Color(0xFF2196F3),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            data['id'],
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? Colors.white 
                                : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            data['timestamp'],
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(context).brightness == Brightness.dark 
                                ? Colors.grey.shade400 
                                : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      data['size'],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.grey.shade300 
                          : Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              )).toList(),
          ],
        ),
      ),
    );
  }

  void _syncNow() {
    setState(() {
      _pendingSync = 3;
      _completedSync = 0;
      _failedSync = 0;
      _totalSync = 3;
    });

    // Simulate sync process
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _pendingSync = 0;
        _completedSync = 3;
        _failedSync = 0;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sync completed successfully!'),
          backgroundColor: Color(0xFF4CAF50),
        ),
      );
    });
  }

  void _refreshData() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Data refreshed')),
    );
  }

  void _refreshCachedData() {
    setState(() {
      // Simulate refreshing cached data
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cached data refreshed')),
    );
  }
}

class _SyncStatCard extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  final bool isDark;

  const _SyncStatCard({
    required this.value,
    required this.label,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? const Color(0xFF404040) : Colors.grey.shade200,
        ),
        boxShadow: isDark 
          ? []
          : [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey.shade300 : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageLayout(title: 'Profile', subtitle: 'Manage your account', child: Center(child: Text('Profile screen placeholder')));
  }
}

class SettingsScreen extends StatelessWidget {
  final ThemeProvider themeProvider;
  const SettingsScreen({super.key, required this.themeProvider});

  @override
  Widget build(BuildContext context) {
    return PageLayout(
      title: 'Settings',
      subtitle: 'App preferences',
      child: Column(
        children: [
          // Dark Mode Setting
          Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Appearance',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                ),
                ListTile(
                  leading: Icon(
                    themeProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                    color: Theme.of(context).primaryColor,
                  ),
                  title: Text(
                    'Dark Mode',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                    ),
                  ),
                  subtitle: Text(
                    themeProvider.isDarkMode 
                        ? 'Dark theme is enabled' 
                        : 'Light theme is enabled',
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                  trailing: Switch(
                    value: themeProvider.isDarkMode,
                    onChanged: (value) {
                      themeProvider.toggleTheme();
                    },
                    activeColor: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
          
          // App Information
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'About',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                ),
                ListTile(
                  leading: Icon(
                    Icons.info_outline,
                    color: Theme.of(context).primaryColor,
                  ),
                  title: Text(
                    'EduNova',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                    ),
                  ),
                  subtitle: Text(
                    'Version 1.0.0\nRural Education Platform',
                    style: TextStyle(
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                    ),
                  ),
                ),
                ListTile(
                  leading: Icon(
                    Icons.privacy_tip_outlined,
                    color: Theme.of(context).primaryColor,
                  ),
                  title: Text(
                    'Privacy Policy',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                    ),
                  ),
                  trailing: Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Theme.of(context).textTheme.bodyMedium?.color,
                  ),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Privacy Policy coming soon')),
                    );
                  },
                ),
                ListTile(
                  leading: Icon(
                    Icons.help_outline,
                    color: Theme.of(context).primaryColor,
                  ),
                  title: Text(
                    'Help & Support',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).textTheme.bodyLarge?.color,
                    ),
                  ),
                  trailing: Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Theme.of(context).textTheme.bodyMedium?.color,
                  ),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Help & Support coming soon')),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


