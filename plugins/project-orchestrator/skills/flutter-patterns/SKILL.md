---
name: flutter-patterns
description: Build Flutter applications with clean architecture, BLoC/Riverpod state management, responsive layouts, platform-adaptive widgets, and testing. Use when building Flutter apps, creating widgets, managing state, handling navigation, or implementing platform-specific features. Trigger on "Flutter", "Dart", "Flutter widget", "BLoC", "Riverpod", "Flutter app".
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Flutter Patterns Skill

Production-grade Flutter patterns for mobile and cross-platform apps.

## Project Structure (Clean Architecture)
```
lib/
├── main.dart
├── app/
│   ├── app.dart                → MaterialApp config
│   ├── routes.dart             → Route definitions
│   └── theme.dart              → ThemeData
├── core/
│   ├── constants/
│   ├── errors/                 → Failure classes
│   ├── network/                → API client, interceptors
│   ├── utils/                  → Helpers, extensions
│   └── widgets/                → Shared widgets
├── features/
│   └── auth/
│       ├── data/
│       │   ├── datasources/    → Remote + Local
│       │   ├── models/         → JSON serialization
│       │   └── repositories/   → Implementation
│       ├── domain/
│       │   ├── entities/       → Business objects
│       │   ├── repositories/   → Abstract interface
│       │   └── usecases/       → Business logic
│       └── presentation/
│           ├── bloc/ or providers/
│           ├── pages/
│           └── widgets/
└── injection_container.dart    → Dependency injection
```

## State Management (Riverpod)
```dart
// Provider for async data
final usersProvider = FutureProvider.autoDispose<List<User>>((ref) async {
  final repository = ref.watch(userRepositoryProvider);
  return repository.getAll();
});

// Notifier for mutable state
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._authRepo) : super(const AuthState.initial());
  final AuthRepository _authRepo;

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();
    try {
      final user = await _authRepo.login(email, password);
      state = AuthState.authenticated(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }
}
```

## Responsive Layout
```dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget desktop;

  const ResponsiveLayout({
    required this.mobile,
    this.tablet,
    required this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1024) return desktop;
        if (constraints.maxWidth >= 768) return tablet ?? desktop;
        return mobile;
      },
    );
  }
}
```

## Testing
```dart
testWidgets('LoginPage shows error on invalid credentials', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [authProvider.overrideWithValue(MockAuthNotifier())],
      child: const MaterialApp(home: LoginPage()),
    ),
  );
  
  await tester.enterText(find.byKey(const Key('email')), 'bad@test.com');
  await tester.enterText(find.byKey(const Key('password')), 'wrong');
  await tester.tap(find.byKey(const Key('loginButton')));
  await tester.pumpAndSettle();
  
  expect(find.text('Invalid credentials'), findsOneWidget);
});
```
