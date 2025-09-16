import { test, expect } from '@playwright/test'

// Configuration pour les tests E2E d'authentification
test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page d'accueil
    await page.goto('/')
  })

  test.describe('Registration Flow', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Aller à la page d'inscription
      await page.click('[data-testid="register-link"]')
      await expect(page).toHaveURL('/register')
      
      // Vérifier que la page d'inscription est chargée
      await expect(page.locator('h1')).toContainText('Créer un compte')
      
      // Remplir le formulaire d'inscription
      const timestamp = Date.now()
      const testEmail = `test-${timestamp}@example.com`
      const testPseudo = `TestUser${timestamp}`
      
      await page.fill('[data-testid="email-input"]', testEmail)
      await page.fill('[data-testid="pseudo-input"]', testPseudo)
      await page.fill('[data-testid="password-input"]', 'StrongPass123')
      await page.fill('[data-testid="confirm-password-input"]', 'StrongPass123')
      
      // Soumettre le formulaire
      await page.click('[data-testid="register-button"]')
      
      // Vérifier la redirection vers le dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Vérifier que l'utilisateur est connecté
      await expect(page.locator('[data-testid="user-pseudo"]')).toContainText(testPseudo)
    })

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.click('[data-testid="register-link"]')
      
      // Essayer de soumettre avec des données invalides
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.fill('[data-testid="pseudo-input"]', 'ab') // Trop court
      await page.fill('[data-testid="password-input"]', 'weak') // Trop faible
      
      await page.click('[data-testid="register-button"]')
      
      // Vérifier les messages d'erreur
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="pseudo-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
    })

    test('should prevent registration with existing email', async ({ page }) => {
      await page.click('[data-testid="register-link"]')
      
      // Utiliser un email qui existe déjà (de notre seed)
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="pseudo-input"]', 'NewPlayer')
      await page.fill('[data-testid="password-input"]', 'StrongPass123')
      await page.fill('[data-testid="confirm-password-input"]', 'StrongPass123')
      
      await page.click('[data-testid="register-button"]')
      
      // Vérifier le message d'erreur
      await expect(page.locator('[data-testid="form-error"]')).toContainText('Un compte avec cet email existe déjà')
    })

    test('should require password confirmation match', async ({ page }) => {
      await page.click('[data-testid="register-link"]')
      
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="pseudo-input"]', 'TestUser')
      await page.fill('[data-testid="password-input"]', 'StrongPass123')
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass123')
      
      await page.click('[data-testid="register-button"]')
      
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Les mots de passe ne correspondent pas')
    })
  })

  test.describe('Login Flow', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Aller à la page de connexion
      await page.click('[data-testid="login-link"]')
      await expect(page).toHaveURL('/login')
      
      // Vérifier que la page de connexion est chargée
      await expect(page.locator('h1')).toContainText('Se connecter')
      
      // Utiliser les identifiants de test du seed
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      await page.click('[data-testid="login-button"]')
      
      // Vérifier la redirection et la connexion
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="user-pseudo"]')).toContainText('Player1')
    })

    test('should reject invalid credentials', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      
      await page.click('[data-testid="login-button"]')
      
      // Rester sur la page de connexion avec message d'erreur
      await expect(page).toHaveURL('/login')
      await expect(page.locator('[data-testid="form-error"]')).toContainText('Email ou mot de passe incorrect')
    })

    test('should reject non-existent user', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
      await page.fill('[data-testid="password-input"]', 'anypassword123')
      
      await page.click('[data-testid="login-button"]')
      
      await expect(page.locator('[data-testid="form-error"]')).toContainText('Email ou mot de passe incorrect')
    })

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      // Essayer de soumettre sans remplir les champs
      await page.click('[data-testid="login-button"]')
      
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
    })
  })

  test.describe('Admin Login Flow', () => {
    test('should login as admin and redirect to admin panel', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      // Utiliser les identifiants admin du seed
      await page.fill('[data-testid="email-input"]', 'admin@futsal.local')
      await page.fill('[data-testid="password-input"]', 'admin123!')
      
      await page.click('[data-testid="login-button"]')
      
      // Admin doit être redirigé vers le panel admin
      await expect(page).toHaveURL('/admin')
      await expect(page.locator('[data-testid="admin-header"]')).toContainText('Administration')
      await expect(page.locator('[data-testid="user-pseudo"]')).toContainText('Admin')
    })
  })

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Se connecter avant chaque test de déconnexion
      await page.click('[data-testid="login-link"]')
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      await expect(page).toHaveURL('/dashboard')
    })

    test('should logout successfully', async ({ page }) => {
      // Cliquer sur le bouton de déconnexion
      await page.click('[data-testid="logout-button"]')
      
      // Vérifier la redirection vers la page d'accueil
      await expect(page).toHaveURL('/')
      
      // Vérifier que les éléments de navigation non-connecté sont visibles
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="register-link"]')).toBeVisible()
      
      // Vérifier que les éléments connectés ne sont plus visibles
      await expect(page.locator('[data-testid="user-pseudo"]')).not.toBeVisible()
    })

    test('should redirect to login when accessing protected route after logout', async ({ page }) => {
      // Se déconnecter
      await page.click('[data-testid="logout-button"]')
      
      // Essayer d'accéder à une route protégée
      await page.goto('/dashboard')
      
      // Doit être redirigé vers la page de connexion
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Se connecter
      await page.click('[data-testid="login-link"]')
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="user-pseudo"]')).toContainText('Player1')
      
      // Recharger la page
      await page.reload()
      
      // Vérifier que la session est maintenue
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="user-pseudo"]')).toContainText('Player1')
    })

    test('should handle session expiry gracefully', async ({ page }) => {
      // Se connecter
      await page.click('[data-testid="login-link"]')
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      // Simuler l'expiration de session en supprimant les cookies
      await page.context().clearCookies()
      
      // Tenter d'accéder à une route protégée
      await page.goto('/dashboard')
      
      // Doit être redirigé vers la connexion
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Essayer d'accéder à des routes protégées sans être connecté
      const protectedRoutes = ['/dashboard', '/matches', '/profile']
      
      for (const route of protectedRoutes) {
        await page.goto(route)
        await expect(page).toHaveURL('/login')
      }
    })

    test('should redirect non-admin users away from admin routes', async ({ page }) => {
      // Se connecter en tant qu'utilisateur normal
      await page.click('[data-testid="login-link"]')
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      // Essayer d'accéder aux routes admin
      await page.goto('/admin')
      
      // Doit être redirigé (403 ou vers dashboard)
      await expect(page).not.toHaveURL('/admin')
      // Pourrait être redirigé vers le dashboard ou une page d'erreur
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/(dashboard|unauthorized)/)
    })

    test('should allow admin access to admin routes', async ({ page }) => {
      // Se connecter en tant qu'admin
      await page.click('[data-testid="login-link"]')
      await page.fill('[data-testid="email-input"]', 'admin@futsal.local')
      await page.fill('[data-testid="password-input"]', 'admin123!')
      await page.click('[data-testid="login-button"]')
      
      // Accéder aux routes admin
      await page.goto('/admin')
      await expect(page).toHaveURL('/admin')
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible()
    })
  })

  test.describe('User Experience', () => {
    test('should remember login form data on validation error', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      // Remplir avec des données partiellement correctes
      await page.fill('[data-testid="email-input"]', 'valid@email.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      
      await page.click('[data-testid="login-button"]')
      
      // Après l'erreur, l'email doit être conservé
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('valid@email.com')
      // Le mot de passe doit être vidé pour la sécurité
      await expect(page.locator('[data-testid="password-input"]')).toHaveValue('')
    })

    test('should show loading state during authentication', async ({ page }) => {
      await page.click('[data-testid="login-link"]')
      
      await page.fill('[data-testid="email-input"]', 'player1@test.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      // Cliquer et vérifier l'état de chargement
      await page.click('[data-testid="login-button"]')
      
      // Le bouton devrait montrer un état de chargement temporaire
      await expect(page.locator('[data-testid="login-button"]')).toContainText(/Connexion|Loading|.../)
    })

    test('should provide clear navigation between login and register', async ({ page }) => {
      // Depuis la page de connexion vers l'inscription
      await page.click('[data-testid="login-link"]')
      await expect(page).toHaveURL('/login')
      
      await page.click('[data-testid="go-to-register"]')
      await expect(page).toHaveURL('/register')
      
      // Depuis l'inscription vers la connexion
      await page.click('[data-testid="go-to-login"]')
      await expect(page).toHaveURL('/login')
    })
  })
})