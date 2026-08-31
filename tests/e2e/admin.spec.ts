import { expect, test } from "@playwright/test";

test("renders the administration foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Administration foundation" })).toBeVisible();
  await expect(page.getByText("admin.darb.co.il", { exact: true })).toBeVisible();
});
