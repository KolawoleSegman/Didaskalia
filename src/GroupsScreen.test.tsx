import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const store: { list: any[] } = { list: [] };
vi.mock("./lib/groups", () => ({
  loadGroups: () => store.list,
  createGroup: vi.fn(async (name: string, nickname: string) => { const g = { code: "ABC234", name, nickname }; store.list = [g]; return g; }),
  joinGroup: vi.fn(async () => { throw new Error("No group with that code"); }),
  leaveGroup: vi.fn(),
  leaderboard: vi.fn(async () => [{ nickname: "Bayo", points: 300, is_me: false }, { nickname: "Ada", points: 120, is_me: true }]),
}));
import Groups from "./components/Groups";

afterEach(() => { cleanup(); store.list = []; });

describe("Groups screen", () => {
  it("creates a group, shows its code and the ranked board", async () => {
    render(<Groups />);
    const create = screen.getByRole("button", { name: /^create$/i }) as HTMLButtonElement;
    expect(create.disabled).toBe(true); // needs a nickname and a name
    fireEvent.change(screen.getByLabelText("Your nickname"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("New group name"), { target: { value: "Grace Chapel" } });
    fireEvent.click(create);
    await screen.findByText("ABC234");
    await screen.findByText("Bayo");
    expect(screen.getByText(/Ada \(you\)/)).toBeTruthy();
  });

  it("shows the server's reason when joining fails", async () => {
    render(<Groups />);
    fireEvent.change(screen.getByLabelText("Your nickname"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Group code"), { target: { value: "ZZZZZZ" } });
    fireEvent.click(screen.getByRole("button", { name: /^join$/i }));
    await waitFor(() => expect(screen.getByText("No group with that code")).toBeTruthy());
  });
});
