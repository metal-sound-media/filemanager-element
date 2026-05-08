import { test, expect } from "@playwright/test";
import { dropFile } from "./utils";
import { mockApi } from "./mockApi";

const hashes = {
  "with API calls": "",
  "with functions": "#function",
} as Record<string, string>;
Object.keys(hashes).forEach((key: keyof typeof hashes) => {
  test.describe(`FileManager ${key}`, () => {
    test.beforeEach(async ({ page }) => {
      await mockApi(page);
      return page.goto(`http://localhost:3000/index.html${hashes[key]}`);
    });

    test.describe("Sidebar behaviour", () => {
      test("Show the root folder", async ({ page }) => {
        await expect(page.locator(".fm-folder-name").first()).toHaveText("/");
      });

      test("Show the list of folders", async ({ page }) => {
        await expect(page.locator("text=Folder 0").first()).toBeVisible();
        await expect(page.locator("text=Folder 4").first()).toBeVisible();
        await expect(page.locator("text=Child 2").first()).not.toBeVisible();
      });

      test("Unfold a folder on click", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator("text=Child 2").first()).toBeVisible();
      });

      test("Fold back the folder on click", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator("text=Child 2").first()).toBeVisible();
        await page.locator("text=Folder 2").first().click({ force: true });
        await expect(page.locator("text=Child 2").first()).not.toBeVisible();
      });

      test("Create a new folder on click", async ({ page }) => {
        await page.locator(".fm-new-folder").nth(3).click();
        await page
          .locator(".fm-folder-form input")
          .waitFor({ state: "visible" });
        await page.keyboard.type("hello");
        await page.keyboard.press("Enter");
        await page.locator("text=Folder 2").first().click({ force: true });
        await expect(page.locator(".fm-folder-form")).not.toBeVisible();
        await expect(page.locator("text=hello").first()).toBeVisible();
      });

      test("Delete a folder", async ({ page }) => {
        await page.locator("text=Empty").first().click();
        await page.locator("text=Delete this folder").first().click();
        await expect(page.locator("text=Empty").first()).toBeHidden();
      });

      test("Tree stays expanded after creating a subfolder", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator("text=Child 0").first()).toBeVisible();
        await page.locator(".fm-new-folder").nth(3).click();
        await page.locator(".fm-folder-form input").waitFor({ state: "visible" });
        await page.keyboard.type("new_subfolder");
        await page.keyboard.press("Enter");
        await expect(page.locator("text=Child 0").first()).toBeVisible();
        await expect(page.locator("text=new_subfolder").first()).toBeVisible();
      });
    });

    test.describe("Breadcrumb behaviour", () => {
      test("Shows home icon (not slash text) at root", async ({ page }) => {
        const root = page.locator(".fm-breadcrumb-item").first();
        // Root shows SVG icon, not "/" text
        await expect(root).not.toHaveText("/");
        await expect(root.locator("svg")).toBeVisible();
        await expect(root).toHaveAttribute("aria-label", "Home");
      });

      test("No double-slash when navigating to a subfolder", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        const seps = page.locator(".fm-breadcrumb-sep");
        // Should have exactly one separator between root and Folder 2
        await expect(seps).toHaveCount(1);
      });

      test("Shows folder name after navigation", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Folder 2");
      });

      test("Shows full path for nested folder", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator("text=Child 0").first().click();
        const items = page.locator(".fm-breadcrumb-item");
        // First item = home icon (root)
        await expect(items.nth(0)).toHaveAttribute("aria-label", "Home");
        await expect(items.nth(1)).toHaveText("Folder 2");
        await expect(items.nth(2)).toHaveText("Child 0");
      });

      test("Navigate to parent via breadcrumb click", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator("text=Child 0").first().click();
        await expect(page.locator("text=2_0.jpg")).not.toBeVisible();
        await page.locator(".fm-breadcrumb-item").nth(1).click();
        await expect(page.locator("text=2_0.jpg")).toBeVisible();
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Folder 2");
      });

      test("Navigate to root via breadcrumb home click", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator(".fm-breadcrumb-item").first().click();
        // After navigating to root, current item = home icon
        await expect(page.locator(".fm-breadcrumb-current svg")).toBeVisible();
      });

      test("Clicking breadcrumb opens path input", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator(".fm-breadcrumb-current").click();
        await expect(page.locator(".fm-breadcrumb-input")).toBeVisible();
        // Input shows current path
        await expect(page.locator(".fm-breadcrumb-input")).toHaveValue("Folder 2");
      });

      test("Navigate via path input to a subfolder", async ({ page }) => {
        await page.locator(".fm-breadcrumb").click();
        await page.locator(".fm-breadcrumb-input").waitFor({ state: "visible" });
        await page.locator(".fm-breadcrumb-input").fill("Folder 2");
        await page.keyboard.press("Enter");
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Folder 2");
      });

      test("Navigate via path input using validate button", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator(".fm-breadcrumb-current").click();
        await page.locator(".fm-breadcrumb-input").fill("");
        await page.locator(".fm-breadcrumb-input").fill("Folder 0");
        await page.locator(".fm-breadcrumb-form .fm-icon-button").click();
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Folder 0");
      });

      test("Cancel path input with Escape", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator(".fm-breadcrumb-current").click();
        await expect(page.locator(".fm-breadcrumb-input")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator(".fm-breadcrumb-input")).not.toBeVisible();
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Folder 2");
      });

      test("Path input resets to root with empty input", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await page.locator(".fm-breadcrumb-current").click();
        await page.locator(".fm-breadcrumb-input").fill("");
        await page.keyboard.press("Enter");
        // At root: current breadcrumb item = home icon
        await expect(page.locator(".fm-breadcrumb-current svg")).toBeVisible();
      });

      test("Breadcrumb resets to root after folder deletion", async ({ page }) => {
        await page.locator("text=Empty").first().click();
        await expect(page.locator(".fm-breadcrumb-current")).toHaveText("Empty");
        await page.locator("text=Delete this folder").first().click();
        // After deletion, navigates to root → home icon
        await expect(page.locator(".fm-breadcrumb-current svg")).toBeVisible();
      });
    });

    test.describe("Files behaviour", () => {
      test("Load the file list when clicking on a specific folder", async ({
        page,
      }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator("text=2_0.jpg").first()).toBeVisible();
      });
      test("Deleted file should be removed from the list", async ({ page }) => {
        page.on("dialog", (dialog) => dialog.accept());
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator("text=2_0.jpg").first()).toBeVisible();
        await page
          .locator('.fm-file:has-text("2_0.jpg")')
          .locator(".fm-delete")
          .click();
        await expect(page.locator("text=2_0.jpg").first()).not.toBeVisible();
      });

      test("Drop file will upload it", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await dropFile(page, ".fm-dropzone");
        await expect(page.locator("text=new_file.png").first()).toBeVisible();
      });

      test("Clicking a file dispatches selectfile event on the host element", async ({ page }) => {
        await page.locator("text=Folder 2").first().click();
        await expect(page.locator(".fm-file").first()).toBeVisible();

        const selectfilePromise = page.evaluate(() =>
          new Promise<Record<string, unknown>>(resolve => {
            const el = document.querySelector<HTMLElement>(
              'file-manager:not([hidden]), fn-file-manager:not([hidden])'
            )!;
            el.addEventListener('selectfile', (e: Event) => resolve((e as CustomEvent).detail), { once: true });
          })
        );

        await page.locator(".fm-file").first().click();
        const detail = await selectfilePromise;
        expect(detail).toHaveProperty("url");
        expect(detail).toHaveProperty("name");
      });
    });
  });
});

test.describe(`FileManager readonly`, () => {
  test.beforeEach(async ({ page }) => {
    return page.goto(`http://localhost:3000/index.html#readonly`);
  });

  test.describe("Sidebar behaviour", () => {
    test("Hide the create folder button", async ({ page }) => {
      await expect(page.locator(".fm-new-folder")).toBeHidden();
    });

    test("Delete a folder", async ({ page }) => {
      await page.locator("text=Empty").first().click();
      await expect(
        page.locator("text=Delete this folder").first()
      ).toBeHidden();
    });
  });

  test.describe("Files behaviour", () => {
    test("Deleted file should be removed from the list", async ({ page }) => {
      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("text=Folder 2").first().click();
      await expect(page.locator("text=2_0.jpg").first()).toBeVisible();
      await expect(
        page.locator('.fm-file:has-text("2_0.jpg")').locator(".fm-delete")
      ).toBeHidden();
    });

    test("Drop file will upload it", async ({ page }) => {
      await page.locator("text=Folder 2").first().click();
      await expect(page.locator(".fm-dropzone").first()).toBeHidden();
    });
  });
});
