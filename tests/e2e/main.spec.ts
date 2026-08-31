import { expect, test } from "@playwright/test";

test("renders the public application foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Platform foundation" })).toBeVisible();
  await expect(page.getByText("darb.co.il", { exact: true })).toBeVisible();
});
