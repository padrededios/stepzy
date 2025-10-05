/**
 * Complete User Journey E2E Tests
 * Tests the full user workflow from registration to match participation
 */

import { test, expect } from '@playwright/test'

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  pseudo: `TestUser${Date.now()}`,
  password: 'TestPassword123!'
}

const adminUser = {
  email: 'root@futsal.com',
  password: 'RootPass123!'
}

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
  })

  test('should complete full user registration and match participation flow', async ({ page, context }) => {
    // Step 1: User Registration
    await test.step('User registers for new account', async () => {
      await page.click('text=S\'inscrire')
      await expect(page).toHaveURL('/register')
      
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('input[name="pseudo"]', testUser.pseudo)
      await page.fill('input[name="password"]', testUser.password)
      
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Bienvenue')).toBeVisible()
    })

    // Step 2: Explore Dashboard
    await test.step('User explores dashboard', async () => {
      // Check if matches are displayed
      await expect(page.locator('[data-testid="match-card"]').first()).toBeVisible({ timeout: 10000 })
      
      // Check navigation elements
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Matchs')).toBeVisible()
      await expect(page.locator('text=Mon Profil')).toBeVisible()
    })

    // Step 3: View Match Details
    await test.step('User views match details', async () => {
      // Click on first available match
      await page.click('[data-testid="match-card"]:first-child')
      
      // Should navigate to match detail page
      await expect(page).toHaveURL(/\/matches\/[a-f0-9-]+/)
      
      // Check if match details are displayed
      await expect(page.locator('[data-testid="match-view"]')).toBeVisible()
      await expect(page.locator('text=Joueurs confirmés')).toBeVisible()
    })

    // Step 4: Join Match
    await test.step('User joins a match', async () => {
      const joinButton = page.locator('button:has-text("S\'inscrire")')
      
      if (await joinButton.isVisible()) {
        await joinButton.click()
        
        // Should show success message
        await expect(page.locator('text=Inscription réussie')).toBeVisible({ timeout: 5000 })
        
        // User avatar should appear in the match view
        await expect(page.locator(`[alt="${testUser.pseudo}"]`)).toBeVisible()
      } else {
        console.log('Match is full, user added to waiting list')
      }
    })

    // Step 5: Check Notifications
    await test.step('User checks notifications', async () => {
      // Click on notifications bell
      await page.click('[aria-label*="Notifications"]')
      
      // Notification dropdown should appear
      await expect(page.locator('text=Notifications')).toBeVisible()
      
      // Should have notification about match joining
      await expect(page.locator('text=match').first()).toBeVisible()
    })

    // Step 6: Visit Profile
    await test.step('User visits and updates profile', async () => {
      await page.click('text=Mon Profil')
      await expect(page).toHaveURL('/profile')
      
      // Check profile information
      await expect(page.locator(`text=${testUser.pseudo}`)).toBeVisible()
      await expect(page.locator(`text=${testUser.email}`)).toBeVisible()
      
      // Check statistics
      await expect(page.locator('text=Matchs joués')).toBeVisible()
      await expect(page.locator('text=Taux de participation')).toBeVisible()
      
      // Check badges section
      await expect(page.locator('text=Badges')).toBeVisible()
    })

    // Step 7: View Match History
    await test.step('User views match history', async () => {
      await page.click('text=Historique')
      
      // Should show user's matches
      await expect(page.locator('[data-testid="user-match-history"]')).toBeVisible()
      
      // Test filters
      await page.click('text=À venir')
      await page.click('text=Tous')
    })

    // Step 8: Leave Match
    await test.step('User leaves the match', async () => {
      // Go back to dashboard
      await page.click('text=Dashboard')
      
      // Find the match user joined and go to details
      await page.click('[data-testid="match-card"]:first-child')
      
      // Click on user's avatar to leave
      const userAvatar = page.locator(`[alt="${testUser.pseudo}"]`)
      if (await userAvatar.isVisible()) {
        await userAvatar.click()
        
        // Confirm leaving
        await page.click('text=Confirmer')
        
        // Should show leave success message
        await expect(page.locator('text=Désinscription réussie')).toBeVisible({ timeout: 5000 })
      }
    })

    // Step 9: Logout
    await test.step('User logs out', async () => {
      // Click user menu
      await page.click('[data-testid="user-menu"]')
      
      // Click logout
      await page.click('text=Déconnexion')
      
      // Should redirect to login page
      await expect(page).toHaveURL('/login')
    })
  })

  test('should handle admin workflow', async ({ page }) => {
    await test.step('Admin logs in', async () => {
      await page.goto('/login')
      
      await page.fill('input[name="email"]', adminUser.email)
      await page.fill('input[name="password"]', adminUser.password)
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL('/dashboard')
    })

    await test.step('Admin accesses administration panel', async () => {
      // Should see admin links in sidebar
      await expect(page.locator('text=Administration')).toBeVisible()
      
      // Access user management
      await page.click('text=Gestion utilisateurs')
      await expect(page).toHaveURL('/admin/users')
      
      // Check user list
      await expect(page.locator('[data-testid="admin-user-list"]')).toBeVisible()
      await expect(page.locator('text=Email')).toBeVisible()
      await expect(page.locator('text=Pseudo')).toBeVisible()
    })

    await test.step('Admin views statistics', async () => {
      await page.click('text=Statistiques')
      await expect(page).toHaveURL('/admin/statistics')
      
      // Check statistics dashboard
      await expect(page.locator('text=Utilisateurs totaux')).toBeVisible()
      await expect(page.locator('text=Matchs ce mois')).toBeVisible()
      
      // Check if charts are loaded
      await expect(page.locator('[data-testid="statistics-chart"]')).toBeVisible()
    })

    await test.step('Admin creates a match', async () => {
      await page.goto('/admin/matches/create')
      
      // Fill match creation form
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      await page.fill('input[type="date"]', dateString)
      await page.fill('input[type="time"]', '12:00')
      await page.fill('input[name="maxPlayers"]', '12')
      
      await page.click('button[type="submit"]')
      
      // Should show success message
      await expect(page.locator('text=Match créé avec succès')).toBeVisible({ timeout: 5000 })
    })

    await test.step('Admin sends announcement', async () => {
      await page.goto('/admin/announcements')
      
      await page.fill('input[name="title"]', 'Test Announcement')
      await page.fill('textarea[name="content"]', 'This is a test announcement for all users.')
      await page.selectOption('select[name="priority"]', 'medium')
      
      await page.click('button:has-text("Envoyer l\'annonce")')
      
      // Should show success message
      await expect(page.locator('text=Annonce envoyée')).toBeVisible({ timeout: 5000 })
    })
  })

  test('should handle error scenarios gracefully', async ({ page }) => {
    await test.step('Handle registration with existing email', async () => {
      await page.goto('/register')
      
      // Try to register with admin email
      await page.fill('input[name="email"]', adminUser.email)
      await page.fill('input[name="pseudo"]', 'NewUser')
      await page.fill('input[name="password"]', 'ValidPassword123!')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=Email déjà utilisé')).toBeVisible({ timeout: 5000 })
    })

    await test.step('Handle invalid login', async () => {
      await page.goto('/login')
      
      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('text=Email ou mot de passe incorrect')).toBeVisible({ timeout: 5000 })
    })

    await test.step('Handle network errors', async () => {
      // Simulate network failure
      await page.route('**/api/matches', route => {
        route.abort()
      })
      
      await page.goto('/dashboard')
      
      // Should show error message for failed matches load
      await expect(page.locator('text=Erreur lors du chargement')).toBeVisible({ timeout: 10000 })
    })
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await test.step('Mobile navigation works', async () => {
      await page.goto('/dashboard')
      
      // Mobile menu should be visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Click mobile menu
      await page.click('[data-testid="mobile-menu-button"]')
      
      // Mobile navigation should appear
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
    })

    await test.step('Mobile match cards are readable', async () => {
      // Match cards should be stacked vertically on mobile
      const matchCard = page.locator('[data-testid="match-card"]').first()
      await expect(matchCard).toBeVisible()
      
      // Text should be readable
      await expect(matchCard.locator('text=12:00')).toBeVisible()
    })
  })
})

test.describe('Performance Tests', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    // Test page load times
    const pages = [
      { url: '/', name: 'Home' },
      { url: '/login', name: 'Login' },
      { url: '/register', name: 'Register' }
    ]

    for (const { url, name } of pages) {
      await test.step(`${name} page loads quickly`, async () => {
        const startTime = Date.now()
        
        await page.goto(url)
        await page.waitForLoadState('networkidle')
        
        const loadTime = Date.now() - startTime
        console.log(`${name} page loaded in ${loadTime}ms`)
        
        // Should load within 3 seconds
        expect(loadTime).toBeLessThan(3000)
      })
    }
  })

  test('should handle multiple concurrent users', async ({ context }) => {
    // Simulate multiple users
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])

    await test.step('Multiple users can access dashboard simultaneously', async () => {
      const loadPromises = pages.map(page => page.goto('/dashboard'))
      
      await Promise.all(loadPromises)
      
      // All pages should load successfully
      for (const page of pages) {
        await expect(page).toHaveURL('/dashboard')
      }
    })

    // Clean up
    await Promise.all(pages.map(page => page.close()))
  })
})