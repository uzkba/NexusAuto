// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StarRatingInput } from "./StarRatingInput";

afterEach(() => {
    cleanup();
});

function ControlledStars({ initial = null }: { initial?: number | null }) {
    const [val, setVal] = useState<number | null>(initial);
    return <StarRatingInput value={val} onChange={setVal} />;
}

describe("StarRatingInput", () => {
    it("renderiza 5 opções de estrela acessíveis e atualiza ao clicar", () => {
        const onChange = vi.fn();
        render(<StarRatingInput value={null} onChange={onChange} />);

        expect(screen.getByRole("radiogroup")).toBeTruthy();
        const radios = screen.getAllByRole("radio");
        expect(radios).toHaveLength(5);
        expect(screen.getByText("Selecione uma nota")).toBeTruthy();

        for (const radio of radios) {
            expect(radio.getAttribute("aria-checked")).toBe("false");
            expect(radio.querySelector("svg")?.getAttribute("class")).toContain(
                "text-sand",
            );
        }

        fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it("mostra pré-visualização no hover e restaura valor ao sair do mouse", () => {
        render(<ControlledStars initial={2} />);
        expect(screen.getByText("2 - Ruim")).toBeTruthy();

        const radiogroup = screen.getByRole("radiogroup");
        const star5 = screen.getByRole("radio", { name: "5 estrelas" });

        fireEvent.mouseEnter(star5);
        expect(screen.getByText("5 - Excelente")).toBeTruthy();
        expect(star5.querySelector("svg")?.getAttribute("class")).toContain(
            "text-accent",
        );

        fireEvent.mouseLeave(radiogroup);
        expect(screen.getByText("2 - Ruim")).toBeTruthy();
        expect(star5.querySelector("svg")?.getAttribute("class")).toContain(
            "text-sand",
        );
    });

    it("suporta navegação por teclado (setas, Home e End)", () => {
        render(<ControlledStars initial={3} />);

        const star3 = screen.getByRole("radio", { name: "3 estrelas" });
        star3.focus();

        fireEvent.keyDown(star3, { key: "ArrowRight" });
        expect(screen.getByText("4 - Bom")).toBeTruthy();
        const star4 = screen.getByRole("radio", { name: "4 estrelas" });
        expect(star4.getAttribute("aria-checked")).toBe("true");
        expect(document.activeElement).toBe(star4);

        fireEvent.keyDown(star4, { key: "ArrowLeft" });
        expect(screen.getByText("3 - Regular")).toBeTruthy();
        expect(document.activeElement).toBe(star3);

        fireEvent.keyDown(star3, { key: "End" });
        expect(screen.getByText("5 - Excelente")).toBeTruthy();
        const star5 = screen.getByRole("radio", { name: "5 estrelas" });
        expect(document.activeElement).toBe(star5);

        fireEvent.keyDown(star5, { key: "Home" });
        expect(screen.getByText("1 - Muito ruim")).toBeTruthy();
        const star1 = screen.getByRole("radio", { name: "1 estrela" });
        expect(document.activeElement).toBe(star1);
    });
});
