// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { VoteResults } from "@/components/topics/VoteResults";

afterEach(() => {
  cleanup();
});

function blockOf(text: string) {
  return screen.getByText(text).closest("div");
}

describe("VoteResults", () => {
  it("5 a favor y 2 en contra con voto propio positivo", () => {
    render(<VoteResults positiveVotes={5} negativeVotes={2} myVote="UP" />);
    expect(screen.getByRole("heading", { name: "Resultados" })).toBeInTheDocument();
    expect(screen.getByText("71 %")).toBeInTheDocument();
    expect(screen.getByText("29 %")).toBeInTheDocument();
    expect(screen.getByText("5 votos · Tu voto")).toBeInTheDocument();
    expect(screen.getByText("2 votos")).toBeInTheDocument();
    expect(blockOf("5 votos · Tu voto")).toHaveClass("bg-green-700");
    expect(blockOf("2 votos")).toHaveClass("bg-red-50");
  });

  it("Primer voto, negativo: 100 % en contra, 0 % a favor", () => {
    render(<VoteResults positiveVotes={0} negativeVotes={1} myVote="DOWN" />);
    expect(screen.getByText("0 %")).toBeInTheDocument();
    expect(screen.getByText("100 %")).toBeInTheDocument();
    expect(screen.getByText("1 voto · Tu voto")).toBeInTheDocument();
    expect(screen.getByText("0 votos")).toBeInTheDocument();
    expect(blockOf("1 voto · Tu voto")).toHaveClass("bg-red-600");
  });

  it("Los porcentajes siempre suman 100", () => {
    render(<VoteResults positiveVotes={1} negativeVotes={2} myVote="UP" />);
    expect(screen.getByText("33 %")).toBeInTheDocument();
    expect(screen.getByText("67 %")).toBeInTheDocument();
  });
});
