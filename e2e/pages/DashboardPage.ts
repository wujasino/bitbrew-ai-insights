import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly avatarMenuButton: Locator;
  readonly signOutButton: Locator;

  constructor(private page: Page) {
    // AppNavbar's avatar-popover trigger has no aria-label — its accessible
    // name is the AvatarFallback initials, derived from the mocked user's
    // email/name in e2e/mocks/supabase.ts (TEST_USER.email -> "E").
    this.avatarMenuButton = page.getByRole('button', { name: 'E', exact: true });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openUserMenu() {
    await this.avatarMenuButton.click();
  }

  async signOut() {
    await this.openUserMenu();
    await this.signOutButton.click();
  }

  /**
   * Ctrl/Cmd+K is a browser-reserved shortcut (address-bar focus) that
   * Chromium can swallow before the page's own keydown listener ever sees
   * it — even headless. Dispatching the event directly in page context
   * tests what we actually care about (CommandPalette.tsx's own handler)
   * without depending on the browser delivering the OS-level combo.
   */
  async openCommandPalette() {
    await this.page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    });
  }
}
