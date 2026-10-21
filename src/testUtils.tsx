import { fireEvent, screen, within } from "@testing-library/react";

export const USER = { id: "u-test-1", email: "ada@example.com", name: "Ada Obi" };

/** Opens the three-line menu and goes to a screen by its menu label. */
export function nav(label: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  const menu = screen.getByRole("navigation", { name: "Main menu" });
  fireEvent.click(within(menu).getByRole("button", { name: label }));
}

/** From anywhere: open the Play page, choose a mode and press Begin. */
export function begin(mode: string) {
  nav(/^play$/i);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${mode}`, "i") }));
  fireEvent.click(screen.getByRole("button", { name: /begin/i }));
}
