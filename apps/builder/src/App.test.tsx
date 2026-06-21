import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the workflow builder entry point", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Workflow Builder" }),
    ).toBeInTheDocument();
  });
});
